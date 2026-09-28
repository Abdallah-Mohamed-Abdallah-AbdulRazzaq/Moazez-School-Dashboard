/**
 * Tests for the useConversations hook.
 *
 * Validates: Requirements 3.1, 3.4, 3.6, 4.2, 4.3, 7.4
 * Properties: 6, 7, 9, 20
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSocket } from "../utils/mock-socket";
import { createConversation } from "../utils/test-data-generators";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { MockSocket } from "../utils/mock-socket";

// ─── Module Mocks ────────────────────────────────────────────────────────────

const mockGetConversations = vi.fn();
const mockGetMessages = vi.fn();
const mockCreateConversation = vi.fn();

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversations: (...args: unknown[]) => mockGetConversations(...args),
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  createConversation: (...args: unknown[]) => mockCreateConversation(...args),
  updateConversation: vi.fn().mockResolvedValue({ data: {} }),
  closeConversation: vi.fn().mockResolvedValue({ data: {} }),
  reopenConversation: vi.fn().mockResolvedValue({ data: {} }),
  archiveConversation: vi.fn().mockResolvedValue({ data: {} }),
}));

let mockSocket: MockSocket;
let mockResyncVersion: number;
const mockJoinConversation = vi.fn();

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    isConnected: mockSocket.connected,
    connectionError: null,
    resyncVersion: mockResyncVersion,
    joinConversation: mockJoinConversation,
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

const TEST_USER_ID = "user-test-001";
type ConversationListResponse = {
  data: { items: Conversation[]; total: number };
};

function createDeferredResponse<T>() {
  let resolve!: (response: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: TEST_USER_ID },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

// ─── Test Setup ──────────────────────────────────────────────────────────────

describe("useConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConversations.mockReset();
    mockGetMessages.mockReset();
    mockCreateConversation.mockReset();
    vi.useFakeTimers();
    mockSocket = createMockSocket();
    mockResyncVersion = 0;

    // Default: return empty conversation list
    mockGetConversations.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    mockGetMessages.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    mockCreateConversation.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Lazy import to ensure mocks are set up before module loads
  async function importHook() {
    const mod = await import(
      "@/features/communication/hooks/useConversations"
    );
    return mod.useConversations;
  }

  // ─── Property 7: Initial Fetch with Default Filters ──────────────────────

  describe("Property 7: Filter Parameters Trigger Correct API Calls", () => {
    it("loads all conversations once on mount", async () => {
      const conv1 = createConversation({ title: "Conv 1" });
      mockGetConversations.mockResolvedValue({
        data: { items: [conv1], total: 1 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledTimes(1);
      expect(mockGetConversations).toHaveBeenCalledWith({ limit: 100, page: 1 });
      expect(result.current.hasFilters).toBe(false);
    });

    it("does not fetch each conversation's messages when the conversations response includes lastMessage", async () => {
      mockGetConversations.mockResolvedValue({
        data: {
          items: [
            {
              id: "conv-with-last-message",
              type: "direct",
              status: "active",
              title: "Conversation with last message",
              lastMessageAt: "2026-05-17T13:08:13.502Z",
              lastMessage: {
                id: "msg-last",
                messageId: "msg-last",
                conversationId: "conv-with-last-message",
                senderUserId: "sender-1",
                type: "text",
                status: "sent",
                body: "trsddsa",
                content: "trsddsa",
                sentAt: "2026-05-17T13:08:13.502Z",
                createdAt: "2026-05-17T13:08:13.502Z",
                updatedAt: "2026-05-17T13:08:13.502Z",
              },
            },
          ],
          total: 1,
        },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations[0]?.lastMessage?.body).toBe("trsddsa");
      expect(result.current.conversations[0]?.lastMessage).toEqual(
        expect.objectContaining({
          id: "msg-last",
          type: "text",
          sentAt: "2026-05-17T13:08:13.502Z",
          createdAt: "2026-05-17T13:08:13.502Z",
        }),
      );
      expect(mockGetMessages).not.toHaveBeenCalled();
    });

    it("does not join listed rooms before membership is known", async () => {
      const conversation = createConversation({ id: "conv-room-1" });
      mockGetConversations.mockResolvedValue({
        data: { items: [conversation], total: 1 },
      });

      const useConversations = await importHook();
      renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockJoinConversation).not.toHaveBeenCalled();
    });

    it("does not infer actor unread state from a global message read count", async () => {
      mockGetConversations.mockResolvedValue({
        data: {
          items: [
            {
              id: "conv-unread-null",
              type: "direct",
              status: "active",
              title: "Conversation with nullable unread count",
              unreadCount: null,
              lastMessageReadCount: 0,
              lastMessage: {
                id: "msg-unread",
                messageId: "msg-unread",
                conversationId: "conv-unread-null",
                senderUserId: "other-user-1",
                status: "sent",
                body: "test",
                content: "test",
                readCount: 0,
                createdAt: "2026-05-21T15:08:20.571Z",
                updatedAt: "2026-05-21T15:08:20.571Z",
              },
            },
          ],
          total: 1,
        },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations[0]?.unreadCount).toBeUndefined();
    });

    it("does not fetch each conversation's messages when lastMessage is missing from the conversations response", async () => {
      mockGetConversations.mockResolvedValue({
        data: {
          items: [
            createConversation({
              id: "conv-without-last-message",
              title: "Conversation without last message",
            }),
          ],
          total: 1,
        },
      });

      const useConversations = await importHook();
      renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetMessages).not.toHaveBeenCalled();
    });

    it("triggers new API call with updated params when filters change", async () => {
      mockGetConversations.mockResolvedValue({
        data: { items: [], total: 0 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      // Wait for initial fetch
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      mockGetConversations.mockClear();

      // Change filters
      act(() => {
        result.current.setFilters({
          search: "hello",
          status: "closed",
          type: "classroom",
        });
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "hello",
          status: "closed",
          type: "classroom",
          limit: 100,
          page: 1,
        }),
      );
    });

    it("waits for search input to settle before loading matching conversations", async () => {
      const matchingConversation = createConversation({
        id: "conv-search-result",
        title: "Final search result",
      });
      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });
      mockGetConversations.mockClear();
      mockGetConversations.mockResolvedValue({
        data: { items: [matchingConversation], total: 1 },
      });

      act(() => {
        result.current.setFilters((current) => ({ ...current, search: "f" }));
        result.current.setFilters((current) => ({ ...current, search: "final" }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(349);
      });
      expect(mockGetConversations).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(mockGetConversations).toHaveBeenCalledTimes(1);
      expect(result.current.conversations[0]?.id).toBe("conv-search-result");
    });

    it("shares an in-flight request for the same filters", async () => {
      const initialResponse = createDeferredResponse<ConversationListResponse>();
      mockGetConversations.mockReturnValue(initialResponse.promise);

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        void result.current.refresh();
      });
      expect(mockGetConversations).toHaveBeenCalledTimes(1);

      await act(async () => {
        initialResponse.resolve({ data: { items: [], total: 0 } });
      });
    });

    it("ignores an older response after filters change", async () => {
      const initialResponse = createDeferredResponse<ConversationListResponse>();
      const filteredResponse = createDeferredResponse<ConversationListResponse>();
      mockGetConversations
        .mockReturnValueOnce(initialResponse.promise)
        .mockReturnValueOnce(filteredResponse.promise);

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      act(() => {
        result.current.setFilters((current) => ({
          ...current,
          status: "closed",
        }));
      });

      await act(async () => {
        filteredResponse.resolve({
          data: {
            items: [
              createConversation({ id: "conv-closed", status: "closed" }),
            ],
            total: 1,
          },
        });
      });
      await act(async () => {
        initialResponse.resolve({
          data: {
            items: [createConversation({ id: "conv-stale" })],
            total: 1,
          },
        });
      });

      expect(result.current.conversations.map((conversation) => conversation.id)).toEqual([
        "conv-closed",
      ]);
    });

    it("omits type and status when all filters are cleared", async () => {
      mockGetConversations.mockResolvedValue({
        data: { items: [], total: 0 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      mockGetConversations.mockClear();

      act(() => {
        result.current.setFilters({
          search: "",
          status: "closed",
          type: "group",
        });
      });
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      mockGetConversations.mockClear();

      act(() => {
        result.current.setFilters({ search: "", status: "all", type: "all" });
      });
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledWith({ limit: 100, page: 1 });
    });

    it("does not repeat the initial request for an existing resync version", async () => {
      mockResyncVersion = 3;

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
    });

    it("keeps loaded conversations visible when reconnect resync fails", async () => {
      const conversation = createConversation({ id: "conv-resync" });
      mockGetConversations.mockResolvedValueOnce({
        data: { items: [conversation], total: 1 },
      });

      const useConversations = await importHook();
      const { result, rerender } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      let rejectResync!: (reason?: unknown) => void;
      mockGetConversations.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectResync = reject;
          }),
      );
      mockResyncVersion = 1;
      rerender();
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(true);
      expect(result.current.conversations).toEqual([
        expect.objectContaining({ id: "conv-resync" }),
      ]);

      await act(async () => {
        rejectResync(new Error("Reconnect resync failed"));
      });

      expect(result.current.conversations).toEqual([
        expect.objectContaining({ id: "conv-resync" }),
      ]);
      expect(result.current.error).toBe("Reconnect resync failed");
    });
  });

  describe("server pagination", () => {
    it("replaces the current page while preserving backend order", async () => {
      const firstPage = [
        createConversation({ id: "conversation-b", lastMessageAt: "2026-01-01T00:00:00.000Z" }),
        createConversation({ id: "conversation-a", lastMessageAt: "2026-09-01T00:00:00.000Z" }),
      ];
      const secondPage = [
        createConversation({ id: "conversation-d", lastMessageAt: "2026-02-01T00:00:00.000Z" }),
        createConversation({ id: "conversation-c", lastMessageAt: "2026-10-01T00:00:00.000Z" }),
      ];
      mockGetConversations
        .mockResolvedValueOnce({ data: { items: firstPage, total: 200 } })
        .mockResolvedValueOnce({ data: { items: secondPage, total: 200 } });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await result.current.goToPage(2);
      });

      expect(mockGetConversations).toHaveBeenLastCalledWith({ limit: 100, page: 2 });
      expect(result.current.conversations.map(({ id }) => id)).toEqual([
        "conversation-d",
        "conversation-c",
      ]);
      expect(result.current.page).toBe(2);
      expect(result.current.totalPages).toBe(2);
      expect(result.current.pageSize).toBe(100);
    });

    it("keeps the successful page when navigation fails and retries the target", async () => {
      const firstPage = [createConversation({ id: "conversation-stable" })];
      const secondPage = [createConversation({ id: "conversation-retried" })];
      mockGetConversations
        .mockResolvedValueOnce({ data: { items: firstPage, total: 101 } })
        .mockRejectedValueOnce(new Error("Page failed"))
        .mockResolvedValueOnce({ data: { items: secondPage, total: 101 } });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      await act(async () => {
        await result.current.goToPage(2);
      });

      expect(result.current.page).toBe(1);
      expect(result.current.conversations.map(({ id }) => id)).toEqual([
        "conversation-stable",
      ]);
      expect(result.current.error).toBe("Page failed");

      await act(async () => {
        await result.current.retry();
      });
      expect(result.current.page).toBe(2);
      expect(result.current.conversations[0]?.id).toBe("conversation-retried");
    });

    it("refreshes the current page", async () => {
      mockGetConversations
        .mockResolvedValueOnce({ data: { items: [createConversation({ id: "conversation-page-1" })], total: 101 } })
        .mockResolvedValueOnce({ data: { items: [createConversation({ id: "conversation-page-2" })], total: 101 } })
        .mockResolvedValueOnce({ data: { items: [createConversation({ id: "conversation-page-2-fresh" })], total: 101 } });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      await act(async () => {
        await result.current.goToPage(2);
      });
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetConversations).toHaveBeenLastCalledWith({ limit: 100, page: 2 });
      expect(result.current.page).toBe(2);
      expect(result.current.conversations[0]?.id).toBe("conversation-page-2-fresh");
    });

    it("resets to an empty first page when an active filter request fails", async () => {
      const filteredConversation = createConversation({
        id: "conversation-filtered",
        status: "closed",
      });
      mockGetConversations
        .mockResolvedValueOnce({
          data: {
            items: [createConversation({ id: "conversation-page-1" })],
            total: 101,
          },
        })
        .mockResolvedValueOnce({
          data: {
            items: [createConversation({ id: "conversation-page-2" })],
            total: 101,
          },
        })
        .mockRejectedValueOnce(new Error("Filter failed"))
        .mockResolvedValueOnce({
          data: { items: [filteredConversation], total: 1 },
        });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      await act(async () => {
        await result.current.goToPage(2);
      });
      await act(async () => {
        result.current.setFilters((current) => ({
          ...current,
          status: "closed",
        }));
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenLastCalledWith({
        status: "closed",
        limit: 100,
        page: 1,
      });
      expect(result.current.conversations).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.page).toBe(1);
      expect(result.current.error).toBe("Filter failed");

      await act(async () => {
        await result.current.retry();
      });
      expect(result.current.conversations[0]?.id).toBe("conversation-filtered");
      expect(mockGetConversations).toHaveBeenLastCalledWith({
        status: "closed",
        limit: 100,
        page: 1,
      });
    });

    it("falls back to the last valid page when totals shrink", async () => {
      mockGetConversations
        .mockResolvedValueOnce({ data: { items: [createConversation({ id: "conversation-page-1" })], total: 101 } })
        .mockResolvedValueOnce({ data: { items: [], total: 50 } })
        .mockResolvedValueOnce({ data: { items: [createConversation({ id: "conversation-fallback" })], total: 50 } });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      await act(async () => {
        await result.current.goToPage(2);
      });

      expect(mockGetConversations).toHaveBeenNthCalledWith(2, { limit: 100, page: 2 });
      expect(mockGetConversations).toHaveBeenNthCalledWith(3, { limit: 100, page: 1 });
      expect(result.current.page).toBe(1);
      expect(result.current.conversations[0]?.id).toBe("conversation-fallback");
    });
  });

  // ─── Property 9: Unread Count on messageCreated ──────────────────────────

  describe("Property 9: Unread Count Correctness on Message Events", () => {
    it("increments unread count when messageCreated from another user", async () => {
      const conv = createConversation({
        id: "conv-100",
        unreadCount: 2,
      });
      mockGetConversations.mockResolvedValue({
        data: { items: [conv], total: 1 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Verify initial state
      expect(result.current.conversations[0]?.unreadCount).toBe(2);

      // Simulate messageCreated from another user
      act(() => {
        mockSocket.simulateEvent(
          "communication.chat.message.created",
          {
            conversationId: "conv-100",
            message: {
              id: "msg-new-1",
              conversationId: "conv-100",
              senderId: "other-user-999",
              body: "Hello from another user",
              status: "sent",
              createdAt: new Date().toISOString(),
            },
          },
        );
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations[0]?.unreadCount).toBe(3);
    });

    it("does NOT increment unread count when messageCreated from current user", async () => {
      const conv = createConversation({
        id: "conv-200",
        unreadCount: 1,
      });
      mockGetConversations.mockResolvedValue({
        data: { items: [conv], total: 1 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations[0]?.unreadCount).toBe(1);

      // Simulate messageCreated from the current user
      act(() => {
        mockSocket.simulateEvent(
          "communication.chat.message.created",
          {
            conversationId: "conv-200",
            message: {
              id: "msg-own-1",
              conversationId: "conv-200",
              senderId: TEST_USER_ID,
              body: "My own message",
              status: "sent",
              createdAt: new Date().toISOString(),
            },
          },
        );
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Unread count should remain unchanged
      expect(result.current.conversations[0]?.unreadCount).toBe(1);
    });
  });

  // ─── Property 20: Mark As Read ───────────────────────────────────────────

  describe("Property 20: Mark As Read on Selection", () => {
    it("sets unread count to 0 when markAsRead is called", async () => {
      const conv = createConversation({
        id: "conv-300",
        unreadCount: 5,
      });
      mockGetConversations.mockResolvedValue({
        data: { items: [conv], total: 1 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations[0]?.unreadCount).toBe(5);

      // Call markAsRead
      act(() => {
        result.current.markAsRead("conv-300");
      });

      expect(result.current.conversations[0]?.unreadCount).toBe(0);
    });
  });

  describe("Real-time page stability", () => {
    it("updates a matching row without changing response order", async () => {
      const newerTimestamp = "2025-06-01T12:00:00.000Z";
      const conv = createConversation({ id: "conv-400", unreadCount: 0 });
      const second = createConversation({ id: "conv-401", unreadCount: 0 });

      // First call returns the conversation without lastMessage
      mockGetConversations.mockResolvedValue({
        data: { items: [conv, second], total: 2 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Now simulate a real-time message that is newer
      act(() => {
        mockSocket.simulateEvent(
          "communication.chat.message.created",
          {
          conversationId: "conv-401",
            message: {
              id: "msg-realtime",
              conversationId: "conv-401",
              senderId: "other-user-123",
              body: "new body",
              status: "sent",
              createdAt: newerTimestamp,
            },
          },
        );
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.conversations.map(({ id }) => id)).toEqual([
        "conv-400",
        "conv-401",
      ]);
      expect(result.current.conversations[1]?.lastMessage?.body).toBe("new body");
    });

    it("ignores realtime events for conversations outside the current page", async () => {
      const conversation = createConversation({ id: "conv-visible" });
      mockGetConversations.mockResolvedValue({
        data: { items: [conversation], total: 101 },
      });

      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      mockGetConversations.mockClear();
      act(() => {
        mockSocket.simulateEvent("communication.chat.message.created", {
          conversationId: "conv-outside-page",
          message: {
            id: "msg-outside",
            conversationId: "conv-outside-page",
            senderId: "other-user-123",
            body: "outside",
            status: "sent",
            createdAt: "2026-09-28T12:00:00.000Z",
          },
        });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(result.current.conversations.map(({ id }) => id)).toEqual([
        "conv-visible",
      ]);
      expect(mockGetConversations).not.toHaveBeenCalled();
    });
  });

  describe("error boundaries", () => {
    it("exposes list loading failures", async () => {
      mockGetConversations.mockRejectedValue(new Error("List failed"));
      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.error).toBe("List failed");
    });

    it("keeps creation failures out of the list loading error", async () => {
      const conversation = createConversation({ id: "conv-existing" });
      mockGetConversations.mockResolvedValue({
        data: { items: [conversation], total: 1 },
      });
      mockCreateConversation.mockRejectedValue(new Error("Create failed"));
      const useConversations = await importHook();
      const { result } = renderHook(() => useConversations());
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await act(async () => {
        await expect(
          result.current.create({ title: "New conversation" }),
        ).rejects.toThrow("Create failed");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.conversations.map(({ id }) => id)).toEqual([
        "conv-existing",
      ]);
    });
  });
});
