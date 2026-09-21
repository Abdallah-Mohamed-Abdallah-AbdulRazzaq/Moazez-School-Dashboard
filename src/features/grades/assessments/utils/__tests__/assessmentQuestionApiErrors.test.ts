import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { mapAssessmentQuestionApiError } from "../assessmentQuestionApiErrors";

describe("assessment question API errors", () => {
  it.each([
    ["prompt", "textEn"],
    ["promptAr", "textAr"],
    ["points", "points"],
    ["options.0.label", "options"],
    ["matchingPairs", "matchingPairs"],
    ["mediaUrl", "media"],
  ] as const)("maps the backend %s field to the %s builder error", (field, expectedField) => {
    const apiError = new ApiError(
      "The submitted value is invalid",
      400,
      "validation.failed",
      undefined,
      { field },
    );

    expect(mapAssessmentQuestionApiError(apiError, "Fix this field.")).toEqual({
      [expectedField]: "Fix this field.",
    });
  });

  it("maps a question-points business validation error without a backend field", () => {
    const apiError = new ApiError(
      "Question points must be greater than 0",
      400,
      "validation.failed",
    );

    expect(mapAssessmentQuestionApiError(apiError, "Points must be greater than zero.")).toEqual({
      points: "Points must be greater than zero.",
    });
  });
});
