import { describe, expect, it } from "vitest";
import {
  GradesSubmissionValidationError,
  assertUuid,
  validateBulkReviews,
  validateBulkSaveAnswers,
  validateListFilters,
  validateReviewAnswer,
  validateSaveAnswer,
} from "../submissionContract";

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const validAnswer = { questionId: UUID, answerText: "answer" };
const validReview = { answerId: UUID, awardedPoints: 1 };

describe("grades submission request contract", () => {
  it.each([
    ["answer text", () => validateSaveAnswer({ answerText: "x".repeat(10_001) })],
    ["selected options", () => validateSaveAnswer({ selectedOptionIds: Array(101).fill(UUID) })],
    ["empty bulk answers", () => validateBulkSaveAnswers([])],
    ["oversized bulk answers", () => validateBulkSaveAnswers(Array(201).fill(validAnswer))],
    ["negative points", () => validateReviewAnswer({ awardedPoints: -1 })],
    ["infinite points", () => validateReviewAnswer({ awardedPoints: Number.POSITIVE_INFINITY })],
    ["review comment", () => validateReviewAnswer({ awardedPoints: 0, reviewerComment: "x".repeat(2_001) })],
    ["empty bulk reviews", () => validateBulkReviews([])],
    ["oversized bulk reviews", () => validateBulkReviews(Array(201).fill(validReview))],
    ["invalid UUID", () => assertUuid("not-a-uuid", "submissionId")],
    ["invalid option UUID", () => validateSaveAnswer({ selectedOptionIds: ["not-a-uuid"] })],
    ["long search", () => validateListFilters({ search: "x".repeat(201) })],
    ["filter UUID", () => validateListFilters({ classroomId: "not-a-uuid" })],
  ])("rejects invalid %s", (_name, validate) => {
    expect(validate).toThrow(GradesSubmissionValidationError);
  });

  it("accepts backend maximum boundaries", () => {
    expect(() => validateSaveAnswer({
      answerText: "x".repeat(10_000),
      selectedOptionIds: Array(100).fill(UUID),
    })).not.toThrow();
    expect(() => validateBulkSaveAnswers(Array(200).fill(validAnswer))).not.toThrow();
    expect(() => validateReviewAnswer({
      awardedPoints: 0,
      reviewerComment: "x".repeat(2_000),
      reviewerCommentAr: "س".repeat(2_000),
    })).not.toThrow();
    expect(() => validateBulkReviews(Array(200).fill(validReview))).not.toThrow();
    expect(() => assertUuid(UUID, "submissionId")).not.toThrow();
  });
});
