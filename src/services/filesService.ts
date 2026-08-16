import { apiClient, apiPost, type ApiRequestConfig } from "@/lib/api";

export interface UploadedFileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<UploadedFileRecord> {
  const body = new FormData();
  body.append("file", file);
  return apiPost<UploadedFileRecord>("/files", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadFileBlob(
  fileId: string,
  config?: ApiRequestConfig,
): Promise<Blob> {
  const response = await apiClient.get(
    `/api/files/${encodeURIComponent(fileId)}/download`,
    { ...config, baseURL: "", responseType: "blob" },
  );
  return response.data instanceof Blob
    ? response.data
    : new Blob([response.data as BlobPart], {
        type: response.headers["content-type"] as string | undefined,
      });
}
