import { describe, expect, it } from "vitest";
import type { CampaignComposerValues } from "@/features/settings/email/campaigns/components/CampaignComposer";
import {
  buildCampaignRecipientPreviewPayload,
  buildCreateCampaignPayload,
  buildPreviewCampaignPayload,
  campaignRecipientPreviewFingerprint,
} from "@/features/settings/email/campaigns/utils/campaignPayloads";

function composerValues(
  overrides: Partial<CampaignComposerValues> = {},
): CampaignComposerValues {
  return {
    audienceMode: "all-school",
    audience: { allSchool: true },
    selectedUserIdsText: "",
    customEmailsText: "",
    templateKey: "GENERAL_MESSAGE",
    subject: "Subject",
    title: "",
    bodyHtml: "<p>Hello</p>",
    bodyText: "Hello",
    footerHtml: "",
    ...overrides,
  };
}

describe("campaign payloads", () => {
  it("normalizes set-like audience fields and custom emails", () => {
    expect(
      buildCampaignRecipientPreviewPayload(
        composerValues({
          audienceMode: "selected-users",
          audience: {
            userIds: ["user-2", "user-1", "user-2"],
            customEmails: [" B@example.com ", "a@example.com"],
          },
        }),
      ),
    ).toEqual({
      recipientScope: {
        scope: "selected",
        userIds: ["user-1", "user-2"],
      },
      customEmails: ["a@example.com", "b@example.com"],
      includeDisabledUsers: false,
      requireContactEmail: true,
      allowLoginEmailFallback: false,
      limit: 100,
    });
  });

  it("changes fingerprint when any recipient-sensitive field changes", () => {
    const original = composerValues();
    const changed = composerValues({
      audience: { allSchool: true, customEmails: ["extra@example.com"] },
    });
    expect(campaignRecipientPreviewFingerprint(original)).not.toBe(
      campaignRecipientPreviewFingerprint(changed),
    );
  });

  it("does not turn the preview sample limit into the campaign send cap", () => {
    const payload = buildCreateCampaignPayload(composerValues());
    expect(payload).not.toHaveProperty("limit");
    expect(payload).not.toHaveProperty("maxRecipients");
  });

  it("preserves the campaign footer in the content-preview payload", () => {
    expect(
      buildPreviewCampaignPayload(
        composerValues({ footerHtml: "<footer>School</footer>" }),
      ),
    ).toMatchObject({ footerHtml: "<footer>School</footer>" });
  });
});
