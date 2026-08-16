import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  cancelEmailDeliveryBatch,
  fetchEmailDeliveries,
  fetchEmailDeliveryRecipients,
  mapDeliveryBatch,
  mapDeliveryRecipient,
} from "../emailDeliveriesService";
import type { EmailDeliveryBatchDto } from "../../types";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

function batchDto(
  overrides: Partial<EmailDeliveryBatchDto> = {},
): EmailDeliveryBatchDto {
  return {
    batchId: "00000000-0000-4000-8000-000000000001",
    status: "PROCESSING",
    kind: "GENERAL_CAMPAIGN",
    templateKey: "GENERAL_MESSAGE",
    subjectSnapshot: "School notice",
    totalRecipients: 4,
    queuedCount: 2,
    sentCount: 1,
    failedCount: 0,
    skippedCount: 1,
    startedAt: "2026-07-30T09:01:00.000Z",
    completedAt: null,
    cancelledAt: null,
    failureReason: null,
    createdAt: "2026-07-30T09:00:00.000Z",
    updatedAt: "2026-07-30T09:02:00.000Z",
    ...overrides,
  };
}

describe("email delivery transport mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("treats processing batches as cancellable", () => {
    expect(mapDeliveryBatch(batchDto())).toMatchObject({
      subject: "School notice",
      cancellable: true,
      startedAt: "2026-07-30T09:01:00.000Z",
    });
  });

  it("maps every recipient lifecycle field without fabricating skippedAt", () => {
    const recipient = mapDeliveryRecipient({
      id: "recipient-1",
      userId: null,
      toEmail: "guardian@example.com",
      displayName: "Guardian",
      status: "SKIPPED",
      attempts: 0,
      lastAttemptAt: null,
      sentAt: null,
      failureReason: null,
      skippedReason: "duplicate_email",
      createdAt: "2026-07-30T09:00:00.000Z",
      updatedAt: "2026-07-30T09:01:00.000Z",
    });

    expect(recipient).toMatchObject({
      recipientEmail: "guardian@example.com",
      attempts: 0,
      skippedReason: "duplicate_email",
    });
    expect(recipient).not.toHaveProperty("skippedAt");
  });

  it("preserves required pagination on list responses", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: [batchDto()],
        pagination: { page: 1, limit: 20, total: 1 },
      })
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, limit: 50, total: 0 },
      });

    await expect(fetchEmailDeliveries()).resolves.toMatchObject({
      pagination: { page: 1, limit: 20, total: 1 },
    });
    await expect(
      fetchEmailDeliveryRecipients(
        "00000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toMatchObject({
      pagination: { page: 1, limit: 50, total: 0 },
    });
  });

  it("maps the full cancellation response", async () => {
    vi.mocked(apiPost).mockResolvedValue(
      batchDto({ status: "CANCELLED", cancelledAt: "2026-07-30T09:03:00.000Z" }),
    );

    await expect(
      cancelEmailDeliveryBatch("00000000-0000-4000-8000-000000000001"),
    ).resolves.toMatchObject({
      status: "CANCELLED",
      cancelledAt: "2026-07-30T09:03:00.000Z",
      cancellable: false,
    });
  });
});
