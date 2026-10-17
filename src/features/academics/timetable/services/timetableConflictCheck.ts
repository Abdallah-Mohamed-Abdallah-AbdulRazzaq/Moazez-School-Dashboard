import type { TimetableConflictCheckResponse } from "./timetableApiTypes";
import type { TimetableEntry } from "../types/timetable";

export function withoutClearedEntryConflicts(
  response: TimetableConflictCheckResponse,
  entries: TimetableEntry[],
): TimetableConflictCheckResponse {
  const clearedIds = new Set(
    entries
      .filter((entry) => !entry.subjectId && entry.slotType !== "BREAK")
      .map((entry) => entry.id),
  );
  const conflicts = response.conflicts.filter(
    (conflict) =>
      !(
        conflict.proposedIndexes.length === 1 &&
        conflict.entryIds.length > 0 &&
        conflict.entryIds.every((id) => clearedIds.has(id))
      ),
  );
  return { ...response, conflicts, hasConflicts: conflicts.length > 0 };
}
