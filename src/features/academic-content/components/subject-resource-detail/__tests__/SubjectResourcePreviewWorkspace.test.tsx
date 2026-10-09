import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentAsset } from "../../../types/contracts";
import SubjectResourcePreviewWorkspace from "../SubjectResourcePreviewWorkspace";

function asset(
  assetId: string,
  name: string,
  sortOrder: number,
): AcademicContentAsset {
  return {
    assetId,
    fileId: `file-${assetId}`,
    originalName: name,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: "1024",
    sortOrder,
    createdAt: "2026-10-01T08:00:00.000Z",
  };
}

describe("SubjectResourcePreviewWorkspace", () => {
  it("shows an actionable empty state when the aggregate has no assets", () => {
    render(
      <SubjectResourcePreviewWorkspace
        assets={[]}
        selectedAssetId={null}
        onSelectAsset={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(screen.getByText("No resource files")).toBeVisible();
  });

  it("switches selected attachments and downloads the active asset", () => {
    const first = asset("first", "worksheet.docx", 0);
    const second = asset("second", "answers.docx", 1);
    const onSelectAsset = vi.fn();
    const onDownload = vi.fn();
    render(
      <SubjectResourcePreviewWorkspace
        assets={[first, second]}
        selectedAssetId="first"
        onSelectAsset={onSelectAsset}
        onDownload={onDownload}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /answers\.docx/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(onSelectAsset).toHaveBeenCalledWith("second");
    expect(onDownload).toHaveBeenCalledWith(first);
    expect(screen.getByText("Preview unavailable")).toBeVisible();
  });
});
