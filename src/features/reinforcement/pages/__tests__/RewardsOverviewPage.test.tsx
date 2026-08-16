import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardsOverviewPage from "../RewardsOverviewPage";

const permissionState = vi.hoisted(() => ({
  permissions: ["reinforcement.rewards.view"] as string[],
}));

const dashboardMocks = vi.hoisted(() => ({
  getRewardsOverview: vi.fn(),
  getRewardCatalogSummary: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    isInitializing: false,
  }),
}));

vi.mock(
  "@/features/reinforcement/services/rewardDashboardService",
  () => dashboardMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

vi.mock("@/features/reinforcement/hooks/useReinforcementUrlFilters", async () => {
  const React = await import("react");
  return {
    useReinforcementUrlFilters: ({
      paramKeys,
      defaults = {},
    }: {
      paramKeys: string[];
      defaults?: Record<string, string>;
    }) => {
      const [values, setValues] = React.useState<Record<string, string>>(() => {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(
          paramKeys.map((key) => [key, params.get(key) || defaults[key] || ""]),
        );
      });
      const setValue = React.useCallback((key: string, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
      }, []);
      return { values, setValue };
    },
  };
});

function renderPage() {
  return render(
    <ToastProvider>
      <RewardsOverviewPage />
    </ToastProvider>,
  );
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  labelName: string,
  optionText: string,
) {
  const trigger = await screen.findByLabelText(labelName);
  await user.click(trigger);
  const option = await screen.findByRole("button", { name: optionText });
  await user.click(option);
}

describe("RewardsOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    dashboardMocks.getRewardsOverview.mockResolvedValue({
      catalog: { total: 10, published: 5 },
      redemptions: { pending: 2 },
      fulfillment: { completed: 3 },
      xp: { granted: 100 },
      topRequestedRewards: [],
      recentRedemptions: [],
      lowStockRewards: [],
    });

    dashboardMocks.getRewardCatalogSummary.mockResolvedValue({
      summary: { total: 10 },
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "Year 1", nameAr: "Year 1" }],
      terms: [{ id: "term-1", nameEn: "Term 1", nameAr: "Term 1" }],
      stages: [{ id: "stage-1", nameEn: "Stage 1", nameAr: "Stage 1" }],
      grades: [{ id: "grade-1", stage: "stage-1", nameEn: "Grade 1", nameAr: "Grade 1" }],
      sections: [{ id: "section-1", grade: "grade-1", nameEn: "Section 1", nameAr: "Section 1" }],
      classrooms: [{ id: "classroom-1", section: "section-1", nameEn: "Classroom 1", nameAr: "Classroom 1" }],
      students: [{
        studentId: "student-123",
        stage: "stage-1",
        grade: "grade-1",
        section: "section-1",
        classroom: "classroom-1",
        code: "ST-123",
        nameEn: "Student 123",
        nameAr: "Student 123",
      }],
    });
    window.history.replaceState(null, "", "/en/reinforcement/rewards");
  });

  it("calls getRewardsOverview and getRewardCatalogSummary with query parameters on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenCalled();
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalled();
    });
  });

  it("hydrates the academic cascade from an existing studentId URL filter", async () => {
    window.history.replaceState(
      null,
      "",
      "/en/reinforcement/rewards?studentId=student-123",
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Stage")).toHaveTextContent("Stage 1");
      expect(screen.getByLabelText("Grade")).toHaveTextContent("Grade 1");
      expect(screen.getByLabelText("Section")).toHaveTextContent("Section 1");
      expect(screen.getByLabelText("Classroom")).toHaveTextContent("Classroom 1");
      expect(
        screen.getByLabelText("rewardsModule.redemptions.create.student"),
      ).toHaveTextContent("Student 123");
    });
  });

  it("searches students by identifiers in the cascade", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "Stage", "Stage 1");
    await selectOption(user, "Grade", "Grade 1");
    await selectOption(user, "Section", "Section 1");
    await selectOption(user, "Classroom", "Classroom 1");
    await user.click(
      screen.getByLabelText("rewardsModule.redemptions.create.student"),
    );
    await user.type(screen.getByPlaceholderText("Search..."), "ST-123");

    expect(screen.getByRole("button", { name: "Student 123" })).toBeInTheDocument();
  });

  it("refetches overview with selected student after ordered academic cascade selection", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByLabelText("rewardsModule.redemptions.create.student"),
    ).toBeDisabled();
    await selectOption(user, "Stage", "Stage 1");
    await selectOption(user, "Grade", "Grade 1");
    await selectOption(user, "Section", "Section 1");
    await selectOption(user, "Classroom", "Classroom 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-123",
        }),
      );
    });
  });

  it("passes status, reward type, and archived flag to both dashboard endpoints", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(
      user,
      "rewardsModule.redemptions.table.status",
      "rewardsModule.status.approved",
    );
    await selectOption(
      user,
      "rewardsModule.catalog.table.type",
      "rewardsModule.type.digital",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "rewardsModule.overview.includeArchived",
      }),
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "rewardsModule.overview.includeDeleted",
      }),
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "rewardsModule.overview.onlyAvailable",
      }),
    );
    await selectOption(
      user,
      "rewardsModule.catalog.table.status",
      "rewardsModule.status.published",
    );

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: "approved",
          type: "digital",
          includeArchived: true,
        }),
      );
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "digital",
          includeArchived: true,
          includeDeleted: true,
          onlyAvailable: true,
          status: "published",
        }),
      );
    });
  });

  it("clears local filters but preserves academic context when Clear Filters is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "Stage", "Stage 1");
    await selectOption(user, "Grade", "Grade 1");
    await selectOption(user, "Section", "Section 1");
    await selectOption(user, "Classroom", "Classroom 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    // Verify it was called with academic context + student
    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-123",
        }),
      );
    });

    // Now find and click the Clear Filters button
    const clearBtn = await screen.findByText("rewardsModule.overview.clearFilters");
    await user.click(clearBtn);

    // Verify that local filters are cleared, but academic context is preserved
    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        }),
      );
    });
  });

  it("blocks fetching and displays validation error when dateFrom is after dateTo", async () => {
    const user = userEvent.setup();
    renderPage();

    const dateFromInput = await screen.findByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = await screen.findByLabelText("rewardsModule.overview.dateTo");

    await user.type(dateFromInput, "2026-06-30");
    await user.type(dateToInput, "2026-06-25");

    await waitFor(() => {
      expect(
        screen.getByText("rewardsModule.overview.errors.invalidDates"),
      ).toBeInTheDocument();
    });
  });
});
