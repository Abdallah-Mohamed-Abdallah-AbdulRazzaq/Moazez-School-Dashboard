import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";

export type EmailDeliveryKind = "CREDENTIAL_DELIVERY" | "GENERAL_CAMPAIGN";
export type EmailDeliveryStatus =
  | "DRAFT"
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export type EmailRecipientStatus =
  | "PENDING"
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED";

export interface FetchEmailDeliveriesParams {
  kind?: EmailDeliveryKind | "all";
  status?: EmailDeliveryStatus | "all";
  page?: number;
  limit?: number;
}

export interface EmailDeliveryBatchDto {
  batchId: string;
  status: EmailDeliveryStatus;
  kind: EmailDeliveryKind;
  templateKey: EmailTemplateKey | null;
  subjectSnapshot: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMode?: "queued";
}

export interface EmailDeliveryBatch {
  batchId: string;
  status: EmailDeliveryStatus;
  kind: EmailDeliveryKind;
  templateKey: EmailTemplateKey | null;
  subject: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryMode?: "queued";
  cancellable: boolean;
}

export interface EmailDeliveryRecipientDto {
  id: string;
  userId: string | null;
  toEmail: string;
  displayName: string | null;
  status: EmailRecipientStatus;
  attempts: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  skippedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDeliveryRecipient {
  id: string;
  userId: string | null;
  recipientEmail: string;
  fullName: string | null;
  status: EmailRecipientStatus;
  attempts: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  skippedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDeliveriesListResponseDto {
  items: EmailDeliveryBatchDto[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveriesListResponse {
  items: EmailDeliveryBatch[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipientsResponseDto {
  items: EmailDeliveryRecipientDto[];
  pagination: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipientsResponse {
  items: EmailDeliveryRecipient[];
  pagination: SettingsPaginationApiDto;
}
