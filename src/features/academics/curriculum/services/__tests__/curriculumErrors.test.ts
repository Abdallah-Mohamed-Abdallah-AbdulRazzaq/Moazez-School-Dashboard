import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { curriculumFormErrors, curriculumUiError } from "../curriculumErrors";

describe("curriculumErrors", () => {
  it("maps known curriculum and lesson-content domain codes", () => {
    expect(
      curriculumUiError(
        new ApiError(
          "backend",
          400,
          "academics.lesson_content.invalid_type_payload",
        ),
        "Fallback",
      ).message,
    ).toBe("The content fields do not match the selected content type.");
  });

  it("preserves trace ids and nested validation details", () => {
    const result = curriculumUiError(
      new ApiError(
        "Validation failed",
        400,
        "validation.failed",
        undefined,
        { title: ["Title is required"], url: "URL must use HTTP or HTTPS" },
        "trace-123",
      ),
      "Fallback",
    );

    expect(result).toEqual({
      message: "Check the submitted curriculum fields.",
      traceId: "trace-123",
      details: ["Title is required", "URL must use HTTP or HTTPS"],
      fieldErrors: {},
    });
  });

  it("normalizes backend field errors", () => {
    const result = curriculumUiError(
      new ApiError(
        "Validation failed",
        422,
        "validation.failed",
        {
          title: ["Title is required"],
          "payload.estimatedMinutes": ["Must be positive"],
        },
      ),
      "Fallback",
    );

    expect(result.fieldErrors).toEqual({
      title: ["Title is required"],
      "payload.estimatedMinutes": ["Must be positive"],
    });
  });

  it("projects known paths and retains unmatched errors at form level", () => {
    const uiError = curriculumUiError(
      new ApiError(
        "Validation failed",
        422,
        "validation.failed",
        {
          title: ["Title is required"],
          "payload.estimatedMinutes": ["Must be positive"],
          sortOrder: ["Invalid order"],
        },
        ["Request could not be processed"],
      ),
      "Fallback",
    );

    expect(
      curriculumFormErrors(uiError, ["title", "estimatedMinutes"]),
    ).toEqual({
      fieldErrors: {
        title: "Title is required",
        estimatedMinutes: "Must be positive",
      },
      formMessages: ["Request could not be processed", "Invalid order"],
    });
  });

  it("maps indexed nested paths to their known parent field", () => {
    const uiError = curriculumUiError(
      new ApiError("Validation failed", 422, "validation.failed", {
        "objectives.0": ["Objective is invalid"],
      }),
      "Fallback",
    );

    expect(curriculumFormErrors(uiError, ["objectives"])).toEqual({
      fieldErrors: { objectives: "Objective is invalid" },
      formMessages: [],
    });
  });

  it("falls back for non-api errors", () => {
    expect(curriculumUiError(new Error("boom"), "Fallback")).toEqual({
      message: "Fallback",
      details: [],
      fieldErrors: {},
    });
  });
});
