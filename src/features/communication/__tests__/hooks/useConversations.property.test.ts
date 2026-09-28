import { act, renderHook } from "@testing-library/react";
import { fc, test as fcTest } from "@fast-check/vitest";
import { afterEach, beforeEach, expect, vi } from "vitest";

const mockGetConversations = vi.fn();

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversations: (...args: unknown[]) => mockGetConversations(...args),
  createConversation: vi.fn().mockResolvedValue({ data: {} }),
  updateConversation: vi.fn().mockResolvedValue({ data: {} }),
  closeConversation: vi.fn().mockResolvedValue({ data: {} }),
  reopenConversation: vi.fn().mockResolvedValue({ data: {} }),
  archiveConversation: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: null, resyncVersion: 0 }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "user-prop-test-001" } }),
}));

vi.mock("@/features/communication/utils/communication-metadata", () => ({
  createCommunicationMetadata: vi.fn().mockReturnValue(null),
}));

const conversationArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("group", "direct", "classroom"),
  status: fc.constantFrom("active", "closed", "archived"),
  unreadCount: fc.nat({ max: 99 }),
  createdAt: fc
    .integer({ min: 0, max: 4_102_444_800_000 })
    .map((timestamp) => new Date(timestamp).toISOString()),
  updatedAt: fc
    .integer({ min: 0, max: 4_102_444_800_000 })
    .map((timestamp) => new Date(timestamp).toISOString()),
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetConversations.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function importHook() {
  const hookModule = await import(
    "@/features/communication/hooks/useConversations"
  );
  return hookModule.useConversations;
}

fcTest.prop(
  [
    fc.uniqueArray(conversationArbitrary, {
      selector: (conversation) => conversation.id,
      minLength: 0,
      maxLength: 100,
    }),
  ],
  { numRuns: 50 },
)("preserves backend conversation order", async (conversations) => {
  mockGetConversations.mockResolvedValue({
    data: { items: conversations, total: conversations.length },
  });

  const useConversations = await importHook();
  const { result, unmount } = renderHook(() => useConversations());
  await act(async () => {
    await vi.runAllTimersAsync();
  });

  expect(result.current.conversations.map(({ id }) => id)).toEqual(
    conversations.map(({ id }) => id),
  );
  unmount();
});

fcTest.prop([fc.nat({ max: 10_000 })], { numRuns: 50 })(
  "derives total pages from the fixed page size",
  async (total) => {
    mockGetConversations.mockResolvedValue({
      data: { items: [], total },
    });

    const useConversations = await importHook();
    const { result, unmount } = renderHook(() => useConversations());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalPages).toBe(
      total === 0 ? 0 : Math.ceil(total / 100),
    );
    unmount();
  },
);
