/**
 * Tests for useTypingIndicator hook.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 * Properties: 12 (Typing Indicator Round-Trip)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockStartTyping = vi.fn();
const mockStopTyping = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "current-user-id" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    startTyping: mockStartTyping,
    stopTyping: mockStopTyping,
  }),
}));

import { useTypingIndicator } from "../../hooks/useTypingIndicator";

describe("useTypingIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const CONVERSATION_ID = "conv-123";

  describe("handleTypingStarted - adds user to typing list (Property 12)", () => {
    it("adds a user to the typing list when typingStarted payload is received", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          userId: "user-abc",
          actor: { id: "user-abc", name: "Alice" },
        });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: "user-abc", name: "Alice" },
      ]);
    });

    it("uses the backend actor displayName field", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          userId: "user-abc",
          actor: { userId: "user-abc", displayName: "Alice Backend" },
        });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: "user-abc", name: "Alice Backend" },
      ]);
    });

    it("adds multiple users to the typing list", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1", name: "Alice" },
        });
      });

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-2", name: "Bob" },
        });
      });

      expect(result.current.typingUsers).toHaveLength(2);
      expect(result.current.typingUsers).toContainEqual({
        userId: "user-1",
        name: "Alice",
      });
      expect(result.current.typingUsers).toContainEqual({
        userId: "user-2",
        name: "Bob",
      });
    });

    it("removes a remote typing user when the backend expiry is reached", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));
      const expiresAt = new Date(Date.now() + 2_000).toISOString();

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1", name: "Alice" },
          expiresAt,
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1_999);
      });
      expect(result.current.typingUsers).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.typingUsers).toEqual([]);
    });

    it("ignores typing events from the current user", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          userId: "current-user-id",
          actor: { id: "current-user-id", name: "Me" },
        });
      });

      expect(result.current.typingUsers).toEqual([]);
    });

    it("ignores typing events for a different conversation", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: "other-conv",
          actor: { id: "user-1", name: "Alice" },
        });
      });

      expect(result.current.typingUsers).toEqual([]);
    });

    it("ignores invalid (non-object) payloads", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted(null);
        result.current.handleTypingStarted(undefined);
        result.current.handleTypingStarted("invalid");
      });

      expect(result.current.typingUsers).toEqual([]);
    });
  });

  describe("handleTypingStopped - removes user from typing list (Property 12)", () => {
    it("removes a user from the typing list when typingStopped payload is received", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      // First add a user
      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-abc", name: "Alice" },
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      // Then stop typing
      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          userId: "user-abc",
        });
      });

      expect(result.current.typingUsers).toEqual([]);
    });

    it("only removes the specified user, leaving others in the list", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1", name: "Alice" },
        });
      });

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-2", name: "Bob" },
        });
      });

      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          userId: "user-1",
        });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: "user-2", name: "Bob" },
      ]);
    });

    it("ignores stop events for a different conversation", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1", name: "Alice" },
        });
      });

      act(() => {
        result.current.handleTypingStopped({
          conversationId: "other-conv",
          userId: "user-1",
        });
      });

      expect(result.current.typingUsers).toHaveLength(1);
    });

    it("handles stop event with actor.id format", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1", name: "Alice" },
        });
      });

      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          actor: { id: "user-1" },
        });
      });

      expect(result.current.typingUsers).toEqual([]);
    });
  });

  describe("emitTyping - emits socket event (Requirement 5.3)", () => {
    it("calls startTyping on the socket with the conversation ID", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.emitTyping();
      });

      expect(mockStartTyping).toHaveBeenCalledWith(CONVERSATION_ID);
    });

    it("only emits startTyping once for rapid consecutive calls (debounce)", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.emitTyping();
        result.current.emitTyping();
        result.current.emitTyping();
      });

      // startTyping should only be called once since isTypingRef is already true
      expect(mockStartTyping).toHaveBeenCalledTimes(1);
    });

    it("emits stopTyping after the debounce timeout (1500ms)", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.emitTyping();
      });

      expect(mockStopTyping).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockStopTyping).toHaveBeenCalledWith(CONVERSATION_ID);
    });

    it("does not emit if conversationId is empty", () => {
      const { result } = renderHook(() => useTypingIndicator(""));

      act(() => {
        result.current.emitTyping();
      });

      expect(mockStartTyping).not.toHaveBeenCalled();
    });
  });

  describe("stopOwnTyping - emits stop event (Requirement 5.3)", () => {
    it("calls stopTyping on the socket when user was typing", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      // Start typing first
      act(() => {
        result.current.emitTyping();
      });

      mockStopTyping.mockClear();

      // Then explicitly stop
      act(() => {
        result.current.stopOwnTyping();
      });

      expect(mockStopTyping).toHaveBeenCalledWith(CONVERSATION_ID);
    });

    it("does not emit stopTyping if user was not typing", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.stopOwnTyping();
      });

      expect(mockStopTyping).not.toHaveBeenCalled();
    });

    it("clears the debounce timer when stopOwnTyping is called", () => {
      const { result } = renderHook(() => useTypingIndicator(CONVERSATION_ID));

      act(() => {
        result.current.emitTyping();
      });

      mockStopTyping.mockClear();

      act(() => {
        result.current.stopOwnTyping();
      });

      // stopTyping called once from stopOwnTyping
      expect(mockStopTyping).toHaveBeenCalledTimes(1);

      // Advancing timers should NOT trigger another stopTyping
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockStopTyping).toHaveBeenCalledTimes(1);
    });
  });
});
