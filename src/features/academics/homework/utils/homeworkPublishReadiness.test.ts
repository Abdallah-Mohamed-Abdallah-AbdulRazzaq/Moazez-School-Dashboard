import { describe, expect, it } from "vitest";
import { getHomeworkPublishReadiness } from "./homeworkPublishReadiness";

describe("getHomeworkPublishReadiness", () => {
  it("blocks publishing when resolving targets returns no eligible students", () => {
    expect(getHomeworkPublishReadiness([])).toEqual({
      isReady: false,
      errorKey: "noEligibleTargets",
    });
  });

  it("allows publishing when at least one target is resolved", () => {
    expect(
      getHomeworkPublishReadiness([
        { targetId: "target-1", studentId: "student-1", status: "assigned" },
      ]),
    ).toEqual({ isReady: true });
  });
});
