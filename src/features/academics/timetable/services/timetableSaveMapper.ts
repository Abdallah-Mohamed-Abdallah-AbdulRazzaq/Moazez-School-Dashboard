import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type {
  BackendTimetablePeriodDto,
  BulkSaveTimetableRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { dayKeyToIndex } from "@/features/academics/timetable/services/timetableMappers";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

export interface BuildBulkSaveRequestParams {
  termId: string;
  entries: TimetableEntry[];
  periods: BackendTimetablePeriodDto[];
  teacherAllocations: TeacherAllocation[];
  selectedSectionId: string;
  selectedClassroomId?: string;
}

export interface SkippedTimetableSlot {
  entry: TimetableEntry;
  reason: "MISSING_CLASSROOM" | "MISSING_PERIOD" | "MISSING_TEACHER_ALLOCATION";
}

export interface BuildBulkSaveRequestResult {
  payload: BulkSaveTimetableRequest;
  skippedSlots: SkippedTimetableSlot[];
}

export const TEACHER_ALLOCATION_MISSING_MESSAGE =
  "Teacher allocation is missing for this subject/classroom.";

export const BULK_TIMETABLE_ITEM_LIMIT = 1000;

export function assertBulkPayloadSize(
  items: BulkSaveTimetableRequest["items"],
  operation: "save" | "conflict-check",
): void {
  if (items.length === 0) {
    throw new Error(
      `Timetable ${operation} requires at least one mapped entry.`,
    );
  }
  if (items.length > BULK_TIMETABLE_ITEM_LIMIT) {
    throw new Error(
      `Timetable ${operation} cannot exceed 1,000 mapped entries.`,
    );
  }
}

export function buildBulkSaveTimetableRequest({
  termId,
  entries,
  periods,
  teacherAllocations,
  selectedSectionId,
  selectedClassroomId,
}: BuildBulkSaveRequestParams): BuildBulkSaveRequestResult {
  const skippedSlots: SkippedTimetableSlot[] = [];
  const items: BulkSaveTimetableRequest["items"] = [];

  entries
    .filter((entry) => entry.subjectId)
    .forEach((entry) => {
      const classroomId = entry.classroomId || selectedClassroomId;
      const periodId = resolvePeriodId(entry.periodIndex, periods);
      if (!entry.teacherId) {
        skippedSlots.push({ entry, reason: "MISSING_TEACHER_ALLOCATION" });
        return;
      }
      const teacherSubjectAllocationId = resolveTeacherSubjectAllocationId({
        entry,
        teacherAllocations,
        sectionId: entry.sectionId || selectedSectionId,
        classroomId,
      });

      if (!classroomId) {
        skippedSlots.push({ entry, reason: "MISSING_CLASSROOM" });
        return;
      }
      if (!periodId) {
        skippedSlots.push({ entry, reason: "MISSING_PERIOD" });
        return;
      }
      if (!teacherSubjectAllocationId) {
        skippedSlots.push({ entry, reason: "MISSING_TEACHER_ALLOCATION" });
        return;
      }

      items.push({
        classroomId,
        dayOfWeek: dayKeyToIndex(entry.dayKey),
        periodId,
        teacherSubjectAllocationId,
        roomId: entry.roomId || null,
      });
    });

  return {
    payload: { termId, items },
    skippedSlots,
  };
}

function resolvePeriodId(
  periodIndex: number,
  periods: BackendTimetablePeriodDto[],
): string | null {
  return (
    periods.find(
      (period) =>
        period.index === periodIndex && period.isInstructional !== false,
    )?.id ?? null
  );
}

function resolveTeacherSubjectAllocationId({
  entry,
  teacherAllocations,
  sectionId,
  classroomId,
}: {
  entry: TimetableEntry;
  teacherAllocations: TeacherAllocation[];
  sectionId?: string;
  classroomId?: string;
}): string | null {
  const eligibleAllocations = teacherAllocations.filter(
    (allocation) =>
      (!sectionId || allocation.sectionId === sectionId) &&
      allocation.classroomId === classroomId &&
      allocation.subjectId === entry.subjectId &&
      allocation.teacherId === entry.teacherId,
  );
  const matchingAllocation = eligibleAllocations[0];

  return matchingAllocation?.id ?? null;
}
