import {
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
} from "../utils/automaticCorrection";
import {
  finalizeSubmissionReview,
  reviewSubmissionAnswers,
  syncSubmissionGradeItem,
} from "./gradesSubmissionsService";
import { MAX_BULK_REVIEWS } from "../utils/submissionContract";

export interface AutomaticCorrectionExecutionResult {
  finalized: boolean;
}

export async function executeAutomaticCorrectionPlan(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
  reviewMode: "review_first" | "finalize" = "finalize",
): Promise<AutomaticCorrectionExecutionResult> {
  for (let index = 0; index < plan.reviews.length; index += MAX_BULK_REVIEWS) {
    await reviewSubmissionAnswers(
      submissionId,
      plan.reviews.slice(index, index + MAX_BULK_REVIEWS).map(({ answerId, awardedPoints }) => ({ answerId, awardedPoints })),
    );
  }

  if (reviewMode === "review_first" || hasManualCorrectionWork(plan)) {
    return { finalized: false };
  }

  await finalizeAutomaticCorrectionReview(submissionId);
  await syncAutomaticCorrectionGrade(submissionId);
  return { finalized: true };
}

export async function syncAutomaticCorrectionGrade(submissionId: string): Promise<void> {
  const sync = await syncSubmissionGradeItem(submissionId);
  if (sync.synced !== true) throw new Error("Grade synchronization was not confirmed");
}

export async function finalizeAutomaticCorrectionReview(submissionId: string): Promise<void> {
  const reviewed = await finalizeSubmissionReview(submissionId);
  if (reviewed.status !== "corrected") throw new Error("Submission finalization was not confirmed");
}
