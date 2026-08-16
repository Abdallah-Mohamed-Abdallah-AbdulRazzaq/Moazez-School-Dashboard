import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type { Incident, LateEarlyFilters } from "../types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";
import { resolveEffectiveAttendancePolicy } from "../utils/deriveIncidents";

type BackendRecord = Record<string, unknown>;

interface FetchIncidentsParams extends Partial<LateEarlyFilters> {
  yearId: string;
  termId: string;
}

interface UpdateIncidentMinutesParams {
  yearId: string;
  termId: string;
  sessionId: string;
  studentId: string;
  type: "LATE" | "EARLY_LEAVE";
  minutes: number;
  correctionReason: string;
  incidentId?: string;
}

function asRecord(value: unknown): BackendRecord {
  return value && typeof value === "object" ? (value as BackendRecord) : {};
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

function getNumber(object: BackendRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getOptionalNumber(object: BackendRecord, keys: string[]) {
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

function resolveScopeKey(scopeType: LateEarlyFilters["scopeType"], scopeIds?: AttendanceScopeIds) {
  if (scopeType === "CLASSROOM") return scopeIds?.classroomId ? `classroom:${scopeIds.classroomId}` : undefined;
  if (scopeType === "SECTION") return scopeIds?.sectionId ? `section:${scopeIds.sectionId}` : undefined;
  if (scopeType === "GRADE") return scopeIds?.gradeId ? `grade:${scopeIds.gradeId}` : undefined;
  if (scopeType === "STAGE") return scopeIds?.stageId ? `stage:${scopeIds.stageId}` : undefined;
  return "school";
}

function resolveScopeParams(scopeIds?: AttendanceScopeIds) {
  return {
    stageId: scopeIds?.stageId,
    gradeId: scopeIds?.gradeId,
    sectionId: scopeIds?.sectionId,
    classroomId: scopeIds?.classroomId,
  };
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function mapIncident(item: unknown, fallback: { yearId: string; termId: string }): Incident {
  const object = asRecord(item);
  const status = String(object.status || object.type || "LATE").toUpperCase();
  const type = status === "EARLY_LEAVE" ? "EARLY_LEAVE" : "LATE";
  const minutes = type === "LATE"
    ? getNumber(object, ["minutesLate", "lateMinutes", "minutes"])
    : getNumber(object, ["minutesEarlyLeave", "earlyLeaveMinutes", "minutes"]);

  return {
    id: getString(object, ["id", "incidentId", "entryId"]),
    yearId: getString(object, ["yearId", "academicYearId"], fallback.yearId),
    termId: getString(object, ["termId"], fallback.termId),
    date: getString(object, ["date", "occurredAt"]).slice(0, 10),
    periodId: getString(object, ["periodId"]) || undefined,
    periodKey: getString(object, ["periodKey"]) || undefined,
    periodIndex: getOptionalNumber(object, ["periodIndex"]),
    periodNameAr: getString(object, ["periodNameAr", "periodLabelAr"]),
    periodNameEn: getString(object, ["periodNameEn", "periodLabelEn"]),
    sessionId: getString(object, ["sourceSessionId", "sessionId"]),
    studentId: getString(object, ["studentId"]),
    studentNameAr: getString(object, ["studentNameAr", "nameAr", "studentNameEn"]),
    studentNameEn: getString(object, ["studentNameEn", "nameEn", "studentNameAr"]),
    studentNumber: getString(object, ["studentNumber", "admissionNo", "studentCode"]),
    stageId: getString(object, ["stageId"]),
    gradeId: getString(object, ["gradeId"]),
    sectionId: getString(object, ["sectionId"]),
    classroomId: getString(object, ["classroomId"]),
    gradeNameAr: getString(object, ["gradeNameAr"]),
    gradeNameEn: getString(object, ["gradeNameEn"]),
    sectionNameAr: getString(object, ["sectionNameAr"]),
    sectionNameEn: getString(object, ["sectionNameEn"]),
    classroomNameAr: getString(object, ["classroomNameAr"]),
    classroomNameEn: getString(object, ["classroomNameEn"]),
    type,
    minutes,
    threshold: undefined,
    isViolation: null,
    policyScopeSummary: "",
    policyContext: "UNAVAILABLE",
    sessionStatus: getString(object, ["submittedAt"])
      ? "SUBMITTED"
      : undefined,
    updatedAt: getString(object, ["updatedAt"], new Date().toISOString()),
  };
}

function applyClientFilters(incidents: Incident[], filters: Partial<LateEarlyFilters>) {
  return incidents.filter((incident) => {
    if (filters.type && filters.type !== "ALL" && incident.type !== filters.type) return false;
    if (filters.onlyViolations && incident.isViolation !== true) return false;
    if (typeof filters.minutesMin === "number" && incident.minutes < filters.minutesMin) return false;
    if (typeof filters.minutesMax === "number" && incident.minutes > filters.minutesMax) return false;
    if (filters.periodId && incident.periodId !== filters.periodId) return false;
    if (filters.sessionStatus && filters.sessionStatus !== "ALL" && incident.sessionStatus !== filters.sessionStatus) return false;
    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      const haystack = [incident.studentNameAr, incident.studentNameEn, incident.studentNumber || ""].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export async function fetchIncidents(params: FetchIncidentsParams): Promise<Incident[]> {
  const requestedStatus = params.type && params.type !== "ALL" ? params.type : undefined;
  const response = await apiGet<unknown>("/attendance/absences", {
    params: omitUndefined({
      academicYearId: params.yearId,
      termId: params.termId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      scopeType: params.scopeType,
      scopeKey: params.scopeType ? resolveScopeKey(params.scopeType, params.scopeIds) : undefined,
      ...resolveScopeParams(params.scopeIds),
      status: requestedStatus,
    }),
  });

  const incidents = unwrapArray(response)
    .filter((item) => {
      const status = String(asRecord(item).status || "").toUpperCase();
      return status === "LATE" || status === "EARLY_LEAVE";
    })
    .map((item) => mapIncident(item, params));

  if (incidents.length === 0) return [];

  let policies;
  try {
    policies = await fetchPolicies(params.yearId, params.termId);
  } catch (error) {
    if (isApiError(error) && error.status === 403) {
      return applyClientFilters(incidents, params);
    }
    throw error;
  }
  const enrichedIncidents = incidents.map((incident) => {
    const policy = resolveEffectiveAttendancePolicy(policies, incident.date, {
      stageId: incident.stageId,
      gradeId: incident.gradeId,
      sectionId: incident.sectionId,
      classroomId: incident.classroomId,
    });
    if (!policy) return incident;

    const thresholdState = getThresholdState(incident.type, incident.minutes, policy);

    return {
      ...incident,
      threshold: thresholdState.threshold,
      isViolation: thresholdState.isReached,
      policyScopeSummary: `${policy.scopeType} - ${policy.nameEn || policy.nameAr}`,
      policyContext: "ESTIMATED_CURRENT" as const,
    };
  });

  return applyClientFilters(enrichedIncidents, params);
}

export async function updateIncidentMinutes(params: UpdateIncidentMinutesParams): Promise<Incident> {
  if (!Number.isFinite(params.minutes) || params.minutes < 1) {
    throw new Error("Minutes must be at least 1");
  }

  if (params.type === "EARLY_LEAVE") {
    if (!params.incidentId) {
      throw new Error("Early-leave correction requires an incident id");
    }

    const response = await apiPatch<unknown>(`/attendance/absences/${params.incidentId}/early-leave`, {
      earlyLeaveMinutes: params.minutes,
      correctionReason: params.correctionReason,
      note: params.correctionReason,
    });
    return mapIncident(response, params);
  }

  const response = await apiPost<unknown>(
    `/attendance/roll-call/sessions/${params.sessionId}/entries/${params.studentId}/correct`,
    {
      status: "LATE",
      lateMinutes: params.minutes,
      correctionReason: params.correctionReason,
      note: params.correctionReason,
    },
  );

  return mapIncident(response, params);
}
