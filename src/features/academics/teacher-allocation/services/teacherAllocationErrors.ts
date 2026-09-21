import { isApiError } from "@/lib/api-error";
import type { TeacherAllocationReassignmentBlocker } from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";

export type TeacherAllocationErrorCode =
  | "academics.allocation.duplicate"
  | "academics.allocation.invalid_scope"
  | "academics.allocation.invalid_bulk_size"
  | "academics.allocation.duplicate_pair"
  | "academics.allocation.closed_term"
  | "academics.allocation.missing_subject_allocation"
  | "academics.allocation.delete_conflict"
  | "academics.allocation.clear_conflict"
  | "academics.allocation.reassignment_target_not_found"
  | "academics.allocation.reassignment_target_ineligible"
  | "academics.allocation.reassignment_blocked"
  | "academics.allocation.reassignment_stale_preview"
  | "academics.allocation.reassignment_concurrent_change"
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
  "academics.allocation.reassignment_target_not_found":
    "The selected replacement teacher could not be found.",
  "academics.allocation.reassignment_target_ineligible":
    "The selected teacher is not eligible for this allocation.",
  "academics.allocation.reassignment_blocked":
    "This teacher reassignment is blocked by dependent records.",
  "academics.allocation.reassignment_stale_preview":
    "The reassignment impact changed. Review it again before confirming.",
  "academics.allocation.reassignment_concurrent_change":
    "The allocation changed while it was being reassigned. Refresh and try again.",
  "validation.failed": "Check the submitted allocation fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export type TeacherAllocationReassignmentFailureKind =
  | "target_not_found"
  | "target_ineligible"
  | "blocked"
  | "stale_preview"
  | "concurrent_change"
  | "unknown";

export interface TeacherAllocationReassignmentFailure {
  kind: TeacherAllocationReassignmentFailureKind;
  reasonCode?: string;
  blockers: TeacherAllocationReassignmentBlocker[];
  traceId?: string;
}

const reassignmentFailureKinds: Record<
  string,
  TeacherAllocationReassignmentFailureKind
> = {
  "academics.allocation.reassignment_target_not_found": "target_not_found",
  "academics.allocation.reassignment_target_ineligible": "target_ineligible",
  "academics.allocation.reassignment_blocked": "blocked",
  "academics.allocation.reassignment_stale_preview": "stale_preview",
  "academics.allocation.reassignment_concurrent_change": "concurrent_change",
};

const reassignmentBlockerDomains = new Set([
  "allocation",
  "timetable",
  "reinforcement",
  "announcements",
]);

const reassignmentBlockerCodes = new Set([
  "target_is_current_teacher",
  "target_already_allocated",
  "target_teacher_conflict",
  "active_reinforcement_tasks",
  "mutable_teacher_announcements",
]);

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

export function teacherAllocationReassignmentFailure(
  error: unknown,
): TeacherAllocationReassignmentFailure {
  if (!isApiError(error)) {
    return { kind: "unknown", blockers: [] };
  }

  const details = objectRecord(error.details);
  const reasonCode = details?.reasonCode;
  return {
    kind: reassignmentFailureKinds[error.code] ?? "unknown",
    ...(typeof reasonCode === "string" ? { reasonCode } : {}),
    blockers: parseReassignmentBlockers(details?.blockers),
    ...(error.traceId ? { traceId: error.traceId } : {}),
  };
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

function objectRecord(input: unknown): Record<string, unknown> | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }
  return input as Record<string, unknown>;
}

function parseReassignmentBlockers(
  input: unknown,
): TeacherAllocationReassignmentBlocker[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.flatMap((candidate) => {
    const blocker = parseReassignmentBlocker(candidate);
    return blocker ? [blocker] : [];
  });
}

function parseReassignmentBlocker(
  input: unknown,
): TeacherAllocationReassignmentBlocker | undefined {
  const blocker = objectRecord(input);
  if (!blocker || !isBlockerDomain(blocker.domain) || !isBlockerCode(blocker.code)) {
    return undefined;
  }
  if (typeof blocker.count !== "number") {
    return undefined;
  }
  const statuses = numericRecord(blocker.statuses);
  return {
    domain: blocker.domain,
    code: blocker.code,
    count: blocker.count,
    ...(statuses ? { statuses } : {}),
  };
}

function isBlockerDomain(
  input: unknown,
): input is TeacherAllocationReassignmentBlocker["domain"] {
  return typeof input === "string" && reassignmentBlockerDomains.has(input);
}

function isBlockerCode(
  input: unknown,
): input is TeacherAllocationReassignmentBlocker["code"] {
  return typeof input === "string" && reassignmentBlockerCodes.has(input);
}

function numericRecord(input: unknown): Record<string, number> | undefined {
  const record = objectRecord(input);
  if (!record) {
    return undefined;
  }
  const entries = Object.entries(record).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
