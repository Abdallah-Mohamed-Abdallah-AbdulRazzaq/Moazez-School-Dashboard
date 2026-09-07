import type { Assessment } from "../types";

export function isEditableAssessmentDraft(
  assessment: Assessment | null,
): boolean {
  return Boolean(
    assessment &&
      assessment.approvalStatus === "draft" &&
      !assessment.isLocked,
  );
}

export function canEditAssessmentQuestions(
  assessment: Assessment | null,
  termStatus: string | undefined,
): boolean {
  return termStatus !== "closed" && isEditableAssessmentDraft(assessment);
}
