import { describe, expect, it } from "vitest";
import {
  mapRecipientPreview,
  type EmailRecipientPreviewItemDto,
} from "../recipientPreview";

function previewItem(
  overrides: Partial<EmailRecipientPreviewItemDto> = {},
): EmailRecipientPreviewItemDto {
  return {
    userId: "user-1",
    fullName: "Nour Ali",
    username: "nour",
    loginEmail: "nour@school.example",
    contactEmail: "nour@example.com",
    toEmail: "nour@example.com",
    userType: "teacher",
    roleKey: "teacher",
    hasPassword: true,
    mustChangePassword: false,
    credentialVersion: 2,
    reason: null,
    ...overrides,
  };
}

describe("recipient preview mapping", () => {
  it("maps backend recipient fields and sample eligibility", () => {
    const mapped = mapRecipientPreview({
      totalMatched: 2,
      eligible: 1,
      skipped: 1,
      skippedReasons: { missing_contact_email: 1 },
      sample: {
        eligible: [previewItem({ toEmail: "one@example.com" })],
        skipped: [
          previewItem({
            userId: "user-2",
            toEmail: null,
            reason: "missing_contact_email",
          }),
        ],
      },
    });

    expect(mapped).toMatchObject({
      totalMatched: 2,
      eligibleCount: 1,
      skippedCount: 1,
      skippedReasons: { missing_contact_email: 1 },
    });
    expect(mapped.recipients).toEqual([
      expect.objectContaining({
        recipientEmail: "one@example.com",
        eligible: true,
        skipReason: null,
      }),
      expect.objectContaining({
        userId: "user-2",
        eligible: false,
        skipReason: "missing_contact_email",
      }),
    ]);
  });
});
