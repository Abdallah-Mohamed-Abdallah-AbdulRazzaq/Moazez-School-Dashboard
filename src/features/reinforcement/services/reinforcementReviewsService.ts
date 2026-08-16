import { apiGet, apiPost } from "@/lib/api";
import type {
  ListReinforcementReviewQueueParams,
  ReinforcementReviewItem,
  ReinforcementReviewQueueResponse,
  ReviewReinforcementSubmissionPayload,
  SubmitReinforcementStagePayload,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "./reinforcementApiUtils";

const ASSIGNMENTS_ENDPOINT = "/reinforcement/assignments";
const REVIEW_QUEUE_ENDPOINT = "/reinforcement/review-queue";

export async function submitReinforcementStage(
  assignmentId: string,
  stageId: string,
  payload: SubmitReinforcementStagePayload,
): Promise<ReinforcementReviewItem> {
  const response = await apiPost<unknown>(
    `${ASSIGNMENTS_ENDPOINT}/${assignmentId}/stages/${stageId}/submit`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementReviewItem>(response);
}

export async function listReinforcementReviewQueue(
  params?: ListReinforcementReviewQueueParams,
): Promise<ReinforcementReviewQueueResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${REVIEW_QUEUE_ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ReinforcementReviewItem>(response);
}

export async function getReinforcementReviewItem(
  submissionId: string,
): Promise<ReinforcementReviewItem> {
  const response = await apiGet<unknown>(
    `${REVIEW_QUEUE_ENDPOINT}/${submissionId}`,
  );
  return unwrapReinforcementItemResponse<ReinforcementReviewItem>(response);
}

export async function approveReinforcementSubmission(
  submissionId: string,
  payload: ReviewReinforcementSubmissionPayload,
): Promise<ReinforcementReviewItem> {
  const response = await apiPost<unknown>(
    `${REVIEW_QUEUE_ENDPOINT}/${submissionId}/approve`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementReviewItem>(response);
}

export async function rejectReinforcementSubmission(
  submissionId: string,
  payload: ReviewReinforcementSubmissionPayload,
): Promise<ReinforcementReviewItem> {
  const response = await apiPost<unknown>(
    `${REVIEW_QUEUE_ENDPOINT}/${submissionId}/reject`,
    payload,
  );
  return unwrapReinforcementItemResponse<ReinforcementReviewItem>(response);
}
