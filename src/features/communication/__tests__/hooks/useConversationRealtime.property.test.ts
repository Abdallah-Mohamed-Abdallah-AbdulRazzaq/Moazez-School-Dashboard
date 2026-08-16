/**
 * Property-based test: Socket Lifecycle Management (Property 26)
 *
 * **Validates: Requirements 11.1, 11.2, 11.3**
 *
 * For any conversation ID:
 * - joinConversation is called with that exact ID on mount (when connected)
 * - onReconnect is called when resyncVersion increments
 * - leaveConversation is called with that exact ID on unmount
 * - All socket listeners are cleaned up after unmount
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { renderHook } from "@testing-library/react";
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

function createHandlers(conversationId: string) {
  return {
    conversationId,
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

/** Reset all shared mock state before each property iteration */
function resetMocks() {
  mockSocket = createMockSocket();
  mockIsConnected = true;
  mockResyncVersion = 0;
  mockJoinConversation.mockClear();
  mockLeaveConversation.mockClear();
}

// All socket events that the hook registers listeners for
const REGISTERED_EVENTS = [
  COMMUNICATION_SOCKET_EVENTS.messageCreated,
  COMMUNICATION_SOCKET_EVENTS.messageUpdated,
  COMMUNICATION_SOCKET_EVENTS.messageDeleted,
  COMMUNICATION_SOCKET_EVENTS.messageRead,
  COMMUNICATION_SOCKET_EVENTS.reactionUpserted,
  COMMUNICATION_SOCKET_EVENTS.reactionDeleted,
  COMMUNICATION_SOCKET_EVENTS.attachmentLinked,
  COMMUNICATION_SOCKET_EVENTS.attachmentDeleted,
  COMMUNICATION_SOCKET_EVENTS.announcementPublished,
  COMMUNICATION_SOCKET_EVENTS.typingStarted,
  COMMUNICATION_SOCKET_EVENTS.typingStopped,
  COMMUNICATION_SOCKET_EVENTS.presenceUserUpdated,
];

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 26: Socket Lifecycle Management", () => {
  beforeEach(() => {
    resetMocks();
  });

  it.prop([fc.uuid()])(
    "joinConversation is called with the exact conversation ID on mount",
    (conversationId) => {
      resetMocks();
      const handlers = createHandlers(conversationId);

      renderHook(() => useConversationRealtime(handlers));

      expect(mockJoinConversation).toHaveBeenCalledWith(conversationId);
      expect(mockJoinConversation).toHaveBeenCalledTimes(1);
    }
  );

  it.prop([fc.uuid()])(
    "onReconnect is called when resyncVersion increments",
    (conversationId) => {
      resetMocks();
      const handlers = createHandlers(conversationId);

      const { rerender } = renderHook(() => useConversationRealtime(handlers));

      // Initial render with resyncVersion=0 should NOT call onReconnect
      expect(handlers.onReconnect).not.toHaveBeenCalled();

      // Simulate resyncVersion increment
      mockResyncVersion = 1;
      rerender();

      expect(handlers.onReconnect).toHaveBeenCalledTimes(1);
    }
  );

  it.prop([fc.uuid()])(
    "leaveConversation is called with the exact conversation ID on unmount",
    (conversationId) => {
      resetMocks();
      const handlers = createHandlers(conversationId);

      const { unmount } = renderHook(() => useConversationRealtime(handlers));

      // leaveConversation should not be called before unmount
      expect(mockLeaveConversation).not.toHaveBeenCalled();

      unmount();

      expect(mockLeaveConversation).toHaveBeenCalledWith(conversationId);
      expect(mockLeaveConversation).toHaveBeenCalledTimes(1);
    }
  );

  it.prop([fc.uuid()])(
    "all socket listeners are cleaned up after unmount",
    (conversationId) => {
      resetMocks();
      const handlers = createHandlers(conversationId);

      const { unmount } = renderHook(() => useConversationRealtime(handlers));

      // Verify listeners were registered during mount
      for (const event of REGISTERED_EVENTS) {
        expect(mockSocket.getListeners(event).size).toBeGreaterThan(0);
      }

      unmount();

      // Verify all listeners are removed after unmount
      for (const event of REGISTERED_EVENTS) {
        expect(mockSocket.getListeners(event).size).toBe(0);
      }
    }
  );

  it.prop([fc.uuid()])(
    "full lifecycle: join → resync → leave + cleanup for any conversation ID",
    (conversationId) => {
      resetMocks();
      const handlers = createHandlers(conversationId);

      // Mount: join + register listeners
      const { rerender, unmount } = renderHook(() =>
        useConversationRealtime(handlers)
      );

      // (a) joinConversation called with exact ID
      expect(mockJoinConversation).toHaveBeenCalledWith(conversationId);
      expect(mockJoinConversation).toHaveBeenCalledTimes(1);

      // (b) resyncVersion increment triggers onReconnect
      mockResyncVersion = 1;
      rerender();
      expect(handlers.onReconnect).toHaveBeenCalledTimes(1);

      // (c) unmount: leaveConversation called + listeners cleaned up
      unmount();
      expect(mockLeaveConversation).toHaveBeenCalledWith(conversationId);

      for (const event of REGISTERED_EVENTS) {
        expect(mockSocket.getListeners(event).size).toBe(0);
      }
    }
  );
});
