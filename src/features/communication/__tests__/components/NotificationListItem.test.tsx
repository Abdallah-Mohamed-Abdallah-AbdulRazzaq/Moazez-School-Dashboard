import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotificationListItem from "../../components/notifications/NotificationListItem";
import type { NotificationStatus } from "../../types/notification.types";

describe("NotificationListItem", () => {
  const onMarkReadMock = vi.fn();
  const onArchiveMock = vi.fn();
  const onViewDetailsMock = vi.fn();

  const mockNotification = {
    id: "notif-1",
    type: "announcement_published" as const,
    title: "New Announcement",
    body: "This is an announcement body",
    status: "unread" as const,
    priority: "normal" as const,
    createdAt: "2026-06-27T20:00:00.000Z",
  };

  const labels = {
    unread: "Unread",
    read: "Read",
    untitled: "Untitled",
    noBody: "No Preview",
    type: "Type",
    markRead: "Mark read",
    archive: "Archive",
    viewDetails: "View details",
    archived: "Archived",
  };

  it("renders notification details correctly", () => {
    render(
      <NotificationListItem
        notification={mockNotification}
        locale="en"
        labels={labels}
      />
    );

    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("This is an announcement body")).toBeInTheDocument();
    expect(screen.getByText("Unread")).toBeInTheDocument();
  });

  it("triggers onViewDetails when clicking anywhere on the card", () => {
    render(
      <NotificationListItem
        notification={mockNotification}
        locale="en"
        labels={labels}
        onViewDetails={onViewDetailsMock}
      />
    );

    const card = screen.getByTestId("notification-card");
    fireEvent.click(card);

    expect(onViewDetailsMock).toHaveBeenCalledWith("notif-1");
  });

  it("stops propagation when clicking on action buttons", () => {
    render(
      <NotificationListItem
        notification={{
          ...mockNotification,
          recipientUserId: "user-123",
        }}
        currentUserId="user-123"
        locale="en"
        labels={labels}
        onViewDetails={onViewDetailsMock}
        onMarkRead={onMarkReadMock}
        onArchive={onArchiveMock}
      />
    );

    onViewDetailsMock.mockClear();

    // Click "Mark read" button
    const markReadBtn = screen.getByRole("button", { name: "Mark read" });
    fireEvent.click(markReadBtn);

    expect(onMarkReadMock).toHaveBeenCalledWith("notif-1");
    expect(onViewDetailsMock).not.toHaveBeenCalled(); // No double trigger

    // Click "Archive" button
    const archiveBtn = screen.getByRole("button", { name: "Archive" });
    fireEvent.click(archiveBtn);

    expect(onArchiveMock).toHaveBeenCalledWith("notif-1");
    expect(onViewDetailsMock).not.toHaveBeenCalled(); // No double trigger
  });

  describe("ownership checks", () => {
    it("displays Mark read and Archive actions for owned notifications (recipientUserId === currentUserId)", () => {
      render(
        <NotificationListItem
          notification={{
            ...mockNotification,
            recipientUserId: "user-123",
          }}
          currentUserId="user-123"
          locale="en"
          labels={labels}
          onMarkRead={onMarkReadMock}
          onArchive={onArchiveMock}
        />
      );

      expect(screen.getByRole("button", { name: "Mark read" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    });

    it("displays Mark read and Archive actions for owned notifications (userId === currentUserId)", () => {
      render(
        <NotificationListItem
          notification={{
            ...mockNotification,
            userId: "user-123",
          }}
          currentUserId="user-123"
          locale="en"
          labels={labels}
          onMarkRead={onMarkReadMock}
          onArchive={onArchiveMock}
        />
      );

      expect(screen.getByRole("button", { name: "Mark read" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    });

    it("shows only View details for non-owned notifications (different currentUserId)", () => {
      render(
        <NotificationListItem
          notification={{
            ...mockNotification,
            recipientUserId: "user-456",
            userId: "user-789",
          }}
          currentUserId="user-123"
          locale="en"
          labels={labels}
          onViewDetails={onViewDetailsMock}
          onMarkRead={onMarkReadMock}
          onArchive={onArchiveMock}
        />
      );

      expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Mark read" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    });

    it("shows only View details for missing-owner notifications (no currentUserId)", () => {
      render(
        <NotificationListItem
          notification={{
            ...mockNotification,
            recipientUserId: "user-123",
          }}
          locale="en"
          labels={labels}
          onViewDetails={onViewDetailsMock}
          onMarkRead={onMarkReadMock}
          onArchive={onArchiveMock}
        />
      );

      expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Mark read" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    });
  });

  describe("status badges rendering", () => {
    it("renders both Read and Archived status badges side-by-side when notification is read and archived", () => {
      const archivedNotification = {
        ...mockNotification,
        status: "archived" as const,
        readAt: "2026-06-27T20:00:00.000Z",
      };

      const labelsWithArchived = {
        ...labels,
        archived: "Archived",
      };

      render(
        <NotificationListItem
          notification={archivedNotification}
          locale="en"
          labels={labelsWithArchived}
        />
      );

      expect(screen.getByText("Read")).toBeInTheDocument();
      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("renders both Read and Archived (fallback) status badges when labels.archived is undefined", () => {
      const archivedNotification = {
        ...mockNotification,
        status: "archived" as const,
        readAt: "2026-06-27T20:00:00.000Z",
      };

      render(
        <NotificationListItem
          notification={archivedNotification}
          locale="en"
          labels={labels}
        />
      );

      expect(screen.getByText("Read")).toBeInTheDocument();
      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("renders a neutral badge with formatted text when an unknown status is passed", () => {
      const snoozedNotification = {
        ...mockNotification,
        status: "snoozed_again" as unknown as NotificationStatus,
        readAt: "2026-06-27T20:00:00.000Z",
      };

      render(
        <NotificationListItem
          notification={snoozedNotification}
          locale="en"
          labels={labels}
        />
      );

      expect(screen.getByText("Read")).toBeInTheDocument();
      expect(screen.getByText("snoozed again")).toBeInTheDocument();
    });
  });
});
