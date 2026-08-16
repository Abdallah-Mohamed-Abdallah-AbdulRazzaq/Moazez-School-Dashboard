import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  teacherAllocationConflictDetails,
  teacherAllocationUiError,
} from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";

describe("teacherAllocationUiError", () => {
  it.each([
    [
      "academics.allocation.missing_subject_allocation",
      "This subject has no weekly-hours row for the selected grade/term. Configure subject allocation first.",
    ],
    [
      "academics.allocation.closed_term",
      "This term is closed. Allocations are read-only.",
    ],
    [
      "academics.allocation.duplicate_pair",
      "The same classroom/subject/teacher assignment appears more than once in this request.",
    ],
    [
      "academics.allocation.invalid_bulk_size",
      "Bulk save supports 1–500 allocations.",
    ],
    [
      "academics.allocation.delete_conflict",
      "This allocation is already used by timetable, lesson plans, or homework. Remove dependencies first.",
    ],
    [
      "academics.allocation.clear_conflict",
      "This allocation is already used by timetable, lesson plans, or homework. Remove dependencies first.",
    ],
  ])("maps %s to its user-facing message", (code, expectedMessage) => {
    const apiError = new ApiError("Backend message", 400, code);

    expect(teacherAllocationUiError(apiError, "Fallback").message).toBe(
      expectedMessage,
    );
  });

  it("keeps trace ids and detail messages for technical details", () => {
    const apiError = new ApiError(
      "Clear blocked",
      409,
      "academics.allocation.clear_conflict",
      undefined,
      {
        timetableEntries: ["Classroom A has timetable entries"],
        homeworkAssignments: ["Homework depends on this allocation"],
      },
      "trace-456",
    );

    expect(teacherAllocationUiError(apiError, "Fallback")).toEqual({
      message:
        "This allocation is already used by timetable, lesson plans, or homework. Remove dependencies first.",
      traceId: "trace-456",
      details: [
        "Classroom A has timetable entries",
        "Homework depends on this allocation",
      ],
    });
  });

  it("falls back for non-api errors", () => {
    expect(teacherAllocationUiError(new Error("Boom"), "Fallback")).toEqual({
      message: "Fallback",
      details: [],
    });
  });
});

describe("teacherAllocationConflictDetails", () => {
  it("extracts nested backend conflict messages", () => {
    const apiError = new ApiError(
      "Delete blocked",
      409,
      "academics.allocation.delete_conflict",
      undefined,
      {
        lessonPlans: ["Lesson plan depends on this allocation"],
      },
    );

    expect(teacherAllocationConflictDetails(apiError)).toEqual([
      "Lesson plan depends on this allocation",
    ]);
  });
});
