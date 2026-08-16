import { describe, expect, it } from "vitest";
import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import {
  buildCredentialCreatePayload,
  buildCredentialPreviewPayload,
  credentialPreviewFingerprint,
} from "@/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads";

function wizardValues(
  overrides: Partial<CredentialDeliveryWizardValues> = {},
): CredentialDeliveryWizardValues {
  return {
    audienceMode: "missing-password",
    audience: { missingPasswordOnly: true },
    selectedUserIdsText: "",
    requireContactEmail: true,
    allowLoginEmailFallback: false,
    templateKey: "ACCOUNT_CREDENTIALS",
    credentialMode: "LOGIN_INFO_ONLY",
    ...overrides,
  };
}

describe("credential delivery payloads", () => {
  it("normalizes set-like recipient identifiers", () => {
    const payload = buildCredentialPreviewPayload(
      wizardValues({
        audienceMode: "selected-users",
        audience: { userIds: [" user-2 ", "user-1", "user-2"] },
      }),
    );

    expect(payload.userIds).toEqual(["user-1", "user-2"]);
  });

  it("includes existing-password users when regenerating", () => {
    expect(
      buildCredentialPreviewPayload(
        wizardValues({
          credentialMode: "REGENERATE_TEMPORARY_PASSWORD",
        }),
      ),
    ).toMatchObject({
      scope: "missing_password",
      includeUsersWithPassword: true,
    });
  });

  it("changes the local fingerprint when credential mode changes", () => {
    expect(credentialPreviewFingerprint(wizardValues())).not.toBe(
      credentialPreviewFingerprint(
        wizardValues({ credentialMode: "GENERATE_TEMPORARY_PASSWORD" }),
      ),
    );
  });

  it("uses the same regeneration selection for preview and create", () => {
    const values = wizardValues({
      credentialMode: "REGENERATE_TEMPORARY_PASSWORD",
    });
    const preview = buildCredentialPreviewPayload(values);
    const created = buildCredentialCreatePayload(values);

    expect(created).toMatchObject({
      scope: preview.scope,
      userIds: preview.userIds,
      roleKeys: preview.roleKeys,
      userTypes: preview.userTypes,
      includeUsersWithPassword: true,
      includeDisabledUsers: preview.includeDisabledUsers,
      requireContactEmail: preview.requireContactEmail,
      allowLoginEmailFallback: preview.allowLoginEmailFallback,
    });
    expect(created).not.toHaveProperty("limit");
    expect(created).not.toHaveProperty("maxRecipients");
  });
});
