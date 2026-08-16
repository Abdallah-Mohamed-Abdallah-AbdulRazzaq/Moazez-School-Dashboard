const HOMEWORK_ERROR_KEYS: Record<string, string> = {
  "homework.assignment.not_found": "notFound",
  "homework.assignment.not_mutable": "notMutable",
  "homework.assignment.not_publishable": "notPublishable",
  "homework.assignment.already_published": "alreadyPublished",
  "homework.assignment.already_closed": "alreadyClosed",
  "homework.assignment.cancelled": "cancelled",
  "homework.assignment.schedule_mismatch": "scheduleMismatch",
  "homework.assignment.allocation_mismatch": "allocationMismatch",
  "homework.assignment.due_date_invalid": "dueDateInvalid",
  "homework.assignment.target_required": "targetRequired",
  "homework.assignment.no_eligible_targets": "noEligibleTargets",
  "homework.assignment.target_conflict": "targetConflict",
  "homework.assignment.validation_failed": "validationFailed",
  "homework.assignment.invalid_question_structure": "invalidQuestionStructure",
  "homework.question.invalid_type_payload": "questionInvalidTypePayload",
  "homework.question.invalid_options": "questionInvalidOptions",
  "homework.question.invalid_reorder": "questionInvalidReorder",
  "homework.question.read_only": "questionReadOnly",
  "homework.question.not_found": "questionNotFound",
  "homework.question.option_not_found": "questionOptionNotFound",
  "homework.attachment.not_found": "attachmentNotFound",
  "homework.attachment.file_not_found": "attachmentFileNotFound",
  "homework.attachment.read_only": "attachmentReadOnly",
  "homework.attachment.invalid_reorder": "attachmentInvalidReorder",
  "homework.submission.target_not_found": "submissionTargetNotFound",
  "homework.submission.not_found": "submissionNotFound",
  "homework.submission.not_submittable": "submissionNotSubmittable",
  "homework.submission.already_submitted": "submissionAlreadySubmitted",
  "homework.submission.not_reviewable": "submissionNotReviewable",
  "homework.submission.already_reviewed": "submissionAlreadyReviewed",
  "homework.submission.review_invalid": "submissionReviewInvalid",
  "homework.answer.not_found": "answerNotFound",
  "homework.answer.invalid_payload": "answerInvalidPayload",
  "homework.answer.invalid_option": "answerInvalidOption",
  "homework.answer.missing_required": "answerMissingRequired",
  "homework.answer.read_only": "answerReadOnly",
  "homework.answer.invalid_submission_scope": "answerInvalidSubmissionScope",
  "homework.answer_review.not_found": "answerReviewNotFound",
  "homework.answer_review.invalid_scope": "answerReviewInvalidScope",
  "homework.answer_review.not_submitted": "answerReviewNotSubmitted",
  "homework.answer_review.invalid_points": "answerReviewInvalidPoints",
  "homework.answer_review.exceeds_question_points": "answerReviewExceedsQuestionPoints",
  "homework.answer_review.exceeds_assignment_marks": "answerReviewExceedsAssignmentMarks",
  "homework.answer_review.read_only": "answerReviewReadOnly",
  "homework.answer_review.incomplete_required_answers": "answerReviewIncompleteRequiredAnswers",
  "homework.submission_attachment.not_found": "submissionAttachmentNotFound",
  "homework.submission_attachment.file_not_found": "submissionAttachmentFileNotFound",
  "homework.submission_attachment.read_only": "submissionAttachmentReadOnly",
  "homework.submission_attachment.invalid_reorder": "submissionAttachmentInvalidReorder",
  "homework.grade_sync.not_linked": "gradeSyncNotLinked",
  "homework.grade_sync.invalid_assessment": "gradeSyncInvalidAssessment",
  "homework.grade_sync.incompatible_scope": "gradeSyncIncompatibleScope",
  "homework.grade_sync.assessment_locked": "gradeSyncAssessmentLocked",
  "homework.grade_sync.submission_not_reviewed": "gradeSyncSubmissionNotReviewed",
  "homework.grade_sync.missing_score": "gradeSyncMissingScore",
  "homework.grade_sync.score_exceeds_homework_marks": "gradeSyncScoreExceedsHomeworkMarks",
  "homework.grade_sync.score_exceeds_assessment_marks": "gradeSyncScoreExceedsAssessmentMarks",
  "homework.grade_sync.duplicate_link": "gradeSyncDuplicateLink",
  "homework.grade_sync.unlink_not_allowed": "gradeSyncUnlinkNotAllowed",
  "homework.grade_sync.failed": "gradeSyncFailed",
  "grades.assessment.not_published": "gradeSyncAssessmentNotPublished",
  "validation.failed": "validationFailed",
};

interface MaybeApiError {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
      };
    };
  };
}

type HomeworkErrorTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function homeworkErrorEnvelope(error: unknown) {
  const maybeError = error as MaybeApiError;
  const apiError = maybeError.response?.data?.error;
  return {
    code: apiError?.code ?? maybeError.code,
    details: apiError?.details ?? maybeError.details,
  };
}

function detailedMessageKey(
  key: string,
  details?: Record<string, unknown>,
): string {
  if (key !== "invalidQuestionStructure") return key;

  switch (String(details?.type || "").toUpperCase()) {
    case "TRUE_FALSE":
      return "invalidQuestionStructureTrueFalse";
    case "SINGLE_CHOICE":
      return "invalidQuestionStructureSingleChoice";
    case "MULTIPLE_CHOICE":
      return "invalidQuestionStructureMultipleChoice";
    default:
      return key;
  }
}

export function mapHomeworkApiError(error: unknown): string {
  const { code } = homeworkErrorEnvelope(error);
  if (code && HOMEWORK_ERROR_KEYS[code]) {
    return HOMEWORK_ERROR_KEYS[code];
  }
  return "generic";
}

export function getHomeworkErrorMessage(
  error: unknown,
  t: HomeworkErrorTranslator,
): string {
  const envelope = homeworkErrorEnvelope(error);
  const key = mapHomeworkApiError(error);
  return t(detailedMessageKey(key, envelope.details));
}
