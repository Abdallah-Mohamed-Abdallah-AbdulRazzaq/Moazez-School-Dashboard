import type {
  BackendTimetableEntryDto,
  TimetableDashboardAllResponseDto,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableSlotScope {
  academicYearId: string;
  termId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  teacherUserId: string;
  subjectId: string;
  teacherSubjectAllocationId: string;
}

export interface TimetableConfigLookupParams {
  academicYearId: string;
  termId: string;
  scopeType: TimetableScopeType;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export function timetableConfigCandidates(
  scope: TimetableSlotScope,
): TimetableConfigLookupParams[] {
  const {
    academicYearId,
    termId,
    stageId,
    gradeId,
    sectionId,
    classroomId,
  } = scope;

  return [
    {
      academicYearId,
      termId,
      scopeType: "CLASSROOM",
      stageId,
      gradeId,
      sectionId,
      classroomId,
    },
    {
      academicYearId,
      termId,
      scopeType: "SECTION",
      stageId,
      gradeId,
      sectionId,
    },
    {
      academicYearId,
      termId,
      scopeType: "GRADE",
      stageId,
      gradeId,
    },
    {
      academicYearId,
      termId,
      scopeType: "STAGE",
      stageId,
    },
    {
      academicYearId,
      termId,
      scopeType: "TERM",
    },
  ];
}

export function dashboardEntriesForScope(
  response: TimetableDashboardAllResponseDto,
  scope: TimetableSlotScope,
  dayOfWeek: number,
): BackendTimetableEntryDto[] {
  const classroom = response.items.find(
    (item) => item.classroomId === scope.classroomId,
  );
  const effectiveTimetableConfigId = classroom?.effectiveConfig?.id;

  return (classroom?.entries ?? []).filter(
    (entry) =>
      entry.dayOfWeek === dayOfWeek &&
      entry.status.toLowerCase() === "active" &&
      entry.timetableConfigId === effectiveTimetableConfigId &&
      Boolean(entry.teacherSubjectAllocationId) &&
      entry.teacherSubjectAllocationId === scope.teacherSubjectAllocationId,
  );
}

export function dashboardDaysForScope(
  response: TimetableDashboardAllResponseDto,
  scope: TimetableSlotScope,
): number[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => dayOfWeek).filter(
    (dayOfWeek) =>
      dashboardEntriesForScope(response, scope, dayOfWeek).length > 0,
  );
}
