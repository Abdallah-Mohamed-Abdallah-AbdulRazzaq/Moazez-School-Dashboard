import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/lib/api";
import { createCredentialDelivery } from "../credentialDeliveryService";

vi.mock("@/lib/api", () => ({ apiPost: vi.fn() }));

describe("credential delivery create mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the complete mapped delivery batch", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      batchId: "00000000-0000-4000-8000-000000000003",
      status: "QUEUED",
      kind: "CREDENTIAL_DELIVERY",
      templateKey: "ACCOUNT_CREDENTIALS",
      subjectSnapshot: "Account credentials",
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
    });

    await expect(
      createCredentialDelivery({
        scope: "missing_password",
        credentialMode: "GENERATE_TEMPORARY_PASSWORD",
      }),
    ).resolves.toMatchObject({
      kind: "CREDENTIAL_DELIVERY",
      subject: "Account credentials",
      deliveryMode: "queued",
      cancellable: true,
    });
  });
});
