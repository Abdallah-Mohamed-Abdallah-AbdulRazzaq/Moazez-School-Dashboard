# Realtime Acceptance Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining frontend realtime acceptance gaps with transport fallback, real Engine.IO error classification, bounded lifecycle/storm proofs, route-scoped resync guards, and an evergreen integration contract.

**Architecture:** Keep the existing per-tab `CommunicationRealtimeProvider` and Socket.IO session ownership. Extend only the socket options and failure parser, prove lifecycle properties at public boundaries, and suppress stale positive `resyncVersion` values in affected route hooks instead of introducing a global reconciliation coordinator without evidence.

**Tech Stack:** Next.js 16, React 19, TypeScript, Socket.IO Client 4.8.3, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-realtime-client-hardening-design.md`

## Global Constraints

- Frontend only; do not modify backend, deployment workflows, secrets, or production configuration.
- Preserve one Socket.IO client per authenticated browser tab; do not add cross-tab leader election.
- Preserve WebSocket-first ordering while ensuring polling is actually attempted after an initial transport failure.
- Use test-first red/green cycles for every behavior change.
- Apply clean-code-guard to production changes and test-guard to test changes.
- Do not run the full test suite until the owner explicitly approves it.
- Create a Draft PR and do not merge it.

---

### Task 1: Transport fallback and infrastructure error shapes

**Files:**
- Modify: `src/features/communication/realtime/communication-socket.ts`
- Modify: `src/features/communication/realtime/communication-connection-policy.ts`
- Test: `src/features/communication/__tests__/realtime/communication-socket.test.ts`
- Test: `src/features/communication/__tests__/realtime/communication-connection-policy.test.ts`

**Interfaces:**
- Consumes: Socket.IO 4.8.3 `tryAllTransports` and Engine.IO `TransportError.description`/`context`.
- Produces: WebSocket-first socket options with real polling fallback and `classifyConnectionFailure(error)` support for namespace and low-level transport status fields.

- [x] **Step 1: Write failing transport and error-shape tests**

```ts
expect(ioMock).toHaveBeenCalledWith(
  expect.any(String),
  expect.objectContaining({
    transports: ["websocket", "polling"],
    tryAllTransports: true,
  }),
);

expect(
  classifyConnectionFailure({
    type: "TransportError",
    description: "fetch read error",
    context: { status: 429 },
  }),
).toBe("rate-limit");
```

- [x] **Step 2: Run both focused test files and confirm the new assertions fail for missing behavior**

Run: `npm run test:run -- src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts`

- [x] **Step 3: Add `tryAllTransports: true` and normalize status from `data`, the outer error, `description`, or `context.status`**

```ts
return io(COMMUNICATION_REALTIME_URL, {
  transports: [...REALTIME_TRANSPORTS],
  tryAllTransports: true,
  // existing bounded reconnect options remain unchanged
});
```

- [x] **Step 4: Re-run focused tests and commit**

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts
  git add -- src/features/communication/realtime/communication-socket.ts src/features/communication/realtime/communication-connection-policy.ts src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts
  git commit -m "fix(realtime): complete transport fallback policy"
}
```

### Task 2: Per-tab lifecycle and outage acceptance proofs

**Files:**
- Modify: `src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx`
- Modify: `src/features/communication/__tests__/realtime/communication-connection-policy.test.ts`

**Interfaces:**
- Consumes: existing provider public state, token-storage native `storage` events, bounded retry policy, and fake timers.
- Produces: regression proofs for cross-tab token propagation, 100 sequential owner lifecycles, a 300-second infrastructure disconnect, and 100 simulated first-attempt retry schedules.

- [x] **Step 1: Add a cross-tab token event test**

```ts
localStorage.setItem("moazez_access_token", "token-2");
window.dispatchEvent(
  new StorageEvent("storage", { key: "moazez_access_token" }),
);
expect(socket.auth).toEqual({ token: "token-2" });
expect(socket.connect).toHaveBeenCalledOnce();
```

- [x] **Step 2: Add a 100 mount/unmount lifecycle test**

Render and unmount the provider 100 times; after every unmount assert socket and manager listener counts are zero and `vi.getTimerCount()` is zero. Assert one socket factory call per independent runtime mount and no live listener accumulation.

- [x] **Step 3: Add a 300-second disconnect/recovery test**

Connect with one active room, advance fake time by `300_000`, simulate `io server disconnect`, advance through the bounded first retry, reconnect, and assert exactly one room rejoin plus one resync increment.

- [x] **Step 4: Add a 100-client retry-dispersion policy test**

```ts
const delays = Array.from({ length: 100 }, (_, index) =>
  reconnectDelayForAttempt(0, () => index / 99),
);
expect(delays[0]).toBe(500);
expect(delays[99]).toBe(1_500);
expect(new Set(delays).size).toBe(100);
```

- [x] **Step 5: Run the tests, confirm any missing behavior is exposed, then keep production unchanged when the existing lifecycle already satisfies the proof**

Run: `npm run test:run -- src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/realtime/communication-connection-policy.test.ts`

- [x] **Step 6: Commit acceptance tests**

```powershell
& {
  git add -- src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/realtime/communication-connection-policy.test.ts
  git commit -m "test(realtime): prove lifecycle acceptance bounds"
}
```

### Task 3: Suppress stale reconnect versions at route consumers

**Files:**
- Modify: `src/features/communication/hooks/useNotifications.ts`
- Modify: `src/features/communication/hooks/useConversationRealtime.ts`
- Test: `src/features/communication/__tests__/hooks/useConversations.test.ts`
- Test: `src/features/communication/__tests__/hooks/useNotifications.test.ts`
- Test: `src/features/communication/__tests__/hooks/useConversationRealtime.test.ts`

**Interfaces:**
- Consumes: monotonic `resyncVersion` from `CommunicationRealtimeProvider`.
- Produces: affected route hooks that reconcile only when the version changes after mount; an already-positive version does not duplicate initial REST work.

- [x] **Step 1: Add acceptance tests for mounting each hook with an existing positive version**

Each test initializes `resyncVersion` to `3`, mounts the hook, flushes its initial load, and asserts the initial request/reconnect callback runs once rather than twice.

- [x] **Step 2: Run the three hook test files and confirm notification/realtime duplication fails**

Run: `npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useNotifications.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.test.ts`

- [x] **Step 3: Initialize the notification and detail-hook last-observed refs from the current `resyncVersion`; retain the conversation list's existing in-flight request coalescing after its acceptance test proves one HTTP request**

```ts
const previousResyncVersionRef = useRef(resyncVersion);

useEffect(() => {
  if (previousResyncVersionRef.current === resyncVersion) return;
  previousResyncVersionRef.current = resyncVersion;
  // existing route-specific reconciliation
}, [resyncVersion]);
```

- [x] **Step 4: Preserve existing 0→1 and repeated reconnect tests, run the three files, and commit**

```powershell
& {
  npm run test:run -- src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useNotifications.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.test.ts
  git add -- src/features/communication/hooks/useNotifications.ts src/features/communication/hooks/useConversationRealtime.ts src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useNotifications.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.test.ts
  git commit -m "fix(communication): bound reconnect reconciliation"
}
```

### Task 4: Evergreen client contract and verification

**Files:**
- Create: `docs/REALTIME_CLIENT_INTEGRATION.md`
- Modify: `docs/superpowers/plans/2026-09-12-realtime-acceptance-correction.md`

**Interfaces:**
- Consumes: implemented ownership, lifecycle, authentication, transport, retry, rooms, subscriptions, resync, diagnostics, and test contracts.
- Produces: a stable developer-facing contract that separates local diagnostics from future production telemetry and records the one-socket-per-tab decision.

- [x] **Step 1: Write the evergreen contract**

Document: provider ownership, per-tab policy, `auth.token`, token-change events, WebSocket-first/try-all fallback, bounded retry/cooldown, room reference counting, exact listener cleanup, route-scoped resync, safe diagnostic fields, required regression tests, and explicit non-goals.

- [x] **Step 2: Apply docs-guard against the actual source and package version**

Verify every option, event name, environment variable, state value, and test path in the document against source.

- [x] **Step 3: Run changed-file lint, typecheck, focused tests, and production build**

```powershell
& {
  npm run lint
  npm run typecheck
  npm run test:run -- src/lib/__tests__/token-storage.test.ts src/features/communication/__tests__/realtime/communication-socket.test.ts src/features/communication/__tests__/realtime/communication-connection-policy.test.ts src/features/communication/__tests__/realtime/CommunicationRealtimeProvider.test.tsx src/features/communication/__tests__/hooks/useConversations.test.ts src/features/communication/__tests__/hooks/useNotifications.test.ts src/features/communication/__tests__/hooks/useConversationRealtime.test.ts src/features/communication/__tests__/hooks/useCommunicationOverview.test.tsx
  npm run build
}
```

- [ ] **Step 4: Ask the owner before running the full test suite**

Run only after approval: `npm run test:run -- --minWorkers=4 --maxWorkers=4`

- [x] **Step 5: Commit documentation and current plan state**

```powershell
& {
  git add -- docs/REALTIME_CLIENT_INTEGRATION.md docs/superpowers/plans/2026-09-12-realtime-acceptance-correction.md
  git commit -m "docs(realtime): publish client integration contract"
}
```

- [ ] **Step 6: Push normally and create a Draft PR against `main`; do not merge**
