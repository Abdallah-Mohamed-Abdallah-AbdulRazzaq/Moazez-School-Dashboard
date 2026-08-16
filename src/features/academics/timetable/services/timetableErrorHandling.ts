import { ApiError, isApiError } from "@/lib/api-error";
import type { TimetableConflict } from "@/features/academics/timetable/types/timetable";
import { dayIndexToKey } from "@/features/academics/timetable/services/timetableMappers";

export type TimetableErrorCode =
  | "academics.timetable.config_not_found"
  | "academics.timetable.period_not_found"
  | "academics.timetable.entry_not_found"
  | "academics.timetable.classroom_not_found"
  | "academics.timetable.allocation_not_found"
  | "academics.timetable.publication_not_found"
  | "academics.timetable.invalid_day"
  | "academics.timetable.period_not_in_config"
  | "academics.timetable.classroom_scope_mismatch"
  | "academics.timetable.allocation_mismatch"
  | "academics.timetable.room_not_found"
  | "academics.timetable.entry_not_mutable"
  | "academics.timetable.invalid_time_range"
  | "academics.timetable.period_overlap"
  | "academics.timetable.period_index_taken"
  | "academics.timetable.period_in_use"
  | "academics.timetable.closed_term"
  | "academics.timetable.published_locked"
  | "academics.timetable.publish_blocked"
  | "academics.timetable.no_periods"
  | "academics.timetable.no_entries"
  | "academics.timetable.not_draft"
  | "academics.timetable.entry_conflict"
  | "academics.timetable.teacher_conflict"
  | "academics.timetable.room_conflict"
  | "academics.timetable.invalid_bulk_size"
  | "academics.timetable.duplicate_slot"
  | "academics.timetable.missing_subject_allocation"
  | "academics.timetable.invalid_teacher_allocation";

export interface TimetableFormErrors {
  form: string[];
  fields: Record<string, string[]>;
}

export type TimetableErrorTranslator = (
  code: TimetableErrorCode,
) => string | undefined;

const timetableErrorMessages: Record<TimetableErrorCode, string> = {
  "academics.timetable.config_not_found": "No timetable config exists for this scope.",
  "academics.timetable.period_not_found": "The selected period no longer exists.",
  "academics.timetable.entry_not_found": "The selected timetable entry no longer exists.",
  "academics.timetable.classroom_not_found": "The selected classroom no longer exists or is outside this scope.",
  "academics.timetable.allocation_not_found": "The teacher allocation no longer exists or is outside this scope.",
  "academics.timetable.publication_not_found": "No timetable publication exists for this scope.",
  "academics.timetable.invalid_day": "Choose a valid active day.",
  "academics.timetable.period_not_in_config": "This period does not belong to the timetable config.",
  "academics.timetable.classroom_scope_mismatch": "The classroom does not match the selected timetable scope.",
  "academics.timetable.allocation_mismatch": "The teacher allocation does not match this timetable slot.",
  "academics.timetable.room_not_found": "The selected room no longer exists.",
  "academics.timetable.entry_not_mutable": "This timetable entry cannot be edited.",
  "academics.timetable.invalid_time_range": "Start time must be before end time.",
  "academics.timetable.period_overlap": "Periods cannot overlap.",
  "academics.timetable.period_index_taken": "Period index is already used.",
  "academics.timetable.period_in_use": "Cannot delete a period that is already used.",
  "academics.timetable.closed_term": "This term is closed. Timetable is view-only.",
  "academics.timetable.published_locked": "Published timetable is locked. Unpublish before editing.",
  "academics.timetable.publish_blocked": "Timetable cannot be published until blocking issues are resolved.",
  "academics.timetable.no_periods": "Set up timetable periods before scheduling entries.",
  "academics.timetable.no_entries": "No timetable entries have been added yet.",
  "academics.timetable.not_draft": "Only draft timetable configs can be edited.",
  "academics.timetable.entry_conflict": "This timetable slot conflicts with another entry.",
  "academics.timetable.teacher_conflict": "Teacher is already scheduled for this slot.",
  "academics.timetable.room_conflict": "Room is already booked for this slot.",
  "academics.timetable.invalid_bulk_size": "Too many timetable entries were sent at once.",
  "academics.timetable.duplicate_slot": "This timetable payload contains duplicate slots.",
  "academics.timetable.missing_subject_allocation": "Subject allocation is missing for this slot.",
  "academics.timetable.invalid_teacher_allocation": "Teacher allocation is missing for this subject/classroom.",
};

type BackendErrorShape = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    traceId?: string;
  };
  code?: string;
  message?: string;
  details?: unknown;
};

export function timetableErrorMessage(
  error: unknown,
  fallback = "Unable to complete timetable action.",
  translate?: TimetableErrorTranslator,
): string {
  const code = timetableErrorCode(error);
  if (code && code in timetableErrorMessages) {
    const translatedMessage = translate?.(code as TimetableErrorCode);
    if (translatedMessage) {
      return translatedMessage;
    }
    return timetableErrorMessages[code as TimetableErrorCode];
  }
  if (isApiError(error)) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  const backendMessage = backendErrorPayload(error)?.message;
  return backendMessage || fallback;
}

export function timetableErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  return backendErrorPayload(error)?.code;
}

export function publicationBlockingReason(error: unknown): string | undefined {
  const details = timetableErrorDetails(error);
  if (!isRecord(details) || !Array.isArray(details.blockingReasons)) {
    return undefined;
  }
  const firstReason = details.blockingReasons.find(isRecord);
  return typeof firstReason?.message === "string"
    ? firstReason.message
    : undefined;
}

export function isTimetableErrorCode(
  error: unknown,
  code: TimetableErrorCode,
): boolean {
  return timetableErrorCode(error) === code;
}

export const isTimetableConfigNotFound = (error: unknown): boolean =>
  isApiError(error) &&
  error.code === "academics.timetable.config_not_found";

export function timetableFormErrors(
  error: unknown,
  fallback = "Unable to save timetable changes.",
  translate?: TimetableErrorTranslator,
): TimetableFormErrors {
  const fields = fieldErrorsFromApiError(error);
  const message = timetableErrorMessage(error, fallback, translate);
  return {
    form: message ? [message] : [],
    fields,
  };
}

export function conflictFromTimetableError(
  error: unknown,
): TimetableConflict | null {
  const code = timetableErrorCode(error);
  if (!isConflictCode(code)) {
    return null;
  }
  const details = timetableErrorDetails(error);
  if (!isRecord(details)) {
    return null;
  }
  const periodIndex =
    numberField(details, "periodIndex") ?? numberField(details, "period");
  if (!periodIndex) {
    return null;
  }
  return {
    type: code === "academics.timetable.teacher_conflict" ? "TEACHER" : "ROOM",
    code,
    severity: stringField(details, "severity") ?? "blocking",
    dayKey:
      stringField(details, "dayKey") ??
      dayIndexToKey(numberField(details, "dayOfWeek") ?? 0),
    periodIndex,
    periodId: stringField(details, "periodId"),
    resourceId:
      stringField(details, "resourceId") ??
      stringField(details, "teacherId") ??
      stringField(details, "roomId") ??
      "",
    resourceName:
      stringField(details, "resourceName") ?? timetableErrorMessage(error),
    proposedIndexes: numberArrayField(details, "proposedIndexes") ?? [],
    entryIds: stringArrayField(details, "entryIds") ?? [],
    sections: [],
  };
}

function backendErrorPayload(error: unknown): BackendErrorShape["error"] {
  if (!isRecord(error)) {
    return undefined;
  }
  if (isRecord(error.error)) {
    return error.error;
  }
  return error as BackendErrorShape;
}

function timetableErrorDetails(error: unknown): unknown {
  if (error instanceof ApiError) {
    return error.details;
  }
  return backendErrorPayload(error)?.details;
}

function fieldErrorsFromApiError(error: unknown): Record<string, string[]> {
  if (isApiError(error) && error.errors) {
    return error.errors;
  }
  const details = timetableErrorDetails(error);
  return isRecord(details) ? fieldErrorsFromDetails(details) : {};
}

function fieldErrorsFromDetails(
  details: Record<string, unknown>,
): Record<string, string[]> {
  return Object.entries(details).reduce<Record<string, string[]>>(
    (fieldErrors, [field, value]) => {
      const messages = messagesFromDetailValue(value);
      if (messages.length > 0) {
        fieldErrors[field] = messages;
      }
      return fieldErrors;
    },
    {},
  );
}

function messagesFromDetailValue(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter(
      (message): message is string => typeof message === "string",
    );
  }
  return [];
}

function isConflictCode(code: string | undefined): boolean {
  return (
    code === "academics.timetable.entry_conflict" ||
    code === "academics.timetable.teacher_conflict" ||
    code === "academics.timetable.room_conflict" ||
    code === "academics.timetable.duplicate_slot"
  );
}

function numberField(
  record: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = record[field];
  return typeof value === "number" ? value : undefined;
}

function stringField(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = record[field];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function numberArrayField(
  record: Record<string, unknown>,
  field: string,
): number[] | undefined {
  const value = record[field];
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : undefined;
}

function stringArrayField(
  record: Record<string, unknown>,
  field: string,
): string[] | undefined {
  const value = record[field];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : undefined;
}
