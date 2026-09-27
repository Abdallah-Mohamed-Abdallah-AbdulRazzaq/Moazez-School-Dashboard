import { describe, expect, it } from "vitest";
import type { AssessmentQuestion } from "../../../shared/types";
import type { GradeSubmissionAnswer, GradeSubmissionDetail } from "../../types";
import {
  buildAutomaticCorrectionPlan,
  getObjectiveAnswerCorrectness,
  hasManualCorrectionWork,
} from "../automaticCorrection";

const questionId = "question-1";
const answerId = "answer-1";

function definition(
  questionType: AssessmentQuestion["questionType"],
  overrides: Partial<AssessmentQuestion> = {},
): AssessmentQuestion {
  return {
    id: questionId,
    assessmentId: "assessment-1",
    assignmentId: "",
    questionTextAr: "سؤال",
    questionTextEn: "Question",
    questionType,
    points: 4,
    order: 1,
    createdAt: "",
    ...overrides,
  };
}

function answer(
  selectedOptionIds: string[] = [],
  overrides: Partial<GradeSubmissionAnswer> = {},
): GradeSubmissionAnswer {
  return {
    id: answerId,
    questionId,
    type: "mcq_single",
    answerText: null,
    answerJson: null,
    awardedPoints: null,
    maxPoints: 4,
    correctionStatus: "pending",
    reviewerComment: null,
    reviewerCommentAr: null,
    reviewedAt: null,
    selectedOptions: selectedOptionIds.map((optionId) => ({
      optionId,
      label: optionId,
      labelAr: null,
      value: null,
    })),
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function submission(
  questionType: string,
  submissionAnswer: GradeSubmissionAnswer | null,
): GradeSubmissionDetail {
  return {
    id: "submission-1",
    termId: "term-1",
    assessmentId: "assessment-1",
    studentId: "student-1",
    enrollmentId: "enrollment-1",
    status: "submitted",
    startedAt: "",
    submittedAt: "",
    correctedAt: null,
    totalScore: null,
    maxScore: 4,
    assessment: null,
    student: null,
    enrollment: null,
    progress: {
      totalQuestions: 1,
      answeredCount: submissionAnswer ? 1 : 0,
      requiredAnsweredCount: submissionAnswer ? 1 : 0,
      requiredQuestionCount: 1,
      pendingCorrectionCount: 1,
    },
    answers: submissionAnswer ? [submissionAnswer] : [],
    questions: [{
      id: questionId,
      type: questionType,
      prompt: "Question",
      promptAr: "سؤال",
      points: 4,
      sortOrder: 1,
      required: true,
      answer: submissionAnswer,
    }],
  };
}

function choiceDefinition(
  questionType: "MCQ_SINGLE" | "MCQ_MULTI",
): AssessmentQuestion {
  return definition(questionType, {
    options: [
      { id: "a", textAr: "أ", textEn: "A", isCorrect: true, order: 1 },
      { id: "b", textAr: "ب", textEn: "B", isCorrect: questionType === "MCQ_MULTI", order: 2 },
      { id: "wrong", textAr: "خطأ", textEn: "Wrong", isCorrect: false, order: 3 },
    ],
  });
}

describe("buildAutomaticCorrectionPlan", () => {
  it.each([
    ["MCQ_SINGLE", ["a"], 4],
    ["MCQ_SINGLE", ["wrong"], 0],
    ["MCQ_MULTI", ["b", "a"], 4],
    ["MCQ_MULTI", ["a"], 0],
    ["MCQ_MULTI", ["a", "b", "wrong"], 0],
  ] as const)(
    "scores %s selections with full-or-zero points",
    (questionType, selectedOptionIds, expectedPoints) => {
      const correctionPlan = buildAutomaticCorrectionPlan(
        submission(questionType.toLowerCase(), answer([...selectedOptionIds])),
        { [questionId]: choiceDefinition(questionType) },
      );

      expect(correctionPlan.reviews).toEqual([{
        answerId,
        questionId,
        awardedPoints: expectedPoints,
      }]);
    },
  );

  it.each([
    ["true", true, 4],
    ["false", true, 0],
    ["false", false, 4],
  ] as const)(
    "scores true-false option %s against answer key %s",
    (selectedValue, correctAnswer, expectedPoints) => {
      const trueFalseDefinition = definition("TRUE_FALSE", {
        correctAnswer,
        options: [
          { id: "true-option", textAr: "صح", textEn: "True", value: "true", isCorrect: correctAnswer, order: 1 },
          { id: "false-option", textAr: "خطأ", textEn: "False", value: "false", isCorrect: !correctAnswer, order: 2 },
        ],
      });
      const selectedOptionId = selectedValue === "true" ? "true-option" : "false-option";

      const correctionPlan = buildAutomaticCorrectionPlan(
        submission("true_false", answer([selectedOptionId])),
        { [questionId]: trueFalseDefinition },
      );

      expect(correctionPlan.reviews[0]?.awardedPoints).toBe(expectedPoints);
    },
  );

  it("awards zero when an objective answer record is blank", () => {
    const correctionPlan = buildAutomaticCorrectionPlan(
      submission("mcq_single", answer()),
      { [questionId]: choiceDefinition("MCQ_SINGLE") },
    );

    expect(correctionPlan.reviews[0]?.awardedPoints).toBe(0);
  });

  it.each(["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK", "MATCHING", "MEDIA"] as const)(
    "leaves %s for manual correction",
    (questionType) => {
      const correctionPlan = buildAutomaticCorrectionPlan(
        submission(questionType.toLowerCase(), answer()),
        { [questionId]: definition(questionType) },
      );

      expect(correctionPlan.reviews).toEqual([]);
      expect(correctionPlan.summary.manualCount).toBe(1);
      expect(hasManualCorrectionWork(correctionPlan)).toBe(true);
    },
  );

  it("recalculates an objective answer that already has awarded points", () => {
    const correctionPlan = buildAutomaticCorrectionPlan(
      submission("mcq_single", answer(["a"], { awardedPoints: 2 })),
      { [questionId]: choiceDefinition("MCQ_SINGLE") },
    );

    expect(correctionPlan.reviews).toEqual([{
      answerId,
      questionId,
      awardedPoints: 4,
    }]);
    expect(hasManualCorrectionWork(correctionPlan)).toBe(false);
  });

  it("keeps an objective question without an answer record pending", () => {
    const correctionPlan = buildAutomaticCorrectionPlan(
      submission("mcq_single", null),
      { [questionId]: choiceDefinition("MCQ_SINGLE") },
    );

    expect(correctionPlan.summary.missingAnswerCount).toBe(1);
    expect(hasManualCorrectionWork(correctionPlan)).toBe(true);
  });

  it("does not grade a malformed answer key", () => {
    const malformedDefinition = definition("MCQ_SINGLE", {
      options: [
        { id: "a", textAr: "أ", textEn: "A", isCorrect: true, order: 1 },
        { id: "b", textAr: "ب", textEn: "B", isCorrect: true, order: 2 },
      ],
    });

    const correctionPlan = buildAutomaticCorrectionPlan(
      submission("mcq_single", answer(["a"])),
      { [questionId]: malformedDefinition },
    );

    expect(correctionPlan.reviews).toEqual([]);
    expect(correctionPlan.summary.invalidKeyCount).toBe(1);
  });
});

describe("getObjectiveAnswerCorrectness", () => {
  it.each([
    ["MCQ_SINGLE", ["a"], true],
    ["MCQ_SINGLE", ["wrong"], false],
    ["MCQ_MULTI", ["a", "b"], true],
    ["MCQ_MULTI", ["a"], false],
  ] as const)(
    "reports whether a submitted %s selection is correct",
    (questionType, selectedOptionIds, expectedCorrectness) => {
      expect(getObjectiveAnswerCorrectness(
        answer([...selectedOptionIds]),
        choiceDefinition(questionType),
      )).toBe(expectedCorrectness);
    },
  );

  it.each([
    [null, choiceDefinition("MCQ_SINGLE")],
    [answer(["a"]), definition("ESSAY")],
    [answer(["a"]), definition("MCQ_SINGLE", { options: [] })],
  ] as const)("does not report correctness without a gradeable objective answer", (
    submissionAnswer,
    questionDefinition,
  ) => {
    expect(getObjectiveAnswerCorrectness(submissionAnswer, questionDefinition)).toBeNull();
  });
});
