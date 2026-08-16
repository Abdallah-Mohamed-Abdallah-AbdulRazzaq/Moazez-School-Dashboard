import { apiClient, apiPost } from "@/lib/api";

type LearningMediaUploadIntent = {
  id: string;
  status: string;
  uploadUrl?: string;
  fileId?: string;
};

type LearningMediaUploadCompletion = {
  id: string;
  fileId: string;
  status: string;
  mimeType: string;
  sizeBytes: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

export interface LearningMediaFile {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: string;
}

export type LearningMediaUploadStage = "preparing" | "uploading" | "verifying";
export type LearningMediaUploadProgressCallback = (progress: number) => void;

/**
 * A failed direct upload leaves an unusable server session, so cancel it before
 * propagating the original error to keep the upload lifecycle clean.
 */
export async function uploadLearningMedia(
  file: File,
  onStageChange?: (stage: LearningMediaUploadStage) => void,
  onUploadProgress?: LearningMediaUploadProgressCallback,
): Promise<LearningMediaFile> {
  onStageChange?.("preparing");
  const intent = await apiPost<LearningMediaUploadIntent>(
    "/academics/learning-media/uploads",
    {
      clientRequestId: crypto.randomUUID(),
      originalName: file.name,
      expectedMimeType: file.type,
      expectedSizeBytes: String(file.size),
    },
  );

  if (intent.fileId && intent.status === "READY") {
    return learningMediaFile(intent.fileId, file.name, file.type, String(file.size));
  }

  try {
    onStageChange?.("uploading");
    await putLearningMediaFile(intent.uploadUrl, file, onUploadProgress);
    onStageChange?.("verifying");
    return completeLearningMediaUpload(intent.id, file.name);
  } catch (error) {
    void cancelLearningMediaUpload(intent.id);
    throw error;
  }
}

export function normalizeUploadUrl(uploadUrl: string): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return uploadUrl.replace(/^http:\/\//i, "https://");
  }
  return uploadUrl;
}

export function isCrossOriginUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const targetUrl = new URL(url, window.location.origin);
    return targetUrl.origin !== window.location.origin;
  } catch {
    return false;
  }
}

async function putLearningMediaFile(
  uploadUrl: string | undefined,
  file: File,
  onUploadProgress?: LearningMediaUploadProgressCallback,
): Promise<void> {
  if (!uploadUrl) throw new Error("Learning-media upload did not provide an upload URL.");

  const primaryUrl = normalizeUploadUrl(uploadUrl);

  // Cross-origin storage URLs (e.g. MinIO/S3 at storage.moazez.sa) are proxied
  // directly through the Next.js API server to prevent browser CORS preflight redirect errors.
  if (isCrossOriginUrl(primaryUrl)) {
    const proxyUrl = `/api/media/upload-proxy?targetUrl=${encodeURIComponent(uploadUrl)}`;
    await sendXhrUpload(proxyUrl, file, onUploadProgress);
    return;
  }

  try {
    await sendXhrUpload(primaryUrl, file, onUploadProgress);
  } catch (primaryError) {
    // Fallback to proxying through Next.js API server route if direct upload fails.
    const proxyUrl = `/api/media/upload-proxy?targetUrl=${encodeURIComponent(uploadUrl)}`;
    try {
      await sendXhrUpload(proxyUrl, file, onUploadProgress);
    } catch {
      throw primaryError;
    }
  }
}

function sendXhrUpload(
  targetUrl: string,
  file: File,
  onUploadProgress?: LearningMediaUploadProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new XMLHttpRequest();
    upload.open("PUT", targetUrl);
    upload.setRequestHeader("Content-Type", file.type);
    upload.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    upload.addEventListener("load", () => {
      if (upload.status >= 200 && upload.status < 300) {
        onUploadProgress?.(100);
        resolve();
        return;
      }
      reject(new Error("Learning-media file upload failed."));
    });
    upload.addEventListener("error", () => {
      reject(new Error("Learning-media file upload failed."));
    });
    upload.addEventListener("abort", () => {
      reject(new Error("Learning-media file upload was cancelled."));
    });
    upload.send(file);
  });
}

async function completeLearningMediaUpload(
  uploadId: string,
  filename: string,
): Promise<LearningMediaFile> {
  const completed = await apiPost<LearningMediaUploadCompletion>(
    `/academics/learning-media/uploads/${uploadId}/complete`,
    {},
  );
  return learningMediaFile(
    completed.fileId,
    filename,
    completed.mimeType,
    completed.sizeBytes,
  );
}

function cancelLearningMediaUpload(uploadId: string): Promise<unknown> {
  return apiPost(`/academics/learning-media/uploads/${uploadId}/cancel`).catch(
    () => undefined,
  );
}

function learningMediaFile(
  id: string,
  filename: string,
  mimeType: string,
  sizeBytes: string,
): LearningMediaFile {
  return { id, filename, mimeType, sizeBytes };
}

export interface FileUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPost<FileUploadResponse>("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
}

function filenameFromContentDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return header.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export async function downloadFile(fileId: string): Promise<DownloadedFile> {
  const response = await apiClient.get<Blob>(
    `/api/files/${encodeURIComponent(fileId)}/download`,
    { baseURL: window.location.origin, responseType: "blob" },
  );
  return {
    blob: response.data,
    filename: filenameFromContentDisposition(response.headers["content-disposition"]),
  };
}
