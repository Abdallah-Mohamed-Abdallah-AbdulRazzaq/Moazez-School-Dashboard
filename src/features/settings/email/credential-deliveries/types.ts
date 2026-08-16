import type { EmailTemplateKey } from "@/features/settings/email/templates/types";
import type {
  EmailRecipientPreview,
  EmailRecipientPreviewResponseDto,
  EmailUserType,
} from "@/features/settings/email/shared/recipientPreview";

export type CredentialDeliveryMode =
  | "LOGIN_INFO_ONLY"
  | "GENERATE_TEMPORARY_PASSWORD"
  | "REGENERATE_TEMPORARY_PASSWORD";

export type CredentialDeliveryUserType = EmailUserType;

export interface CredentialDeliveryAudience {
  userIds?: string[];
  roleKey?: string;
  userType?: CredentialDeliveryUserType;
  missingPasswordOnly?: boolean;
  mustChangePasswordOnly?: boolean;
  allSchool?: boolean;
}

export type EmailRecipientScope =
  | "selected"
  | "role"
  | "user_type"
  | "missing_password"
  | "must_change_password"
  | "with_contact_email"
  | "all_school_users";

export interface CredentialDeliveryPreviewRequest {
  scope: EmailRecipientScope;
  userIds?: string[];
  roleKeys?: string[];
  userTypes?: CredentialDeliveryUserType[];
  includeUsersWithPassword?: boolean;
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  limit?: number;
}

export type CredentialDeliveryPreviewRecipient = EmailRecipientPreview;

export interface CredentialDeliveryPreviewResponse {
  eligibleCount: number;
  skippedCount: number;
  totalMatched: number;
  skippedReasons: Record<string, number>;
  eligibleSample: CredentialDeliveryPreviewRecipient[];
  skippedSample: CredentialDeliveryPreviewRecipient[];
}

export type CredentialDeliveryPreviewResponseDto =
  EmailRecipientPreviewResponseDto;

export interface CreateCredentialDeliveryRequest
  extends CredentialDeliveryPreviewRequest {
  templateKey?: EmailTemplateKey;
  credentialMode: CredentialDeliveryMode;
  maxRecipients?: number;
  dryRun?: boolean;
}
