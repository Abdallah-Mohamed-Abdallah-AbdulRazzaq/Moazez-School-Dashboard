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
import type { MockSocket } from "../utils/mock-socket";

// ─── Module Mocks ────────────────────────────────────────────────────────────

const mockGetConversations = vi.fn();
const mockGetMessages = vi.fn();

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversations: (...args: unknown[]) => mockGetConversations(...args),
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  createConversation: vi.fn().mockResolvedValue({ data: {} }),
  updateConversation: vi.fn().mockResolvedValue({ data: {} }),
  closeConversation: vi.fn().mockResolvedValue({ data: {} }),
  reopenConversation: vi.fn().mockResolvedValue({ data: {} }),
  archiveConversation: vi.fn().mockResolvedValue({ data: {} }),
}));

let mockSocket: MockSocket;
const mockJoinConversation = vi.fn();

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    isConnected: mockSocket.connected,
    connectionError: null,
    resyncVersion: 0,
    joinConversation: mockJoinConversation,
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

const TEST_USER_ID = "user-test-001";

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
    vi.useFakeTimers();
    mockSocket = createMockSocket();

    // Default: return empty conversation list
    mockGetConversations.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    mockGetMessages.mockResolvedValue({
      data: { items: [], total: 0 },
    });
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
    it("calls getConversations with default filters on mount", async () => {
      const conv1 = createConversation({ title: "Conv 1" });
      mockGetConversations.mockResolvedValue({
        data: { items: [conv1], total: 1 },
      });

      const useConversations = await importHook();
      renderHook(() => useConversations());

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledWith({
        status: "active",
        limit: 20,
        page: 1,
      });
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
          limit: 20,
          page: 1,
        }),
      );
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
        result.current.setFilters({ search: "", status: "all", type: "all" });
      });
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockGetConversations).toHaveBeenCalledWith({ limit: 20, page: 1 });
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

  // ─── Property 6: Enrichment Preserves Newer Real-Time Data ───────────────

  describe("Property 6: Real-time Last Message Preservation", () => {
    it("preserves newer real-time lastMessage when a refresh response has no lastMessage", async () => {
      const newerTimestamp = "2025-06-01T12:00:00.000Z";
      const conv = createConversation({
        id: "conv-400",
        unreadCount: 0,
      });

      // First call returns the conversation without lastMessage
      mockGetConversations.mockResolvedValue({
        data: { items: [conv], total: 1 },
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
            conversationId: "conv-400",
            message: {
              id: "msg-realtime",
              conversationId: "conv-400",
              senderId: "other-user-123",
              body: "Newer real-time message",
              status: "sent",
              createdAt: newerTimestamp,
            },
          },
        );
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // The lastMessage should be the newer real-time one
      const conversation = result.current.conversations[0];
      expect(conversation?.lastMessage?.body).toBe("Newer real-time message");
      expect(conversation?.lastMessage?.createdAt).toBe(newerTimestamp);

      // Now trigger a refresh that would re-run enrichment with older data
      mockGetConversations.mockResolvedValue({
        data: { items: [{ ...conv }], total: 1 },
      });

      await act(async () => {
        await result.current.refresh();
        await vi.runAllTimersAsync();
      });

      // The newer real-time lastMessage should be preserved (not overwritten by enrichment)
      const afterRefresh = result.current.conversations[0];
      expect(afterRefresh?.lastMessage?.body).toBe("Newer real-time message");
      expect(afterRefresh?.lastMessage?.createdAt).toBe(newerTimestamp);
      expect(mockGetMessages).not.toHaveBeenCalled();
    });
  });
});
