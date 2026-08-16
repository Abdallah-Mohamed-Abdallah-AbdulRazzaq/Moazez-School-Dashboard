import type {
  BulkSaveSubmissionAnswerPayload,
  ReviewSubmissionAnswerPayload,
  SaveSubmissionAnswerPayload,
  SubmissionListFilters,
} from "../types";

export const MAX_ANSWER_TEXT_LENGTH = 10_000;
export const MAX_SELECTED_OPTIONS = 100;
export const MAX_BULK_ANSWERS = 200;
export const MAX_REVIEWER_COMMENT_LENGTH = 2_000;
export const MAX_BULK_REVIEWS = 200;
export const MAX_SUBMISSION_SEARCH_LENGTH = 200;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class GradesSubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GradesSubmissionValidationError";
  }
}

export function assertUuid(value: string, field: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new GradesSubmissionValidationError(`${field} must be a UUID`);
  }
}

export function validateSaveAnswer(payload: SaveSubmissionAnswerPayload): void {
  assertMaxLength(payload.answerText, MAX_ANSWER_TEXT_LENGTH, "answerText");
  if (payload.answerJson !== undefined && payload.answerJson !== null && (
    typeof payload.answerJson !== "object" || Array.isArray(payload.answerJson)
  )) {
    throw new GradesSubmissionValidationError("answerJson must be an object");
  }
  if (payload.selectedOptionIds && payload.selectedOptionIds.length > MAX_SELECTED_OPTIONS) {
    throw new GradesSubmissionValidationError(`selectedOptionIds cannot exceed ${MAX_SELECTED_OPTIONS} entries`);
  }
  payload.selectedOptionIds?.forEach((optionId) => assertUuid(optionId, "optionId"));
}

export function validateListFilters(filters: SubmissionListFilters): void {
  assertMaxLength(filters.search, MAX_SUBMISSION_SEARCH_LENGTH, "search");
  if (filters.classroomId) assertUuid(filters.classroomId, "classroomId");
  if (filters.sectionId) assertUuid(filters.sectionId, "sectionId");
  if (filters.gradeId) assertUuid(filters.gradeId, "gradeId");
}

export function validateBulkSaveAnswers(answers: BulkSaveSubmissionAnswerPayload[]): void {
  assertCollectionSize(answers, MAX_BULK_ANSWERS, "answers");
  answers.forEach((answer) => {
    assertUuid(answer.questionId, "questionId");
    validateSaveAnswer(answer);
  });
}

export function validateReviewAnswer(payload: ReviewSubmissionAnswerPayload): void {
  if (!Number.isFinite(payload.awardedPoints) || payload.awardedPoints < 0) {
    throw new GradesSubmissionValidationError("awardedPoints must be a finite non-negative number");
  }
  assertMaxLength(payload.reviewerComment, MAX_REVIEWER_COMMENT_LENGTH, "reviewerComment");
  assertMaxLength(payload.reviewerCommentAr, MAX_REVIEWER_COMMENT_LENGTH, "reviewerCommentAr");
}

export function validateBulkReviews(
  reviews: Array<ReviewSubmissionAnswerPayload & { answerId: string }>,
): void {
  assertCollectionSize(reviews, MAX_BULK_REVIEWS, "reviews");
  reviews.forEach((review) => {
    assertUuid(review.answerId, "answerId");
    validateReviewAnswer(review);
  });
}

function assertCollectionSize(items: unknown[], maximum: number, field: string): void {
  if (items.length === 0 || items.length > maximum) {
    throw new GradesSubmissionValidationError(`${field} must contain between 1 and ${maximum} entries`);
  }
}

function assertMaxLength(
  value: string | null | undefined,
  maximum: number,
  field: string,
): void {
  if (value !== undefined && value !== null && value.length > maximum) {
    throw new GradesSubmissionValidationError(`${field} cannot exceed ${maximum} characters`);
  }
}
