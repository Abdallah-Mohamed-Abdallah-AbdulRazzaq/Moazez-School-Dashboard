import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationDetailsPage from "@/features/admissions/applications/pages/ApplicationDetailsPage";
import type {
  Application,
  ApplicationStatus,
} from "@/features/admissions/types/admissions";

const applicationServiceMocks = vi.hoisted(() => ({
  fetchApplicationById: vi.fn(),
}));

const documentServiceMocks = vi.hoisted(() => ({
  fetchApplicationDocuments: vi.fn(),
}));

const testServiceMocks = vi.hoisted(() => ({
  createPlacementTest: vi.fn(),
  fetchPlacementTests: vi.fn(),
}));

const interviewServiceMocks = vi.hoisted(() => ({
  createInterview: vi.fn(),
  fetchInterviews: vi.fn(),
}));

const decisionServiceMocks = vi.hoisted(() => ({
  createDecision: vi.fn(),
  fetchDecisions: vi.fn(),
  getDecisionFriendlyErrorMessage: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showToast: toastMocks.showToast,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      "actions.schedule_test": "Schedule Test",
      "actions.schedule_interview": "Schedule Interview",
      "actions.make_decision": "Make Decision",
      "actions.enroll_student": "Enroll Student",
      "actions.blocked_title": "Action blockers",
      "actions.waitlisted_no_transition":
        "This application is waitlisted. No transition action is available yet.",
      "actions.rejected_no_actions":
        "This application has been rejected. No further actions are available.",
      "header.title": "Application",
      "tabs.details": "Details",
      "tabs.readiness": "Readiness",
      "tabs.guardians": "Guardians",
      "tabs.documents": "Documents",
      "tabs.tests": "Tests",
      "tabs.interviews": "Interviews",
    })[key] ?? key,
}));

vi.mock("@/features/admissions/shared/hooks/useAdmissionsUrlQueryState", () => ({
  useAdmissionsUrlQueryState: () => ({
    values: { tab: "details" },
    setValue: vi.fn(),
  }),
}));

vi.mock("@/features/admissions/shared/StatusBadge", () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/features/admissions/shared/TabNavigation", () => ({
  default: ({
    tabs,
  }: {
    tabs: Array<{ id: string; label: string }>;
  }) => (
    <nav aria-label="Application tabs">
      {tabs.map((tab) => (
        <span key={tab.id}>{tab.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock("@/features/admissions/tests/components/ScheduleTestModal", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admissions/interviews/components/ScheduleInterviewModal",
  () => ({
    default: () => null,
  }),
);

vi.mock("@/features/admissions/decisions/components/DecisionModal", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/applications/components/registration/ApplicationRegistrationWizard", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/applications/hooks/useApplicationRelatedData", () => ({
  useApplicationRelatedData: () => ({
    handoff: null,
    guardians: [],
    isLoadingHandoff: false,
    handoffError: null,
    reloadHandoff: vi.fn(),
  }),
}));

vi.mock("@/features/admissions/applications/hooks/useAdmissionsGradeLabels", () => ({
  useAdmissionsGradeLabels: () => new Map([["grade-1", "Grade 1"]]),
}));

vi.mock(
  "@/features/admissions/applications/components/tabs/DetailsTab",
  () => ({
    default: () => <section>Details content</section>,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/ApplicationReadinessPanel",
  () => ({
    default: () => <section>Readiness content</section>,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/GuardiansTab",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/admissions/applications/components/tabs/DocumentsTab",
  () => ({
    default: () => null,
  }),
);

vi.mock("@/features/admissions/applications/components/tabs/TestsTab", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/admissions/applications/components/tabs/InterviewsTab",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/features/admissions/applications/services/applicationsApiService",
  () => applicationServiceMocks,
);

vi.mock(
  "@/features/admissions/applications/services/applicationDocumentsApiService",
  () => documentServiceMocks,
);

vi.mock(
  "@/features/admissions/tests/services/testsApiService",
  () => testServiceMocks,
);

vi.mock(
  "@/features/admissions/interviews/services/interviewsApiService",
  () => interviewServiceMocks,
);

vi.mock(
  "@/features/admissions/decisions/services/decisionsApiService",
  () => decisionServiceMocks,
);

function applicationWithStatus(status: ApplicationStatus): Application {
  return {
    id: "app-1",
    status,
    submittedDate: "2026-01-01T00:00:00.000Z",
    full_name_ar: "Student",
    full_name_en: "Student",
    studentName: "Student",
    gender: "N/A",
    date_of_birth: "2018-01-01",
    nationality: "N/A",
    grade_requested: "Grade 1",
    gradeRequested: "Grade 1",
    guardians: [],
    guardianName: "Guardian",
    guardianPhone: "123",
    guardianEmail: "guardian@example.com",
    documents: [],
    tests: [],
    interviews: [],
    dashboardState: {
      canProceedToDecision: status === "submitted",
      canRegister: status === "accepted",
      registrationState: status === "accepted" ? "ready_to_register" : "not_accepted",
      decisionState: {
        canCreateDecision: status === "submitted",
        canAccept: status === "submitted",
        canWaitlist: status === "submitted",
        canReject: status === "submitted",
        reason: status === "submitted" ? "ready" : "application_status_not_decidable",
      },
      workflowReadiness: {
        policy: {
          requiresPlacementTest: true,
          requiresInterview: true,
          allowDirectAcceptance: false,
          source: "default",
        },
        placementTests: { required: true, total: 0, completed: 0, satisfied: false },
        interviews: { required: true, total: 0, completed: 0, satisfied: false },
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
      blockers: [],
    },
  };
}

async function renderApplicationDetails(status: ApplicationStatus) {
  applicationServiceMocks.fetchApplicationById.mockResolvedValue(
    applicationWithStatus(status),
  );

  render(<ApplicationDetailsPage applicationId="app-1" />);
  await screen.findByText("Details content");
}

describe("ApplicationDetailsPage action bar", () => {
  beforeEach(() => {
    applicationServiceMocks.fetchApplicationById.mockReset();
    documentServiceMocks.fetchApplicationDocuments.mockReset().mockResolvedValue([]);
    testServiceMocks.createPlacementTest.mockReset();
    testServiceMocks.fetchPlacementTests.mockReset().mockResolvedValue([]);
    interviewServiceMocks.createInterview.mockReset();
    interviewServiceMocks.fetchInterviews.mockReset().mockResolvedValue([]);
    decisionServiceMocks.createDecision.mockReset();
    decisionServiceMocks.fetchDecisions.mockReset().mockResolvedValue([]);
    decisionServiceMocks.getDecisionFriendlyErrorMessage.mockReset();
    toastMocks.showToast.mockReset();
  });

  it("shows workflow actions for submitted applications", async () => {
    await renderApplicationDetails("submitted");

    expect(screen.getByRole("button", { name: "Schedule Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schedule Interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make Decision" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
  });

  it("includes a dedicated readiness tab", async () => {
    await renderApplicationDetails("submitted");

    expect(screen.getByText("Readiness")).toBeInTheDocument();
  });

  it("does not prefetch related lists on the initial details view", async () => {
    await renderApplicationDetails("submitted");

    expect(applicationServiceMocks.fetchApplicationById).toHaveBeenCalledWith("app-1");
    expect(documentServiceMocks.fetchApplicationDocuments).not.toHaveBeenCalled();
    expect(testServiceMocks.fetchPlacementTests).not.toHaveBeenCalled();
    expect(interviewServiceMocks.fetchInterviews).not.toHaveBeenCalled();
    expect(decisionServiceMocks.fetchDecisions).not.toHaveBeenCalled();
  });

  it("shows schedule actions but hides decision for documents pending applications", async () => {
    await renderApplicationDetails("documents_pending");

    expect(screen.getByRole("button", { name: "Schedule Test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schedule Interview" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
  });

  it("hides workflow actions and explains waitlisted applications", async () => {
    await renderApplicationDetails("waitlisted");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This application is waitlisted. No transition action is available yet.",
      ),
    ).toBeInTheDocument();
  });

  it("hides workflow actions and explains rejected applications", async () => {
    await renderApplicationDetails("rejected");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enroll Student" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This application has been rejected. No further actions are available.",
      ),
    ).toBeInTheDocument();
  });

  it("shows only enrollment for accepted applications", async () => {
    await renderApplicationDetails("accepted");

    expect(screen.queryByRole("button", { name: "Schedule Test" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule Interview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make Decision" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enroll Student" })).toBeInTheDocument();
  });

  it("shows backend blockers as visible text when registration is disabled", async () => {
    applicationServiceMocks.fetchApplicationById.mockResolvedValue({
      ...applicationWithStatus("accepted"),
      dashboardState: {
        ...applicationWithStatus("accepted").dashboardState!,
        canRegister: false,
        registrationState: "blocked_workflow_policy",
        blockers: [
          {
            code: "workflow_policy_not_satisfied",
            message: "Required admissions workflow steps are not satisfied.",
          },
        ],
      },
    });

    render(<ApplicationDetailsPage applicationId="app-1" />);
    await screen.findByText("Details content");

    expect(screen.getByRole("button", { name: "Enroll Student" })).toBeDisabled();
    expect(screen.getByText("Action blockers")).toBeInTheDocument();
    expect(
      screen.getByText("Required admissions workflow steps are not satisfied."),
    ).toBeInTheDocument();
  });
});
