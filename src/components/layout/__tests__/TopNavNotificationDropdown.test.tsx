import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopNavNotificationDropdown from "../TopNavNotificationDropdown";
import {
  getNotificationMuted,
  setNotificationMuted,
} from "@/features/communication/hooks/useNotificationSound";
import {
  getConversation,
  getMessage,
  getMessageInfo,
} from "@/features/communication/api/communication.service";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// Mock useNotificationSound hook functions
vi.mock("@/features/communication/hooks/useNotificationSound", () => {
  let mutedState = false;
  return {
    getNotificationMuted: vi.fn(() => mutedState),
    setNotificationMuted: vi.fn((val: boolean) => {
      mutedState = val;
    }),
    useNotificationSound: vi.fn(() => ({
      play: vi.fn(),
    })),
  };
});

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversation: vi.fn(),
  getMessage: vi.fn(),
  getMessageInfo: vi.fn(),
}));

describe("TopNavNotificationDropdown", () => {
  const onMarkReadMock = vi.fn();
  const onMarkAllReadMock = vi.fn();
  const onArchiveMock = vi.fn();
  const onCloseMock = vi.fn();

  const mockNotifications = [
    {
      id: "notif-1",
      type: "announcement_published" as const,
      title: "New Announcement",
      body: "This is an announcement",
      status: "unread" as const,
      priority: "urgent" as const,
      deepLink: {
        type: "announcement",
        announcementId: "ann-123",
      },
      createdAt: "2026-06-27T20:00:00.000Z",
    },
    {
      id: "notif-2",
      type: "message_received" as const,
      title: "New Message",
      body: "Hello there",
      status: "unread" as const,
      priority: "normal" as const,
      deepLink: {
        type: "conversation_message",
        conversationId: "conv-456",
        messageId: "msg-789",
      },
      createdAt: "2026-06-27T19:00:00.000Z",
    },
    {
      id: "notif-3",
      type: "attendance_absence" as const,
      title: "Absence Record",
      body: "Absent today",
      status: "read" as const,
      priority: "high" as const,
      deepLink: null,
      createdAt: "2026-06-27T18:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMessage).mockResolvedValue({});
    vi.mocked(getConversation).mockImplementation(
      () => new Promise<Awaited<ReturnType<typeof getConversation>>>(() => {}),
    );
    vi.mocked(getMessageInfo).mockImplementation(
      () => new Promise<Awaited<ReturnType<typeof getMessageInfo>>>(() => {}),
    );
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={false}
        onClose={onCloseMock}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders enriched notification hierarchy, priority, and unread indicators", async () => {
    vi.mocked(getConversation).mockResolvedValue({
      data: { id: "conv-456", title: "Grade 5A" },
    });
    vi.mocked(getMessageInfo).mockResolvedValue({
      data: {
        message: {
          sender: { displayName: "Teacher", userId: "teacher-1" },
        },
      },
    });

    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    // Verify Title and Unread count summary
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText(/2 unread updates/)).toBeInTheDocument();

    // Verify Notification titles are rendered
    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("Absence Record")).toBeInTheDocument();
    expect(await screen.findByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("Grade 5A")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();

    // Verify Priority Pill Badges are rendered
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    // Verify unread indicator dots (we will search by data-testid or visual class if any, or just check they exist)
    const unreadDots = screen.getAllByTestId("unread-indicator");
    expect(unreadDots.length).toBe(2);
  });

  it("shows the sender when a persisted message notification has no deep link", async () => {
    vi.mocked(getMessageInfo).mockResolvedValue({
      message: {
        messageId: "msg-source-only",
        conversationId: "conv-source-only",
        sender: {
          displayName: "Ahmed Mostafa",
          userId: "sender-1",
          userType: "school_user",
          isMe: false,
        },
        type: "text",
        status: "sent",
        body: "Source-only notification",
        content: "Source-only notification",
        createdAt: "2026-06-27T19:00:00.000Z",
        readCount: 0,
      },
      readers: [],
      readCount: 0,
      participantsCount: 2,
      fullyRead: false,
      pagination: { page: 1, limit: 50, total: 0 },
    });
    vi.mocked(getConversation).mockResolvedValue({
      id: "conv-source-only",
      title: "Parent Support",
    });

    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-source-only",
            type: "message_received",
            sourceModule: "communication",
            sourceId: "msg-source-only",
            title: "New message",
            body: "Source-only notification",
            status: "unread",
            priority: "normal",
            deepLink: null,
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen
        onClose={onCloseMock}
      />,
    );

    const messageAction = await screen.findByRole("button", {
      name: "Open conversation: Ahmed Mostafa",
    });
    expect(screen.getByText("Parent Support")).toBeInTheDocument();

    fireEvent.click(messageAction);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/en/communication/conversations?conversationId=conv-source-only",
      ),
    );
  });

  it("uses a mobile bottom sheet and desktop dropdown layout", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass(
      "fixed",
      "inset-x-0",
      "bottom-0",
      "max-h-[80dvh]",
      "rounded-t-2xl",
    );
    expect(dialog).toHaveClass(
      "sm:absolute",
      "sm:inset-x-auto",
      "sm:bottom-auto",
      "sm:end-0",
      "sm:top-full",
      "sm:w-[400px]",
    );
  });

  it("triggers onMarkRead and redirects to deepLink on item card click", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    // Click on the second notification (unread message)
    const messageCard = screen.getByText("New Message").closest("button");
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    // Verify onMarkRead triggered
    expect(onMarkReadMock).toHaveBeenCalledWith("notif-2");

    // Verify router push was called with the same conversations route as the toast
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-456",
    );
  });

  it("opens a communication conversation when the notification has a top-level conversationId", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-conversation",
            type: "message_received",
            sourceModule: "communication",
            title: "New Message",
            body: "Open the conversation",
            status: "unread",
            priority: "normal",
            conversationId: "conv-from-notification",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const messageCard = screen.getByText("New Message").closest("button");
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(onMarkReadMock).toHaveBeenCalledWith("notif-conversation");
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-notification",
    );
  });

  it("opens a communication conversation from persisted snake-case notification fields", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-snake-case",
            type: "message_received",
            sourceModule: "communication",
            title: "Stored Message",
            body: "Open stored conversation",
            status: "unread",
            priority: "normal",
            deep_link: {
              type: "conversation_message",
              conversation_id: "conv-from-deep-link",
              message_id: "msg-from-deep-link",
            },
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const messageCard = screen.getByText("Stored Message").closest("button");
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-deep-link",
    );
  });

  it("opens a conversation when the persisted notification source is a conversation", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-source-conversation",
            type: "message_received",
            sourceModule: "communication",
            title: "Source Conversation",
            body: "Open source conversation",
            status: "unread",
            priority: "normal",
            source_type: "conversation",
            source_id: "conv-from-source",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const messageCard = screen
      .getByText("Source Conversation")
      .closest("button");
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-source",
    );
  });

  it("opens a conversation by resolving the source message notification", async () => {
    vi.mocked(getMessage).mockResolvedValueOnce({
      id: "msg-source",
      conversationId: "conv-from-message",
    });

    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-message-source",
            type: "message_received",
            sourceModule: "communication",
            title: "Message Source",
            body: "Open message conversation",
            status: "unread",
            priority: "normal",
            sourceType: "message",
            sourceId: "msg-source",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const messageCard = screen.getByText("Message Source").closest("button");
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    await waitFor(() => expect(getMessage).toHaveBeenCalledWith("msg-source"));
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-message",
    );
  });

  it("opens notification details when clicking an announcement notification", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-announcement",
            type: "announcement_published",
            sourceModule: "announcements",
            title: "New Announcement Title",
            body: "Announcement details body",
            status: "unread",
            priority: "normal",
            deepLink: {
              type: "announcement",
              announcementId: "ann-12345",
            },
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const card = screen.getByText("New Announcement Title").closest("button");
    expect(card).toBeInTheDocument();

    if (card) {
      fireEvent.click(card);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/notifications?notificationId=notif-announcement",
    );
  });

  it("opens notification details for backend announcement notifications without a deep link", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-backend-announcement",
            type: "announcement_published",
            sourceModule: "announcements",
            sourceType: "communication_announcement",
            sourceId: "ann-12345",
            title: "Backend Announcement",
            body: "Announcement details body",
            status: "unread",
            priority: "normal",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    const card = screen.getByText("Backend Announcement").closest("button");
    expect(card).toBeInTheDocument();

    if (card) {
      fireEvent.click(card);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/notifications?notificationId=notif-backend-announcement",
    );
  });

  it("renders and handles sound control speaker toggle", () => {
    // Reset mocked functions
    vi.mocked(getNotificationMuted).mockReturnValue(false);

    const { rerender } = render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    // Find the toggle button
    const soundButton = screen.getByRole("button", {
      name: /mute notifications/i,
    });
    expect(soundButton).toBeInTheDocument();

    // Click sound control
    fireEvent.click(soundButton);

    // Verify setNotificationMuted is called with true (since it was false/unmuted)
    expect(setNotificationMuted).toHaveBeenCalledWith(true);

    // Rerender with muted state mocked as true
    vi.mocked(getNotificationMuted).mockReturnValue(true);
    rerender(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    // Verify the button label / accessibility name changes
    const soundButtonMuted = screen.getByRole("button", {
      name: /unmute notifications/i,
    });
    expect(soundButtonMuted).toBeInTheDocument();

    // Click it again
    fireEvent.click(soundButtonMuted);
    expect(setNotificationMuted).toHaveBeenCalledWith(false);
  });

  it("renders Archive buttons and triggers onArchive on click", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />,
    );

    // Find Archive buttons
    const archiveButtons = screen.getAllByRole("button", {
      name: /^archive:/i,
    });
    expect(archiveButtons.length).toBe(3);

    // Click the first one
    fireEvent.click(archiveButtons[0]);

    // Verify onArchive triggered
    expect(onArchiveMock).toHaveBeenCalledWith("notif-1");
  });

  it("renders only backend-complete filter tabs", () => {
    const onTabChangeMock = vi.fn();
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={onTabChangeMock}
      />,
    );

    expect(screen.getByRole("tab", { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Chat/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Announcements/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: /Academics/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onTabChange callback when a tab is clicked", () => {
    const onTabChangeMock = vi.fn();
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={onTabChangeMock}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Chat/i }));
    expect(onTabChangeMock).toHaveBeenCalledWith("chat");

    fireEvent.click(screen.getByRole("tab", { name: /Announcements/i }));
    expect(onTabChangeMock).toHaveBeenCalledWith("announcements");
  });

  it("uses list semantics with separate notification actions", () => {
    const academicNotifications = [
      {
        id: "academic-1",
        type: "attendance_absence" as const,
        sourceModule: "attendance" as const,
        title: "Attendance Notification",
        body: "Absent",
        status: "unread" as const,
        createdAt: "2026-06-27T20:00:00.000Z",
      },
      {
        id: "academic-2",
        type: "grade_posted" as const,
        sourceModule: "grades" as const,
        title: "Grade Notification",
        body: "A Grade",
        status: "unread" as const,
        createdAt: "2026-06-27T19:00:00.000Z",
      },
      {
        id: "chat-1",
        type: "message_received" as const,
        sourceModule: "communication" as const,
        title: "Chat Notification",
        body: "Hello",
        status: "unread" as const,
        createdAt: "2026-06-27T18:00:00.000Z",
      },
    ];

    render(
      <TopNavNotificationDropdown
        notifications={academicNotifications}
        unreadCount={3}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Attendance Notification")).toBeInTheDocument();
    expect(screen.getByText("Grade Notification")).toBeInTheDocument();
    expect(screen.getByText("Chat Notification")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Notification list" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: /^archive: chat notification$/i }),
    ).toBeInTheDocument();
  });

  it("shows loading and retry states without using the empty state", () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <TopNavNotificationDropdown
        notifications={[]}
        unreadCount={0}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isLoading
        onRefresh={onRefresh}
        isOpen
        onClose={onCloseMock}
      />,
    );

    expect(screen.getByLabelText("Loading notifications")).toBeInTheDocument();
    expect(screen.queryByText("No notifications yet")).not.toBeInTheDocument();

    rerender(
      <TopNavNotificationDropdown
        notifications={[]}
        unreadCount={0}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        error="Request failed"
        onRefresh={onRefresh}
        isOpen
        onClose={onCloseMock}
      />,
    );

    expect(
      screen.getByText("Unable to load notifications"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("uses localized actions and routes to the full notification center", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications.slice(0, 1)}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen
        onClose={onCloseMock}
        labels={{
          archive: "أرشفة",
          viewAll: "عرض كل الإشعارات",
          listLabel: "قائمة الإشعارات",
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "أرشفة: New Announcement" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "عرض كل الإشعارات" }));
    expect(onCloseMock).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/en/communication/notifications");
  });

  describe("status presentation", () => {
    it("keeps routine read state quiet and labels only archived items", () => {
      const archivedNotification = {
        ...mockNotifications[0],
        status: "archived" as const,
        readAt: "2026-06-27T20:00:00.000Z",
      };

      render(
        <TopNavNotificationDropdown
          notifications={[mockNotifications[1], archivedNotification]}
          unreadCount={1}
          onMarkRead={onMarkReadMock}
          onMarkAllRead={onMarkAllReadMock}
          onArchive={onArchiveMock}
          isOpen={true}
          onClose={onCloseMock}
          labels={{ archived: "Archived" }}
        />,
      );

      const archivedBadge = screen.getByText("Archived");

      expect(archivedBadge).toBeInTheDocument();
      expect(archivedBadge).toHaveClass("bg-amber-50", "text-amber-700");
      expect(screen.queryByText("Read")).not.toBeInTheDocument();
      expect(screen.queryByText("Unread")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("unread-indicator")).toHaveLength(1);
    });
  });
});
