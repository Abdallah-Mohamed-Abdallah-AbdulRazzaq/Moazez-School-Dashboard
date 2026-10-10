import {
  cancelAcademicContentUpload,
  completeAcademicContentUpload,
  createAcademicContentUpload,
} from "./academicContentApi";
import type {
  AcademicContentFilePolicy,
  AcademicContentUploadCompleteResponse,
} from "../types/contracts";

export const ACADEMIC_CONTENT_UPLOAD_CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export type AcademicContentFileCategory =
  "DOCUMENT" | "IMAGE" | "VIDEO" | "AUDIO" | "ARCHIVE";

export interface AcademicContentFileType {
  extension: string;
  mimeType: string;
  category: AcademicContentFileCategory;
}

const FILE_TYPES: readonly AcademicContentFileType[] = [
  { extension: ".pdf", mimeType: "application/pdf", category: "DOCUMENT" },
  { extension: ".txt", mimeType: "text/plain", category: "DOCUMENT" },
  { extension: ".csv", mimeType: "text/csv", category: "DOCUMENT" },
  { extension: ".doc", mimeType: "application/msword", category: "DOCUMENT" },
  {
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "DOCUMENT",
  },
  {
    extension: ".xls",
    mimeType: "application/vnd.ms-excel",
    category: "DOCUMENT",
  },
  {
    extension: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "DOCUMENT",
  },
  {
    extension: ".ppt",
    mimeType: "application/vnd.ms-powerpoint",
    category: "DOCUMENT",
  },
  {
    extension: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    category: "DOCUMENT",
  },
  { extension: ".jpg", mimeType: "image/jpeg", category: "IMAGE" },
  { extension: ".jpeg", mimeType: "image/jpeg", category: "IMAGE" },
  { extension: ".png", mimeType: "image/png", category: "IMAGE" },
  { extension: ".webp", mimeType: "image/webp", category: "IMAGE" },
  { extension: ".gif", mimeType: "image/gif", category: "IMAGE" },
  { extension: ".mp4", mimeType: "video/mp4", category: "VIDEO" },
  { extension: ".webm", mimeType: "video/webm", category: "VIDEO" },
  { extension: ".mp3", mimeType: "audio/mpeg", category: "AUDIO" },
  { extension: ".m4a", mimeType: "audio/mp4", category: "AUDIO" },
  { extension: ".wav", mimeType: "audio/wav", category: "AUDIO" },
  { extension: ".ogg", mimeType: "audio/ogg", category: "AUDIO" },
  { extension: ".webm", mimeType: "audio/webm", category: "AUDIO" },
  { extension: ".zip", mimeType: "application/zip", category: "ARCHIVE" },
  {
    extension: ".7z",
    mimeType: "application/x-7z-compressed",
    category: "ARCHIVE",
  },
];

export const ACADEMIC_CONTENT_FILE_ACCEPT = Array.from(
  new Set(
    FILE_TYPES.flatMap(({ extension, mimeType }) => [extension, mimeType]),
  ),
).join(",");

export interface AcademicContentUploadProgress {
  uploadedBytes: string;
  totalBytes: string;
  percent: number;
}

export class AcademicContentUploadValidationError extends Error {
  constructor(
    message: string,
    readonly code = "UPLOAD_INVALID_FILE",
  ) {
    super(message);
    this.name = "AcademicContentUploadValidationError";
  }
}

export class AcademicContentUploadRestartRequiredError extends Error {
  readonly code = "UPLOAD_RESTART_REQUIRED";

  constructor() {
    super("The upload session expired. Start the upload again.");
    this.name = "AcademicContentUploadRestartRequiredError";
  }
}

class AcademicContentUploadTransportError extends Error {
  readonly code = "UPLOAD_TRANSPORT_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AcademicContentUploadTransportError";
  }
}

interface ProviderResponse {
  status: number;
  range: string | null;
}

interface ProviderRequest {
  sessionUrl: string;
  body: Blob;
  contentRange: string;
  contentType: string;
  signal?: AbortSignal;
  onProgress?: (loadedBytes: number) => void;
}

export function resolveAcademicContentFileType(
  file: Pick<File, "name" | "type">,
): AcademicContentFileType | null {
  const extension = /\.[^.]+$/u.exec(file.name)?.[0].toLowerCase();
  const browserMimeType = file.type.trim().toLowerCase();
  // Windows reports ZIPs using an alias that the backend registry does not accept.
  const mimeType = browserMimeType === "application/x-zip-compressed"
    ? "application/zip"
    : browserMimeType;
  if (!extension || !mimeType) return null;
  return (
    FILE_TYPES.find(
      (candidate) =>
        candidate.extension === extension && candidate.mimeType === mimeType,
    ) ?? null
  );
}

export function validateAcademicContentFileAgainstPolicy(
  file: File,
  policy: AcademicContentFilePolicy,
): AcademicContentFileType {
  if (!policy.attachmentsEnabled) {
    throw new AcademicContentUploadValidationError(
      "Attachments are disabled by school policy.",
      "UPLOAD_ATTACHMENTS_DISABLED",
    );
  }
  const fileType = resolveAcademicContentFileType(file);
  if (!fileType) {
    throw new AcademicContentUploadValidationError(
      "The file extension and browser MIME type are not an allowed pair.",
    );
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    throw new AcademicContentUploadValidationError(
      "The file must contain at least one byte.",
      "UPLOAD_EMPTY_FILE",
    );
  }
  if (BigInt(file.size) > BigInt(policy.maximumFileSizeBytes)) {
    throw new AcademicContentUploadValidationError(
      `The file exceeds the ${policy.maximumFileSizeBytes}-byte school limit.`,
      "UPLOAD_FILE_TOO_LARGE",
    );
  }

  const enabledByCategory: Record<AcademicContentFileCategory, boolean> = {
    DOCUMENT: policy.documentsEnabled,
    IMAGE: policy.imagesEnabled,
    VIDEO: policy.videosEnabled,
    AUDIO: policy.audioEnabled,
    ARCHIVE: policy.archivesEnabled,
  };
  if (!enabledByCategory[fileType.category]) {
    const categoryLabel =
      fileType.category === "ARCHIVE"
        ? "Archives"
        : `${fileType.category[0]}${fileType.category.slice(1).toLowerCase()} files`;
    throw new AcademicContentUploadValidationError(
      `${categoryLabel} are disabled by school policy.`,
      "UPLOAD_FILE_TYPE_DISABLED",
    );
  }
  return fileType;
}

function abortError(): DOMException {
  return new DOMException("The upload was aborted.", "AbortError");
}

function providerRequest(input: ProviderRequest): Promise<ProviderResponse> {
  return new Promise((resolve, reject) => {
    if (input.signal?.aborted) {
      reject(abortError());
      return;
    }

    const request = new XMLHttpRequest();
    const handleAbort = () => request.abort();
    const cleanup = () =>
      input.signal?.removeEventListener("abort", handleAbort);

    request.open("PUT", input.sessionUrl);
    request.setRequestHeader("Content-Type", input.contentType);
    request.setRequestHeader("Content-Range", input.contentRange);
    request.upload.onprogress = (event) => input.onProgress?.(event.loaded);
    request.onload = () => {
      cleanup();
      resolve({
        status: request.status,
        range: request.getResponseHeader("Range"),
      });
    };
    request.onerror = () => {
      cleanup();
      reject(
        new AcademicContentUploadTransportError(
          "The upload connection failed.",
        ),
      );
    };
    request.onabort = () => {
      cleanup();
      reject(abortError());
    };
    input.signal?.addEventListener("abort", handleAbort, { once: true });
    request.send(input.body);
  });
}

function acknowledgedOffset(range: string | null): number {
  if (!range) return 0;
  const match = /^bytes=0-(\d+)$/u.exec(range.trim());
  if (!match) {
    throw new AcademicContentUploadTransportError(
      "The upload provider returned an invalid acknowledged range.",
    );
  }
  return Number(match[1]) + 1;
}

function boundedAcknowledgedOffset(
  range: string | null,
  totalBytes: number,
): number {
  const offset = acknowledgedOffset(range);
  if (!Number.isSafeInteger(offset) || offset > totalBytes) {
    throw new AcademicContentUploadTransportError(
      "The upload provider acknowledged bytes outside the file boundary.",
    );
  }
  return offset;
}

function isProviderSuccess(status: number): boolean {
  return status === 200 || status === 201;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function assertActiveCapability(status: number): void {
  if (status === 404 || status === 410) {
    throw new AcademicContentUploadRestartRequiredError();
  }
}

async function probeUploadOffset(input: {
  sessionUrl: string;
  contentType: string;
  totalBytes: number;
  signal?: AbortSignal;
}): Promise<{ complete: boolean; offset: number }> {
  const response = await providerRequest({
    sessionUrl: input.sessionUrl,
    body: new Blob([]),
    contentRange: `bytes */${input.totalBytes}`,
    contentType: input.contentType,
    signal: input.signal,
  });
  assertActiveCapability(response.status);
  if (isProviderSuccess(response.status))
    return { complete: true, offset: input.totalBytes };
  if (response.status === 308) {
    return {
      complete: false,
      offset: boundedAcknowledgedOffset(response.range, input.totalBytes),
    };
  }
  throw new AcademicContentUploadTransportError(
    `The upload status probe failed with status ${response.status}.`,
  );
}

export async function uploadAcademicContentFile(input: {
  contentId: string;
  file: File;
  signal?: AbortSignal;
  onProgress?: (progress: AcademicContentUploadProgress) => void;
  onVerifying?: (uploadId: string) => void;
}): Promise<AcademicContentUploadCompleteResponse> {
  const fileType = resolveAcademicContentFileType(input.file);
  if (!fileType) {
    throw new AcademicContentUploadValidationError(
      "The file extension and browser MIME type are not an allowed pair.",
    );
  }
  if (!Number.isSafeInteger(input.file.size) || input.file.size <= 0) {
    throw new AcademicContentUploadValidationError(
      "The file must contain at least one byte.",
      "UPLOAD_EMPTY_FILE",
    );
  }
  if (input.signal?.aborted) throw abortError();

  const intent = await createAcademicContentUpload(input.contentId, {
    clientRequestId: crypto.randomUUID(),
    originalName: input.file.name,
    expectedMimeType: fileType.mimeType,
    expectedSizeBytes: String(input.file.size),
  });

  try {
    let offset = 0;
    let complete = false;
    let recoveryAttempts = 0;

    while (!complete && offset < input.file.size) {
      const endExclusive = Math.min(
        offset + ACADEMIC_CONTENT_UPLOAD_CHUNK_SIZE_BYTES,
        input.file.size,
      );
      let response: ProviderResponse;

      try {
        response = await providerRequest({
          sessionUrl: intent.sessionUrl,
          body: input.file.slice(offset, endExclusive),
          contentRange: `bytes ${offset}-${endExclusive - 1}/${input.file.size}`,
          contentType: intent.expectedMimeType,
          signal: input.signal,
          onProgress: (loadedBytes) => {
            const uploadedBytes = Math.min(
              offset + loadedBytes,
              input.file.size,
            );
            input.onProgress?.({
              uploadedBytes: String(uploadedBytes),
              totalBytes: String(input.file.size),
              percent: Math.round((uploadedBytes / input.file.size) * 100),
            });
          },
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          throw error;
        if (recoveryAttempts >= 2) throw error;
        recoveryAttempts += 1;
        const probe = await probeUploadOffset({
          sessionUrl: intent.sessionUrl,
          contentType: intent.expectedMimeType,
          totalBytes: input.file.size,
          signal: input.signal,
        });
        complete = probe.complete;
        offset = probe.offset;
        continue;
      }

      assertActiveCapability(response.status);
      if (isProviderSuccess(response.status)) {
        complete = true;
        offset = input.file.size;
      } else if (response.status === 308) {
        const nextOffset = boundedAcknowledgedOffset(
          response.range,
          input.file.size,
        );
        if (nextOffset <= offset) {
          throw new AcademicContentUploadTransportError(
            "The upload provider did not acknowledge new bytes.",
          );
        }
        offset = nextOffset;
        recoveryAttempts = 0;
      } else if (isRetryableStatus(response.status)) {
        if (recoveryAttempts >= 2) {
          throw new AcademicContentUploadTransportError(
            `The upload provider remained unavailable with status ${response.status}.`,
          );
        }
        recoveryAttempts += 1;
        const probe = await probeUploadOffset({
          sessionUrl: intent.sessionUrl,
          contentType: intent.expectedMimeType,
          totalBytes: input.file.size,
          signal: input.signal,
        });
        complete = probe.complete;
        offset = probe.offset;
      } else {
        throw new AcademicContentUploadTransportError(
          `The upload provider rejected the request with status ${response.status}.`,
        );
      }
    }

    input.onProgress?.({
      uploadedBytes: String(input.file.size),
      totalBytes: String(input.file.size),
      percent: 100,
    });
    input.onVerifying?.(intent.uploadId);
    return await completeAcademicContentUpload(
      input.contentId,
      intent.uploadId,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      try {
        await cancelAcademicContentUpload(input.contentId, intent.uploadId);
      } catch {
        // Preserve the caller-visible abort even if cleanup is already complete or unavailable.
      }
    }
    throw error;
  }
}
