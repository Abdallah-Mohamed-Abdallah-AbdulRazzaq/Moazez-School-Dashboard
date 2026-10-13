import type { AssessmentQuestion } from "../../shared/types";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";
import type { GradeSubmissionDetail } from "../types";
import {
  buildAutomaticCorrectionPlan,
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
  type AutomaticCorrectionSummary,
} from "../utils/automaticCorrection";
import { executeAutomaticCorrectionPlan, finalizeAutomaticCorrectionReview, syncAutomaticCorrectionGrade } from "./automaticCorrectionExecution";
import {
  fetchGradeSubmission,
} from "./gradesSubmissionsService";

export interface AutomaticCorrectionStudentResult {
  submissionId: string;
  status: "corrected" | "review_pending" | "manual_only" | "skipped" | "failed";
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
    studentsFinalized: number;
  };
}

interface AutomaticCorrectionBatchArgs {
  submissionIds: readonly string[];
  definitionsByQuestionId: Readonly<Record<string, AssessmentQuestion>>;
  concurrency?: number;
  onProgress?: (progress: AutomaticCorrectionBatchProgress) => void;
  scoringPolicy?: MultipleSelectionScoringPolicy;
  reviewMode?: "review_first" | "finalize";
  finalizeSubmissionIds?: readonly string[];
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
      results[index] = await correctSubmission(submissionId, args);
      processed += 1;
      args.onProgress?.({ processed, total: args.submissionIds.length, currentSubmissionId: submissionId });
    }
  }
  await Promise.all(Array.from({ length: workerCount }, runWorker));
}

async function correctSubmission(
  submissionId: string,
  args: AutomaticCorrectionBatchArgs,
): Promise<AutomaticCorrectionStudentResult> {
  try {
    const submission = await fetchGradeSubmission(submissionId);
    const plan = buildAutomaticCorrectionPlan(submission, args.definitionsByQuestionId, args.scoringPolicy);
    const finalizeSaved = args.finalizeSubmissionIds?.includes(submissionId) ?? false;
    if (submission.status === "corrected") {
      return await synchronizeCorrectedSubmission(submissionId, plan, args);
    }
    if (submission.status !== "submitted") return { submissionId, status: "skipped", summary: null, error: null };
    if (finalizeSaved) {
      return await finalizeSavedSubmission(submission, plan);
    }
    return await saveCorrectionScores(submissionId, plan, args.reviewMode);
  } catch (error) {
    return { submissionId, status: "failed", summary: null, error };
  }
}

async function synchronizeCorrectedSubmission(submissionId: string, plan: AutomaticCorrectionPlan, args: AutomaticCorrectionBatchArgs): Promise<AutomaticCorrectionStudentResult> {
  if (args.reviewMode === "review_first" && !args.finalizeSubmissionIds?.includes(submissionId)) {
    return { submissionId, status: "skipped", summary: null, error: null };
  }
  await syncAutomaticCorrectionGrade(submissionId);
  return successfulStudentResult(submissionId, plan, true);
}

async function finalizeSavedSubmission(submission: GradeSubmissionDetail, plan: AutomaticCorrectionPlan): Promise<AutomaticCorrectionStudentResult> {
  if (!savedReviewReady(submission, plan)) return { submissionId: submission.id, status: "manual_only", summary: plan.summary, error: null };
  await finalizeAutomaticCorrectionReview(submission.id);
  await syncAutomaticCorrectionGrade(submission.id);
  return successfulStudentResult(submission.id, plan, true);
}

async function saveCorrectionScores(submissionId: string, plan: AutomaticCorrectionPlan, reviewMode: AutomaticCorrectionBatchArgs["reviewMode"]): Promise<AutomaticCorrectionStudentResult> {
  const execution = await executeAutomaticCorrectionPlan(submissionId, plan, reviewMode);
  if (reviewMode !== "review_first") return successfulStudentResult(submissionId, plan, execution.finalized);
  const refreshed = await fetchGradeSubmission(submissionId);
  return { submissionId, status: savedReviewReady(refreshed, plan) ? "review_pending" : "manual_only", summary: plan.summary, error: null };
}

function savedReviewReady(submission: GradeSubmissionDetail, plan: AutomaticCorrectionPlan): boolean {
  if (!plan.reviews.length || submission.status !== "submitted" || submission.progress.pendingCorrectionCount !== 0 || hasManualCorrectionWork(plan)) return false;
  return plan.reviews.every(review => submission.questions.some(question => question.id === review.questionId
    && question.answer?.id === review.answerId && question.answer.correctionStatus === "corrected"
    && question.answer.awardedPoints === review.awardedPoints));
}

export function mergeAutomaticCorrectionResults(previous: AutomaticCorrectionBatchResult | null, next: AutomaticCorrectionBatchResult): AutomaticCorrectionBatchResult {
  if (!previous) return next;
  const updated = new Map(next.results.map(result => [result.submissionId, result]));
  return buildBatchResult(previous.results.map(result => {
    const replacement = updated.get(result.submissionId);
    return replacement ? { ...replacement, summary: replacement.summary ?? result.summary } : result;
  }));
}

function successfulStudentResult(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
  finalized: boolean,
): AutomaticCorrectionStudentResult {
  const status = finalized
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
      studentsFinalized: results.filter(({ status }) => status === "corrected").length,
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
