import { act, render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import {
  CommunicationRealtimeContext,
  type CommunicationRealtimeContextValue,
} from "@/features/communication/realtime/CommunicationRealtimeProvider";
import { createMockSocket, type MockSocket } from "@/features/communication/__tests__/utils/mock-socket";
import TopNav from "../TopNav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/en/dashboard",
  useSearchParams: () => new URLSearchParams(""),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: { count?: number }) => {
      const translations: Record<string, string> = {
        "top_nav_notifications.title": "Notifications",
        "top_nav_notifications.mark_all_read": "Mark all",
        "top_nav_notifications.all": "All",
        "top_nav_notifications.chat": "Chat",
        "top_nav_notifications.announcements": "Announcements",
        "top_nav_notifications.empty_title": "No notifications yet",
        "top_nav_notifications.empty_description": "No notifications",
        "top_nav_notifications.loading": "Loading notifications",
        "top_nav_notifications.error_title": "Unable to load notifications",
        "top_nav_notifications.retry": "Retry",
        "top_nav_notifications.refresh": "Refresh notifications",
        "top_nav_notifications.archive": "Archive",
        "top_nav_notifications.urgent": "Urgent",
        "top_nav_notifications.high": "High",
        "top_nav_notifications.list_label": "Notification list",
        "top_nav_notifications.tabs_label": "Notification filters",
        "top_nav_notifications.view_all": "View all notifications",
        "top_nav_notifications.untitled": "Untitled update",
        "top_nav_notifications.no_preview": "No preview available.",
        "top_nav_notifications.system": "System",
        "top_nav_notifications.close": "Close notifications",
        "mobile_apps.menu_button": "Mobile apps",
        "mobile_apps.title": "School mobile apps",
        "mobile_apps.close": "Close mobile apps",
        "app_download.student": "Student App",
        "app_download.teacher": "Teacher App",
        "app_download.parent": "Parent App",
        "app_download.dismissal_staff": "Dismissal Staff App",
        "top_nav_profile.title": "Profile",
        "top_nav_profile.description": "Current account details from the authenticated user session.",
        "top_nav_profile.not_provided": "Not provided",
        "top_nav_profile.yes": "Yes",
        "top_nav_profile.no": "No",
        "top_nav_profile.permissions": "Permissions",
        "top_nav_profile.no_permissions": "No permissions available for the active membership.",
        "top_nav_profile.fields.user_id": "User ID",
        "top_nav_profile.fields.username": "Username",
        "top_nav_profile.fields.login_email": "Login email",
        "top_nav_profile.fields.contact_email": "Contact email",
        "top_nav_profile.fields.password_change_required": "Password change required",
        "top_nav_profile.fields.active_role": "Active role",
        "top_nav_profile.fields.organization_id": "Organization ID",
        "top_nav_profile.fields.school_id": "School ID",
        "top_nav_profile.statuses.ACTIVE": "Active",
        "top_nav_profile.user_types.SCHOOL_USER": "School user",
        mute_notifications: "Mute notifications",
        unmute_notifications: "Unmute notifications",
      };
      if (key === "top_nav_notifications.unread_count") {
        return `${values?.count ?? 0} unread updates`;
      }
      return translations[key] ?? key;
    },
}));

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "admin@moazez.dev",
      username: "admin",
      loginEmail: "admin@moazez.dev",
      contactEmail: "owner@school.test",
      firstName: "Test",
      lastName: "User",
      userType: "SCHOOL_USER",
      status: "ACTIVE",
      mustChangePassword: false,
      activeMembership: {
        membershipId: "membership-1",
        organizationId: "organization-1",
        schoolId: "school-1",
        roleId: "role-1",
        roleKey: "school.admin",
        permissions: ["settings.users.view", "attendance.sessions.view"],
      },
    },
    logout: vi.fn(),
    changePassword: vi.fn(),
  }),
}));

// Mock useNotificationSound
vi.mock("@/features/communication/hooks/useNotificationSound", () => ({
  getNotificationMuted: () => false,
  setNotificationMuted: vi.fn(),
}));

let mockSocket: MockSocket;
let getNotificationsMock: ReturnType<typeof vi.fn>;

vi.mock("@/features/communication/api/communication.service", () => ({
  archiveNotification: vi.fn(),
  getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const noRealtimeCommand = () => undefined;

function renderTopNav(userName = "Test User") {
  const realtimeContext: CommunicationRealtimeContextValue = {
    socket:
      mockSocket as unknown as CommunicationRealtimeContextValue["socket"],
    isConnected: true,
    connectionError: null,
    resyncVersion: 0,
    retryConnection: noRealtimeCommand,
    joinConversation: noRealtimeCommand,
    leaveConversation: noRealtimeCommand,
    startTyping: noRealtimeCommand,
    stopTyping: noRealtimeCommand,
  };

  return render(
    <CommunicationRealtimeContext.Provider value={realtimeContext}>
      <TopNav
        userName={userName}
        userRole="Admin"
        schoolName="Test School"
      />
    </CommunicationRealtimeContext.Provider>,
  );
}

describe("TopNav Notification Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    getNotificationsMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the dropdown when the Bell button is clicked", async () => {
    renderTopNav();

    // Let any initial mount updates resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    // Initial state: dropdown dialog is not in the document
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();

    // Click the Bell button
    const bellButton = screen.getByRole("button", { name: /notifications/i });
    act(() => {
      fireEvent.click(bellButton);
    });

    // Dropdown dialog should now be in the document
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
  });

  it("closes the notification sheet from its close control", async () => {
    renderTopNav();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    });
    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "Close notifications" }),
      );
    });

    expect(
      screen.queryByRole("dialog", { name: "Notifications" }),
    ).not.toBeInTheDocument();
  });

  it("updates correctly when socket events alter notification list size or unread badge status", async () => {
    renderTopNav();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    const bellButton = screen.getByRole("button", { name: /notifications/i });
    expect(bellButton).toHaveTextContent("");

    const testNotif = {
      id: "notif-100",
      type: "message_received",
      title: "Incoming Alert",
      body: "Emergency maintenance has begun.",
      status: "unread",
      createdAt: "2026-06-27T20:00:00.000Z",
    };

    await act(async () => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: testNotif,
      });
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(screen.getByText("1")).toBeInTheDocument();

    act(() => {
      fireEvent.click(bellButton);
    });
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Incoming Alert")).toBeInTheDocument();
  });

  it("keeps notification sound control out of the profile menu", async () => {
    renderTopNav();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    fireEvent.click(screen.getByRole("button", { name: /Test User Admin TU/i }));

    expect(
      screen.queryByRole("button", { name: "Mute notifications" }),
    ).not.toBeInTheDocument();
  });

  it("opens the authenticated profile modal from the profile menu", async () => {
    renderTopNav("Fallback User");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    fireEvent.click(screen.getByRole("button", { name: /Fallback User Admin FU/i }));
    fireEvent.click(screen.getByRole("button", { name: "profile" }));

    expect(screen.getByRole("dialog", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("School user - Active")).toBeInTheDocument();
    expect(screen.getAllByText("admin@moazez.dev").length).toBeGreaterThan(0);
    expect(screen.getByText("owner@school.test")).toBeInTheDocument();
    expect(screen.getByText("school.admin")).toBeInTheDocument();
    expect(screen.getByText("settings.users.view")).toBeInTheDocument();
    expect(screen.getByText("attendance.sessions.view")).toBeInTheDocument();
  });

  it("shows all school mobile apps from the global menu", async () => {
    renderTopNav();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Mobile apps" }));
    });

    expect(
      screen.getByRole("dialog", { name: "School mobile apps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Student App")).toBeInTheDocument();
    expect(screen.getByText("Teacher App")).toBeInTheDocument();
    expect(screen.getByText("Parent App")).toBeInTheDocument();
    expect(screen.getByText("Dismissal Staff App")).toBeInTheDocument();
  });

  it("closes the mobile apps sheet from its close control", async () => {
    renderTopNav();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Mobile apps" }));
    });
    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "Close mobile apps" }),
      );
    });

    expect(
      screen.queryByRole("dialog", { name: "School mobile apps" }),
    ).not.toBeInTheDocument();
  });
});
