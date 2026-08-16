import type {
  CreateLessonContentRequest,
  LessonContentType,
} from "../services/curriculumBackendTypes";

export const MAX_LEARNING_CONTENT_NON_VIDEO_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_LEARNING_CONTENT_VIDEO_FILE_SIZE = 200 * 1024 * 1024;
export const LEARNING_CONTENT_FILE_ACCEPT =
  ".pdf,.txt,.jpg,.jpeg,.png,.mp3,.m4a,.webm,.mp4";
export const LEARNING_CONTENT_VIDEO_ACCEPT = ".webm,.mp4";
export const ALLOWED_LEARNING_CONTENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "video/mp4",
  "video/webm",
]);

export type FileValidationError = "required" | "size" | "mime";
export type LearningContentFormType = LessonContentType | "VIDEO";

export type LearningContentTypeLabels = Record<
  LearningContentFormType,
  string
>;

export function learningContentTypeOptions(
  canUploadFiles: boolean,
  labels: LearningContentTypeLabels,
) {
  return [
    { value: "TEXT", label: labels.TEXT },
    { value: "FILE", label: labels.FILE, disabled: !canUploadFiles },
    { value: "VIDEO", label: labels.VIDEO, disabled: !canUploadFiles },
    { value: "VIDEO_LINK", label: labels.VIDEO_LINK },
    { value: "EXTERNAL_LINK", label: labels.EXTERNAL_LINK },
  ];
}

export function isFileUploadDisabled(isReadOnly: boolean, canUploadFiles: boolean) {
  return isReadOnly || !canUploadFiles;
}

export async function resolveLessonContentFileId(
  file: File | undefined,
  existingFileId: string | null,
  uploader: (
    file: File,
    onStageChange?: (stage: "preparing" | "uploading" | "verifying") => void,
    onUploadProgress?: (progress: number) => void,
  ) => Promise<{ id: string }>,
  onStageChange?: (stage: "preparing" | "uploading" | "verifying") => void,
  onUploadProgress?: (progress: number) => void,
): Promise<string | null> {
  return file
    ? (await uploader(file, onStageChange, onUploadProgress)).id
    : existingFileId;
}

export type ContentForm = {
  id?: string;
  type: LearningContentFormType;
  title: string;
  bodyText: string;
  url: string;
  estimatedMinutes: string;
  isRequired: boolean;
};

export function validateLearningContentFile(
  file: File | undefined,
  existingFileId: string | null,
): FileValidationError | null {
  if (!file && !existingFileId) return "required";
  if (!file) return null;
  if (!ALLOWED_LEARNING_CONTENT_MIME_TYPES.has(file.type)) return "mime";
  const maximumSize = file.type === "video/mp4" || file.type === "video/webm"
    ? MAX_LEARNING_CONTENT_VIDEO_FILE_SIZE
    : MAX_LEARNING_CONTENT_NON_VIDEO_FILE_SIZE;
  if (file.size > maximumSize) return "size";
  return null;
}

export function validateLearningContentVideo(
  file: File | undefined,
  existingFileId: string | null,
): FileValidationError | null {
  const validation = validateLearningContentFile(file, existingFileId);
  if (validation || !file) return validation;
  return file.type.startsWith("video/") ? null : "mime";
}

export function buildContentPayload(
  form: ContentForm,
  fileId?: string | null,
): CreateLessonContentRequest {
  const estimatedMinutes = form.estimatedMinutes.trim()
    ? Number(form.estimatedMinutes)
    : null;
  const common = {
    title: form.title.trim(),
    estimatedMinutes,
    isRequired: form.isRequired,
  };

  if (form.type === "TEXT") {
    return { ...common, type: "TEXT", bodyText: form.bodyText.trim(), url: null };
  }
  if (form.type === "FILE" || form.type === "VIDEO") {
    if (!fileId) throw new Error("File content requires a backend fileId.");
    return { ...common, type: "FILE", bodyText: null, fileId };
  }
  return { ...common, type: form.type, bodyText: null, url: form.url.trim() };
}
