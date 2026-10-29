import { lessonAllocationRejection } from "./timetableLessonAllocation";
import type {
  Classroom,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TimetableEntry, Room } from "../types/timetable";
import type { ResolvedTimetableConfig } from "../types/timetableConfig";
import {
  applyTimetableDrop,
  mergeTimetableEntriesForValidation,
  type TimetableDropRejection,
  type TimetableDropTarget,
} from "./timetableDragDrop";

export type LessonTransferMode = "copy" | "move";
export type LessonTransferRejection =
  | TimetableDropRejection
  | "SOURCE_MISSING"
  | "OUTSIDE_SCOPE"
  | "OCCUPIED"
  | "INVALID_DESTINATION"
  | "ALLOCATION_MISSING"
  | "SUBJECT_NOT_ALLOCATED";
export interface LessonTransferInput {
  mode: LessonTransferMode;
  sourceId: string;
  target: TimetableDropTarget;
  entries: TimetableEntry[];
  allTermEntries: TimetableEntry[];
  classrooms: Classroom[];
  sections: Section[];
  teacherAllocations: TeacherAllocation[];
  subjectAllocations: SubjectAllocation[];
  rooms: Room[];
  config: ResolvedTimetableConfig;
  readOnly: boolean;
  createEntryId: () => string;
}
export type LessonTransferResult =
  | { status: "REJECTED"; reason: LessonTransferRejection }
  | {
      status: "APPLIED";
      entries: TimetableEntry[];
    };

export function previewLessonTransfer(
  input: LessonTransferInput,
): LessonTransferResult {
  const source = input.entries.find((entry) => entry.id === input.sourceId);
  if (!source?.subjectId || source.slotType === "BREAK")
    return { status: "REJECTED", reason: "SOURCE_MISSING" };
  const rejection = transferRejection(source, input);
  if (rejection) return { status: "REJECTED", reason: rejection };
  const retainedEntries =
    input.mode === "move"
      ? input.entries.filter((entry) => entry.id !== source.id)
      : input.entries;
  const comparableEntries = mergeTimetableEntriesForValidation(
    input.allTermEntries,
    input.entries,
  ).filter((entry) => input.mode !== "move" || entry.id !== source.id);
  const placement = applyTimetableDrop({
    item: {
      kind: "LESSON",
      id: `transfer:${source.id}`,
      subjectId: source.subjectId,
      teacherId: source.teacherId,
      roomId: source.roomId,
      roomSource: "MANUAL",
      targetPeriods: 0,
      scheduledPeriods: 0,
      remainingPeriods: 0,
    },
    target: input.target,
    termId: source.termId,
    editableEntries: retainedEntries,
    allEntries: comparableEntries,
    readOnly: input.readOnly,
    holiday: false,
    instructional: true,
    rooms: input.rooms,
    classrooms: input.classrooms,
    periods: input.config.periods,
    createEntryId: input.createEntryId,
  });
  if (placement.status === "REJECTED") return placement;
  const entries = [...placement.entries];
  // Persisted moves need a cleared source so Save deletes the original backend slot.
  if (input.mode === "move" && !source.id.startsWith("temp-"))
    entries.push({
      ...source,
      subjectId: null,
      teacherId: null,
      roomId: null,
      status: "DRAFT",
    });
  return { status: "APPLIED", entries };
}

function transferRejection(
  source: TimetableEntry,
  input: LessonTransferInput,
): LessonTransferRejection | null {
  if (input.readOnly) return "READ_ONLY";
  const classroom = input.classrooms.find(
    (candidate) =>
      candidate.id === input.target.classroomId &&
      candidate.sectionId === input.target.sectionId,
  );
  if (
    !classroom ||
    !input.classrooms.some((candidate) => candidate.id === source.classroomId)
  )
    return "OUTSIDE_SCOPE";
  if (sameDestination(source, input.target)) return "SAME_SLOT";
  return (
    destinationRejection(input) ??
    lessonAllocationRejection({ ...source, classroomId: classroom.id }, input)
  );
}

function destinationRejection(
  input: LessonTransferInput,
): LessonTransferRejection | null {
  const day = input.config.days.find(
    (candidate) => candidate.key === input.target.dayKey,
  );
  const period = input.config.periods.find(
    (candidate) => candidate.index === input.target.periodIndex,
  );
  if (!day || !period) return "INVALID_DESTINATION";
  if (!day.isActive) return "HOLIDAY";
  if (period.isInstructional === false) return "NON_INSTRUCTIONAL";
  if (
    mergeTimetableEntriesForValidation(
      input.allTermEntries,
      input.entries,
    ).some(
      (entry) =>
        sameDestination(entry, input.target) &&
        (entry.subjectId || entry.slotType === "BREAK"),
    )
  )
    return "OCCUPIED";
  return null;
}

function sameDestination(
  entry: TimetableEntry,
  target: TimetableDropTarget,
): boolean {
  return (
    entry.classroomId === target.classroomId &&
    entry.dayKey === target.dayKey &&
    entry.periodIndex === target.periodIndex
  );
}
