import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  teacherAllocationConflictDetails,
  teacherAllocationReassignmentFailure,
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

describe("teacherAllocationReassignmentFailure", () => {
  it.each([
    ["academics.allocation.reassignment_target_not_found", "target_not_found"],
    ["academics.allocation.reassignment_target_ineligible", "target_ineligible"],
    ["academics.allocation.reassignment_blocked", "blocked"],
    ["academics.allocation.reassignment_stale_preview", "stale_preview"],
    ["academics.allocation.reassignment_concurrent_change", "concurrent_change"],
  ] as const)("classifies %s as %s", (code, expectedKind) => {
    const apiError = new ApiError("Backend message", 409, code);

    expect(teacherAllocationReassignmentFailure(apiError)).toMatchObject({
      kind: expectedKind,
      blockers: [],
    });
  });

  it("preserves target eligibility details for localized rendering", () => {
    const ineligibleError = new ApiError(
      "Target ineligible",
      409,
      "academics.allocation.reassignment_target_ineligible",
      undefined,
      { reasonCode: "employment_inactive" },
      "trace-1",
    );

    expect(teacherAllocationReassignmentFailure(ineligibleError)).toEqual({
      kind: "target_ineligible",
      reasonCode: "employment_inactive",
      blockers: [],
      traceId: "trace-1",
    });
  });

  it("keeps valid blockers and discards malformed blocker details", () => {
    const blockedError = new ApiError(
      "Reassignment blocked",
      409,
      "academics.allocation.reassignment_blocked",
      undefined,
      {
        blockers: [
          {
            domain: "timetable",
            code: "target_teacher_conflict",
            count: 2,
            statuses: { active: 2 },
          },
          { domain: "invalid", code: "unknown", count: "many" },
        ],
      },
    );

    expect(teacherAllocationReassignmentFailure(blockedError)).toMatchObject({
      kind: "blocked",
      blockers: [
        {
          domain: "timetable",
          code: "target_teacher_conflict",
          count: 2,
          statuses: { active: 2 },
        },
      ],
    });
  });

  it("returns an unknown failure for errors outside the API contract", () => {
    expect(teacherAllocationReassignmentFailure(new Error("Boom"))).toEqual({
      kind: "unknown",
      blockers: [],
    });
  });
});
