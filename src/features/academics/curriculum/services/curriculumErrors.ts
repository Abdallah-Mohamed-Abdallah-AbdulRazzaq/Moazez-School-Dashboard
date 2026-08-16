import { isApiError } from "@/lib/api-error";

export type CurriculumErrorCode =
  | "academics.curriculum.not_found"
  | "academics.curriculum.duplicate"
  | "academics.curriculum.invalid_scope"
  | "academics.curriculum.read_only"
  | "academics.curriculum.activation_incomplete"
  | "academics.curriculum.unit_not_found"
  | "academics.curriculum.lesson_not_found"
  | "academics.curriculum.invalid_reorder"
  | "academics.lesson_content.not_found"
  | "academics.lesson_content.invalid_scope"
  | "academics.lesson_content.invalid_type_payload"
  | "academics.lesson_content.invalid_url"
  | "academics.lesson_content.file_not_found"
  | "academics.lesson_content.read_only"
  | "learning.content.publication_conflict"
  | "learning.media.not_ready"
  | "learning.media.unsupported_type"
  | "learning.media.upload_expired"
  | "learning.media.upload_conflict"
  | "learning.media.size_exceeded"
  | "learning.media.verification_failed"
  | "files.uploads.size_exceeded"
  | "files.uploads.mime_not_allowed"
  | "validation.failed"
  | "auth.scope.missing";

const curriculumErrorMessages: Record<CurriculumErrorCode, string> = {
  "academics.curriculum.not_found": "The curriculum could not be found.",
  "academics.curriculum.duplicate":
    "A curriculum already exists for this academic scope.",
  "academics.curriculum.invalid_scope":
    "The curriculum is outside the selected academic scope.",
  "academics.curriculum.read_only": "This curriculum is read-only.",
  "academics.curriculum.activation_incomplete":
    "Add at least one non-deleted unit and one non-deleted lesson before activation.",
  "academics.curriculum.unit_not_found": "The selected unit could not be found.",
  "academics.curriculum.lesson_not_found":
    "The selected lesson could not be found.",
  "academics.curriculum.invalid_reorder":
    "The requested order is not valid for this curriculum.",
  "academics.lesson_content.not_found":
    "The selected lesson content item could not be found.",
  "academics.lesson_content.invalid_scope":
    "The lesson content item is outside the selected curriculum hierarchy.",
  "academics.lesson_content.invalid_type_payload":
    "The content fields do not match the selected content type.",
  "academics.lesson_content.invalid_url":
    "Lesson content links must use HTTP or HTTPS.",
  "academics.lesson_content.file_not_found":
    "The selected file could not be found.",
  "academics.lesson_content.read_only": "This lesson content item is read-only.",
  "learning.content.publication_conflict":
    "This publication action is not valid for the current content state.",
  "learning.media.not_ready": "The uploaded learning media is not ready yet.",
  "learning.media.unsupported_type": "This learning-media type is not supported.",
  "learning.media.upload_expired": "This learning-media upload has expired.",
  "learning.media.upload_conflict": "This learning-media upload conflicts with its current state.",
  "learning.media.size_exceeded": "The selected file exceeds the allowed size limit.",
  "learning.media.verification_failed": "The uploaded file could not be verified.",
  "files.uploads.size_exceeded": "The selected file exceeds the 10 MB limit.",
  "files.uploads.mime_not_allowed": "This file type is not supported.",
  "validation.failed": "Check the submitted curriculum fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export interface CurriculumUiError {
  message: string;
  traceId?: string;
  details: string[];
  fieldErrors: Record<string, string[]>;
}

export interface CurriculumFormErrors<Field extends string> {
  fieldErrors: Partial<Record<Field, string>>;
  formMessages: string[];
}

export function curriculumUiError(
  error: unknown,
  fallbackMessage: string,
): CurriculumUiError {
  if (!isApiError(error)) {
    return { message: fallbackMessage, details: [], fieldErrors: {} };
  }

  const message = isCurriculumErrorCode(error.code)
    ? curriculumErrorMessages[error.code]
    : error.message || fallbackMessage;

  return {
    message,
    traceId: error.traceId,
    details: detailMessages(error.details),
    fieldErrors: error.errors ?? {},
  };
}

export function curriculumFormErrors<Field extends string>(
  error: CurriculumUiError,
  fields: readonly Field[],
): CurriculumFormErrors<Field> {
  const knownFields = new Set<string>(fields);
  const fieldErrors: Partial<Record<Field, string>> = {};
  const formMessages = [...error.details];

  for (const [path, messages] of Object.entries(error.fieldErrors)) {
    const matchedField = [path, ...path.split(".").reverse()].find((segment) =>
      knownFields.has(segment),
    );

    if (matchedField) {
      fieldErrors[matchedField as Field] ??= messages[0];
    } else {
      formMessages.push(...messages);
    }
  }

  return { fieldErrors, formMessages };
}

export function isCurriculumErrorCode(
  code: string,
): code is CurriculumErrorCode {
  return code in curriculumErrorMessages;
}

function detailMessages(input: unknown): string[] {
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap(detailMessages);
  if (input && typeof input === "object") {
    return Object.values(input).flatMap(detailMessages);
  }
  return [];
}
