import { describe, expect, it } from "vitest";
import {
  previewLessonTransfer,
  type LessonTransferInput,
} from "../timetableLessonTransfer";
import { lessonTransferFixture } from "./fixtures/lessonTransferFixture";
import { applyTimetableDrop } from "../timetableDragDrop";

describe("lesson transfers", () => {
  it.each([
    ["assigned", null],
    ["missing teacher", "ALLOCATION_MISSING"],
    ["ineligible teacher", "ALLOCATION_MISSING"],
    ["missing subject", "SUBJECT_NOT_ALLOCATED"],
    ["unassigned swapped teacher", "ALLOCATION_MISSING"],
  ] as const)(
    "validates destination allocations during drag-and-drop: %s",
    (scenario, reason) => {
      const input = lessonTransferFixture();
      input.target.classroomId = "classroom-2";
      if (scenario === "missing teacher")
        input.teacherAllocations = input.teacherAllocations.slice(0, 1);
      if (scenario === "missing subject") input.subjectAllocations = [];
      if (scenario === "ineligible teacher")
        input.teacherAllocations[1].teacherEligibility = {
          eligible: false,
          reasonCode: "inactive",
        };
      if (scenario === "unassigned swapped teacher")
        input.entries.push({
          ...input.entries[0],
          ...input.target,
          id: "swap-target",
          teacherId: "unassigned",
        });
      const result = applyTimetableDrop({
        item: { kind: "ENTRY", id: "drag", entryId: input.sourceId },
        target: input.target,
        termId: "term-1",
        editableEntries: input.entries,
        allEntries: input.entries,
        rooms: input.rooms,
        classrooms: input.classrooms,
        periods: input.config.periods,
        allocations: input,
        readOnly: false,
        holiday: false,
        instructional: true,
        createEntryId: input.createEntryId,
      });
      if (reason) expect(result).toEqual({ status: "REJECTED", reason });
      else expect(result.status).toBe("APPLIED");
    },
  );
  it.each([
    ["same number at a different time", 2, "10:00", "10:45", null],
    [
      "different number overlapping the destination",
      7,
      "09:00",
      "10:00",
      "TEACHER_CONFLICT",
    ],
    ["back-to-back lessons", 7, "09:30", "10:00", null],
    ["overlapping room booking", 7, "09:00", "10:00", "ROOM_CONFLICT"],
  ] as const)(
    "uses actual time ranges for %s in another configuration",
    (_scenario, periodIndex, startTime, endTime, rejection) => {
      const input = lessonTransferFixture();
      input.allTermEntries.push({
        ...input.entries[0],
        id: "other-configuration-entry",
        classroomId: "classroom-2",
        timetableConfigId: "other-config",
        periodIndex,
        startTime,
        endTime,
        teacherId:
          rejection === "ROOM_CONFLICT" ? "other-teacher" : "teacher-1",
        roomId: rejection === "ROOM_CONFLICT" ? "room-1" : null,
      });
      const result = previewLessonTransfer(input);
      if (rejection)
        expect(result).toEqual({ status: "REJECTED", reason: rejection });
      else expect(result.status).toBe("APPLIED");
    },
  );

  it("copies the complete lesson without changing the source or input arrays", () => {
    const input = lessonTransferFixture();
    const snapshot = JSON.stringify(input);
    const result = previewLessonTransfer(input);
    expect(result.status).toBe("APPLIED");
    if (result.status !== "APPLIED") throw new Error("Expected a transfer");
    expect(result.entries).toEqual([
      input.entries[0],
      {
        ...input.entries[0],
        id: "temp-transfer-1",
        periodIndex: 2,
        status: "DRAFT",
      },
    ]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it.each(["entry-1", "temp-unsaved"])(
    "moves %s while retaining only persisted source deletions for Save",
    (sourceId) => {
      const input = lessonTransferFixture();
      input.mode = "move";
      input.sourceId = sourceId;
      input.entries = [{ ...input.entries[0], id: sourceId }];
      input.allTermEntries = sourceId.startsWith("temp-") ? [] : input.entries;
      const result = previewLessonTransfer(input);
      expect(result.status).toBe("APPLIED");
      if (result.status !== "APPLIED") throw new Error("Expected a transfer");
      expect(result.entries.filter((entry) => entry.subjectId)).toEqual([
        {
          ...input.entries[0],
          id: "temp-transfer-1",
          periodIndex: 2,
          status: "DRAFT",
        },
      ]);
      expect(result.entries.filter((entry) => !entry.subjectId)).toEqual(
        sourceId.startsWith("temp-")
          ? []
          : [
              {
                ...input.entries[0],
                subjectId: null,
                teacherId: null,
                roomId: null,
                status: "DRAFT",
              },
            ],
      );
    },
  );

  it.each([
    [
      "READ_ONLY",
      (input: LessonTransferInput) => {
        input.readOnly = true;
      },
    ],
    [
      "SAME_SLOT",
      (input: LessonTransferInput) => {
        input.target.periodIndex = 1;
      },
    ],
    [
      "INVALID_DESTINATION",
      (input: LessonTransferInput) => {
        input.target.periodIndex = 99;
      },
    ],
    [
      "HOLIDAY",
      (input: LessonTransferInput) => {
        input.target.dayKey = "fri";
      },
    ],
    [
      "NON_INSTRUCTIONAL",
      (input: LessonTransferInput) => {
        input.target.periodIndex = 3;
      },
    ],
    [
      "SOURCE_MISSING",
      (input: LessonTransferInput) => {
        input.entries = [];
      },
    ],
    [
      "OUTSIDE_SCOPE",
      (input: LessonTransferInput) => {
        input.target.classroomId = "other-config-classroom";
      },
    ],
    [
      "ALLOCATION_MISSING",
      (input: LessonTransferInput) => {
        input.teacherAllocations = [];
      },
    ],
    [
      "SUBJECT_NOT_ALLOCATED",
      (input: LessonTransferInput) => {
        input.subjectAllocations = [];
      },
    ],
    [
      "ROOM_INELIGIBLE",
      (input: LessonTransferInput) => {
        input.rooms[0].capacity = 5;
      },
    ],
    [
      "OCCUPIED",
      (input: LessonTransferInput) => {
        input.allTermEntries.push({
          ...input.entries[0],
          id: "occupied",
          periodIndex: 2,
        });
      },
    ],
    [
      "TEACHER_CONFLICT",
      (input: LessonTransferInput) => {
        input.allTermEntries.push({
          ...input.entries[0],
          id: "busy",
          classroomId: "classroom-2",
          periodIndex: 2,
          roomId: null,
        });
      },
    ],
    [
      "ROOM_CONFLICT",
      (input: LessonTransferInput) => {
        input.allTermEntries.push({
          ...input.entries[0],
          id: "busy",
          classroomId: "classroom-2",
          periodIndex: 2,
          teacherId: "other-teacher",
        });
      },
    ],
  ] as const)("rejects %s before changing the draft", (reason, modify) => {
    const input = lessonTransferFixture();
    modify(input);
    expect(previewLessonTransfer(input)).toEqual({
      status: "REJECTED",
      reason,
    });
  });

  it("checks copied resources against the original lesson but excludes a moved source", () => {
    const input = lessonTransferFixture();
    input.target = {
      ...input.target,
      classroomId: "classroom-2",
      periodIndex: 1,
    };
    expect(previewLessonTransfer(input)).toEqual({
      status: "REJECTED",
      reason: "TEACHER_CONFLICT",
    });
    expect(previewLessonTransfer({ ...input, mode: "move" }).status).toBe(
      "APPLIED",
    );
  });
});
