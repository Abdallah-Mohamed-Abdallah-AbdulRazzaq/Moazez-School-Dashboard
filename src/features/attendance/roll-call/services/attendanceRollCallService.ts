import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceSessionMode,
  AttendanceSessionStatus,
  AttendanceStatus,
  RosterStudent,
  SessionWithEntries,
} from "../types";
import {
  matchesDirectAttendanceScope,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";

type ScopeType = AttendanceSession["scopeType"];

type BackendRecord = Record<string, unknown>;
type EntryPatch = Partial<AttendanceEntry> & { correctionReason?: string };

const BASE = "/attendance/roll-call";

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
}

function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function unwrapArray<T = unknown>(response: unknown, keys: string[] = ["items", "data", "students", "sessions", "entries"]): T[] {
  if (Array.isArray(response)) return response as T[];
  const object = asRecord(response);
  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key] as T[];
  }
  return [];
}

function unwrapObject(response: unknown, keys: string[]): BackendRecord {
  const object = asRecord(response);
  for (const key of keys) {
    const nested = object[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as BackendRecord;
    }
  }
  return object;
}

function normalizeStatus<T extends string>(value: unknown, fallback: T): T {
  return String(value || fallback).toUpperCase() as T;
}

function normalizeMode(value: unknown): AttendanceSessionMode {
  return normalizeStatus<AttendanceSessionMode>(value, "DAILY");
}

function normalizeSessionStatus(value: unknown): AttendanceSessionStatus {
  return normalizeStatus<AttendanceSessionStatus>(value, "DRAFT");
}

function normalizeEntryStatus(value: unknown): AttendanceStatus {
  return normalizeStatus<AttendanceStatus>(value, "UNMARKED");
}

function getString(object: BackendRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return fallback;
}

function getNumber(object: BackendRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getOptionalString(object: BackendRecord, keys: string[]): string | undefined {
  const value = getString(object, keys);
  return value || undefined;
}

function resolveScopeKey(scopeType: ScopeType, scopeIds?: AttendanceScopeIds): string | undefined {
  if (scopeType === "CLASSROOM") return scopeIds?.classroomId ? `classroom:${scopeIds.classroomId}` : undefined;
  if (scopeType === "SECTION") return scopeIds?.sectionId ? `section:${scopeIds.sectionId}` : undefined;
  if (scopeType === "GRADE") return scopeIds?.gradeId ? `grade:${scopeIds.gradeId}` : undefined;
  if (scopeType === "STAGE") return scopeIds?.stageId ? `stage:${scopeIds.stageId}` : undefined;
  return "school";
}

function resolveScopeId(scopeType: ScopeType, scopeIds?: AttendanceScopeIds): string | undefined {
  if (scopeType === "CLASSROOM") return scopeIds?.classroomId;
  if (scopeType === "SECTION") return scopeIds?.sectionId;
  if (scopeType === "GRADE") return scopeIds?.gradeId;
  if (scopeType === "STAGE") return scopeIds?.stageId;
  return undefined;
}

function buildScopeParams(scopeType: ScopeType, scopeIds?: AttendanceScopeIds) {
  const params: Record<string, string> = {};
  const scopeId = resolveScopeId(scopeType, scopeIds);
  if (scopeId) params.scopeId = scopeId;
  if (scopeIds?.stageId) params.stageId = scopeIds.stageId;
  if (scopeIds?.gradeId) params.gradeId = scopeIds.gradeId;
  if (scopeIds?.sectionId) params.sectionId = scopeIds.sectionId;
  if (scopeIds?.classroomId) params.classroomId = scopeIds.classroomId;
  return params;
}

function stripScopeKeyPrefix(scopeKey: string) {
  const separatorIndex = scopeKey.indexOf(":");
  return separatorIndex === -1 ? scopeKey : scopeKey.slice(separatorIndex + 1);
}

function resolveScopeIds(scopeType: ScopeType, item: BackendRecord, fallback?: AttendanceScopeIds): AttendanceScopeIds | undefined {
  const nested = item.scopeIds && typeof item.scopeIds === "object" ? (item.scopeIds as AttendanceScopeIds) : undefined;
  if (nested) return nested;

  const scopeKey = getOptionalString(item, ["scopeKey", "scopeId"]);
  if (!scopeKey || scopeKey === "school") return fallback;
  const scopeId = stripScopeKeyPrefix(scopeKey);

  if (scopeType === "CLASSROOM") return { ...fallback, classroomId: scopeId };
  if (scopeType === "SECTION") return { ...fallback, sectionId: scopeId };
  if (scopeType === "GRADE") return { ...fallback, gradeId: scopeId };
  if (scopeType === "STAGE") return { ...fallback, stageId: scopeId };
  return fallback;
}

function mapRosterStudent(item: unknown): RosterStudent {
  const object = asRecord(item);
  const stage = asRecord(object.stage);
  const grade = asRecord(object.grade);
  const section = asRecord(object.section);
  const classroom = asRecord(object.classroom);
  const id = getString(object, ["id", "studentId"]);
  const displayName = getString(object, ["displayName", "name", "fullName", "studentName"], id);
  const nameEn = getString(object, ["nameEn", "studentNameEn", "displayNameEn", "displayName"], displayName);
  const nameAr = getString(object, ["nameAr", "studentNameAr", "displayNameAr", "displayName"], nameEn);

  return {
    id,
    nameAr,
    nameEn,
    studentNumber: getString(object, ["studentNumber", "admissionNo", "studentCode", "code"], id),
    photoUrl: getOptionalString(object, ["photoUrl", "avatarUrl"]),
    enrollmentId: getOptionalString(object, ["enrollmentId"]),
    stageId: getOptionalString(object, ["stageId"]) || getOptionalString(stage, ["id"]),
    gradeId: getOptionalString(object, ["gradeId"]) || getOptionalString(grade, ["id"]),
    sectionId: getOptionalString(object, ["sectionId"]) || getOptionalString(section, ["id"]),
    classroomId: getOptionalString(object, ["classroomId"]) || getOptionalString(classroom, ["id"]),
    currentStatus:
      typeof object.currentStatus === "string"
        ? normalizeEntryStatus(object.currentStatus)
        : null,
    entryId: getOptionalString(object, ["entryId"]) ?? null,
    lateMinutes: getNumber(object, ["lateMinutes"]) ?? null,
    earlyLeaveMinutes: getNumber(object, ["earlyLeaveMinutes"]) ?? null,
    excuseReason: getOptionalString(object, ["excuseReason"]) ?? null,
    note: getOptionalString(object, ["note"]) ?? null,
  };
}

function mapEntry(item: unknown, sessionIdFallback?: string): AttendanceEntry {
  const object = asRecord(item);
  const sessionId = getString(object, ["sessionId", "attendanceSessionId"], sessionIdFallback || "");
  const status = normalizeEntryStatus(object.status);

  return {
    id: getString(object, ["id", "entryId", "attendanceEntryId"], `${sessionId}-${getString(object, ["studentId"])}`),
    sessionId,
    studentId: getString(object, ["studentId"]),
    status,
    minutesLate: getNumber(object, ["minutesLate", "lateMinutes"]),
    minutesEarlyLeave: getNumber(object, ["minutesEarlyLeave", "earlyLeaveMinutes"]),
    excuseReason: getOptionalString(object, ["excuseReason", "reason"]),
    excuseAttachments: Array.isArray(object.excuseAttachments)
      ? (object.excuseAttachments as AttendanceEntry["excuseAttachments"])
      : Array.isArray(object.attachments)
        ? (object.attachments as AttendanceEntry["excuseAttachments"])
        : undefined,
    note: getOptionalString(object, ["note"]),
    hasAttachment: typeof object.hasAttachment === "boolean" ? object.hasAttachment : undefined,
    updatedAt: getString(object, ["updatedAt"], new Date().toISOString()),
  };
}

function mapSession(item: unknown, fallback?: Partial<AttendanceSession>): AttendanceSession {
  const object = asRecord(item);
  const scopeType = normalizeStatus<ScopeType>(object.scopeType, fallback?.scopeType || "SCHOOL");
  const id = getString(object, ["id", "sessionId"], fallback?.id || "");

  return {
    id,
    yearId: getString(object, ["yearId", "academicYearId"], fallback?.yearId || ""),
    termId: getString(object, ["termId"], fallback?.termId || ""),
    date: getString(object, ["date"], fallback?.date || ""),
    scopeType,
    scopeIds: resolveScopeIds(scopeType, object, fallback?.scopeIds),
    mode: normalizeMode(object.mode || fallback?.mode),
    periodKey: getOptionalString(object, ["periodKey"]) || fallback?.periodKey,
    periodId: getOptionalString(object, ["periodId"]) || fallback?.periodId,
    periodIndex: getNumber(object, ["periodIndex"]) ?? fallback?.periodIndex,
    periodNameAr:
      getOptionalString(object, ["periodNameAr", "periodLabelAr"]) ||
      fallback?.periodNameAr,
    periodNameEn:
      getOptionalString(object, ["periodNameEn", "periodLabelEn"]) ||
      fallback?.periodNameEn,
    policyId: getOptionalString(object, ["policyId"]) || fallback?.policyId,
    status: normalizeSessionStatus(object.status || fallback?.status),
    createdAt: getString(object, ["createdAt"], fallback?.createdAt || ""),
    updatedAt: getString(object, ["updatedAt"], fallback?.updatedAt || ""),
  };
}

function mapSessionWithEntries(response: unknown, fallback?: Partial<AttendanceSession>): SessionWithEntries {
  const object = asRecord(response);
  const sessionSource = object.session || object.data || object;
  const session = mapSession(sessionSource, fallback);
  const entries = unwrapArray(object.entries ?? object, ["entries"]).map((entry) => mapEntry(entry, session.id));
  return { session, entries };
}

function buildEntryPayload(entry: Partial<AttendanceEntry>) {
  return omitUndefined({
    studentId: entry.studentId,
    status: entry.status,
    lateMinutes: entry.minutesLate,
    earlyLeaveMinutes: entry.minutesEarlyLeave,
    excuseReason: entry.excuseReason,
    note: entry.note,
  });
}

function buildSessionQuery(params: {
  yearId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
  scopeFilter?: {
    scopeType: ScopeType;
    scopeIds?: AttendanceScopeIds;
  };
}) {
  const query: Record<string, string | undefined> = {
    academicYearId: params.yearId,
    termId: params.termId,
    dateFrom: params.startDate,
    dateTo: params.endDate,
  };

  if (params.scopeFilter) {
    query.scopeType = params.scopeFilter.scopeType;
    query.scopeKey = resolveScopeKey(params.scopeFilter.scopeType, params.scopeFilter.scopeIds);
  }

  return query;
}

export async function fetchRoster(
  scopeType: ScopeType,
  scopeIds: AttendanceScopeIds,
  options?: {
    yearId?: string;
    termId?: string;
    date?: string;
    mode?: AttendanceSessionMode;
    periodKey?: string;
  }
): Promise<RosterStudent[]> {
  const response = await apiGet<unknown>(`${BASE}/roster`, {
      params: omitUndefined({
        academicYearId: options?.yearId,
        termId: options?.termId,
        date: options?.date,
        mode: options?.mode,
        periodKey: options?.periodKey,
        scopeType,
        ...buildScopeParams(scopeType, scopeIds),
      }),
    });

  return unwrapArray(response).map(mapRosterStudent);
}

export async function getOrCreateSession(params: {
  yearId: string;
  termId: string;
  date: string;
  scopeType: ScopeType;
  scopeIds?: AttendanceScopeIds;
  mode: AttendanceSessionMode;
  periodId?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
}): Promise<SessionWithEntries> {
  const response = await apiPost<unknown>(`${BASE}/session/resolve`, omitUndefined({
    academicYearId: params.yearId,
    termId: params.termId,
    date: params.date,
    scopeType: params.scopeType,
    ...buildScopeParams(params.scopeType, params.scopeIds),
    mode: params.mode,
    periodKey: params.periodId,
    periodId: params.periodId,
    periodLabelAr: params.periodNameAr,
    periodLabelEn: params.periodNameEn,
  }));

  return mapSessionWithEntries(response, {
    yearId: params.yearId,
    termId: params.termId,
    date: params.date,
    scopeType: params.scopeType,
    scopeIds: params.scopeIds,
    mode: params.mode,
    periodId: params.periodId,
    periodIndex: params.periodIndex,
    periodNameAr: params.periodNameAr,
    periodNameEn: params.periodNameEn,
  });
}

export async function saveSession(
  session: AttendanceSession,
  entries: AttendanceEntry[]
): Promise<SessionWithEntries> {
  const response = await apiPut<unknown>(`${BASE}/sessions/${session.id}/entries`, {
    entries: entries.map(buildEntryPayload),
  });

  return mapSessionWithEntries(response, session);
}

export async function submitSession(sessionId: string, yearId: string, termId: string): Promise<AttendanceSession> {
  const response = await apiPost<unknown>(`${BASE}/sessions/${sessionId}/submit`);
  return mapSession(unwrapObject(response, ["session", "data"]), { id: sessionId, yearId, termId, status: "SUBMITTED" });
}

export async function unsubmitSession(yearId: string, termId: string, sessionId: string): Promise<AttendanceSession> {
  const response = await apiPost<unknown>(`${BASE}/sessions/${sessionId}/unsubmit`);
  return mapSession(unwrapObject(response, ["session", "data"]), { id: sessionId, yearId, termId, status: "DRAFT" });
}

export async function fetchSessions(
  yearId: string,
  termId: string,
  startDate?: string,
  endDate?: string,
  scopeFilter?: {
    scopeType: ScopeType;
    scopeIds?: AttendanceScopeIds;
  }
): Promise<AttendanceSession[]> {
  const response = await apiGet<unknown>(`${BASE}/sessions`, {
    params: buildSessionQuery({ yearId, termId, startDate, endDate, scopeFilter }),
  });

  return unwrapArray(response).map((session) => mapSession(session, { yearId, termId }));
}

export async function deleteSession(): Promise<void> {
  throw new Error("Deleting attendance sessions is not supported by the V1 dashboard API contract.");
}

export async function fetchEntriesBySessionId(
  yearId: string,
  termId: string,
  sessionId: string
): Promise<AttendanceEntry[]> {
  const response = await apiGet<unknown>(`${BASE}/sessions/${sessionId}`);
  return mapSessionWithEntries(response, { id: sessionId, yearId, termId }).entries;
}

export async function fetchEntriesForSessions(
  yearId: string,
  termId: string,
  sessionIds: string[]
): Promise<AttendanceEntry[]> {
  const details = await Promise.all(
    sessionIds.map((sessionId) => fetchEntriesBySessionId(yearId, termId, sessionId))
  );
  return details.flat();
}

export async function upsertEntry(
  yearId: string,
  termId: string,
  sessionId: string,
  studentId: string,
  patch: EntryPatch
): Promise<AttendanceEntry> {
  if (patch.correctionReason) {
    const response = await apiPost<unknown>(
      `${BASE}/sessions/${sessionId}/entries/${studentId}/correct`,
      omitUndefined({
        ...buildEntryPayload(patch),
        studentId: undefined,
        correctionReason: patch.correctionReason,
      }),
    );
    return mapEntry(response, sessionId);
  }

  const response = await apiPut<unknown>(
    `${BASE}/sessions/${sessionId}/entries/${studentId}`,
    omitUndefined({
      ...buildEntryPayload(patch),
      studentId: undefined,
    }),
  );

  return mapEntry(response, sessionId);
}

export function sessionMatchesScope(
  session: AttendanceSession,
  scopeType: ScopeType,
  scopeIds?: AttendanceScopeIds
) {
  return matchesDirectAttendanceScope(scopeType, session.scopeIds, scopeIds);
}
