import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommunicationRealtimeProvider } from "@/features/communication/realtime/CommunicationRealtimeProvider";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";
import { tokenStorage } from "@/lib/token-storage";

const socketHarness = vi.hoisted(() => {
  type Handler = (...args: never[]) => void;
  const createRegistry = () => {
    const listeners = new Map<string, Set<Handler>>();
    return {
      add(event: string, listener: Handler) {
        const eventListeners = listeners.get(event) ?? new Set<Handler>();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      },
      clear() {
        listeners.clear();
      },
      count(event: string) {
        return listeners.get(event)?.size ?? 0;
      },
      emit(event: string, ...args: unknown[]) {
        listeners
          .get(event)
          ?.forEach((listener) => listener(...(args as never[])));
      },
      remove(event: string, listener: Handler) {
        listeners.get(event)?.delete(listener);
      },
    };
  };

  const managerListeners = createRegistry();
  const socketListeners = createRegistry();
  const manager = {
    engine: { transport: { name: "websocket" } },
    on: vi.fn((event: string, listener: Handler) => {
      managerListeners.add(event, listener);
    }),
    off: vi.fn((event: string, listener: Handler) => {
      managerListeners.remove(event, listener);
    }),
    reconnection: vi.fn(),
    removeAllListeners: vi.fn(() => managerListeners.clear()),
  };
  const socket = {
    active: false,
    auth: { token: "token-1" } as Record<string, unknown>,
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    id: "socket-1",
    io: manager,
    off: vi.fn((event: string, listener: Handler) => {
      socketListeners.remove(event, listener);
    }),
    on: vi.fn((event: string, listener: Handler) => {
      socketListeners.add(event, listener);
    }),
    removeAllListeners: vi.fn(() => socketListeners.clear()),
  };
  const createCommunicationSocket = vi.fn(() => socket);

  return {
    createCommunicationSocket,
    managerListeners,
    socket,
    socketListeners,
  };
});

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: "user-1" },
  }),
}));

vi.mock("@/features/communication/realtime/communication-socket", () => ({
  COMMUNICATION_REALTIME_DEBUG: false,
  COMMUNICATION_REALTIME_SOCKET_PATH: undefined,
  COMMUNICATION_REALTIME_URL: "https://api.example.test/api/v1/realtime",
  createCommunicationSocket: socketHarness.createCommunicationSocket,
  getCommunicationAccessToken: () =>
    localStorage.getItem("moazez_access_token"),
  getCommunicationRealtimeNamespace: () => "/api/v1/realtime",
}));

function RealtimeProbe({ conversationId }: { conversationId?: string }) {
  const {
    connectionError,
    connectionState,
    joinConversation,
    leaveConversation,
    resyncVersion,
    retryConnection,
  } = useCommunicationSocket();

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);

  return (
    <div>
      <span data-testid="state">{connectionState}</span>
      <span data-testid="resync-version">{resyncVersion}</span>
      <span>{connectionError ?? "no-error"}</span>
      <button type="button" onClick={retryConnection}>
        Retry
      </button>
    </div>
  );
}

function renderProvider(conversationId?: string) {
  const renderedProvider = render(
    <CommunicationRealtimeProvider>
      <RealtimeProbe conversationId={conversationId} />
    </CommunicationRealtimeProvider>,
  );
  act(() => vi.advanceTimersByTime(0));
  return renderedProvider;
}

describe("CommunicationRealtimeProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.setItem("moazez_access_token", "token-1");
    socketHarness.managerListeners.clear();
    socketHarness.socketListeners.clear();
    socketHarness.socket.auth = { token: "token-1" };
    socketHarness.socket.active = false;
    socketHarness.socket.connected = false;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("restores each active room once and requests one resync after reconnect", () => {
    renderProvider("conversation-1");
    act(() => socketHarness.socketListeners.emit("connect"));
    socketHarness.socket.emit.mockClear();

    act(() => socketHarness.socketListeners.emit("disconnect", "transport close"));
    act(() => socketHarness.managerListeners.emit("reconnect", 1));
    act(() => socketHarness.socketListeners.emit("connect"));

    expect(socketHarness.socket.emit).toHaveBeenCalledTimes(1);
    expect(socketHarness.socket.emit).toHaveBeenCalledWith(
      "communication.chat.conversation.join",
      { conversationId: "conversation-1" },
    );
    expect(screen.getByTestId("resync-version")).toHaveTextContent("1");
  });

  it("does not reconnect when a token notification keeps the same value", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();

    act(() => tokenStorage.setAccessToken("token-1"));

    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  });

  it("reconnects once when the access token changes", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();
    socketHarness.socket.disconnect.mockClear();
    act(() => tokenStorage.setAccessToken("token-2"));

    expect(socketHarness.socket.auth).toEqual({ token: "token-2" });
    expect(socketHarness.socket.disconnect).toHaveBeenCalledOnce();
    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
  });

  it("does not reactivate the detached socket after the token is removed", () => {
    renderProvider();
    act(() => tokenStorage.removeAccessToken());
    socketHarness.socket.connect.mockClear();

    act(() => tokenStorage.setAccessToken("token-2"));

    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  });

  it("pauses while offline and resumes on the online event", () => {
    renderProvider();
    act(() => window.dispatchEvent(new Event("offline")));

    expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId("state")).toHaveTextContent("offline");
    socketHarness.socket.connect.mockClear();

    act(() => window.dispatchEvent(new Event("online")));

    expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(true);
    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
  });

  it("waits for a changed token after an authentication failure", () => {
    renderProvider();
    act(() =>
      socketHarness.socketListeners.emit("connect_error", {
        data: { status: 401 },
      }),
    );

    expect(screen.getByTestId("state")).toHaveTextContent("auth-error");
    expect(socketHarness.socket.io.reconnection).toHaveBeenLastCalledWith(false);
    socketHarness.socket.connect.mockClear();

    act(() => window.dispatchEvent(new Event("online")));
    expect(socketHarness.socket.connect).not.toHaveBeenCalled();

    act(() => tokenStorage.setAccessToken("token-2"));
    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
  });

  it("starts a new retry cycle after the reconnect cooldown", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();
    act(() => socketHarness.managerListeners.emit("reconnect_failed"));

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
      socketHarness.socketListeners.emit("connect_error", {
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
    act(() => socketHarness.managerListeners.emit("reconnect_failed"));
    act(() => socketHarness.socketListeners.emit("connect"));
    socketHarness.socket.connect.mockClear();

    act(() => vi.advanceTimersByTime(60_000));

    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
    expect(screen.getByTestId("state")).toHaveTextContent("connected");
  });

  it("keeps one physical socket through repeated renders", () => {
    const renderedProvider = renderProvider();
    for (let index = 0; index < 100; index += 1) {
      renderedProvider.rerender(
        <CommunicationRealtimeProvider>
          <RealtimeProbe />
        </CommunicationRealtimeProvider>,
      );
    }

    expect(socketHarness.createCommunicationSocket).toHaveBeenCalledOnce();
  });

  it("removes listeners and cooldown work on unmount", () => {
    const renderedProvider = renderProvider();
    act(() => socketHarness.managerListeners.emit("reconnect_failed"));
    renderedProvider.unmount();

    expect(socketHarness.socketListeners.count("connect")).toBe(0);
    expect(socketHarness.socketListeners.count("connect_error")).toBe(0);
    expect(socketHarness.managerListeners.count("reconnect_attempt")).toBe(0);
    expect(socketHarness.managerListeners.count("reconnect_failed")).toBe(0);
    socketHarness.socket.connect.mockClear();
    act(() => tokenStorage.setAccessToken("token-2"));
    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(60_000));
    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  });

  it("does not poll token storage", () => {
    const intervalSpy = vi.spyOn(window, "setInterval");
    renderProvider();
    expect(intervalSpy).not.toHaveBeenCalledWith(expect.any(Function), 5_000);
  });

  it("surfaces backend room authorization failures", () => {
    renderProvider();
    act(() =>
      socketHarness.socketListeners.emit("exception", {
        status: "error",
        message: { code: "communication.conversation.not_member" },
      }),
    );

    expect(
      screen.getByText("communication.conversation.not_member"),
    ).toBeInTheDocument();
  });

  it("retries a failed temporary connection on request", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();
    act(() =>
      socketHarness.socketListeners.emit(
        "connect_error",
        new Error("Connection failed"),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
    expect(screen.getByText("no-error")).toBeInTheDocument();
  });

  it("automatically retries a temporary namespace connection failure", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();

    act(() =>
      socketHarness.socketListeners.emit(
        "connect_error",
        new Error("Namespace unavailable"),
      ),
    );
    act(() => vi.advanceTimersByTime(1_500));

    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
  });

  it("leaves active transport recovery to the socket manager", () => {
    renderProvider();
    socketHarness.socket.active = true;
    socketHarness.socket.connect.mockClear();

    act(() =>
      socketHarness.socketListeners.emit(
        "connect_error",
        new Error("Transport unavailable"),
      ),
    );
    act(() => vi.advanceTimersByTime(1_500));

    expect(socketHarness.socket.connect).not.toHaveBeenCalled();
  });

  it("automatically retries after a server-initiated disconnect", () => {
    renderProvider();
    socketHarness.socket.connect.mockClear();

    act(() =>
      socketHarness.socketListeners.emit("disconnect", "io server disconnect"),
    );
    act(() => vi.advanceTimersByTime(1_500));

    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
  });

  it("enters cooldown after the bounded namespace retry cycle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    renderProvider();
    socketHarness.socket.connect.mockClear();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      act(() =>
        socketHarness.socketListeners.emit(
          "connect_error",
          new Error("Namespace unavailable"),
        ),
      );
      act(() => vi.advanceTimersByTime(30_000));
    }
    expect(socketHarness.socket.connect).toHaveBeenCalledTimes(8);

    act(() =>
      socketHarness.socketListeners.emit(
        "connect_error",
        new Error("Namespace unavailable"),
      ),
    );
    expect(screen.getByTestId("state")).toHaveTextContent("degraded");
    act(() => vi.advanceTimersByTime(59_999));
    expect(socketHarness.socket.connect).toHaveBeenCalledTimes(8);
    act(() => vi.advanceTimersByTime(1));
    expect(socketHarness.socket.connect).toHaveBeenCalledTimes(9);
  });

  it("clears deferred provider state updates during teardown", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const renderedProvider = render(
      <CommunicationRealtimeProvider>
        <RealtimeProbe />
      </CommunicationRealtimeProvider>,
    );

    renderedProvider.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
