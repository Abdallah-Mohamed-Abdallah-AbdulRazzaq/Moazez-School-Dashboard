import type { Assessment } from "../types";

export function canEditAssessmentQuestions(
  assessment: Assessment | null,
  termStatus: string | undefined,
): boolean {
  return Boolean(
    assessment &&
      termStatus !== "closed" &&
      assessment.approvalStatus === "draft" &&
      !assessment.isLocked,
  );
}
