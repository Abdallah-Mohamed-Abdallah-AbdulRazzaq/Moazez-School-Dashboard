import { describe, expect, it } from "vitest";

import {
  extractLinkPreviewMetadata,
  firstUrlInText,
  normalizePreviewUrl,
} from "@/features/communication/conversations_redesign/utils/linkPreview";

describe("conversation redesign link preview utilities", () => {
  it("extracts the first URL from plain message text", () => {
    expect(firstUrlInText("Open www.example.com/a then https://second.test")).toBe(
      "www.example.com/a",
    );
  });

  it("normalizes www URLs to https URLs", () => {
    expect(normalizePreviewUrl("www.example.com/a")).toBe(
      "https://www.example.com/a",
    );
  });

  it("extracts Open Graph metadata with fallbacks from HTML", () => {
    const html = `
      <html>
        <head>
          <title>Fallback title</title>
          <meta property="og:title" content="OG Title" />
          <meta name="description" content="Fallback description" />
          <meta property="og:description" content="OG Description" />
          <meta property="og:image" content="/card.png" />
        </head>
      </html>
    `;

    expect(
      extractLinkPreviewMetadata(html, "https://example.com/article"),
    ).toEqual({
      title: "OG Title",
      description: "OG Description",
      image: "https://example.com/card.png",
      domain: "example.com",
      url: "https://example.com/article",
    });
  });
});
