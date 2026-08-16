/**
 * Tests for useConversationRealtime hook.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.5
 *
 * Covers:
 * - joinConversation called on mount when connected
 * - leaveConversation called on unmount (Property 26)
 * - Socket events only dispatched for matching conversation ID
 * - onReconnect called when resyncVersion increments (Property 26)
 * - Disconnect/reconnect triggers full data refresh
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSocket, type MockSocket } from "../utils/mock-socket";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";

// ─── Mock State ──────────────────────────────────────────────────────────────

let mockSocket: MockSocket;
let mockIsConnected: boolean;
let mockResyncVersion: number;
const mockJoinConversation = vi.fn();
const mockLeaveConversation = vi.fn();

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    isConnected: mockIsConnected,
    connectionError: null,
    resyncVersion: mockResyncVersion,
    joinConversation: mockJoinConversation,
    leaveConversation: mockLeaveConversation,
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

// ─── Import after mock ───────────────────────────────────────────────────────

import { useConversationRealtime } from "@/features/communication/hooks/useConversationRealtime";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDefaultHandlers() {
  return {
    conversationId: "conv-123",
    onMessageCreated: vi.fn(),
    onMessageUpdated: vi.fn(),
    onMessageDeleted: vi.fn(),
    onMessageRead: vi.fn(),
    onReactionUpserted: vi.fn(),
    onReactionDeleted: vi.fn(),
    onAttachmentLinked: vi.fn(),
    onAttachmentDeleted: vi.fn(),
    onAnnouncementPublished: vi.fn(),
    onTypingStarted: vi.fn(),
    onTypingStopped: vi.fn(),
    onPresenceUpdated: vi.fn(),
    onReconnect: vi.fn(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useConversationRealtime", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIsConnected = true;
    mockResyncVersion = 0;
    mockJoinConversation.mockClear();
    mockLeaveConversation.mockClear();
  });

  describe("joinConversation on mount", () => {
    it("calls joinConversation with the conversation ID when connected", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      expect(mockJoinConversation).toHaveBeenCalledWith("conv-123");
      expect(mockJoinConversation).toHaveBeenCalledTimes(1);
    });

    it("does NOT call joinConversation when not connected", () => {
      mockIsConnected = false;
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      expect(mockJoinConversation).not.toHaveBeenCalled();
    });

    it("waits for room authorization before joining or dispatching events", () => {
      const handlers = createDefaultHandlers();
      const { rerender } = renderHook(
        ({ enabled }) => useConversationRealtime({ ...handlers, enabled }),
        { initialProps: { enabled: false } },
      );

      expect(mockJoinConversation).not.toHaveBeenCalled();
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
          conversationId: "conv-123",
        });
      });
      expect(handlers.onMessageCreated).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(mockJoinConversation).toHaveBeenCalledWith("conv-123");
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
          conversationId: "conv-123",
        });
      });
      expect(handlers.onMessageCreated).toHaveBeenCalledTimes(1);
    });
  });

  describe("leaveConversation on unmount (Property 26)", () => {
    it("calls leaveConversation with the conversation ID on unmount", () => {
      const handlers = createDefaultHandlers();

      const { unmount } = renderHook(() => useConversationRealtime(handlers));

      expect(mockLeaveConversation).not.toHaveBeenCalled();

      unmount();

      expect(mockLeaveConversation).toHaveBeenCalledWith("conv-123");
      expect(mockLeaveConversation).toHaveBeenCalledTimes(1);
    });

    it("removes all socket event listeners on unmount", () => {
      const handlers = createDefaultHandlers();

      const { unmount } = renderHook(() => useConversationRealtime(handlers));

      // Verify listeners were registered
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.messageCreated).size
      ).toBeGreaterThan(0);

      unmount();

      // Verify all listeners are cleaned up
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.messageCreated).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.messageUpdated).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.messageDeleted).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.messageRead).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.reactionUpserted).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.reactionDeleted).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.attachmentLinked).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.attachmentDeleted).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.announcementPublished)
          .size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.typingStarted).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.typingStopped).size
      ).toBe(0);
      expect(
        mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated)
          .size
      ).toBe(0);
    });
  });

  describe("socket events only dispatched for matching conversation ID", () => {
    it("dispatches messageCreated when payload matches conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      const payload = { conversationId: "conv-123", message: { id: "msg-1", body: "Hello" } };
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, payload);
      });

      expect(handlers.onMessageCreated).toHaveBeenCalledWith(payload);
    });

    it("does NOT dispatch messageCreated when payload has a different conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      const payload = { conversationId: "conv-other", message: { id: "msg-2", body: "Hi" } };
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, payload);
      });

      expect(handlers.onMessageCreated).not.toHaveBeenCalled();
    });

    it("dispatches messageUpdated only for matching conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      // Matching
      const matchingPayload = { conversationId: "conv-123", message: { id: "msg-1", body: "Updated" } };
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageUpdated, matchingPayload);
      });
      expect(handlers.onMessageUpdated).toHaveBeenCalledWith(matchingPayload);

      // Non-matching
      const nonMatchingPayload = { conversationId: "conv-456", message: { id: "msg-2", body: "Other" } };
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageUpdated, nonMatchingPayload);
      });
      expect(handlers.onMessageUpdated).toHaveBeenCalledTimes(1);
    });

    it("dispatches messageDeleted only for matching conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageDeleted, {
          conversationId: "conv-123",
          message: { id: "msg-1" },
        });
      });
      expect(handlers.onMessageDeleted).toHaveBeenCalledTimes(1);

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageDeleted, {
          conversationId: "conv-other",
          message: { id: "msg-2" },
        });
      });
      expect(handlers.onMessageDeleted).toHaveBeenCalledTimes(1);
    });

    it("dispatches reaction events only for matching conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      const matchingPayload = {
        conversationId: "conv-123",
        reaction: { id: "reaction-1", messageId: "msg-1" },
      };
      act(() => {
        mockSocket.simulateEvent(
          COMMUNICATION_SOCKET_EVENTS.reactionUpserted,
          matchingPayload,
        );
      });
      expect(handlers.onReactionUpserted).toHaveBeenCalledWith(matchingPayload);

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.reactionDeleted, {
          conversationId: "conv-other",
          reaction: { id: "reaction-2", messageId: "msg-2" },
        });
      });
      expect(handlers.onReactionDeleted).not.toHaveBeenCalled();
    });

    it("dispatches attachment events only for matching conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      const matchingPayload = {
        conversationId: "conv-123",
        attachment: { id: "attachment-1", messageId: "msg-1" },
      };
      act(() => {
        mockSocket.simulateEvent(
          COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
          matchingPayload,
        );
      });
      expect(handlers.onAttachmentLinked).toHaveBeenCalledWith(matchingPayload);

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.attachmentDeleted, {
          conversationId: "conv-other",
          attachment: { id: "attachment-2", messageId: "msg-2" },
        });
      });
      expect(handlers.onAttachmentDeleted).not.toHaveBeenCalled();
    });

    it("dispatches announcement published events without conversation filtering", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      const payload = { announcement: { id: "announcement-1" } };
      act(() => {
        mockSocket.simulateEvent(
          COMMUNICATION_SOCKET_EVENTS.announcementPublished,
          payload,
        );
      });

      expect(handlers.onAnnouncementPublished).toHaveBeenCalledWith(payload);
    });

    it("dispatches typingStarted only for matching conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.typingStarted, {
          conversationId: "conv-123",
          userId: "user-1",
        });
      });
      expect(handlers.onTypingStarted).toHaveBeenCalledTimes(1);

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.typingStarted, {
          conversationId: "conv-other",
          userId: "user-2",
        });
      });
      expect(handlers.onTypingStarted).toHaveBeenCalledTimes(1);
    });

    it("always dispatches presenceUpdated regardless of conversation ID", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated, {
          userId: "user-1",
          status: "online",
        });
      });
      expect(handlers.onPresenceUpdated).toHaveBeenCalledTimes(1);
    });

    it("dispatches event when payload has no conversationId (fallback behavior)", () => {
      const handlers = createDefaultHandlers();

      renderHook(() => useConversationRealtime(handlers));

      // Payload without conversationId should be dispatched (fallback: no ID means it applies)
      const payload = { message: { id: "msg-1", body: "No conv ID" } };
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, payload);
      });

      expect(handlers.onMessageCreated).toHaveBeenCalledWith(payload);
    });
  });

  describe("onReconnect called when resyncVersion increments (Property 26)", () => {
    it("calls onReconnect when resyncVersion changes from 0 to 1", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      // Initial render with resyncVersion=0 should NOT call onReconnect
      expect(handlers.onReconnect).not.toHaveBeenCalled();

      // Simulate resyncVersion increment
      mockResyncVersion = 1;
      rerender();

      expect(handlers.onReconnect).toHaveBeenCalledTimes(1);
    });

    it("calls onReconnect each time resyncVersion increments", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      mockResyncVersion = 1;
      rerender();
      expect(handlers.onReconnect).toHaveBeenCalledTimes(1);

      mockResyncVersion = 2;
      rerender();
      expect(handlers.onReconnect).toHaveBeenCalledTimes(2);
    });

    it("does NOT call onReconnect when resyncVersion stays at 0", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      rerender();
      rerender();

      expect(handlers.onReconnect).not.toHaveBeenCalled();
    });
  });

  describe("disconnect/reconnect triggers full data refresh", () => {
    it("triggers onReconnect after disconnect and reconnect cycle via resyncVersion", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      // Simulate disconnect
      mockIsConnected = false;
      rerender();

      // onReconnect should not be called on disconnect
      expect(handlers.onReconnect).not.toHaveBeenCalled();

      // Simulate reconnect: isConnected goes back to true and resyncVersion increments
      mockIsConnected = true;
      mockResyncVersion = 1;
      rerender();

      // onReconnect should be called to trigger full data refresh
      expect(handlers.onReconnect).toHaveBeenCalledTimes(1);
    });

    it("re-joins conversation after reconnection", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      // Initial join
      expect(mockJoinConversation).toHaveBeenCalledTimes(1);

      // Simulate disconnect
      mockIsConnected = false;
      rerender();

      // Simulate reconnect
      mockIsConnected = true;
      rerender();

      // joinConversation should be called again after reconnection
      expect(mockJoinConversation).toHaveBeenCalledTimes(2);
      expect(mockJoinConversation).toHaveBeenLastCalledWith("conv-123");
    });

    it("leaveConversation is called during disconnect cleanup", () => {
      const handlers = createDefaultHandlers();

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      // Simulate disconnect - the effect cleanup should call leaveConversation
      mockIsConnected = false;
      rerender();

      expect(mockLeaveConversation).toHaveBeenCalledWith("conv-123");
    });
  });
});
