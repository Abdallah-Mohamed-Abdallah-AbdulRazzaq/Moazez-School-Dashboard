import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmbeddedFilePreview, {
  type EmbeddedFilePreviewLabels,
} from "./EmbeddedFilePreview";

const fileCache = vi.hoisted(() => ({ loadAuthenticatedFileUrl: vi.fn() }));

vi.mock("@/lib/files/authenticatedFileUrlCache", () => ({
  loadAuthenticatedFileUrl: fileCache.loadAuthenticatedFileUrl,
}));

const labels: EmbeddedFilePreviewLabels = {
  loading: "Loading preview",
  unavailable: "Preview unavailable",
  unavailableDescription: "Download this file to view it.",
  accessDenied: "Preview access denied",
  accessDeniedDescription: "You do not have permission to preview this file.",
  tooLarge: "This text file is too large to preview.",
  truncated: "Preview truncated",
};

const file = {
  id: "file-1",
  name: "lesson.pdf",
  size: 1024,
  type: "application/pdf",
};

describe("EmbeddedFilePreview", () => {
  beforeEach(() => fileCache.loadAuthenticatedFileUrl.mockReset());

  it.each([
    ["pdf", "application/pdf", "iframe", "Lesson PDF"],
    ["image", "image/png", "img", "Lesson image"],
    ["video", "video/mp4", "video", "Lesson video"],
    ["audio", "audio/mpeg", "audio", "Lesson audio"],
  ] as const)(
    "renders an authenticated %s preview",
    async (kind, mimeType, tagName, accessibleName) => {
      fileCache.loadAuthenticatedFileUrl.mockResolvedValue({
        blob: new Blob(["content"], { type: mimeType }),
        mimeType,
        url: `blob:${kind}`,
      });

      render(
        <EmbeddedFilePreview
          file={{ ...file, name: accessibleName, type: mimeType }}
          kind={kind}
          labels={labels}
        />,
      );

      await waitFor(() => {
        const preview = document.querySelector(tagName);
        expect(preview).toBeVisible();
        expect(preview).toHaveAttribute(
          kind === "pdf" ? "title" : kind === "image" ? "alt" : "aria-label",
          accessibleName,
        );
      });
    },
  );

  it("renders authenticated text and bounded CSV as readable content", async () => {
    fileCache.loadAuthenticatedFileUrl
      .mockResolvedValueOnce({
        blob: new Blob(["Solar system notes"], { type: "text/plain" }),
        mimeType: "text/plain",
        url: "blob:text",
      })
      .mockResolvedValueOnce({
        blob: new Blob(["planet,order\nEarth,3"], { type: "text/csv" }),
        mimeType: "text/csv",
        url: "blob:csv",
      });

    const { rerender } = render(
      <EmbeddedFilePreview
        file={{ ...file, name: "notes.txt", type: "text/plain" }}
        kind="text"
        labels={labels}
      />,
    );
    expect(await screen.findByText("Solar system notes")).toBeVisible();

    rerender(
      <EmbeddedFilePreview
        file={{ ...file, id: "file-2", name: "planets.csv", type: "text/csv" }}
        kind="csv"
        labels={labels}
      />,
    );
    expect(
      await screen.findByRole("table", { name: "planets.csv" }),
    ).toBeVisible();
    expect(screen.getByText("Earth")).toBeVisible();
  });

  it("does not download an unsupported file just to show its fallback", () => {
    render(
      <EmbeddedFilePreview
        file={{
          ...file,
          name: "lesson.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }}
        kind="download"
        labels={labels}
      />,
    );

    expect(screen.getByText("Preview unavailable")).toBeVisible();
    expect(fileCache.loadAuthenticatedFileUrl).not.toHaveBeenCalled();
  });
});
