import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import SchoolDashboardContainer from "@/features/dashboard/container/SchoolDashboardContainer";
import {
  fetchDashboardActivityFeed,
  fetchDashboardAlerts,
  fetchDashboardSummary,
  fetchDashboardModules,
  fetchDashboardModuleByKey,
  fetchDashboardWidgets,
  fetchLightModeDropdown,
} from "@/features/dashboard/services/dashboardApiService";
import {
  dashboardActivityFeedResponse,
  dashboardAlertsResponse,
  dashboardSummaryResponse,
} from "@/features/dashboard/__tests__/dashboardTestFixtures";

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ isInitializing: false }),
}));

let grantedDashboardPermissions = new Set<string>();

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      grantedDashboardPermissions.has(permission),
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchDashboardSummary: vi.fn(),
  fetchDashboardAlerts: vi.fn(),
  fetchDashboardActivityFeed: vi.fn(),
  fetchDashboardModules: vi.fn(),
  fetchDashboardModuleByKey: vi.fn(),
  fetchDashboardWidgets: vi.fn(),
  fetchLightModeDropdown: vi.fn(),
}));

vi.mock("@/features/onboarding/components/SetupGuideCard", () => ({
  SetupGuideCard: () => <section>Quick school setup</section>,
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  createAnnouncement: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

const mockedFetchDashboardSummary = vi.mocked(fetchDashboardSummary);
const mockedFetchDashboardAlerts = vi.mocked(fetchDashboardAlerts);
const mockedFetchDashboardActivityFeed = vi.mocked(fetchDashboardActivityFeed);
const mockedFetchDashboardModules = vi.mocked(fetchDashboardModules);
const mockedFetchDashboardModuleByKey = vi.mocked(fetchDashboardModuleByKey);
const mockedFetchDashboardWidgets = vi.mocked(fetchDashboardWidgets);
const mockedFetchLightModeDropdown = vi.mocked(fetchLightModeDropdown);
type DashboardModulesResult = Awaited<ReturnType<typeof fetchDashboardModules>>;
type DashboardModuleResult = Awaited<ReturnType<typeof fetchDashboardModuleByKey>>;

describe("SchoolDashboardContainer", () => {
  beforeEach(() => {
    grantedDashboardPermissions = new Set([
      "dashboard.summary.view",
      "dashboard.alerts.view",
      "dashboard.activity_feed.view",
      "dashboard.modules.view",
      "dashboard.command_center.view",
      "dashboard.light_mode_dropdown.view",
      "dashboard.widgets.view",
      "dashboard.analytics.view",
      "dashboard.todos.view",
      "dashboard.todos.manage",
      "students.records.manage",
      "students.guardians.manage",
      "students.enrollments.manage",
      "attendance.sessions.view",
      "attendance.policies.view",
      "academics.structure.view",
      "communication.announcements.view",
      "communication.announcements.manage",
      "grades.gradebook.view",
      "grades.assessments.manage",
    ]);
    mockedFetchDashboardSummary.mockReset();
    mockedFetchDashboardAlerts.mockReset();
    mockedFetchDashboardActivityFeed.mockReset();
    mockedFetchDashboardModules.mockReset();
    mockedFetchDashboardModuleByKey.mockReset();
    mockedFetchDashboardWidgets.mockReset().mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      widgets: [],
      summary: { total: 0, byType: {}, bySource: {} },
      filters: { source: null, type: null, limit: 4 },
      deferred: {
        customLayouts: "deferred",
        widgetPreferences: "deferred",
        analyticsCharts: "available",
        weatherWidgets: "deferred",
        todoWidgets: "available",
        analyticsStandalone: "available",
        todosStandalone: "persisted",
        calendarTodoComposition: "available",
        plannerCalendar: "available",
        crossModulePlannerItems: "available",
      },
    });
    mockedFetchLightModeDropdown.mockReset().mockResolvedValue({
      location: {
        label: "Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
      },
      weather: {
        status: "provider_not_configured",
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather unavailable",
        },
        emptyState: { message: "Weather provider is not configured." },
      },
      planner: {
        date: "2026-07-15",
        timezone: "Africa/Cairo",
        eventDates: [],
        todos: [],
      },
    });
    
    // Set default mock response so existing tests pass
    mockedFetchDashboardModules.mockResolvedValue([
      { moduleKey: "academics", title: "Academics" },
      { moduleKey: "admissions", title: "Admissions" },
      { moduleKey: "communication", title: "Communication" },
      { moduleKey: "operations", title: "Operations" },
    ] as unknown as DashboardModulesResult);
  });

  it("renders backend dashboard data when all endpoints succeed", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("School command center")).toBeInTheDocument();
    expect(screen.queryByText("Quick school setup")).not.toBeInTheDocument();
    expect(screen.getByText("Active Students")).toBeInTheDocument();
    expect(screen.getAllByText("125").length).toBeGreaterThan(0);
    expect(screen.getByText(/Absences marked today/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Admissions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Academics setup" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Operations" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("heading", { name: "Homework" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reinforcement" })).toBeInTheDocument();
    expect(
      screen.getByText("Attendance session submitted"),
    ).toBeInTheDocument();
    expect(screen.getByText("add_student")).toBeInTheDocument();
    expect(screen.getByText("Admin: School Admin")).toBeInTheDocument();
    expect(
      screen.getAllByText("Analytics charts are not available in this version.")
        .length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(
      screen.getByText("KPI: Active Students - Value"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/more rows will be included in the exported file/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Alert: attendance.absent_entries_today - Title"),
    ).not.toBeInTheDocument();
    expect(mockedFetchDashboardAlerts).toHaveBeenCalledWith({ limit: 6 });
    expect(mockedFetchDashboardActivityFeed).toHaveBeenCalledWith({ limit: 5 });
  });

  it("moves secondary module cards behind tabs", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    mockedFetchDashboardModules.mockResolvedValue([
      { moduleKey: "academics", title: "Academics" },
      { moduleKey: "operations", title: "Operations" },
    ] as unknown as DashboardModulesResult);

    mockedFetchDashboardModuleByKey.mockImplementation(async (key) => {
      if (key === "academics") {
        return {
          module: { moduleKey: "academics", title: "Academics" },
          overview: {
            quickStats: [
              { key: "homework", label: "Homework", value: 1, tone: "info" },
              { key: "grades", label: "Grades", value: 2, tone: "info" }
            ],
            risks: [],
            actions: []
          },
          widgets: [],
          analytics: { charts: [], availableData: [], plannedCharts: [] },
          sections: [],
          capabilities: {},
          emptyState: null,
          meta: {}
        } as unknown as DashboardModuleResult;
      }
      if (key === "operations") {
        return {
          module: { moduleKey: "operations", title: "Operations" },
          overview: {
            quickStats: [
              { key: "reinforcement", label: "Reinforcement", value: 3, tone: "info" }
            ],
            risks: [],
            actions: []
          },
          widgets: [],
          analytics: { charts: [], availableData: [], plannedCharts: [] },
          sections: [],
          capabilities: {},
          emptyState: null,
          meta: {}
        } as unknown as DashboardModuleResult;
      }
      return null as unknown as DashboardModuleResult;
    });

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("School command center")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Academics" }));

    expect(screen.getByRole("tab", { name: "Academics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Homework")).toBeInTheDocument();
    expect(await screen.findByText("Grades")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Operations" }));

    expect(screen.getByRole("tab", { name: "Operations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Reinforcement")).toBeInTheDocument();
  });

  it("renders dashboard alerts as a single action required panel", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [
          {
            key: "settings.login_identity_missing",
            source: "settings",
            severity: "critical",
            title: "Login identity is not configured",
            description:
              "Students and staff may not be able to access the portal.",
            count: 1,
            action: {
              label: "Configure now",
              target: "/settings/identity",
            },
          },
          {
            key: "communication.email_inactive",
            source: "communication",
            severity: "warning",
            title: "School email connection inactive",
            description:
              "Outbound email notifications may not reach families.",
            count: 1,
            action: {
              label: "Open email settings",
              target: "/communication/settings/email",
            },
          },
        ],
        summary: {
          total: 2,
          critical: 1,
          warning: 1,
          info: 0,
          bySource: {
            settings: 1,
            communication: 1,
          },
        },
      }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("Action Required")).toBeInTheDocument();
    expect(screen.getByText("Needs attention: 2 issues")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/en/attendance/reports",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/settings",
    );
    expect(
      screen.getByText("Login identity is not configured"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Students and staff may not be able to access the portal.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Configure now" }),
    ).toHaveAttribute("href", "/en/settings/identity");
    expect(
      screen.getByText("School email connection inactive"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Outbound email notifications may not reach families."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open email settings" }),
    ).toHaveAttribute("href", "/en/communication/settings/email");
  });

  it("renders empty operational states when alerts and activity are empty", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(
      dashboardSummaryResponse({ cards: {} }),
    );
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({ alerts: [] }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({ items: [] }),
    );

    render(<SchoolDashboardContainer />);

    expect(
      await screen.findByText("No active dashboard alerts"),
    ).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("links dashboard activity overflow to the recent activities page", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({
        pageInfo: {
          limit: 1,
          nextCursor: "cursor-2",
          hasMore: true,
        },
      }),
    );

    render(<SchoolDashboardContainer />);

    await screen.findByText("School command center");

    const loadMoreLink = await screen.findByRole("link", { name: /load more/i });

    expect(loadMoreLink).toHaveAttribute(
      "href",
      "/en/dashboard/recent-activities",
    );
  });

  it("links dashboard alert overflow to the alerts page", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(
      dashboardAlertsResponse({
        alerts: [
          dashboardAlertFixture("settings.login_identity_missing", "settings"),
          dashboardAlertFixture("communication.reports_waiting", "communication"),
          dashboardAlertFixture("communication.email_inactive", "communication"),
          dashboardAlertFixture("admissions.pending_decisions", "admissions"),
          dashboardAlertFixture("reinforcement.hidden_task", "reinforcement"),
          dashboardAlertFixture("reinforcement.overdue_tasks", "reinforcement"),
          dashboardAlertFixture("communication.extra_warning", "communication"),
        ],
        summary: {
          total: 8,
          critical: 2,
          warning: 6,
          info: 0,
          bySource: {
            settings: 1,
            communication: 2,
            admissions: 3,
            reinforcement: 2,
          },
        },
      }),
    );
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    await screen.findByText("School command center");

    const alertsLink = screen.getByRole("link", { name: "View all alerts" });

    expect(alertsLink).toHaveAttribute("href", "/en/dashboard/alerts");
    expect(screen.getByText("Needs attention: 8 issues")).toBeInTheDocument();
    expect(
      screen.queryByText("reinforcement.overdue_tasks"),
    ).not.toBeInTheDocument();
  });

  it("keeps successful endpoint sections visible when one dashboard endpoint fails", async () => {
    mockedFetchDashboardSummary.mockRejectedValue(new Error("Forbidden"));
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(
      await screen.findByText("Dashboard unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("KPI cards unavailable")).toBeInTheDocument();
    expect(screen.getByText("Dashboard cards unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Forbidden")).toHaveLength(3);
    expect(screen.getByText("Action Required")).toBeInTheDocument();
    expect(screen.getByText("Absences marked today")).toBeInTheDocument();
    expect(screen.getByText("Recent activities")).toBeInTheDocument();
    expect(screen.getByText("Attendance session submitted")).toBeInTheDocument();
  });

  it("keeps permitted dashboard sections visible without requesting denied sections", async () => {
    grantedDashboardPermissions = new Set([
      "dashboard.summary.view",
      "dashboard.activity_feed.view",
    ]);
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<SchoolDashboardContainer />);

    expect(await screen.findByText("School command center")).toBeInTheDocument();
    expect(screen.getByText("Recent activities")).toBeInTheDocument();
    expect(screen.queryByText("Action Required")).not.toBeInTheDocument();
    expect(mockedFetchDashboardAlerts).not.toHaveBeenCalled();
    expect(mockedFetchDashboardModules).not.toHaveBeenCalled();
  });

  it("fetches dashboard modules on mount and displays them as tabs, switching tab fetches module details", async () => {
    mockedFetchDashboardSummary.mockResolvedValue(dashboardSummaryResponse());
    mockedFetchDashboardAlerts.mockResolvedValue(dashboardAlertsResponse());
    mockedFetchDashboardActivityFeed.mockResolvedValue(dashboardActivityFeedResponse());
    
    mockedFetchDashboardModules.mockResolvedValue([
      {
        moduleKey: "admissions",
        source: "admissions",
        title: "Admissions",
        description: "Admissions module description",
        status: "available",
        iconKey: "users",
        tone: "info",
        frontendRoute: "/admissions",
        sourceRoute: "/admissions",
        summary: {
          widgetCount: 1,
          chartCount: 0,
          availableChartDataCount: 0,
          riskCount: 0,
          actionCount: 0,
        },
        capabilities: {
          widgets: "available",
          analyticsDefinitions: "deferred",
          analyticsData: "deferred",
          drilldowns: "deferred",
          exports: "deferred",
          realtime: "deferred",
        },
      },
    ]);

    mockedFetchDashboardModuleByKey.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      module: {
        moduleKey: "admissions",
        source: "admissions",
        title: "Admissions",
        description: "Admissions details",
        status: "available",
        iconKey: "users",
        tone: "info",
        frontendRoute: "/admissions",
        sourceRoute: "/admissions",
      },
      overview: {
        quickStats: [],
        risks: [],
        actions: [],
      },
      widgets: [],
      analytics: {
        charts: [],
        availableData: [],
        plannedCharts: [],
      },
      sections: [],
      capabilities: {
        widgets: "available",
        analyticsDefinitions: "deferred",
        analyticsData: "deferred",
        drilldowns: "deferred",
        exports: "deferred",
        realtime: "deferred",
      },
      emptyState: null,
      meta: {
        source: "dashboard_module_page",
        version: "v1",
        dataFreshness: "live",
      },
    });

    render(<SchoolDashboardContainer />);

    // Dynamic Admissions tab should render
    const admissionsTab = await screen.findByRole("tab", { name: "Admissions" });
    expect(admissionsTab).toBeInTheDocument();

    // Click on Admissions tab
    fireEvent.click(admissionsTab);

    // Verify dynamic fetch is called
    await waitFor(() => {
      expect(mockedFetchDashboardModuleByKey).toHaveBeenCalledWith("admissions");
    });
  });
});

function dashboardAlertFixture(
  key: string,
  source: "admissions" | "communication" | "reinforcement" | "settings",
) {
  return {
    key,
    source,
    severity: source === "settings" ? "critical" : "warning",
    title: key,
    description: `${key} needs attention.`,
    count: 1,
    action: {
      label: `Open ${source}`,
      target: `/${source}`,
    },
  } as const;
}
