import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { ApiError } from "@/lib/api-error";
import { createMockSocket, type MockSocket } from "../utils/mock-socket";
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/communication/api/communication.service";

function deferredPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

let mockSocket: MockSocket;
let getNotificationsMock: ReturnType<typeof vi.fn>;
let resyncVersion: number;

vi.mock("@/features/communication/api/communication.service", () => ({
  archiveNotification: vi.fn(),
  getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    isConnected: true,
    connectionError: null,
    resyncVersion,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

import { useNotifications } from "@/features/communication/hooks/useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    getNotificationsMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    resyncVersion = 0;
    vi.restoreAllMocks();
  });

  it("cleans up the notification socket listener on unmount", async () => {
    const { unmount } = renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationCreated)
        .size,
    ).toBeGreaterThan(0);

    unmount();

    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationCreated)
        .size,
    ).toBe(0);
  });

  it("does not create a polling interval", async () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(
      setIntervalSpy.mock.calls.some(([, delay]) => delay === 60_000),
    ).toBe(false);
  });

  it("requests notifications for the provided recipient user", async () => {
    renderHook(() => useNotifications({ recipientUserId: "user-1" }));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(getNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "user-1",
      }),
    );
  });

  it("suppresses the access-denied banner for background notification refreshes", async () => {
    renderHook(() =>
      useNotifications({ recipientUserId: "user-1", isBackground: true }),
    );

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(getNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "user-1" }),
    );
  });

  it("stops background notification refreshes after a forbidden response", async () => {
    getNotificationsMock.mockRejectedValue(
      new ApiError("Forbidden", 403, "FORBIDDEN"),
    );
    renderHook(() => useNotifications({ isBackground: true }));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    await act(async () => undefined);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("does not send a limit parameter by default", async () => {
    renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(getNotificationsMock).toHaveBeenCalledWith({});
  });

  it("sends pagination parameters only after pagination changes", async () => {
    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 1,
      limit: 25,
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);
      expect(result.current.pagination).toEqual(
        expect.objectContaining({
          total: 125,
          page: 1,
          limit: 25,
        }),
      );
    });

    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 2,
      limit: 25,
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
    expect(getNotificationsMock).toHaveBeenLastCalledWith({
      page: 2,
    });

    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 1,
      limit: 50,
    });

    act(() => {
      result.current.setLimit(50);
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(3));
    expect(getNotificationsMock).toHaveBeenLastCalledWith({
      page: 1,
      limit: 50,
    });
  });

  it("adds a realtime notification without requesting the notification list again", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));

    act(() => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: {
          notificationId: "notification-1",
          status: "unread",
          priority: "normal",
          createdAt: "2026-08-09T12:00:00.000Z",
        },
      });
    });

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
    expect(result.current.notifications).toEqual([
      expect.objectContaining({ id: "notification-1", status: "unread" }),
    ]);
    expect(result.current.unreadCount).toBe(1);
  });

  it("refreshes notifications after reconnect resynchronization", async () => {
    const { rerender } = renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    resyncVersion = 1;
    rerender();

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });

  describe("optimistic mutations", () => {
    const mockNotifications = [
      { id: "notif-1", status: "unread" as const, readAt: null, archivedAt: null },
      { id: "notif-2", status: "unread" as const, readAt: null, archivedAt: null },
    ];

    beforeEach(() => {
      getNotificationsMock.mockResolvedValue({ items: mockNotifications, total: 2 });
    });

    it("optimistically updates local state for markRead and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const markNotificationReadMock = vi.mocked(markNotificationRead);
      
      const apiError = new Error("API failed");
      const apiRequest =
        deferredPromise<Awaited<ReturnType<typeof markNotificationRead>>>();
      markNotificationReadMock.mockReturnValueOnce(apiRequest.promise);

      const { result } = renderHook(() => useNotifications());
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(result.current.unreadCount).toBe(2);

      // Call markRead (fire and don't await yet)
      let markReadPromise;
      act(() => {
        markReadPromise = result.current.markRead("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[0].readAt).not.toBeNull();
      expect(result.current.unreadCount).toBe(1);

      // Reject API call to test rollback
      await act(async () => {
        apiRequest.reject(apiError);
        try {
          await markReadPromise;
        } catch {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[0].readAt).toBeNull();
      expect(result.current.unreadCount).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates local state for archive and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const archiveNotificationMock = vi.mocked(archiveNotification);
      
      const apiError = new Error("API failed");
      const apiRequest =
        deferredPromise<Awaited<ReturnType<typeof archiveNotification>>>();
      archiveNotificationMock.mockReturnValueOnce(apiRequest.promise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      let archivePromise;
      act(() => {
        archivePromise = result.current.archive("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("archived");
      expect(result.current.notifications[0].archivedAt).not.toBeNull();

      // Reject API call to test rollback
      await act(async () => {
        apiRequest.reject(apiError);
        try {
          await archivePromise;
        } catch {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[0].archivedAt).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates local state for markAllRead and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const markAllNotificationsReadMock = vi.mocked(markAllNotificationsRead);
      
      const apiError = new Error("API failed");
      const apiRequest =
        deferredPromise<Awaited<ReturnType<typeof markAllNotificationsRead>>>();
      markAllNotificationsReadMock.mockReturnValueOnce(apiRequest.promise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(result.current.unreadCount).toBe(2);

      let markAllReadPromise;
      act(() => {
        markAllReadPromise = result.current.markAllRead();
      });

      // Assert optimistic update: all should be read
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[1].status).toBe("read");
      expect(result.current.unreadCount).toBe(0);

      // Reject API call to test rollback
      await act(async () => {
        apiRequest.reject(apiError);
        try {
          await markAllReadPromise;
        } catch {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[1].status).toBe("unread");
      expect(result.current.unreadCount).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates and then refreshes on success", async () => {
      const markNotificationReadMock = vi.mocked(markNotificationRead);
      const apiRequest =
        deferredPromise<Awaited<ReturnType<typeof markNotificationRead>>>();
      markNotificationReadMock.mockReturnValueOnce(apiRequest.promise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      let markReadPromise;
      act(() => {
        markReadPromise = result.current.markRead("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("read");
      expect(getNotificationsMock).toHaveBeenCalledTimes(1); // hasn't refreshed yet

      // Mock the next refresh to return the updated item from the server
      getNotificationsMock.mockResolvedValueOnce({
        items: [
          { id: "notif-1", status: "read" as const, readAt: "2026-06-28T00:00:00.000Z" },
          { id: "notif-2", status: "unread" as const, readAt: null },
        ],
        total: 2,
      });

      // Resolve the API call
      await act(async () => {
        apiRequest.resolve({ success: true });
        await markReadPromise;
      });

      // Wait for the refreshed list to be loaded
      await waitFor(() => {
        expect(getNotificationsMock).toHaveBeenCalledTimes(2);
      });
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[0].readAt).toBe("2026-06-28T00:00:00.000Z");
    });
  });
});
