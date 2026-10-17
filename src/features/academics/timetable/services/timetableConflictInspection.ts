import { getDashboardTimetable, getEntry } from "./timetableApiAdapter";
import type {
  BackendTimetableEntryDto,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
} from "./timetableApiTypes";
import { dayIndexToKey, mapBackendEntriesToUi } from "./timetableMappers";
import type {
  ResolvedTimetableConfig,
  TimetableConfigScope,
} from "../types/timetableConfig";
import type { TimetableConflictDisplay } from "./timetableConflictNormalization";

export async function loadConflictLessons(
  conflict: TimetableConflictDisplay,
  termId: string,
) {
  const outcomes = await Promise.allSettled(
    [...new Set(conflict.entryIds)].map(getEntry),
  );
  const entries = outcomes.flatMap((outcome) =>
    outcome.status === "fulfilled" ? [outcome.value] : [],
  );
  const classrooms = await conflictClassrooms(entries, termId);
  const configurations = Object.fromEntries(
    entries.map((entry) => [
      entry.id,
      linkedConfiguration(
        classrooms.get(entry.classroom.id),
        entry.timetableConfigId,
      ),
    ]),
  );
  return {
    entries,
    configurations,
    unavailableCount: outcomes.filter(
      (outcome) => outcome.status === "rejected",
    ).length,
  };
}

async function conflictClassrooms(
  entries: BackendTimetableEntryDto[],
  termId: string,
) {
  const classroomIds = [...new Set(entries.map((entry) => entry.classroom.id))];
  const outcomes = await Promise.allSettled(
    classroomIds.map((classroomId) =>
      getDashboardTimetable({ termId, classroomId }),
    ),
  );
  return new Map(
    classroomIds.map((classroomId, index) => {
      const outcome = outcomes[index];
      const classroom =
        outcome.status === "fulfilled"
          ? outcome.value.items.find(
              (candidate) => candidate.classroomId === classroomId,
            )
          : undefined;
      return [classroomId, classroom];
    }),
  );
}

function linkedConfiguration(
  classroom: TimetableDashboardItemDto | undefined,
  configId: string,
) {
  return (
    classroom?.configs.find((config) => config.id === configId) ??
    (classroom?.effectiveConfig?.id === configId
      ? classroom.effectiveConfig
      : null)
  );
}

export async function loadConflictClassroomTimetable(
  lesson: BackendTimetableEntryDto,
  termId: string,
) {
  const dashboard = await getDashboardTimetable({
    termId,
    classroomId: lesson.classroom.id,
  });
  const classroom = dashboard.items.find(
    (item) => item.classroomId === lesson.classroom.id,
  );
  const config = linkedConfiguration(classroom, lesson.timetableConfigId);
  if (!classroom || !config)
    throw new Error("The linked timetable is unavailable.");
  const backendEntries = classroom.entries.filter(
    (entry) =>
      entry.timetableConfigId === config.id && entry.status !== "cancelled",
  );
  const selectedEntry = backendEntries.find((entry) => entry.id === lesson.id);
  if (!selectedEntry)
    throw new Error("The linked lesson is no longer in this timetable.");
  if (
    !config.activeDays.includes(selectedEntry.dayOfWeek) ||
    !classroom.periods.some(
      (period) =>
        period.id === selectedEntry.periodId &&
        period.timetableConfigId === config.id,
    )
  )
    throw new Error(
      "The linked lesson is outside the current timetable periods.",
    );
  return {
    ...conflictClassroomSnapshot(classroom, config, backendEntries),
    selectedEntry,
  };
}

function conflictClassroomSnapshot(
  classroom: TimetableDashboardItemDto,
  config: TimetableDashboardConfigSummaryDto,
  backendEntries: BackendTimetableEntryDto[],
) {
  return {
    configuration: config,
    classroom: classroom.classroom,
    entries: mapBackendEntriesToUi(backendEntries).entries,
    resolvedConfig: conflictTimetableConfig(classroom, config),
    subjects: backendEntries.flatMap((entry) =>
      entry.subject ? [entry.subject] : [],
    ),
    teachers: backendEntries.flatMap((entry) =>
      entry.teacher
        ? [
            {
              id: entry.teacher.userId,
              nameAr: entry.teacher.fullName,
              nameEn: entry.teacher.fullName,
            },
          ]
        : [],
    ),
    rooms: backendEntries.flatMap((entry) => (entry.room ? [entry.room] : [])),
  };
}

function conflictTimetableConfig(
  classroom: TimetableDashboardItemDto,
  config: TimetableDashboardConfigSummaryDto,
): ResolvedTimetableConfig {
  return {
    source: { scope: config.scopeType.toUpperCase() as TimetableConfigScope },
    days: config.activeDays.map((day) => ({
      key: dayIndexToKey(day),
      index: day,
      isActive: true,
      nameAr: weekdayName(day, "ar"),
      nameEn: weekdayName(day, "en"),
    })),
    periods: classroom.periods
      .filter((period) => period.timetableConfigId === config.id)
      .map((period) => ({
        id: period.id,
        index: period.index,
        nameAr: period.label,
        nameEn: period.label,
        startTime: period.startTime,
        endTime: period.endTime,
        isInstructional: period.isInstructional,
        type: period.type.toUpperCase() as
          "CLASS" | "BREAK" | "ASSEMBLY" | "ACTIVITY",
      })),
  };
}

export function weekdayName(day: number, locale: string) {
  // Anchor labels to a Sunday in UTC so the viewer's time zone cannot change the weekday.
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 4 + day)));
}

export type ConflictClassroomSnapshot = Awaited<
  ReturnType<typeof loadConflictClassroomTimetable>
>;
