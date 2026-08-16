import type { ReadonlyURLSearchParams } from "next/navigation";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceReportsFilters, ReportsExportDataset } from "../types";

const VALID_SCOPE_TYPES: AttendanceScopeType[] = [
  "SCHOOL",
  "STAGE",
  "GRADE",
  "SECTION",
  "CLASSROOM",
];

const VALID_ATTENDANCE_STATUSES = [
  "ALL",
  "PRESENT",
  "ABSENT",
  "EXCUSED",
  "LATE",
  "EARLY_LEAVE",
] as const;

const VALID_EXCUSE_STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
const VALID_INCIDENT_TYPES = ["ALL", "ABSENCE", "LATE", "EARLY_LEAVE", "EXCUSED"] as const;
const VALID_EXPORT_DATASETS = ["summary", "detailed", "risk", "performance"] as const;

type ParamsLike = URLSearchParams | ReadonlyURLSearchParams;

export function parseReportsFiltersFromSearchParams(
  searchParams: ParamsLike,
  fallback: AttendanceReportsFilters
): AttendanceReportsFilters {
  const scopeType = getEnumValue(searchParams.get("scope"), VALID_SCOPE_TYPES) || fallback.scopeType;
  const scopeIds: AttendanceScopeIds = {
    stageId: searchParams.get("stageId") || undefined,
    gradeId: searchParams.get("gradeId") || undefined,
    sectionId: searchParams.get("sectionId") || undefined,
    classroomId: searchParams.get("classroomId") || undefined,
  };

  return {
    dateFrom: searchParams.get("from") || fallback.dateFrom,
    dateTo: searchParams.get("to") || fallback.dateTo,
    scopeType,
    scopeIds: cleanScopeIds(scopeIds),
    studentId: searchParams.get("studentId") || undefined,
    attendanceStatus:
      getEnumValue(searchParams.get("attendanceStatus"), VALID_ATTENDANCE_STATUSES) || fallback.attendanceStatus,
    excuseStatus: getEnumValue(searchParams.get("excuseStatus"), VALID_EXCUSE_STATUSES) || fallback.excuseStatus,
    incidentType: getEnumValue(searchParams.get("incidentType"), VALID_INCIDENT_TYPES) || fallback.incidentType,
  };
}

export function parseReportsExportDatasetFromSearchParams(
  searchParams: ParamsLike,
  fallback: ReportsExportDataset
): ReportsExportDataset {
  return getEnumValue(searchParams.get("dataset"), VALID_EXPORT_DATASETS) || fallback;
}

export function applyReportsStateToSearchParams(params: URLSearchParams, state: {
  filters: AttendanceReportsFilters;
  exportDataset: ReportsExportDataset;
}) {
  params.delete("from");
  params.delete("to");
  params.delete("scope");
  params.delete("stageId");
  params.delete("gradeId");
  params.delete("sectionId");
  params.delete("classroomId");
  params.delete("studentId");
  params.delete("attendanceStatus");
  params.delete("excuseStatus");
  params.delete("incidentType");
  params.delete("dataset");

  const { filters, exportDataset } = state;

  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.scopeType && filters.scopeType !== "SCHOOL") params.set("scope", filters.scopeType);
  if (filters.scopeIds?.stageId) params.set("stageId", filters.scopeIds.stageId);
  if (filters.scopeIds?.gradeId) params.set("gradeId", filters.scopeIds.gradeId);
  if (filters.scopeIds?.sectionId) params.set("sectionId", filters.scopeIds.sectionId);
  if (filters.scopeIds?.classroomId) params.set("classroomId", filters.scopeIds.classroomId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.attendanceStatus !== "ALL") params.set("attendanceStatus", filters.attendanceStatus);
  if (filters.excuseStatus !== "ALL") params.set("excuseStatus", filters.excuseStatus);
  if (filters.incidentType !== "ALL") params.set("incidentType", filters.incidentType);
  if (exportDataset !== "summary") params.set("dataset", exportDataset);
}

export function areReportsFiltersEqual(
  left: AttendanceReportsFilters,
  right: AttendanceReportsFilters
) {
  return (
    left.dateFrom === right.dateFrom &&
    left.dateTo === right.dateTo &&
    left.scopeType === right.scopeType &&
    left.studentId === right.studentId &&
    left.attendanceStatus === right.attendanceStatus &&
    left.excuseStatus === right.excuseStatus &&
    left.incidentType === right.incidentType &&
    left.scopeIds?.stageId === right.scopeIds?.stageId &&
    left.scopeIds?.gradeId === right.scopeIds?.gradeId &&
    left.scopeIds?.sectionId === right.scopeIds?.sectionId &&
    left.scopeIds?.classroomId === right.scopeIds?.classroomId
  );
}

function cleanScopeIds(scopeIds: AttendanceScopeIds) {
  const cleaned: AttendanceScopeIds = {};

  if (scopeIds.stageId) cleaned.stageId = scopeIds.stageId;
  if (scopeIds.gradeId) cleaned.gradeId = scopeIds.gradeId;
  if (scopeIds.sectionId) cleaned.sectionId = scopeIds.sectionId;
  if (scopeIds.classroomId) cleaned.classroomId = scopeIds.classroomId;

  return cleaned;
}

function getEnumValue<T extends readonly string[]>(value: string | null, allowed: T): T[number] | null {
  return value && allowed.includes(value as T[number]) ? (value as T[number]) : null;
}
