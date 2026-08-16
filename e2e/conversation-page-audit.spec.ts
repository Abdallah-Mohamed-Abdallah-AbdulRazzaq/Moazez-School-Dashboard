import { test, expect } from "@playwright/test";

/**
 * Conversation Page Audit — E2E Tests
 *
 * These tests use Playwright route interception to mock API responses,
 * so no live backend is required.
 *
 * Validates: Requirements 3.2, 3.3, 3.5, 4.1, 7.1, 7.6, 13.4
 */

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CONVERSATIONS_URL = "/en/communication/conversations";

const mockConversations = [
  {
    id: "conv-1",
    title: "Pinned Math Group",
    titleEn: "Pinned Math Group",
    type: "group",
    status: "active",
    createdById: "user-1",
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-15T12:00:00.000Z",
    isPinned: true,
    pinnedAt: "2025-01-12T09:00:00.000Z",
    unreadCount: 2,
    lastMessage: {
      id: "msg-last-1",
      body: "See you tomorrow",
      createdAt: "2025-01-15T12:00:00.000Z",
      senderName: "Ahmed",
      status: "sent",
    },
  },
  {
    id: "conv-2",
    title: "Science Discussion",
    titleEn: "Science Discussion",
    type: "group",
    status: "active",
    createdById: "user-2",
    createdAt: "2025-01-11T10:00:00.000Z",
    updatedAt: "2025-01-14T09:00:00.000Z",
    isPinned: false,
    pinnedAt: null,
    unreadCount: 0,
    lastMessage: {
      id: "msg-last-2",
      body: "Great experiment results",
      createdAt: "2025-01-14T09:00:00.000Z",
      senderName: "Sara",
      status: "sent",
    },
  },
  {
    id: "conv-3",
    title: "Parent-Teacher Chat",
    titleEn: "Parent-Teacher Chat",
    type: "direct",
    status: "active",
    createdById: "user-1",
    createdAt: "2025-01-09T07:00:00.000Z",
    updatedAt: "2025-01-13T15:00:00.000Z",
    isPinned: false,
    pinnedAt: null,
    unreadCount: 5,
    lastMessage: {
      id: "msg-last-3",
      body: "Thank you for the update",
      createdAt: "2025-01-13T15:00:00.000Z",
      senderName: "Fatima",
      status: "sent",
    },
  },
];

const mockMessages = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-2",
    sender: { id: "user-2", name: "Ahmed Ali", userId: "user-2" },
    body: "Hello everyone, welcome to the math group!",
    type: "text",
    status: "sent",
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: "user-3",
    sender: { id: "user-3", name: "Sara Hassan", userId: "user-3" },
    body: "Thanks Ahmed! Looking forward to the lessons.",
    type: "text",
    status: "sent",
    createdAt: "2025-01-15T10:05:00.000Z",
    updatedAt: "2025-01-15T10:05:00.000Z",
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    senderId: "user-1",
    sender: { id: "user-1", name: "Current User", userId: "user-1" },
    body: "Great to be here!",
    type: "text",
    status: "sent",
    createdAt: "2025-01-15T10:10:00.000Z",
    updatedAt: "2025-01-15T10:10:00.000Z",
  },
];

const mockPolicy = {
  allowReactions: true,
  allowAttachments: true,
  maxAttachmentSizeMb: 10,
  maxMessageLength: 2000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sets up common API route interceptions for the conversations page.
 * Intercepts conversations list, messages, participants, policy, and auth.
 */
async function setupRoutes(
  page: import("@playwright/test").Page,
  options?: {
    conversationsError?: boolean;
    searchFilter?: string;
  },
) {
  // Mock auth/user endpoint
  await page.route("**/api/v1/auth/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { id: "user-1", name: "Current User", email: "user@school.edu" },
      }),
    }),
  );

  // Mock policy
  await page.route("**/api/v1/communication/policies*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockPolicy }),
    }),
  );

  // Mock conversations list
  await page.route("**/api/v1/communication/conversations?**", (route) => {
    if (options?.conversationsError) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    }

    const url = new URL(route.request().url());
    const searchParam = url.searchParams.get("search") || "";

    let items = mockConversations;
    if (searchParam) {
      items = mockConversations.filter((c) =>
        c.title.toLowerCase().includes(searchParam.toLowerCase()),
      );
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { items, total: items.length } }),
    });
  });

  // Mock conversations list (no query params)
  await page.route("**/api/v1/communication/conversations", (route) => {
    if (route.request().url().includes("?")) return route.continue();

    if (options?.conversationsError) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { items: mockConversations, total: mockConversations.length },
      }),
    });
  });

  // Mock single conversation
  await page.route(
    "**/api/v1/communication/conversations/conv-*",
    (route) => {
      const url = route.request().url();
      // Skip sub-resource endpoints (messages, participants, etc.)
      if (
        url.includes("/messages") ||
        url.includes("/participants") ||
        url.includes("/invites") ||
        url.includes("/join-requests") ||
        url.includes("/read") ||
        url.includes("/close") ||
        url.includes("/reopen") ||
        url.includes("/archive") ||
        url.includes("/leave")
      ) {
        return route.continue();
      }

      const match = url.match(/conversations\/(conv-\d+)/);
      const convId = match?.[1] ?? "conv-1";
      const conversation = mockConversations.find((c) => c.id === convId) ??
        mockConversations[0];

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: conversation }),
      });
    },
  );

  // Mock messages for any conversation
  await page.route("**/api/v1/communication/conversations/*/messages*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { items: mockMessages, total: mockMessages.length },
      }),
    }),
  );

  // Mock participants
  await page.route("**/api/v1/communication/conversations/*/participants*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], total: 0 } }),
    }),
  );

  // Mock read endpoint
  await page.route("**/api/v1/communication/conversations/*/read*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: {} }),
    }),
  );

  // Mock blocks
  await page.route("**/api/v1/communication/blocks*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], total: 0 } }),
    }),
  );

  // Mock notifications
  await page.route("**/api/v1/communication/notifications*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], total: 0 } }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Conversation Page Audit — E2E", () => {
  /**
   * Task 7.1: Conversation sidebar rendering
   * Validates: Requirements 3.5, 7.1
   */
  test("sidebar renders correct number of conversations with pinned first", async ({
    page,
  }) => {
    await setupRoutes(page);
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState("networkidle");

    // The sidebar is an <aside> element
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Assert correct number of conversation items rendered
    // Each conversation item is a <button> inside the scrollable list area
    const conversationButtons = sidebar.locator(
      "div.overflow-y-auto > button",
    );
    await expect(conversationButtons).toHaveCount(mockConversations.length);

    // Assert conversation titles are displayed
    for (const conv of mockConversations) {
      await expect(
        sidebar.locator(`text=${conv.titleEn}`).first(),
      ).toBeVisible();
    }

    // Assert pinned conversations appear first
    // The first conversation button should contain the pinned conversation title
    const firstItem = conversationButtons.first();
    await expect(firstItem).toContainText("Pinned Math Group");

    // Verify the Pin icon is present for pinned conversations
    // The pinned conversation has a Pin icon (SVG from lucide-react)
    const pinnedItem = conversationButtons.first();
    const pinIcon = pinnedItem.locator("svg").first();
    await expect(pinIcon).toBeVisible();
  });

  /**
   * Task 7.2: Search filtering
   * Validates: Requirements 7.6
   */
  test("search input filters conversations by title", async ({ page }) => {
    await setupRoutes(page);
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");

    // Find the search input
    const searchInput = sidebar.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Type a search term that matches only one conversation
    await searchInput.fill("Science");

    // Wait for the filtered results — the API is intercepted with search param
    // The route handler filters by title, so only "Science Discussion" should appear
    await page.waitForTimeout(500); // Allow debounce/state update

    // After search, the sidebar should show filtered results
    const conversationButtons = sidebar.locator(
      "div.overflow-y-auto > button",
    );

    // The mock route filters by search param, so we expect 1 result
    await expect(conversationButtons).toHaveCount(1);
    await expect(conversationButtons.first()).toContainText(
      "Science Discussion",
    );
  });

  /**
   * Task 7.3: Conversation selection and message display
   * Validates: Requirements 3.2, 4.1
   */
  test("clicking a conversation displays messages with sender names and body", async ({
    page,
  }) => {
    await setupRoutes(page);
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");

    // Click the first conversation (Pinned Math Group)
    const firstConversation = sidebar
      .locator("div.overflow-y-auto > button")
      .first();
    await firstConversation.click();

    // Wait for messages to load in the detail panel
    const detailSection = page.locator("section").first();
    await expect(detailSection).toBeVisible();

    // Assert message bubbles are rendered
    const messageBubbles = page.locator("article[data-message-id]");
    await expect(messageBubbles).toHaveCount(mockMessages.length);

    // Assert sender names are displayed for non-own messages
    // "Ahmed Ali" is the sender of the first message
    await expect(page.locator("text=Ahmed Ali").first()).toBeVisible();

    // "Sara Hassan" is the sender of the second message
    await expect(page.locator("text=Sara Hassan").first()).toBeVisible();

    // Assert message body text is displayed
    await expect(
      page.locator("text=Hello everyone, welcome to the math group!").first(),
    ).toBeVisible();
    await expect(
      page
        .locator("text=Thanks Ahmed! Looking forward to the lessons.")
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("text=Great to be here!").first(),
    ).toBeVisible();
  });

  /**
   * Task 7.4: Mobile responsive behavior
   * Validates: Requirements 13.4
   */
  test("mobile viewport shows sidebar/detail toggle behavior", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await setupRoutes(page);
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState("networkidle");

    // On mobile, only the sidebar should be visible initially
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // The detail section should be hidden on mobile (has "hidden" class when no conversation selected)
    const detailSection = page.locator("section");
    await expect(detailSection).toBeHidden();

    // Click a conversation to open the detail view
    const firstConversation = sidebar
      .locator("div.overflow-y-auto > button")
      .first();
    await firstConversation.click();

    // After selection, the detail panel should be visible and sidebar hidden
    await expect(detailSection).toBeVisible();
    await expect(sidebar).toBeHidden();

    // Click the back button to return to the sidebar
    // The back button is in the ConversationDetail header
    const backButton = page.locator(
      'button[aria-label*="back"], button[aria-label*="Back"]',
    ).first();

    // If no aria-label back button, look for a button with a left arrow icon in the header
    if (await backButton.isVisible()) {
      await backButton.click();
    } else {
      // Fallback: look for any back navigation button in the detail section
      const headerBackButton = detailSection
        .locator("button")
        .first();
      await headerBackButton.click();
    }

    // After clicking back, sidebar should be visible again and detail hidden
    await expect(sidebar).toBeVisible();
    await expect(detailSection).toBeHidden();
  });

  /**
   * Task 7.5: Error state handling
   * Validates: Requirements 3.3
   */
  test("API error displays error toast", async ({ page }) => {
    await setupRoutes(page, { conversationsError: true });
    await page.goto(CONVERSATIONS_URL);
    await page.waitForLoadState("networkidle");

    // The ConversationPage renders a ToastMessage when conversationsState.error is set
    // The toast has specific styling classes for error tone: "border-red-200 bg-red-50 text-red-800"
    const errorToast = page.locator(".bg-red-50");
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    // The toast should contain an error message
    await expect(errorToast).toContainText(/.+/);
  });
});
