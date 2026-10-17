import { describe, expect, it } from "vitest";
import type { Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  applyTimetableDrop,
  buildTimetableLibraryItems,
  mergeTimetableEntriesForValidation,
  hasTimetableRoomConflict,
  type ApplyTimetableDropInput,
  type TimetableLibraryItem,
} from "@/features/academics/timetable/services/timetableDragDrop";
import type {
  Room,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

const classroom: Classroom = {
  id: "classroom-1",
  sectionId: "section-1",
  name: "Classroom 1",
  nameAr: "فصل 1",
  nameEn: "Classroom 1",
  capacity: 25,
  order: 1,
};

const subjects: Subject[] = [
  {
    id: "math",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    code: "MATH",
    color: null,
    isActive: true,
  },
  {
    id: "science",
    name: "Science",
    nameAr: "علوم",
    nameEn: "Science",
    code: "SCI",
    color: null,
    isActive: true,
  },
];

const subjectAllocations: SubjectAllocation[] = [
  { gradeId: "grade-1", subjectId: "math", weeklyHours: 5 },
  { gradeId: "grade-2", subjectId: "science", weeklyHours: 4 },
];

const teachers: Teacher[] = [
  {
    id: "teacher-math",
    nameAr: "معلم الرياضيات",
    nameEn: "Math Teacher",
    isActive: true,
  },
];

const teacherAllocations: TeacherAllocation[] = [
  {
    id: "allocation-math",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "math",
    teacherId: "teacher-math",
  },
];

const rooms: Room[] = [
  {
    id: "room-101",
    schoolId: "school-1",
    nameAr: "فصل 1",
    nameEn: "Classroom 1",
    capacity: 30,
    isActive: true,
  },
  {
    id: "small-room",
    schoolId: "school-1",
    nameAr: "غرفة صغيرة",
    nameEn: "Small room",
    capacity: 10,
    isActive: true,
  },
];

const scheduledMathEntries: TimetableEntry[] = [
  timetableEntry({ id: "math-1", dayKey: "sun", periodIndex: 1 }),
  timetableEntry({ id: "math-2", dayKey: "mon", periodIndex: 1 }),
];

describe("buildTimetableLibraryItems", () => {
  it("builds scoped lesson bundles with remaining weekly periods", () => {
    const libraryItems = buildTimetableLibraryItems({
      subjects,
      subjectAllocations,
      teachers,
      teacherAllocations,
      rooms,
      gradeId: "grade-1",
      sectionId: "section-1",
      classroom,
      entries: scheduledMathEntries,
      locale: "en",
    });

    expect(libraryItems).toContainEqual({
      kind: "LESSON",
      id: "lesson:math",
      subjectId: "math",
      teacherId: "teacher-math",
      roomId: "room-101",
      targetPeriods: 5,
      scheduledPeriods: 2,
      remainingPeriods: 3,
    });
    expect(
      libraryItems.some(
        (libraryItem) =>
          libraryItem.kind === "LESSON" && libraryItem.subjectId === "science",
      ),
    ).toBe(false);
  });

  it("keeps allocated lessons available when teacher and room defaults are missing", () => {
    const [lesson] = buildTimetableLibraryItems({
      subjects,
      subjectAllocations,
      teachers,
      teacherAllocations: [],
      rooms: [],
      gradeId: "grade-1",
      sectionId: "section-1",
      classroom,
      entries: [],
      locale: "en",
    });

    expect(lesson).toEqual(
      expect.objectContaining({
        kind: "LESSON",
        teacherId: null,
        roomId: null,
      }),
    );
  });

  it("clamps completed lesson requirements to zero", () => {
    const lesson = buildTimetableLibraryItems({
      subjects,
      subjectAllocations: [
        { gradeId: "grade-1", subjectId: "math", weeklyHours: 1 },
      ],
      teachers,
      teacherAllocations,
      rooms,
      gradeId: "grade-1",
      sectionId: "section-1",
      classroom,
      entries: scheduledMathEntries,
      locale: "en",
    }).find((libraryItem) => libraryItem.kind === "LESSON");

    expect(lesson).toEqual(expect.objectContaining({ remainingPeriods: 0 }));
  });
});

describe("applyTimetableDrop", () => {
  it("creates a complete lesson in an empty slot", () => {
    const placement = applyTimetableDrop(
      dropInput({
        item: lessonItem(),
        editableEntries: [],
        allEntries: [],
      }),
    );

    expect(placement).toEqual({
      status: "APPLIED",
      effect: "CREATE",
      undoEntries: [],
      entries: [
        timetableEntry({
          id: "generated-entry",
          dayKey: "tue",
          periodIndex: 2,
        }),
      ],
    });
  });

  it("updates only the teacher on an existing lesson", () => {
    const existingEntry = timetableEntry({ teacherId: null });
    const placement = applyTimetableDrop(
      dropInput({
        item: {
          kind: "TEACHER",
          id: "teacher:replacement",
          teacherId: "replacement",
          subjectId: "math",
        },
        editableEntries: [existingEntry],
        allEntries: [existingEntry],
      }),
    );

    expect(placement).toEqual(
      expect.objectContaining({
        status: "APPLIED",
        effect: "UPDATE",
        entries: [
          expect.objectContaining({
            subjectId: "math",
            teacherId: "replacement",
            roomId: "room-101",
          }),
        ],
      }),
    );
  });

  it.each(["classroom-1", "classroom-2"])(
    "swaps an existing lesson with an occupied target in %s",
    (targetClassroomId) => {
      const source = timetableEntry({
        id: "source",
        dayKey: "sun",
        periodIndex: 1,
      });
      const occupiedTarget = timetableEntry({
        id: "target",
        classroomId: targetClassroomId,
        subjectId: "science",
        teacherId: null,
        roomId: null,
      });
      const placement = applyTimetableDrop(
        dropInput({
          item: { kind: "ENTRY", id: "entry:source", entryId: "source" },
          target: {
            dayKey: "tue",
            periodIndex: 2,
            sectionId: "section-1",
            classroomId: targetClassroomId,
          },
          classrooms: [classroom, { ...classroom, id: "classroom-2" }],
          editableEntries: [source, occupiedTarget],
          allEntries: [source, occupiedTarget],
        }),
      );

      expect(placement).toEqual(
        expect.objectContaining({
          status: "APPLIED",
          effect: "SWAP",
          undoEntries: [source, occupiedTarget],
          entries: [
            expect.objectContaining({
              id: "source",
              classroomId: targetClassroomId,
              dayKey: "tue",
              periodIndex: 2,
              subjectId: "math",
            }),
            expect.objectContaining({
              id: "target",
              classroomId: source.classroomId,
              dayKey: "sun",
              periodIndex: 1,
              subjectId: "science",
            }),
          ],
        }),
      );
    },
  );

  it.each([
    [false, "classroom-1"],
    [true, "classroom-1"],
    [false, "classroom-2"],
    [true, "classroom-2"],
  ] as const)(
    "moves a saved lesson (cleared slot: %s, destination: %s) and retains its source deletion",
    (hasClearedTarget, targetClassroomId) => {
      const source = timetableEntry({
        id: "source",
        dayKey: "sun",
        periodIndex: 1,
      });
      const placement = applyTimetableDrop(
        dropInput({
          item: { kind: "ENTRY", id: "entry:source", entryId: "source" },
          target: {
            dayKey: "tue",
            periodIndex: 2,
            sectionId: "section-1",
            classroomId: targetClassroomId,
          },
          classrooms: [classroom, { ...classroom, id: "classroom-2" }],
          editableEntries: hasClearedTarget
            ? [
                source,
                timetableEntry({
                  id: "cleared-target",
                  classroomId: targetClassroomId,
                  subjectId: null,
                  teacherId: null,
                  roomId: null,
                }),
              ]
            : [source],
          allEntries: [source],
        }),
      );

      expect(placement).toEqual(
        expect.objectContaining({
          status: "APPLIED",
          effect: "MOVE",
          undoEntries: expect.arrayContaining([source]),
          entries: [
            expect.objectContaining({
              id: "generated-entry",
              classroomId: targetClassroomId,
              dayKey: "tue",
              periodIndex: 2,
            }),
            expect.objectContaining({
              id: "source",
              classroomId: source.classroomId,
              dayKey: "sun",
              periodIndex: 1,
              subjectId: null,
              teacherId: null,
              roomId: null,
            }),
          ],
        }),
      );
    },
  );

  it.each([
    ["READ_ONLY", { readOnly: true }],
    ["HOLIDAY", { holiday: true }],
    ["NON_INSTRUCTIONAL", { instructional: false }],
  ] as const)(
    "rejects %s destinations without mutation",
    (reason, overrides) => {
      const existingEntry = timetableEntry();
      const placement = applyTimetableDrop(
        dropInput({
          ...overrides,
          item: lessonItem(),
          editableEntries: [existingEntry],
          allEntries: [existingEntry],
        }),
      );

      expect(placement).toEqual({ status: "REJECTED", reason });
    },
  );

  it("requires a subject before applying a room", () => {
    const placement = applyTimetableDrop(
      dropInput({
        item: { kind: "ROOM", id: "room:room-101", roomId: "room-101" },
        editableEntries: [],
        allEntries: [],
      }),
    );

    expect(placement).toEqual({
      status: "REJECTED",
      reason: "SUBJECT_REQUIRED",
    });
  });

  it("rejects a teacher allocated to a different subject", () => {
    const targetEntry = timetableEntry();
    const placement = applyTimetableDrop(
      dropInput({
        item: {
          kind: "TEACHER",
          id: "teacher:science",
          teacherId: "teacher-science",
          subjectId: "science",
        },
        editableEntries: [targetEntry],
        allEntries: [targetEntry],
      }),
    );

    expect(placement).toEqual({
      status: "REJECTED",
      reason: "TEACHER_SUBJECT_MISMATCH",
    });
  });

  it.each([
    [
      "TEACHER_CONFLICT",
      lessonItem(),
      timetableEntry({
        id: "other-teacher-slot",
        classroomId: "classroom-2",
      }),
    ],
    [
      "ROOM_CONFLICT",
      { kind: "ROOM", id: "room:room-101", roomId: "room-101" } as const,
      timetableEntry({
        id: "other-room-slot",
        classroomId: "classroom-2",
        teacherId: "another-teacher",
      }),
    ],
  ] as const)("rejects a known %s", (reason, libraryItem, conflictingEntry) => {
    const targetEntry = timetableEntry();
    const placement = applyTimetableDrop(
      dropInput({
        item: libraryItem,
        editableEntries: [targetEntry],
        allEntries: [targetEntry, conflictingEntry],
      }),
    );

    expect(placement).toEqual({ status: "REJECTED", reason });
  });

  it("rejects a capacity-ineligible room", () => {
    const targetEntry = timetableEntry();
    const placement = applyTimetableDrop(
      dropInput({
        item: { kind: "ROOM", id: "room:small-room", roomId: "small-room" },
        editableEntries: [targetEntry],
        allEntries: [targetEntry],
      }),
    );

    expect(placement).toEqual({
      status: "REJECTED",
      reason: "ROOM_INELIGIBLE",
    });
  });
});

describe("mergeTimetableEntriesForValidation", () => {
  it.each([false, true])(
    "replaces the original lesson when a manual edit lost configuration metadata (cleared: %s)",
    (cleared) => {
      const original = timetableEntry({ timetableConfigId: "config-1" });
      const edited = {
        ...original,
        timetableConfigId: undefined,
        teacherId: cleared ? null : "replacement",
        roomId: null,
        subjectId: cleared ? null : "math",
      };
      expect(mergeTimetableEntriesForValidation([original], [edited])).toEqual([
        edited,
      ]);
    },
  );
  it("retains the same numbered slot from another configuration when applying local edits", () => {
    const current = timetableEntry({
      id: "current",
      timetableConfigId: "config-1",
    });
    const other = timetableEntry({
      id: "other",
      timetableConfigId: "config-2",
      startTime: "12:00",
      endTime: "13:00",
    });
    const edited = { ...current, teacherId: "replacement" };
    expect(
      mergeTimetableEntriesForValidation([current, other], [edited]),
    ).toEqual([edited, other]);
  });
  it("replaces an authoritative slot with its local edit", () => {
    const authoritativeEntry = timetableEntry({ id: "saved", teacherId: null });
    const editedEntry = timetableEntry({
      id: "draft",
      teacherId: "replacement",
    });

    expect(
      mergeTimetableEntriesForValidation([authoritativeEntry], [editedEntry]),
    ).toEqual([editedEntry]);
  });
});

describe("room conflict warnings", () => {
  it.each([
    ["hidden overlapping classroom", "08:30", "09:15", true],
    ["hidden classroom at another time", "10:00", "11:00", false],
    ["back-to-back booking", "09:00", "10:00", false],
  ] as const)(
    "checks %s against actual time ranges",
    (_scenario, startTime, endTime, expected) => {
      const hidden = timetableEntry({
        id: "hidden",
        classroomId: "classroom-2",
        timetableConfigId: "other",
        periodIndex: 7,
        startTime,
        endTime,
      });
      expect(
        hasTimetableRoomConflict({
          allEntries: [hidden],
          editableEntries: [],
          roomId: "room-101",
          target: { dayKey: "tue", periodIndex: 1 },
          periods: [{ index: 1, startTime: "08:00", endTime: "09:00" }],
        }),
      ).toBe(expected);
    },
  );

  it("honors local room changes and excludes the lesson being edited", () => {
    const original = timetableEntry({ timetableConfigId: "config-1" });
    const input = {
      allEntries: [original],
      editableEntries: [original],
      roomId: "room-101",
      target: { dayKey: "tue", periodIndex: 2 },
    };
    expect(
      hasTimetableRoomConflict({ ...input, excludeEntryId: original.id }),
    ).toBe(false);
    expect(
      hasTimetableRoomConflict({
        ...input,
        editableEntries: [
          { ...original, timetableConfigId: undefined, roomId: null },
        ],
      }),
    ).toBe(false);
  });
});

function timetableEntry(
  overrides: Partial<TimetableEntry> = {},
): TimetableEntry {
  return {
    id: "entry-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    dayKey: "tue",
    periodIndex: 2,
    subjectId: "math",
    teacherId: "teacher-math",
    roomId: "room-101",
    status: "DRAFT",
    ...overrides,
  };
}

function lessonItem(): TimetableLibraryItem {
  return {
    kind: "LESSON",
    id: "lesson:math",
    subjectId: "math",
    teacherId: "teacher-math",
    roomId: "room-101",
    targetPeriods: 5,
    scheduledPeriods: 2,
    remainingPeriods: 3,
  };
}

function dropInput(
  overrides: Partial<ApplyTimetableDropInput>,
): ApplyTimetableDropInput {
  return {
    item: lessonItem(),
    target: {
      dayKey: "tue",
      periodIndex: 2,
      sectionId: "section-1",
      classroomId: "classroom-1",
    },
    termId: "term-1",
    editableEntries: [],
    allEntries: [],
    readOnly: false,
    holiday: false,
    instructional: true,
    rooms,
    classrooms: [classroom],
    createEntryId: () => "generated-entry",
    ...overrides,
  };
}
