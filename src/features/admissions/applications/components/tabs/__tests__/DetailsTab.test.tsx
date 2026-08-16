import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ApplicationReadinessPanel from "@/features/admissions/applications/components/tabs/ApplicationReadinessPanel";
import DetailsTab from "@/features/admissions/applications/components/tabs/DetailsTab";
import type { Application } from "@/features/admissions/types/admissions";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      "details.readiness_title": "Application readiness",
      "details.readiness_subtitle": "Backend-computed action state for this application.",
      "details.decision_action": "Decision action",
      "details.registration_action": "Registration action",
      "details.enabled": "Enabled",
      "details.blocked": "Blocked",
      "details.document_summary": "Document summary",
      "details.documents_complete": "Complete",
      "details.documents_missing": "Missing",
      "details.documents_pending_review": "Pending review",
      "details.workflow_readiness": "Workflow readiness",
      "details.placement_test": "Placement test",
      "details.interview": "Interview",
      "details.required": "Required",
      "details.not_satisfied": "Not satisfied",
      "details.completed_count": `${values?.completed ?? 0} of ${values?.total ?? 0} completed`,
      "details.blockers": "Blockers",
      "overview.title": "Application overview",
      "overview.sources.in_app": "In-app",
      "overview.statuses.submitted": "Submitted",
      "overview.not_available": "Not available",
      submitted: "Submitted",
    };

    return messages[key] ?? key;
  },
}));

const application = {
  id: "8f1cef51-13f4-4734-a87f-c2da4c329204",
  studentName: "ادم بركات",
  full_name_ar: "ادم بركات",
  full_name_en: "Adam Barakat",
  gender: "",
  date_of_birth: "",
  nationality: "",
  grade_requested: "",
  gradeRequested: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  guardians: [],
  documents: [],
  tests: [],
  interviews: [],
  source: "in_app",
  status: "submitted",
  submittedDate: "2026-07-06T21:55:33.783Z",
  submittedAt: "2026-07-06T21:55:33.783Z",
  createdAt: "2026-07-06T21:55:33.794Z",
  updatedAt: "2026-07-06T21:55:33.794Z",
  registrationState: {
    registered: false,
    studentId: null,
    enrollmentId: null,
    enrollmentStatus: null,
    registeredVia: null,
    registeredAt: null,
    source: "derived_from_student_application_id",
  },
  documentsSummary: {
    totalCount: 0,
    completeCount: 0,
    missingCount: 0,
    pendingReviewCount: 0,
    reviewableCount: 0,
    applicantPortalCount: 0,
    staffUploadCount: 0,
    needsReplacementCount: 0,
    hasPendingReview: false,
    hasReviewableDocuments: false,
    hasMissingDocuments: false,
  },
  dashboardState: {
    canProceedToDecision: false,
    canRegister: false,
    registrationState: "not_accepted",
    decisionState: {
      canCreateDecision: false,
      canAccept: false,
      canWaitlist: false,
      canReject: false,
      reason: "workflow_policy_not_satisfied",
    },
    workflowReadiness: {
      policy: {
        requiresPlacementTest: true,
        requiresInterview: true,
        allowDirectAcceptance: false,
        source: "default",
      },
      placementTests: {
        required: true,
        total: 0,
        completed: 0,
        satisfied: false,
      },
      interviews: {
        required: true,
        total: 0,
        completed: 0,
        satisfied: false,
      },
    },
    documentSignals: {
      hasPendingReview: false,
      hasReviewableDocuments: false,
      hasMissingDocuments: false,
      pendingReviewCount: 0,
      reviewableCount: 0,
      missingCount: 0,
      needsReplacementCount: 0,
    },
    blockers: [
      {
        code: "workflow_policy_not_satisfied",
        message: "Required admissions workflow steps are not satisfied.",
      },
      {
        code: "not_accepted",
        message: "Application is not accepted.",
      },
    ],
  },
} as Application;

describe("ApplicationReadinessPanel", () => {
  it("surfaces backend decision, registration, workflow, document, and blocker state", () => {
    render(<ApplicationReadinessPanel application={application} />);

    expect(screen.getByText("Application readiness")).toBeInTheDocument();
    expect(screen.getAllByText("Decision action").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Registration action").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Blocked")).toHaveLength(2);

    expect(screen.getByText("Document summary")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText("Pending review")).toBeInTheDocument();

    expect(screen.getByText("Workflow readiness")).toBeInTheDocument();
    expect(screen.getByText("Placement test")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getAllByText("Required")).toHaveLength(2);
    expect(screen.getAllByText("0 of 0 completed")).toHaveLength(2);
    expect(screen.getAllByText("Not satisfied")).toHaveLength(2);

    expect(
      screen.getAllByText("Required admissions workflow steps are not satisfied.").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Application is not accepted.").length).toBeGreaterThan(0);
  });
});

describe("DetailsTab", () => {
  it("renders only the application overview DTO fields", () => {
    const overviewApplication = {
      ...application,
      leadId: null,
      requestedAcademicYearId: null,
      requestedGradeId: null,
      source: "in_app",
      status: "submitted",
    } as Application;

    render(<DetailsTab application={overviewApplication} />);

    expect(screen.getByText("Application overview")).toBeInTheDocument();
    expect(screen.getByText(overviewApplication.id)).toBeInTheDocument();
    expect(screen.getByText(overviewApplication.studentName)).toBeInTheDocument();
    expect(screen.getByText("In-app")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(3);
    expect(screen.queryByText("details.student_info")).not.toBeInTheDocument();
    expect(screen.queryByText("details.contact_info")).not.toBeInTheDocument();
    expect(screen.queryByText("details.medical_additional")).not.toBeInTheDocument();
  });
});
