import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import NotificationsPage from "../../pages/NotificationsPage";
import type { CommunicationNotification } from "../../types/notification.types";

// Mock hooks
const mockUser = { id: "user-123" };

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/communication/notifications",
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

// We need to control the useNotifications hook response
const mockNotifications = {
  notifications: [] as CommunicationNotification[],
  total: 0,
  unreadCount: 0,
  filters: {
    status: "all",
    priority: "",
    type: "",
    sourceModule: "",
    sourceType: "",
    sourceId: "",
    recipientUserId: "",
    createdFrom: "",
    createdTo: "",
  },
  setFilters: vi.fn(),
  pagination: {
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  },
  setPage: vi.fn(),
  setLimit: vi.fn(),
  isLoading: false,
  isRefreshing: false,
  isMutating: false,
  error: null,
  refresh: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  archive: vi.fn(),
};

vi.mock("@/features/communication/hooks/useNotifications", () => ({
  useNotifications: () => mockNotifications,
}));

vi.mock("@/features/communication/hooks/useNotificationDetails", () => ({
  useNotificationDetails: () => ({
    selectedNotificationId: null,
    notification: null,
    isLoading: false,
    error: null,
    open: vi.fn(),
    close: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("NotificationsPage - Mark All Read Button Visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.notifications = [];
    mockNotifications.total = 0;
    mockNotifications.unreadCount = 0;
    mockNotifications.isLoading = false;
  });

  it("should hide 'Mark All Read' button when notifications list is empty", () => {
    mockNotifications.notifications = [];
    mockNotifications.total = 0;
    mockNotifications.unreadCount = 0;

    render(<NotificationsPage />);

    expect(screen.queryByRole("button", { name: /Mark All Read/i })).not.toBeInTheDocument();
  });

  it("should show 'Mark All Read' button when ALL notifications are owned by the signed-in user (recipientUserId)", () => {
    mockNotifications.notifications = [
      { id: "1", recipientUserId: "user-123", status: "unread" },
      { id: "2", recipientUserId: "user-123", status: "unread" },
    ];
    mockNotifications.total = 2;
    mockNotifications.unreadCount = 2;

    render(<NotificationsPage />);

    expect(screen.getByRole("button", { name: /Mark All Read/i })).toBeInTheDocument();
  });

  it("should show 'Mark All Read' button when ALL notifications are owned by the signed-in user (userId)", () => {
    mockNotifications.notifications = [
      { id: "1", userId: "user-123", status: "unread" },
      { id: "2", userId: "user-123", status: "unread" },
    ];
    mockNotifications.total = 2;
    mockNotifications.unreadCount = 2;

    render(<NotificationsPage />);

    expect(screen.getByRole("button", { name: /Mark All Read/i })).toBeInTheDocument();
  });

  it("should hide 'Mark All Read' button if any notification is not owned by the signed-in user (mixed-owner)", () => {
    mockNotifications.notifications = [
      { id: "1", recipientUserId: "user-123", status: "unread" },
      { id: "2", recipientUserId: "other-user", status: "unread" },
    ];
    mockNotifications.total = 2;
    mockNotifications.unreadCount = 2;

    render(<NotificationsPage />);

    expect(screen.queryByRole("button", { name: /Mark All Read/i })).not.toBeInTheDocument();
  });

  it("should hide 'Mark All Read' button if all notifications are not owned by the signed-in user", () => {
    mockNotifications.notifications = [
      { id: "1", recipientUserId: "other-user", status: "unread" },
    ];
    mockNotifications.total = 1;
    mockNotifications.unreadCount = 1;

    render(<NotificationsPage />);

    expect(screen.queryByRole("button", { name: /Mark All Read/i })).not.toBeInTheDocument();
  });

  it("should hide 'Mark All Read' button if notifications have missing recipient/user identifiers", () => {
    mockNotifications.notifications = [
      { id: "1", status: "unread" },
    ];
    mockNotifications.total = 1;
    mockNotifications.unreadCount = 1;

    render(<NotificationsPage />);

    expect(screen.queryByRole("button", { name: /Mark All Read/i })).not.toBeInTheDocument();
  });
});
