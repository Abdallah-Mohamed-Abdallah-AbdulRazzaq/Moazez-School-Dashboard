import type {
  AcademicContentAsset,
  AcademicContentSubjectResourceDetail,
} from "../types/contracts";

export type SubjectResourcePanel =
  | "preview"
  | "details"
  | "targets"
  | "resources"
  | "readiness"
  | "publication"
  | "revisions";

export type SubjectResourceAssetKind =
  "pdf" | "image" | "video" | "audio" | "text" | "csv" | "download";

export function subjectResourceAssetKind(
  asset: AcademicContentAsset,
): SubjectResourceAssetKind {
  if (asset.mimeType === "application/pdf") return "pdf";
  if (asset.mimeType.startsWith("image/")) return "image";
  if (asset.mimeType.startsWith("video/")) return "video";
  if (asset.mimeType.startsWith("audio/")) return "audio";
  if (asset.mimeType === "text/plain") return "text";
  if (asset.mimeType === "text/csv") return "csv";
  return "download";
}

export function orderedSubjectResourceAssets(
  assets: readonly AcademicContentAsset[],
): AcademicContentAsset[] {
  return [...assets].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.createdAt.localeCompare(right.createdAt),
  );
}

export function firstPreviewableSubjectResourceAsset(
  assets: readonly AcademicContentAsset[],
): AcademicContentAsset | null {
  const orderedAssets = orderedSubjectResourceAssets(assets);
  return (
    orderedAssets.find(
      (asset) => subjectResourceAssetKind(asset) !== "download",
    ) ??
    orderedAssets[0] ??
    null
  );
}

export function emptySubjectResourceDetail(): AcademicContentSubjectResourceDetail {
  return {
    resourceCategory: "OTHER",
    curriculumId: null,
    curriculumUnitId: null,
    curriculumLessonId: null,
  };
}
