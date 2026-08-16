import type { SubmissionStatus } from "../types";

const MESSAGE_KEYS = {
  in_progress: "IN_PROGRESS",
  submitted: "SUBMITTED",
  corrected: "CORRECTED",
} as const satisfies Record<SubmissionStatus, string>;

export function submissionStatusMessageKey(status: SubmissionStatus) {
  return MESSAGE_KEYS[status];
}

export function shouldFetchSubmissionQuestionDefinitions(status: SubmissionStatus) {
  return status === "in_progress";
}

export function isChoiceSubmissionQuestion(type: string) {
  return type === "mcq_single" || type === "mcq_multi" || type === "true_false";
}
