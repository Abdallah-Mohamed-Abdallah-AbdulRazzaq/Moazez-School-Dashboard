import { isApiError } from "@/lib/api-error";

export type TeacherAllocationErrorCode =
  | "academics.allocation.duplicate"
  | "academics.allocation.invalid_scope"
  | "academics.allocation.invalid_bulk_size"
  | "academics.allocation.duplicate_pair"
  | "academics.allocation.closed_term"
  | "academics.allocation.missing_subject_allocation"
  | "academics.allocation.delete_conflict"
  | "academics.allocation.clear_conflict"
  | "validation.failed"
  | "auth.scope.missing";

const errorMessagesByCode: Record<TeacherAllocationErrorCode, string> = {
  "academics.allocation.duplicate": "Allocation already exists.",
  "academics.allocation.invalid_scope": "The allocation is outside the selected academic scope.",
  "academics.allocation.invalid_bulk_size": "Bulk save supports 1–500 allocations.",
  "academics.allocation.duplicate_pair":
    "The same classroom/subject/teacher assignment appears more than once in this request.",
  "academics.allocation.closed_term": "This term is closed. Allocations are read-only.",
  "academics.allocation.missing_subject_allocation":
    "This subject has no weekly-hours row for the selected grade/term. Configure subject allocation first.",
  "academics.allocation.delete_conflict":
    "This allocation is already used by timetable, lesson plans, or homework. Remove dependencies first.",
  "academics.allocation.clear_conflict":
    "This allocation is already used by timetable, lesson plans, or homework. Remove dependencies first.",
  "validation.failed": "Check the submitted allocation fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export interface TeacherAllocationUiError {
  message: string;
  traceId?: string;
  details: string[];
}

export function teacherAllocationUiError(
  error: unknown,
  fallbackMessage: string,
): TeacherAllocationUiError {
  if (!isApiError(error)) {
    return { message: fallbackMessage, details: [] };
  }

  const mappedMessage = isTeacherAllocationErrorCode(error.code)
    ? errorMessagesByCode[error.code]
    : error.message || fallbackMessage;

  return {
    message: mappedMessage,
    traceId: error.traceId,
    details: teacherAllocationDetailMessages(error.details),
  };
}

export function isTeacherAllocationErrorCode(
  code: string,
): code is TeacherAllocationErrorCode {
  return code in errorMessagesByCode;
}

export function isTeacherAllocationDeleteConflict(error: unknown): boolean {
  return isTeacherAllocationError(error, "academics.allocation.delete_conflict");
}

export function isTeacherAllocationClearConflict(error: unknown): boolean {
  return isTeacherAllocationError(error, "academics.allocation.clear_conflict");
}

export function teacherAllocationConflictDetails(error: unknown): string[] {
  if (!isApiError(error)) {
    return [];
  }

  const detailMessages = teacherAllocationDetailMessages(error.details);
  return detailMessages.length > 0 ? detailMessages : [error.message];
}

function isTeacherAllocationError(
  error: unknown,
  code: TeacherAllocationErrorCode,
): boolean {
  return isApiError(error) && error.code === code;
}

function teacherAllocationDetailMessages(input: unknown): string[] {
  if (typeof input === "string") {
    return [input];
  }
  if (Array.isArray(input)) {
    return input.flatMap(teacherAllocationDetailMessages);
  }
  if (input && typeof input === "object") {
    return Object.values(input).flatMap(teacherAllocationDetailMessages);
  }
  return [];
}
