import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingRedirectGuard } from "../components/OnboardingRedirectGuard";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({
  useSetupStatusContext: vi.fn(),
}));

const navigationMock = vi.hoisted(() => ({
  replace: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("../context/SetupStatusContext", () => ({
  useSetupStatusContext: hookMock.useSetupStatusContext,
}));

vi.mock("next/navigation", () => ({
  usePathname: navigationMock.usePathname,
  useRouter: () => ({ replace: navigationMock.replace }),
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: {
    status: "success",
    data: { stages: [], grades: [], sections: [], classrooms: [] },
  },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

const loadingSnapshot = {
  ...snapshot,
  organization: { status: "loading" },
} as unknown as SetupSnapshot;

function evaluation(isComplete: boolean): SetupEvaluation {
  return {
    completedCount: isComplete ? 5 : 2,
    totalCount: 5,
    progressPercent: isComplete ? 100 : 40,
    isComplete,
    steps: {
      organization: {
        id: "organization",
        status: "complete",
        isComplete: true,
        lockedBy: [],
      },
      academicContext: {
        id: "academicContext",
        status: "complete",
        isComplete: true,
        lockedBy: [],
      },
      structure: {
        id: "structure",
        status: "available",
        isComplete: false,
        lockedBy: [],
      },
      subjects: {
        id: "subjects",
        status: "locked",
        isComplete: false,
        lockedBy: ["structure"],
      },
      rooms: {
        id: "rooms",
        status: "locked",
        isComplete: false,
        lockedBy: ["subjects"],
      },
    },
  };
}

function mockStatus(overrides?: {
  isComplete?: boolean;
  schoolId?: string;
  snapshot?: SetupSnapshot;
}) {
  hookMock.useSetupStatusContext.mockReturnValue({
    snapshot: overrides?.snapshot ?? snapshot,
    evaluation: evaluation(overrides?.isComplete ?? false),
    selectedYear: null,
    selectedTerm: null,
    schoolId: overrides?.schoolId ?? "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}

describe("OnboardingRedirectGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    navigationMock.usePathname.mockReturnValue("/en/dashboard");
    mockStatus();
  });

  it("redirects dashboard users to onboarding when setup is incomplete", async () => {
    const { container } = render(
      <OnboardingRedirectGuard>
        <div>Dashboard content</div>
      </OnboardingRedirectGuard>,
    );

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/en/settings/onboarding");
    });

    expect(container.querySelector(".logo-loader")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("shows the main loader instead of dashboard content while setup status loads", () => {
    mockStatus({ snapshot: loadingSnapshot });

    const { container } = render(
      <OnboardingRedirectGuard>
        <div>Dashboard content</div>
      </OnboardingRedirectGuard>,
    );

    expect(container.querySelector(".logo-loader")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("does not redirect from the onboarding page itself", () => {
    navigationMock.usePathname.mockReturnValue("/en/settings/onboarding");

    const { container } = render(
      <OnboardingRedirectGuard>
        <div>Onboarding content</div>
      </OnboardingRedirectGuard>,
    );

    expect(navigationMock.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Onboarding content")).toBeInTheDocument();
    expect(container.querySelector(".logo-loader")).not.toBeInTheDocument();
  });

  it("does not redirect again after the user skipped onboarding in the same session", () => {
    sessionStorage.setItem("sis:onboarding:skipped:school-1", "true");

    const { container } = render(
      <OnboardingRedirectGuard>
        <div>Dashboard content</div>
      </OnboardingRedirectGuard>,
    );

    expect(navigationMock.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(container.querySelector(".logo-loader")).not.toBeInTheDocument();
  });

  it("does not redirect when setup is complete", () => {
    mockStatus({ isComplete: true });

    const { container } = render(
      <OnboardingRedirectGuard>
        <div>Dashboard content</div>
      </OnboardingRedirectGuard>,
    );

    expect(navigationMock.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(container.querySelector(".logo-loader")).not.toBeInTheDocument();
  });
});
