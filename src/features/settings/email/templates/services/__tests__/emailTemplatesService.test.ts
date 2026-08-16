import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  fetchEmailTemplates,
  mapEmailTemplate,
  previewEmailTemplate,
} from "../emailTemplatesService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

describe("email template transport mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves backend template metadata", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: null,
          key: "GENERAL_MESSAGE",
          customized: false,
          subject: "Message",
          preheader: null,
          title: null,
          subtitle: null,
          bodyHtml: "<p>Hello</p>",
          bodyText: "Hello",
          footerHtml: null,
          supportEmail: null,
          supportPhone: null,
          socialLinks: null,
          isActive: true,
          allowedVariables: ["school.name"],
          createdAt: null,
          updatedAt: null,
        },
      ],
    });

    await expect(fetchEmailTemplates()).resolves.toMatchObject({
      items: [
        {
          id: null,
          customized: false,
          createdAt: null,
          updatedAt: null,
        },
      ],
    });
  });

  it("copies mutable template collections at the service boundary", () => {
    const allowedVariables = ["school.name"];
    const mapped = mapEmailTemplate({
      id: null,
      key: "GENERAL_MESSAGE",
      customized: false,
      subject: "Message",
      preheader: null,
      title: null,
      subtitle: null,
      bodyHtml: "<p>Hello</p>",
      bodyText: "Hello",
      footerHtml: null,
      supportEmail: null,
      supportPhone: null,
      socialLinks: null,
      isActive: true,
      allowedVariables,
      createdAt: null,
      updatedAt: null,
    });

    expect(mapped.allowedVariables).toEqual(["school.name"]);
    expect(mapped.allowedVariables).not.toBe(allowedVariables);
  });

  it("preserves every template preview field", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      key: "GENERAL_MESSAGE",
      subject: "Message",
      preheader: null,
      html: "<p>Hello</p>",
      text: "Hello",
      unknownVariables: [],
      missingVariables: ["school.name"],
    });

    await expect(
      previewEmailTemplate("GENERAL_MESSAGE", {}),
    ).resolves.toEqual({
      key: "GENERAL_MESSAGE",
      subject: "Message",
      preheader: null,
      html: "<p>Hello</p>",
      text: "Hello",
      unknownVariables: [],
      missingVariables: ["school.name"],
    });
  });
});
