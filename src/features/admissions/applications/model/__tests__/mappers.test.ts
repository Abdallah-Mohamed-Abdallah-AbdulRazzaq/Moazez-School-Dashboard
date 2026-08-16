import { describe, expect, it } from "vitest";
import { mapApplicationDocumentDto, mapApplicationDto, toLegacyApplication, toLegacyDocument } from "../mappers";

const applicationDto = {
  id: "app-1",
  leadId: null,
  studentName: "Omar Ahmed",
  requestedAcademicYearId: "year-1",
  requestedGradeId: "grade-1",
  source: "referral",
  status: "documents_pending",
  submittedAt: null,
  createdAt: "2026-06-30T09:00:00.000Z",
  updatedAt: "2026-06-30T09:00:00.000Z",
} as const;

describe("application mappers", () => {
  it("preserves backend-computed application action state", () => {
    const result = mapApplicationDto({ ...applicationDto,
      documentsSummary: { totalCount: 1, completeCount: 0, missingCount: 1, pendingReviewCount: 0, reviewableCount: 0, applicantPortalCount: 0, staffUploadCount: 1, needsReplacementCount: 0, hasPendingReview: false, hasReviewableDocuments: false, hasMissingDocuments: true },
      dashboardState: { canProceedToDecision: false, canRegister: false, registrationState: "not_accepted", decisionState: { canCreateDecision: false, canAccept: false, canWaitlist: false, canReject: false, reason: "workflow_policy_not_satisfied" }, workflowReadiness: { policy: { requiresPlacementTest: true, requiresInterview: true, allowDirectAcceptance: false, source: "default" }, placementTests: { required: true, total: 0, completed: 0, satisfied: false }, interviews: { required: true, total: 0, completed: 0, satisfied: false } }, documentSignals: { hasPendingReview: false, hasReviewableDocuments: false, hasMissingDocuments: true, pendingReviewCount: 0, reviewableCount: 0, missingCount: 1, needsReplacementCount: 0 }, blockers: [] },
    });
    expect(result.documentsSummary.missingCount).toBe(1);
    expect(result.dashboardState.decisionState.reason).toBe("workflow_policy_not_satisfied");
  });

  it("preserves backend document review eligibility", () => {
    const result = mapApplicationDocumentDto({ id: "doc-1", applicationId: "app-1", fileId: "file-1", documentType: "passport", status: "pending_review", source: "applicant_portal", canReview: true, reviewEligibility: { canAccept: true, canReject: true, canRequestReplacement: true, reason: "reviewable" }, linkedApplicantDocument: { id: "portal-1", status: "uploaded" }, notes: null, createdAt: "2026-07-01", updatedAt: "2026-07-01" });
    expect(result.canReview).toBe(true);
    expect(result.reviewEligibility.reason).toBe("reviewable");
  });
  it("maps the backend application without inventing related resources", () => {
    const result = mapApplicationDto(applicationDto);

    expect(result).toMatchObject({
      id: "app-1",
      studentName: "Omar Ahmed",
      requestedGradeId: "grade-1",
      submittedAt: null,
      registrationState: { registered: false },
    });
    expect(toLegacyApplication(result)).toMatchObject({
      guardians: [],
      documents: [],
      tests: [],
      interviews: [],
      submittedAt: null,
    });
  });

  it("uses returned file metadata for the document display model", () => {
    expect(
      toLegacyDocument({
        id: "doc-1",
        applicationId: "app-1",
        fileId: "file-1",
        documentType: "Birth Certificate",
        status: "pending_review",
        notes: null,
        createdAt: "2026-06-30T09:00:00.000Z",
        updatedAt: "2026-06-30T09:00:00.000Z",
        file: {
          id: "file-1",
          originalName: "birth.pdf",
          mimeType: "application/pdf",
          sizeBytes: "100",
          visibility: "PRIVATE",
        },
      }),
    ).toMatchObject({
      name: "birth.pdf",
      fileType: "pdf",
      url: "/api/files/file-1/download",
    });
  });
});
