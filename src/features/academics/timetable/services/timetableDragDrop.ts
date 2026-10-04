import type { Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import { evaluateRoomEligibility } from "@/features/academics/rooms/services/roomSchedulingEligibility";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  resolveTimetableLessonDefaults,
  subjectOptionsForGradeAllocations,
} from "@/features/academics/timetable/services/timetableSlotEditing";
import type {
  Room,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

export type TimetableLibraryItem =
  | {
      kind: "LESSON";
      id: string;
      subjectId: string;
      teacherId: string | null;
      roomId: string | null;
      targetPeriods: number;
      scheduledPeriods: number;
      remainingPeriods: number;
    }
  | { kind: "TEACHER"; id: string; teacherId: string; subjectId: string }
  | { kind: "ROOM"; id: string; roomId: string }
  | { kind: "ENTRY"; id: string; entryId: string };

export interface TimetableDropTarget {
  dayKey: string;
  periodIndex: number;
  sectionId: string;
  classroomId: string;
}

export type TimetableDropRejection =
  | "READ_ONLY"
  | "HOLIDAY"
  | "NON_INSTRUCTIONAL"
  | "SUBJECT_REQUIRED"
  | "TEACHER_SUBJECT_MISMATCH"
  | "ROOM_INELIGIBLE"
  | "TEACHER_CONFLICT"
  | "ROOM_CONFLICT"
  | "SAME_SLOT";

export type TimetableDropEffect =
  | "CREATE"
  | "UPDATE"
  | "REPLACE"
  | "MOVE"
  | "SWAP";

export type TimetableDropResult =
  | { status: "REJECTED"; reason: TimetableDropRejection }
  | {
      status: "APPLIED";
      entries: TimetableEntry[];
      undoEntries: TimetableEntry[];
      effect: TimetableDropEffect;
    };

export interface BuildTimetableLibraryItemsInput {
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherAllocations: TeacherAllocation[];
  rooms: Room[];
  gradeId: string;
  sectionId: string;
  classroom: Classroom;
  entries: TimetableEntry[];
  locale: string;
}

export interface ApplyTimetableDropInput {
  item: TimetableLibraryItem;
  target: TimetableDropTarget;
  termId: string;
  editableEntries: TimetableEntry[];
  allEntries: TimetableEntry[];
  readOnly: boolean;
  holiday: boolean;
  instructional: boolean;
  rooms: Room[];
  classrooms: Classroom[];
  createEntryId: () => string;
}

export function buildTimetableLibraryItems(
  input: BuildTimetableLibraryItemsInput,
): TimetableLibraryItem[] {
  return [
    ...lessonLibraryItems(input),
    ...teacherLibraryItems(input),
    ...roomLibraryItems(input.rooms),
  ];
}

function lessonLibraryItems(
  input: BuildTimetableLibraryItemsInput,
): TimetableLibraryItem[] {
  const allocatedSubjects = subjectOptionsForGradeAllocations(input);

  return allocatedSubjects
    .map((subject) => buildLessonLibraryItem(subject, input))
    .sort((left, right) => right.remainingPeriods - left.remainingPeriods);
}

function buildLessonLibraryItem(
  subject: Subject,
  input: BuildTimetableLibraryItemsInput,
): Extract<TimetableLibraryItem, { kind: "LESSON" }> {
  const targetPeriods = allocatedWeeklyPeriods(subject.id, input);
  const scheduledPeriods = scheduledSubjectPeriods(subject.id, input);
  const defaults = lessonDefaults(subject.id, input);

  return {
    kind: "LESSON",
    id: `lesson:${subject.id}`,
    subjectId: subject.id,
    ...defaults,
    targetPeriods,
    scheduledPeriods,
    remainingPeriods: Math.max(0, targetPeriods - scheduledPeriods),
  };
}

function scheduledSubjectPeriods(
  subjectId: string,
  input: BuildTimetableLibraryItemsInput,
): number {
  return input.entries.filter(
    (entry) =>
      entry.classroomId === input.classroom.id &&
      entry.subjectId === subjectId,
  ).length;
}

function lessonDefaults(
  subjectId: string,
  input: BuildTimetableLibraryItemsInput,
): { teacherId: string | null; roomId: string | null } {
  return resolveTimetableLessonDefaults({
    subjectId,
    sectionId: input.sectionId,
    classroomId: input.classroom.id,
    teacherAllocations: input.teacherAllocations,
    teachers: input.teachers,
    subjects: input.subjects,
    rooms: input.rooms,
    selectedClassroom: input.classroom,
    locale: input.locale,
  });
}

function allocatedWeeklyPeriods(
  subjectId: string,
  input: BuildTimetableLibraryItemsInput,
): number {
  return (
    input.subjectAllocations.find(
      (allocation) =>
        allocation.gradeId === input.gradeId &&
        allocation.subjectId === subjectId,
    )?.weeklyHours ?? 0
  );
}

function teacherLibraryItems(
  input: BuildTimetableLibraryItemsInput,
): TimetableLibraryItem[] {
  return input.teacherAllocations
    .filter(
      (allocation) =>
        allocation.sectionId === input.sectionId &&
        allocation.classroomId === input.classroom.id,
    )
    .flatMap((allocation) =>
      allocation.teacherId
        ? [
            {
              kind: "TEACHER" as const,
              id: `teacher:${allocation.id}`,
              teacherId: allocation.teacherId,
              subjectId: allocation.subjectId,
            },
          ]
        : [],
    );
}

function roomLibraryItems(rooms: Room[]): TimetableLibraryItem[] {
  return rooms.map((room) => ({
    kind: "ROOM",
    id: `room:${room.id}`,
    roomId: room.id,
  }));
}

export function applyTimetableDrop(
  input: ApplyTimetableDropInput,
): TimetableDropResult {
  const destinationRejection = destinationRejectionReason(input);
  if (destinationRejection) {
    return { status: "REJECTED", reason: destinationRejection };
  }

  const proposedEntries = proposedTimetableEntries(input);
  const resourceRejection = resourceRejectionReason(proposedEntries, input);
  if (resourceRejection) {
    return { status: "REJECTED", reason: resourceRejection };
  }

  return {
    status: "APPLIED",
    entries: entriesAfterDrop(proposedEntries, input),
    undoEntries: [...input.editableEntries],
    effect: dropEffect(input),
  };
}

function proposedTimetableEntries(
  input: ApplyTimetableDropInput,
): TimetableEntry[] {
  const movedEntry = proposedTimetableEntry(input);
  const targetEntry = entryAtTarget(input.editableEntries, input.target);
  if (input.item.kind !== "ENTRY" || !targetEntry) return [movedEntry];

  const sourceEntry = sourceEntryForDrop(
    input.editableEntries,
    input.item.entryId,
  );
  return [
    movedEntry,
    entryAtNewTarget(
      targetEntry,
      entryTarget(sourceEntry, input.target.classroomId),
    ),
  ];
}

function destinationRejectionReason(
  input: ApplyTimetableDropInput,
): TimetableDropRejection | null {
  if (input.readOnly) return "READ_ONLY";
  if (input.holiday) return "HOLIDAY";
  if (!input.instructional) return "NON_INSTRUCTIONAL";

  const targetEntry = entryAtTarget(input.editableEntries, input.target);
  if (input.item.kind === "ENTRY") {
    const sourceEntry = sourceEntryForDrop(
      input.editableEntries,
      input.item.entryId,
    );
    if (sameSlot(sourceEntry, input.target)) return "SAME_SLOT";
  }
  if (
    (input.item.kind === "ROOM" || input.item.kind === "TEACHER") &&
    !targetEntry?.subjectId
  ) {
    return "SUBJECT_REQUIRED";
  }
  if (
    input.item.kind === "TEACHER" &&
    input.item.subjectId !== targetEntry?.subjectId
  ) {
    return "TEACHER_SUBJECT_MISMATCH";
  }
  return null;
}

function proposedTimetableEntry(
  input: ApplyTimetableDropInput,
): TimetableEntry {
  const targetEntry = entryAtTarget(input.editableEntries, input.target);
  if (input.item.kind === "ENTRY") {
    return entryAtNewTarget(
      sourceEntryForDrop(input.editableEntries, input.item.entryId),
      input.target,
    );
  }

  const baseEntry =
    targetEntry ??
    emptyTargetEntry(input.target, input.termId, input.createEntryId());
  if (input.item.kind === "LESSON") {
    return {
      ...baseEntry,
      subjectId: input.item.subjectId,
      teacherId: input.item.teacherId,
      roomId: input.item.roomId,
      status: "DRAFT",
    };
  }
  if (input.item.kind === "TEACHER") {
    return { ...baseEntry, teacherId: input.item.teacherId, status: "DRAFT" };
  }
  return { ...baseEntry, roomId: input.item.roomId, status: "DRAFT" };
}

function sourceEntryForDrop(
  entries: TimetableEntry[],
  entryId: string,
): TimetableEntry {
  return entries.find((entry) => entry.id === entryId)!;
}

function emptyTargetEntry(
  target: TimetableDropTarget,
  termId: string,
  entryId: string,
): TimetableEntry {
  return {
    id: entryId,
    termId,
    sectionId: target.sectionId,
    classroomId: target.classroomId,
    dayKey: target.dayKey,
    periodIndex: target.periodIndex,
    subjectId: null,
    teacherId: null,
    roomId: null,
    status: "DRAFT",
  };
}

function entryAtNewTarget(
  entry: TimetableEntry,
  target: TimetableDropTarget,
): TimetableEntry {
  return {
    ...entry,
    sectionId: target.sectionId,
    classroomId: target.classroomId,
    dayKey: target.dayKey,
    periodIndex: target.periodIndex,
    status: "DRAFT",
  };
}

function entryTarget(
  entry: TimetableEntry,
  fallbackClassroomId: string,
): TimetableDropTarget {
  return {
    sectionId: entry.sectionId,
    classroomId: entry.classroomId ?? fallbackClassroomId,
    dayKey: entry.dayKey,
    periodIndex: entry.periodIndex,
  };
}

function resourceRejectionReason(
  proposedEntries: TimetableEntry[],
  input: ApplyTimetableDropInput,
): TimetableDropRejection | null {
  const comparableEntries = entriesOutsideDropSlots(input);
  for (const proposedEntry of proposedEntries) {
    if (
      proposedEntry.roomId &&
      !roomIsEligible(proposedEntry.roomId, proposedEntry.classroomId, input)
    ) {
      return "ROOM_INELIGIBLE";
    }
    if (hasTeacherCollision(proposedEntry, comparableEntries))
      return "TEACHER_CONFLICT";
    if (hasRoomCollision(proposedEntry, comparableEntries))
      return "ROOM_CONFLICT";
  }
  return null;
}

function hasTeacherCollision(
  proposedEntry: TimetableEntry,
  entries: TimetableEntry[],
): boolean {
  return Boolean(
    proposedEntry.teacherId &&
      entries.some(
        (entry) =>
          samePeriod(entry, proposedEntry) &&
          entry.teacherId === proposedEntry.teacherId,
      ),
  );
}

function hasRoomCollision(
  proposedEntry: TimetableEntry,
  entries: TimetableEntry[],
): boolean {
  return Boolean(
    proposedEntry.roomId &&
      entries.some(
        (entry) =>
          samePeriod(entry, proposedEntry) &&
          entry.roomId === proposedEntry.roomId,
      ),
  );
}

function samePeriod(left: TimetableEntry, right: TimetableEntry): boolean {
  return (
    left.dayKey === right.dayKey && left.periodIndex === right.periodIndex
  );
}

function roomIsEligible(
  roomId: string,
  classroomId: string | undefined,
  input: ApplyTimetableDropInput,
): boolean {
  const room = input.rooms.find((candidate) => candidate.id === roomId);
  const classroom = input.classrooms.find(
    (candidate) => candidate.id === classroomId,
  );
  return room && classroom
    ? evaluateRoomEligibility(room, classroom).eligible
    : false;
}

function entriesOutsideDropSlots(
  input: ApplyTimetableDropInput,
): TimetableEntry[] {
  const targetKey = timetableSlotKey(input.target);
  const sourceId = input.item.kind === "ENTRY" ? input.item.entryId : null;
  return input.allEntries.filter(
    (entry) => timetableSlotKey(entry) !== targetKey && entry.id !== sourceId,
  );
}

function entriesAfterDrop(
  proposedEntries: TimetableEntry[],
  input: ApplyTimetableDropInput,
): TimetableEntry[] {
  const targetKey = timetableSlotKey(input.target);
  const sourceId = input.item.kind === "ENTRY" ? input.item.entryId : null;
  return [
    ...input.editableEntries.filter(
      (entry) => timetableSlotKey(entry) !== targetKey && entry.id !== sourceId,
    ),
    ...proposedEntries,
  ];
}

function dropEffect(input: ApplyTimetableDropInput): TimetableDropEffect {
  if (input.item.kind === "ENTRY") {
    return entryAtTarget(input.editableEntries, input.target) ? "SWAP" : "MOVE";
  }
  if (input.item.kind === "ROOM" || input.item.kind === "TEACHER") {
    return "UPDATE";
  }
  return entryAtTarget(input.editableEntries, input.target)
    ? "REPLACE"
    : "CREATE";
}

function entryAtTarget(
  entries: TimetableEntry[],
  target: TimetableDropTarget,
): TimetableEntry | undefined {
  const targetKey = timetableSlotKey(target);
  return entries.find((entry) => timetableSlotKey(entry) === targetKey);
}

function sameSlot(
  entry: TimetableEntry,
  target: TimetableDropTarget,
): boolean {
  return timetableSlotKey(entry) === timetableSlotKey(target);
}

function timetableSlotKey(
  slot: Pick<
    TimetableEntry,
    "classroomId" | "dayKey" | "periodIndex"
  >,
): string {
  return `${slot.classroomId ?? ""}:${slot.dayKey}:${slot.periodIndex}`;
}

export function mergeTimetableEntriesForValidation(
  authoritativeEntries: TimetableEntry[],
  editableEntries: TimetableEntry[],
): TimetableEntry[] {
  const entriesBySlot = new Map(
    authoritativeEntries.map((entry) => [timetableSlotKey(entry), entry]),
  );
  editableEntries.forEach((entry) => {
    entriesBySlot.set(timetableSlotKey(entry), entry);
  });
  return [...entriesBySlot.values()];
}
