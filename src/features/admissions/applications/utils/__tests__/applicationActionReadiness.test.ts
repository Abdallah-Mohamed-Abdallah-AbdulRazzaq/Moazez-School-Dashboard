import { describe, expect, it } from "vitest";

import {
  getApplicationActionBlockers,
  getDecisionActionState,
  getRegistrationActionState,
} from "@/features/admissions/applications/utils/applicationActionReadiness";
import type { Application } from "@/features/admissions/types/admissions";

function applicationWithDashboardState(
  overrides: Partial<NonNullable<Application["dashboardState"]>>,
): Application {
  return {
    id: "app-1",
    status: "submitted",
    submittedDate: "2026-01-01T00:00:00.000Z",
    full_name_ar: "Student",
    full_name_en: "Student",
    studentName: "Student",
    gender: "",
    date_of_birth: "",
    nationality: "",
    grade_requested: "",
    gradeRequested: "",
    guardians: [],
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    documents: [],
    tests: [],
    interviews: [],
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
      blockers: [
        {
          code: "workflow_policy_not_satisfied",
          message: "Required admissions workflow steps are not satisfied.",
        },
      ],
      ...overrides,
    },
  };
}

describe("application action readiness", () => {
  it("uses dashboard decision readiness ahead of status fallback", () => {
    const application = applicationWithDashboardState({
      canProceedToDecision: false,
    });

    expect(getDecisionActionState(application).canMakeDecision).toBe(false);
  });

  it("disables registration when dashboard registration readiness is blocked", () => {
    const application = {
      ...applicationWithDashboardState({
        canRegister: false,
        registrationState: "blocked_workflow_policy",
      }),
      status: "accepted",
    } as Application;

    expect(
      getRegistrationActionState(application, {
        canRegisterApplication: true,
        permissionRequiredMessage: "Missing permissions",
      }),
    ).toEqual({
      isVisible: true,
      isDisabled: true,
      title: "Required admissions workflow steps are not satisfied.",
    });
  });

  it("exposes backend blockers for the action bar", () => {
    const application = applicationWithDashboardState({});

    expect(getApplicationActionBlockers(application)).toEqual([
      {
        code: "workflow_policy_not_satisfied",
        message: "Required admissions workflow steps are not satisfied.",
      },
    ]);
  });
});
