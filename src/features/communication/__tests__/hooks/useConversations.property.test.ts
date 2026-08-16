/**
 * Property-based test: Conversation Sort Order
 *
 * **Validates: Requirements 7.1**
 *
 * Property 18: For any list of conversations, the sorted output SHALL place all
 * pinned conversations before unpinned ones, and within each group, conversations
 * SHALL be ordered by most recent activity date (lastMessage.createdAt or updatedAt)
 * in descending order.
 *
 * This test validates the sorting logic by feeding generated conversations through
 * the useConversations hook and asserting the output order.
 */

import { expect, vi, beforeEach, afterEach } from "vitest";
import { test as fcTest, fc } from "@fast-check/vitest";
import { renderHook, act } from "@testing-library/react";

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

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: null,
    isConnected: false,
    connectionError: null,
    resyncVersion: 0,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-prop-test-001" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

// ─── Arbitrary for ConversationListItemModel ────────────────────────────────

const MIN_TS = new Date("2020-01-01T00:00:00.000Z").getTime();
const MAX_TS = new Date("2030-12-31T23:59:59.999Z").getTime();
const isoDateArb = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ts) => new Date(ts).toISOString());

// Each conversation gets a unique ID to avoid deduplication
const conversationListItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("group", "direct", "classroom"),
  status: fc.constantFrom("active", "closed", "archived"),
  participantsCount: fc.nat({ max: 200 }),
  unreadCount: fc.nat({ max: 99 }),
  createdById: fc.uuid(),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
  lastMessageAt: fc.option(isoDateArb, { nil: null }),
  isPinned: fc.boolean(),
  pinnedAt: fc.option(isoDateArb, { nil: null }),
  lastMessage: fc.option(
    fc.record({
      id: fc.uuid(),
      body: fc.string({ minLength: 1, maxLength: 100 }),
      status: fc.constant("sent"),
      createdAt: isoDateArb,
    }),
    { nil: null },
  ),
});

// ─── Helper: extract the effective sort date (mirrors hook's sortConversations logic) ─

function getEffectiveDate(conversation: {
  pinnedAt?: string | null;
  lastMessage?: { createdAt?: string } | null;
  lastMessageAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}): number {
  const dateStr =
    conversation.pinnedAt ??
    conversation.lastMessage?.createdAt ??
    conversation.lastMessageAt ??
    conversation.updatedAt ??
    conversation.createdAt ??
    "";
  return new Date(dateStr).getTime();
}

// ─── Test Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockGetConversations.mockResolvedValue({ data: { items: [], total: 0 } });
  mockGetMessages.mockResolvedValue({ data: { items: [], total: 0 } });
});

afterEach(() => {
  vi.useRealTimers();
});

async function importHook() {
  const mod = await import(
    "@/features/communication/hooks/useConversations"
  );
  return mod.useConversations;
}

// ─── Property-Based Tests ───────────────────────────────────────────────────

fcTest.prop(
  [fc.array(conversationListItemArb, { minLength: 2, maxLength: 15 })],
  { numRuns: 50 },
)(
  "Property 18: Pinned conversations always appear before unpinned conversations in sorted output",
  async (conversations) => {
    // Set up the mock to return our generated conversations
    mockGetConversations.mockResolvedValue({
      data: { items: conversations, total: conversations.length },
    });

    const useConversations = await importHook();
    const { result, unmount } = renderHook(() => useConversations());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const sorted = result.current.conversations;

    // Find the index of the last pinned conversation and first unpinned
    let lastPinnedIndex = -1;
    let firstUnpinnedIndex = sorted.length;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].isPinned) {
        lastPinnedIndex = i;
      } else if (firstUnpinnedIndex === sorted.length) {
        firstUnpinnedIndex = i;
      }
    }

    // Assert: all pinned items come before all unpinned items
    if (lastPinnedIndex >= 0 && firstUnpinnedIndex < sorted.length) {
      expect(lastPinnedIndex).toBeLessThan(firstUnpinnedIndex);
    }

    unmount();
  },
);

fcTest.prop(
  [fc.array(conversationListItemArb, { minLength: 2, maxLength: 15 })],
  { numRuns: 50 },
)(
  "Property 18: Within pinned group, conversations are sorted by most recent activity descending",
  async (conversations) => {
    mockGetConversations.mockResolvedValue({
      data: { items: conversations, total: conversations.length },
    });

    const useConversations = await importHook();
    const { result, unmount } = renderHook(() => useConversations());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const sorted = result.current.conversations;
    const pinnedItems = sorted.filter((c) => c.isPinned);

    // Assert: pinned items are sorted by effective date descending
    for (let i = 0; i < pinnedItems.length - 1; i++) {
      const currentDate = getEffectiveDate(pinnedItems[i]);
      const nextDate = getEffectiveDate(pinnedItems[i + 1]);
      expect(currentDate).toBeGreaterThanOrEqual(nextDate);
    }

    unmount();
  },
);

fcTest.prop(
  [fc.array(conversationListItemArb, { minLength: 2, maxLength: 15 })],
  { numRuns: 50 },
)(
  "Property 18: Within unpinned group, conversations are sorted by most recent activity descending",
  async (conversations) => {
    mockGetConversations.mockResolvedValue({
      data: { items: conversations, total: conversations.length },
    });

    const useConversations = await importHook();
    const { result, unmount } = renderHook(() => useConversations());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const sorted = result.current.conversations;
    const unpinnedItems = sorted.filter((c) => !c.isPinned);

    // Assert: unpinned items are sorted by effective date descending
    for (let i = 0; i < unpinnedItems.length - 1; i++) {
      const currentDate = getEffectiveDate(unpinnedItems[i]);
      const nextDate = getEffectiveDate(unpinnedItems[i + 1]);
      expect(currentDate).toBeGreaterThanOrEqual(nextDate);
    }

    unmount();
  },
);
