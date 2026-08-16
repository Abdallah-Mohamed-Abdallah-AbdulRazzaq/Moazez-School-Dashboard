import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import DashboardAlertsPage from "@/features/dashboard/pages/DashboardAlertsPage";
import { fetchDashboardAlerts } from "@/features/dashboard/services/dashboardApiService";
import { dashboardAlertsResponse } from "@/features/dashboard/__tests__/dashboardTestFixtures";

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ isInitializing: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchDashboardAlerts: vi.fn(),
}));

const mockedFetchDashboardAlerts = vi.mocked(fetchDashboardAlerts);

describe("DashboardAlertsPage", () => {
  beforeEach(() => {
    mockedFetchDashboardAlerts.mockReset();
  });

  it("renders dashboard alerts with summary counts and action links", async () => {
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        deferred: {
          acknowledge: "deferred",
        },
      }),
    );

    render(<DashboardAlertsPage />);

    expect(await screen.findByText("Dashboard alerts")).toBeInTheDocument();
    expect(screen.getByText("Absences marked today")).toBeInTheDocument();
    expect(screen.getByText("Critical: 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Showing 1 alert definition with 3 issue signals.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Review absences/i })).toHaveAttribute(
      "href",
      "/en/attendance/absences",
    );
    expect(screen.getByText("Acknowledgement")).toBeInTheDocument();
  });

  it("applies documented alert filters", async () => {
    const user = userEvent.setup();
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [
          {
            key: "attendance.absent_entries_today",
            source: "attendance",
            severity: "critical",
            title: "Filtered attendance alert",
            description: "Filtered attendance alert description.",
            count: 3,
          },
        ],
      }),
    );

    render(<DashboardAlertsPage />);

    expect(await screen.findByText("Dashboard alerts")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Apply filters" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Source" }));
    await user.click(screen.getByRole("button", { name: "Attendance" }));
    await user.click(screen.getByRole("button", { name: "Severity" }));
    await user.click(screen.getByRole("button", { name: "Critical" }));
    await user.click(screen.getByRole("button", { name: "Limit" }));
    await user.click(screen.getByRole("button", { name: "50 alerts" }));
    await user.click(screen.getByLabelText("Include zero-count alerts"));

    await waitFor(() => {
      expect(mockedFetchDashboardAlerts).toHaveBeenLastCalledWith({
        source: "attendance",
        severity: "critical",
        limit: 50,
        includeZeroCount: true,
      });
    });
    expect(await screen.findByText("Filtered attendance alert")).toBeInTheDocument();
  });

  it("shows skeleton rows while filter changes are loading", async () => {
    const user = userEvent.setup();
    let resolveFilteredAlerts!: (
      alertsResponse: ReturnType<typeof dashboardAlertsResponse>,
    ) => void;
    const filteredAlertsPromise = new Promise<
      ReturnType<typeof dashboardAlertsResponse>
    >((resolve) => {
      resolveFilteredAlerts = resolve;
    });

    mockedFetchDashboardAlerts
      .mockResolvedValueOnce(dashboardAlertsResponse())
      .mockReturnValueOnce(filteredAlertsPromise);

    render(<DashboardAlertsPage />);

    expect(await screen.findByText("Dashboard alerts")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Source" }));
    await user.click(screen.getByRole("button", { name: "Attendance" }));

    expect(screen.getByLabelText("Loading dashboard alerts")).toBeInTheDocument();

    await act(async () => {
      resolveFilteredAlerts(
        dashboardAlertsResponse({
          alerts: [
            {
              key: "attendance.filtered",
              source: "attendance",
              severity: "warning",
              title: "Filtered alert loaded",
              description: "The filtered alert request has completed.",
              count: 1,
            },
          ],
        }),
      );
    });

    expect(await screen.findByText("Filtered alert loaded")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading dashboard alerts"),
    ).not.toBeInTheDocument();
  });

  it("renders an honest empty state when no alert definitions match", async () => {
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [],
        summary: {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0,
          bySource: {},
        },
      }),
    );

    render(<DashboardAlertsPage />);

    expect(
      await screen.findByText("No alerts match these filters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Zero-count alerts are excluded by default/),
    ).toBeInTheDocument();
  });

  it("renders a clear error state when alerts cannot load", async () => {
    mockedFetchDashboardAlerts.mockRejectedValue(new Error("Forbidden"));

    render(<DashboardAlertsPage />);

    expect(
      await screen.findByText("Dashboard alerts unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });
});
