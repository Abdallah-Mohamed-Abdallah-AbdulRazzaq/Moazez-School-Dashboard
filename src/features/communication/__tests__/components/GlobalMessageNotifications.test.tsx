import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import {
  createMockSocket,
  type MockSocket,
} from "@/features/communication/__tests__/utils/mock-socket";

let mockSocket: MockSocket;
const pushMock = vi.fn();
const getConversationMock = vi.fn();
const getMessageInfoMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
  }),
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversation: (...args: unknown[]) => getConversationMock(...args),
  getMessageInfo: (...args: unknown[]) => getMessageInfoMock(...args),
}));

vi.mock("@/features/communication/hooks/useNotificationSound", () => ({
  useNotificationSound: () => ({ play: vi.fn() }),
}));

import GlobalMessageNotifications from "@/features/communication/components/GlobalMessageNotifications";

describe("GlobalMessageNotifications", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    pushMock.mockClear();
    getConversationMock.mockResolvedValue({
      data: { id: "conversation-1", title: "Grade 5A" },
    });
    getMessageInfoMock.mockResolvedValue({
      data: {
        message: {
          sender: {
            displayName: "Teacher",
            userId: "user-2",
          },
        },
      },
    });
  });

  it("enriches the generic message notification with sender and conversation details", async () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
        conversationId: "conversation-1",
        message: {
          id: "message-1",
          conversationId: "conversation-1",
          senderUserId: "user-2",
          senderName: "Teacher",
          body: "Please check this",
        },
      });
      mockSocket.simulateEvent(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        {
          notification: {
            notificationId: "notification-1",
            id: "notification-1",
            type: "message_received",
            sourceId: "message-1",
            title: "New message",
            body: "Please check this",
            priority: "normal",
            deepLink: {
              type: "conversation_message",
              conversationId: "conversation-1",
              messageId: "message-1",
            },
          },
        },
      );
    });

    await waitFor(() =>
      expect(screen.getByText("Teacher")).toBeInTheDocument(),
    );
    expect(screen.getByText("Grade 5A")).toBeInTheDocument();
    expect(screen.getByText("Please check this")).toBeInTheDocument();
    expect(screen.queryByText("Normal")).not.toBeInTheDocument();
    expect(screen.getByText("Now")).toBeInTheDocument();
    const openConversation = screen.getByRole("button", {
      name: "Open conversation: Teacher",
    });
    expect(openConversation).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Dismiss notification: Teacher",
      }),
    ).toBeInTheDocument();

    fireEvent.click(openConversation);
    expect(pushMock).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conversation-1",
    );
  });

  it("shows one toast when the notification event arrives before the message event", async () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        {
          notification: {
            notificationId: "notification-1",
            type: "message_received",
            sourceId: "message-1",
            title: "Teacher",
            body: "Please check this",
            deepLink: {
              type: "conversation_message",
              conversationId: "conversation-1",
              messageId: "message-1",
            },
          },
        },
      );
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
        conversationId: "conversation-1",
        message: {
          id: "message-1",
          conversationId: "conversation-1",
          senderUserId: "user-2",
          senderName: "Teacher",
          body: "Please check this",
        },
      });
    });

    await waitFor(() => expect(screen.getAllByText("Teacher")).toHaveLength(1));
    expect(screen.getAllByText("Please check this")).toHaveLength(1);
  });

  it("falls back to generic message content when enrichment is unavailable", async () => {
    getConversationMock.mockRejectedValueOnce(new Error("offline"));
    getMessageInfoMock.mockRejectedValueOnce(new Error("offline"));
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        {
          notification: {
            notificationId: "notification-1",
            title: "New message",
            body: "Please check this",
            deepLink: {
              type: "conversation_message",
              conversationId: "conversation-1",
              messageId: "message-1",
            },
          },
        },
      );
    });

    await waitFor(() =>
      expect(screen.getByText("New message")).toBeInTheDocument(),
    );
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("opens a general notification in notification details", async () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        {
          notification: {
            notificationId: "notification-system-1",
            type: "system_alert",
            sourceModule: "system",
            title: "Maintenance",
            body: "The service will restart soon.",
            priority: "urgent",
          },
        },
      );
    });

    const toast = await screen.findByRole("button", {
      name: "View details: Maintenance",
    });
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    fireEvent.click(toast);

    expect(pushMock).toHaveBeenCalledWith(
      "/en/communication/notifications?notificationId=notification-system-1",
    );
  });

  it("opens notification details when clicking a backend announcement notification toast", async () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        {
          notification: {
            id: "notif-announcement-1",
            type: "announcement_published",
            sourceModule: "announcements",
            sourceType: "communication_announcement",
            sourceId: "announcement-1",
            title: "New Announcement",
            body: "Please read this announcement",
          },
        },
      );
    });

    const toast = await screen.findByRole("button", {
      name: "View announcement: New Announcement",
    });
    fireEvent.click(toast);

    expect(pushMock).toHaveBeenCalledWith(
      "/en/communication/notifications?notificationId=notif-announcement-1",
    );
    expect(screen.queryByText("New Announcement")).not.toBeInTheDocument();
  });
});
