# Realtime Client Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the frontend communication Socket.IO client so reconnects, room restoration, token rotation, and realtime-driven REST refreshes cannot unnecessarily amplify backend load.

**Architecture:** Keep `CommunicationRealtimeProvider` as the sole socket owner for each authenticated browser tab. Add small policy, token-notification, and diagnostics boundaries around the provider; make room recovery single-path; replace token polling with events; and make overview refreshes resource-targeted and coalesced.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Socket.IO Client 4.8.3, Vitest 2, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-realtime-client-hardening-design.md`

## Global Constraints

- Frontend repository only; do not modify the backend repository.
- Start from `origin/main` SHA `05fbd09be4b2b3329545a538005c7f1a3f3453ba` on `codex/fix-realtime-client-hardening`.
- Preserve one Socket.IO client per authenticated browser tab; do not add cross-tab leader election.
- Preserve namespace `/api/v1/realtime`, `auth.token`, existing event names, WebSocket-first transport order, and polling fallback.
- Do not change deployment files, environment values, secrets, or production infrastructure.
- Do not redesign the UI; keep `isConnected` as a compatibility projection for existing consumers.
- Use `test-guard` after every test-code change and `clean-code-guard` after every production-code change, before committing that task.
- Run focused tests during implementation. Ask the owner before running `npm run test:run` or any broader full-suite command.
- Use normal commits only. Do not rebase, force-push, merge `main`, or deploy.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/token-storage.ts` | Store tokens and expose one access-token change subscription covering same-tab and cross-tab writes. |
| `src/lib/__tests__/token-storage.test.ts` | Prove access-token notifications and cleanup. |
| `src/features/communication/realtime/communication-connection-policy.ts` | Hold retry constants, connection state type, error classification, and server retry-delay parsing. |
| `src/features/communication/__tests__/realtime/communication-connection-policy.test.ts` | Unit-test policy and classification without React or Socket.IO. |
| `src/features/communication/realtime/communication-socket.ts` | Apply the bounded Socket.IO manager options while preserving the wire contract. |
| `src/features/communication/__tests__/realtime/communication-socket.test.ts` | Assert the exact Socket.IO construction options. |
| `src/features/communication/realtime/communication-realtime-diagnostics.ts` | Provide debug-gated structured logging and duplicate-owner/join warnings without sensitive identifiers. |
| `src/features/communication/realtime/CommunicationRealtimeProvider.tsx` | Own lifecycle, state transitions, room restoration, token reaction, offline handling, and cooldown restart. |
| `src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx` | Prove provider lifecycle behavior with controllable socket and manager events. |
| `src/features/communication/hooks/useCommunicationOverview.ts` | Load all overview resources explicitly and schedule targeted realtime refreshes. |
| `src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx` | Prove resource mapping, coalescing, merge behavior, reconnect refresh, and cleanup. |
| `src/features/communication/utils/notificationPresentation.ts` | Coalesce identical in-flight message and conversation context requests. |
| `src/features/communication/__tests__/utils/notificationPresentation.test.ts` | Prove request sharing, settlement cleanup, and fallback behavior. |

---

### Task 1: Event-driven access-token notifications

**Files:**

- Modify: `src/lib/token-storage.ts`
- Create: `src/lib/__tests__/token-storage.test.ts`

**Interfaces:**

- Produces: `subscribeToAccessTokenChanges(listener: () => void): () => void`
- Preserves: the existing `tokenStorage` object and all existing method signatures.
- Depends on: browser `storage` events for other-tab updates and a private custom event for current-tab updates.

- [ ] **Step 1: Write failing token notification tests**

Create `src/lib/__tests__/token-storage.test.ts` with tests that install the subscription, call each mutation, dispatch a native storage event, and verify cleanup:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  subscribeToAccessTokenChanges,
  tokenStorage,
} from "@/lib/token-storage";

describe("tokenStorage access-token changes", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("notifies same-tab subscribers after access-token writes and removal", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);

    tokenStorage.setAccessToken("token-1");
    tokenStorage.removeAccessToken();
    tokenStorage.setAccessToken("token-2");
    tokenStorage.clearTokens();

    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });

  it("notifies for cross-tab access-token storage events only", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    window.dispatchEvent(new StorageEvent("storage", { key: ACCESS_TOKEN_KEY }));

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("removes both browser listeners when unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);
    unsubscribe();

    tokenStorage.setAccessToken("token-1");
    window.dispatchEvent(new StorageEvent("storage", { key: ACCESS_TOKEN_KEY }));

    expect(listener).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and confirm the interface is missing**

Run:

```powershell
& { npm run test:run -- src/lib/__tests__/token-storage.test.ts }
```

Expected: FAIL because `subscribeToAccessTokenChanges` is not exported.

- [ ] **Step 3: Add a same-tab event and unified subscription**

Add a private event name and dispatcher, invoke it from access-token mutations, and export the subscription:

```ts
const ACCESS_TOKEN_CHANGED_EVENT = "moazez:access-token-changed";

function notifyAccessTokenChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGED_EVENT));
}

export function subscribeToAccessTokenChanges(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === null) listener();
  };

  window.addEventListener(ACCESS_TOKEN_CHANGED_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(ACCESS_TOKEN_CHANGED_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
```

Call `notifyAccessTokenChanged()` once at the end of `setAccessToken`, `removeAccessToken`, and `clearTokens`. Do not include the token in the event payload.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
& { npm run test:run -- src/lib/__tests__/token-storage.test.ts }
```

Expected: PASS with three tests.

- [ ] **Step 5: Run the required guards**

Invoke `test-guard` on `src/lib/__tests__/token-storage.test.ts`, then invoke `clean-code-guard` on `src/lib/token-storage.ts`. Apply all must-fix findings and rerun the focused test.

- [ ] **Step 6: Commit the token boundary**

```powershell
& {
  git add -- src/lib/token-storage.ts src/lib/__tests__/token-storage.test.ts
  git commit -m "fix(auth): publish access token changes"
}
```

---

### Task 2: Bounded connection policy and Socket.IO options

**Files:**

- Create: `src/features/communication/realtime/communication-connection-policy.ts`
- Create: `src/features/communication/__tests__/realtime/communication-connection-policy.test.ts`
- Modify: `src/features/communication/realtime/communication-socket.ts`
- Create: `src/features/communication/__tests__/realtime/communication-socket.test.ts`

**Interfaces:**

- Produces: `CommunicationConnectionState`.
- Produces: `classifyConnectionFailure(error: unknown): "auth" | "rate-limit" | "temporary"`.
- Produces: `retryDelayFromError(error: unknown): number | undefined`.
- Produces constants `RECONNECTION_ATTEMPTS`, `RECONNECTION_DELAY_MS`, `RECONNECTION_DELAY_MAX_MS`, `RECONNECTION_RANDOMIZATION_FACTOR`, and `RECONNECTION_COOLDOWN_MS`.
- Consumed by: Task 3 provider lifecycle.

- [ ] **Step 1: Write failing policy tests**

Create classification tests using only server fields the policy explicitly supports:

```ts
import { describe, expect, it } from "vitest";
import {
  classifyConnectionFailure,
  retryDelayFromError,
} from "@/features/communication/realtime/communication-connection-policy";

describe("communication connection policy", () => {
  it.each([401, 403])("classifies status %s as auth", (status) => {
    expect(classifyConnectionFailure({ data: { status } })).toBe("auth");
  });

  it("classifies a server authentication code as auth", () => {
    expect(
      classifyConnectionFailure({ data: { code: "AUTHENTICATION_ERROR" } }),
    ).toBe("auth");
  });

  it("classifies status 429 as rate-limit", () => {
    expect(classifyConnectionFailure({ data: { status: 429 } })).toBe(
      "rate-limit",
    );
  });

  it("treats unknown and 5xx failures as temporary", () => {
    expect(classifyConnectionFailure(new Error("transport close"))).toBe(
      "temporary",
    );
    expect(classifyConnectionFailure({ data: { status: 503 } })).toBe(
      "temporary",
    );
  });

  it("parses bounded retry delay fields", () => {
    expect(retryDelayFromError({ data: { retryAfterMs: 12_000 } })).toBe(12_000);
    expect(retryDelayFromError({ data: { retryAfter: 15 } })).toBe(15_000);
    expect(retryDelayFromError({ data: { retryAfter: -1 } })).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the policy test and confirm it fails**

```powershell
& { npm run test:run -- src/features/communication/__tests__/realtime/communication-connection-policy.test.ts }
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the pure policy module**

Create a module with no browser or Socket.IO dependency:

```ts
export type CommunicationConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "auth-error"
  | "degraded";

export type CommunicationConnectionFailure =
  | "auth"
  | "rate-limit"
  | "temporary";

export const RECONNECTION_ATTEMPTS = 8;
export const RECONNECTION_DELAY_MS = 1_000;
export const RECONNECTION_DELAY_MAX_MS = 30_000;
export const RECONNECTION_RANDOMIZATION_FACTOR = 0.5;
export const RECONNECTION_COOLDOWN_MS = 60_000;

type ErrorFields = {
  code?: unknown;
  retryAfter?: unknown;
  retryAfterMs?: unknown;
  status?: unknown;
};

function fieldsFromError(error: unknown): ErrorFields {
  if (!error || typeof error !== "object") return {};
  const outer = error as ErrorFields & { data?: unknown };
  const data =
    outer.data && typeof outer.data === "object"
      ? (outer.data as ErrorFields)
      : {};
  return {
    code: data.code ?? outer.code,
    retryAfter: data.retryAfter ?? outer.retryAfter,
    retryAfterMs: data.retryAfterMs ?? outer.retryAfterMs,
    status: data.status ?? outer.status,
  };
}

export function classifyConnectionFailure(
  error: unknown,
): CommunicationConnectionFailure {
  const { code, status } = fieldsFromError(error);
  if (
    status === 401 ||
    status === 403 ||
    code === "AUTHENTICATION_ERROR" ||
    code === "UNAUTHORIZED" ||
    code === "FORBIDDEN"
  ) {
    return "auth";
  }
  return status === 429 || code === "RATE_LIMITED"
    ? "rate-limit"
    : "temporary";
}

export function retryDelayFromError(error: unknown): number | undefined {
  const { retryAfter, retryAfterMs } = fieldsFromError(error);
  if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
    return retryAfterMs;
  }
  if (typeof retryAfter === "number" && retryAfter > 0) {
    return retryAfter * 1_000;
  }
  return undefined;
}
```

- [ ] **Step 4: Write a failing socket construction test**

Mock `socket.io-client` and assert the existing wire settings plus the new manager policy:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const ioMock = vi.hoisted(() => vi.fn(() => ({ id: "socket" })));
vi.mock("socket.io-client", () => ({ io: ioMock }));

describe("createCommunicationSocket", () => {
  beforeEach(() => {
    vi.resetModules();
    ioMock.mockClear();
  });

  it("creates a bounded websocket-first client", async () => {
    const { createCommunicationSocket } = await import(
      "@/features/communication/realtime/communication-socket"
    );

    createCommunicationSocket("token-1");

    expect(ioMock).toHaveBeenCalledWith(
      "https://api.moazez.sa/api/v1/realtime",
      expect.objectContaining({
        auth: { token: "token-1" },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 30_000,
        randomizationFactor: 0.5,
        transports: ["websocket", "polling"],
        withCredentials: true,
      }),
    );
  });
});
```

- [ ] **Step 5: Run the socket test and confirm the missing options**

```powershell
& { npm run test:run -- src/features/communication/__tests__/realtime/communication-socket.test.ts }
```

Expected: FAIL because the four bounded reconnection options are absent.

- [ ] **Step 6: Apply policy constants to socket creation**

Import the constants into `communication-socket.ts` and add:

```ts
reconnectionAttempts: RECONNECTION_ATTEMPTS,
reconnectionDelay: RECONNECTION_DELAY_MS,
reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
randomizationFactor: RECONNECTION_RANDOMIZATION_FACTOR,
```

Do not change the URL, optional Engine.IO path, auth payload, credentials, or transport array.

- [ ] **Step 7: Run both focused tests**

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/realtime/communication-connection-policy.test.ts src/features/communication/__tests__/realtime/communication-socket.test.ts
}
```

Expected: PASS.

- [ ] **Step 8: Run the required guards**

Invoke `test-guard` on both new test files, then invoke `clean-code-guard` on the policy and socket production files. Apply all must-fix findings and rerun both tests.

- [ ] **Step 9: Commit the policy**

```powershell
& {
  git add -- src/features/communication/realtime/communication-connection-policy.ts src/features/communication/realtime/communication-socket.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts src/features/communication/__tests__/realtime/communication-socket.test.ts
  git commit -m "fix(realtime): bound socket reconnection policy"
}
```

---

### Task 3: Single-path room recovery and provider state machine

**Files:**

- Create: `src/features/communication/realtime/communication-realtime-diagnostics.ts`
- Modify: `src/features/communication/realtime/CommunicationRealtimeProvider.tsx`
- Modify: `src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx`

**Interfaces:**

- Consumes: Task 1 `subscribeToAccessTokenChanges`.
- Consumes: Task 2 state type, classifiers, retry parser, and 60-second cooldown constant.
- Produces: context field `connectionState: CommunicationConnectionState` while retaining `isConnected`.
- Preserves: `retryConnection`, `joinConversation`, `leaveConversation`, `startTyping`, `stopTyping`, and `resyncVersion` signatures.

- [ ] **Step 1: Upgrade the provider test harness**

Replace the one-listener map with socket and manager listener sets so tests can simulate exact lifecycle events. The harness must expose these operations:

```ts
type Handler = (...args: unknown[]) => void;

function createListenerRegistry() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    add(event: string, handler: Handler) {
      const handlers = listeners.get(event) ?? new Set<Handler>();
      handlers.add(handler);
      listeners.set(event, handlers);
    },
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((handler) => handler(...args));
    },
    remove(event: string, handler: Handler) {
      listeners.get(event)?.delete(handler);
    },
    clear() {
      listeners.clear();
    },
    count(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}
```

Instantiate `socketListeners` and `managerListeners` with this factory. Give the manager mocks `on`, `off`, `removeAllListeners`, and `reconnection`; give the socket mocks `on`, `off`, `connect`, `disconnect`, `removeAllListeners`, and `emit`. Replace the existing anonymous socket factory mock with a named spy so the repeated-render test can assert ownership:

```ts
const createCommunicationSocketMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/communication/realtime/communication-socket", () => ({
  COMMUNICATION_REALTIME_DEBUG: false,
  COMMUNICATION_REALTIME_SOCKET_PATH: undefined,
  COMMUNICATION_REALTIME_URL: "https://api.example.test/api/v1/realtime",
  createCommunicationSocket: createCommunicationSocketMock,
  getCommunicationAccessToken: () => tokenHarness.value,
  getCommunicationRealtimeNamespace: () => "/api/v1/realtime",
}));
```

Assign `createCommunicationSocketMock.mockReturnValue(socketHarness.socket)` in `beforeEach`. Mock `subscribeToAccessTokenChanges` by retaining the supplied callback and returning a cleanup spy.

Define the token subscription harness and provider probes in the same test file:

```tsx
const tokenSubscriptionHarness = vi.hoisted(() => ({
  cleanup: vi.fn(),
  listener: null as (() => void) | null,
  notify() {
    this.listener?.();
  },
}));

vi.mock("@/lib/token-storage", () => ({
  subscribeToAccessTokenChanges: (listener: () => void) => {
    tokenSubscriptionHarness.listener = listener;
    return tokenSubscriptionHarness.cleanup;
  },
}));

function RealtimeProbe({ conversationId }: { conversationId?: string }) {
  const {
    connectionState,
    joinConversation,
    leaveConversation,
  } = useCommunicationSocket();
  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);
  return <span data-testid="state">{connectionState}</span>;
}

function renderProvider(conversationId?: string) {
  return render(
    <CommunicationRealtimeProvider>
      <RealtimeProbe conversationId={conversationId} />
    </CommunicationRealtimeProvider>,
  );
}

function renderProviderWithRoom(conversationId: string) {
  return renderProvider(conversationId);
}
```

Import `useEffect` from React. In `beforeEach`, reset the registries, token callback, cleanup spy, online state shim, socket state, and fake timers so no test inherits a prior connection generation.

- [ ] **Step 2: Write failing provider behavior tests**

Add focused tests with explicit assertions:

```ts
it("restores each active room once after reconnect", () => {
  renderProviderWithRoom("conversation-1");
  act(() => socketListeners.emit("connect"));
  socketHarness.socket.emit.mockClear();

  act(() => socketListeners.emit("disconnect", "transport close"));
  act(() => managerListeners.emit("reconnect", 1));
  act(() => socketListeners.emit("connect"));

  expect(socketHarness.socket.emit).toHaveBeenCalledTimes(1);
  expect(socketHarness.socket.emit).toHaveBeenCalledWith(
    "communication.chat.conversation.join",
    { conversationId: "conversation-1" },
  );
});

it("does not reconnect when the token notification keeps the same value", () => {
  renderProvider();
  socketHarness.socket.connect.mockClear();
  act(() => tokenSubscriptionHarness.notify());
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();
});

it("reconnects once when the access token changes", () => {
  renderProvider();
  socketHarness.socket.connect.mockClear();
  tokenHarness.value = "token-2";
  act(() => tokenSubscriptionHarness.notify());
  expect(socketHarness.socket.auth).toEqual({ token: "token-2" });
  expect(socketHarness.socket.disconnect).toHaveBeenCalledOnce();
  expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
});

it("pauses while offline and resumes on the online event", () => {
  renderProvider();
  act(() => window.dispatchEvent(new Event("offline")));
  expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(false);
  socketHarness.socket.connect.mockClear();

  act(() => window.dispatchEvent(new Event("online")));
  expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(true);
  expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
});

it("waits for a changed token after an authentication failure", () => {
  renderProvider();
  act(() =>
    socketListeners.emit("connect_error", { data: { status: 401 } }),
  );
  expect(screen.getByTestId("state")).toHaveTextContent("auth-error");
  expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(false);

  socketHarness.socket.connect.mockClear();
  act(() => window.dispatchEvent(new Event("online")));
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();

  tokenHarness.value = "token-2";
  act(() => tokenSubscriptionHarness.notify());
  expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
});

it("starts a new retry cycle after the reconnect cooldown", () => {
  renderProvider();
  socketHarness.socket.connect.mockClear();
  act(() => managerListeners.emit("reconnect_failed"));
  expect(screen.getByTestId("state")).toHaveTextContent("degraded");

  act(() => vi.advanceTimersByTime(59_999));
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
});

it("honors a positive server retry delay for rate limiting", () => {
  renderProvider();
  socketHarness.socket.connect.mockClear();
  act(() =>
    socketListeners.emit("connect_error", {
      data: { retryAfter: 12, status: 429 },
    }),
  );

  act(() => vi.advanceTimersByTime(11_999));
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
});

it("cancels a pending cooldown after a successful connection", () => {
  renderProvider();
  act(() => managerListeners.emit("reconnect_failed"));
  act(() => socketListeners.emit("connect"));
  socketHarness.socket.connect.mockClear();

  act(() => vi.advanceTimersByTime(60_000));
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  expect(screen.getByTestId("state")).toHaveTextContent("connected");
});

it("keeps one physical socket through repeated renders", () => {
  const view = renderProvider();
  for (let index = 0; index < 100; index += 1) {
    view.rerender(
      <CommunicationRealtimeProvider>
        <RealtimeProbe />
      </CommunicationRealtimeProvider>,
    );
  }
  expect(createCommunicationSocketMock).toHaveBeenCalledOnce();
});

it("removes listeners and cooldown work on unmount", () => {
  const view = renderProvider();
  act(() => managerListeners.emit("reconnect_failed"));
  view.unmount();

  expect(socketListeners.count("connect")).toBe(0);
  expect(socketListeners.count("connect_error")).toBe(0);
  expect(managerListeners.count("reconnect_attempt")).toBe(0);
  expect(managerListeners.count("reconnect_failed")).toBe(0);
  expect(tokenSubscriptionHarness.cleanup).toHaveBeenCalledOnce();
  socketHarness.socket.connect.mockClear();
  act(() => vi.advanceTimersByTime(60_000));
  expect(socketHarness.socket.connect).not.toHaveBeenCalled();
});

it("does not accumulate listeners across mount cycles", () => {
  for (let index = 0; index < 100; index += 1) {
    const view = renderProvider();
    view.unmount();
    expect(socketListeners.count("connect")).toBe(0);
    expect(managerListeners.count("reconnect_attempt")).toBe(0);
  }
});
```

Spy on `window.addEventListener` and `window.removeEventListener` in the cleanup test and assert the same registered `online` and `offline` callbacks are removed. Replace the old five-second token polling test with:

```ts
it("does not poll token storage", () => {
  const intervalSpy = vi.spyOn(window, "setInterval");
  renderProvider();
  expect(intervalSpy).not.toHaveBeenCalledWith(expect.any(Function), 5_000);
});
```

- [ ] **Step 3: Run the provider test and confirm failures**

```powershell
& { npm run test:run -- src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx }
```

Expected: FAIL on missing `connectionState`, duplicate room join behavior, token subscription, offline handling, and cooldown handling.

- [ ] **Step 4: Add debug-gated diagnostics**

Create `communication-realtime-diagnostics.ts` with a minimal API that cannot log tokens, user IDs, conversation IDs, or message bodies:

```ts
import { COMMUNICATION_REALTIME_DEBUG } from "./communication-socket";

let liveSocketOwners = 0;

export function logRealtimeEvent(
  event: string,
  details: Record<string, string | number | boolean | undefined> = {},
) {
  if (!COMMUNICATION_REALTIME_DEBUG) return;
  console.info("[communication socket]", { event, ...details });
}

export function registerSocketOwner() {
  if (!COMMUNICATION_REALTIME_DEBUG) return () => undefined;
  liveSocketOwners += 1;
  if (liveSocketOwners > 1) {
    console.warn("[communication socket] multiple live provider sockets", {
      liveSocketOwners,
    });
  }
  let registered = true;
  return () => {
    if (!registered) return;
    registered = false;
    liveSocketOwners = Math.max(0, liveSocketOwners - 1);
  };
}

export function warnDuplicateRoomJoin(currentRoomCount: number) {
  if (!COMMUNICATION_REALTIME_DEBUG) return;
  console.warn("[communication socket] duplicate room join suppressed", {
    currentRoomCount,
  });
}
```

Keep current server-side room membership inside the provider as a `Set<string>`; diagnostics may log only the event name and current membership count, never the set values. Clear this set on disconnect and before restoring a new connection, add an ID when a join is emitted, and delete it when a leave is emitted. This makes duplicate restoration idempotent while still allowing a legitimate leave followed by a later join during the same connection.

- [ ] **Step 5: Implement the provider lifecycle**

Add `connectionState` to the context and derive compatibility state:

```ts
const [connectionState, setConnectionState] =
  useState<CommunicationConnectionState>("idle");
const isConnected = connectionState === "connected";
```

Use refs for `hasConnected`, `authBlockedToken`, `cooldownTimer`, and current server room membership. Define one join emitter and one restoration callback:

```ts
const emitConversationJoin = useCallback(
  (activeSocket: CommunicationSocket, conversationId: string) => {
    if (serverRoomIdsRef.current.has(conversationId)) {
      warnDuplicateRoomJoin(serverRoomIdsRef.current.size);
      return;
    }
    serverRoomIdsRef.current.add(conversationId);
    activeSocket.emit(COMMUNICATION_SOCKET_EVENTS.conversationJoin, {
      conversationId,
    });
  },
  [],
);

const restoreActiveRooms = useCallback(
  (activeSocket: CommunicationSocket) => {
    serverRoomIdsRef.current.clear();
    joinedConversationIdsRef.current.forEach((_, conversationId) => {
      emitConversationJoin(activeSocket, conversationId);
    });
  },
  [emitConversationJoin],
);
```

Use `emitConversationJoin` in the first-subscriber branch of `emitRoomEvent`. In the final-subscriber leave branch, delete the ID from `serverRoomIdsRef` when emitting the leave. Define public `joinConversation` and `leaveConversation` with `useCallback` and place those stable functions directly in the context value; do not recreate wrapper lambdas every time connection state changes.

In the socket `connect` handler, set `connected`, clear errors and cooldown, restore rooms once, and increment `resyncVersion` only if `hasConnectedRef.current` was already true. Clear current server room membership on disconnect. Do not restore rooms in `nextSocket.io.on("reconnect")`; remove that manager listener.

Register manager `reconnect_attempt` to set `reconnecting` and `reconnect_failed` to set `degraded`, disable automatic reconnection, and schedule one 60-second restart. Use `retryDelayFromError` to replace the default cooldown only for a classified rate-limit error with a positive server delay.

In `connect_error`, store the message safely and branch on `classifyConnectionFailure(error)`. For `auth`, remember the rejected token, disable automatic reconnection, disconnect, and enter `auth-error`. For `rate-limit`, disable reconnection, enter `degraded`, and schedule the bounded restart. For temporary failures, leave Socket.IO's eight-attempt cycle enabled and enter `reconnecting`.

Use this fallback when the event is not an `Error` instance:

```ts
const message =
  error instanceof Error && error.message
    ? error.message
    : "Realtime connection failed.";
```

Call `logRealtimeEvent` for socket creation, state transitions, disconnect reasons, reconnect attempts, failure categories, cooldown starts, and room join/leave counts. Call `registerSocketOwner` immediately after a socket is created and invoke its returned cleanup exactly once during teardown.

Subscribe once to Task 1's token changes. Reread the token inside the callback. Return immediately when it equals `socket.auth.token`. A changed non-empty token clears the auth block, updates `socket.auth`, enables reconnection, disconnects, and connects exactly once. A missing token runs the existing authenticated teardown.

Register `online` and `offline` listeners. Offline disables manager reconnection, disconnects, cancels cooldown, and enters `offline`. Online resumes only when an authenticated token exists and it is not the token recorded in `authBlockedTokenRef`.

All teardown paths must be idempotent and clear cooldown, token subscription, browser listeners, diagnostics registration, socket listeners, manager listeners, and the socket connection.

- [ ] **Step 6: Run provider and dependent realtime tests**

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/hooks/useConversationRealtime.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.property.test.ts
}
```

Expected: PASS, including exactly one join after reconnect.

- [ ] **Step 7: Run the required guards**

Invoke `test-guard` on the modified provider test. Invoke `clean-code-guard` on the provider and diagnostics files, paying particular attention to timer cleanup, stale closures, duplicate state, and sensitive logging. Apply all must-fix findings and rerun the focused tests.

- [ ] **Step 8: Commit the provider hardening**

```powershell
& {
  git add -- src/features/communication/realtime/CommunicationRealtimeProvider.tsx src/features/communication/realtime/communication-realtime-diagnostics.ts src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx
  git commit -m "fix(realtime): harden provider lifecycle"
}
```

---

### Task 4: Targeted communication overview refreshes

**Files:**

- Modify: `src/features/communication/hooks/useCommunicationOverview.ts`
- Create: `src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx`

**Interfaces:**

- Preserves: `useCommunicationOverview()` return shape and explicit `refresh()` full refresh.
- Internal type: `OverviewResourceKey = keyof CommunicationOverviewData`.
- Internal function: `overviewResourcesForEvent(event: string): readonly OverviewResourceKey[]`.
- Consumes: existing `socket` and `resyncVersion` from `useCommunicationSocket`.

- [ ] **Step 1: Write the failing overview tests**

Mock all six service methods and the communication socket. Render a probe using the hook and use fake timers. Include these assertions:

Use this complete harness shape so every helper referenced by the tests is defined:

```tsx
const apiMocks = vi.hoisted(() => ({
  getAdminOverview: vi.fn(),
  getConversations: vi.fn(),
  getMessageReports: vi.fn(),
  getNotifications: vi.fn(),
  getPolicy: vi.fn(),
  getRestrictions: vi.fn(),
}));

const realtimeHarness = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>();
  return {
    resyncVersion: 0,
    socket: {
      on(event: string, listener: () => void) {
        const current = listeners.get(event) ?? new Set<() => void>();
        current.add(listener);
        listeners.set(event, current);
      },
      off(event: string, listener: () => void) {
        listeners.get(event)?.delete(listener);
      },
    },
    emitServer(event: string) {
      listeners.get(event)?.forEach((listener) => listener());
    },
    reset() {
      listeners.clear();
      this.resyncVersion = 0;
    },
  };
});

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    resyncVersion: realtimeHarness.resyncVersion,
    socket: realtimeHarness.socket,
  }),
}));

function OverviewProbe({ resyncVersion = 0 }: { resyncVersion?: number }) {
  realtimeHarness.resyncVersion = resyncVersion;
  const { data } = useCommunicationOverview();
  return <span data-testid="conversation-total">{data.conversations.total}</span>;
}

async function waitForInitialSixRequests() {
  await waitFor(() => expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce());
  expectEveryOverviewRequestOnce();
}

function clearApiMocks() {
  Object.values(apiMocks).forEach((request) => request.mockClear());
}

function expectEveryOverviewRequestOnce() {
  expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce();
  expect(apiMocks.getConversations).toHaveBeenCalledOnce();
  expect(apiMocks.getMessageReports).toHaveBeenCalledOnce();
  expect(apiMocks.getNotifications).toHaveBeenCalledOnce();
  expect(apiMocks.getPolicy).toHaveBeenCalledOnce();
  expect(apiMocks.getRestrictions).toHaveBeenCalledOnce();
}
```

In `beforeEach`, use fake timers, call `realtimeHarness.reset()`, reset every API mock, and supply the response shapes already accepted by the hook: object responses for overview/policy and `{ items: [], total: 0 }` for lists. In `afterEach`, restore real timers.

```ts
it("coalesces message bursts into the two affected requests", async () => {
  render(<OverviewProbe />);
  await waitForInitialSixRequests();
  clearApiMocks();

  act(() => {
    realtimeHarness.emitServer("communication.chat.message.created");
    realtimeHarness.emitServer("communication.chat.message.updated");
    realtimeHarness.emitServer("communication.chat.message.deleted");
    vi.advanceTimersByTime(500);
  });

  await waitFor(() => expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce());
  expect(apiMocks.getConversations).toHaveBeenCalledOnce();
  expect(apiMocks.getPolicy).not.toHaveBeenCalled();
  expect(apiMocks.getNotifications).not.toHaveBeenCalled();
  expect(apiMocks.getMessageReports).not.toHaveBeenCalled();
  expect(apiMocks.getRestrictions).not.toHaveBeenCalled();
});

it("refreshes notification resources without unrelated calls", async () => {
  render(<OverviewProbe />);
  await waitForInitialSixRequests();
  clearApiMocks();

  act(() => {
    realtimeHarness.emitServer("communication.notification.created");
    vi.advanceTimersByTime(500);
  });

  await waitFor(() => expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce());
  expect(apiMocks.getNotifications).toHaveBeenCalledOnce();
  expect(apiMocks.getConversations).not.toHaveBeenCalled();
  expect(apiMocks.getPolicy).not.toHaveBeenCalled();
  expect(apiMocks.getMessageReports).not.toHaveBeenCalled();
  expect(apiMocks.getRestrictions).not.toHaveBeenCalled();
});

it("performs one full refresh after reconnect resynchronization", async () => {
  const view = render(<OverviewProbe resyncVersion={0} />);
  await waitForInitialSixRequests();
  clearApiMocks();

  view.rerender(<OverviewProbe resyncVersion={1} />);

  await waitFor(() => expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce());
  expectEveryOverviewRequestOnce();
});

it("preserves unrelated data when a targeted request fails", async () => {
  apiMocks.getConversations.mockResolvedValueOnce({ items: [], total: 7 });
  render(<OverviewProbe />);
  await waitForInitialSixRequests();
  expect(screen.getByTestId("conversation-total")).toHaveTextContent("7");
  clearApiMocks();
  apiMocks.getNotifications.mockRejectedValueOnce(new Error("offline"));

  act(() => {
    realtimeHarness.emitServer("communication.notification.created");
    vi.advanceTimersByTime(500);
  });

  await waitFor(() => expect(apiMocks.getNotifications).toHaveBeenCalledOnce());
  expect(screen.getByTestId("conversation-total")).toHaveTextContent("7");
});

it("cancels a pending targeted refresh on unmount", async () => {
  const view = render(<OverviewProbe />);
  await waitForInitialSixRequests();
  clearApiMocks();
  act(() => realtimeHarness.emitServer("communication.chat.message.created"));

  view.unmount();
  act(() => vi.advanceTimersByTime(500));

  expect(apiMocks.getAdminOverview).not.toHaveBeenCalled();
  expect(apiMocks.getConversations).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the new overview test and confirm it fails**

```powershell
& { npm run test:run -- src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx }
```

Expected: FAIL because notification events are not subscribed and message events still call all six services.

- [ ] **Step 3: Extract resource loaders and event mapping**

Define the exact resource sets:

```ts
type OverviewResourceKey = keyof CommunicationOverviewData;

const ALL_OVERVIEW_RESOURCES: readonly OverviewResourceKey[] = [
  "adminOverview",
  "policy",
  "conversations",
  "notifications",
  "reports",
  "restrictions",
];

const MESSAGE_OVERVIEW_RESOURCES = [
  "adminOverview",
  "conversations",
] as const;
const NOTIFICATION_OVERVIEW_RESOURCES = [
  "adminOverview",
  "notifications",
] as const;
const ANNOUNCEMENT_OVERVIEW_RESOURCES = ["adminOverview"] as const;
```

Create one loader per key using the current request parameters and normalization functions. Implement `fetchOverviewResources(keys)` so it runs each selected key once, returns a `Partial<CommunicationOverviewData>`, and collects errors. Full initial load and public `refresh()` pass `ALL_OVERVIEW_RESOURCES`.

- [ ] **Step 4: Replace full event refresh with a pending-key scheduler**

Use refs owned by the hook:

```ts
const pendingResourceKeysRef = useRef(new Set<OverviewResourceKey>());

const scheduleResourceRefresh = useCallback(
  (keys: readonly OverviewResourceKey[]) => {
    keys.forEach((key) => pendingResourceKeysRef.current.add(key));
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      const pendingKeys = [...pendingResourceKeysRef.current];
      pendingResourceKeysRef.current.clear();
      void refreshResources(pendingKeys);
    }, 500);
  },
  [refreshResources],
);
```

Subscribe message created/updated/deleted to the message set, notification created/read to the notification set, and announcement published to the announcement set. Remove each exact callback on cleanup. Keep reconnect `resyncVersion` as one immediate full refresh and do not also schedule a full timer for it.

Merge targeted success into current state:

```ts
setData((current) => ({ ...current, ...result.data }));
```

On cleanup, clear the timer and the pending set. Continue ignoring results after unmount through `mountedRef`.

Call `logRealtimeEvent("overview_refresh_scheduled", { resourceCount: keys.length })` when a pending-key batch is created and `logRealtimeEvent("overview_refresh_completed", { resourceCount: pendingKeys.length })` when it settles. Resource names and response data are not logged.

- [ ] **Step 5: Run overview tests**

```powershell
& { npm run test:run -- src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx }
```

Expected: PASS.

- [ ] **Step 6: Run the required guards**

Invoke `test-guard` on the new overview test and `clean-code-guard` on `useCommunicationOverview.ts`. Reject duplicated request-normalization branches and ensure partial failures cannot erase unrelated successful state. Apply findings and rerun the focused test.

- [ ] **Step 7: Commit targeted overview refresh**

```powershell
& {
  git add -- src/features/communication/hooks/useCommunicationOverview.ts src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx
  git commit -m "fix(communication): target realtime overview refreshes"
}
```

---

### Task 5: Coalesce notification context requests

**Files:**

- Modify: `src/features/communication/utils/notificationPresentation.ts`
- Create: `src/features/communication/__tests__/utils/notificationPresentation.test.ts`
- Verify: `src/features/communication/__tests__/components/GlobalMessageNotifications.test.tsx`
- Verify: `src/components/layout/__tests__/TopNavNotificationDropdown.test.tsx`

**Interfaces:**

- Preserves: `notificationPresentation(notification, locale)` and `notificationPresentationFallback(notification, locale)`.
- Internal helper: `sharedSettledRecord(cache, key, request): Promise<Record<string, unknown> | undefined>`.
- No long-lived response cache; only currently pending identical requests are shared.

- [ ] **Step 1: Write failing in-flight sharing tests**

Create deferred promises for API mocks and call `notificationPresentation` twice before resolving them:

Define the mocks and helpers before the tests:

```ts
const apiMocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  getMessageInfo: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);

function deferred<T>(value: T) {
  let release!: () => void;
  const promise = new Promise<T>((resolve) => {
    release = () => resolve(value);
  });
  return { promise, resolve: release };
}

function messageNotification(overrides: Record<string, unknown>) {
  return {
    createdAt: "2026-09-12T10:00:00.000Z",
    id: "notification-1",
    type: "message_created",
    ...overrides,
  };
}
```

Reset both API mocks in `beforeEach`. Import `notificationPresentation` only after the service mock declaration.

```ts
it("shares concurrent message and conversation context requests", async () => {
  const messageDeferred = deferred({
    message: { conversationId: "conversation-1", sender: { name: "Sender" } },
  });
  const conversationDeferred = deferred({ title: "Classroom" });
  apiMocks.getMessageInfo.mockReturnValue(messageDeferred.promise);
  apiMocks.getConversation.mockReturnValue(conversationDeferred.promise);
  const notification = messageNotification({
    sourceId: "message-1",
    conversationId: "conversation-1",
  });

  const first = notificationPresentation(notification, "en");
  const second = notificationPresentation(notification, "en");

  expect(apiMocks.getMessageInfo).toHaveBeenCalledOnce();
  expect(apiMocks.getConversation).toHaveBeenCalledOnce();
  messageDeferred.resolve();
  conversationDeferred.resolve();
  await expect(Promise.all([first, second])).resolves.toHaveLength(2);
});

it("starts a fresh request after the shared request settles", async () => {
  apiMocks.getMessageInfo.mockResolvedValue({
    message: { conversationId: "conversation-1" },
  });
  apiMocks.getConversation.mockResolvedValue({ title: "Classroom" });
  const notification = messageNotification({
    sourceId: "message-1",
    conversationId: "conversation-1",
  });

  await notificationPresentation(notification, "en");
  await notificationPresentation(notification, "en");

  expect(apiMocks.getMessageInfo).toHaveBeenCalledTimes(2);
  expect(apiMocks.getConversation).toHaveBeenCalledTimes(2);
});

it("shares a rejected request, falls back, and permits a later retry", async () => {
  const failure = Promise.reject(new Error("offline"));
  apiMocks.getMessageInfo.mockReturnValueOnce(failure);
  apiMocks.getConversation.mockRejectedValueOnce(new Error("offline"));
  const notification = messageNotification({
    sourceId: "message-1",
    conversationId: "conversation-1",
  });

  const [first, second] = await Promise.all([
    notificationPresentation(notification, "en"),
    notificationPresentation(notification, "en"),
  ]);
  expect(first.kind).toBe("message");
  expect(second.kind).toBe("message");
  expect(apiMocks.getMessageInfo).toHaveBeenCalledOnce();

  apiMocks.getMessageInfo.mockResolvedValueOnce({ message: {} });
  apiMocks.getConversation.mockResolvedValueOnce({ title: "Classroom" });
  await notificationPresentation(notification, "en");
  expect(apiMocks.getMessageInfo).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run the test and confirm duplicate API calls**

```powershell
& { npm run test:run -- src/features/communication/__tests__/utils/notificationPresentation.test.ts }
```

Expected: FAIL because each caller starts its own `getMessageInfo` and `getConversation` requests.

- [ ] **Step 3: Implement settlement-safe in-flight maps**

Add two module-level maps and one generic sharing helper:

```ts
type SettledRecord = Record<string, unknown> | undefined;

const messageInfoRequests = new Map<string, Promise<SettledRecord>>();
const conversationRequests = new Map<string, Promise<SettledRecord>>();

function sharedSettledRecord(
  requests: Map<string, Promise<SettledRecord>>,
  key: string,
  request: () => Promise<unknown>,
) {
  const existing = requests.get(key);
  if (existing) return existing;

  const pending = settledRecord(request()).finally(() => {
    if (requests.get(key) === pending) requests.delete(key);
  });
  requests.set(key, pending);
  return pending;
}
```

Replace direct calls in `loadMessagePresentationContext` with:

```ts
const messageInfoRequest = sharedSettledRecord(
  messageInfoRequests,
  messageId,
  () => getMessageInfo(messageId),
);
```

Use `sharedSettledRecord(conversationRequests, conversationId, () => getConversation(conversationId))` for both conversation branches. Preserve concurrent loading when the notification already supplies a conversation ID, and preserve fallback behavior on rejected requests.

- [ ] **Step 4: Run notification presentation and consumer tests**

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/utils/notificationPresentation.test.ts src/features/communication/__tests__/components/GlobalMessageNotifications.test.tsx src/components/layout/__tests__/TopNavNotificationDropdown.test.tsx
}
```

Expected: PASS.

- [ ] **Step 5: Run the required guards**

Invoke `test-guard` on the new utility test and any consumer test changed to accommodate behavior. Invoke `clean-code-guard` on `notificationPresentation.ts`, checking promise cleanup, rejected requests, and unbounded retention. Apply findings and rerun the three focused files.

- [ ] **Step 6: Commit request coalescing**

```powershell
& {
  git add -- src/features/communication/utils/notificationPresentation.ts src/features/communication/__tests__/utils/notificationPresentation.test.ts
  git commit -m "fix(notifications): coalesce context requests"
}
```

---

### Task 6: Integrated verification and owner checkpoint

**Files:**

- Verify only: all files changed in Tasks 1–5.
- Modify only if a guard or verification failure identifies a defect within the approved scope.

**Interfaces:**

- Consumes: every preceding task.
- Produces: a clean, locally verified branch ready for normal push and draft pull request after owner direction.

- [ ] **Step 1: Run the complete focused realtime and amplification set**

```powershell
& {
  npm run test:run -- src/lib/__tests__/token-storage.test.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx src/features/communication/__tests__/hooks/useConversationRealtime.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.property.test.ts src/features/communication/__tests__/utils/notificationPresentation.test.ts src/features/communication/__tests__/components/GlobalMessageNotifications.test.tsx src/components/layout/__tests__/TopNavNotificationDropdown.test.tsx
}
```

Expected: PASS for every listed file.

- [ ] **Step 2: Run lint on changed production and test files**

```powershell
& {
  npx eslint src/lib/token-storage.ts src/lib/__tests__/token-storage.test.ts src/features/communication/realtime/communication-connection-policy.ts src/features/communication/realtime/communication-socket.ts src/features/communication/realtime/communication-realtime-diagnostics.ts src/features/communication/realtime/CommunicationRealtimeProvider.tsx src/features/communication/hooks/useCommunicationOverview.ts src/features/communication/utils/notificationPresentation.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx src/features/communication/__tests__/utils/notificationPresentation.test.ts
}
```

Expected: exit code 0 with no new warning caused by this task.

- [ ] **Step 3: Run TypeScript and the production build**

```powershell
& {
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm run build
}
```

Expected: both commands exit 0.

- [ ] **Step 4: Run final code and test guard passes**

Invoke `test-guard` over the complete changed test diff and `clean-code-guard` over the complete changed production-code diff. Fix all must-fix findings, repeat the affected focused tests, lint, typecheck, and build, and make a normal corrective commit if files changed.

- [ ] **Step 5: Ask before the full test suite**

Stop and ask the owner for explicit approval to run:

```powershell
& { npm run test:run }
```

If approval is granted, run it and record the exact result. If approval is not granted, report `FULL_TEST_SUITE=NOT_RUN_OWNER_APPROVAL_REQUIRED`; do not infer approval from earlier design or implementation approvals.

- [ ] **Step 6: Inspect final scope and history**

```powershell
& {
  git status --short --branch
  git diff --stat origin/main...HEAD
  git log --oneline origin/main..HEAD
  git diff --check origin/main...HEAD
}
```

Expected: only approved frontend source, tests, spec, and plan files differ; the worktree is clean; diff check passes.

- [ ] **Step 7: Present the delivery checkpoint**

Report focused tests, lint, typecheck, build, full-suite approval/result, changed files, commits, known limitations, and confirmation that backend/deployment files were untouched. Do not push, create a pull request, merge, or deploy unless the owner explicitly requests the corresponding action.
