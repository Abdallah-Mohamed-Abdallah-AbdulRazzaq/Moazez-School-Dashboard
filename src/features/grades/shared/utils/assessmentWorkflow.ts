import type { Assessment } from "../types";

export type AssessmentWorkflowState = "draft" | "published" | "approved" | "locked";
export type AssessmentEntryModeKey = "scoreOnly" | "questionBased";

export const ASSESSMENT_WORKFLOW_STATE_STYLES: Record<
  AssessmentWorkflowState,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  draft: {
    backgroundColor: "var(--color-neutral-100)",
    color: "var(--text-secondary)",
    borderColor: "var(--border-color)",
  },
  published: {
    backgroundColor: "var(--color-primary-50)",
    color: "var(--primary-color)",
    borderColor: "var(--color-primary-100)",
  },
  approved: {
    backgroundColor: "var(--success-bg)",
    color: "var(--success-text)",
    borderColor: "var(--success-bg)",
  },
  locked: {
    backgroundColor: "var(--warning-bg)",
    color: "var(--warning-text)",
    borderColor: "var(--warning-bg)",
  },
};

export function getAssessmentWorkflowState(assessment: Assessment): AssessmentWorkflowState {
  if (assessment.isLocked) return "locked";
  return assessment.approvalStatus;
}

export function isAssessmentMetadataEditable(
  assessment: Pick<Assessment, "isLocked">,
): boolean {
  return !assessment.isLocked;
}

function isAssessmentReleased(
  assessment: Pick<Assessment, "approvalStatus" | "isLocked">,
): boolean {
  return (
    !assessment.isLocked &&
    (assessment.approvalStatus === "published" || assessment.approvalStatus === "approved")
  );
}

export function isGradeEntryAvailable(
  assessment: Pick<Assessment, "approvalStatus" | "isLocked" | "deliveryMode">,
): boolean {
  return (
    assessment.deliveryMode === "SCORE_ONLY" &&
    isAssessmentReleased(assessment)
  );
}

export function isSubmissionReviewAvailable(
  assessment: Pick<Assessment, "approvalStatus" | "isLocked" | "deliveryMode">,
): boolean {
  return (
    assessment.deliveryMode === "QUESTION_BASED" &&
    isAssessmentReleased(assessment)
  );
}

export function getAssessmentEntryModeKey(assessment: Assessment): AssessmentEntryModeKey {
  return assessment.deliveryMode === "QUESTION_BASED" ? "questionBased" : "scoreOnly";
}
