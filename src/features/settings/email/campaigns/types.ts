import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";
import type {
  EmailRecipientPreview,
  EmailRecipientPreviewResponseDto,
  EmailUserType,
} from "@/features/settings/email/shared/recipientPreview";
import type {
  EmailDeliveryBatch,
  EmailDeliveryStatus,
} from "@/features/settings/email/deliveries/types";

export interface EmailCampaignAudience {
  userIds?: string[];
  roleKey?: string;
  userType?: EmailUserType;
  allSchool?: boolean;
  customEmails?: string[];
}

export type CampaignRecipientScope =
  | "selected"
  | "role"
  | "user_type"
  | "all_school_users";

export interface EmailRecipientScopeRequest {
  scope: CampaignRecipientScope;
  userIds?: string[];
  roleKeys?: string[];
  userTypes?: EmailUserType[];
}

export interface EmailCampaignPreviewRecipientsRequest {
  recipientScope: EmailRecipientScopeRequest;
  customEmails?: string[];
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  limit?: number;
}

export type EmailCampaignPreviewRecipient = EmailRecipientPreview;

export interface EmailCampaignPreviewRecipientsResponse {
  eligibleCount: number;
  skippedCount: number;
  totalMatched: number;
  skippedReasons: Record<string, number>;
  recipients: EmailCampaignPreviewRecipient[];
}

export type EmailCampaignPreviewRecipientsResponseDto =
  EmailRecipientPreviewResponseDto;

export interface EmailCampaignPreviewRequest {
  templateKey?: EmailTemplateKey;
  subject?: string;
  title?: string;
  bodyHtml: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  previewData?: Record<string, unknown>;
}

export interface EmailCampaignPreviewResponseDto {
  key: EmailTemplateKey;
  subject: string;
  html: string;
  text: string | null;
  missingVariables: string[];
  unknownVariables: string[];
}

export type EmailCampaignPreviewResponse = EmailCampaignPreviewResponseDto;

export interface CreateEmailCampaignRequest
  extends EmailCampaignPreviewRequest {
  recipientScope: EmailRecipientScopeRequest;
  customEmails?: string[];
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  maxRecipients?: number;
}

export interface FetchEmailCampaignsParams {
  status?: EmailDeliveryStatus | "all";
  page?: number;
  limit?: number;
}

export interface EmailCampaignBatch extends EmailDeliveryBatch {
  kind: "GENERAL_CAMPAIGN";
}

export interface EmailCampaignsListResponse {
  items: EmailCampaignBatch[];
  pagination: SettingsPaginationApiDto;
}
