import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  fetchEmailConnection,
  mapEmailConnection,
  testEmailConnection,
} from "../emailConnectionService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

describe("email connection transport mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves an unconfigured connection without inventing values", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      configured: false,
      providerType: null,
      fromName: null,
      fromEmail: null,
      replyToEmail: null,
      host: null,
      port: null,
      secure: null,
      username: null,
      hasPassword: false,
      hasApiKey: false,
      status: null,
      lastTestedAt: null,
      verifiedAt: null,
      failureReason: null,
      createdAt: null,
      updatedAt: null,
    });

    await expect(fetchEmailConnection()).resolves.toEqual({
      configured: false,
      providerType: null,
      fromName: null,
      fromEmail: null,
      replyToEmail: null,
      host: null,
      port: null,
      secure: null,
      username: null,
      hasPassword: false,
      hasApiKey: false,
      status: null,
      lastTestedAt: null,
      verifiedAt: null,
      failureReason: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it("maps the backend connection DTO through the public boundary mapper", () => {
    expect(
      mapEmailConnection({
        configured: false,
        providerType: null,
        fromName: null,
        fromEmail: null,
        replyToEmail: null,
        host: null,
        port: null,
        secure: null,
        username: null,
        hasPassword: false,
        hasApiKey: false,
        status: null,
        lastTestedAt: null,
        verifiedAt: null,
        failureReason: null,
        createdAt: null,
        updatedAt: null,
      }),
    ).toMatchObject({ configured: false, status: null });
  });

  it("maps the complete successful test response", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      configured: true,
      providerType: "SMTP",
      fromName: "School",
      fromEmail: "school@example.com",
      replyToEmail: null,
      host: "smtp.example.com",
      port: 587,
      secure: false,
      username: "mailer",
      hasPassword: true,
      hasApiKey: false,
      status: "VERIFIED",
      lastTestedAt: "2026-07-30T10:00:00.000Z",
      verifiedAt: "2026-07-30T10:00:00.000Z",
      failureReason: null,
      createdAt: "2026-07-29T10:00:00.000Z",
      updatedAt: "2026-07-30T10:00:00.000Z",
      testRecipient: "admin@example.com",
      deliveryMode: "configuration_validation",
      message: "SMTP configuration was validated.",
    });

    await expect(
      testEmailConnection({ toEmail: "admin@example.com" }),
    ).resolves.toMatchObject({
      configured: true,
      status: "VERIFIED",
      testRecipient: "admin@example.com",
      deliveryMode: "configuration_validation",
    });
  });
});
