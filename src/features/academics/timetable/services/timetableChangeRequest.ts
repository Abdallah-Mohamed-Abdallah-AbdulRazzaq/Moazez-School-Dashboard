import type {
  BackendTimetableEntryDto,
  BulkSaveTimetableRequest,
  TimetableConflictCheckResponse,
} from "./timetableApiTypes";

type TimetableWriteItem = BulkSaveTimetableRequest["items"][number];

// Bulk upsert replaces a slot even when the draft entry has a different ID.
function slotKey(
  slot: Pick<TimetableWriteItem, "classroomId" | "dayOfWeek" | "periodId">,
): string {
  return `${slot.classroomId}:${slot.dayOfWeek}:${slot.periodId}`;
}

function persistedItemsBySlot(entries: BackendTimetableEntryDto[]) {
  const savedItems = new Map<string, TimetableWriteItem | null>();
  for (const entry of entries) {
    const savedItem = {
      classroomId: entry.classroom.id,
      dayOfWeek: entry.dayOfWeek,
      periodId: entry.periodId,
      teacherSubjectAllocationId: entry.teacherSubjectAllocationId,
      roomId: entry.room?.id ?? null,
    };
    const key = slotKey(savedItem);
    savedItems.set(
      key,
      savedItems.has(key) || entry.status === "cancelled" ? null : savedItem,
    );
  }
  return savedItems;
}

function proposedSlotCounts(items: TimetableWriteItem[]) {
  const counts = new Map<string, number>();
  for (const proposed of items) {
    const key = slotKey(proposed);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function buildTimetableChangeRequest({
  payload,
  persistedEntries,
  requiredIndexes = [],
}: {
  payload: BulkSaveTimetableRequest;
  persistedEntries: BackendTimetableEntryDto[];
  requiredIndexes?: number[];
}): { payload: BulkSaveTimetableRequest; originalIndexes: number[] } {
  const savedItems = persistedItemsBySlot(persistedEntries);
  const slotCounts = proposedSlotCounts(payload.items);
  const required = new Set(requiredIndexes);
  const originalIndexes: number[] = [];
  const items = payload.items.filter((proposed, index) => {
    const key = slotKey(proposed);
    const saved = savedItems.get(key);
    if (
      !required.has(index) && slotCounts.get(key) === 1 && saved &&
      saved.teacherSubjectAllocationId === proposed.teacherSubjectAllocationId &&
      (saved.roomId ?? null) === (proposed.roomId ?? null)
    ) return false;
    originalIndexes.push(index);
    return true;
  });
  return { payload: { ...payload, items }, originalIndexes };
}

export function remapTimetableConflictResponse(
  response: TimetableConflictCheckResponse,
  originalIndexes: number[],
): TimetableConflictCheckResponse {
  return {
    ...response,
    conflicts: response.conflicts.map((conflict) =>
      remapTimetableConflictIndexes(conflict, originalIndexes),
    ),
  };
}

export function remapTimetableConflictIndexes<Conflict extends { proposedIndexes: number[] }>(
  conflict: Conflict,
  originalIndexes: number[],
): Conflict {
  return {
    ...conflict,
    proposedIndexes: conflict.proposedIndexes.map((index) => originalIndexes[index]),
  };
}
