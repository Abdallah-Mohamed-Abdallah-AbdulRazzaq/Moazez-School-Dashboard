import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommunicationRealtimeProvider } from "@/features/communication/realtime/CommunicationRealtimeProvider";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";

const tokenHarness = vi.hoisted(() => ({ value: "token-1" }));
const socketHarness = vi.hoisted(() => {
  const listeners = new Map<string, (payload?: unknown) => void>();
  const socket = {
    auth: { token: "token-1" },
    connected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    id: "socket-1",
    io: {
      engine: { transport: { name: "websocket" } },
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    on: vi.fn((event: string, listener: (payload?: unknown) => void) => {
      listeners.set(event, listener);
    }),
    removeAllListeners: vi.fn(),
  };
  return { listeners, socket };
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
  createCommunicationSocket: () => socketHarness.socket,
  getCommunicationAccessToken: () => tokenHarness.value,
  getCommunicationRealtimeNamespace: () => "/api/v1/realtime",
}));

function RealtimeErrorProbe() {
  const { connectionError, retryConnection } = useCommunicationSocket();
  return (
    <div>
      <span>{connectionError ?? "connected"}</span>
      <button type="button" onClick={retryConnection}>
        Retry
      </button>
    </div>
  );
}

describe("CommunicationRealtimeProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    tokenHarness.value = "token-1";
    socketHarness.socket.auth = { token: "token-1" };
    socketHarness.socket.connected = true;
    socketHarness.listeners.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reconnects with a rotated access token", () => {
    const { unmount } = render(
      <CommunicationRealtimeProvider>
        <RealtimeErrorProbe />
      </CommunicationRealtimeProvider>,
    );
    act(() => {
      vi.runAllTicks();
    });
    socketHarness.socket.connect.mockClear();
    socketHarness.socket.disconnect.mockClear();

    tokenHarness.value = "token-2";
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(socketHarness.socket.auth).toEqual({ token: "token-2" });
    expect(socketHarness.socket.disconnect).toHaveBeenCalledOnce();
    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
    act(() => {
      unmount();
      vi.runAllTicks();
    });
  });

  it("surfaces backend room authorization failures", () => {
    const { unmount } = render(
      <CommunicationRealtimeProvider>
        <RealtimeErrorProbe />
      </CommunicationRealtimeProvider>,
    );
    act(() => {
      vi.runAllTicks();
    });

    act(() => {
      socketHarness.listeners.get("exception")?.({
        status: "error",
        message: { code: "communication.conversation.not_member" },
      });
    });

    expect(
      screen.getByText("communication.conversation.not_member"),
    ).toBeInTheDocument();
    act(() => {
      unmount();
      vi.runAllTicks();
    });
  });

  it("retries a failed socket connection on request", () => {
    const { unmount } = render(
      <CommunicationRealtimeProvider>
        <RealtimeErrorProbe />
      </CommunicationRealtimeProvider>,
    );
    act(() => {
      vi.runAllTicks();
    });
    socketHarness.socket.connect.mockClear();
    socketHarness.socket.connected = false;

    act(() => {
      socketHarness.listeners
        .get("connect_error")
        ?.(new Error("Connection failed"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(socketHarness.socket.connect).toHaveBeenCalledOnce();
    expect(screen.getByText("connected")).toBeInTheDocument();
    act(() => {
      unmount();
      vi.runAllTicks();
    });
  });
});
