import { apiClient } from "@/lib/api";
import type {
  CommunicationFile,
  CommunicationResponse,
  UploadFileExtraFields,
} from "@/features/communication/types/communication.types";

export const FILES_UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "audio/mp4",
    "audio/mpeg",
    "audio/webm",
    "image/jpeg",
    "image/png",
    "text/plain",
    "video/mp4",
    "video/webm",
  ],
} as const;

export async function uploadFile(
  file: File,
  extraFields?: UploadFileExtraFields,
): Promise<CommunicationResponse<CommunicationFile>> {
  const formData = new FormData();
  formData.append("file", file);

  Object.entries(extraFields ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value instanceof Blob ? value : String(value));
  });

  const response = await apiClient.post<CommunicationResponse<CommunicationFile>>(
    "/files",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export const filesService = {
  uploadFile,
};
