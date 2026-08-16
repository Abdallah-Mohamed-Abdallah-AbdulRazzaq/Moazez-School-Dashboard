export type ApplicationStatusDto =
  | "submitted"
  | "documents_pending"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected";

export type ApplicationSourceDto = "in_app" | "referral" | "walk_in" | "other";

export interface RegistrationStateDto {
  registered: boolean;
  studentId: string | null;
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  registeredVia: string | null;
  registeredAt: string | null;
  source: string;
}
export interface DocumentsSummaryDto { totalCount: number; completeCount: number; missingCount: number; pendingReviewCount: number; reviewableCount: number; applicantPortalCount: number; staffUploadCount: number; needsReplacementCount: number; hasPendingReview: boolean; hasReviewableDocuments: boolean; hasMissingDocuments: boolean; }
export type WorkflowPolicySource = "default" | "school_override";
export interface DashboardStateDto {
  canProceedToDecision: boolean; canRegister: boolean;
  registrationState: "not_applicable" | "not_accepted" | "decision_not_accept" | "blocked_workflow_policy" | "ready_to_register" | "registered";
  decisionState: { canCreateDecision: boolean; canAccept: boolean; canWaitlist: boolean; canReject: boolean; reason: "ready" | "already_decided" | "application_status_not_decidable" | "workflow_policy_not_satisfied" | "direct_acceptance_not_allowed" };
  workflowReadiness: { policy: { requiresPlacementTest: boolean; requiresInterview: boolean; allowDirectAcceptance: boolean; source: WorkflowPolicySource }; placementTests: { required: boolean; total: number; completed: number; satisfied: boolean }; interviews: { required: boolean; total: number; completed: number; satisfied: boolean } };
  documentSignals: Pick<DocumentsSummaryDto, "hasPendingReview" | "hasReviewableDocuments" | "hasMissingDocuments" | "pendingReviewCount" | "reviewableCount" | "missingCount" | "needsReplacementCount">;
  blockers: Array<{ code: string; message: string }>;
}

export interface ApplicationResponseDto {
  id: string;
  leadId: string | null;
  studentName: string;
  requestedAcademicYearId: string | null;
  requestedGradeId: string | null;
  source: ApplicationSourceDto;
  status: ApplicationStatusDto;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  registrationState?: RegistrationStateDto;
  documentsSummary: DocumentsSummaryDto;
  dashboardState: DashboardStateDto;
}

export interface CreateApplicationRequest {
  leadId?: string;
  studentName: string;
  requestedAcademicYearId?: string;
  requestedGradeId?: string;
  source: ApplicationSourceDto;
}

export type UpdateApplicationRequest = Partial<CreateApplicationRequest>;
