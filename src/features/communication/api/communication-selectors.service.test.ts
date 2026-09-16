import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import { searchMessages } from "./communication-selectors.service";

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
});
