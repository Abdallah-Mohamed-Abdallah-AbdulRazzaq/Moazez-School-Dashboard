import type { BackendSubmissionAnswerResponse } from "../../gradebook/types/api.types";
import type { ReviewSubmissionAnswerPayload } from "../types";
import { MAX_REVIEWER_COMMENT_LENGTH } from "./submissionContract";

export interface SubmissionReviewDraft {
  awardedPoints: string;
  reviewerComment: string;
  reviewerCommentAr: string;
}

export interface SubmissionReviewValidation {
  awardedPoints?: "required" | "invalid" | "out_of_range";
  reviewerComment?: "too_long";
  reviewerCommentAr?: "too_long";
}

export function createSubmissionReviewDraft(answer: BackendSubmissionAnswerResponse): SubmissionReviewDraft {
  return {
    awardedPoints: answer.awardedPoints?.toString() ?? "",
    reviewerComment: answer.reviewerComment ?? "",
    reviewerCommentAr: answer.reviewerCommentAr ?? "",
  };
}

export function areSubmissionReviewDraftsEqual(first: SubmissionReviewDraft, second: SubmissionReviewDraft): boolean {
  return first.awardedPoints === second.awardedPoints
    && first.reviewerComment === second.reviewerComment
    && first.reviewerCommentAr === second.reviewerCommentAr;
}

export function validateSubmissionReviewDraft(draft: SubmissionReviewDraft, maxPoints: number): SubmissionReviewValidation {
  const awardedPoints = Number(draft.awardedPoints);
  return {
    ...(draft.awardedPoints === "" ? { awardedPoints: "required" as const } : {}),
    ...(draft.awardedPoints !== "" && !Number.isFinite(awardedPoints) ? { awardedPoints: "invalid" as const } : {}),
    ...(Number.isFinite(awardedPoints) && (awardedPoints < 0 || awardedPoints > maxPoints) ? { awardedPoints: "out_of_range" as const } : {}),
    ...(draft.reviewerComment.length > MAX_REVIEWER_COMMENT_LENGTH ? { reviewerComment: "too_long" as const } : {}),
    ...(draft.reviewerCommentAr.length > MAX_REVIEWER_COMMENT_LENGTH ? { reviewerCommentAr: "too_long" as const } : {}),
  };
}

export function hasSubmissionReviewErrors(validation: SubmissionReviewValidation): boolean {
  return Object.keys(validation).length > 0;
}

export function toSubmissionReviewPayload(draft: SubmissionReviewDraft): ReviewSubmissionAnswerPayload {
  return {
    awardedPoints: Number(draft.awardedPoints),
    reviewerComment: draft.reviewerComment.trim() || null,
    reviewerCommentAr: draft.reviewerCommentAr.trim() || null,
  };
}

export function getDirtyReviewAnswerIds(current: Record<string, SubmissionReviewDraft>, initial: Record<string, SubmissionReviewDraft>): string[] {
  return Object.keys(current).filter((answerId) => initial[answerId] && !areSubmissionReviewDraftsEqual(current[answerId], initial[answerId]));
}

export function buildDirtyReviewPayloads(
  current: Record<string, SubmissionReviewDraft>,
  initial: Record<string, SubmissionReviewDraft>,
  answers: Array<{ id: string; maxPoints: number }>,
): Array<ReviewSubmissionAnswerPayload & { answerId: string }> | null {
  const maxPointsByAnswerId = new Map(answers.map((answer) => [answer.id, answer.maxPoints]));
  const dirtyIds = getDirtyReviewAnswerIds(current, initial);
  if (dirtyIds.some((id) => hasSubmissionReviewErrors(validateSubmissionReviewDraft(current[id], maxPointsByAnswerId.get(id) ?? 0)))) return null;
  return dirtyIds.map((answerId) => ({ answerId, ...toSubmissionReviewPayload(current[answerId]) }));
}
