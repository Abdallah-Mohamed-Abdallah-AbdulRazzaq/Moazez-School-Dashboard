export type EmailUserType =
  | "platform_user"
  | "organization_user"
  | "school_user"
  | "teacher"
  | "parent"
  | "student"
  | "applicant"
  | "pickup_delegate"
  | "service_account";

export interface EmailRecipientPreviewItemDto {
  userId: string | null;
  fullName: string | null;
  username: string | null;
  loginEmail: string | null;
  contactEmail: string | null;
  toEmail: string | null;
  userType: EmailUserType | null;
  roleKey: string | null;
  hasPassword: boolean | null;
  mustChangePassword: boolean | null;
  credentialVersion: number | null;
  reason: string | null;
}

export interface EmailRecipientPreviewResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  sample: {
    eligible: EmailRecipientPreviewItemDto[];
    skipped: EmailRecipientPreviewItemDto[];
  };
}

export interface EmailRecipientPreview {
  userId: string | null;
  fullName: string | null;
  username: string | null;
  loginEmail: string | null;
  contactEmail: string | null;
  recipientEmail: string | null;
  userType: EmailUserType | null;
  roleKey: string | null;
  hasPassword: boolean | null;
  mustChangePassword: boolean | null;
  credentialVersion: number | null;
  eligible: boolean;
  skipReason: string | null;
}

export interface MappedEmailRecipientPreview {
  totalMatched: number;
  eligibleCount: number;
  skippedCount: number;
  skippedReasons: Record<string, number>;
  recipients: EmailRecipientPreview[];
}

function mapPreviewItem(
  recipient: EmailRecipientPreviewItemDto,
  eligible: boolean,
): EmailRecipientPreview {
  const { toEmail, reason, ...identity } = recipient;
  return {
    ...identity,
    recipientEmail: toEmail,
    eligible,
    skipReason: reason,
  };
}

export function mapRecipientPreview(
  response: EmailRecipientPreviewResponseDto,
): MappedEmailRecipientPreview {
  return {
    totalMatched: response.totalMatched,
    eligibleCount: response.eligible,
    skippedCount: response.skipped,
    skippedReasons: { ...response.skippedReasons },
    recipients: [
      ...response.sample.eligible.map((recipient) =>
        mapPreviewItem(recipient, true),
      ),
      ...response.sample.skipped.map((recipient) =>
        mapPreviewItem(recipient, false),
      ),
    ],
  };
}
