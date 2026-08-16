import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type {
  HomeworkAssignmentStatus,
  HomeworkBulkAnswerReviewRequest,
  HomeworkSubmissionAnswerUiModel,
  HomeworkSubmissionReviewRequest,
} from "@/features/academics/homework/services/homeworkApi.types";

const MAX_REVIEW_TEXT_LENGTH = 2000;
const MAX_BULK_ANSWER_REVIEWS = 100;

export interface AnswerReviewDraft {
  score?: number | null;
  feedback?: string | null;
  maxScore?: number | null;
}

export interface AnswerReviewErrors {
  score?: "scoreFinite" | "scoreMin" | "scoreMax" | "scoreDecimals";
  feedback?: "feedbackMax";
}

export interface FinalReviewInput {
  assignmentStatus: HomeworkAssignmentStatus;
  submissionStatus: string;
  hasQuestions: boolean;
  isGraded: boolean;
  totalMarks?: number | null;
  awardedMarks?: number | null;
  reviewNote?: string | null;
  hasUnsavedAnswerChanges: boolean;
  requiredReviewsComplete: boolean;
}

export interface FinalReviewErrors {
  submission?: "notReviewable";
  answers?: "unsavedAnswerChanges" | "requiredAnswerReviews";
  awardedMarks?:
    | "awardedMarksFinite"
    | "awardedMarksMin"
    | "awardedMarksDecimals"
    | "awardedMarksMax";
  reviewNote?: "reviewNoteMax";
}

type BulkAnswerReview = HomeworkBulkAnswerReviewRequest["answers"][number];

function normalizedStatus(status: string): string {
  return status.toLowerCase();
}

function hasAtMostTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-8;
}

export function isHomeworkAnswerReviewable(
  assignmentStatus: HomeworkAssignmentStatus,
  submissionStatus: string,
): boolean {
  const assignment = normalizedStatus(assignmentStatus);
  const submission = normalizedStatus(submissionStatus);
  return (
    (assignment === "published" || assignment === "closed") &&
    (submission === "submitted" || submission === "late")
  );
}

export function isHomeworkFinalReviewable(
  assignmentStatus: HomeworkAssignmentStatus,
  submissionStatus: string,
): boolean {
  const assignment = normalizedStatus(assignmentStatus);
  const submission = normalizedStatus(submissionStatus);
  return (
    assignment !== "cancelled" &&
    assignment !== "archived" &&
    (submission === "submitted" || submission === "late")
  );
}

export function validateHomeworkAnswerDraft(
  draft: AnswerReviewDraft,
): AnswerReviewErrors {
  const errors: AnswerReviewErrors = {};
  const score = draft.score;
  if (score != null) {
    if (!Number.isFinite(score)) errors.score = "scoreFinite";
    else if (score < 0) errors.score = "scoreMin";
    else if (!hasAtMostTwoDecimals(score)) errors.score = "scoreDecimals";
    else if (draft.maxScore != null && score > draft.maxScore) {
      errors.score = "scoreMax";
    }
  }
  if ((draft.feedback?.trim().length ?? 0) > MAX_REVIEW_TEXT_LENGTH) {
    errors.feedback = "feedbackMax";
  }
  return errors;
}

export function calculateAnswerScoreRollup(
  answers: HomeworkSubmissionAnswerUiModel[],
): number {
  return answers.reduce(
    (total, answer) =>
      total + (typeof answer.score === "number" && Number.isFinite(answer.score) ? answer.score : 0),
    0,
  );
}

export function calculateProspectiveAnswerScoreRollup(
  answers: HomeworkSubmissionAnswerUiModel[],
  drafts: ReadonlyMap<string, AnswerReviewDraft>,
): number {
  return answers.reduce((total, answer) => {
    const draft = drafts.get(answer.id);
    const score = draft ? draft.score : answer.score;
    return total + (typeof score === "number" && Number.isFinite(score) ? score : 0);
  }, 0);
}

export function validateProspectiveAnswerScoreRollup(
  rollup: number,
  totalMarks?: number | null,
): "rollupMax" | undefined {
  return totalMarks != null && rollup > totalMarks ? "rollupMax" : undefined;
}

export function requiredAnswerReviewsComplete(
  questions: AssignmentQuestion[],
  answers: HomeworkSubmissionAnswerUiModel[],
): boolean {
  const answersByQuestionId = new Map(
    answers.map((submissionAnswer) => [submissionAnswer.questionId, submissionAnswer]),
  );
  return questions
    .filter((assignmentQuestion) => assignmentQuestion.isRequired !== false)
    .every((assignmentQuestion) =>
      Boolean(answersByQuestionId.get(assignmentQuestion.id)?.reviewedAt),
    );
}

function validateAwardedMarks(
  awardedMarks: number | null | undefined,
  totalMarks: number | null | undefined,
): FinalReviewErrors["awardedMarks"] {
  if (awardedMarks == null) return undefined;
  if (!Number.isFinite(awardedMarks)) return "awardedMarksFinite";
  if (awardedMarks < 0) return "awardedMarksMin";
  if (!hasAtMostTwoDecimals(awardedMarks)) return "awardedMarksDecimals";
  if (totalMarks != null && awardedMarks > totalMarks) return "awardedMarksMax";
  return undefined;
}

export function buildHomeworkSubmissionReviewRequest(
  input: FinalReviewInput,
):
  | { request: HomeworkSubmissionReviewRequest }
  | { errors: FinalReviewErrors } {
  if (!isHomeworkFinalReviewable(input.assignmentStatus, input.submissionStatus)) {
    return { errors: { submission: "notReviewable" } };
  }
  if (input.hasQuestions && input.hasUnsavedAnswerChanges) {
    return { errors: { answers: "unsavedAnswerChanges" } };
  }
  if (input.hasQuestions && !input.requiredReviewsComplete) {
    return { errors: { answers: "requiredAnswerReviews" } };
  }

  const note = input.reviewNote?.trim();
  if ((note?.length ?? 0) > MAX_REVIEW_TEXT_LENGTH) {
    return { errors: { reviewNote: "reviewNoteMax" } };
  }

  const request: HomeworkSubmissionReviewRequest = {};
  if (note) request.reviewNote = note;

  if (!input.hasQuestions && input.isGraded) {
    const awardedMarksError = validateAwardedMarks(
      input.awardedMarks,
      input.totalMarks,
    );
    if (awardedMarksError) {
      return { errors: { awardedMarks: awardedMarksError } };
    }
    if (input.awardedMarks != null) request.awardedMarks = input.awardedMarks;
  }

  return { request };
}

export function buildHomeworkBulkAnswerReviewRequest(
  answers: BulkAnswerReview[],
):
  | { request: HomeworkBulkAnswerReviewRequest }
  | { errors: { answers: "bulkAnswerCount" | "bulkAnswerUnique" } } {
  if (answers.length < 1 || answers.length > MAX_BULK_ANSWER_REVIEWS) {
    return { errors: { answers: "bulkAnswerCount" } };
  }
  if (new Set(answers.map(({ answerId }) => answerId)).size !== answers.length) {
    return { errors: { answers: "bulkAnswerUnique" } };
  }
  return { request: { answers } };
}

export function chunkHomeworkAnswerReviews(
  answers: BulkAnswerReview[],
): HomeworkBulkAnswerReviewRequest[] {
  const chunks: HomeworkBulkAnswerReviewRequest[] = [];
  for (let index = 0; index < answers.length; index += MAX_BULK_ANSWER_REVIEWS) {
    chunks.push({ answers: answers.slice(index, index + MAX_BULK_ANSWER_REVIEWS) });
  }
  return chunks;
}
