import { vi } from "vitest";
import enMessages from "@/messages/en.json";

type TranslationValues = Record<string, string | number>;
type TranslationEntry =
  | string
  | ((values: TranslationValues) => string);

const dashboardTranslations: Record<string, TranslationEntry> = {
  "dashboard_new.common.back_to_dashboard": "Back to dashboard",
  "dashboard_new.dashboard.title": "School command center",
  "dashboard_new.dashboard.academic_year": ({ value }) =>
    `Academic Year: ${value}`,
  "dashboard_new.dashboard.term": ({ value }) => `Term: ${value}`,
  "dashboard_new.dashboard.last_updated": ({ value }) =>
    `Last updated: ${value}`,
  "dashboard_new.dashboard.reports": "Reports",
  "dashboard_new.dashboard.settings": "Settings",
  "dashboard_new.dashboard.refresh": "Refresh",
  "dashboard_new.dashboard.count": ({ value }) => `Count: ${value}`,
  "dashboard_new.dashboard.version_notes": "Version notes",
  "dashboard_new.dashboard.unavailable": "Dashboard unavailable",
  "dashboard_new.dashboard.load_failed": "We could not load the dashboard data.",
  "dashboard_new.dashboard.default_error": "Dashboard data could not be loaded.",
  "dashboard_new.dashboard.tabs.aria_label": "Dashboard sections",
  "dashboard_new.dashboard.tabs.overview": "Overview",
  "dashboard_new.dashboard.tabs.academics": "Academics",
  "dashboard_new.dashboard.tabs.admissions": "Admissions",
  "dashboard_new.dashboard.tabs.communication": "Communication",
  "dashboard_new.dashboard.tabs.operations": "Operations",
  "dashboard_new.dashboard.alerts.title": "Action Required",
  "dashboard_new.dashboard.alerts.issue_count": ({ count }) =>
    `Needs attention: ${count} ${Number(count) === 1 ? "issue" : "issues"}`,
  "dashboard_new.dashboard.alerts.view_all": "View all alerts",
  "dashboard_new.dashboard.alerts.empty_title": "No active dashboard alerts",
  "dashboard_new.dashboard.alerts.empty_description":
    "Computed operational alerts will appear here when action is needed.",
  "dashboard_new.dashboard.modules.students.title": "Students",
  "dashboard_new.dashboard.modules.admissions.title": "Admissions",
  "dashboard_new.dashboard.modules.communication.title": "Communication",
  "dashboard_new.dashboard.modules.attendance.title": "Attendance",
  "dashboard_new.dashboard.modules.behavior.title": "Behavior",
  "dashboard_new.dashboard.modules.academics.title": "Academics setup",
  "dashboard_new.dashboard.modules.grades.title": "Grades",
  "dashboard_new.dashboard.modules.homework.title": "Homework",
  "dashboard_new.dashboard.modules.reinforcement.title": "Reinforcement",
  "dashboard_new.dashboard.modules.settings.title": "Settings",
  "dashboard_new.dashboard.module_state.healthy": "Healthy",
  "dashboard_new.dashboard.module_state.warning": "Needs action",
  "dashboard_new.dashboard.module_state.empty": "No activity",
  "dashboard_new.dashboard.module_state.setup": "Needs setup",
  "dashboard_new.dashboard.setup.ready": "Ready",
  "dashboard_new.dashboard.setup.not_configured": "Not configured",
  "dashboard_new.dashboard.top_kpis.activeStudents.label": "Active Students",
  "dashboard_new.dashboard.top_kpis.activeStudents.subtitle": ({ count }) =>
    `${count} active ${Number(count) === 1 ? "enrollment" : "enrollments"}`,
  "dashboard_new.dashboard.top_kpis.newEnrollments.label": "New Enrollments",
  "dashboard_new.dashboard.top_kpis.newEnrollments.subtitle": "Last 30 days",
  "dashboard_new.dashboard.top_kpis.openApplications.label":
    "Open Applications",
  "dashboard_new.dashboard.top_kpis.openApplications.subtitle": ({
    submitted,
    accepted,
  }) =>
    `${submitted} submitted, ${accepted} accepted`,
  "dashboard_new.dashboard.top_kpis.activeConversations.label":
    "Conversations",
  "dashboard_new.dashboard.top_kpis.activeConversations.subtitle": ({
    count,
  }) =>
    `${count} moderation ${Number(count) === 1 ? "report" : "reports"}`,
  "dashboard_new.activity_card.title": "Recent activities",
  "dashboard_new.activity_card.load_more": "Load more",
  "dashboard_new.activity_card.view_all": "View all",
  "dashboard_new.activity_card.empty_title": "No activity yet",
  "dashboard_new.activity_card.empty_description":
    "Recent successful audit events will appear here.",
  "dashboard_new.alerts_page.title": "Dashboard alerts",
  "dashboard_new.alerts_page.description":
    "Computed operational alerts from dashboard source modules.",
  "dashboard_new.alerts_page.showing": ({ definitions, signals }) =>
    `Showing ${definitions} ${Number(definitions) === 1 ? "alert definition" : "alert definitions"} with ${signals} ${Number(signals) === 1 ? "issue signal" : "issue signals"}.`,
  "dashboard_new.alerts_page.count": ({ count }) => `Count: ${count}`,
  "dashboard_new.alerts_page.loading": "Loading dashboard alerts",
  "dashboard_new.alerts_page.empty_title": "No alerts match these filters",
  "dashboard_new.alerts_page.empty_description":
    "Zero-count alerts are excluded by default. Enable them in filters if you need to inspect inactive alert definitions.",
  "dashboard_new.alerts_page.unavailable": "Dashboard alerts unavailable",
  "dashboard_new.alerts_page.load_failed": "We could not load dashboard alerts.",
  "dashboard_new.alerts_page.default_error":
    "Dashboard alerts could not be loaded.",
  "dashboard_new.alerts_page.summary.total": "Total",
  "dashboard_new.alerts_page.summary.critical": "Critical",
  "dashboard_new.alerts_page.summary.warnings": "Warnings",
  "dashboard_new.alerts_page.summary.info": "Info",
  "dashboard_new.activity_page.title": "Recent activities",
  "dashboard_new.activity_page.description":
    "Successful audit events from the active school.",
  "dashboard_new.activity_page.showing": ({ count }) =>
    `Showing ${count} ${Number(count) === 1 ? "event" : "events"}`,
  "dashboard_new.activity_page.load_more": "Load more",
  "dashboard_new.activity_page.loading": "Loading recent activities",
  "dashboard_new.activity_page.empty_title": "No activity yet",
  "dashboard_new.activity_page.empty_description":
    "Successful audit events will appear here when activity is recorded.",
  "dashboard_new.activity_page.unavailable": "Recent activities unavailable",
  "dashboard_new.activity_page.load_failed":
    "We could not load recent activities.",
  "dashboard_new.activity_page.default_error":
    "Recent activities could not be loaded.",
  "dashboard_new.filters.title": "Filters",
  "dashboard_new.filters.toggle_alerts": "Toggle dashboard alert filters",
  "dashboard_new.filters.toggle_activities": "Toggle recent activity filters",
  "dashboard_new.filters.reset": "Reset filters",
  "dashboard_new.filters.source": "Source",
  "dashboard_new.filters.severity": "Severity",
  "dashboard_new.filters.limit": "Limit",
  "dashboard_new.filters.actor_type": "Actor type",
  "dashboard_new.filters.from": "From",
  "dashboard_new.filters.to": "To",
  "dashboard_new.filters.page_size": "Page size",
  "dashboard_new.filters.all_sources": "All sources",
  "dashboard_new.filters.all_severities": "All severities",
  "dashboard_new.filters.all_actor_types": "All actor types",
  "dashboard_new.filters.include_zero_count": "Include zero-count alerts",
  "dashboard_new.filters.event_type_placeholder": "Filter by event type",
  "dashboard_new.filters.event_type_helper":
    "Example: attendance.session.submit",
  "dashboard_new.filters.alert_limit": ({ count }) => `${count} alerts`,
  "dashboard_new.filters.page_size_limit": ({ count }) => `${count} per page`,
  "dashboard_new.sources.admissions": "Admissions",
  "dashboard_new.sources.students": "Students",
  "dashboard_new.sources.academics": "Academics",
  "dashboard_new.sources.attendance": "Attendance",
  "dashboard_new.sources.grades": "Grades",
  "dashboard_new.sources.homework": "Homework",
  "dashboard_new.sources.behavior": "Behavior",
  "dashboard_new.sources.reinforcement": "Reinforcement",
  "dashboard_new.sources.communication": "Communication",
  "dashboard_new.sources.settings": "Settings",
  "dashboard_new.severity.critical": "Critical",
  "dashboard_new.severity.warning": "Warning",
  "dashboard_new.severity.info": "Info",
  "dashboard_new.actor_types.system": "System",
  "dashboard_new.actor_types.admin": "Admin",
  "dashboard_new.actor_types.teacher": "Teacher",
  "dashboard_new.actor_types.student": "Student",
  "dashboard_new.actor_types.parent": "Parent",
  "dashboard_new.actor_types.unknown": "Unknown",
};

for (const [translationKey, translationValue] of Object.entries(
  flattenDashboardTranslations(enMessages.dashboard_new, "dashboard_new"),
)) {
  dashboardTranslations[translationKey] ??= translationValue;
}

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: stableTestTranslator,
}));

const testTranslators = new Map<
  string | undefined,
  (key: string, values?: TranslationValues) => string
>();

function stableTestTranslator(namespace?: string) {
  const existingTranslator = testTranslators.get(namespace);
  if (existingTranslator) {
    return existingTranslator;
  }

  const translator = (key: string, values?: TranslationValues) => {
    const translationKey = namespace ? `${namespace}.${key}` : key;
    const translation = dashboardTranslations[translationKey];

    if (typeof translation === "function") {
      return translation(values ?? {});
    }

    return translation ?? key;
  };

  translator.has = (key: string) => {
    const translationKey = namespace ? `${namespace}.${key}` : key;
    return translationKey in dashboardTranslations;
  };

  testTranslators.set(namespace, translator);
  return translator;
}

function flattenDashboardTranslations(
  translations: Record<string, unknown>,
  prefix: string,
) {
  const flattenedTranslations: Record<string, string> = {};

  for (const [translationKey, translationValue] of Object.entries(translations)) {
    const fullKey = `${prefix}.${translationKey}`;

    if (typeof translationValue === "string") {
      flattenedTranslations[fullKey] = translationValue;
      continue;
    }

    if (translationValue && typeof translationValue === "object") {
      Object.assign(
        flattenedTranslations,
        flattenDashboardTranslations(
          translationValue as Record<string, unknown>,
          fullKey,
        ),
      );
    }
  }

  return flattenedTranslations;
}
