import { describe, expect, it } from "vitest";
import { normalizeTimetableConflicts } from "@/features/academics/timetable/services/timetableConflictNormalization";

const periods = [
  {
    id: "period-2",
    index: 2,
    nameAr: "الحصة الثانية",
    nameEn: "Period 2",
    startTime: "09:00",
    endTime: "09:45",
  },
];

describe("normalizeTimetableConflicts", () => {
  it("normalizes a persisted conflict with its affected entries", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            id: "conflict-1",
            type: "TEACHER",
            severity: "blocking",
            status: "active",
            dayOfWeek: 2,
            periodId: "period-2",
            entryId: "entry-1",
            relatedEntryId: "entry-2",
            entryIds: ["entry-1", "entry-2"],
            teacherUserId: "teacher-1",
            roomId: null,
            message: "Teacher intervals overlap.",
          },
        ],
      },
      "persisted",
      periods,
    );

    expect(conflict).toMatchObject({
      type: "TEACHER",
      code: "TEACHER",
      message: "Teacher intervals overlap.",
      severity: "blocking",
      dayOfWeek: 2,
      dayKey: "tue",
      periodId: "period-2",
      entryIds: ["entry-1", "entry-2"],
      proposedIndexes: [],
      resourceId: "teacher-1",
    });
  });

  it("normalizes a proposed conflict and preserves proposed indexes", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            code: "room_conflict",
            message: "Room intervals overlap.",
            severity: "blocking",
            dayOfWeek: 3,
            periodId: "period-2",
            classroomId: "classroom-1",
            teacherUserId: null,
            roomId: "room-1",
            entryIds: ["entry-3"],
            proposedIndexes: [4, 7],
          },
        ],
      },
      "proposed",
      periods,
    );

    expect(conflict).toMatchObject({
      type: "ROOM",
      code: "room_conflict",
      proposedIndexes: [4, 7],
      resourceId: "room-1",
    });
  });

  it("resolves known period labels, indexes, and times", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            code: "classroom_conflict",
            message: "Classroom intervals overlap.",
            severity: "blocking",
            dayOfWeek: 1,
            periodId: "period-2",
            classroomId: "classroom-1",
            teacherUserId: null,
            roomId: null,
            entryIds: [],
            proposedIndexes: [0],
          },
        ],
      },
      "proposed",
      periods,
    );

    expect(conflict).toMatchObject({
      periodIndex: 2,
      periodLabel: "Period 2",
      startTime: "09:00",
      endTime: "09:45",
    });
  });

  it("omits period metadata when the backend period ID cannot be resolved", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            code: "teacher_conflict",
            message: "Backend interval detail.",
            severity: "blocking",
            dayOfWeek: null,
            periodId: "deleted-period",
            classroomId: null,
            teacherUserId: "teacher-1",
            roomId: null,
            entryIds: [],
            proposedIndexes: [],
          },
        ],
      },
      "proposed",
      periods,
    );

    expect(conflict).toEqual(
      expect.objectContaining({
        message: "Backend interval detail.",
        dayOfWeek: null,
        periodId: "deleted-period",
      }),
    );
    expect(conflict).not.toHaveProperty("periodIndex");
    expect(conflict).not.toHaveProperty("periodLabel");
    expect(conflict).not.toHaveProperty("startTime");
    expect(conflict).not.toHaveProperty("endTime");
    expect(conflict).not.toHaveProperty("dayKey");
  });

  it("uses the proposed entry period for display when an overlapping existing entry has a different period ID", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            code: "teacher_conflict",
            message: "Teacher intervals overlap.",
            severity: "blocking",
            dayOfWeek: 2,
            periodId: "existing-config-period",
            teacherUserId: "teacher-1",
            proposedIndexes: [0],
          },
        ],
      },
      "proposed",
      periods,
      {
        proposedEntries: [
          {
            id: "temp-entry-1",
            classroomId: "classroom-1",
            sectionId: "section-1",
            dayKey: "tue",
            periodIndex: 2,
          },
        ],
      },
    );

    expect(conflict).toMatchObject({
      periodId: "existing-config-period",
      periodIndex: 2,
      periodLabel: "Period 2",
      startTime: "09:00",
      endTime: "09:45",
    });
  });

  it("derives a persisted classroom conflict resource from an affected entry", () => {
    const [conflict] = normalizeTimetableConflicts(
      {
        conflicts: [
          {
            type: "CLASSROOM",
            dayOfWeek: 2,
            periodId: "period-2",
            entryId: "entry-1",
            relatedEntryId: "entry-2",
            message: "Classroom intervals overlap.",
          },
        ],
      },
      "persisted",
      periods,
      {
        entries: [
          {
            id: "entry-1",
            classroomId: "classroom-1",
            sectionId: "section-1",
            dayKey: "tue",
            periodIndex: 2,
          },
        ],
      },
    );

    expect(conflict.resourceId).toBe("classroom-1");
  });
});
