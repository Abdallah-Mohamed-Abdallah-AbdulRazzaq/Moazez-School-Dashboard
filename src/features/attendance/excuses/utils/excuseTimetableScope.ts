import type { FetchTimetableConfigParams } from "@/features/academics/timetable/services/timetableConfigService";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";

export function getExcuseTimetableCandidates(
  academicYearId: string,
  termId: string,
  scopeType: AttendanceScopeType,
  scopeIds?: AttendanceScopeIds,
): FetchTimetableConfigParams[] {
  const base = { academicYearId, termId };
  const term = { ...base, scopeType: "TERM" as const };

  if (scopeType === "SCHOOL") return [];

  const stage = scopeIds?.stageId
    ? { ...base, scopeType: "STAGE" as const, stageId: scopeIds.stageId }
    : null;

  const grade = scopeIds?.gradeId
    ? { ...base, scopeType: "GRADE" as const, gradeId: scopeIds.gradeId }
    : null;
  const section = scopeIds?.gradeId && scopeIds.sectionId
    ? {
        ...base,
        scopeType: "SECTION" as const,
        gradeId: scopeIds.gradeId,
        sectionId: scopeIds.sectionId,
      }
    : null;
  const classroom =
    scopeIds?.gradeId && scopeIds.sectionId && scopeIds.classroomId
      ? {
          ...base,
          scopeType: "CLASSROOM" as const,
          gradeId: scopeIds.gradeId,
          sectionId: scopeIds.sectionId,
          classroomId: scopeIds.classroomId,
        }
      : null;

  const inheritedCandidates = stage ? [stage, term] : [term];
  if (scopeType === "STAGE") return stage ? inheritedCandidates : [];
  if (scopeType === "GRADE") {
    return grade ? [grade, ...inheritedCandidates] : [];
  }
  if (scopeType === "SECTION") {
    return section && grade
      ? [section, grade, ...inheritedCandidates]
      : [];
  }
  return classroom && section && grade
    ? [classroom, section, grade, ...inheritedCandidates]
    : [];
}

export async function resolveExcuseTimetableConfig<T>(
  candidates: FetchTimetableConfigParams[],
  load: (candidate: FetchTimetableConfigParams) => Promise<T | null>,
): Promise<T | null> {
  for (const candidate of candidates) {
    const config = await load(candidate);
    if (config) return config;
  }
  return null;
}
