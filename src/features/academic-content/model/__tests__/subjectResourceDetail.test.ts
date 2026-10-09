import { describe, expect, it } from "vitest";
import type { AcademicContentAsset } from "../../types/contracts";
import {
  emptySubjectResourceDetail,
  firstPreviewableSubjectResourceAsset,
  orderedSubjectResourceAssets,
  subjectResourceAssetKind,
} from "../subjectResourceDetail";

function asset(
  assetId: string,
  mimeType: string,
  sortOrder = 0,
): AcademicContentAsset {
  return {
    assetId,
    fileId: `file-${assetId}`,
    originalName: `${assetId}.file`,
    mimeType,
    sizeBytes: "100",
    sortOrder,
    createdAt: `2026-10-0${sortOrder + 1}T08:00:00.000Z`,
  };
}

describe("subject resource detail model", () => {
  it("orders assets without mutating the aggregate and selects the first previewable file", () => {
    const assets = [
      asset("office", "application/msword", 0),
      asset("pdf", "application/pdf", 2),
      asset("image", "image/png", 1),
    ];

    expect(
      orderedSubjectResourceAssets(assets).map(({ assetId }) => assetId),
    ).toEqual(["office", "image", "pdf"]);
    expect(assets.map(({ assetId }) => assetId)).toEqual([
      "office",
      "pdf",
      "image",
    ]);
    expect(firstPreviewableSubjectResourceAsset(assets)?.assetId).toBe("image");
  });

  it("falls back to the first ordered file when no file supports inline preview", () => {
    const assets = [
      asset("archive", "application/zip", 2),
      asset("office", "application/msword", 1),
    ];

    expect(firstPreviewableSubjectResourceAsset(assets)?.assetId).toBe(
      "office",
    );
    expect(firstPreviewableSubjectResourceAsset([])).toBeNull();
  });

  it.each([
    ["application/pdf", "pdf"],
    ["image/png", "image"],
    ["video/mp4", "video"],
    ["audio/mpeg", "audio"],
    ["text/plain", "text"],
    ["text/csv", "csv"],
    [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "download",
    ],
  ] as const)("classifies %s as %s", (mimeType, expected) => {
    expect(subjectResourceAssetKind(asset("resource", mimeType))).toBe(
      expected,
    );
  });

  it("provides a contract-valid empty detail", () => {
    expect(emptySubjectResourceDetail()).toEqual({
      resourceCategory: "OTHER",
      curriculumId: null,
      curriculumUnitId: null,
      curriculumLessonId: null,
    });
  });
});
