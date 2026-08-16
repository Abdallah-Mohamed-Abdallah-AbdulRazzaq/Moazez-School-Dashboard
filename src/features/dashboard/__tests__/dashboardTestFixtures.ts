import type {
  DashboardActivityFeedResponse,
  DashboardAlertsResponse,
  DashboardSummaryResponse,
} from "@/features/dashboard/types/dashboardApi.types";

export function dashboardSummaryResponse(
  overrides: Partial<DashboardSummaryResponse> = {},
): DashboardSummaryResponse {
  return {
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
        pendingTests: 1,
        pendingInterviews: 1,
        recentDecisions: 2,
      },
      students: {
        activeStudents: 125,
        activeEnrollments: 118,
        guardians: 190,
        newEnrollmentsLast30Days: 6,
        withdrawnEnrollments: 1,
      },
      academics: {
        activeAcademicYears: 1,
        hasCurrentAcademicYear: true,
        terms: 2,
        stages: 3,
        grades: 9,
        sections: 18,
        classrooms: 18,
        subjects: 12,
        rooms: 20,
        teacherAllocations: 35,
        curricula: 11,
        lessonPlans: 44,
        timetableEntries: 70,
        publishedTimetablePublications: 1,
      },
      attendance: {
        todaySessions: 8,
        submittedSessionsToday: 6,
        pendingSessionsToday: 2,
        absentEntriesToday: 3,
        lateEntriesToday: 1,
        pendingExcuses: 2,
      },
    },
    alertsPreview: [],
    deferred: {
      activityFeed: "deferred",
      alertsEngine: "deferred",
      analyticsBuilder: "out_of_scope_v1",
    },
    meta: { source: "dashboard_summary", freshness: { dataMode: "request_time_snapshot", cacheStatus: "not_used", realtimeStatus: "not_used" } },
    ...overrides,
  };
}

export function dashboardAlertsResponse(
  overrides: Partial<DashboardAlertsResponse> = {},
): DashboardAlertsResponse {
  return {
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
      bySource: {
        attendance: 3,
      },
    },
    deferred: {},
    meta: { source: "dashboard_alerts", freshness: { dataMode: "request_time_snapshot", cacheStatus: "not_used", realtimeStatus: "not_used" } },
    ...overrides,
  };
}

export function dashboardActivityFeedResponse(
  overrides: Partial<DashboardActivityFeedResponse> = {},
): DashboardActivityFeedResponse {
  return {
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
      limit: 20,
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
    deferred: {},
    meta: { source: "dashboard_activity_feed", capability: "available", freshness: { dataMode: "request_time_snapshot", cacheStatus: "not_used", realtimeStatus: "not_used" } },
    ...overrides,
  };
}
