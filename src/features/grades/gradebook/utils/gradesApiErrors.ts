import { isApiError } from "@/lib/api-error";

const BACKEND_CODE_TO_KEY: Record<string, string> = {
  "grades.term.closed": "term_closed",
  "grades.assessment.locked": "assessment_locked",
  "grades.assessment.not_published": "assessment_not_published",
  "grades.assessment.not_approved": "assessment_not_approved",
  "grades.assessment.invalid_status_transition": "invalid_status_transition",
  "grades.assessment.already_published": "assessment_already_published",
  "grades.assessment.already_approved": "assessment_already_approved",
  "grades.assessment.already_locked": "assessment_already_locked",
  "grades.assessment.invalid_scope": "invalid_scope",
  "grades.gradebook.no_enrollment": "gradebook_no_enrollment",
  "grades.item.out_of_range": "score_out_of_range",
  "grades.question.structure_locked": "question_structure_locked",
  "grades.question.points_mismatch": "question_points_mismatch",
  "grades.answer.invalid_question": "invalid_question",
  "grades.answer.invalid_option": "invalid_option",
  "grades.submission.already_submitted": "submission_already_submitted",
  "grades.submission.locked": "submission_locked",
  "grades.submission.not_submitted": "submission_not_submitted",
  "grades.review.already_finalized": "review_already_finalized",
  "grades.review.pending_answers": "review_pending_answers",
  "grades.rule.conflict": "rule_conflict",
};

const VALIDATION_MESSAGE_TO_KEY: Record<string, string> = {
  "Academic year is required": "academic_year_required",
  "All required questions must be answered before submission": "required_answers_missing",
  "Assessment approval status is invalid": "assessment_approval_status_invalid",
  "Assessment context parent ids do not match the selected scope": "assessment_scope_parents_mismatch",
  "Assessment date is invalid": "assessment_date_invalid",
  "Assessment date must be inside the term": "assessment_date_outside_term",
  "Assessment delivery mode is invalid": "assessment_delivery_mode_invalid",
  "Assessment max score must be greater than 0": "assessment_max_score_positive",
  "Assessment must be question-based for GradeItem sync": "question_based_required_for_sync",
  "Assessment must be question-based for question management": "question_based_required_for_questions",
  "Assessment must be question-based for question publish validation": "question_based_required_for_publish",
  "Assessment must be question-based for review": "question_based_required_for_review",
  "Assessment must be question-based for submissions": "question_based_required_for_submissions",
  "Assessment type is invalid": "assessment_type_invalid",
  "Assessment weight budget cannot exceed 100 for this subject and scope": "assessment_weight_budget_exceeded",
  "Assessment weight must be greater than 0 and at most 100": "assessment_weight_invalid",
  "Awarded points must be between 0 and the answer max points": "awarded_points_out_of_range",
  "Bulk points payload is required": "bulk_points_required",
  "Corrected submission must have totalScore and maxScore before GradeItem sync": "corrected_score_required_for_sync",
  "Duplicate answer ids are not allowed in bulk review": "duplicate_review_answers",
  "Duplicate question ids are not allowed": "duplicate_question_ids",
  "Duplicate question ids are not allowed in bulk answer save": "duplicate_bulk_answer_questions",
  "Duplicate selected option ids are not allowed": "duplicate_selected_options",
  "Duplicate sort orders are not allowed": "duplicate_sort_orders",
  "Duplicate student ids are not allowed in bulk grade entry": "duplicate_bulk_students",
  "Entered grade items require a score": "entered_score_required",
  "Grade item status is invalid": "grade_item_status_invalid",
  "Grade read-model parent ids do not match the selected scope": "gradebook_scope_parents_mismatch",
  "Grade rounding mode is invalid": "rounding_mode_invalid",
  "Grade rule context parent ids do not match the selected scope": "rule_scope_parents_mismatch",
  "Grading scale is invalid": "grading_scale_invalid",
  "Invalid assessment date range": "assessment_date_range_invalid",
  "MATCHING questions require metadata when options are not provided": "matching_metadata_required",
  "MATCHING questions require options or metadata before publishing": "matching_structure_required",
  "MCQ_MULTI answers require at least one selected option": "multiple_choice_selection_required",
  "Pass mark must be between 0 and 100": "pass_mark_out_of_range",
  "Question payload is incomplete": "question_payload_incomplete",
  "Question points are required": "question_points_required",
  "Question points must be greater than 0": "question_points_positive",
  "Question points must be greater than 0 before publishing": "publish_question_points_positive",
  "Question prompt is required": "question_prompt_required",
  "Question sort order is already in use": "question_sort_order_conflict",
  "Question type is invalid": "question_type_invalid",
  "Question type is required": "question_type_required",
  "Question-based assessments are deferred for Sprint 4B": "question_based_deferred",
  "Question-based assessments require at least one active question before publishing": "active_question_required",
  "Reorder request must include exactly all active question ids": "reorder_question_set_invalid",
  "Scope id aliases do not match": "scope_aliases_mismatch",
  "Sort order must be a positive integer": "sort_order_positive",
  "Student id is required": "student_required",
  "Submission status is invalid": "submission_status_invalid",
  "Term is required": "term_required",
};

const STATUS_TO_KEY: Record<number, string> = {
  400: "validation_failed",
  401: "unauthorized",
  403: "permission_denied",
  404: "not_found",
  409: "conflict",
  422: "validation_failed",
  429: "rate_limited",
};

interface GradesErrorDetails {
  field?: string;
  reason?: string;
  fields?: string[];
}

export interface GradesApiErrorDescriptor {
  key: string;
  field?: string;
  reason?: string;
  traceId?: string;
  severity: "validation" | "permission" | "conflict" | "error";
}

function validationKey(message: string): string {
  const exactKey = VALIDATION_MESSAGE_TO_KEY[message];
  if (exactKey) return exactKey;
  if (/ answer is required$/i.test(message)) return "answer_required";
  if (/require exactly one selected option$/i.test(message)) return "single_choice_selection_required";
  if (/requires at least \d+ options$/i.test(message)) return "minimum_question_options_required";
  if (/do not accept options$/i.test(message)) return "question_options_not_allowed";
  if (/must be a UUID/i.test(message)) return "invalid_identifier";
  if (/must be a valid ISO 8601 date string/i.test(message)) return "invalid_date";
  if (/must be one of the following values/i.test(message)) return "invalid_choice";
  if (/must be a number|must be an integer number/i.test(message)) return "invalid_number";
  if (/must not be greater than|must be shorter than or equal to/i.test(message)) return "value_too_large";
  if (/must not be less than/i.test(message)) return "value_too_small";
  if (/must be an array/i.test(message)) return "invalid_list";
  if (/should not be empty/i.test(message)) return "field_required";
  if (/ is required$/i.test(message)) return "field_required";
  return "validation_failed";
}

function errorSeverity(status: number): GradesApiErrorDescriptor["severity"] {
  if (status === 400 || status === 422) return "validation";
  if (status === 401 || status === 403) return "permission";
  if (status === 409) return "conflict";
  return "error";
}

export function describeGradesApiError(error: unknown): GradesApiErrorDescriptor {
  if (!isApiError(error)) return { key: "generic", severity: "error" };

  const details = error.details && typeof error.details === "object"
    ? error.details as GradesErrorDetails
    : undefined;
  const key = BACKEND_CODE_TO_KEY[error.code]
    ?? (error.code === "validation.failed" ? validationKey(error.message) : undefined)
    ?? STATUS_TO_KEY[error.status]
    ?? "generic";

  const firstDtoMessage = details?.fields?.[0];
  const dtoField = firstDtoMessage?.match(/^([A-Za-z][A-Za-z0-9]*)\s/)?.[1];

  return {
    key,
    field: details?.field ?? dtoField,
    reason: details?.reason,
    traceId: error.traceId,
    severity: errorSeverity(error.status),
  };
}

export function mapGradesApiError(error: unknown): string {
  return describeGradesApiError(error).key;
}
