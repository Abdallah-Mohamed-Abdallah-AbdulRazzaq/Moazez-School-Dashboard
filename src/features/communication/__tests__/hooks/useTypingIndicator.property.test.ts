/**
 * Property-based test: Typing Indicator Round-Trip (Property 12)
 *
 * **Validates: Requirements 5.1, 5.2**
 *
 * For any typingStarted event followed by a typingStopped event for the same user:
 * - The typing indicator SHALL first display the user's name (user appears in typingUsers)
 * - Then remove it (user disappears from typingUsers)
 * - At no point SHALL a user appear in the typing list after their typingStopped event is processed
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { renderHook, act } from "@testing-library/react";

// ─── Mock State ──────────────────────────────────────────────────────────────

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

// ─── Import after mock ───────────────────────────────────────────────────────

import { useTypingIndicator } from "@/features/communication/hooks/useTypingIndicator";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generate a user ID that is NOT the current user */
const otherUserIdArb = fc
  .uuid()
  .filter((id) => id !== "current-user-id");

/** Generate a non-empty, non-whitespace-only user display name.
 * The hook's stringValue helper trims and rejects whitespace-only strings,
 * so we filter to names that have at least one non-whitespace character. */
const userNameArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 12: Typing Indicator Round-Trip", () => {
  const CONVERSATION_ID = "conv-property-test";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.prop([otherUserIdArb, userNameArb])(
    "typingStarted adds user to typingUsers, typingStopped removes them",
    (userId, name) => {
      const { result } = renderHook(() =>
        useTypingIndicator(CONVERSATION_ID)
      );

      // Initially no one is typing
      expect(result.current.typingUsers).toHaveLength(0);

      // Simulate typingStarted for the generated user
      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: userId, name },
        });
      });

      // User should appear in the typing list
      expect(result.current.typingUsers).toContainEqual({
        userId,
        name,
      });
      expect(
        result.current.typingUsers.some((u) => u.userId === userId)
      ).toBe(true);

      // Simulate typingStopped for the same user
      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          userId,
        });
      });

      // User should no longer be in the typing list
      expect(
        result.current.typingUsers.some((u) => u.userId === userId)
      ).toBe(false);
      expect(result.current.typingUsers).not.toContainEqual(
        expect.objectContaining({ userId })
      );
    }
  );

  it.prop([otherUserIdArb, userNameArb])(
    "after typingStopped, user NEVER appears in the typing list regardless of payload format",
    (userId, name) => {
      const { result } = renderHook(() =>
        useTypingIndicator(CONVERSATION_ID)
      );

      // Start typing
      act(() => {
        result.current.handleTypingStarted({
          conversationId: CONVERSATION_ID,
          actor: { id: userId, name },
        });
      });

      // Stop typing using actor.id format
      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          actor: { id: userId },
        });
      });

      // User must not appear in typing list after stop
      expect(
        result.current.typingUsers.some((u) => u.userId === userId)
      ).toBe(false);

      // Additional typingStopped should be idempotent (no error, still absent)
      act(() => {
        result.current.handleTypingStopped({
          conversationId: CONVERSATION_ID,
          userId,
        });
      });

      expect(
        result.current.typingUsers.some((u) => u.userId === userId)
      ).toBe(false);
    }
  );
});
