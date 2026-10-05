import { downloadFileBlob } from "@/services/filesService";
import type { AcademicContentAsset } from "../types/contracts";

export async function downloadAcademicContentAsset(
  asset: AcademicContentAsset,
): Promise<void> {
  const blob = await downloadFileBlob(asset.fileId);
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
