import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  searchConversations,
  searchMessages,
} from "./communication-selectors.service";

describe("searchMessages", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset();
  });

  it("shows message content or a readable fallback with a localized date", async () => {
    apiMocks.apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: "message-text-id",
            body: "Visible message text",
            type: "text",
            status: "sent",
            sentAt: "2026-09-16T12:30:00.000Z",
          },
          {
            id: "message-image-id",
            type: "image",
            status: "sent",
            createdAt: "2026-09-16T12:30:00.000Z",
          },
          {
            id: "message-hidden-id",
            body: "Content that must stay hidden",
            type: "text",
            status: "hidden",
            createdAt: "2026-09-16T12:30:00.000Z",
          },
        ],
      },
    });

    const options = await searchMessages("conversation-1", "", "en");

    expect(options.map(({ label }) => label)).toEqual([
      "Visible message text",
      "Image message",
      "Hidden message",
    ]);
    expect(options[0].description).not.toContain("T12:30:00.000Z");
    expect(options[0].description).toContain("2026");
  });

  // Regression: Arabic message dropdown dates previously displayed Latin digits.
  it("uses Arabic digits for a timestamp in the Arabic locale", async () => {
    apiMocks.apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: "message-arabic-date-id",
            body: "رسالة",
            type: "text",
            status: "sent",
            sentAt: "2026-09-16T12:30:00.000Z",
          },
        ],
      },
    });

    const [option] = await searchMessages("conversation-1", "", "ar");

    expect(option.description).toContain("٢٠٢٦");
    expect(option.description).not.toContain("2026");
  });
});

describe("searchConversations", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset();
  });

  // Regression: conversation labels previously fell back to internal UUIDs and descriptions.
  it("returns the localized conversation title without extra dropdown text", async () => {
    apiMocks.apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: "dda4cb2d-00b7-43d5-8be9-bc55e3fbdc27",
            titleEn: "Grade 6 Parents",
            titleAr: "أولياء أمور الصف السادس",
            description: "Private group",
          },
        ],
      },
    });

    await expect(searchConversations("", "en")).resolves.toEqual([
      { id: "dda4cb2d-00b7-43d5-8be9-bc55e3fbdc27", label: "Grade 6 Parents" },
    ]);
    await expect(searchConversations("", "ar")).resolves.toEqual([
      {
        id: "dda4cb2d-00b7-43d5-8be9-bc55e3fbdc27",
        label: "أولياء أمور الصف السادس",
      },
    ]);
  });
});
