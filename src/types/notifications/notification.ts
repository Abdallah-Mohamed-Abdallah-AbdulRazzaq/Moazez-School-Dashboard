// FILE: src/types/notifications/notification.ts
// Notification model

import type {
  NotificationStage,
  NotificationChannel,
  NotificationStatus,
  Language,
} from "./enums";

export interface Notification {
  id: string;
  recipientId: string; // Guardian ID
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  studentName: string;
  applicationId?: string;
  leadId?: string;
  stage: NotificationStage;
  channels: NotificationChannel[];
  status: Record<NotificationChannel, NotificationStatus>;
  title: string;
  message: string;
  data?: Record<string, unknown>; // Additional data (test scores, interview dates, etc.)
  createdAt: string;
  sentAt?: Record<NotificationChannel, string>;
  readAt?: string;
  language: Language;
}
