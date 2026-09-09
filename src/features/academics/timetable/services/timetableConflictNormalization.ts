import { dayIndexToKey } from "@/features/academics/timetable/services/timetableMappers";

export type TimetableConflictSource = "persisted" | "proposed";

export interface TimetableConflictDisplay {
  type: "CLASSROOM" | "TEACHER" | "ROOM" | "DUPLICATE" | "UNKNOWN";
  code?: string;
  message: string;
  severity: string;
  dayOfWeek: number | null;
  dayKey?: string;
  periodId?: string;
  periodIndex?: number;
  periodLabel?: string;
  startTime?: string;
  endTime?: string;
  entryIds: string[];
  proposedIndexes: number[];
  resourceId?: string;
}

export interface TimetableConflictPeriod {
  id: string;
  index: number;
  label?: string;
  nameAr?: string;
  nameEn?: string;
  startTime?: string;
  endTime?: string;
}

export function normalizeTimetableConflicts(
  response: unknown,
  source: TimetableConflictSource,
  periods: TimetableConflictPeriod[],
): TimetableConflictDisplay[] {
  const periodById = new Map(periods.map((period) => [period.id, period]));

  return conflictItems(response).map((conflict) =>
    normalizeConflict(conflict, source, periodById),
  );
}

function conflictItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (!isRecord(response)) {
    return [];
  }

  const conflicts = response.conflicts ?? response.items;
  return Array.isArray(conflicts) ? conflicts : [];
}

function normalizeConflict(
  rawConflict: unknown,
  source: TimetableConflictSource,
  periodById: Map<string, TimetableConflictPeriod>,
): TimetableConflictDisplay {
  const conflict = isRecord(rawConflict) ? rawConflict : {};
  const code = stringField(conflict, source === "persisted" ? "type" : "code");
  const dayOfWeek = nullableNumberField(conflict, "dayOfWeek");
  const periodId = nullableStringField(conflict, "periodId") ?? undefined;
  const period = periodId ? periodById.get(periodId) : undefined;
  const explicitPeriodIndex = numberField(conflict, "periodIndex");

  return {
    type: conflictType(code),
    code,
    message: stringField(conflict, "message") ?? "Timetable conflict",
    severity: stringField(conflict, "severity") ?? "blocking",
    dayOfWeek,
    ...(dayOfWeek === null ? {} : { dayKey: dayIndexToKey(dayOfWeek) }),
    ...(periodId ? { periodId } : {}),
    ...(period
      ? {
          periodIndex: period.index,
          periodLabel: period.label ?? period.nameEn ?? period.nameAr,
          startTime: period.startTime,
          endTime: period.endTime,
        }
      : explicitPeriodIndex === undefined
        ? {}
        : { periodIndex: explicitPeriodIndex }),
    entryIds: conflictEntryIds(conflict),
    proposedIndexes: numberArrayField(conflict, "proposedIndexes"),
    resourceId: conflictResourceId(conflict, code),
  };
}

function conflictEntryIds(conflict: Record<string, unknown>): string[] {
  const entryIds = stringArrayField(conflict, "entryIds");
  const individualIds = [
    nullableStringField(conflict, "entryId"),
    nullableStringField(conflict, "relatedEntryId"),
  ].filter((entryId): entryId is string => Boolean(entryId));

  return [...new Set([...entryIds, ...individualIds])];
}

function conflictResourceId(
  conflict: Record<string, unknown>,
  code: string | undefined,
): string | undefined {
  const type = conflictType(code);
  if (type === "TEACHER") {
    return (
      nullableStringField(conflict, "teacherUserId") ??
      nullableStringField(conflict, "teacherId") ??
      nullableStringField(conflict, "resourceId") ??
      undefined
    );
  }
  if (type === "ROOM") {
    return (
      nullableStringField(conflict, "roomId") ??
      nullableStringField(conflict, "resourceId") ??
      undefined
    );
  }
  if (type === "CLASSROOM") {
    return nullableStringField(conflict, "classroomId") ?? undefined;
  }
  return nullableStringField(conflict, "resourceId") ?? undefined;
}

function conflictType(code: string | undefined): TimetableConflictDisplay["type"] {
  switch (code) {
    case "CLASSROOM_SLOT":
    case "CLASSROOM":
    case "classroom_conflict":
      return "CLASSROOM";
    case "TEACHER":
    case "teacher_conflict":
    case "academics.timetable.teacher_conflict":
      return "TEACHER";
    case "ROOM":
    case "room_conflict":
    case "academics.timetable.room_conflict":
      return "ROOM";
    case "duplicate_slot":
    case "academics.timetable.duplicate_slot":
      return "DUPLICATE";
    case "academics.timetable.entry_conflict":
      return "CLASSROOM";
    default:
      return "UNKNOWN";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function stringField(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  const fieldValue = record[field];
  return typeof fieldValue === "string" ? fieldValue : undefined;
}

function nullableStringField(
  record: Record<string, unknown>,
  field: string,
): string | null | undefined {
  const fieldValue = record[field];
  return typeof fieldValue === "string" || fieldValue === null
    ? fieldValue
    : undefined;
}

function nullableNumberField(
  record: Record<string, unknown>,
  field: string,
): number | null {
  const fieldValue = record[field];
  return typeof fieldValue === "number" ? fieldValue : null;
}

function numberField(
  record: Record<string, unknown>,
  field: string,
): number | undefined {
  const fieldValue = record[field];
  return typeof fieldValue === "number" ? fieldValue : undefined;
}

function stringArrayField(
  record: Record<string, unknown>,
  field: string,
): string[] {
  const fieldValue = record[field];
  return Array.isArray(fieldValue)
    ? fieldValue.filter((entryId): entryId is string => typeof entryId === "string")
    : [];
}

function numberArrayField(
  record: Record<string, unknown>,
  field: string,
): number[] {
  const fieldValue = record[field];
  return Array.isArray(fieldValue)
    ? fieldValue.filter((index): index is number => typeof index === "number")
    : [];
}
