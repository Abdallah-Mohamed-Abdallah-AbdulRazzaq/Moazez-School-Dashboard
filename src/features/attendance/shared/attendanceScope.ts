import type { AttendanceScopeType } from "@/features/attendance/policies/types";

export interface AttendanceScopeIds {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export const ATTENDANCE_SCOPE_PRIORITY: AttendanceScopeType[] = [
  "CLASSROOM",
  "SECTION",
  "GRADE",
  "STAGE",
  "SCHOOL",
];

export function isScopeSelectionComplete(
  scopeType: AttendanceScopeType,
  scopeIds?: AttendanceScopeIds
): boolean {
  if (scopeType === "SCHOOL") return true;
  if (scopeType === "STAGE") return !!scopeIds?.stageId;
  if (scopeType === "GRADE") return !!scopeIds?.stageId && !!scopeIds?.gradeId;
  if (scopeType === "SECTION") {
    return !!scopeIds?.stageId && !!scopeIds?.gradeId && !!scopeIds?.sectionId;
  }

  return !!scopeIds?.stageId && !!scopeIds?.gradeId && !!scopeIds?.sectionId && !!scopeIds?.classroomId;
}

export function getScopeSelectionMissingFields(
  scopeType: AttendanceScopeType,
  scopeIds?: AttendanceScopeIds
): Array<keyof AttendanceScopeIds> {
  const missing: Array<keyof AttendanceScopeIds> = [];

  if (doesScopeTypeUseStage(scopeType) && !scopeIds?.stageId) {
    missing.push("stageId");
  }

  if (doesScopeTypeUseGrade(scopeType) && !scopeIds?.gradeId) {
    missing.push("gradeId");
  }

  if (doesScopeTypeUseSection(scopeType) && !scopeIds?.sectionId) {
    missing.push("sectionId");
  }

  if (doesScopeTypeUseClassroom(scopeType) && !scopeIds?.classroomId) {
    missing.push("classroomId");
  }

  return missing;
}

export function doesScopeTypeUseStage(scopeType: AttendanceScopeType) {
  return scopeType === "STAGE" || scopeType === "GRADE" || scopeType === "SECTION" || scopeType === "CLASSROOM";
}

export function doesScopeTypeUseGrade(scopeType: AttendanceScopeType) {
  return scopeType === "GRADE" || scopeType === "SECTION" || scopeType === "CLASSROOM";
}

export function doesScopeTypeUseSection(scopeType: AttendanceScopeType) {
  return scopeType === "SECTION" || scopeType === "CLASSROOM";
}

export function doesScopeTypeUseClassroom(scopeType: AttendanceScopeType) {
  return scopeType === "CLASSROOM";
}

export function resolveAttendanceHierarchyScope(params: {
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  gradesById?: Map<string, { stageId: string }>;
  sectionsById?: Map<string, { gradeId: string }>;
  classroomsById?: Map<string, { sectionId: string }>;
}): AttendanceScopeIds {
  const { scopeType, scopeIds, gradesById, sectionsById, classroomsById } = params;

  const classroomId = scopeType === "CLASSROOM" ? scopeIds?.classroomId : scopeIds?.classroomId;
  const sectionIdFromClassroom = classroomId ? classroomsById?.get(classroomId)?.sectionId : undefined;
  const sectionId =
    scopeType === "CLASSROOM"
      ? scopeIds?.sectionId || sectionIdFromClassroom
      : scopeIds?.sectionId || sectionIdFromClassroom;
  const gradeIdFromSection = sectionId ? sectionsById?.get(sectionId)?.gradeId : undefined;
  const gradeId =
    scopeType === "GRADE" || scopeType === "SECTION" || scopeType === "CLASSROOM"
      ? scopeIds?.gradeId || gradeIdFromSection
      : scopeIds?.gradeId || gradeIdFromSection;
  const stageIdFromGrade = gradeId ? gradesById?.get(gradeId)?.stageId : undefined;
  const stageId =
    scopeType === "STAGE" || scopeType === "GRADE" || scopeType === "SECTION" || scopeType === "CLASSROOM"
      ? scopeIds?.stageId || stageIdFromGrade
      : scopeIds?.stageId || stageIdFromGrade;

  return {
    stageId,
    gradeId,
    sectionId,
    classroomId,
  };
}

export function scopeMatchesTarget(
  policyScopeType: AttendanceScopeType,
  policyScopeIds: AttendanceScopeIds | undefined,
  targetScope: AttendanceScopeIds
): boolean {
  if (policyScopeType === "SCHOOL") return true;
  if (policyScopeType === "STAGE") return policyScopeIds?.stageId === targetScope.stageId;
  if (policyScopeType === "GRADE") return policyScopeIds?.gradeId === targetScope.gradeId;
  if (policyScopeType === "SECTION") return policyScopeIds?.sectionId === targetScope.sectionId;
  return policyScopeIds?.classroomId === targetScope.classroomId;
}

export function matchesResolvedAttendanceScope(
  scopeType: AttendanceScopeType,
  requestedScopeIds: AttendanceScopeIds | undefined,
  resolvedScope: AttendanceScopeIds
): boolean {
  if (scopeType === "SCHOOL") return true;
  if (scopeType === "STAGE") return resolvedScope.stageId === requestedScopeIds?.stageId;
  if (scopeType === "GRADE") return resolvedScope.gradeId === requestedScopeIds?.gradeId;
  if (scopeType === "SECTION") return resolvedScope.sectionId === requestedScopeIds?.sectionId;
  return resolvedScope.classroomId === requestedScopeIds?.classroomId;
}

export function matchesDirectAttendanceScope(
  scopeType: AttendanceScopeType,
  leftScopeIds: AttendanceScopeIds | undefined,
  rightScopeIds: AttendanceScopeIds | undefined
): boolean {
  if (scopeType === "SCHOOL") return true;
  if (scopeType === "STAGE") return leftScopeIds?.stageId === rightScopeIds?.stageId;
  if (scopeType === "GRADE") return leftScopeIds?.gradeId === rightScopeIds?.gradeId;
  if (scopeType === "SECTION") return leftScopeIds?.sectionId === rightScopeIds?.sectionId;
  return leftScopeIds?.classroomId === rightScopeIds?.classroomId;
}
