import {
  hasManualCorrectionWork,
  type AutomaticCorrectionPlan,
} from "../utils/automaticCorrection";
import {
  finalizeSubmissionReview,
  reviewSubmissionAnswers,
  syncSubmissionGradeItem,
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

  if (hasManualCorrectionWork(plan)) {
    return { finalized: false };
  }

  await finalizeSubmissionReview(submissionId);
  await syncSubmissionGradeItem(submissionId);
  return { finalized: true };
}
