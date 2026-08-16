import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  createEmailCampaign,
  fetchEmailCampaign,
  fetchEmailCampaigns,
  previewEmailCampaign,
} from "../emailCampaignsService";
import type { EmailDeliveryBatchDto } from "@/features/settings/email/deliveries/types";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

function campaignBatchDto(): EmailDeliveryBatchDto {
  return {
    batchId: "00000000-0000-4000-8000-000000000002",
    status: "QUEUED",
    kind: "GENERAL_CAMPAIGN",
    templateKey: "GENERAL_MESSAGE",
    subjectSnapshot: "School notice",
    totalRecipients: 1,
    queuedCount: 1,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
    deliveryMode: "queued",
  };
}

describe("email campaign batch mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps list, detail, and create through the shared batch contract", async () => {
    const batch = campaignBatchDto();
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: [batch],
        pagination: { page: 1, limit: 20, total: 1 },
      })
      .mockResolvedValueOnce(batch);
    vi.mocked(apiPost).mockResolvedValue(batch);

    await expect(fetchEmailCampaigns()).resolves.toMatchObject({
      items: [{ subject: "School notice", deliveryMode: "queued" }],
      pagination: { total: 1 },
    });
    await expect(
      fetchEmailCampaign("00000000-0000-4000-8000-000000000002"),
    ).resolves.toMatchObject({ subject: "School notice" });
    await expect(
      createEmailCampaign({
        recipientScope: { scope: "all_school_users" },
        bodyHtml: "<p>Hello</p>",
      }),
    ).resolves.toMatchObject({ subject: "School notice" });
  });

  it("keeps the exact campaign preview response", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      key: "GENERAL_MESSAGE",
      subject: "Subject",
      html: "<p>Hello</p><footer>School</footer>",
      text: "Hello",
      missingVariables: [],
      unknownVariables: [],
    });

    await expect(
      previewEmailCampaign({
        templateKey: "GENERAL_MESSAGE",
        subject: "Subject",
        bodyHtml: "<p>Hello</p>",
        footerHtml: "<footer>School</footer>",
      }),
    ).resolves.toMatchObject({
      key: "GENERAL_MESSAGE",
      text: "Hello",
    });
  });
});
