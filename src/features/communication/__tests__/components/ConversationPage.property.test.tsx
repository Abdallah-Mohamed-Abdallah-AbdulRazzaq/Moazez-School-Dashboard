/**
 * Property-based test: Filter Correctness
 *
 * **Validates: Requirements 7.2, 7.3**
 *
 * Property 19: For any conversation list, "pinned" returns only pinned.
 *
 * This test generates random conversation lists and verifies that the
 * supported pinned filter narrows the visible list.
 */

import { expect, vi, beforeEach, afterEach } from "vitest";
import { test as fcTest, fc } from "@fast-check/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ConversationListItemModel } from "../../hooks/useConversations";

// ─── Constants ───────────────────────────────────────────────────────────────

const TEST_USER_ID = "user-pbt-filter-001";

// ─── Module Mocks ────────────────────────────────────────────────────────────

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: TEST_USER_ID },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const mockConversationsState = {
  conversations: [] as ConversationListItemModel[],
  total: 0,
  filters: { search: "", status: "all" as string },
  setFilters: vi.fn(),
  isLoading: false,
  isRefreshing: false,
  isMutating: false,
  error: null as string | null,
  hasFilters: false,
  refresh: vi.fn().mockResolvedValue(undefined),
  markAsRead: vi.fn(),
  create: vi.fn().mockResolvedValue({ id: "new-conv" }),
  update: vi.fn().mockResolvedValue({}),
  close: vi.fn().mockResolvedValue({}),
  reopen: vi.fn().mockResolvedValue({}),
  archive: vi.fn().mockResolvedValue({}),
};

vi.mock("@/features/communication/hooks/useConversations", () => ({
  useConversations: () => mockConversationsState,
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: null,
    isConnected: true,
    connectionError: null,
    resyncVersion: 0,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

vi.mock(
  "@/features/communication/conversations_redesign/components/ConversationDetail",
  () => ({
    default: ({ conversationId, onBack }: { conversationId: string; onBack: () => void }) => (
      <div data-testid="conversation-detail">
        <span data-testid="detail-conversation-id">{conversationId}</span>
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    ),
  }),
);

vi.mock(
  "@/features/communication/components/conversations/CreateConversationDialog",
  () => ({
    default: () => <div data-testid="create-dialog" />,
  }),
);

vi.mock(
  "@/features/communication/conversations_redesign/components/ToastMessage",
  () => ({
    ToastMessage: ({ message }: { message: string }) => (
      <div data-testid="toast-message">{message}</div>
    ),
  }),
);

// ─── Import Component Under Test ─────────────────────────────────────────────

import ConversationPage from "../../conversations_redesign/pages/ConversationPage";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const MIN_TS = new Date("2020-01-01T00:00:00.000Z").getTime();
const MAX_TS = new Date("2030-12-31T23:59:59.999Z").getTime();
const isoDateArb = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ts) => new Date(ts).toISOString());

/**
 * Generate a unique title that won't collide with UI labels or avatar initials.
 * Uses a prefix + index pattern to ensure uniqueness and avoid short strings.
 */
const uniqueTitleArb = (index: number) =>
  fc.constant(`Conversation Title ${index + 1}`);

/**
 * Generate a conversation with controlled filter-relevant fields.
 * The createdById is either the current user or a random other user.
 */
function conversationForFilterArb(index: number) {
  return fc.record({
    id: fc.uuid(),
    title: uniqueTitleArb(index),
    type: fc.constantFrom("group", "direct", "classroom"),
    status: fc.constant("active" as const),
    participantsCount: fc.nat({ max: 50 }),
    unreadCount: fc.nat({ max: 99 }),
    createdById: fc.constantFrom(TEST_USER_ID, "other-user-001", "other-user-002"),
    createdAt: isoDateArb,
    updatedAt: isoDateArb,
    lastMessageAt: fc.option(isoDateArb, { nil: null }),
    isPinned: fc.boolean(),
    pinnedAt: fc.option(isoDateArb, { nil: null }),
    lastMessage: fc.option(
      fc.record({
        id: fc.uuid(),
        body: fc.string({ minLength: 1, maxLength: 50 }),
        status: fc.constant("sent" as const),
        createdAt: isoDateArb,
      }),
      { nil: null },
    ),
  });
}

/**
 * Generate a list of conversations with unique titles (indexed).
 */
const conversationListArb = fc
  .integer({ min: 1, max: 8 })
  .chain((size) =>
    fc.tuple(...Array.from({ length: size }, (_, i) => conversationForFilterArb(i))),
  );

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find the filter pill button by its text content and h-8 class.
 * The sidebar renders filter buttons as pill-shaped buttons with h-8 class.
 */
function clickFilterButton(filterText: string) {
  const filterButtons = screen.getAllByRole("button").filter(
    (btn) => btn.textContent === filterText && btn.className.includes("h-8"),
  );
  if (filterButtons.length === 0) {
    throw new Error(`No filter button found with text "${filterText}"`);
  }
  fireEvent.click(filterButtons[0]);
}

/**
 * Get the list of visible conversation titles from the rendered sidebar.
 * Conversation titles are rendered in a div with class "truncate text-sm font-bold text-slate-950".
 */
function getVisibleConversationTitles(): string[] {
  const titleElements = document.querySelectorAll("[data-testid='conversation-title']");
  return Array.from(titleElements).map((el) => el.textContent ?? "");
}

// ─── Test Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockConversationsState.conversations = [];
  mockConversationsState.total = 0;
  mockConversationsState.isLoading = false;
  mockConversationsState.isRefreshing = false;
  mockConversationsState.isMutating = false;
  mockConversationsState.error = null;
  mockConversationsState.filters = {
    search: "",
    status: "all",
    type: "all",
  };
  mockConversationsState.hasFilters = false;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ─── Property-Based Tests ───────────────────────────────────────────────────

fcTest.prop([conversationListArb], { numRuns: 50 })(
  "Property 19b: 'pinned' filter shows only conversations where isPinned === true",
  (conversations) => {
    mockConversationsState.conversations = conversations as ConversationListItemModel[];

    const { unmount } = render(<ConversationPage />);

    // Click the "Pinned" filter button
    clickFilterButton("Pinned");

    // Get visible titles
    const visibleTitles = getVisibleConversationTitles();

    // Expected: only conversations where isPinned is true
    const expectedTitles = conversations
      .filter((c) => c.isPinned)
      .map((c) => c.title);

    // All visible titles should be from pinned conversations
    expect(visibleTitles.sort()).toEqual(expectedTitles.sort());

    unmount();
  },
);
