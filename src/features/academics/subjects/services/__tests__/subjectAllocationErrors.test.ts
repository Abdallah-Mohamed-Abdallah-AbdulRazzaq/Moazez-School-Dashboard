import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { subjectAllocationUiError } from "@/features/academics/subjects/services/subjectAllocationErrors";

describe("subjectAllocationUiError", () => {
  it.each([
    [
      "academics.subject_allocation.invalid_scope",
      "The subject allocation is outside the selected academic scope.",
    ],
    [
      "academics.subject_allocation.duplicate_pair",
      "The same grade and subject pair appears more than once in this request.",
    ],
    [
      "academics.subject_allocation.invalid_weekly_hours",
      "Weekly periods must be a whole number from 0 to 80.",
    ],
    [
      "academics.subject_allocation.invalid_bulk_size",
      "Bulk save supports 1-500 subject allocation rows.",
    ],
    [
      "academics.subject_allocation.closed_term",
      "This term is closed. Subject allocations are read-only.",
    ],
    ["validation.failed", "Check the submitted subject allocation fields."],
    [
      "auth.scope.missing",
      "You do not have permission to perform this action.",
    ],
  ])("maps %s to a user-facing message", (code, expectedMessage) => {
    const apiError = new ApiError("Backend message", 422, code);

    expect(subjectAllocationUiError(apiError, "Fallback").message).toBe(
      expectedMessage,
    );
  });

  it("keeps trace ids and nested detail messages", () => {
    const apiError = new ApiError(
      "Validation failed",
      422,
      "validation.failed",
      undefined,
      {
        fields: ["items.0.weeklyHours must not be greater than 80"],
      },
      "trace-123",
    );

    expect(subjectAllocationUiError(apiError, "Fallback")).toEqual({
      message: "Check the submitted subject allocation fields.",
      traceId: "trace-123",
      details: ["items.0.weeklyHours must not be greater than 80"],
    });
  });

  it("falls back for non-api errors", () => {
    expect(subjectAllocationUiError(new Error("Boom"), "Fallback")).toEqual({
      message: "Fallback",
      details: [],
    });
  });
});
