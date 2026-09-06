import { describe, expect, it } from "vitest";
import { getPartialQuestionCreationFailure } from "../assessmentQuestionRecovery";

describe("partial assessment creation recovery", () => {
  it("returns the failed question number from a valid recovery URL", () => {
    const searchParams = new URLSearchParams({
      recovery: "question-save-failed",
      failedQuestionNumber: "2",
    });

    expect(getPartialQuestionCreationFailure(searchParams)).toEqual({
      failedQuestionNumber: 2,
    });
  });

  it.each([
    new URLSearchParams(),
    new URLSearchParams({ recovery: "question-save-failed" }),
    new URLSearchParams({ recovery: "question-save-failed", failedQuestionNumber: "0" }),
    new URLSearchParams({ recovery: "question-save-failed", failedQuestionNumber: "1.5" }),
  ])("ignores an invalid recovery URL", (searchParams) => {
    expect(getPartialQuestionCreationFailure(searchParams)).toBeNull();
  });
});
