import { describe, expect, it } from "vitest";
import type { Assessment } from "../../types";
import { canEditAssessmentQuestions } from "../assessmentContract";

function assessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    id: "assessment-1",
    termId: "term-1",
    subjectId: "subject-1",
    scopeType: "school",
    scopeId: "school-1",
    title: "Assessment",
    titleAr: "اختبار",
    type: "QUIZ",
    deliveryMode: "QUESTION_BASED",
    date: "2026-07-11",
    weight: 10,
    maxScore: 20,
    isLocked: false,
    approvalStatus: "draft",
    ...overrides,
  };
}

describe("canEditAssessmentQuestions", () => {
  it("allows an unlocked draft in an open term", () => {
    expect(canEditAssessmentQuestions(assessment(), "active")).toBe(true);
  });

  it.each(["published", "approved"] as const)(
    "rejects a %s assessment",
    (approvalStatus) => {
      expect(canEditAssessmentQuestions(assessment({ approvalStatus }), "active")).toBe(false);
    },
  );

  it("rejects locked assessments and closed terms", () => {
    expect(canEditAssessmentQuestions(assessment({ isLocked: true }), "active")).toBe(false);
    expect(canEditAssessmentQuestions(assessment(), "closed")).toBe(false);
  });
});
