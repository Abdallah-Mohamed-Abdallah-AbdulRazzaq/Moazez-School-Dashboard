import { apiGet, apiPatch } from "@/lib/api";
import type { AbsenceRecord, AbsencesFilters, AbsencesKPIs, AttendanceGranularity, AttendanceIncidentType } from "../types";
import type { AttachmentMeta } from "@/features/attendance/roll-call/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

type ScopeType = AbsenceRecord["scopeType"];
type BackendRecord = Record<string, unknown>;

const BASE = "/attendance/absences";

export interface AbsenceSummary {
  totalIncidents: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  excusedCount: number;
  affectedStudentsCount: number;
}

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const object = asRecord(response);
  for (const key of ["items", "data", "records", "incidents", "absences"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
  }
  return [];
}

function getString(object: BackendRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

function getOptionalString(object: BackendRecord, keys: string[]) {
  const value = getString(object, keys);
  return value || undefined;
}

function getNumber(object: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeStatus(value: unknown): AttendanceIncidentType {
  return String(value || "ABSENT").toUpperCase() as AttendanceIncidentType;
}

function normalizeGranularity(
  granularity: unknown,
  mode: unknown,
): AttendanceGranularity {
  const explicitGranularity = String(granularity || "").toUpperCase();
  if (explicitGranularity === "DAILY_DERIVED") return "DAILY_DERIVED";
  if (explicitGranularity === "DAILY") return "DAILY";
  if (explicitGranularity === "PERIOD") return "PERIOD";
  return String(mode || "PERIOD").toUpperCase() === "DAILY"
    ? "DAILY"
    : "PERIOD";
}

function buildAbsenceQueryParams(
  params: { yearId: string; termId: string } & Partial<AbsencesFilters>
) {
  const selectedScopeType = params.scopeType === "SCHOOL" ? undefined : params.scopeType;

  return omitUndefined({
    academicYearId: params.yearId,
    termId: params.termId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    scopeType: selectedScopeType,
    stageId: params.scopeIds?.stageId,
    gradeId: params.scopeIds?.gradeId,
    sectionId: params.scopeIds?.sectionId,
    classroomId: params.scopeIds?.classroomId,
    status: params.status && params.status !== "ALL" ? params.status : undefined,
  });
}

function stripScopeKeyPrefix(scopeKey: string) {
  const separatorIndex = scopeKey.indexOf(":");
  return separatorIndex === -1 ? scopeKey : scopeKey.slice(separatorIndex + 1);
}

function resolveScopeIds(scopeType: ScopeType, object: BackendRecord, fallback?: AttendanceScopeIds): AttendanceScopeIds | undefined {
  const nested = object.scopeIds && typeof object.scopeIds === "object" ? (object.scopeIds as AttendanceScopeIds) : undefined;
  if (nested) return nested;

  const scopeKey = getOptionalString(object, ["scopeKey", "scopeId"]);
  if (!scopeKey || scopeKey === "school") return fallback;
  const scopeId = stripScopeKeyPrefix(scopeKey);
  if (scopeType === "CLASSROOM") return { ...fallback, classroomId: scopeId };
  if (scopeType === "SECTION") return { ...fallback, sectionId: scopeId };
  if (scopeType === "GRADE") return { ...fallback, gradeId: scopeId };
  if (scopeType === "STAGE") return { ...fallback, stageId: scopeId };
  return fallback;
}

function mapAbsenceRecord(item: unknown, fallback: { yearId: string; termId: string }): AbsenceRecord {
  const object = asRecord(item);
  const scopeType = String(object.scopeType || "SCHOOL").toUpperCase() as ScopeType;
  const status = normalizeStatus(object.status || object.type || object.itemType);
  const minutesLate = getNumber(object, ["minutesLate", "lateMinutes"]);
  const minutesEarlyLeave = getNumber(object, ["minutesEarlyLeave", "earlyLeaveMinutes"]);
  const attachments = Array.isArray(object.attachments)
    ? (object.attachments as AttachmentMeta[])
    : Array.isArray(asRecord(object.excuse).attachments)
      ? (asRecord(object.excuse).attachments as AttachmentMeta[])
      : undefined;
  const excuseReason = getOptionalString(object, ["excuseReason", "reason"]) ||
    getOptionalString(asRecord(object.excuse), ["reasonAr", "reasonEn", "reason"]);

  return {
    id: getString(object, ["id", "incidentId", "entryId"]),
    yearId: getString(object, ["yearId", "academicYearId"], fallback.yearId),
    termId: getString(object, ["termId"], fallback.termId),
    date: getString(object, ["date", "occurredAt"]).slice(0, 10),
    studentId: getString(object, ["studentId"]),
    studentNumber: getString(object, ["studentNumber", "admissionNo", "studentCode"]),
    studentNameAr: getString(object, ["studentNameAr", "nameAr", "displayNameAr", "studentNameEn"]),
    studentNameEn: getString(object, ["studentNameEn", "nameEn", "displayNameEn", "studentNameAr"]),
    scopeType,
    scopeIds: resolveScopeIds(scopeType, object),
    stageNameAr: getOptionalString(object, ["stageNameAr"]),
    stageNameEn: getOptionalString(object, ["stageNameEn"]),
    gradeNameAr: getOptionalString(object, ["gradeNameAr"]),
    gradeNameEn: getOptionalString(object, ["gradeNameEn"]),
    sectionNameAr: getOptionalString(object, ["sectionNameAr"]),
    sectionNameEn: getOptionalString(object, ["sectionNameEn"]),
    classroomNameAr: getOptionalString(object, ["classroomNameAr"]),
    classroomNameEn: getOptionalString(object, ["classroomNameEn"]),
    granularity: normalizeGranularity(object.granularity, object.mode),
    periodId: getOptionalString(object, ["periodId"]),
    periodKey: getOptionalString(object, ["periodKey"]),
    periodIndex: getNumber(object, ["periodIndex"]),
    periodNameAr: getOptionalString(object, ["periodNameAr", "periodLabelAr"]),
    periodNameEn: getOptionalString(object, ["periodNameEn", "periodLabelEn"]),
    status,
    minutesLate,
    minutesEarlyLeave,
    excuse: excuseReason || attachments
      ? {
          reasonAr: excuseReason,
          reasonEn: excuseReason,
          attachments,
          createdAt: getString(object, ["updatedAt", "createdAt"], new Date().toISOString()),
        }
      : undefined,
    sourceSessionId: getOptionalString(object, ["sourceSessionId", "sessionId"]),
    sessionStatus: getOptionalString(object, ["submittedAt"])
      ? "SUBMITTED"
      : "DRAFT",
    updatedAt: getString(object, ["updatedAt"], new Date().toISOString()),
  };
}

export async function fetchAbsenceRecords(
  params: {
    yearId: string;
    termId: string;
  } & Partial<AbsencesFilters>
): Promise<AbsenceRecord[]> {
  const response = await apiGet<unknown>(BASE, {
    params: buildAbsenceQueryParams(params),
  });

  const records = unwrapArray(response).map((item) => mapAbsenceRecord(item, params));
  return records.filter((record) => {
    if (params.granularities?.length && !params.granularities.includes(record.granularity)) return false;
    if (params.onlyUnexcused && (record.status === "EXCUSED" || record.excuse)) return false;
    if (params.search?.trim()) {
      const query = params.search.trim().toLowerCase();
      const haystack = [record.studentNameAr, record.studentNameEn, record.studentNumber || ""].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export async function fetchAbsenceSummary(
  params: { yearId: string; termId: string } & Partial<AbsencesFilters>
): Promise<AbsenceSummary> {
  return apiGet<AbsenceSummary>(`${BASE}/summary`, {
    params: buildAbsenceQueryParams(params),
  });
}

export function computeAbsencesKPIs(records: AbsenceRecord[]): AbsencesKPIs {
  return {
    totalIncidents: records.length,
    absentCount: records.filter((record) => record.status === "ABSENT").length,
    excusedCount: records.filter((record) => record.status === "EXCUSED" || record.excuse).length,
    lateCount: records.filter((record) => record.status === "LATE").length,
    earlyLeaveCount: records.filter((record) => record.status === "EARLY_LEAVE").length,
    dailyAbsentCount: records.filter(
      (record) =>
        record.granularity !== "PERIOD" && record.status === "ABSENT",
    ).length,
  };
}

export async function updateExcuse(
  record: AbsenceRecord,
  reason: string,
): Promise<void> {
  if (!reason.trim() || reason.trim().length > 1000) {
    throw new Error("Excuse reason must contain 1 to 1000 characters");
  }
  await apiPatch(`${BASE}/${record.id}/excuse`, {
    correctionReason: reason.trim(),
    excuseReason: reason.trim(),
    note: reason.trim(),
  });
}

export async function updateEarlyLeaveMinutes(
  record: AbsenceRecord,
  minutes: number,
  correctionReason: string,
): Promise<void> {
  if (!Number.isFinite(minutes) || minutes < 1) {
    throw new Error("Minutes must be at least 1");
  }
  if (!correctionReason.trim() || correctionReason.trim().length > 1000) {
    throw new Error("Correction reason must contain 1 to 1000 characters");
  }

  await apiPatch(`${BASE}/${record.id}/early-leave`, {
    earlyLeaveMinutes: minutes,
    correctionReason: correctionReason.trim(),
    note: correctionReason.trim(),
  });
}
