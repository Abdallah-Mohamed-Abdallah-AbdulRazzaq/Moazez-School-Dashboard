import type { BackendTimetableEntryDto } from "./timetableApiTypes";

export function timetableEntryFingerprint(
  entries: BackendTimetableEntryDto[],
): string {
  return JSON.stringify(
    entries.map((entry) => ({
      id: entry.id,
      periodId: entry.periodId,
      classroomId: entry.classroom.id,
      dayOfWeek: entry.dayOfWeek,
      allocationId: entry.teacherSubjectAllocationId,
      roomId: entry.room?.id ?? null,
      status: entry.status,
      updatedAt: entry.updatedAt,
    })).sort((left, right) => left.id.localeCompare(right.id)),
  );
}
