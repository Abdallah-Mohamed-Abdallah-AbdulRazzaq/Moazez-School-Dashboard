import { describe, expect, it } from "vitest";
import type { BackendSubmissionAnswerResponse } from "../../../gradebook/types/api.types";
import { buildDirtyReviewPayloads, createSubmissionReviewDraft, toSubmissionReviewPayload, validateSubmissionReviewDraft } from "../submissionReviewDrafts";

const answer: BackendSubmissionAnswerResponse = {
  id: "answer-1", questionId: "question-1", type: "essay", answerText: "Answer", answerJson: null,
  awardedPoints: 2, maxPoints: 3, correctionStatus: "pending", reviewerComment: "Good", reviewerCommentAr: "جيد",
  selectedOptions: [], reviewedAt: null, createdAt: "", updatedAt: "",
};

describe("submission review drafts", () => {
  it("initializes bilingual drafts and sends only changed valid reviews", () => {
    const initial = { "answer-1": createSubmissionReviewDraft(answer) };
    const current = { "answer-1": { awardedPoints: "2.5", reviewerComment: "Updated", reviewerCommentAr: "محدّث" } };
    expect(buildDirtyReviewPayloads(current, initial, [{ id: "answer-1", maxPoints: 3 }])).toEqual([{ answerId: "answer-1", awardedPoints: 2.5, reviewerComment: "Updated", reviewerCommentAr: "محدّث" }]);
  });

  it("rejects scores outside answer points and comments above 2000 characters", () => {
    expect(validateSubmissionReviewDraft({ awardedPoints: "4", reviewerComment: "", reviewerCommentAr: "" }, 3).awardedPoints).toBe("out_of_range");
    expect(validateSubmissionReviewDraft({ awardedPoints: "3", reviewerComment: "x".repeat(2001), reviewerCommentAr: "" }, 3).reviewerComment).toBe("too_long");
  });

  it.each([["reviewerComment", { awardedPoints: "2", reviewerComment: "x".repeat(2001), reviewerCommentAr: "" }], ["reviewerCommentAr", { awardedPoints: "2", reviewerComment: "", reviewerCommentAr: "س".repeat(2001) }]] as const)("rejects oversized %s", (_field, value) => {
    expect(validateSubmissionReviewDraft(value, 3)).toHaveProperty(_field, "too_long");
  });

  it("excludes unchanged answers and normalizes blank comments to null", () => {
    const initial = { "answer-1": createSubmissionReviewDraft(answer) };
    expect(buildDirtyReviewPayloads(initial, initial, [{ id: "answer-1", maxPoints: 3 }])).toEqual([]);
    expect(toSubmissionReviewPayload({ awardedPoints: "2", reviewerComment: " ", reviewerCommentAr: "" })).toEqual({ awardedPoints: 2, reviewerComment: null, reviewerCommentAr: null });
  });

  it("returns null when any dirty review is invalid", () => {
    const initial = { "answer-1": createSubmissionReviewDraft(answer) };
    expect(buildDirtyReviewPayloads({ "answer-1": { ...initial["answer-1"], awardedPoints: "9" } }, initial, [{ id: "answer-1", maxPoints: 3 }])).toBeNull();
  });
});
