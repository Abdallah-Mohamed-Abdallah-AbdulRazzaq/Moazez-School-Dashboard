import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  describeReinforcementTaskApiError,
  shouldIncludeCancelledTasks,
} from "../utils/reinforcementTaskApiErrors";

describe("reinforcement task API errors", () => {
  it.each([
    [
      new ApiError("Task title is required", 400, "validation.failed", undefined, { field: "titleEn" }),
      { field: "title", messageKey: "validation.titleRequired" },
    ],
    [
      new ApiError("Invalid due date range", 400, "validation.failed", undefined, { dueFrom: "2026-10-21", dueTo: "2026-10-20" }),
      { field: "dueDate", messageKey: "validation.invalidDueDateRange" },
    ],
    [
      new ApiError("Target is duplicated", 409, "reinforcement.task.duplicate_target"),
      { field: "targets", messageKey: "validation.duplicateTarget" },
    ],
    [
      new ApiError("Task is cancelled", 409, "reinforcement.task.cancelled"),
      { messageKey: "tasks.messages.alreadyCancelled" },
    ],
  ])("maps %s to actionable feedback", (error, expected) => {
    expect(describeReinforcementTaskApiError(error)).toMatchObject(expected);
  });

  it("keeps unknown task failures in the shared validation state", () => {
    expect(describeReinforcementTaskApiError(new Error("Unexpected"))).toEqual({
      messageKey: "common.error",
    });
  });
});

describe("cancelled task filtering", () => {
  it.each([
    ["", false, false],
    ["cancelled", false, true],
    ["completed", true, true],
  ] as const)("includes cancelled tasks for status %s and checkbox %s", (status, includeCancelled, expected) => {
    expect(shouldIncludeCancelledTasks(status, includeCancelled)).toBe(expected);
  });
});
