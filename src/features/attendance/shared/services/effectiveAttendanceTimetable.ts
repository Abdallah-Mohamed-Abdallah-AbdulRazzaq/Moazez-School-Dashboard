import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { getDashboardTimetable } from "@/features/academics/timetable/services/timetableApiAdapter";
import type { TimetableDashboardItemDto } from "@/features/academics/timetable/services/timetableApiTypes";
import { mapBackendPeriodToUi } from "@/features/academics/timetable/services/timetablePeriodsService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";

export interface EffectiveAttendanceTimetable {
  periods: TimetablePeriod[];
  activeDayIndexes: number[];
}

interface EffectiveAttendanceTimetableRequest {
  academicYearId: string;
  termId: string;
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  structure?: StructureTree;
}

type ResolvedDashboardItem = TimetableDashboardItemDto & {
  effectiveConfig: NonNullable<TimetableDashboardItemDto["effectiveConfig"]>;
};

const emptyTimetable = (): EffectiveAttendanceTimetable => ({
  periods: [],
  activeDayIndexes: [],
});

export async function fetchEffectiveAttendanceTimetable(
  request: EffectiveAttendanceTimetableRequest,
): Promise<EffectiveAttendanceTimetable> {
  if (request.scopeType === "CLASSROOM" && request.scopeIds.classroomId) {
    return fetchClassroomTimetable(
      request.termId,
      request.scopeIds.classroomId,
    );
  }

  return fetchScopedTimetable(request);
}

async function fetchScopedTimetable(
  request: EffectiveAttendanceTimetableRequest,
): Promise<EffectiveAttendanceTimetable> {
  const structure =
    request.structure ??
    (await fetchStructureTree(request.academicYearId, request.termId));
  const classroomIds = classroomIdsForScope(
    structure,
    request.scopeType,
    request.scopeIds,
  );
  if (classroomIds.length === 0) return emptyTimetable();

  const gradeIds = gradeIdsForClassrooms(structure, classroomIds);
  const dashboards = await Promise.all(
    gradeIds.map((gradeId) =>
      getDashboardTimetable({ termId: request.termId, gradeId }),
    ),
  );
  return resolveEffectiveAttendanceTimetable(
    dashboards.flatMap((dashboard) => dashboard.items),
    classroomIds,
  );
}

async function fetchClassroomTimetable(
  termId: string,
  classroomId: string,
): Promise<EffectiveAttendanceTimetable> {
  const dashboard = await getDashboardTimetable({ termId, classroomId });
  return resolveEffectiveAttendanceTimetable(dashboard.items, [classroomId]);
}

export function resolveEffectiveAttendanceTimetable(
  dashboardItems: TimetableDashboardItemDto[],
  classroomIds: string[],
): EffectiveAttendanceTimetable {
  const targetIds = new Set(classroomIds);
  const itemsByClassroom = new Map(
    dashboardItems
      .filter((item) => targetIds.has(item.classroomId))
      .map((item) => [item.classroomId, item]),
  );
  const targetItems = classroomIds
    .map((classroomId) => itemsByClassroom.get(classroomId))
    .filter(isResolvedDashboardItem);

  if (targetItems.length !== classroomIds.length) {
    return emptyTimetable();
  }

  const activeDayIndexes = sharedActiveDays(targetItems);
  const effectiveConfigIds = new Set(
    targetItems.map((item) => item.effectiveConfig.id),
  );
  if (effectiveConfigIds.size !== 1) {
    return { periods: [], activeDayIndexes };
  }

  const effectiveConfigId = targetItems[0].effectiveConfig.id;
  const periods = targetItems[0].periods
    .filter((period) => period.timetableConfigId === effectiveConfigId)
    .map(mapBackendPeriodToUi);
  return { periods, activeDayIndexes };
}

function classroomIdsForScope(
  structure: StructureTree,
  scopeType: AttendanceScopeType,
  scopeIds: AttendanceScopeIds,
): string[] {
  if (scopeType === "SCHOOL") {
    return structure.classrooms.map((classroom) => classroom.id);
  }
  if (scopeType === "CLASSROOM") {
    return scopeIds.classroomId ? [scopeIds.classroomId] : [];
  }

  const sectionIds = sectionIdsForScope(structure, scopeType, scopeIds);
  const selectedSectionIds = new Set(sectionIds);
  return structure.classrooms
    .filter((classroom) => selectedSectionIds.has(classroom.sectionId))
    .map((classroom) => classroom.id);
}

function sectionIdsForScope(
  structure: StructureTree,
  scopeType: Exclude<AttendanceScopeType, "SCHOOL" | "CLASSROOM">,
  scopeIds: AttendanceScopeIds,
): string[] {
  if (scopeType === "SECTION") {
    return scopeIds.sectionId ? [scopeIds.sectionId] : [];
  }

  const gradeIds =
    scopeType === "GRADE"
      ? [scopeIds.gradeId]
      : structure.grades
          .filter((grade) => grade.stageId === scopeIds.stageId)
          .map((grade) => grade.id);
  const selectedGradeIds = new Set(gradeIds.filter(Boolean));
  return structure.sections
    .filter((section) => selectedGradeIds.has(section.gradeId))
    .map((section) => section.id);
}

function gradeIdsForClassrooms(
  structure: StructureTree,
  classroomIds: string[],
): string[] {
  const selectedClassroomIds = new Set(classroomIds);
  const sectionIds = new Set(
    structure.classrooms
      .filter((classroom) => selectedClassroomIds.has(classroom.id))
      .map((classroom) => classroom.sectionId),
  );
  return Array.from(
    new Set(
      structure.sections
        .filter((section) => sectionIds.has(section.id))
        .map((section) => section.gradeId),
    ),
  );
}

function sharedActiveDays(items: ResolvedDashboardItem[]): number[] {
  const [firstItem, ...remainingItems] = items;
  return firstItem.effectiveConfig.activeDays.filter((dayIndex) =>
    remainingItems.every((item) =>
      item.effectiveConfig.activeDays.includes(dayIndex),
    ),
  );
}

function isResolvedDashboardItem(
  item: TimetableDashboardItemDto | undefined,
): item is ResolvedDashboardItem {
  return Boolean(item?.effectiveConfig);
}
