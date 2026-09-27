import type { AssessmentQuestion } from "../../shared/types";
import {
  buildAutomaticCorrectionPlan,
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
  type AutomaticCorrectionSummary,
} from "../utils/automaticCorrection";
import {
  fetchGradeSubmission,
  reviewSubmissionAnswers,
} from "./gradesSubmissionsService";

export interface AutomaticCorrectionStudentResult {
  submissionId: string;
  status: "corrected" | "manual_only" | "skipped" | "failed";
  summary: AutomaticCorrectionSummary | null;
  error: unknown | null;
}

export interface AutomaticCorrectionBatchProgress {
  processed: number;
  total: number;
  currentSubmissionId: string;
}

export interface AutomaticCorrectionBatchResult {
  results: AutomaticCorrectionStudentResult[];
  failedSubmissionIds: string[];
  totals: AutomaticCorrectionSummary & {
    studentsProcessed: number;
    studentsFailed: number;
  };
}

interface AutomaticCorrectionBatchArgs {
  submissionIds: readonly string[];
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>;
  concurrency?: number;
  onProgress?: (progress: AutomaticCorrectionBatchProgress) => void;
}

const EMPTY_SUMMARY: AutomaticCorrectionSummary = {
  correctedCount: 0,
  manualCount: 0,
  missingAnswerCount: 0,
  invalidKeyCount: 0,
};

export async function runAutomaticCorrectionBatch(
  args: AutomaticCorrectionBatchArgs,
): Promise<AutomaticCorrectionBatchResult> {
  const results = new Array<AutomaticCorrectionStudentResult>(args.submissionIds.length);
  const workerCount = Math.min(
    Math.max(args.concurrency ?? 3, 1),
    args.submissionIds.length,
  );
  await runCorrectionWorkers(args, results, workerCount);
  return buildBatchResult(results);
}

async function runCorrectionWorkers(
  args: AutomaticCorrectionBatchArgs,
  results: AutomaticCorrectionStudentResult[],
  workerCount: number,
): Promise<void> {
  let cursor = 0;
  let processed = 0;
  async function runWorker(): Promise<void> {
    while (cursor < args.submissionIds.length) {
      const index = cursor++;
      const submissionId = args.submissionIds[index];
      results[index] = await correctSubmission(submissionId, args.definitionsByQuestionId);
      processed += 1;
      args.onProgress?.({ processed, total: args.submissionIds.length, currentSubmissionId: submissionId });
    }
  }
  await Promise.all(Array.from({ length: workerCount }, runWorker));
}

async function correctSubmission(
  submissionId: string,
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>,
): Promise<AutomaticCorrectionStudentResult> {
  try {
    const submission = await fetchGradeSubmission(submissionId);
    const plan = buildAutomaticCorrectionPlan(submission, definitionsByQuestionId);
    if (plan.reviews.length > 0) {
      await reviewSubmissionAnswers(submissionId, plan.reviews.map(toReviewPayload));
    }
    return successfulStudentResult(submissionId, plan);
  } catch (error) {
    return { submissionId, status: "failed", summary: null, error };
  }
}

function toReviewPayload(review: { answerId: string; awardedPoints: number }) {
  return { answerId: review.answerId, awardedPoints: review.awardedPoints };
}

function successfulStudentResult(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
): AutomaticCorrectionStudentResult {
  const status = plan.reviews.length > 0
    ? "corrected"
    : hasManualCorrectionWork(plan) ? "manual_only" : "skipped";
  return { submissionId, status, summary: plan.summary, error: null };
}

function buildBatchResult(
  results: AutomaticCorrectionStudentResult[],
): AutomaticCorrectionBatchResult {
  const failedSubmissionIds = results
    .filter(({ status }) => status === "failed")
    .map(({ submissionId }) => submissionId);
  return {
    results,
    failedSubmissionIds,
    totals: results.reduce(addStudentResult, {
      ...EMPTY_SUMMARY,
      studentsProcessed: results.length,
      studentsFailed: failedSubmissionIds.length,
    }),
  };
}

function addStudentResult(
  totals: AutomaticCorrectionBatchResult["totals"],
  result: AutomaticCorrectionStudentResult,
): AutomaticCorrectionBatchResult["totals"] {
  if (!result.summary) return totals;
  return {
    ...totals,
    correctedCount: totals.correctedCount + result.summary.correctedCount,
    manualCount: totals.manualCount + result.summary.manualCount,
    missingAnswerCount: totals.missingAnswerCount + result.summary.missingAnswerCount,
    invalidKeyCount: totals.invalidKeyCount + result.summary.invalidKeyCount,
  };
}
