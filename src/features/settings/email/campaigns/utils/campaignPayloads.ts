import type { CampaignComposerValues } from "@/features/settings/email/campaigns/components/CampaignComposer";
import type {
  CreateEmailCampaignRequest,
  EmailCampaignAudience,
  EmailCampaignPreviewRecipientsRequest,
  EmailCampaignPreviewRequest,
  EmailRecipientScopeRequest,
} from "@/features/settings/email/campaigns/types";
import {
  fingerprintCanonicalPayload,
  normalizeStringSet,
} from "@/features/settings/email/shared/previewFingerprint";

function normalizedOrUndefined(
  values: string[] | undefined,
): string[] | undefined {
  const normalized = normalizeStringSet(values);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeEmails(values: string[] | undefined): string[] | undefined {
  return normalizedOrUndefined(
    values?.map((email) => email.trim().toLowerCase()),
  );
}

function recipientScopeFor(
  mode: CampaignComposerValues["audienceMode"],
  audience: EmailCampaignAudience,
): EmailRecipientScopeRequest {
  if (mode === "selected-users") {
    return {
      scope: "selected",
      userIds: normalizedOrUndefined(audience.userIds),
    };
  }
  if (mode === "role") {
    return {
      scope: "role",
      roleKeys: normalizedOrUndefined(
        audience.roleKey ? [audience.roleKey] : undefined,
      ),
    };
  }
  if (mode === "user-type") {
    return {
      scope: "user_type",
      userTypes: audience.userType ? [audience.userType] : undefined,
    };
  }
  return { scope: "all_school_users" };
}

export function buildCampaignRecipientPreviewPayload(
  values: CampaignComposerValues,
): EmailCampaignPreviewRecipientsRequest {
  return {
    recipientScope: recipientScopeFor(values.audienceMode, values.audience),
    customEmails: normalizeEmails(values.audience.customEmails),
    includeDisabledUsers: false,
    requireContactEmail: true,
    allowLoginEmailFallback: false,
    limit: 100,
  };
}

export function campaignRecipientPreviewFingerprint(
  values: CampaignComposerValues,
): string {
  return fingerprintCanonicalPayload(
    buildCampaignRecipientPreviewPayload(values),
  );
}

export function buildPreviewCampaignPayload(
  values: CampaignComposerValues,
): EmailCampaignPreviewRequest {
  return {
    templateKey: values.templateKey,
    subject: values.subject.trim(),
    title: values.title.trim() || undefined,
    bodyHtml: values.bodyHtml,
    bodyText: values.bodyText.trim() || null,
    footerHtml: values.footerHtml.trim() || null,
    previewData: {},
  };
}

export function buildCreateCampaignPayload(
  values: CampaignComposerValues,
): CreateEmailCampaignRequest {
  const recipients = buildCampaignRecipientPreviewPayload(values);
  return {
    recipientScope: recipients.recipientScope,
    customEmails: recipients.customEmails,
    includeDisabledUsers: recipients.includeDisabledUsers,
    requireContactEmail: recipients.requireContactEmail,
    allowLoginEmailFallback: recipients.allowLoginEmailFallback,
    templateKey: values.templateKey,
    subject: values.subject.trim(),
    title: values.title.trim() || undefined,
    bodyHtml: values.bodyHtml,
    bodyText: values.bodyText.trim() || null,
    footerHtml: values.footerHtml.trim() || null,
  };
}

export function findCredentialVariables(values: CampaignComposerValues) {
  const fields = [
    values.subject,
    values.title,
    values.bodyHtml,
    values.bodyText,
    values.footerHtml,
  ];
  const variables = fields.flatMap(
    (field) => field.match(/{{\s*[^}]+?\s*}}/g) || [],
  );
  return Array.from(
    new Set(
      variables.filter((variable) =>
        /credential|temporaryPassword|temporary_password|password/i.test(
          variable,
        ),
      ),
    ),
  );
}
