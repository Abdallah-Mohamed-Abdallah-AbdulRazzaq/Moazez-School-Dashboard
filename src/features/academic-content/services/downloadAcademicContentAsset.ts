import { downloadFileBlob } from "@/services/filesService";
import type { ApiRequestConfig } from "@/lib/api";
import type { AcademicContentAsset } from "../types/contracts";

export async function downloadAcademicContentAsset(
  asset: AcademicContentAsset,
  onDownloadProgress?: ApiRequestConfig["onDownloadProgress"],
): Promise<void> {
  const blob = await downloadFileBlob(asset.fileId, { onDownloadProgress });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = objectUrl;
    anchor.download = asset.originalName;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
