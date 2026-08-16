import { isApiError } from "@/lib/api-error";

export type SubjectAllocationErrorCode =
  | "academics.subject_allocation.invalid_scope"
  | "academics.subject_allocation.duplicate_pair"
  | "academics.subject_allocation.invalid_weekly_hours"
  | "academics.subject_allocation.invalid_bulk_size"
  | "academics.subject_allocation.closed_term"
  | "validation.failed"
  | "auth.scope.missing";

const errorMessagesByCode: Record<SubjectAllocationErrorCode, string> = {
  "academics.subject_allocation.invalid_scope":
    "The subject allocation is outside the selected academic scope.",
  "academics.subject_allocation.duplicate_pair":
    "The same grade and subject pair appears more than once in this request.",
  "academics.subject_allocation.invalid_weekly_hours":
    "Weekly periods must be a whole number from 0 to 80.",
  "academics.subject_allocation.invalid_bulk_size":
    "Bulk save supports 1-500 subject allocation rows.",
  "academics.subject_allocation.closed_term":
    "This term is closed. Subject allocations are read-only.",
  "validation.failed": "Check the submitted subject allocation fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export interface SubjectAllocationUiError {
  message: string;
  traceId?: string;
  details: string[];
}

export function subjectAllocationUiError(
  error: unknown,
  fallbackMessage: string,
): SubjectAllocationUiError {
  if (!isApiError(error)) {
    return { message: fallbackMessage, details: [] };
  }

  const mappedMessage = isSubjectAllocationErrorCode(error.code)
    ? errorMessagesByCode[error.code]
    : error.message || fallbackMessage;

  return {
    message: mappedMessage,
    traceId: error.traceId,
    details: subjectAllocationDetailMessages(error.details),
  };
}

export function isSubjectAllocationErrorCode(
  code: string,
): code is SubjectAllocationErrorCode {
  return code in errorMessagesByCode;
}

function subjectAllocationDetailMessages(input: unknown): string[] {
  if (typeof input === "string") {
    return [input];
  }
  if (Array.isArray(input)) {
    return input.flatMap(subjectAllocationDetailMessages);
  }
  if (input && typeof input === "object") {
    return Object.values(input).flatMap(subjectAllocationDetailMessages);
  }
  return [];
}
