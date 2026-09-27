import {
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
} from "../utils/automaticCorrection";
import {
  finalizeSubmissionReview,
  reviewSubmissionAnswers,
} from "./gradesSubmissionsService";

export interface AutomaticCorrectionExecutionResult {
  finalized: boolean;
}

export async function executeAutomaticCorrectionPlan(
  submissionId: string,
  plan: AutomaticCorrectionPlan,
): Promise<AutomaticCorrectionExecutionResult> {
  if (plan.reviews.length > 0) {
    await reviewSubmissionAnswers(
      submissionId,
      plan.reviews.map(({ answerId, awardedPoints }) => ({ answerId, awardedPoints })),
    );
  }

  const finalized = !hasManualCorrectionWork(plan);
  if (finalized) await finalizeSubmissionReview(submissionId);
  return { finalized };
}
