"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MessageSquareWarning,
  RefreshCw,
  School,
  Settings2,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";

import ActivitiesCard from "../components/ActivitiesCard";
import DashboardAnalysisCards from "../components/DashboardAnalysisCards";
import DashboardAnalysisCharts from "../components/DashboardAnalysisCharts";
import DashboardIntelligencePanel from "../components/DashboardIntelligencePanel";
import DashboardLightModeDropdown from "../components/DashboardLightModeDropdown";
import DashboardPermissionGuard from "../components/DashboardPermissionGuard";
import FilterBar from "../components/FilterBar";
import QuickActionPanel from "../components/QuickActionPanel";
import { MobileAppsWidget } from "@/features/app-download/components/MobileAppsWidget";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import ModuleTabDashboardView from "../components/ModuleTabDashboardView";
import { DASHBOARD_ALERT_PREVIEW_LIMIT } from "@/features/dashboard/constants/dashboardPreviewLimits";
import { dashboardExportRowsFromViewModels } from "@/features/dashboard/mappers/dashboardViewMapper";
import type {
  DashboardActivityFeedViewModel,
  DashboardAlertsViewModel,
  DashboardDeferredFeature,
  DashboardModuleCard,
  DashboardModuleMetric,
  DashboardSetupItem,
  DashboardSummaryViewModel,
  DashboardTone,
  DashboardTopKpi,
  DashboardViewAlert,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import type {
  DashboardCommandCenterResponse,
  DashboardModuleListItem,
  DashboardModulePage,
} from "@/features/dashboard/types/dashboardApi.types";

export type DashboardSectionState<TData> =
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; message: string };

interface SchoolDashboardViewProps {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  isRefreshing: boolean;
  onRefresh: () => void;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  modules: DashboardModuleListItem[];
  cachedModules: Record<string, DashboardModulePage>;
  moduleLoadingStates: Record<string, "loading" | "success" | "error">;
  moduleErrors: Record<string, string>;
  onLoadModuleDetails: (moduleKey: string) => void;
}

interface DashboardHeaderProps {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  isRefreshing: boolean;
  locale: string;
  onRefresh: () => void;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}

type DashboardTab = "overview" | string;

type DashboardTabDefinition = {
  id: DashboardTab;
  label: string;
};

const toneStyles: Record<
  DashboardTone,
  { border: string; bg: string; text: string; icon: string; dot: string }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    icon: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  neutral: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    dot: "bg-gray-400",
  },
};

const moduleIcons: Record<DashboardModuleCard["id"], LucideIcon> = {
  admissions: UserCheck,
  students: Users,
  academics: GraduationCap,
  attendance: CheckCircle2,
  grades: BookOpen,
  homework: BookOpen,
  behavior: ShieldAlert,
  reinforcement: School,
  communication: MessageSquareWarning,
  settings: Settings2,
};

const overviewModuleIds: DashboardModuleCard["id"][] = [
  "students",
  "admissions",
  "communication",
  "attendance",
  "behavior",
  "academics",
  "reinforcement",
  "grades",
  "homework",
];

export default function SchoolDashboardView({
  activityFeedState,
  alertsState,
  isRefreshing,
  onRefresh,
  summaryState,
  modules,
  cachedModules,
  moduleLoadingStates,
  moduleErrors,
  onLoadModuleDetails,
}: SchoolDashboardViewProps) {
  const [commandCenterAnalysis, setCommandCenterAnalysis] =
    useState<DashboardCommandCenterResponse | null>(null);
  const handleCommandCenterChange = useCallback(
    (commandCenter: DashboardCommandCenterResponse | null) => {
      setCommandCenterAnalysis(commandCenter);
    },
    [],
  );
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard_new");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const dynamicTabs: DashboardTabDefinition[] = [
    { id: "overview", label: t("dashboard.tabs.overview") || "Overview" },
    ...(Array.isArray(modules) ? modules : []).map((m) => {
      let label = m.title;
      if (t.has(`dashboard.tabs.${m.moduleKey}`)) {
        label = t(`dashboard.tabs.${m.moduleKey}`);
      } else if (t.has(`dashboard.modules.${m.moduleKey}.title`)) {
        label = t(`dashboard.modules.${m.moduleKey}.title`);
      } else if (t.has(`sources.${m.moduleKey}`)) {
        label = t(`sources.${m.moduleKey}`);
      }
      return { id: m.moduleKey, label };
    }),
  ];

  return (
    <div
      className="min-h-screen bg-white p-4 sm:p-6 md:p-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        <DashboardPermissionGuard
          fallback={null}
          permission="dashboard.summary.view"
        >
          <DashboardHeader
            activityFeedState={activityFeedState}
            alertsState={alertsState}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            locale={locale}
            pathname={pathname}
            summaryState={summaryState}
            t={t}
          />
        </DashboardPermissionGuard>
        <DashboardLightModeDropdown />
        <DashboardIntelligencePanel
          onCommandCenterChange={handleCommandCenterChange}
        />

        <DashboardAnalysisCards commandCenter={commandCenterAnalysis} />

        <DashboardAnalysisCharts commandCenter={commandCenterAnalysis} />

        <DashboardActionRow
          alertsState={alertsState}
          pathname={pathname}
          t={t}
        />

        <DashboardPermissionGuard
          fallback={null}
          permission="dashboard.summary.view"
        >
          <TopKpiGrid locale={locale} summaryState={summaryState} t={t} />
        </DashboardPermissionGuard>

        <DashboardPermissionGuard
          fallback={null}
          permission="dashboard.modules.view"
        >
          <>
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={(tabId) => {
                setActiveTab(tabId);
                if (tabId !== "overview") {
                  onLoadModuleDetails(tabId);
                }
              }}
              tabs={dynamicTabs}
              t={t}
            />

            <DashboardTabContent
              activeTab={activeTab}
              locale={locale}
              pathname={pathname}
              summaryState={summaryState}
              cachedModules={cachedModules}
              moduleLoadingStates={moduleLoadingStates}
              moduleErrors={moduleErrors}
              t={t}
            />
          </>
        </DashboardPermissionGuard>

        <MobileAppsWidget />

        <PersistentDashboardDetails
          activityFeedState={activityFeedState}
          alertsState={alertsState}
          locale={locale}
          pathname={pathname}
          summaryState={summaryState}
          t={t}
        />
      </div>
    </div>
  );
}

function DashboardActionRow({
  alertsState,
  pathname,
  t,
}: {
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <DashboardPermissionGuard
        fallback={null}
        permission="dashboard.alerts.view"
      >
        <ActionRequiredPanel
          alertsState={alertsState}
          pathname={pathname}
          t={t}
        />
      </DashboardPermissionGuard>
      <QuickActionPanel />
    </section>
  );
}

function DashboardHeader({
  activityFeedState,
  alertsState,
  isRefreshing,
  locale,
  onRefresh,
  pathname,
  summaryState,
  t,
}: DashboardHeaderProps) {
  if (summaryState.status === "loading") {
    return (
      <header className="rounded-2xl border border-border bg-white/90 p-6">
        <DashboardPartialLoading label={t("dashboard.loading_summary")} />
      </header>
    );
  }

  if (summaryState.status === "error") {
    return (
      <header className="rounded-2xl border border-red-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)]">
        <SectionError
          title={t("dashboard.unavailable")}
          message={summaryState.message}
        />
      </header>
    );
  }

  const { context } = summaryState.data;
  const exportRows = dashboardExportRowsFromViewModels({
    summary: summaryState.data,
    alerts: alertsState.status === "success" ? alertsState.data : undefined,
    activityFeed:
      activityFeedState.status === "success"
        ? activityFeedState.data
        : undefined,
  });

  return (
    <header className="relative overflow-hidden rounded-2xl border border-primary-100 bg-white p-6 sm:p-7">
      <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-48 w-48 rounded-full blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-primary-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <School className="h-4 w-4" />
            </span>
            {context.schoolName}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            {t("dashboard.title")}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-gray-700">
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-sm">
              {t("dashboard.academic_year", {
                value: context.academicYearName,
              })}
            </span>
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-sm">
              {t("dashboard.term", { value: context.termName })}
            </span>
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-sm">
              {t("dashboard.last_updated", {
                value: formattedGeneratedAt(
                  context.generatedAt,
                  context.timezone,
                  locale,
                ),
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:max-w-md lg:justify-end">
          <Link
            href={localizedPath(pathname, "/attendance/reports")}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-100 bg-white/90 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors duration-200 hover:border-primary-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            {t("dashboard.reports")}
          </Link>
          <Link
            href={localizedPath(pathname, "/settings")}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-100 bg-white/90 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors duration-200 hover:border-primary-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
            {t("dashboard.settings")}
          </Link>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(3,107,128,0.22)] transition-colors duration-200 hover:bg-hover disabled:cursor-wait disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("dashboard.refresh")}
          </button>
          <FilterBar
            academicYearName={context.academicYearName}
            termName={context.termName}
            exportRows={exportRows}
          />
        </div>
      </div>
    </header>
  );
}

function ActionRequiredPanel({
  alertsState,
  pathname,
  t,
}: {
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (alertsState.status === "loading") {
    return (
      <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <DashboardPartialLoading label={t("alerts_page.loading")} />
      </section>
    );
  }

  if (alertsState.status === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <SectionError
          title={t("alerts_page.unavailable")}
          message={alertsState.message}
        />
      </section>
    );
  }

  const { alerts, summary: alertSummary } = alertsState.data;

  if (alerts.length === 0) {
    return <EmptyAlertState t={t} />;
  }

  const prioritizedAlerts = dashboardAlertsByPriority(alerts);
  const visibleAlerts = prioritizedAlerts.slice(
    0,
    DASHBOARD_ALERT_PREVIEW_LIMIT,
  );
  const actionAlerts = visibleAlerts.filter(hasAlertAction);
  const hasMoreAlerts =
    alertSummary.total > visibleAlerts.length ||
    prioritizedAlerts.length > visibleAlerts.length;

  return (
    <section className="rounded-2xl border border-red-200/90 bg-white/95 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <ActionRequiredHeader
        alertsHref={dashboardAlertsPath(pathname)}
        hasMoreAlerts={hasMoreAlerts}
        issueCount={alertSummary.total}
        t={t}
      />

      {actionAlerts.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actionAlerts.map((alertEntry) => (
            <Link
              key={alertEntry.id}
              href={localizedPath(pathname, alertEntry.actionTarget)}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-hover focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
            >
              {alertEntry.actionLabel}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 divide-y divide-gray-100">
        {visibleAlerts.map((alertEntry) => (
          <ActionRequiredItem key={alertEntry.id} alertEntry={alertEntry} />
        ))}
      </div>
    </section>
  );
}

function EmptyAlertState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <div>
          <h2 className="text-sm font-semibold text-emerald-900">
            {t("dashboard.alerts.empty_title")}
          </h2>
          <p className="text-xs text-emerald-700">
            {t("dashboard.alerts.empty_description")}
          </p>
        </div>
      </div>
    </section>
  );
}

function ActionRequiredHeader({
  alertsHref,
  hasMoreAlerts,
  issueCount,
  t,
}: {
  alertsHref: string;
  hasMoreAlerts: boolean;
  issueCount: number;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-950">
            {t("dashboard.alerts.title")}
          </h2>
          <p className="mt-1 text-sm font-medium text-red-700">
            {t("dashboard.alerts.issue_count", { count: issueCount })}
          </p>
        </div>
      </div>
      {hasMoreAlerts ? (
        <Link
          href={alertsHref}
          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
        >
          {t("dashboard.alerts.view_all")}
        </Link>
      ) : null}
    </div>
  );
}

function ActionRequiredItem({
  alertEntry,
}: {
  alertEntry: DashboardViewAlert;
}) {
  const toneStyle = toneStyles[alertEntry.tone];

  return (
    <article className="rounded-xl py-3 transition-colors duration-200 hover:bg-gray-50 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <span
          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${toneStyle.dot}`}
        />
        <div>
          <h3 className="text-sm font-bold text-gray-950">
            {alertEntry.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{alertEntry.description}</p>
        </div>
      </div>
    </article>
  );
}

function dashboardAlertsByPriority(
  alerts: DashboardViewAlert[],
): DashboardViewAlert[] {
  const priorityOrder: Record<DashboardViewAlert["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...alerts].sort((firstAlert, secondAlert) => {
    const severityDelta =
      priorityOrder[firstAlert.severity] - priorityOrder[secondAlert.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    const sourceDelta = firstAlert.source.localeCompare(secondAlert.source);
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return firstAlert.id.localeCompare(secondAlert.id);
  });
}

function hasAlertAction(
  alertEntry: DashboardViewAlert,
): alertEntry is DashboardViewAlert & {
  actionLabel: string;
  actionTarget: string;
} {
  return Boolean(alertEntry.actionLabel && alertEntry.actionTarget);
}

function DashboardTabs({
  activeTab,
  onTabChange,
  tabs,
  t,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  tabs: DashboardTabDefinition[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div
        role="tablist"
        aria-label={t("dashboard.tabs.aria_label")}
        className="inline-flex min-w-full gap-1.5 rounded-2xl border border-gray-200/80 bg-white/90 p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:min-w-0"
      >
        {tabs.map((dashboardTab) => {
          const isActive = dashboardTab.id === activeTab;
          const label =
            typeof t.has === "function" &&
            t.has(`dashboard.tabs.${dashboardTab.id}`)
              ? t(`dashboard.tabs.${dashboardTab.id}`)
              : dashboardTab.label;

          return (
            <button
              key={dashboardTab.id}
              id={`tab-${dashboardTab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${dashboardTab.id}`}
              onClick={() => onTabChange(dashboardTab.id)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 hover:bg-primary-50 hover:text-primary-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DashboardTabContent({
  activeTab,
  locale,
  pathname,
  summaryState,
  cachedModules,
  moduleLoadingStates,
  moduleErrors,
  t,
}: {
  activeTab: DashboardTab;
  locale: string;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  cachedModules: Record<string, DashboardModulePage>;
  moduleLoadingStates: Record<string, "loading" | "success" | "error">;
  moduleErrors: Record<string, string>;
  t: ReturnType<typeof useTranslations>;
}) {
  const renderInnerContent = () => {
    if (activeTab !== "overview") {
      const state = moduleLoadingStates[activeTab] || "loading";
      if (state === "loading") {
        return (
          <div className="flex justify-center p-8">
            <PartialLoader />
          </div>
        );
      }
      if (state === "error") {
        return (
          <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <SectionError
              title={
                t("dashboard.modules_unavailable") || "Modules Unavailable"
              }
              message={
                moduleErrors[activeTab] || "Failed to load module details"
              }
            />
          </section>
        );
      }
      const pageData = cachedModules[activeTab];
      if (!pageData) return null;

      return <ModuleTabDashboardView pageData={pageData} />;
    }

    if (summaryState.status === "loading") {
      return <ModuleCardGridSkeleton t={t} />;
    }

    if (summaryState.status === "error") {
      return (
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <SectionError
            title={t("dashboard.modules_unavailable")}
            message={summaryState.message}
          />
        </section>
      );
    }

    return (
      <ModuleCardGrid
        moduleCards={moduleCardsById(
          summaryState.data.moduleCards,
          moduleIdsForTab(activeTab),
        )}
        locale={locale}
        pathname={pathname}
        t={t}
      />
    );
  };

  return (
    <div
      id={`panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`tab-${activeTab}`}
      tabIndex={0}
      className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
    >
      {renderInnerContent()}
    </div>
  );
}

function PersistentDashboardDetails({
  activityFeedState,
  alertsState,
  locale,
  pathname,
  summaryState,
  t,
}: {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  alertsState: DashboardSectionState<DashboardAlertsViewModel>;
  locale: string;
  pathname: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}) {
  const deferredFeatures = dashboardDeferredFeaturesFromStates(
    summaryState,
    alertsState,
    activityFeedState,
  );

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <DashboardPermissionGuard
        fallback={null}
        permission="dashboard.activity_feed.view"
      >
        <DashboardActivityPanel
          activityFeedState={activityFeedState}
          locale={locale}
          recentActivitiesHref={recentActivitiesPath(pathname)}
          t={t}
        />
      </DashboardPermissionGuard>
      <DeferredFeatureList deferredFeatures={deferredFeatures} t={t} />
    </section>
  );
}

function DashboardActivityPanel({
  activityFeedState,
  locale,
  recentActivitiesHref,
  t,
}: {
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>;
  locale: string;
  recentActivitiesHref: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (activityFeedState.status === "loading") {
    return (
      <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <DashboardPartialLoading label={t("activity_page.loading")} />
      </section>
    );
  }

  if (activityFeedState.status === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <SectionError
          title={t("activity_page.unavailable")}
          message={activityFeedState.message}
        />
      </section>
    );
  }

  return (
    <ActivitiesCard
      activityFeed={activityFeedState.data}
      locale={locale}
      recentActivitiesHref={recentActivitiesHref}
    />
  );
}

function TopKpiGridSkeleton({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <section
      aria-label={t("dashboard.loading_kpis")}
      className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, skeletonIndex) => (
        <div
          key={skeletonIndex}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <DashboardPartialLoading label={t("dashboard.loading_kpis")} />
        </div>
      ))}
    </section>
  );
}

function ModuleCardGridSkeleton({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section
      aria-label={t("dashboard.loading_modules")}
      className="grid grid-cols-1 gap-4 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }).map((_, skeletonIndex) => (
        <div
          key={skeletonIndex}
          className="min-h-[320px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <DashboardPartialLoading label={t("dashboard.loading_modules")} />
        </div>
      ))}
    </section>
  );
}

function DashboardPartialLoading({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="flex min-h-32 flex-col items-center justify-center gap-3 text-sm font-medium text-gray-500"
    >
      <PartialLoader size={32} />
      <span>{label}</span>
    </div>
  );
}

function SectionError({ message, title }: { message: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-red-600">{title}</p>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
}

function dashboardDeferredFeaturesFromStates(
  summaryState: DashboardSectionState<DashboardSummaryViewModel>,
  alertsState: DashboardSectionState<DashboardAlertsViewModel>,
  activityFeedState: DashboardSectionState<DashboardActivityFeedViewModel>,
) {
  return [
    ...(summaryState.status === "success"
      ? summaryState.data.deferredFeatures
      : []),
    ...(alertsState.status === "success"
      ? alertsState.data.deferredFeatures
      : []),
    ...(activityFeedState.status === "success"
      ? activityFeedState.data.deferredFeatures
      : []),
  ];
}

function ModuleCardGrid({
  locale,
  moduleCards,
  pathname,
  t,
}: {
  locale: string;
  moduleCards: DashboardModuleCard[];
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {moduleCards.map((moduleCard) => (
        <ModuleSummaryCard
          key={moduleCard.id}
          locale={locale}
          moduleCard={moduleCard}
          pathname={pathname}
          t={t}
        />
      ))}
    </section>
  );
}

function moduleIdsForTab(activeTab: DashboardTab): DashboardModuleCard["id"][] {
  if (activeTab === "academics") {
    return ["academics", "grades", "homework"];
  }

  if (activeTab === "admissions") {
    return ["admissions"];
  }

  if (activeTab === "communication") {
    return ["communication"];
  }

  return overviewModuleIds;
}

function moduleCardsById(
  moduleCards: DashboardModuleCard[],
  moduleIds: DashboardModuleCard["id"][],
) {
  return moduleIds
    .map((moduleId) =>
      moduleCards.find((moduleCard) => moduleCard.id === moduleId),
    )
    .filter((moduleCard): moduleCard is DashboardModuleCard =>
      Boolean(moduleCard),
    );
}

function TopKpiGrid({
  locale,
  summaryState,
  t,
}: {
  locale: string;
  summaryState: DashboardSectionState<DashboardSummaryViewModel>;
  t: ReturnType<typeof useTranslations>;
}) {
  if (summaryState.status === "loading") {
    return <TopKpiGridSkeleton t={t} />;
  }

  if (summaryState.status === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <SectionError
          title={t("dashboard.kpis_unavailable")}
          message={summaryState.message}
        />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryState.data.topKpis.map((topKpi) => (
        <TopKpiCard key={topKpi.id} locale={locale} topKpi={topKpi} t={t} />
      ))}
    </section>
  );
}

function TopKpiCard({
  locale,
  topKpi,
  t,
}: {
  locale: string;
  topKpi: DashboardTopKpi;
  t: ReturnType<typeof useTranslations>;
}) {
  const toneStyle = toneStyles[topKpi.tone];
  const numberLocale = locale === "ar" ? "ar-EG" : "en";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-primary-200 hover:shadow-[0_18px_38px_rgba(3,107,128,0.12)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${toneStyle.dot}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-600">
            {t(`dashboard.top_kpis.${topKpi.id}.label`)}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
            {topKpi.value.toLocaleString(numberLocale)}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600">
            {t(
              `dashboard.top_kpis.${topKpi.id}.subtitle`,
              topKpi.subtitleValues,
            )}
          </p>
        </div>
        <div
          className={`rounded-xl border ${toneStyle.border} ${toneStyle.bg} p-2.5 shadow-sm`}
        >
          <BarChart3 className={`h-4 w-4 ${toneStyle.icon}`} />
        </div>
      </div>
    </article>
  );
}

function ModuleSummaryCard({
  locale,
  moduleCard,
  pathname,
  t,
}: {
  locale: string;
  moduleCard: DashboardModuleCard;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = moduleIcons[moduleCard.id];
  const stateTone = moduleStateTone(moduleCard.state);
  const toneStyle = toneStyles[stateTone];

  return (
    <article className="flex min-h-[320px] flex-col rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-primary-200 hover:shadow-[0_18px_38px_rgba(3,107,128,0.10)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl border ${toneStyle.border} ${toneStyle.bg} p-2.5 shadow-sm`}
          >
            <Icon className={`h-5 w-5 ${toneStyle.icon}`} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-950">
              {t(`dashboard.modules.${moduleCard.id}.title`)}
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-600">
              {localizedModuleSummary(moduleCard, t)}
            </p>
          </div>
        </div>
        <ModuleStateBadge state={moduleCard.state} t={t} />
      </div>

      {moduleCard.setupItems ? (
        <SetupChecklist setupItems={moduleCard.setupItems} t={t} />
      ) : (
        <ModuleMetrics locale={locale} metrics={moduleCard.metrics} t={t} />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {localizedModuleHighlights(moduleCard, t).map((highlight) => (
          <span
            key={highlight}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600"
          >
            {highlight}
          </span>
        ))}
      </div>

      {moduleCard.actionLabel && moduleCard.actionTarget ? (
        <Link
          href={localizedPath(pathname, moduleCard.actionTarget)}
          className="mt-auto inline-flex w-fit items-center rounded-lg pt-5 text-sm font-bold text-primary-700 transition-colors duration-200 hover:text-hover focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer"
        >
          {localizedModuleAction(moduleCard, t)}
        </Link>
      ) : null}
    </article>
  );
}

function ModuleMetrics({
  locale,
  metrics,
  t,
}: {
  locale: string;
  metrics: DashboardModuleMetric[];
  t: ReturnType<typeof useTranslations>;
}) {
  const numberLocale = locale === "ar" ? "ar-EG" : "en";

  return (
    <dl className="grid grid-cols-1 gap-2">
      {metrics.map((metricEntry) => {
        const toneStyle = toneStyles[metricEntry.tone];

        return (
          <div
            key={metricEntry.label}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5"
          >
            <dt className="text-sm text-gray-600">
              {localizedMetricLabel(metricEntry.label, t)}
            </dt>
            <dd className={`text-sm font-bold ${toneStyle.text}`}>
              {metricEntry.value.toLocaleString(numberLocale)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function SetupChecklist({
  setupItems,
  t,
}: {
  setupItems: DashboardSetupItem[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-2">
      {setupItems.map((setupItem) => {
        const isReady = setupItem.status === "ready";

        return (
          <div
            key={setupItem.label}
            className="flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
          >
            {isReady ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            ) : (
              <Clock3 className="mt-0.5 h-4 w-4 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {localizedSetupLabel(setupItem.label, t)}:{" "}
                {isReady
                  ? t("dashboard.setup.ready")
                  : t("dashboard.setup.not_configured")}
              </p>
              <p className="text-xs text-gray-600">
                {localizedSetupDetail(setupItem, t)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleStateBadge({
  state,
  t,
}: {
  state: DashboardModuleCard["state"];
  t: ReturnType<typeof useTranslations>;
}) {
  const toneStyle = toneStyles[moduleStateTone(state)];

  return (
    <span
      className={`rounded-full border ${toneStyle.border} ${toneStyle.bg} px-2.5 py-1 text-xs font-bold ${toneStyle.text}`}
    >
      {t(`dashboard.module_state.${state}`)}
    </span>
  );
}

function localizedModuleSummary(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const moduleValues = moduleTranslationValues(moduleCard);
  const summaryKey =
    moduleCard.id === "communication" && moduleValues.moderationReports > 0
      ? "warning"
      : moduleCard.state;

  return t(
    `dashboard.modules.${moduleCard.id}.summary.${summaryKey}`,
    moduleValues,
  );
}

function localizedModuleAction(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const actionKey =
    moduleCard.id === "communication" &&
    moduleTranslationValues(moduleCard).moderationReports > 0
      ? "review_moderation"
      : "default";

  return t(`dashboard.modules.${moduleCard.id}.action.${actionKey}`);
}

function localizedModuleHighlights(
  moduleCard: DashboardModuleCard,
  t: ReturnType<typeof useTranslations>,
) {
  const moduleValues = moduleTranslationValues(moduleCard);
  const highlightKeys = moduleHighlightKeys(moduleCard, moduleValues);

  return highlightKeys.map((highlightKey) =>
    t(
      `dashboard.modules.${moduleCard.id}.highlights.${highlightKey}`,
      moduleValues,
    ),
  );
}

function localizedMetricLabel(
  metricLabel: string,
  t: ReturnType<typeof useTranslations>,
) {
  const metricKey = metricLabelKey(metricLabel);
  return metricKey ? t(`dashboard.metrics.${metricKey}`) : metricLabel;
}

function localizedSetupLabel(
  setupLabel: string,
  t: ReturnType<typeof useTranslations>,
) {
  const setupKey = setupItemKey(setupLabel);
  return setupKey ? t(`dashboard.setup_items.${setupKey}.label`) : setupLabel;
}

function localizedSetupDetail(
  setupItem: DashboardSetupItem,
  t: ReturnType<typeof useTranslations>,
) {
  const setupKey = setupItemKey(setupItem.label);
  if (!setupKey) {
    return setupItem.detail;
  }

  return t(
    `dashboard.setup_items.${setupKey}.detail`,
    setupDetailValues(setupItem),
  );
}

function moduleTranslationValues(moduleCard: DashboardModuleCard) {
  return {
    openApplications: metricValue(moduleCard, "Open applications"),
    recentDecisions: metricValue(moduleCard, "Recent decisions"),
    moderationReports: metricValue(moduleCard, "Moderation reports"),
    withdrawnEnrollments: metricValue(moduleCard, "Withdrawn enrollments"),
    todaySessions: metricValue(moduleCard, "Today sessions"),
    activeAssessments: metricValue(moduleCard, "Active assessments"),
    publishedAssignments: metricValue(moduleCard, "Published assignments"),
    positiveRecords: metricValue(moduleCard, "Positive behavior"),
    negativeRecords: metricValue(moduleCard, "Negative behavior"),
    activeTasks: metricValue(moduleCard, "Active tasks"),
  };
}

function metricValue(moduleCard: DashboardModuleCard, metricLabel: string) {
  return (
    moduleCard.metrics.find((metricEntry) => metricEntry.label === metricLabel)
      ?.value ?? 0
  );
}

function moduleHighlightKeys(
  moduleCard: DashboardModuleCard,
  moduleValues: ReturnType<typeof moduleTranslationValues>,
) {
  if (moduleCard.id === "admissions") {
    return [
      moduleValues.openApplications > 0 ? "open_applications" : "",
      moduleValues.recentDecisions > 0 ? "recent_decisions" : "",
    ].filter(Boolean);
  }

  if (moduleCard.id === "communication") {
    return moduleValues.moderationReports > 0 ? ["moderation_reports"] : [];
  }

  if (moduleCard.id === "students") {
    return [
      moduleValues.withdrawnEnrollments > 0
        ? "withdrawn_exists"
        : "no_withdrawn",
    ];
  }

  if (moduleCard.id === "academics") {
    return [moduleCard.state === "setup" ? "setup_attention" : "setup_ready"];
  }

  if (moduleCard.id === "attendance") {
    return [moduleCard.state === "healthy" ? "active_today" : "none_today"];
  }

  if (moduleCard.id === "grades") {
    return [
      moduleValues.activeAssessments > 0
        ? "tracking_active"
        : "create_assessments",
    ];
  }

  if (moduleCard.id === "homework") {
    return [
      moduleValues.publishedAssignments > 0
        ? "assignments_active"
        : "create_assignments",
    ];
  }

  if (moduleCard.id === "behavior") {
    return ["positive", "negative"];
  }

  if (moduleCard.id === "reinforcement") {
    return ["active_tasks"];
  }

  return [];
}

function metricLabelKey(metricLabel: string) {
  const metricKeys: Record<string, string> = {
    "Total leads": "total_leads",
    "Open applications": "open_applications",
    Submitted: "submitted",
    Accepted: "accepted",
    "Pending tests": "pending_tests",
    "Pending interviews": "pending_interviews",
    "Recent decisions": "recent_decisions",
    "Active conversations": "active_conversations",
    "Active announcements": "active_announcements",
    "Moderation reports": "moderation_reports",
    "Recent messages": "recent_messages",
    "Active students": "active_students",
    "Active enrollments": "active_enrollments",
    Guardians: "guardians",
    "New enrollments": "new_enrollments",
    "Withdrawn enrollments": "withdrawn_enrollments",
    "Academic years": "academic_years",
    Terms: "terms",
    Stages: "stages",
    Grades: "grades",
    Sections: "sections",
    Classrooms: "classrooms",
    Subjects: "subjects",
    Rooms: "rooms",
    "Today sessions": "today_sessions",
    "Submitted today": "submitted_today",
    "Pending today": "pending_today",
    "Absent today": "absent_today",
    "Late today": "late_today",
    "Pending excuses": "pending_excuses",
    "Active assessments": "active_assessments",
    "Draft assessments": "draft_assessments",
    "Published assessments": "published_assessments",
    "Approved assessments": "approved_assessments",
    "Pending submissions": "pending_submissions",
    "Pending answer reviews": "pending_answer_reviews",
    "Draft assignments": "draft_assignments",
    "Published assignments": "published_assignments",
    "Closed assignments": "closed_assignments",
    "Waiting review": "waiting_review",
    "Reviewed submissions": "reviewed_submissions",
    "Grade sync pending": "grade_sync_pending",
    "Recent records": "recent_records",
    "Positive behavior": "positive_behavior",
    "Negative behavior": "negative_behavior",
    "Pending review": "pending_review",
    "Active tasks": "active_tasks",
    "Pending reviews": "pending_reviews",
    "Completed assignments": "completed_assignments",
    "Rewards pending": "rewards_pending",
  };

  return metricKeys[metricLabel];
}

function setupItemKey(setupLabel: string) {
  const setupKeys: Record<string, string> = {
    "Academic structure": "academic_structure",
    "Teacher allocations": "teacher_allocations",
    Curricula: "curricula",
    "Lesson plans": "lesson_plans",
    Timetable: "timetable",
  };

  return setupKeys[setupLabel];
}

function setupDetailValues(setupItem: DashboardSetupItem) {
  const numbers = setupItem.detail.match(/\d+/g)?.map(Number) ?? [];

  return {
    first: numbers[0] ?? 0,
    second: numbers[1] ?? 0,
  };
}

function DeferredFeatureList({
  deferredFeatures,
  t,
}: {
  deferredFeatures: DashboardDeferredFeature[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (deferredFeatures.length === 0) {
    return null;
  }

  const shouldScrollVersionNotes = deferredFeatures.length > 7;

  return (
    <aside className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-950">
        <BarChart3 className="h-5 w-5 text-gray-600" />
        {t("dashboard.version_notes")}
      </h2>
      <div
        className={`space-y-3 ${
          shouldScrollVersionNotes ? "max-h-[34rem] overflow-y-auto pr-2" : ""
        }`}
      >
        {deferredFeatures.map((feature) => (
          <div
            key={feature.id}
            className="rounded-lg border border-dashed border-gray-200 p-3"
          >
            <p className="text-sm font-semibold text-gray-800">
              {feature.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function moduleStateTone(state: DashboardModuleCard["state"]): DashboardTone {
  if (state === "warning" || state === "setup") {
    return "warning";
  }

  if (state === "healthy") {
    return "success";
  }

  return "neutral";
}

function formattedGeneratedAt(
  generatedAt: string,
  timezone: string,
  locale: string,
) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short",
    }).format(new Date(generatedAt));
  } catch {
    return generatedAt;
  }
}

function localizedPath(pathname: string, targetPath: string) {
  if (!targetPath.startsWith("/")) {
    return targetPath;
  }

  const localePrefix = localePathPrefix(pathname);
  if (!localePrefix || targetPath.startsWith(`${localePrefix}/`)) {
    return targetPath;
  }

  return `${localePrefix}${targetPath}`;
}

function localePathPrefix(pathname: string) {
  const firstPathSegment = pathname.split("/")[1];

  if (!firstPathSegment || !/^[a-z]{2}(-[A-Z]{2})?$/.test(firstPathSegment)) {
    return "";
  }

  return `/${firstPathSegment}`;
}

function recentActivitiesPath(pathname: string) {
  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (normalizedPathname.endsWith("/dashboard")) {
    return `${normalizedPathname}/recent-activities`;
  }

  return "/dashboard/recent-activities";
}

function dashboardAlertsPath(pathname: string) {
  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (normalizedPathname.endsWith("/dashboard")) {
    return `${normalizedPathname}/alerts`;
  }

  return "/dashboard/alerts";
}
