// FILE: src/types/notifications/enums.ts
// Notification module enums and status types

export type NotificationChannel = "in_app" | "email" | "sms";

export type NotificationStatus = "pending" | "sent" | "failed" | "read";

export type NotificationStage =
  | "lead_created"
  | "lead_contacted"
  | "application_submitted"
  | "documents_pending"
  | "documents_complete"
  | "test_scheduled"
  | "test_completed"
  | "interview_scheduled"
  | "interview_completed"
  | "under_review"
  | "decision_accepted"
  | "decision_waitlisted"
  | "decision_rejected"
  | "enrollment_complete";

export type NotificationPriority = "low" | "medium" | "high";

export type Language = "en" | "ar";
