/**
 * Tests for ConversationPage component.
 *
 * Validates: Requirements 2.4, 7.2, 7.3, 7.5, 13.4
 * Properties: 2 (partial - render count), 19 (Filter Correctness), 28 (Mobile Responsive Toggle)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Profiler } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { createConversation } from "../utils/test-data-generators";
import type { ConversationListItemModel } from "../../hooks/useConversations";

// ─── Module Mocks ────────────────────────────────────────────────────────────

const TEST_USER_ID = "user-test-001";
const hasPermissionMock = vi.hoisted(() => vi.fn());

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: TEST_USER_ID },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Track useConversations mock state
const mockConversationsState = {
  conversations: [] as ConversationListItemModel[],
  total: 0,
  filters: { search: "", status: "all" as string, type: "all" as string },
  setFilters: vi.fn(),
  isLoading: false,
  isRefreshing: false,
  isMutating: false,
  error: null as string | null,
  clearError: vi.fn(),
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

const mockRealtimeState = {
  socket: null,
  isConnected: true,
  connectionError: null as string | null,
  resyncVersion: 0,
  retryConnection: vi.fn(),
  joinConversation: vi.fn(),
  leaveConversation: vi.fn(),
  startTyping: vi.fn(),
  stopTyping: vi.fn(),
};

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => mockRealtimeState,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
  }),
}));

// Mock ConversationDetail to avoid deep rendering
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

// Mock CreateConversationDialog
vi.mock(
  "@/features/communication/components/conversations/CreateConversationDialog",
  () => ({
    default: () => <div data-testid="create-dialog" />,
  }),
);

// Mock ToastMessage
vi.mock(
  "@/features/communication/conversations_redesign/components/ToastMessage",
  () => ({
    ToastMessage: ({
      actionLabel,
      message,
      onAction,
    }: {
      actionLabel?: string;
      message: string;
      onAction?: () => void;
    }) => (
      <div data-testid="toast-message">
        {message}
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    ),
  }),
);

// ─── Import Component Under Test ─────────────────────────────────────────────

import ConversationPage from "../../conversations_redesign/pages/ConversationPage";

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createConversationListItem(
  overrides: Partial<ConversationListItemModel> = {},
): ConversationListItemModel {
  return createConversation(overrides) as ConversationListItemModel;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ConversationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    mockConversationsState.conversations = [];
    mockConversationsState.total = 0;
    mockConversationsState.isLoading = false;
    mockConversationsState.isRefreshing = false;
    mockConversationsState.isMutating = false;
    mockConversationsState.error = null;
    mockRealtimeState.isConnected = true;
    mockRealtimeState.connectionError = null;
    mockConversationsState.filters = {
      search: "",
      status: "all",
      type: "all",
    };
    mockConversationsState.hasFilters = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a localized realtime authorization error", () => {
    mockRealtimeState.connectionError =
      "communication.conversation.not_member";

    render(<ConversationPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You are not a member of this conversation.",
    );
  });

  it("hides conversation creation without the backend create permission", () => {
    hasPermissionMock.mockImplementation(
      (permission: string) =>
        permission !== "communication.conversations.create",
    );

    render(<ConversationPage />);

    expect(
      screen.queryByRole("button", { name: "Create conversation" }),
    ).not.toBeInTheDocument();
  });

  it("retries realtime and conversation loading from the connection banner", () => {
    mockRealtimeState.isConnected = false;

    render(<ConversationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockRealtimeState.retryConnection).toHaveBeenCalledOnce();
    expect(mockConversationsState.refresh).toHaveBeenCalledOnce();
  });

  it("offers a retry action when conversation loading fails", () => {
    mockConversationsState.error = "Unable to load conversations.";

    render(<ConversationPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load conversations.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockConversationsState.refresh).toHaveBeenCalledOnce();
  });

  it("offers conversation creation from the unfiltered empty state", () => {
    render(<ConversationPage />);

    const createButtons = screen.getAllByRole("button", {
      name: "Create Conversation",
    });
    expect(createButtons).toHaveLength(2);

    fireEvent.click(createButtons.at(-1)!);
    expect(screen.getByTestId("create-dialog")).toBeInTheDocument();
  });

  // ─── Property 2 (partial): Render Count During Initial Mount ─────────────

  describe("Property 2 (partial): Does not re-render excessively during initial mount", () => {
    /**
     * Validates: Requirement 2.4
     * The ConversationPage should not re-render more than twice during initial mount
     * with mocked conversation data.
     */
    it("does not re-render more than twice during initial mount", () => {
      const onRender = vi.fn();

      // Provide some conversations so the component has data to work with
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-1", title: "First" }),
        createConversationListItem({ id: "conv-2", title: "Second" }),
      ];

      render(
        <Profiler id="ConversationPage" onRender={onRender}>
          <ConversationPage />
        </Profiler>,
      );

      expect(onRender).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Property 19: Filter Correctness ─────────────────────────────────────

  describe("Property 19: Filter Correctness", () => {
    /**
     * Validates: Requirements 7.2, 7.3
     * - "pinned" filter returns only conversations where isPinned is true
     */

    const myConversation = createConversationListItem({
      id: "conv-mine",
      title: "My Conversation",
      createdById: TEST_USER_ID,
      unreadCount: 0,
      isPinned: false,
    });

    const unreadConversation = createConversationListItem({
      id: "conv-unread",
      title: "Unread Conversation",
      createdById: "other-user",
      unreadCount: 5,
      isPinned: false,
    });

    const pinnedConversation = createConversationListItem({
      id: "conv-pinned",
      title: "Pinned Conversation",
      createdById: "other-user",
      unreadCount: 0,
      isPinned: true,
    });

    const otherConversation = createConversationListItem({
      id: "conv-other",
      title: "Other Conversation",
      createdById: "other-user",
      unreadCount: 0,
      isPinned: false,
    });

    beforeEach(() => {
      mockConversationsState.conversations = [
        myConversation,
        unreadConversation,
        pinnedConversation,
        otherConversation,
      ];
    });

    it("shows all conversations when 'all' filter is active (default)", () => {
      render(<ConversationPage />);

      expect(screen.getByText("My Conversation")).toBeInTheDocument();
      expect(screen.getByText("Unread Conversation")).toBeInTheDocument();
      expect(screen.getByText("Pinned Conversation")).toBeInTheDocument();
      expect(screen.getByText("Other Conversation")).toBeInTheDocument();
    });

    it("does not offer the removed 'mine' filter", () => {
      render(<ConversationPage />);

      fireEvent.click(screen.getByRole("button", { name: "Filters" }));
      expect(
        screen.queryByRole("menuitemradio", { name: /mine/i }),
      ).not.toBeInTheDocument();
    });

    it("maps the classroom type filter into conversation filter state", () => {
      render(<ConversationPage />);

      fireEvent.click(screen.getByRole("button", { name: "Filters" }));
      fireEvent.click(
        screen.getByRole("menuitemradio", { name: "Class" }),
      );

      const updateFilters =
        mockConversationsState.setFilters.mock.calls.at(-1)?.[0];
      expect(updateFilters).toEqual(expect.any(Function));
      expect(
        updateFilters({ search: "", status: "all", type: "all" }),
      ).toEqual({ search: "", status: "all", type: "classroom" });
    });

    it("does not expose the unsupported unread filter", () => {
      render(<ConversationPage />);

      const filterButtons = screen.getAllByRole("button").filter(
        (btn) => btn.textContent === "Unread" && btn.className.includes("h-8"),
      );
      expect(filterButtons).toHaveLength(0);
    });

    it("'pinned' filter shows only conversations where isPinned is true", () => {
      render(<ConversationPage />);

      // Click the "pinned" filter button (the small pill-shaped filter tab, not the conversation item)
      const pinnedFilterButtons = screen.getAllByRole("button").filter(
        (btn) => btn.textContent === "Pinned" && btn.className.includes("h-8"),
      );
      expect(pinnedFilterButtons.length).toBeGreaterThan(0);
      fireEvent.click(pinnedFilterButtons[0]);

      // Only the pinned conversation should be visible
      expect(screen.getByText("Pinned Conversation")).toBeInTheDocument();
      expect(screen.queryByText("My Conversation")).not.toBeInTheDocument();
      expect(screen.queryByText("Unread Conversation")).not.toBeInTheDocument();
      expect(screen.queryByText("Other Conversation")).not.toBeInTheDocument();
    });
  });

  // ─── Property 28: Mobile Responsive Toggle ───────────────────────────────

  describe("Property 28: Mobile Responsive Toggle", () => {
    /**
     * Validates: Requirement 13.4
     * For viewport < 768px, selecting a conversation shows the detail panel and hides
     * the sidebar. Pressing back shows the sidebar and hides the detail panel.
     *
     * The ConversationPage uses CSS classes with `md:` breakpoints and a `showMobileThread`
     * state to toggle visibility. On mobile (< 768px), the sidebar has class `hidden`
     * when showMobileThread is true, and the detail section has class `hidden` when
     * showMobileThread is false.
     */

    beforeEach(() => {
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-mobile-1", title: "Mobile Conv 1" }),
        createConversationListItem({ id: "conv-mobile-2", title: "Mobile Conv 2" }),
      ];
    });

    it("initially shows sidebar and hides detail when no initialConversationId", () => {
      const { container } = render(<ConversationPage />);

      // The sidebar aside should be visible (not have 'hidden' class without md: prefix)
      const sidebar = container.querySelector("aside");
      expect(sidebar).toBeTruthy();
      // On mobile, sidebar should be visible (flex class, not hidden)
      expect(sidebar!.className).toContain("flex");
      expect(sidebar!.className).not.toMatch(/^hidden\b/);

      // The detail section should be hidden on mobile
      const detailSection = container.querySelector("section");
      expect(detailSection).toBeTruthy();
      expect(detailSection!.className).toContain("hidden");
    });

    it("selecting a conversation shows detail and hides sidebar on mobile", () => {
      const { container } = render(<ConversationPage />);

      // Click a conversation to select it
      const convButton = screen.getByText("Mobile Conv 1").closest("button");
      expect(convButton).toBeTruthy();
      fireEvent.click(convButton!);

      // After selection, sidebar should be hidden on mobile
      const sidebar = container.querySelector("aside");
      expect(sidebar!.className).toContain("hidden");

      // Detail section should be visible
      const detailSection = container.querySelector("section");
      expect(detailSection!.className).toContain("flex");
      expect(detailSection!.className).not.toMatch(/^hidden\b/);

      // ConversationDetail should be rendered with the selected ID
      expect(screen.getByTestId("conversation-detail")).toBeInTheDocument();
      expect(screen.getByTestId("detail-conversation-id")).toHaveTextContent("conv-mobile-1");
    });

    it("pressing back shows sidebar and hides detail on mobile", () => {
      const { container } = render(<ConversationPage />);

      // Select a conversation first
      const convButton = screen.getByText("Mobile Conv 1").closest("button");
      fireEvent.click(convButton!);

      // Verify detail is shown
      expect(screen.getByTestId("conversation-detail")).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByTestId("back-button");
      fireEvent.click(backButton);

      // After back, sidebar should be visible again
      const sidebar = container.querySelector("aside");
      expect(sidebar!.className).toContain("flex");
      expect(sidebar!.className).not.toMatch(/^hidden\b/);

      // Detail section should be hidden on mobile
      const detailSection = container.querySelector("section");
      expect(detailSection!.className).toContain("hidden");
    });

    it("shows detail initially when initialConversationId is provided", () => {
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-initial", title: "Initial Conv" }),
      ];

      const { container } = render(
        <ConversationPage initialConversationId="conv-initial" />,
      );

      // Sidebar should be hidden on mobile (showMobileThread starts as true)
      const sidebar = container.querySelector("aside");
      expect(sidebar!.className).toContain("hidden");

      // Detail should be visible
      const detailSection = container.querySelector("section");
      expect(detailSection!.className).toContain("flex");
    });
  });

  // ─── userClosedRef prevents auto-selection after back navigation ──────────

  describe("userClosedRef prevents auto-selection after back navigation", () => {
    /**
     * Validates: Requirement 7.5
     * When the user navigates back from a conversation, the `userClosedRef` is set to true,
     * preventing the auto-selection effect from selecting the first conversation.
     */

    it("does not auto-select first conversation after user navigates back", () => {
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-a", title: "Conv A" }),
        createConversationListItem({ id: "conv-b", title: "Conv B" }),
      ];

      const { container } = render(<ConversationPage />);

      // Initially, the first conversation may be auto-selected
      // Select a conversation explicitly
      const convButton = screen.getByText("Conv A").closest("button");
      fireEvent.click(convButton!);

      // Verify detail is shown
      expect(screen.getByTestId("conversation-detail")).toBeInTheDocument();
      expect(screen.getByTestId("detail-conversation-id")).toHaveTextContent("conv-a");

      // Navigate back
      const backButton = screen.getByTestId("back-button");
      fireEvent.click(backButton);

      // After back, selectedConversationId should be null (no auto-selection)
      // The detail section should show EmptyDetail or be hidden
      const detailSection = container.querySelector("section");
      // On mobile, detail is hidden after back
      expect(detailSection!.className).toContain("hidden");

      // The ConversationDetail should NOT be rendered (selectedConversationId is null)
      expect(screen.queryByTestId("conversation-detail")).not.toBeInTheDocument();
    });

    it("allows selection again after user explicitly clicks a conversation post-back", () => {
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-x", title: "Conv X" }),
        createConversationListItem({ id: "conv-y", title: "Conv Y" }),
      ];

      render(<ConversationPage />);

      // Select first conversation
      const convXButton = screen.getByText("Conv X").closest("button");
      fireEvent.click(convXButton!);
      expect(screen.getByTestId("detail-conversation-id")).toHaveTextContent("conv-x");

      // Navigate back
      fireEvent.click(screen.getByTestId("back-button"));

      // Now select a different conversation
      const convYButton = screen.getByText("Conv Y").closest("button");
      fireEvent.click(convYButton!);

      // Should show the newly selected conversation
      expect(screen.getByTestId("conversation-detail")).toBeInTheDocument();
      expect(screen.getByTestId("detail-conversation-id")).toHaveTextContent("conv-y");
    });

    it("does not call refresh when navigating back", () => {
      mockConversationsState.conversations = [
        createConversationListItem({ id: "conv-refresh", title: "Conv Refresh" }),
      ];

      render(<ConversationPage />);

      // Select conversation
      const convButton = screen.getByText("Conv Refresh").closest("button");
      fireEvent.click(convButton!);

      // Clear mock
      mockConversationsState.refresh.mockClear();

      // Navigate back
      fireEvent.click(screen.getByTestId("back-button"));

      // refresh should not be called on back navigation
      expect(mockConversationsState.refresh).not.toHaveBeenCalled();
    });
  });
});
