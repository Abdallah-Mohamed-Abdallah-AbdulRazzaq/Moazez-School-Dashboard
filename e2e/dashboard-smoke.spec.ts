import { expect, test, type Page, type Route } from "@playwright/test";

const authUser = {
  id: "user-1",
  firstName: "Dashboard",
  lastName: "Tester",
  email: "dashboard@example.com",
  userType: "SCHOOL_USER",
  status: "ACTIVE",
  mustChangePassword: false,
  activeMembership: {
    membershipId: "membership-1",
    organizationId: "organization-1",
    schoolId: "school-1",
    roleId: "role-1",
    roleKey: "admin",
    permissions: [
      "dashboard.summary.view",
      "dashboard.alerts.view",
      "dashboard.activity_feed.view",
    ],
  },
};

async function installDashboardApiMocks(page: Page) {
  await page.context().addCookies([
    {
      name: "moazez_session",
      value: "dashboard-session",
      url: "http://localhost:3000",
    },
    {
      name: "moazez_refresh_token",
      value: "dashboard-refresh",
      url: "http://localhost:3000",
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem("moazez_access_token", "dashboard-token");
    localStorage.setItem("moazez_refresh_token", "dashboard-refresh");
    document.cookie = "moazez_session=dashboard-session; Path=/; SameSite=Lax";
    document.cookie = "moazez_refresh_token=dashboard-refresh; Path=/; SameSite=Lax";
  });

  await page.route("**/api/v1/**", async (route: Route) => {
    const pathname = new URL(route.request().url()).pathname.replace(
      "/api/v1",
      "",
    );

    const fulfillJson = (responseBody: unknown) =>
      route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify(responseBody),
      });

    if (pathname === "/auth/me") return fulfillJson(authUser);
    if (pathname === "/auth/refresh") {
      return fulfillJson({
        accessToken: "dashboard-token",
        refreshToken: "dashboard-refresh",
        user: authUser,
      });
    }
    if (pathname === "/settings/branding") {
      return fulfillJson({ schoolNameEn: "Example School" });
    }
    if (pathname === "/academics/structure/years") {
      return fulfillJson([{ id: "year-1", nameEn: "2025/2026" }]);
    }
    if (pathname === "/academics/structure/terms") {
      return fulfillJson([{ id: "term-1", nameEn: "Term 1" }]);
    }
    if (pathname === "/dashboard/summary") {
      return fulfillJson(dashboardSummaryResponse);
    }
    if (pathname === "/dashboard/alerts") {
      return fulfillJson(dashboardAlertsResponse);
    }
    if (pathname === "/dashboard/activity-feed") {
      const cursor = new URL(route.request().url()).searchParams.get("cursor");
      return fulfillJson(
        cursor === "cursor-2"
          ? dashboardActivityFeedSecondPageResponse
          : dashboardActivityFeedResponse,
      );
    }

    return fulfillJson({});
  });
}

test.describe("dashboard backend contract smoke", () => {
  test("renders summary, alerts, and activity feed from mocked dashboard endpoints", async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Dashboard smoke coverage runs in Chromium to keep the local suite focused.",
    );

    await installDashboardApiMocks(page);
    await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("School command center")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
    await expect(page.getByText("Active Students").first()).toBeVisible();
    await expect(page.getByText("Open Applications").first()).toBeVisible();
    await expect(page.getByText(/Absences marked today/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admissions" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Academics setup" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Homework" })).toBeHidden();
    await expect(page.getByText("Attendance session submitted")).toBeVisible();
    await expect(
      page.getByText("Analytics charts are not available in this version.").first(),
    ).toBeVisible();

    await page.getByRole("link", { name: /load more/i }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/recent-activities/);
    await expect(
      page.getByRole("heading", { name: "Recent activities" }),
    ).toBeVisible();
    await expect(
      page.getByText("attendance.session.submit", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "All sources" }).click();
    await page.getByRole("button", { name: "Attendance", exact: true }).click();
    const filteredActivityRequest = page.waitForRequest((request) => {
      const requestUrl = new URL(request.url());
      return (
        requestUrl.pathname.endsWith("/dashboard/activity-feed") &&
        requestUrl.searchParams.get("source") === "attendance"
      );
    });
    await page.getByRole("button", { name: "Apply filters" }).click();
    await filteredActivityRequest;

    await page.getByRole("button", { name: /load more/i }).click();
    await expect(page.getByText("Student profile updated")).toBeVisible();
  });
});

const dashboardSummaryResponse = {
  generatedAt: "2026-06-13T10:00:00.000Z",
  school: {
    name: "Example School",
    timezone: "Africa/Cairo",
    locale: null,
  },
  academicContext: {
    academicYear: { id: "year-1", name: "2025/2026" },
    term: { id: "term-1", name: "Term 1" },
  },
  cards: {
    admissions: {
      totalLeads: 9,
      openApplications: 4,
      submittedApplications: 2,
      acceptedApplications: 1,
      pendingTests: 0,
      pendingInterviews: 0,
      recentDecisions: 2,
    },
    students: {
      activeStudents: 125,
      activeEnrollments: 118,
      guardians: 190,
      newEnrollmentsLast30Days: 6,
      withdrawnEnrollments: 1,
    },
    attendance: {
      todaySessions: 8,
      submittedSessionsToday: 6,
      pendingSessionsToday: 2,
      absentEntriesToday: 3,
      lateEntriesToday: 1,
      pendingExcuses: 2,
    },
    academics: {
      activeAcademicYears: 1,
      hasCurrentAcademicYear: true,
      terms: 3,
      stages: 6,
      grades: 5,
      sections: 4,
      classrooms: 4,
      subjects: 4,
      rooms: 4,
      teacherAllocations: 1,
      curricula: 0,
      lessonPlans: 0,
      timetableEntries: 0,
      publishedTimetablePublications: 0,
    },
    communication: {
      activeAnnouncements: 2,
      recentMessages: 0,
      activeConversations: 14,
      pendingModerationReports: 4,
    },
  },
  alertsPreview: [],
  deferred: {
    activityFeed: "deferred",
    alertsEngine: "deferred",
    analyticsBuilder: "out_of_scope_v1",
  },
};

const dashboardAlertsResponse = {
  generatedAt: "2026-06-13T10:00:00.000Z",
  alerts: [
    {
      key: "attendance.absent_entries_today",
      source: "attendance",
      severity: "critical",
      title: "Absences marked today",
      description: "There are 3 absent attendance entries for today.",
      count: 3,
      action: {
        label: "Review absences",
        target: "/attendance/absences",
      },
    },
  ],
  summary: {
    total: 3,
    critical: 3,
    warning: 0,
    info: 0,
    bySource: { attendance: 3 },
  },
  deferred: {},
};

const dashboardActivityFeedResponse = {
  generatedAt: "2026-06-13T10:00:00.000Z",
  items: [
    {
      activityId: "audit:audit-1",
      source: "attendance",
      eventType: "attendance.session.submit",
      title: "Attendance session submitted",
      description: "A roll-call attendance session was submitted.",
      actor: {
        id: "actor-1",
        displayName: "School Admin",
        type: "admin",
      },
      subject: {
        type: "attendance_session",
        id: "session-1",
        label: "Attendance Session",
      },
      occurredAt: "2026-06-13T10:00:00.000Z",
    },
  ],
  pageInfo: {
    limit: 1,
    nextCursor: "cursor-2",
    hasMore: true,
  },
  filters: {
    source: null,
    eventType: null,
    actorType: null,
    dateFrom: null,
    dateTo: null,
  },
  deferred: {},
};

const dashboardActivityFeedSecondPageResponse = {
  generatedAt: "2026-06-13T10:05:00.000Z",
  items: [
    {
      activityId: "audit:audit-2",
      source: "students",
      eventType: "students.profile.update",
      title: "Student profile updated",
      description: "A student profile was updated.",
      actor: {
        id: "actor-2",
        displayName: "Registrar",
        type: "admin",
      },
      subject: {
        type: "student",
        id: "student-1",
        label: "Mona Ahmed",
      },
      occurredAt: "2026-06-13T09:00:00.000Z",
    },
  ],
  pageInfo: {
    limit: 1,
    nextCursor: null,
    hasMore: false,
  },
  filters: {
    source: null,
    eventType: null,
    actorType: null,
    dateFrom: null,
    dateTo: null,
  },
  deferred: {
    readState: "deferred",
    pinning: "deferred",
    realtime: "deferred",
    analyticsBuilder: "deferred",
  },
};
