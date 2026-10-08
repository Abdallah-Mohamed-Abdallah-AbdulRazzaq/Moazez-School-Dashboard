import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationDetailsDrawer, {
  type NotificationDetailsDrawerLabels,
} from "@/features/communication/components/notifications/NotificationDetailsDrawer";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import { apiClient } from "@/lib/api";
const originalAdapter = apiClient.defaults.adapter;

const localeState = vi.hoisted(() => ({ locale: "en" }));
vi.mock("next-intl", () => ({ useLocale: () => localeState.locale, useTranslations: () => (key: string) => key }));

const labels: NotificationDetailsDrawerLabels = {
  title: "Notification details", close: "Close", markRead: "Mark read", archive: "Archive",
  loading: "Loading notification", errorTitle: "Unable to load notification", id: "ID",
  notificationTitle: "Title", body: "Body", type: "Type", status: "Status", priority: "Priority",
  sourceModule: "Source module", sourceType: "Source type", sourceId: "Source",
  recipientUserId: "Recipient", createdAt: "Created at", readAt: "Read at", archivedAt: "Archived at",
  advanced: "Advanced", metadata: "Metadata",
};

const notification: CommunicationNotification = {
  id: "notification-1", recipientUserId: "user-1", title: "New message", titleAr: "رسالة جديدة",
  body: "Good morning", bodyAr: "صباح الخير", type: "message_received", priority: "normal",
  status: "unread", sourceModule: "communication", sourceType: "communication_message", sourceId: "message-1",
  createdAt: "2026-10-07T06:10:00Z", metadata: { conversationId: "conversation-1" },
};

beforeEach(() => {
  localeState.locale = "en";
  apiClient.defaults.adapter = async (config) => ({ config, status: 200, statusText: "OK", headers: {},
    data: config.url?.endsWith("/info") ? { message: { status: "sent" } } : [],
  });
});
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

describe("NotificationDetailsDrawer", () => {
  it.each([
    ["en", "New message", "Good morning", "Unread", "Normal priority"],
    ["ar", "رسالة جديدة", "صباح الخير", "غير مقروء", "أولوية عادية"],
  ])("presents localized notification content and badges in %s", (locale, title, body, status, priority) => {
    localeState.locale = locale;
    render(<NotificationDetailsDrawer open notification={notification} labels={labels}
      onClose={vi.fn()} onMarkRead={vi.fn()} onArchive={vi.fn()} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(body)).toBeInTheDocument();
    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.getByText(priority)).toBeInTheDocument();
    expect(screen.getByText(locale === "ar" ? "رسالة" : "Message", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(labels.readAt)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.archivedAt)).not.toBeInTheDocument();
  });

  it("keeps IDs and metadata in a collapsed disclosure", () => {
    render(<NotificationDetailsDrawer open notification={notification} labels={labels}
      onClose={vi.fn()} onMarkRead={vi.fn()} onArchive={vi.fn()} />);
    expect(screen.getByText(notification.id)).not.toBeVisible();
    expect(screen.getByText(/conversation-1/)).not.toBeVisible();
    fireEvent.click(screen.getByText("Technical details"));
    expect(screen.getByText(notification.id)).toBeVisible();
    expect(screen.getByText(/conversation-1/)).toBeVisible();
  });

  it.each([
    ["unread", "user-1", true, true],
    ["read", "user-1", false, true],
    ["archived", "user-1", false, false],
    ["unread", "another-user", false, false],
  ] as const)("preserves action permissions for %s notifications viewed by %s", (status, currentUserId, canRead, canArchive) => {
    const onMarkRead = vi.fn();
    const onArchive = vi.fn();
    render(<NotificationDetailsDrawer open notification={{ ...notification, status,
      readAt: status !== "unread" ? "2026-10-07T06:11:00Z" : null }}
      currentUserId={currentUserId} labels={labels} onClose={vi.fn()}
      onMarkRead={onMarkRead} onArchive={onArchive} />);
    const readButton = screen.queryByRole("button", { name: labels.markRead });
    const archiveButton = screen.queryByRole("button", { name: labels.archive });
    expect(Boolean(readButton)).toBe(canRead);
    expect(Boolean(archiveButton)).toBe(canArchive);
    if (readButton) {
      fireEvent.click(readButton);
      expect(onMarkRead).toHaveBeenCalledWith(notification.id);
    }
    if (archiveButton) {
      fireEvent.click(archiveButton);
      expect(onArchive).toHaveBeenCalledWith(notification.id);
    }
  });
});
