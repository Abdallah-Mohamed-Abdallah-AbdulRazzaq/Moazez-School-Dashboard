import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_AUTHORING_QUESTION_TYPES,
  isRetiredAssessmentQuestionType,
} from "../assessmentQuestionAvailability";

describe("assessment question authoring availability", () => {
  it("offers only supported question types for authoring", () => {
    expect(ASSESSMENT_AUTHORING_QUESTION_TYPES).toEqual([
      "MCQ_SINGLE",
      "MCQ_MULTI",
      "TRUE_FALSE",
      "SHORT_ANSWER",
      "ESSAY",
    ]);
  });

  it.each([
    ["MATCHING", true],
    ["FILL_IN_BLANK", true],
    ["MEDIA", true],
    ["ESSAY", false],
  ] as const)("reports %s retirement as %s", (questionType, expected) => {
    expect(isRetiredAssessmentQuestionType(questionType)).toBe(expected);
  });
});
