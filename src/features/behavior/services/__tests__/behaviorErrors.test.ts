import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  behaviorErrorMessageKey,
  behaviorUiError,
  isBehaviorErrorCode,
} from "../behaviorErrors";

describe("behaviorErrors", () => {
  it("maps known behavior domain codes through localization keys", () => {
    expect(
      behaviorUiError(
        new ApiError("backend", 400, "behavior.record.invalid_status_transition"),
        "Fallback",
        (key) => `localized:${key}`,
      ).message,
    ).toBe("localized:errors.recordInvalidStatusTransition");

    expect(
      behaviorErrorMessageKey("behavior.record.invalid_status_transition"),
    ).toBe("errors.recordInvalidStatusTransition");
  });

  it("covers every documented behavior domain code", () => {
    [
      "behavior.category.in_use",
      "behavior.category.inactive",
      "behavior.record.points_invalid",
      "behavior.record.type_mismatch",
      "behavior.record.outside_term",
      "behavior.scope.invalid",
      "behavior.record.invalid_status_transition",
      "behavior.record.already_submitted",
      "behavior.record.already_reviewed",
      "behavior.record.cancelled",
      "behavior.record.not_submitted",
      "behavior.points.duplicate_source",
    ].forEach((code) => {
      expect(isBehaviorErrorCode(code)).toBe(true);
      expect(
        behaviorUiError(
          new ApiError("backend", 400, code),
          "Fallback",
          (key) => `localized:${key}`,
        ).message,
      ).not.toBe("Fallback");
    });
  });

  it("falls back to backend message for unknown api errors", () => {
    expect(
      behaviorUiError(new ApiError("Backend message", 400, "unknown"), "Fallback"),
    ).toEqual({
      message: "Backend message",
      details: [],
      traceId: undefined,
    });
  });

  it("preserves nested details and trace id", () => {
    expect(
      behaviorUiError(
        new ApiError(
          "Validation failed",
          422,
          "behavior.record.points_invalid",
          undefined,
          { points: ["Points must be a negative integer."] },
          "trace-1",
        ),
        "Fallback",
        (key) => `localized:${key}`,
      ),
    ).toEqual({
      message: "localized:errors.invalidPoints",
      details: ["Points must be a negative integer."],
      traceId: "trace-1",
    });
  });
});
