import { isApiError } from "@/lib/api-error";

export type SubjectAllocationErrorCode =
  | "academics.subject_allocation.invalid_scope"
  | "academics.subject_allocation.duplicate_pair"
  | "academics.subject_allocation.invalid_weekly_hours"
  | "academics.subject_allocation.invalid_bulk_size"
  | "academics.subject_allocation.closed_term"
  | "academics.subject_allocation.subject_not_taught"
  | "academics.subject_allocation.dependency_conflict"
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
  "academics.subject_allocation.subject_not_taught":
    "This subject is not taught in the selected grade.",
  "academics.subject_allocation.dependency_conflict":
    "This allocation change is blocked by timetable dependencies.",
  "validation.failed": "Check the submitted subject allocation fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export interface SubjectAllocationUiError {
  message: string;
  traceId?: string;
  details: string[];
  dependency?: CurriculumDependencyDetails;
}

export interface CurriculumDependencyDetails {
  termId?: string;
  gradeId?: string;
  subjectId?: string;
  mutation?: "DEACTIVATE" | "POSITIVE_REQUIREMENT_CHANGE";
  previousWeeklyHours?: number;
  proposedWeeklyHours?: number;
  teacherAllocationCount: number;
  draftTimetableEntryCount: number;
  publishedTimetableEntryCount: number;
  publishedTimetableConfigCount: number;
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
    dependency:
      error.code === "academics.subject_allocation.dependency_conflict"
        ? curriculumDependencyDetails(error.details)
        : undefined,
  };
}

function curriculumDependencyDetails(
  input: unknown,
): CurriculumDependencyDetails {
  const details =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  return {
    termId: optionalString(details.termId),
    gradeId: optionalString(details.gradeId),
    subjectId: optionalString(details.subjectId),
    mutation:
      details.mutation === "DEACTIVATE" ||
      details.mutation === "POSITIVE_REQUIREMENT_CHANGE"
        ? details.mutation
        : undefined,
    previousWeeklyHours: optionalNumber(details.previousWeeklyHours),
    proposedWeeklyHours: optionalNumber(details.proposedWeeklyHours),
    teacherAllocationCount: count(details.teacherAllocationCount),
    draftTimetableEntryCount: count(details.draftTimetableEntryCount),
    publishedTimetableEntryCount: count(details.publishedTimetableEntryCount),
    publishedTimetableConfigCount: count(details.publishedTimetableConfigCount),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
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
