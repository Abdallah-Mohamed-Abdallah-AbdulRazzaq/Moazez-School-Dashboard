"use client";

import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import NotificationListItem, {
  type NotificationListItemLabels,
} from "./NotificationListItem";

export interface NotificationListLabels extends NotificationListItemLabels {
  emptyTitle: string;
  emptyDescription: string;
}

export interface NotificationListProps {
  notifications: CommunicationNotification[];
  locale: string;
  labels: NotificationListLabels;
  currentUserId?: string;
  isMutating?: boolean;
  onArchive?: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
  onViewDetails?: (notificationId: string) => void;
}

export default function NotificationList({
  labels,
  locale,
  notifications,
  currentUserId,
  isMutating,
  onArchive,
  onMarkRead,
  onViewDetails,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <CommunicationEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          locale={locale}
          labels={labels}
          currentUserId={currentUserId}
          isMutating={isMutating}
          onArchive={onArchive}
          onMarkRead={onMarkRead}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
