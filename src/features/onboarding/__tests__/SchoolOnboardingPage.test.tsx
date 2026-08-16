import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchoolOnboardingPage from "../pages/SchoolOnboardingPage";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({
  useSetupStatusContext: vi.fn(),
}));

const navigationMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const authMock = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock("../context/SetupStatusContext", () => ({
  useSetupStatusContext: hookMock.useSetupStatusContext,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ push: navigationMock.push }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authMock,
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: { status: "success", data: { stages: [], grades: [], sections: [], classrooms: [] } },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

const evaluation: SetupEvaluation = {
  completedCount: 5,
  totalCount: 5,
  progressPercent: 100,
  isComplete: true,
  steps: {
    organization: { id: "organization", status: "complete", isComplete: true, lockedBy: [] },
    academicContext: { id: "academicContext", status: "complete", isComplete: true, lockedBy: [] },
    structure: { id: "structure", status: "complete", isComplete: true, lockedBy: [] },
    subjects: { id: "subjects", status: "complete", isComplete: true, lockedBy: [] },
    rooms: { id: "rooms", status: "complete", isComplete: true, lockedBy: [] },
  },
};

function createEvaluation(overrides?: {
  academicContextComplete?: boolean;
  structureComplete?: boolean;
  isComplete?: boolean;
}): SetupEvaluation {
  const academicContextComplete = overrides?.academicContextComplete ?? true;
  const structureComplete = overrides?.structureComplete ?? true;
  const isComplete = overrides?.isComplete ?? false;

  return {
    ...evaluation,
    completedCount: isComplete ? 5 : 3,
    progressPercent: isComplete ? 100 : 60,
    isComplete,
    steps: {
      ...evaluation.steps,
      academicContext: {
        id: "academicContext",
        status: academicContextComplete ? "complete" : "available",
        isComplete: academicContextComplete,
        lockedBy: [],
      },
      structure: {
        id: "structure",
        status: structureComplete ? "complete" : "available",
        isComplete: structureComplete,
        lockedBy: [],
      },
    },
  };
}

describe("SchoolOnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.logout.mockResolvedValue(undefined);
    sessionStorage.clear();
    hookMock.useSetupStatusContext.mockReturnValue({
      snapshot,
      evaluation: createEvaluation({ isComplete: true }),
      selectedYear: null,
      selectedTerm: null,
      schoolId: "school-1",
      refreshStep: vi.fn(),
      retryStep: vi.fn(),
    });
  });

  it("always renders the permanent full setup page even when complete", () => {
    render(<SchoolOnboardingPage />);

    expect(
      screen.getByRole("heading", { name: "setup.guideTitle" }),
    ).toBeVisible();
    expect(screen.getByText("guide.progressText")).toBeVisible();
    expect(screen.queryByRole("button", { name: "guide.dismiss" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "setup.finish" })).toBeEnabled();
  });

  it("finishes setup without recording it as skipped", async () => {
    const user = userEvent.setup();

    render(<SchoolOnboardingPage />);

    await user.click(screen.getByRole("button", { name: "setup.finish" }));

    expect(sessionStorage.getItem("sis:onboarding:skipped:school-1")).toBeNull();
    expect(navigationMock.push).toHaveBeenCalledWith("/en/dashboard");
  });

  it("logs the user out from the onboarding page", async () => {
    const user = userEvent.setup();

    render(<SchoolOnboardingPage />);

    await user.click(screen.getByRole("button", { name: "setup.logout" }));

    expect(authMock.logout).toHaveBeenCalledOnce();
  });

  it("renders the welcoming onboarding hero before the setup workflow", () => {
    render(<SchoolOnboardingPage />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "setup.title",
    });

    expect(heading).toBeVisible();
    expect(
      screen.getByText("setup.description"),
    ).toBeVisible();
    expect(heading.closest("header")).toHaveClass("onboarding-enter");
  });

  it("disables skip until academic context and structure are complete", () => {
    hookMock.useSetupStatusContext.mockReturnValue({
      snapshot,
      evaluation: createEvaluation({
        academicContextComplete: false,
        structureComplete: false,
      }),
      selectedYear: null,
      selectedTerm: null,
      schoolId: "school-1",
      refreshStep: vi.fn(),
      retryStep: vi.fn(),
    });

    render(<SchoolOnboardingPage />);

    expect(screen.getByRole("button", { name: "setup.skip" })).toBeDisabled();
    expect(screen.getByText("setup.skipRequirement")).toHaveAttribute(
      "id",
      "skip-setup-requirement",
    );
    expect(screen.getByRole("button", { name: "setup.skip" })).toHaveAttribute(
      "aria-describedby",
      "skip-setup-requirement",
    );
  });

  it("stores a session skip and returns to the dashboard when minimum academic setup exists", async () => {
    const user = userEvent.setup();
    hookMock.useSetupStatusContext.mockReturnValue({
      snapshot,
      evaluation: createEvaluation({
        academicContextComplete: true,
        structureComplete: true,
      }),
      selectedYear: null,
      selectedTerm: null,
      schoolId: "school-1",
      refreshStep: vi.fn(),
      retryStep: vi.fn(),
    });

    render(<SchoolOnboardingPage />);

    await user.click(screen.getByRole("button", { name: "setup.skip" }));

    expect(screen.queryByText("setup.skipRequirement")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("sis:onboarding:skipped:school-1")).toBe("true");
    expect(navigationMock.push).toHaveBeenCalledWith("/en/dashboard");
  });
});
