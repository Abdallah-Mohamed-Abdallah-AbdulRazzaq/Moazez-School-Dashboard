import { describe, expect, it } from "vitest";
import {
  dashboardExportRowsFromViewModels,
  mapDashboardActivityFeedToViewModel,
  mapDashboardAlertsToViewModel,
  mapDashboardResponsesToViewModel,
  mapDashboardSummaryToViewModel,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import {
  dashboardActivityFeedResponse,
  dashboardAlertsResponse,
  dashboardSummaryResponse,
} from "@/features/dashboard/__tests__/dashboardTestFixtures";

describe("dashboardViewMapper", () => {
  it("maps backend cards, alerts, and activity without generated chart data", () => {
    const summaryResponse = dashboardSummaryResponse();
    const alertsResponse = dashboardAlertsResponse();
    const activityFeedResponse = dashboardActivityFeedResponse();

    const dashboardViewModel = mapDashboardResponsesToViewModel(
      summaryResponse,
      alertsResponse,
      activityFeedResponse,
    );

    expect(dashboardViewModel.context.schoolName).toBe("Example School");
    expect(dashboardViewModel.topKpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "activeStudents",
          label: "Active Students",
          value: 125,
        }),
        expect.objectContaining({
          id: "openApplications",
          label: "Open Applications",
          value: 4,
        }),
      ]),
    );
    expect(dashboardViewModel.alerts).toEqual([
      expect.objectContaining({
        id: "attendance.absent_entries_today",
        severity: "critical",
        title: "Absences marked today",
      }),
    ]);
    expect(dashboardViewModel.moduleCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "admissions",
          title: "Admissions",
          state: "warning",
        }),
        expect.objectContaining({
          id: "academics",
          title: "Academics setup",
          setupItems: expect.arrayContaining([
            expect.objectContaining({ label: "Timetable" }),
          ]),
        }),
      ]),
    );
    expect(dashboardViewModel.activities).toEqual([
      expect.objectContaining({
        id: "audit:audit-1",
        title: "Attendance session submitted",
        actorName: "School Admin",
        actorType: "admin",
        eventType: "attendance.session.submit",
        subjectLabel: "Attendance Session",
      }),
    ]);
    expect(dashboardViewModel.activityFeed.pageInfo.hasMore).toBe(false);
    expect(
      dashboardViewModel.deferredFeatures.some((feature) =>
        feature.description.includes("Analytics charts are not available"),
      ),
    ).toBe(true);
  });

  it("uses honest academic context labels when active year or term is absent", () => {
    const summaryResponse = dashboardSummaryResponse({
      academicContext: {
        academicYear: null,
        term: null,
      },
    });

    const dashboardViewModel = mapDashboardResponsesToViewModel(
      summaryResponse,
      dashboardAlertsResponse({ alerts: [] }),
      dashboardActivityFeedResponse({ items: [] }),
    );

    expect(dashboardViewModel.context.academicYearName).toBe(
      "No active academic year",
    );
    expect(dashboardViewModel.context.termName).toBe("No active term");
  });

  it("maps activity feed pagination and deferred lifecycle flags", () => {
    const dashboardViewModel = mapDashboardResponsesToViewModel(
      dashboardSummaryResponse(),
      dashboardAlertsResponse({ alerts: [] }),
      dashboardActivityFeedResponse({
        pageInfo: {
          limit: 1,
          nextCursor: "cursor-2",
          hasMore: true,
        },
        deferred: {
          readState: "deferred",
          pinning: "deferred",
          realtime: "deferred",
        },
      }),
    );

    expect(dashboardViewModel.activityFeed.pageInfo.nextCursor).toBe("cursor-2");
    expect(dashboardViewModel.activityFeed.deferredFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "activityFeed.readState",
          title: "Read state",
        }),
        expect.objectContaining({
          id: "activityFeed.pinning",
          title: "Pinning",
        }),
      ]),
    );
  });

  it("builds export rows from the independently loaded dashboard sections", () => {
    const summary = mapDashboardSummaryToViewModel(dashboardSummaryResponse());
    const alerts = mapDashboardAlertsToViewModel(dashboardAlertsResponse());
    const activityFeed = mapDashboardActivityFeedToViewModel(
      dashboardActivityFeedResponse(),
    );

    expect(
      dashboardExportRowsFromViewModels({ summary, alerts, activityFeed }),
    ).toEqual(
      expect.arrayContaining([
        { label: "Context - School", value: "Example School" },
        { label: "KPI: Active Students - Value", value: 125 },
        { label: "Module: Admissions - Open applications", value: 4 },
        { label: "Alerts summary - Returned alerts", value: 1 },
        { label: "Alerts summary - Total signals", value: 3 },
        {
          label: "Alert: attendance.absent_entries_today - Title",
          value: "Absences marked today",
        },
        { label: "Activity feed summary - Returned activities", value: 1 },
        {
          label: "Activity: audit:audit-1 - Event type",
          value: "attendance.session.submit",
        },
      ]),
    );
  });

  it("marks unavailable sections honestly in export rows", () => {
    const summary = mapDashboardSummaryToViewModel(dashboardSummaryResponse());

    expect(dashboardExportRowsFromViewModels({ summary })).toEqual(
      expect.arrayContaining([
        { label: "Alerts summary - Status", value: "Unavailable" },
        { label: "Activity feed summary - Status", value: "Unavailable" },
      ]),
    );
  });
});
