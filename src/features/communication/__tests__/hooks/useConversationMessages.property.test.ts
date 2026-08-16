/**
 * Property-based tests for useConversationMessages hook.
 *
 * **Validates: Requirements 4.4**
 *
 * Property 10: Message Update Preserves Order
 * For any messageUpdated payload, verify body updates in place and sort order is unchanged.
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { test as fcTest, fc } from "@fast-check/vitest";
import { messageArb } from "../utils/test-data-generators";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const apiMocks = vi.hoisted(() => ({
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
  markConversationRead: vi.fn(),
  markMessageRead: vi.fn(),
  getConversationReadSummary: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);
vi.mock("@/hooks/use-auth", () => authMock);

// ─── Import Hook Under Test ─────────────────────────────────────────────────

import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";

// ─── Test Setup ─────────────────────────────────────────────────────────────

const TEST_CONVERSATION_ID = "conv-prop-test-001";
const TEST_USER_ID = "user-prop-test-001";

function setupDefaultMocks() {
  authMock.useAuth.mockReturnValue({
    user: {
      id: TEST_USER_ID,
      firstName: "Test",
      lastName: "User",
    },
    isAuthenticated: true,
  });

  apiMocks.getMessages.mockResolvedValue({ data: { items: [], total: 0 } });
  apiMocks.sendMessage.mockResolvedValue({ data: {} });
  apiMocks.updateMessage.mockResolvedValue({ data: {} });
  apiMocks.deleteMessage.mockResolvedValue({ data: { success: true } });
  apiMocks.markConversationRead.mockResolvedValue({});
  apiMocks.markMessageRead.mockResolvedValue({});
  apiMocks.getConversationReadSummary.mockResolvedValue({
    data: {
      conversationId: TEST_CONVERSATION_ID,
      items: [],
      total: 0,
      limit: 100,
      page: 1,
    },
  });
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generate a sorted list of messages with distinct createdAt timestamps (ascending).
 * All messages share the same conversationId to simulate a real conversation.
 */
const sortedMessagesArb = fc
  .array(messageArb, { minLength: 2, maxLength: 20 })
  .map((messages) => {
    // Assign distinct createdAt timestamps sorted ascending
    const baseTime = new Date("2024-01-01T00:00:00.000Z").getTime();
    return messages.map((msg, index) => ({
      ...msg,
      id: `msg-prop-test-${index}`,
      conversationId: TEST_CONVERSATION_ID,
      status: "sent" as const,
      createdAt: new Date(baseTime + index * 60_000).toISOString(),
    }));
  });

/**
 * Generate a new non-blank body text for the update payload.
 * The hook intentionally treats whitespace-only bodies as missing payload text.
 */
const updatedBodyArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((body) => body.trim().length > 0);

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 10: Message Update Preserves Order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  fcTest.prop(
    [sortedMessagesArb, updatedBodyArb, fc.nat({ max: 19 })],
    { numRuns: 20, timeout: 30_000 },
  )(
    "patchFromRealtime updates body in place without changing message order",
    async (messages, newBody, targetIndexSeed) => {
      const targetIndex = targetIndexSeed % messages.length;
      const targetMessage = messages[targetIndex];

      // Record the original order of message IDs
      const originalOrder = messages.map((m) => m.id);

      // Mock the API to return our pre-sorted messages
      apiMocks.getMessages.mockResolvedValue({
        data: { items: messages, total: messages.length },
      });

      const { result } = renderHook(() =>
        useConversationMessages(TEST_CONVERSATION_ID),
      );

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify messages loaded correctly
      expect(result.current.messages).toHaveLength(messages.length);

      // Create the update payload targeting the selected message
      const patchPayload = {
        message: {
          id: targetMessage.id,
          conversationId: TEST_CONVERSATION_ID,
          senderId: targetMessage.senderId,
          body: newBody,
          type: targetMessage.type,
          status: targetMessage.status,
          createdAt: targetMessage.createdAt,
          updatedAt: new Date().toISOString(),
        },
      };

      // Apply the patch
      act(() => {
        result.current.patchFromRealtime(patchPayload);
      });

      // Assert: the targeted message's body is updated
      const updatedMessage = result.current.messages.find(
        (m) => m.id === targetMessage.id,
      );
      expect(updatedMessage).toBeDefined();
      expect(updatedMessage!.body).toBe(newBody);

      // Assert: the order of messages (by createdAt) is unchanged
      const currentOrder = result.current.messages.map((m) => m.id);
      expect(currentOrder).toEqual(originalOrder);

      // Assert: messages remain sorted by createdAt ascending
      for (let i = 1; i < result.current.messages.length; i++) {
        const prevTime = new Date(
          result.current.messages[i - 1].createdAt,
        ).getTime();
        const currTime = new Date(
          result.current.messages[i].createdAt,
        ).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    },
  );
});
