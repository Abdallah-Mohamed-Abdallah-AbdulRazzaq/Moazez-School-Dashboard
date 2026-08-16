import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { lessonPlansUiError } from "../lessonPlansErrors";

describe("lesson plan errors", () => {
  it("maps backend codes and retains the trace ID", () => {
    const error = new ApiError(
      "Conflict",
      409,
      "academics.lesson_plan.duplicate",
      undefined,
      undefined,
      "trace-123",
    );
    expect(lessonPlansUiError(error)).toBe(
      "A lesson plan already exists for this week (trace: trace-123)",
    );
  });
});
