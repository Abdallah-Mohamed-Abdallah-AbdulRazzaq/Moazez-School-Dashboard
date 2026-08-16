import { describe, expect, it } from "vitest";
import {
  isAssessmentMetadataEditable,
  isGradeEntryAvailable,
  isSubmissionReviewAvailable,
} from "../assessmentWorkflow";

describe("assessment metadata editing", () => {
  it.each(["draft", "published", "approved"] as const)(
    "allows scope changes before the assessment is locked (%s)",
    (approvalStatus) => {
      expect(isAssessmentMetadataEditable({ approvalStatus, isLocked: false })).toBe(true);
    },
  );

  it("keeps locked assessments read-only", () => {
    expect(isAssessmentMetadataEditable({ approvalStatus: "approved", isLocked: true })).toBe(false);
  });

  it.each([
    ["draft", false],
    ["published", true],
    ["approved", true],
  ] as const)("allows bulk grade entry only after publication (%s)", (approvalStatus, expected) => {
    expect(isGradeEntryAvailable({ approvalStatus, isLocked: false, deliveryMode: "SCORE_ONLY" })).toBe(expected);
  });

  it("rejects question-based assessments even after publication", () => {
    expect(isGradeEntryAvailable({ approvalStatus: "published", isLocked: false, deliveryMode: "QUESTION_BASED" })).toBe(false);
  });

  it.each([
    ["draft", false],
    ["published", true],
    ["approved", true],
  ] as const)("allows question-based submission review only after publication (%s)", (approvalStatus, expected) => {
    expect(isSubmissionReviewAvailable({ approvalStatus, isLocked: false, deliveryMode: "QUESTION_BASED" })).toBe(expected);
  });

  it("keeps score-only and locked assessments out of submission review", () => {
    expect(isSubmissionReviewAvailable({ approvalStatus: "published", isLocked: false, deliveryMode: "SCORE_ONLY" })).toBe(false);
    expect(isSubmissionReviewAvailable({ approvalStatus: "approved", isLocked: true, deliveryMode: "QUESTION_BASED" })).toBe(false);
  });
});
