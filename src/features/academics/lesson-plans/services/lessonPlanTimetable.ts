import type {
  BackendTimetableEntryDto,
  TimetableDashboardAllResponseDto,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";

export interface TimetableSlotScope {
  academicYearId: string;
  termId: string;
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
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export function timetableConfigCandidates(
  scope: TimetableSlotScope,
): TimetableConfigLookupParams[] {
  const { academicYearId, termId, gradeId, sectionId, classroomId } = scope;

  return [
    {
      academicYearId,
      termId,
      scopeType: "CLASSROOM",
      gradeId,
      sectionId,
      classroomId,
    },
    {
      academicYearId,
      termId,
      scopeType: "SECTION",
      gradeId,
      sectionId,
    },
    {
      academicYearId,
      termId,
      scopeType: "GRADE",
      gradeId,
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

  return (classroom?.entries ?? []).filter(
    (entry) =>
      entry.dayOfWeek === dayOfWeek &&
      entry.status.toLowerCase() !== "cancelled" &&
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
