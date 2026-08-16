import { apiClient } from "@/lib/api";

interface UploadedFileResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export async function uploadHomeworkFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadedFileResponse>("/files", formData, {
    headers: { "Content-Type": undefined },
  });
  if (!response.data.id) {
    throw new Error("File upload response did not include an id");
  }
  return response.data.id;
}
