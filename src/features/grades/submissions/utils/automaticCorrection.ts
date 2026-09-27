import type { BackendSubmissionQuestionResponse } from "../../gradebook/types/api.types";
import type { AssessmentQuestion } from "../../shared/types";
import type { GradeSubmissionAnswer, GradeSubmissionDetail } from "../types";

export type AutomaticCorrectionSkipReason =
  | "manual_question"
  | "already_reviewed"
  | "missing_answer_record"
  | "invalid_answer_key";

export interface AutomaticCorrectionReview {
  answerId: string;
  questionId: string;
  awardedPoints: number;
}
export interface AutomaticCorrectionSummary {
  correctedCount: number;
  manualCount: number;
  preservedCount: number;
  missingAnswerCount: number;
  invalidKeyCount: number;
}

export interface AutomaticCorrectionPlan {
  reviews: AutomaticCorrectionReview[];
  skipped: Array<{ questionId: string; reason: AutomaticCorrectionSkipReason }>;
  summary: AutomaticCorrectionSummary;
}

type CorrectionDecision =
  | { kind: "review"; review: AutomaticCorrectionReview }
  | { kind: "skip"; skipped: { questionId: string; reason: AutomaticCorrectionSkipReason } };

const AUTO_CORRECTABLE_TYPES = new Set<AssessmentQuestion["questionType"]>([
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
]);

export function buildAutomaticCorrectionPlan(
  submission: GradeSubmissionDetail,
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>,
): AutomaticCorrectionPlan {
  const decisions = submission.questions.map((question) =>
    decideQuestionCorrection(question, definitionsByQuestionId[question.id]));

  const reviews = decisions.flatMap((decision) =>
    decision.kind === "review" ? [decision.review] : []);
  const skipped = decisions.flatMap((decision) =>
    decision.kind === "skip" ? [decision.skipped] : []);

  return {
    reviews,
    skipped,
    summary: summarizeCorrectionPlan(reviews.length, skipped),
  };
}

export function hasManualCorrectionWork(plan: AutomaticCorrectionPlan): boolean {
  const { manualCount, missingAnswerCount, invalidKeyCount } = plan.summary;
  return manualCount + missingAnswerCount + invalidKeyCount > 0;
}

function decideQuestionCorrection(
  question: BackendSubmissionQuestionResponse,
  definition: AssessmentQuestion | undefined,
): CorrectionDecision {
  if (!definition) return skipQuestion(question.id, "invalid_answer_key");
  if (!AUTO_CORRECTABLE_TYPES.has(definition.questionType)) {
    return skipQuestion(question.id, "manual_question");
  }
  if (!question.answer) return skipQuestion(question.id, "missing_answer_record");
  if (isReviewed(question.answer)) return skipQuestion(question.id, "already_reviewed");

  const awardedPoints = scoreObjectiveAnswer(question.answer, definition);
  if (awardedPoints === null) return skipQuestion(question.id, "invalid_answer_key");

  return {
    kind: "review",
    review: { answerId: question.answer.id, questionId: question.id, awardedPoints },
  };
}

function scoreObjectiveAnswer(
  submissionAnswer: GradeSubmissionAnswer,
  definition: AssessmentQuestion,
): number | null {
  if (definition.questionType === "TRUE_FALSE") {
    return scoreTrueFalseAnswer(submissionAnswer, definition);
  }
  return scoreChoiceAnswer(submissionAnswer, definition);
}

function scoreChoiceAnswer(
  submissionAnswer: GradeSubmissionAnswer,
  definition: AssessmentQuestion,
): number | null {
  const correctOptionIds = definition.options
    ?.filter((option) => option.isCorrect)
    .map((option) => option.id);
  if (!isValidChoiceKey(definition.questionType, correctOptionIds)) return null;

  const selectedOptionIds = submissionAnswer.selectedOptions.map(({ optionId }) => optionId);
  return sameIdSet(selectedOptionIds, correctOptionIds) ? definition.points : 0;
}

function scoreTrueFalseAnswer(
  submissionAnswer: GradeSubmissionAnswer,
  definition: AssessmentQuestion,
): number | null {
  if (typeof definition.correctAnswer !== "boolean" || !definition.options) return null;
  if (submissionAnswer.selectedOptions.length === 0) return 0;
  if (submissionAnswer.selectedOptions.length !== 1) return 0;

  const selectedOptionId = submissionAnswer.selectedOptions[0].optionId;
  const selectedOption = definition.options.find(({ id }) => id === selectedOptionId);
  if (!selectedOption) return null;

  const selectedBoolean = parseBooleanOptionValue(
    selectedOption.value ?? selectedOption.textEn ?? selectedOption.textAr,
  );
  if (selectedBoolean === null) return null;
  return selectedBoolean === definition.correctAnswer ? definition.points : 0;
}

function isValidChoiceKey(
  questionType: AssessmentQuestion["questionType"],
  correctOptionIds: string[] | undefined,
): correctOptionIds is string[] {
  if (!correctOptionIds) return false;
  if (questionType === "MCQ_SINGLE") return correctOptionIds.length === 1;
  return questionType === "MCQ_MULTI" && correctOptionIds.length > 0;
}

function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const expectedIds = new Set(right);
  return left.every((optionId) => expectedIds.has(optionId));
}

function isReviewed(submissionAnswer: GradeSubmissionAnswer): boolean {
  return submissionAnswer.reviewedAt !== null
    || submissionAnswer.awardedPoints !== null
    || submissionAnswer.correctionStatus.toLowerCase() === "corrected";
}

function parseBooleanOptionValue(optionValue: string | undefined): boolean | null {
  if (optionValue?.toLowerCase() === "true") return true;
  if (optionValue?.toLowerCase() === "false") return false;
  return null;
}

function skipQuestion(
  questionId: string,
  reason: AutomaticCorrectionSkipReason,
): CorrectionDecision {
  return { kind: "skip", skipped: { questionId, reason } };
}

function summarizeCorrectionPlan(
  correctedCount: number,
  skipped: AutomaticCorrectionPlan["skipped"],
): AutomaticCorrectionSummary {
  return {
    correctedCount,
    manualCount: countSkipped(skipped, "manual_question"),
    preservedCount: countSkipped(skipped, "already_reviewed"),
    missingAnswerCount: countSkipped(skipped, "missing_answer_record"),
    invalidKeyCount: countSkipped(skipped, "invalid_answer_key"),
  };
}

function countSkipped(
  skipped: AutomaticCorrectionPlan["skipped"],
  reason: AutomaticCorrectionSkipReason,
): number {
  return skipped.filter((entry) => entry.reason === reason).length;
}
