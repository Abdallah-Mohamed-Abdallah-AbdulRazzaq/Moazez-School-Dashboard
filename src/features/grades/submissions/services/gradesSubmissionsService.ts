import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type {
  BackendSubmissionAnswerResponse,
  BackendSubmissionDetailResponse,
  BackendSubmissionGradeItemSyncResponse,
  BackendSubmissionsListResponse,
} from "../../gradebook/types/api.types";
import type {
  BulkSaveSubmissionAnswerPayload,
  ReviewSubmissionAnswerPayload,
  SaveSubmissionAnswerPayload,
  SubmissionListFilters,
} from "../types";
import {
  assertUuid,
  validateBulkReviews,
  validateBulkSaveAnswers,
  validateListFilters,
  validateReviewAnswer,
  validateSaveAnswer,
} from "../utils/submissionContract";

export async function listAssessmentSubmissions(
  assessmentId: string,
  filters: SubmissionListFilters = {},
): Promise<BackendSubmissionsListResponse> {
  assertUuid(assessmentId, "assessmentId");
  validateListFilters(filters);
  return apiGet(`/grades/assessments/${assessmentId}/submissions`, { params: filters });
}

export async function fetchGradeSubmission(
  submissionId: string,
): Promise<BackendSubmissionDetailResponse> {
  assertUuid(submissionId, "submissionId");
  return apiGet(`/grades/submissions/${submissionId}`);
}

export async function saveSubmissionAnswer(
  submissionId: string,
  questionId: string,
  payload: SaveSubmissionAnswerPayload,
): Promise<BackendSubmissionAnswerResponse> {
  assertUuid(submissionId, "submissionId");
  assertUuid(questionId, "questionId");
  validateSaveAnswer(payload);
  return apiPut(`/grades/submissions/${submissionId}/answers/${questionId}`, payload);
}

export async function saveSubmissionAnswers(
  submissionId: string,
  answers: BulkSaveSubmissionAnswerPayload[],
): Promise<{ submissionId: string; savedCount: number; answers: BackendSubmissionAnswerResponse[] }> {
  assertUuid(submissionId, "submissionId");
  validateBulkSaveAnswers(answers);
  return apiPut(`/grades/submissions/${submissionId}/answers`, { answers });
}

export async function submitGradeSubmission(
  submissionId: string,
): Promise<BackendSubmissionDetailResponse> {
  assertUuid(submissionId, "submissionId");
  return apiPost(`/grades/submissions/${submissionId}/submit`);
}

export async function reviewSubmissionAnswer(
  submissionId: string,
  answerId: string,
  payload: ReviewSubmissionAnswerPayload,
): Promise<BackendSubmissionAnswerResponse> {
  assertUuid(submissionId, "submissionId");
  assertUuid(answerId, "answerId");
  validateReviewAnswer(payload);
  return apiPatch(`/grades/submissions/${submissionId}/answers/${answerId}/review`, payload);
}

export async function reviewSubmissionAnswers(
  submissionId: string,
  reviews: Array<ReviewSubmissionAnswerPayload & { answerId: string }>,
): Promise<{ submissionId: string; reviewedCount: number; answers: BackendSubmissionAnswerResponse[] }> {
  assertUuid(submissionId, "submissionId");
  validateBulkReviews(reviews);
  return apiPut(`/grades/submissions/${submissionId}/answers/review`, { reviews });
}

export async function finalizeSubmissionReview(
  submissionId: string,
): Promise<BackendSubmissionDetailResponse> {
  assertUuid(submissionId, "submissionId");
  return apiPost(`/grades/submissions/${submissionId}/review/finalize`);
}

export async function syncSubmissionGradeItem(
  submissionId: string,
): Promise<BackendSubmissionGradeItemSyncResponse> {
  assertUuid(submissionId, "submissionId");
  return apiPost(`/grades/submissions/${submissionId}/sync-grade-item`);
}
