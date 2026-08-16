import type { UploadedFileRecord } from "@/services/filesService";
import type { AttachmentMeta } from "../types";

type FileUploader = (file: File) => Promise<UploadedFileRecord>;

export async function uploadExcuseAttachments(
  files: File[],
  upload: FileUploader,
): Promise<AttachmentMeta[]> {
  return Promise.all(
    files.map(async (file) => {
      const uploaded = await upload(file);
      return {
        id: uploaded.id,
        name: uploaded.originalName || file.name,
        size: Number(uploaded.sizeBytes) || file.size,
        type: uploaded.mimeType || file.type,
        url: `/api/files/${encodeURIComponent(uploaded.id)}/download`,
      };
    }),
  );
}
