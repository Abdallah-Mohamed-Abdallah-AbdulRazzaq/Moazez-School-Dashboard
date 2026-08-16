import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupGuideCard } from "../components/SetupGuideCard";
import type { SetupEvaluation, SetupSnapshot } from "../types";

const hookMock = vi.hoisted(() => ({
  useSetupStatusContext: vi.fn(),
}));

vi.mock("../context/SetupStatusContext", () => ({
  useSetupStatusContext: hookMock.useSetupStatusContext,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const snapshot = {
  organization: { status: "success", data: null },
  academicContext: { status: "success", data: { years: [], termsByYear: {} } },
  structure: { status: "success", data: { stages: [], grades: [], sections: [], classrooms: [] } },
  subjects: { status: "success", data: { subjects: [], allocations: [] } },
  rooms: { status: "success", data: [] },
} as unknown as SetupSnapshot;

function evaluation(isComplete = false): SetupEvaluation {
  return {
    completedCount: isComplete ? 5 : 0,
    totalCount: 5,
    progressPercent: isComplete ? 100 : 0,
    isComplete,
    steps: {
      organization: { id: "organization", status: isComplete ? "complete" : "available", isComplete, lockedBy: [] },
      academicContext: { id: "academicContext", status: "locked", isComplete: false, lockedBy: ["organization"] },
      structure: { id: "structure", status: "locked", isComplete: false, lockedBy: ["academicContext"] },
      subjects: { id: "subjects", status: "locked", isComplete: false, lockedBy: ["structure"] },
      rooms: { id: "rooms", status: "locked", isComplete: false, lockedBy: ["subjects"] },
    },
  };
}

function mockHook(isComplete = false) {
  hookMock.useSetupStatusContext.mockReturnValue({
    snapshot,
    evaluation: evaluation(isComplete),
    selectedYear: null,
    selectedTerm: null,
    schoolId: "school-1",
    refreshStep: vi.fn(),
    retryStep: vi.fn(),
  });
}

describe("SetupGuideCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    mockHook(false);
  });

  it("renders for incomplete setup and can be dismissed for the current session", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SetupGuideCard />);

    expect(
      screen.getByRole("heading", { name: "guide.cardTitle" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "guide.dismiss" }));
    expect(
      screen.queryByRole("heading", { name: "guide.cardTitle" }),
    ).not.toBeInTheDocument();

    rerender(<SetupGuideCard />);
    expect(
      screen.queryByRole("heading", { name: "guide.cardTitle" }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem("sis:onboarding:dismissed:school-1")).toBe("true");
  });

  it("does not render when setup is complete", () => {
    mockHook(true);

    render(<SetupGuideCard />);

    expect(
      screen.queryByRole("heading", { name: "guide.cardTitle" }),
    ).not.toBeInTheDocument();
  });
});
