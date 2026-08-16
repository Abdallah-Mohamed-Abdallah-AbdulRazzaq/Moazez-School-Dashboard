import { describe, expect, it } from "vitest";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { BackendTimetablePeriodDto } from "@/features/academics/timetable/services/timetableApiTypes";
import {
  assertBulkPayloadSize,
  buildBulkSaveTimetableRequest,
  TEACHER_ALLOCATION_MISSING_MESSAGE,
} from "@/features/academics/timetable/services/timetableSaveMapper";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

const periods: BackendTimetablePeriodDto[] = [
  {
    id: "period-1",
    timetableConfigId: "config-1",
    index: 1,
    label: "P1",
    startTime: "08:00",
    endTime: "08:45",
    type: "class",
    isInstructional: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const teacherAllocations: TeacherAllocation[] = [
  {
    id: "allocation-section",
    termId: "term-1",
    sectionId: "section-1",
    subjectId: "subject-1",
    teacherId: "teacher-1",
  },
  {
    id: "allocation-classroom",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-1",
    teacherId: "teacher-1",
  },
];

const filledEntry: TimetableEntry = {
  id: "entry-1",
  termId: "term-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  dayKey: "mon",
  periodIndex: 1,
  subjectId: "subject-1",
  teacherId: "teacher-1",
  roomId: "room-1",
};

describe("timetableSaveMapper", () => {
  it("builds bulk save payloads for filled slots using period and allocation ids", () => {
    expect(
      buildBulkSaveTimetableRequest({
        termId: "term-1",
        entries: [filledEntry],
        periods,
        teacherAllocations,
        selectedSectionId: "section-1",
        selectedClassroomId: "classroom-1",
      }),
    ).toEqual({
      payload: {
        termId: "term-1",
        items: [
          {
            classroomId: "classroom-1",
            dayOfWeek: 1,
            periodId: "period-1",
            teacherSubjectAllocationId: "allocation-classroom",
            roomId: "room-1",
          },
        ],
      },
      skippedSlots: [],
    });
  });

  it("filters incomplete slots before building backend payload items", () => {
    const emptyEntry = {
      ...filledEntry,
      id: "entry-empty",
      subjectId: null,
      teacherId: null,
    };

    expect(
      buildBulkSaveTimetableRequest({
        termId: "term-1",
        entries: [emptyEntry],
        periods,
        teacherAllocations,
        selectedSectionId: "section-1",
        selectedClassroomId: "classroom-1",
      }),
    ).toEqual({
      payload: { termId: "term-1", items: [] },
      skippedSlots: [],
    });
  });

  it("reports subject slots without teachers as missing teacher allocations", () => {
    const result = buildBulkSaveTimetableRequest({
      termId: "term-1",
      entries: [{ ...filledEntry, teacherId: null }],
      periods,
      teacherAllocations,
      selectedSectionId: "section-1",
      selectedClassroomId: "classroom-1",
    });

    expect(result.payload.items).toEqual([]);
    expect(result.skippedSlots).toEqual([
      {
        entry: expect.objectContaining({ subjectId: "subject-1" }),
        reason: "MISSING_TEACHER_ALLOCATION",
      },
    ]);
  });

  it("skips filled slots when teacher allocation cannot be resolved", () => {
    const result = buildBulkSaveTimetableRequest({
      termId: "term-1",
      entries: [{ ...filledEntry, teacherId: "teacher-missing" }],
      periods,
      teacherAllocations,
      selectedSectionId: "section-1",
      selectedClassroomId: "classroom-1",
    });

    expect(result.payload.items).toEqual([]);
    expect(result.skippedSlots).toEqual([
      {
        entry: expect.objectContaining({ id: "entry-1" }),
        reason: "MISSING_TEACHER_ALLOCATION",
      },
    ]);
    expect(TEACHER_ALLOCATION_MISSING_MESSAGE).toBe(
      "Teacher allocation is missing for this subject/classroom.",
    );
  });

  it("does not use section-level allocations for classroom timetable entries", () => {
    const result = buildBulkSaveTimetableRequest({
      termId: "term-1",
      entries: [filledEntry],
      periods,
      teacherAllocations: [teacherAllocations[0]],
      selectedSectionId: "section-1",
      selectedClassroomId: "classroom-1",
    });

    expect(result.payload.items).toEqual([]);
    expect(result.skippedSlots).toEqual([
      {
        entry: expect.objectContaining({ id: "entry-1" }),
        reason: "MISSING_TEACHER_ALLOCATION",
      },
    ]);
  });

  it("resolves classroom allocations when saving a grade scoped timetable", () => {
    const result = buildBulkSaveTimetableRequest({
      termId: "term-1",
      entries: [{ ...filledEntry, sectionId: "" }],
      periods,
      teacherAllocations,
      selectedSectionId: "",
      selectedClassroomId: undefined,
    });

    expect(result).toEqual({
      payload: {
        termId: "term-1",
        items: [
          expect.objectContaining({
            classroomId: "classroom-1",
            teacherSubjectAllocationId: "allocation-classroom",
          }),
        ],
      },
      skippedSlots: [],
    });
  });

  it("does not build save payload items for non-instructional periods", () => {
    const result = buildBulkSaveTimetableRequest({
      termId: "term-1",
      entries: [filledEntry],
      periods: [
        {
          ...periods[0],
          type: "break",
          isInstructional: false,
        },
      ],
      teacherAllocations,
      selectedSectionId: "section-1",
      selectedClassroomId: "classroom-1",
    });

    expect(result.payload.items).toEqual([]);
    expect(result.skippedSlots).toEqual([
      {
        entry: expect.objectContaining({ id: "entry-1" }),
        reason: "MISSING_PERIOD",
      },
    ]);
  });

  it("requires backend bulk payloads to contain between 1 and 1,000 items", () => {
    expect(() => assertBulkPayloadSize([], "save")).toThrow(
      "at least one mapped entry",
    );
    expect(() =>
      assertBulkPayloadSize(
        Array.from({ length: 1001 }, () => ({
          classroomId: "classroom-1",
          dayOfWeek: 1,
          periodId: "period-1",
          teacherSubjectAllocationId: "allocation-1",
        })),
        "conflict-check",
      ),
    ).toThrow("1,000");
  });
});
