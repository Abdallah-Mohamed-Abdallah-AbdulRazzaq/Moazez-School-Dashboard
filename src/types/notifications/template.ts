// FILE: src/types/notifications/template.ts
// Notification template model

import type {
  NotificationStage,
  NotificationChannel,
  NotificationPriority,
} from "./enums";

export interface NotificationTemplate {
  stage: NotificationStage;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  emailSubject: string;
  emailSubjectAr: string;
  smsMessage: string;
  smsMessageAr: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
}
