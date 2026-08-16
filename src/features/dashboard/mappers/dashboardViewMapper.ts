import type {
  DashboardActivityFeedItem,
  DashboardActivityFeedResponse,
  DashboardActorType,
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardAlertsResponse,
  DashboardSource,
  DashboardSummaryCards,
  DashboardSummaryResponse,
} from "@/features/dashboard/types/dashboardApi.types";

export type DashboardTone =
  | "critical"
  | "warning"
  | "info"
  | "success"
  | "neutral";

export type DashboardModuleState = "healthy" | "warning" | "empty" | "setup";

export interface DashboardContextViewModel {
  generatedAt: string;
  schoolName: string;
  timezone: string;
  academicYearName: string;
  termName: string;
}

export interface DashboardTopKpi {
  id: "activeStudents" | "newEnrollments" | "openApplications" | "activeConversations";
  label: string;
  value: number;
  subtitle: string;
  subtitleValues: Record<string, number>;
  tone: DashboardTone;
}

export interface DashboardViewAlert {
  id: string;
  source: DashboardSource;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
  tone: DashboardTone;
  count: number;
  actionLabel?: string;
  actionTarget?: string;
}

export interface DashboardAlertSummaryViewModel {
  total: number;
  critical: number;
  warning: number;
  info: number;
  bySource: Partial<Record<DashboardSource, number>>;
}

export interface DashboardModuleMetric {
  label: string;
  value: number;
  tone: DashboardTone;
}

export interface DashboardSetupItem {
  label: string;
  status: "ready" | "needsAttention" | "notConfigured";
  detail: string;
}

export interface DashboardModuleCard {
  id: DashboardSource;
  title: string;
  state: DashboardModuleState;
  summary: string;
  metrics: DashboardModuleMetric[];
  highlights: string[];
  actionLabel?: string;
  actionTarget?: string;
  setupItems?: DashboardSetupItem[];
}

export interface DashboardViewActivity {
  id: string;
  title: string;
  description: string;
  source: DashboardSource;
  eventType: string;
  actorName: string;
  actorType: DashboardActorType;
  subjectLabel: string;
  subjectType: string;
  occurredAt: string;
}

export interface DashboardActivityFeedViewModel {
  generatedAt: string;
  items: DashboardViewActivity[];
  pageInfo: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  deferredFeatures: DashboardDeferredFeature[];
}

export interface DashboardAlertsViewModel {
  generatedAt: string;
  alerts: DashboardViewAlert[];
  summary: DashboardAlertSummaryViewModel;
  deferredFeatures: DashboardDeferredFeature[];
}

export interface DashboardDeferredFeature {
  id: string;
  title: string;
  description: string;
}

export interface DashboardExportRow {
  label: string;
  value: string | number;
}

export interface DashboardViewModel {
  context: DashboardContextViewModel;
  topKpis: DashboardTopKpi[];
  alerts: DashboardViewAlert[];
  alertSummary: DashboardAlertSummaryViewModel;
  moduleCards: DashboardModuleCard[];
  activities: DashboardViewActivity[];
  activityFeed: DashboardActivityFeedViewModel;
  deferredFeatures: DashboardDeferredFeature[];
  exportRows: DashboardExportRow[];
}

export interface DashboardSummaryViewModel {
  context: DashboardContextViewModel;
  topKpis: DashboardTopKpi[];
  moduleCards: DashboardModuleCard[];
  deferredFeatures: DashboardDeferredFeature[];
  exportRows: DashboardExportRow[];
}

const severityTone: Record<DashboardAlertSeverity, DashboardTone> = {
  critical: "critical",
  warning: "warning",
  info: "info",
};

export function mapDashboardResponsesToViewModel(
  summaryResponse: DashboardSummaryResponse,
  alertsResponse: DashboardAlertsResponse,
  activityFeedResponse: DashboardActivityFeedResponse,
): DashboardViewModel {
  const activityFeed = mapDashboardActivityFeedToViewModel(activityFeedResponse);
  const alerts = mapDashboardAlertsToViewModel(alertsResponse);
  const summary = mapDashboardSummaryToViewModel(summaryResponse, alertsResponse);

  return {
    context: summary.context,
    topKpis: summary.topKpis,
    alerts: alerts.alerts,
    alertSummary: alerts.summary,
    moduleCards: summary.moduleCards,
    activities: activityFeed.items,
    activityFeed,
    deferredFeatures: dashboardDeferredFeatures(summaryResponse, activityFeedResponse),
    exportRows: dashboardExportRowsFromViewModels({
      summary,
      alerts,
      activityFeed,
    }),
  };
}

export function mapDashboardSummaryToViewModel(
  summaryResponse: DashboardSummaryResponse,
  alertsResponse?: DashboardAlertsResponse,
): DashboardSummaryViewModel {
  const context = dashboardContext(summaryResponse);
  const summaryViewModel: DashboardSummaryViewModel = {
    context,
    topKpis: dashboardTopKpis(summaryResponse.cards),
    moduleCards: dashboardModuleCards(summaryResponse.cards),
    deferredFeatures: dashboardSummaryDeferredFeatures(summaryResponse),
    exportRows: [],
  };

  return {
    ...summaryViewModel,
    exportRows: dashboardExportRowsFromViewModels({
      summary: summaryViewModel,
      alerts: alertsResponse
        ? mapDashboardAlertsToViewModel(alertsResponse)
        : undefined,
    }),
  };
}

export function mapDashboardActivityFeedToViewModel(
  activityFeedResponse: DashboardActivityFeedResponse,
): DashboardActivityFeedViewModel {
  return {
    generatedAt: activityFeedResponse.generatedAt,
    items: activityFeedResponse.items.map(dashboardActivity),
    pageInfo: activityFeedResponse.pageInfo,
    deferredFeatures: dashboardActivityDeferredFeatures(activityFeedResponse),
  };
}

export function mapDashboardAlertsToViewModel(
  alertsResponse: DashboardAlertsResponse,
): DashboardAlertsViewModel {
  return {
    generatedAt: alertsResponse.generatedAt,
    alerts: alertsResponse.alerts.map(dashboardAlert),
    summary: alertsResponse.summary,
    deferredFeatures: dashboardAlertDeferredFeatures(alertsResponse),
  };
}

export function appendDashboardActivityFeedPage(
  currentActivityFeed: DashboardActivityFeedViewModel,
  nextActivityFeedResponse: DashboardActivityFeedResponse,
): DashboardActivityFeedViewModel {
  const nextActivityFeed = mapDashboardActivityFeedToViewModel(
    nextActivityFeedResponse,
  );

  return {
    ...nextActivityFeed,
    items: [...currentActivityFeed.items, ...nextActivityFeed.items],
  };
}

export function dashboardExportRowsFromViewModels({
  activityFeed,
  alerts,
  summary,
}: {
  activityFeed?: DashboardActivityFeedViewModel;
  alerts?: DashboardAlertsViewModel;
  summary: DashboardSummaryViewModel;
}): DashboardExportRow[] {
  const exportRows: DashboardExportRow[] = [
    dashboardExportRow("Context", "School", summary.context.schoolName),
    dashboardExportRow(
      "Context",
      "Academic year",
      summary.context.academicYearName,
    ),
    dashboardExportRow("Context", "Term", summary.context.termName),
    dashboardExportRow("Context", "Generated at", summary.context.generatedAt),
    dashboardExportRow("Context", "Timezone", summary.context.timezone),
  ];

  exportRows.push(
    ...summary.topKpis.flatMap((topKpi) => [
      dashboardExportRow(`KPI: ${topKpi.label}`, "Value", topKpi.value),
      dashboardExportRow(`KPI: ${topKpi.label}`, "Subtitle", topKpi.subtitle),
      dashboardExportRow(`KPI: ${topKpi.label}`, "Tone", topKpi.tone),
    ]),
  );

  exportRows.push(
    ...summary.moduleCards.flatMap((moduleCard) => [
      dashboardExportRow(`Module: ${moduleCard.title}`, "State", moduleCard.state),
      dashboardExportRow(
        `Module: ${moduleCard.title}`,
        "Summary",
        moduleCard.summary,
      ),
      ...moduleCard.metrics.map((metricEntry) =>
        dashboardExportRow(
          `Module: ${moduleCard.title}`,
          metricEntry.label,
          metricEntry.value,
        ),
      ),
      ...(moduleCard.setupItems ?? []).map((setupItem) =>
        dashboardExportRow(
          `Module: ${moduleCard.title}`,
          setupItem.label,
          `${setupItem.status}: ${setupItem.detail}`,
        ),
      ),
      ...moduleCard.highlights.map((highlight, highlightIndex) =>
        dashboardExportRow(
          `Module: ${moduleCard.title}`,
          `Highlight ${highlightIndex + 1}`,
          highlight,
        ),
      ),
    ]),
  );

  if (alerts) {
    exportRows.push(
      dashboardExportRow("Alerts summary", "Generated at", alerts.generatedAt),
      dashboardExportRow("Alerts summary", "Returned alerts", alerts.alerts.length),
      dashboardExportRow("Alerts summary", "Total signals", alerts.summary.total),
      dashboardExportRow("Alerts summary", "Critical", alerts.summary.critical),
      dashboardExportRow("Alerts summary", "Warnings", alerts.summary.warning),
      dashboardExportRow("Alerts summary", "Info", alerts.summary.info),
      ...Object.entries(alerts.summary.bySource).map(([source, count]) =>
        dashboardExportRow("Alerts by source", source, count),
      ),
      ...alerts.alerts.flatMap((alertEntry) => [
        dashboardExportRow(`Alert: ${alertEntry.id}`, "Source", alertEntry.source),
        dashboardExportRow(
          `Alert: ${alertEntry.id}`,
          "Severity",
          alertEntry.severity,
        ),
        dashboardExportRow(`Alert: ${alertEntry.id}`, "Title", alertEntry.title),
        dashboardExportRow(
          `Alert: ${alertEntry.id}`,
          "Description",
          alertEntry.description,
        ),
        dashboardExportRow(`Alert: ${alertEntry.id}`, "Count", alertEntry.count),
        dashboardExportRow(
          `Alert: ${alertEntry.id}`,
          "Action label",
          alertEntry.actionLabel ?? "None",
        ),
        dashboardExportRow(
          `Alert: ${alertEntry.id}`,
          "Action target",
          alertEntry.actionTarget ?? "None",
        ),
      ]),
    );
  } else {
    exportRows.push(
      dashboardExportRow("Alerts summary", "Status", "Unavailable"),
    );
  }

  if (activityFeed) {
    exportRows.push(
      dashboardExportRow(
        "Activity feed summary",
        "Generated at",
        activityFeed.generatedAt,
      ),
      dashboardExportRow(
        "Activity feed summary",
        "Returned activities",
        activityFeed.items.length,
      ),
      dashboardExportRow(
        "Activity feed summary",
        "Limit",
        activityFeed.pageInfo.limit,
      ),
      dashboardExportRow(
        "Activity feed summary",
        "Next cursor",
        activityFeed.pageInfo.nextCursor ?? "None",
      ),
      dashboardExportRow(
        "Activity feed summary",
        "Has more",
        activityFeed.pageInfo.hasMore ? "Yes" : "No",
      ),
      ...activityFeed.items.flatMap((activityEntry) => [
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Source",
          activityEntry.source,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Event type",
          activityEntry.eventType,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Title",
          activityEntry.title,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Description",
          activityEntry.description,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Actor",
          activityEntry.actorName,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Actor type",
          activityEntry.actorType,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Subject type",
          activityEntry.subjectType,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Subject label",
          activityEntry.subjectLabel,
        ),
        dashboardExportRow(
          `Activity: ${activityEntry.id}`,
          "Occurred at",
          activityEntry.occurredAt,
        ),
      ]),
    );
  } else {
    exportRows.push(
      dashboardExportRow("Activity feed summary", "Status", "Unavailable"),
    );
  }

  return exportRows;
}

function dashboardExportRow(
  section: string,
  field: string,
  value: string | number,
): DashboardExportRow {
  return {
    label: `${section} - ${field}`,
    value,
  };
}

function dashboardContext(
  summaryResponse: DashboardSummaryResponse,
): DashboardContextViewModel {
  return {
    generatedAt: summaryResponse.generatedAt,
    schoolName: summaryResponse.school.name ?? "School",
    timezone: summaryResponse.school.timezone,
    academicYearName:
      summaryResponse.academicContext.academicYear?.name ?? "No active academic year",
    termName: summaryResponse.academicContext.term?.name ?? "No active term",
  };
}

function dashboardTopKpis(cards: DashboardSummaryCards): DashboardTopKpi[] {
  return [
    topKpi(
      "activeStudents",
      "Active Students",
      cards.students?.activeStudents,
      `${cards.students?.activeEnrollments ?? 0} active enrollments`,
      "info",
      { count: cards.students?.activeEnrollments ?? 0 },
    ),
    topKpi(
      "newEnrollments",
      "New Enrollments",
      cards.students?.newEnrollmentsLast30Days,
      "Last 30 days",
      "success",
    ),
    topKpi(
      "openApplications",
      "Open Applications",
      cards.admissions?.openApplications,
      `${cards.admissions?.submittedApplications ?? 0} submitted, ${
        cards.admissions?.acceptedApplications ?? 0
      } accepted`,
      "warning",
      {
        submitted: cards.admissions?.submittedApplications ?? 0,
        accepted: cards.admissions?.acceptedApplications ?? 0,
      },
    ),
    topKpi(
      "activeConversations",
      "Conversations",
      cards.communication?.activeConversations,
      `${cards.communication?.pendingModerationReports ?? 0} moderation reports`,
      cards.communication?.pendingModerationReports ? "critical" : "info",
      { count: cards.communication?.pendingModerationReports ?? 0 },
    ),
  ].filter((kpi): kpi is DashboardTopKpi => kpi !== null);
}

function topKpi(
  id: DashboardTopKpi["id"],
  label: string,
  kpiValue: number | undefined,
  subtitle: string,
  tone: DashboardTone,
  subtitleValues: Record<string, number> = {},
): DashboardTopKpi | null {
  if (typeof kpiValue !== "number" || !Number.isFinite(kpiValue)) {
    return null;
  }

  return { id, label, value: kpiValue, subtitle, subtitleValues, tone };
}

function dashboardAlert(alertEntry: DashboardAlert): DashboardViewAlert {
  return {
    id: alertEntry.key,
    source: alertEntry.source,
    title: alertEntry.title,
    description: alertEntry.description,
    severity: alertEntry.severity,
    tone: severityTone[alertEntry.severity],
    count: alertEntry.count,
    actionLabel: alertEntry.action?.label,
    actionTarget: alertEntry.action?.target,
  };
}

function dashboardModuleCards(cards: DashboardSummaryCards): DashboardModuleCard[] {
  return [
    admissionsCard(cards),
    communicationCard(cards),
    studentsCard(cards),
    academicsCard(cards),
    behaviorCard(cards),
    attendanceCard(cards),
    reinforcementCard(cards),
    gradesCard(cards),
    homeworkCard(cards),
  ];
}

function admissionsCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const admissions = cards.admissions;
  const openApplications = admissions?.openApplications ?? 0;

  return {
    id: "admissions",
    title: "Admissions",
    state: openApplications > 0 ? "warning" : "healthy",
    summary:
      openApplications > 0
        ? `${openApplications} applications need admissions follow-up.`
        : "No admissions work is currently waiting.",
    metrics: [
      metric("Total leads", admissions?.totalLeads),
      metric("Open applications", admissions?.openApplications, "warning"),
      metric("Submitted", admissions?.submittedApplications, "warning"),
      metric("Accepted", admissions?.acceptedApplications, "success"),
      metric("Pending tests", admissions?.pendingTests),
      metric("Pending interviews", admissions?.pendingInterviews),
      metric("Recent decisions", admissions?.recentDecisions, "info"),
    ],
    highlights: [
      highlightIfPositive(openApplications, "Open applications need review"),
      highlightIfPositive(
        admissions?.recentDecisions ?? 0,
        "Recent decisions recorded",
      ),
    ].filter(Boolean),
    actionLabel: "View admissions",
    actionTarget: "/admissions/applications",
  };
}

function communicationCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const communication = cards.communication;
  const moderationReports = communication?.pendingModerationReports ?? 0;

  return {
    id: "communication",
    title: "Communication",
    state: moderationReports > 0 ? "warning" : "healthy",
    summary:
      moderationReports > 0
        ? `${moderationReports} moderation reports need review.`
        : "Communication channels look clear.",
    metrics: [
      metric("Active conversations", communication?.activeConversations, "info"),
      metric("Active announcements", communication?.activeAnnouncements, "info"),
      metric("Moderation reports", moderationReports, "critical"),
      metric("Recent messages", communication?.recentMessages),
    ],
    highlights: [
      highlightIfPositive(moderationReports, "Review moderation reports"),
    ].filter(Boolean),
    actionLabel: moderationReports > 0 ? "Review moderation" : "View communication",
    actionTarget:
      moderationReports > 0 ? "/communication/moderation" : "/communication",
  };
}

function studentsCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const students = cards.students;

  return {
    id: "students",
    title: "Students",
    state: "healthy",
    summary: "Current student and guardian population.",
    metrics: [
      metric("Active students", students?.activeStudents, "info"),
      metric("Active enrollments", students?.activeEnrollments, "success"),
      metric("Guardians", students?.guardians, "info"),
      metric("New enrollments", students?.newEnrollmentsLast30Days, "success"),
      metric("Withdrawn enrollments", students?.withdrawnEnrollments),
    ],
    highlights: [
      students?.withdrawnEnrollments
        ? "Withdrawn enrollments exist"
        : "No withdrawn enrollments",
    ],
    actionLabel: "View students",
    actionTarget: "/students-guardians/students",
  };
}

function academicsCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const academics = cards.academics;
  const setupItems = academicsSetupItems(cards);
  const needsSetup = setupItems.some((setupItem) => setupItem.status !== "ready");

  return {
    id: "academics",
    title: "Academics setup",
    state: needsSetup ? "setup" : "healthy",
    summary: needsSetup
      ? "Academic structure exists, but setup is not complete."
      : "Academic setup is ready.",
    metrics: [
      metric("Academic years", academics?.activeAcademicYears, "info"),
      metric("Terms", academics?.terms, "info"),
      metric("Stages", academics?.stages, "info"),
      metric("Grades", academics?.grades, "info"),
      metric("Sections", academics?.sections, "info"),
      metric("Classrooms", academics?.classrooms, "info"),
      metric("Subjects", academics?.subjects, "info"),
      metric("Rooms", academics?.rooms, "info"),
    ],
    highlights: needsSetup ? ["Setup needs attention"] : ["Setup ready"],
    actionLabel: "Open academics",
    actionTarget: "/academics/overview",
    setupItems,
  };
}

function attendanceCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const attendance = cards.attendance;
  const todaySessions = attendance?.todaySessions ?? 0;

  return {
    id: "attendance",
    title: "Attendance",
    state: todaySessions > 0 ? "healthy" : "empty",
    summary:
      todaySessions > 0
        ? "Attendance sessions are available for today."
        : "No attendance sessions today.",
    metrics: [
      metric("Today sessions", attendance?.todaySessions),
      metric("Submitted today", attendance?.submittedSessionsToday, "success"),
      metric("Pending today", attendance?.pendingSessionsToday, "warning"),
      metric("Absent today", attendance?.absentEntriesToday, "critical"),
      metric("Late today", attendance?.lateEntriesToday, "warning"),
      metric("Pending excuses", attendance?.pendingExcuses),
    ],
    highlights: [
      todaySessions > 0
        ? "Attendance is active today"
        : "No scheduled/submitted sessions for the current term today",
    ],
    actionLabel: "View attendance",
    actionTarget: "/attendance/roll-call",
  };
}

function gradesCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const grades = cards.grades;
  const hasAssessments = (grades?.activeAssessments ?? 0) > 0;

  return {
    id: "grades",
    title: "Grades",
    state: hasAssessments ? "healthy" : "empty",
    summary: hasAssessments
      ? "Assessments are active in the current context."
      : "No active assessments yet.",
    metrics: [
      metric("Active assessments", grades?.activeAssessments),
      metric("Draft assessments", grades?.draftAssessments),
      metric("Published assessments", grades?.publishedAssessments),
      metric("Approved assessments", grades?.approvedAssessments),
      metric("Pending submissions", grades?.pendingSubmissions, "warning"),
      metric("Pending answer reviews", grades?.pendingAnswerReviews, "warning"),
    ],
    highlights: [
      hasAssessments
        ? "Grade tracking is active"
        : "Create or publish assessments to start tracking grade progress",
    ],
    actionLabel: "View grades",
    actionTarget: "/grades/assessments",
  };
}

function homeworkCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const homework = cards.homework;
  const publishedAssignments = homework?.publishedAssignments ?? 0;

  return {
    id: "homework",
    title: "Homework",
    state: publishedAssignments > 0 ? "healthy" : "empty",
    summary:
      publishedAssignments > 0
        ? "Homework assignments are published."
        : "No published assignments yet.",
    metrics: [
      metric("Draft assignments", homework?.draftAssignments),
      metric("Published assignments", publishedAssignments, "success"),
      metric("Closed assignments", homework?.closedAssignments),
      metric("Waiting review", homework?.submissionsWaitingReview, "warning"),
      metric("Reviewed submissions", homework?.reviewedSubmissions, "success"),
      metric("Grade sync pending", homework?.gradeSyncPendingAssignments, "warning"),
    ],
    highlights: [
      publishedAssignments > 0
        ? "Assignments are active"
        : "Create assignments to begin collecting submissions",
    ],
    actionLabel: "View homework",
    actionTarget: "/homework",
  };
}

function behaviorCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const behavior = cards.behavior;
  const negativeRecords = behavior?.negativeRecords ?? 0;

  return {
    id: "behavior",
    title: "Behavior",
    state: negativeRecords > 0 ? "warning" : "healthy",
    summary: "Recent positive and negative behavior records.",
    metrics: [
      metric("Recent records", behavior?.recentRecords, "info"),
      metric("Positive behavior", behavior?.positiveRecords, "success"),
      metric("Negative behavior", negativeRecords, "warning"),
      metric("Pending review", behavior?.pendingReviewRecords, "warning"),
    ],
    highlights: [
      `${behavior?.positiveRecords ?? 0} positive`,
      `${negativeRecords} negative`,
    ],
    actionLabel: "View behavior",
    actionTarget: "/behavior/overview",
  };
}

function reinforcementCard(cards: DashboardSummaryCards): DashboardModuleCard {
  const reinforcement = cards.reinforcement;

  return {
    id: "reinforcement",
    title: "Reinforcement",
    state: "healthy",
    summary: "Operational reinforcement task status.",
    metrics: [
      metric("Active tasks", reinforcement?.activeTasks, "info"),
      metric("Pending reviews", reinforcement?.pendingReviews, "warning"),
      metric("Completed assignments", reinforcement?.completedAssignments, "success"),
      metric("Rewards pending", reinforcement?.rewardsPending, "warning"),
    ],
    highlights: [`${reinforcement?.activeTasks ?? 0} active tasks`],
    actionLabel: "View reinforcement",
    actionTarget: "/reinforcement",
  };
}

function academicsSetupItems(cards: DashboardSummaryCards): DashboardSetupItem[] {
  const academics = cards.academics;
  return [
    setupItem(
      "Academic structure",
      (academics?.stages ?? 0) > 0 &&
        (academics?.grades ?? 0) > 0 &&
        (academics?.sections ?? 0) > 0,
      `${academics?.stages ?? 0} stages, ${academics?.grades ?? 0} grades`,
    ),
    setupItem(
      "Teacher allocations",
      (academics?.teacherAllocations ?? 0) > 1,
      `${academics?.teacherAllocations ?? 0} allocations`,
    ),
    setupItem(
      "Curricula",
      (academics?.curricula ?? 0) > 0,
      `${academics?.curricula ?? 0} active curricula`,
    ),
    setupItem(
      "Lesson plans",
      (academics?.lessonPlans ?? 0) > 0,
      `${academics?.lessonPlans ?? 0} active lesson plans`,
    ),
    setupItem(
      "Timetable",
      (academics?.publishedTimetablePublications ?? 0) > 0,
      `${academics?.timetableEntries ?? 0} entries, ${
        academics?.publishedTimetablePublications ?? 0
      } published`,
    ),
  ];
}

function setupItem(
  label: string,
  isReady: boolean,
  detail: string,
): DashboardSetupItem {
  return {
    label,
    status: isReady ? "ready" : "notConfigured",
    detail,
  };
}

function metric(
  label: string,
  metricValue: number | undefined,
  tone: DashboardTone = "neutral",
): DashboardModuleMetric {
  return {
    label,
    value: typeof metricValue === "number" ? metricValue : 0,
    tone,
  };
}

function highlightIfPositive(metricValue: number, label: string) {
  return metricValue > 0 ? label : "";
}

function dashboardActivity(
  activityEntry: DashboardActivityFeedItem,
): DashboardViewActivity {
  return {
    id: activityEntry.activityId,
    title: activityEntry.title,
    description: activityEntry.description,
    source: activityEntry.source,
    eventType: activityEntry.eventType,
    actorName: activityEntry.actor.displayName,
    actorType: activityEntry.actor.type,
    subjectLabel: activityEntry.subject.label,
    subjectType: activityEntry.subject.type,
    occurredAt: activityEntry.occurredAt,
  };
}

function dashboardDeferredFeatures(
  summaryResponse: DashboardSummaryResponse,
  activityFeedResponse: DashboardActivityFeedResponse,
): DashboardDeferredFeature[] {
  return [
    ...dashboardSummaryDeferredFeatures(summaryResponse),
    ...dashboardActivityDeferredFeatures(activityFeedResponse),
  ];
}

function dashboardSummaryDeferredFeatures(
  summaryResponse: DashboardSummaryResponse,
): DashboardDeferredFeature[] {
  return [
    {
      id: "alertsEngine",
      title: "Full alerts engine",
      description:
        summaryResponse.deferred.alertsEngine === "deferred"
          ? "Showing computed alerts. Full alert lifecycle is not available in this dashboard version."
          : "Full alert lifecycle is available.",
    },
    {
      id: "analyticsBuilder",
      title: "Analytics charts",
      description:
        summaryResponse.deferred.analyticsBuilder === "out_of_scope_v1"
          ? "Analytics charts are not available in this version."
          : "Analytics status is controlled by the backend contract.",
    },
  ];
}

function dashboardActivityDeferredFeatures(
  activityFeedResponse: DashboardActivityFeedResponse,
): DashboardDeferredFeature[] {
  return Object.entries(activityFeedResponse.deferred).map(
    ([featureId, featureStatus]) => ({
      id: `activityFeed.${featureId}`,
      title: activityDeferredTitle(featureId),
      description:
        featureStatus === "deferred"
          ? `${activityDeferredTitle(featureId)} is not available for recent activities yet.`
          : `${activityDeferredTitle(featureId)} status is controlled by the activity feed contract.`,
    }),
  );
}

function dashboardAlertDeferredFeatures(
  alertsResponse: DashboardAlertsResponse,
): DashboardDeferredFeature[] {
  return Object.entries(alertsResponse.deferred).map(
    ([featureId, featureStatus]) => ({
      id: `alerts.${featureId}`,
      title: alertDeferredTitle(featureId),
      description:
        featureStatus === "deferred"
          ? `${alertDeferredTitle(featureId)} is not available for dashboard alerts yet.`
          : `${alertDeferredTitle(featureId)} status is controlled by the alerts contract.`,
    }),
  );
}

function activityDeferredTitle(featureId: string) {
  const featureLabels: Record<string, string> = {
    readState: "Read state",
    pinning: "Pinning",
    realtime: "Realtime updates",
    analyticsBuilder: "Activity analytics",
  };

  return featureLabels[featureId] ?? featureId;
}

function alertDeferredTitle(featureId: string) {
  const featureLabels: Record<string, string> = {
    persistence: "Persistence",
    acknowledge: "Acknowledgement",
    dismiss: "Dismissal",
    snooze: "Snooze",
    realtime: "Realtime updates",
    activityFeed: "Alert activity feed",
  };

  return featureLabels[featureId] ?? featureId;
}
