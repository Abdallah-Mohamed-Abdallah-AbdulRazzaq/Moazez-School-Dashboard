import { isApiError } from "@/lib/api-error";

export interface AcademicContentUiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  details?: unknown;
  traceId?: string;
}

export function academicContentUiError(error: unknown): AcademicContentUiError {
  if (isApiError(error)) {
    return {
      code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(error.traceId ? { traceId: error.traceId } : {}),
    };
  }

  if (error instanceof Error) {
    return { code: "UNKNOWN_ERROR", message: error.message };
  }

  return { code: "UNKNOWN_ERROR", message: "Unexpected error" };
}
