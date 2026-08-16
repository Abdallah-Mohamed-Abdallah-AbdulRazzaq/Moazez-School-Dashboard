import type { BackendTimetablePeriodDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

export interface TimetablePublishFingerprintInput {
  configId: string;
  scope: {
    gradeId?: string | null;
    sectionId?: string | null;
    classroomId?: string | null;
  };
  activeDays: number[];
  periods: BackendTimetablePeriodDto[];
  entries: TimetableEntry[];
}

export function createTimetablePublishFingerprint({
  configId,
  scope,
  activeDays,
  periods,
  entries,
}: TimetablePublishFingerprintInput): string {
  return JSON.stringify({
    configId,
    scope,
    activeDays: [...activeDays].sort((left, right) => left - right),
    periods: periods
      .filter((period) => period.isInstructional !== false)
      .map((period) => ({ id: period.id, index: period.index }))
      .sort((left, right) => left.index - right.index),
    entries: entries
      .map((entry) => ({
        id: entry.id,
        classroomId: entry.classroomId ?? null,
        dayKey: entry.dayKey,
        periodIndex: entry.periodIndex,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        roomId: entry.roomId,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}
