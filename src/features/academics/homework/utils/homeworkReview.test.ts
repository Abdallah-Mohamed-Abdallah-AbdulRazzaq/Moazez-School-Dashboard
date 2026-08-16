import { describe, expect, it } from "vitest";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { HomeworkSubmissionAnswerUiModel } from "../services/homeworkApi.types";
import {
  buildHomeworkBulkAnswerReviewRequest,
  buildHomeworkSubmissionReviewRequest,
  calculateAnswerScoreRollup,
  calculateProspectiveAnswerScoreRollup,
  chunkHomeworkAnswerReviews,
  isHomeworkAnswerReviewable,
  isHomeworkFinalReviewable,
  requiredAnswerReviewsComplete,
  validateHomeworkAnswerDraft,
  validateProspectiveAnswerScoreRollup,
} from "./homeworkReview";

const answer = (
  overrides: Partial<HomeworkSubmissionAnswerUiModel> = {},
): HomeworkSubmissionAnswerUiModel => ({
  id: "answer-1",
  questionId: "question-1",
  prompt: "Prompt",
  answerText: "Answer",
  score: 1,
  maxScore: 2,
  ...overrides,
});

const question = (
  overrides: Partial<AssignmentQuestion> = {},
): AssignmentQuestion => ({
  id: "question-1",
  assignmentId: "homework-1",
  questionTextAr: "Prompt",
  questionTextEn: "Prompt",
  questionType: "SHORT_ANSWER",
  points: 2,
  isRequired: true,
  order: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("homework review workflow", () => {
  it.each(["submitted", "late"])(
    "allows answer and final review for %s submissions in a published assignment",
    (status) => {
      expect(isHomeworkAnswerReviewable("published", status)).toBe(true);
      expect(isHomeworkFinalReviewable("published", status)).toBe(true);
    },
  );

  it("requires published or closed assignments for answer review", () => {
    expect(isHomeworkAnswerReviewable("draft", "submitted")).toBe(false);
    expect(isHomeworkAnswerReviewable("cancelled", "submitted")).toBe(false);
    expect(isHomeworkAnswerReviewable("archived", "late")).toBe(false);
    expect(isHomeworkAnswerReviewable("closed", "late")).toBe(true);
  });

  it.each(["reviewed", "draft", "unknown"])(
    "keeps %s submissions read-only",
    (status) => {
      expect(isHomeworkAnswerReviewable("published", status)).toBe(false);
      expect(isHomeworkFinalReviewable("published", status)).toBe(false);
    },
  );

  it("rejects final review for cancelled and archived assignments", () => {
    expect(isHomeworkFinalReviewable("cancelled", "submitted")).toBe(false);
    expect(isHomeworkFinalReviewable("archived", "late")).toBe(false);
  });

  it("accepts optional and boundary answer scores", () => {
    expect(validateHomeworkAnswerDraft({ score: undefined, maxScore: 2 })).toEqual({});
    expect(validateHomeworkAnswerDraft({ score: null, maxScore: 2 })).toEqual({});
    expect(validateHomeworkAnswerDraft({ score: 0, maxScore: 2 })).toEqual({});
    expect(validateHomeworkAnswerDraft({ score: 2, maxScore: 2 })).toEqual({});
    expect(validateHomeworkAnswerDraft({ score: 1.25, maxScore: 2 })).toEqual({});
  });

  it.each([
    [{ score: Number.NaN, maxScore: 2 }, "scoreFinite"],
    [{ score: Number.POSITIVE_INFINITY, maxScore: 2 }, "scoreFinite"],
    [{ score: -0.01, maxScore: 2 }, "scoreMin"],
    [{ score: 2.01, maxScore: 2 }, "scoreMax"],
    [{ score: 1.001, maxScore: 2 }, "scoreDecimals"],
  ] as const)("rejects an invalid answer score with %s", (draft, key) => {
    expect(validateHomeworkAnswerDraft(draft).score).toBe(key);
  });

  it("trims feedback and enforces its 2000-character limit", () => {
    expect(validateHomeworkAnswerDraft({ feedback: ` ${"x".repeat(2000)} ` })).toEqual({});
    expect(validateHomeworkAnswerDraft({ feedback: "x".repeat(2001) }).feedback).toBe(
      "feedbackMax",
    );
  });

  it("calculates current and prospective score rollups with null as zero", () => {
    const answers = [answer(), answer({ id: "answer-2", score: null })];
    expect(calculateAnswerScoreRollup(answers)).toBe(1);
    expect(
      calculateProspectiveAnswerScoreRollup(
        answers,
        new Map([
          ["answer-1", { score: 1.5 }],
          ["answer-2", { score: 0.5 }],
        ]),
      ),
    ).toBe(2);
    expect(validateProspectiveAnswerScoreRollup(2, 2)).toBeUndefined();
    expect(validateProspectiveAnswerScoreRollup(2.01, 2)).toBe("rollupMax");
    expect(validateProspectiveAnswerScoreRollup(200, null)).toBeUndefined();
  });

  it("uses isRequired and reviewedAt for required completion", () => {
    const questions = [
      question(),
      question({ id: "question-2", isRequired: false }),
    ];
    expect(
      requiredAnswerReviewsComplete(questions, [
        answer({ score: null, reviewedAt: "2026-01-02T00:00:00.000Z" }),
      ]),
    ).toBe(true);
    expect(requiredAnswerReviewsComplete(questions, [answer({ score: 2, reviewedAt: null })])).toBe(
      false,
    );
  });

  it("builds question-based final review without an assignment-level mark", () => {
    expect(
      buildHomeworkSubmissionReviewRequest({
        assignmentStatus: "published",
        submissionStatus: "submitted",
        hasQuestions: true,
        isGraded: true,
        totalMarks: 10,
        awardedMarks: 9,
        reviewNote: "  Good work  ",
        hasUnsavedAnswerChanges: false,
        requiredReviewsComplete: true,
      }),
    ).toEqual({ request: { reviewNote: "Good work" } });
  });

  it("blocks question-based finalization with dirty or incomplete answers", () => {
    const base = {
      assignmentStatus: "published" as const,
      submissionStatus: "late",
      hasQuestions: true,
      isGraded: true,
      totalMarks: 10,
    };
    expect(
      buildHomeworkSubmissionReviewRequest({
        ...base,
        hasUnsavedAnswerChanges: true,
        requiredReviewsComplete: true,
      }),
    ).toEqual({ errors: { answers: "unsavedAnswerChanges" } });
    expect(
      buildHomeworkSubmissionReviewRequest({
        ...base,
        hasUnsavedAnswerChanges: false,
        requiredReviewsComplete: false,
      }),
    ).toEqual({ errors: { answers: "requiredAnswerReviews" } });
  });

  it("validates body-only graded marks and omits marks for ungraded work", () => {
    const base = {
      assignmentStatus: "closed" as const,
      submissionStatus: "submitted",
      hasQuestions: false,
      totalMarks: 10,
      hasUnsavedAnswerChanges: false,
      requiredReviewsComplete: true,
    };
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, isGraded: true }),
    ).toEqual({ request: {} });
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, isGraded: true, awardedMarks: 10 }),
    ).toEqual({ request: { awardedMarks: 10 } });
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, isGraded: true, awardedMarks: 10.001 }),
    ).toEqual({ errors: { awardedMarks: "awardedMarksDecimals" } });
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, isGraded: true, awardedMarks: 10.01 }),
    ).toEqual({ errors: { awardedMarks: "awardedMarksMax" } });
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, isGraded: false, awardedMarks: 7 }),
    ).toEqual({ request: {} });
  });

  it("omits blank notes and rejects oversized notes", () => {
    const base = {
      assignmentStatus: "published" as const,
      submissionStatus: "submitted",
      hasQuestions: false,
      isGraded: false,
      totalMarks: null,
      hasUnsavedAnswerChanges: false,
      requiredReviewsComplete: true,
    };
    expect(buildHomeworkSubmissionReviewRequest({ ...base, reviewNote: "   " })).toEqual({
      request: {},
    });
    expect(
      buildHomeworkSubmissionReviewRequest({ ...base, reviewNote: "x".repeat(2001) }),
    ).toEqual({ errors: { reviewNote: "reviewNoteMax" } });
  });

  it("validates bulk size and uniqueness and chunks larger sets stably", () => {
    expect(buildHomeworkBulkAnswerReviewRequest([])).toEqual({
      errors: { answers: "bulkAnswerCount" },
    });
    expect(
      buildHomeworkBulkAnswerReviewRequest([
        { answerId: "answer-1", score: 1 },
        { answerId: "answer-1", score: 2 },
      ]),
    ).toEqual({ errors: { answers: "bulkAnswerUnique" } });

    const items = Array.from({ length: 201 }, (_, index) => ({
      answerId: `answer-${index}`,
      score: index,
    }));
    const chunks = chunkHomeworkAnswerReviews(items);
    expect(chunks.map((chunk) => chunk.answers.length)).toEqual([100, 100, 1]);
    expect(chunks[1].answers[0].answerId).toBe("answer-100");
    expect(buildHomeworkBulkAnswerReviewRequest(chunks[0].answers)).toEqual({
      request: chunks[0],
    });
  });
});
