import { isApiError } from "@/lib/api-error";
import {
  academicContentErrorLocale,
  academicContentErrorMessage,
} from "./academicContentErrorMessages";

export interface AcademicContentUiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  traceId?: string;
}

const PUBLICATION_ERROR_TRANSLATION_KEYS = {
  "academic_content.publication.idempotency_conflict": "idempotency_conflict",
  "academic_content.publication.lineage_conflict": "lineage_conflict",
  "academic_content.publication.not_ready": "not_ready",
  "academic_content.publication.identical_revision": "identical_revision",
  "academic_content.publication.active_conflict": "active_conflict",
  "academic_content.publication.cannot_unschedule": "cannot_unschedule",
  "academic_content.publication.lifecycle_conflict": "lifecycle_conflict",
  "validation.failed": "validation_failed",
} as const;

export type AcademicContentPublicationErrorTranslationKey =
  | (typeof PUBLICATION_ERROR_TRANSLATION_KEYS)[keyof typeof PUBLICATION_ERROR_TRANSLATION_KEYS]
  | "unknown";

export function academicContentPublicationErrorTranslationKey(
  code: string,
): AcademicContentPublicationErrorTranslationKey {
  return (
    PUBLICATION_ERROR_TRANSLATION_KEYS[
      code as keyof typeof PUBLICATION_ERROR_TRANSLATION_KEYS
    ] ?? "unknown"
  );
}

export function academicContentUiError(
  error: unknown,
  locale = academicContentErrorLocale(),
): AcademicContentUiError {
  if (isApiError(error)) {
    return {
      code: error.code,
      message: academicContentErrorMessage(error.code, locale, error.status),
      ...(error.errors ? { errors: error.errors } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(error.traceId ? { traceId: error.traceId } : {}),
    };
  }

  const code =
    error instanceof Error && "code" in error && typeof error.code === "string"
      ? error.code
      : "UNKNOWN_ERROR";
  return { code, message: academicContentErrorMessage(code, locale) };
}
