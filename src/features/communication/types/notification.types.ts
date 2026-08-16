import type {
  CommunicationDateTime,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type NotificationStatus = "unread" | "read" | "archived";
export type CommunicationNotificationStatus = NotificationStatus;
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationSourceModule =
  | "communication"
  | "announcements"
  | "attendance"
  | "grades"
  | "behavior"
  | "reinforcement"
  | "admissions"
  | "students"
  | "system";
export type NotificationType =
  | "announcement_published"
  | "message_received"
  | "message_mention"
  | "attendance_absence"
  | "attendance_late"
  | "attendance_early_leave"
  | "grade_posted"
  | "behavior_record_created"
  | "reinforcement_reward_granted"
  | "system_alert";
export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped";

export interface CommunicationNotification extends CommunicationRecord {
  id: CommunicationId;
  userId?: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  body?: string;
  bodyAr?: string;
  bodyEn?: string;
  message?: string;
  status?: CommunicationNotificationStatus;
  priority?: NotificationPriority;
  type?: NotificationType;
  sourceModule?: NotificationSourceModule;
  sourceType?: string;
  source_type?: string;
  sourceId?: CommunicationId;
  source_id?: CommunicationId;
  entityType?: string;
  entity_type?: string;
  entityId?: CommunicationId;
  entity_id?: CommunicationId;
  conversationId?: CommunicationId;
  conversation_id?: CommunicationId;
  recipientUserId?: CommunicationId;
  readAt?: CommunicationDateTime | null;
  archivedAt?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
  deepLink?: CommunicationRecord | null;
  deep_link?: CommunicationRecord | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListNotificationsParams = {
  status?: NotificationStatus;
  priority?: NotificationPriority;
  type?: NotificationType;
  sourceModule?: NotificationSourceModule;
  sourceType?: string;
  sourceId?: CommunicationId;
  recipientUserId?: CommunicationId;
  createdFrom?: CommunicationDateTime;
  createdTo?: CommunicationDateTime;
  limit?: number;
  page?: number;
};

export interface NotificationDelivery extends CommunicationRecord {
  id: CommunicationId;
  notificationId?: CommunicationId;
  channel?: string;
  status?: NotificationDeliveryStatus;
  provider?: string;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptedAt?: CommunicationDateTime | null;
  sentAt?: CommunicationDateTime | null;
  deliveredAt?: CommunicationDateTime | null;
  failedAt?: CommunicationDateTime | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListNotificationDeliveriesParams = {
  notificationId?: CommunicationId;
  recipientUserId?: CommunicationId;
  channel?: string;
  status?: NotificationDeliveryStatus;
  deliveryStatus?: NotificationDeliveryStatus;
  provider?: string;
  createdFrom?: CommunicationDateTime;
  createdTo?: CommunicationDateTime;
  limit?: number;
  page?: number;
};
