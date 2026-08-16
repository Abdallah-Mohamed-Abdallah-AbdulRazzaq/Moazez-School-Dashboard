import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingWelcomePage from "../pages/OnboardingWelcomePage";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({ useSetupStatusContext: vi.fn() }));
const navigationMock = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("../context/SetupStatusContext", () => ({
  useSetupStatusContext: hookMock.useSetupStatusContext,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => navigationMock,
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

function evaluation(isComplete: boolean): SetupEvaluation {
  const status = isComplete ? "complete" : "available";

  return {
    completedCount: isComplete ? 5 : 0,
    totalCount: 5,
    progressPercent: isComplete ? 100 : 0,
    isComplete,
    steps: {
      organization: {
        id: "organization",
        status,
        isComplete,
        lockedBy: [],
      },
      academicContext: {
        id: "academicContext",
        status,
        isComplete,
        lockedBy: [],
      },
      structure: { id: "structure", status, isComplete, lockedBy: [] },
      subjects: { id: "subjects", status, isComplete, lockedBy: [] },
      rooms: { id: "rooms", status, isComplete, lockedBy: [] },
    },
  };
}

function mockStatus(currentSnapshot = snapshot, isComplete = false) {
  hookMock.useSetupStatusContext.mockReturnValue({
    snapshot: currentSnapshot,
    evaluation: evaluation(isComplete),
    selectedYear: null,
    selectedTerm: null,
    schoolId: "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}

describe("OnboardingWelcomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus();
  });

  it("introduces all setup stages when setup is incomplete", () => {
    render(<OnboardingWelcomePage />);

    expect(
      screen.getByRole("heading", { name: "welcome.title" }),
    ).toBeVisible();
    expect(screen.getByText("welcome.stages.organization.title")).toBeVisible();
    expect(screen.getByText("welcome.stages.academicContext.title")).toBeVisible();
    expect(screen.getByText("welcome.stages.structure.title")).toBeVisible();
    expect(screen.getByText("welcome.stages.subjects.title")).toBeVisible();
    expect(screen.getByText("welcome.stages.rooms.title")).toBeVisible();
  });

  it("opens the localized setup workflow", async () => {
    const user = userEvent.setup();
    render(<OnboardingWelcomePage />);

    await user.click(screen.getByRole("button", { name: "welcome.start" }));

    expect(navigationMock.push).toHaveBeenCalledWith(
      "/en/settings/onboarding/setup",
    );
  });

  it("shows a loading state while setup status is loading", () => {
    mockStatus({ ...snapshot, rooms: { status: "loading", data: [] } });
    render(<OnboardingWelcomePage />);

    expect(screen.getByText("loading.preparing")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "welcome.start" }),
    ).not.toBeInTheDocument();
  });

  it("returns completed schools to the dashboard", async () => {
    mockStatus(snapshot, true);
    render(<OnboardingWelcomePage />);

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/en/dashboard");
    });
    expect(
      screen.queryByRole("button", { name: "welcome.start" }),
    ).not.toBeInTheDocument();
  });
});
