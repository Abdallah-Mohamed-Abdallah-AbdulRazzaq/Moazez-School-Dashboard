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
  return effectiveDashboardEntries(response, scope.classroomId).filter(
    (entry) =>
      entry.dayOfWeek === dayOfWeek &&
      Boolean(entry.teacherSubjectAllocationId) &&
      entry.teacherSubjectAllocationId === scope.teacherSubjectAllocationId,
  );
}

export function effectiveDashboardEntries(
  response: TimetableDashboardAllResponseDto,
  classroomId: string,
): BackendTimetableEntryDto[] {
  const classroomTimetable = response.items.find(
    (dashboardItem) => dashboardItem.classroomId === classroomId,
  );
  const effectiveTimetableConfigId = classroomTimetable?.effectiveConfig?.id;
  if (!effectiveTimetableConfigId) return [];

  return classroomTimetable.entries.filter(
    (entry) =>
      entry.status.toLowerCase() === "active" &&
      entry.timetableConfigId === effectiveTimetableConfigId,
  );
}

export function timetableEntryDisplayLabel(
  entry: BackendTimetableEntryDto,
  locale: string,
): string {
  const subject =
    locale === "ar"
      ? entry.subject?.nameAr || entry.subject?.nameEn
      : entry.subject?.nameEn || entry.subject?.nameAr;
  const teacher = entry.teacher as
    | (NonNullable<BackendTimetableEntryDto["teacher"]> & {
        name?: string;
        nameEn?: string;
        nameAr?: string;
      })
    | null;
  const teacherName =
    teacher?.fullName ||
    (locale === "ar"
      ? teacher?.nameAr || teacher?.nameEn || teacher?.name
      : teacher?.nameEn || teacher?.nameAr || teacher?.name);
  const time =
    entry.period?.startTime && entry.period?.endTime
      ? `${entry.period.startTime} - ${entry.period.endTime}`
      : undefined;

  return [entry.period?.label, time, subject, teacherName]
    .filter(Boolean)
    .join(" · ");
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
