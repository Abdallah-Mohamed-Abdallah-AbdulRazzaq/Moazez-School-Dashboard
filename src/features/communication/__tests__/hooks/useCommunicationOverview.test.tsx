import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCommunicationOverview } from "@/features/communication/hooks/useCommunicationOverview";
import {
  CommunicationRealtimeContext,
  type CommunicationRealtimeContextValue,
} from "@/features/communication/realtime/CommunicationRealtimeProvider";

const apiMocks = vi.hoisted(() => ({
  getAdminOverview: vi.fn(),
  getConversations: vi.fn(),
  getMessageReports: vi.fn(),
  getNotifications: vi.fn(),
  getPolicy: vi.fn(),
  getRestrictions: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);

type SocketListener = () => void;

function createSocketHarness() {
  const listeners = new Map<string, Set<SocketListener>>();
  return {
    emitServer(event: string) {
      listeners.get(event)?.forEach((listener) => listener());
    },
    socket: {
      off(event: string, listener: SocketListener) {
        listeners.get(event)?.delete(listener);
      },
      on(event: string, listener: SocketListener) {
        const eventListeners = listeners.get(event) ?? new Set<SocketListener>();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      },
    },
  };
}

const socketHarness = createSocketHarness();
const emptyList = { items: [], total: 0 };

function OverviewProbe() {
  const { data } = useCommunicationOverview();
  return <span data-testid="conversation-total">{data.conversations.total}</span>;
}

function OverviewTestProvider({
  resyncVersion = 0,
}: {
  resyncVersion?: number;
}) {
  const context: CommunicationRealtimeContextValue = {
    socket:
      socketHarness.socket as unknown as CommunicationRealtimeContextValue["socket"],
    isConnected: true,
    connectionState: "connected",
    connectionError: null,
    resyncVersion,
    retryConnection: vi.fn(),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  };

  return (
    <CommunicationRealtimeContext.Provider value={context}>
      <OverviewProbe />
    </CommunicationRealtimeContext.Provider>
  );
}

async function flushRequests() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
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

describe("useCommunicationOverview realtime refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearApiMocks();
    apiMocks.getAdminOverview.mockResolvedValue({ totalConversations: 0 });
    apiMocks.getPolicy.mockResolvedValue({});
    apiMocks.getConversations.mockResolvedValue(emptyList);
    apiMocks.getNotifications.mockResolvedValue(emptyList);
    apiMocks.getMessageReports.mockResolvedValue(emptyList);
    apiMocks.getRestrictions.mockResolvedValue(emptyList);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces a message burst into the affected overview requests", async () => {
    render(<OverviewTestProvider />);
    await flushRequests();
    expectEveryOverviewRequestOnce();
    clearApiMocks();

    act(() => {
      socketHarness.emitServer("communication.chat.message.created");
      socketHarness.emitServer("communication.chat.message.updated");
      socketHarness.emitServer("communication.chat.message.deleted");
      vi.advanceTimersByTime(500);
    });
    await flushRequests();

    expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce();
    expect(apiMocks.getConversations).toHaveBeenCalledOnce();
    expect(apiMocks.getPolicy).not.toHaveBeenCalled();
    expect(apiMocks.getNotifications).not.toHaveBeenCalled();
    expect(apiMocks.getMessageReports).not.toHaveBeenCalled();
    expect(apiMocks.getRestrictions).not.toHaveBeenCalled();
  });

  it("refreshes notification resources without unrelated requests", async () => {
    render(<OverviewTestProvider />);
    await flushRequests();
    clearApiMocks();

    act(() => {
      socketHarness.emitServer("communication.notification.created");
      vi.advanceTimersByTime(500);
    });
    await flushRequests();

    expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce();
    expect(apiMocks.getNotifications).toHaveBeenCalledOnce();
    expect(apiMocks.getConversations).not.toHaveBeenCalled();
    expect(apiMocks.getPolicy).not.toHaveBeenCalled();
    expect(apiMocks.getMessageReports).not.toHaveBeenCalled();
    expect(apiMocks.getRestrictions).not.toHaveBeenCalled();
  });

  it.each([
    ["communication.notification.read", true],
    ["communication.announcement.published", false],
  ])("maps %s to its affected overview resources", async (event, refreshNotifications) => {
    render(<OverviewTestProvider />);
    await flushRequests();
    clearApiMocks();

    act(() => {
      socketHarness.emitServer(event);
      vi.advanceTimersByTime(500);
    });
    await flushRequests();

    expect(apiMocks.getAdminOverview).toHaveBeenCalledOnce();
    expect(apiMocks.getNotifications).toHaveBeenCalledTimes(
      refreshNotifications ? 1 : 0,
    );
    expect(apiMocks.getConversations).not.toHaveBeenCalled();
    expect(apiMocks.getPolicy).not.toHaveBeenCalled();
    expect(apiMocks.getMessageReports).not.toHaveBeenCalled();
    expect(apiMocks.getRestrictions).not.toHaveBeenCalled();
  });

  it("performs one full refresh after reconnect resynchronization", async () => {
    const renderedOverview = render(<OverviewTestProvider />);
    await flushRequests();
    clearApiMocks();

    renderedOverview.rerender(<OverviewTestProvider resyncVersion={1} />);
    await flushRequests();

    expectEveryOverviewRequestOnce();
  });

  it("preserves unrelated data when a targeted request fails", async () => {
    apiMocks.getConversations.mockResolvedValueOnce({ items: [], total: 7 });
    render(<OverviewTestProvider />);
    await flushRequests();
    expect(screen.getByTestId("conversation-total")).toHaveTextContent("7");
    clearApiMocks();
    apiMocks.getNotifications.mockRejectedValueOnce(new Error("offline"));

    act(() => {
      socketHarness.emitServer("communication.notification.created");
      vi.advanceTimersByTime(500);
    });
    await flushRequests();

    expect(apiMocks.getNotifications).toHaveBeenCalledOnce();
    expect(screen.getByTestId("conversation-total")).toHaveTextContent("7");
  });

  it("cancels a pending targeted refresh on unmount", async () => {
    const renderedOverview = render(<OverviewTestProvider />);
    await flushRequests();
    clearApiMocks();
    act(() => socketHarness.emitServer("communication.chat.message.created"));

    renderedOverview.unmount();
    act(() => vi.advanceTimersByTime(500));

    expect(apiMocks.getAdminOverview).not.toHaveBeenCalled();
    expect(apiMocks.getConversations).not.toHaveBeenCalled();
  });
});
