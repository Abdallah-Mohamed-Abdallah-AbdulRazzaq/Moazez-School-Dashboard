import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type {
  CreateCredentialDeliveryRequest,
  CredentialDeliveryPreviewRequest,
  EmailRecipientScope,
} from "@/features/settings/email/credential-deliveries/types";
import {
  fingerprintCanonicalPayload,
  normalizeStringSet,
} from "@/features/settings/email/shared/previewFingerprint";

const SCOPE_BY_AUDIENCE_MODE: Record<
  CredentialDeliveryWizardValues["audienceMode"],
  EmailRecipientScope
> = {
  "selected-users": "selected",
  role: "role",
  "user-type": "user_type",
  "missing-password": "missing_password",
  "must-change-password": "must_change_password",
  "all-school": "all_school_users",
};

function normalizedOrUndefined<T extends string>(
  values: T[] | undefined,
): T[] | undefined {
  const normalized = normalizeStringSet(values);
  return normalized.length > 0 ? (normalized as T[]) : undefined;
}

export function buildCredentialRecipientSelection(
  values: CredentialDeliveryWizardValues,
): Omit<CredentialDeliveryPreviewRequest, "limit"> {
  return {
    scope: SCOPE_BY_AUDIENCE_MODE[values.audienceMode],
    userIds: normalizedOrUndefined(values.audience.userIds),
    roleKeys: normalizedOrUndefined(
      values.audience.roleKey ? [values.audience.roleKey] : undefined,
    ),
    userTypes: normalizedOrUndefined(
      values.audience.userType ? [values.audience.userType] : undefined,
    ),
    includeUsersWithPassword:
      values.credentialMode === "REGENERATE_TEMPORARY_PASSWORD",
    includeDisabledUsers: false,
    requireContactEmail: values.requireContactEmail,
    allowLoginEmailFallback: values.allowLoginEmailFallback,
  };
}

export function buildCredentialPreviewPayload(
  values: CredentialDeliveryWizardValues,
): CredentialDeliveryPreviewRequest {
  return {
    ...buildCredentialRecipientSelection(values),
    limit: 100,
  };
}

export function buildCredentialCreatePayload(
  values: CredentialDeliveryWizardValues,
): CreateCredentialDeliveryRequest {
  return {
    ...buildCredentialRecipientSelection(values),
    templateKey: values.templateKey,
    credentialMode: values.credentialMode,
  };
}

export function credentialPreviewFingerprint(
  values: CredentialDeliveryWizardValues,
): string {
  return fingerprintCanonicalPayload({
    ...buildCredentialPreviewPayload(values),
    credentialMode: values.credentialMode,
  });
}
