"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  ListTodo,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useState } from "react";

import ModuleWidgetCard from "./ModuleWidgetCard";
import {
  type DashboardTodosResponse,
  fetchAnalyticsChartData,
  fetchAnalyticsCharts,
  fetchDashboardCommandCenter,
  fetchDashboardTodos,
  fetchDashboardWidgets,
} from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardAnalyticsChart,
  DashboardAnalyticsChartDataResponse,
  DashboardAnalyticsChartDataQuery,
  DashboardCommandCenterResponse,
  DashboardWidget,
} from "@/features/dashboard/types/dashboardApi.types";
import { resolveDashboardActionTarget } from "@/features/dashboard/utils/resolveDashboardActionTarget";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import DashboardPermissionGuard from "./DashboardPermissionGuard";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { formatDashboardMetric } from "@/features/dashboard/utils/formatDashboardMetric";

type IntelligenceState = {
  commandCenter: DashboardCommandCenterResponse | null;
  widgets: DashboardWidget[];
  analytics: DashboardAnalyticsChartDataResponse[];
  todos: DashboardTodosResponse | null;
  unavailableSections: string[];
};

type AnalyticsRange = "7d" | "30d" | "90d";

const emptyState: IntelligenceState = {
  commandCenter: null,
  widgets: [],
  analytics: [],
  todos: null,
  unavailableSections: [],
};

const AnalyticsPreviewCard = dynamic(() => import("./DashboardAnalyticsPreviewCard"), {
  loading: () => <PartialLoader />,
});

export default function DashboardIntelligencePanel({
  onCommandCenterChange,
  refreshSequence,
}: {
  onCommandCenterChange?: (commandCenter: DashboardCommandCenterResponse | null) => void;
  refreshSequence: number;
}) {
  const { isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) return null;

  return (
    <DashboardPermissionGuard
      fallback={null}
      permission="dashboard.command_center.view"
    >
      <DashboardPermissionGuard
        fallback={null}
        permission="dashboard.widgets.view"
      >
        <DashboardPermissionGuard
          fallback={null}
          permission="dashboard.analytics.view"
        >
          <DashboardPermissionGuard
            fallback={null}
            permission="dashboard.todos.view"
          >
            <DashboardIntelligenceContent
              onCommandCenterChange={onCommandCenterChange}
              refreshSequence={refreshSequence}
            />
          </DashboardPermissionGuard>
        </DashboardPermissionGuard>
      </DashboardPermissionGuard>
    </DashboardPermissionGuard>
  );
}

function DashboardIntelligenceContent({
  onCommandCenterChange,
  refreshSequence,
}: {
  onCommandCenterChange?: (commandCenter: DashboardCommandCenterResponse | null) => void;
  refreshSequence: number;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard_new.command_center");
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const [state, setState] = useState<IntelligenceState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>("30d");
  const [charts, setCharts] = useState<DashboardAnalyticsChart[]>([]);
  const [manualRefreshSequence, setManualRefreshSequence] = useState(0);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const overviewRequestId = useRef(0);

  const analyticsHref = `/${locale}/dashboard/analytics`;
  const widgetsHref = `/${locale}/dashboard/widgets`;

  const loadOverview = useCallback(async (requestId: number) => {
    setIsLoading(true);

    const [commandResult, widgetsResult, chartsResult, todosResult] = await Promise.allSettled([
      Promise.resolve().then(() => fetchDashboardCommandCenter()),
      Promise.resolve().then(() => fetchDashboardWidgets({ limit: 4 })),
      Promise.resolve().then(() =>
        fetchAnalyticsCharts({ status: "available", limit: 2 }),
      ),
      Promise.resolve().then(() => fetchDashboardTodos({ status: "all", limit: 5 })),
    ]);

    if (requestId !== overviewRequestId.current) return;

    const commandCenter = commandResult.status === "fulfilled" ? commandResult.value : null;
    const availableCharts = chartsResult.status === "fulfilled" ? chartsResult.value.charts.slice(0, 2) : [];
    onCommandCenterChange?.(commandCenter);
    setState((previous) => ({
      ...previous,
      analytics: availableCharts.length ? previous.analytics : [],
      commandCenter,
      widgets: widgetsResult.status === "fulfilled" ? widgetsResult.value.widgets : [],
      todos: todosResult.status === "fulfilled" ? todosResult.value : null,
      unavailableSections: [
        ...(commandResult.status === "rejected" ? ["command"] : []),
        ...(widgetsResult.status === "rejected" ? ["widgets"] : []),
        ...(chartsResult.status === "rejected" ? ["analytics"] : []),
        ...(todosResult.status === "rejected" ? ["todos"] : []),
      ],
    }));
    setCharts(availableCharts);
    if (!availableCharts.length) setIsAnalyticsLoading(false);
    setHasLoaded(true);
    setIsLoading(false);
  }, [onCommandCenterChange]);

  useEffect(() => {
    const requestId = ++overviewRequestId.current;
    const initialLoad = window.setTimeout(() => {
      void loadOverview(requestId);
    }, 0);
    return () => {
      overviewRequestId.current += 1;
      window.clearTimeout(initialLoad);
    };
  }, [loadOverview, manualRefreshSequence, refreshSequence]);

  useEffect(() => {
    if (!charts.length) return;
    let active = true;
    const requests = charts.flatMap((chart) => {
      const query = analyticsQuery(chart, analyticsRange, academicYearId, termId);
      return query ? [fetchAnalyticsChartData(chart.chartKey, query)] : [];
    });

    if (!requests.length) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setState((previous) => ({ ...previous, analytics: [] }));
        setIsAnalyticsLoading(false);
      });
      return () => { active = false; };
    }

    void Promise.resolve().then(() => {
      if (active) setIsAnalyticsLoading(true);
    });
    void Promise.allSettled(requests).then((responses) => {
      if (!active) return;
      setState((previous) => ({
        ...previous,
        analytics: responses.flatMap((response) =>
          response.status === "fulfilled" ? [response.value] : [],
        ),
        unavailableSections: responses.some((response) => response.status === "rejected")
          ? [...new Set([...previous.unavailableSections, "analytics"])]
          : previous.unavailableSections.filter((section) => section !== "analytics"),
      }));
      setIsAnalyticsLoading(false);
    });

    return () => { active = false; };
  }, [academicYearId, analyticsRange, charts, termId]);

  const quickStats = state.commandCenter?.quickStats.slice(0, 4) ?? [];
  const topActions = state.commandCenter?.topActions.slice(0, 2) ?? [];
  const topRisks = state.commandCenter?.topRisks.slice(0, 2) ?? [];

  return (
    <section
      aria-labelledby="dashboard-intelligence-title"
      className="overflow-hidden rounded-2xl border border-primary-100 bg-white/90 shadow-[0_16px_45px_rgba(15,23,42,0.07)]"
    >
      <div className="flex flex-col gap-4 border-b border-primary-100 bg-[linear-gradient(115deg,#f8fdfd,#effafa)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(3,107,128,0.2)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-primary-700">
              {t("eyebrow")}
            </p>
            <h2 id="dashboard-intelligence-title" className="text-lg font-extrabold text-gray-950">
              {t("title")}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {state.commandCenter?.meta.dataFreshness ?? t("live_data")}
          </span>
          <button
            type="button"
            onClick={() => setManualRefreshSequence((sequence) => sequence + 1)}
            disabled={isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-100 bg-white text-primary transition-colors duration-200 hover:bg-primary-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 cursor-pointer"
            aria-label={t("refresh")}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => downloadExecutiveSnapshot(state, locale)}
            disabled={!state.commandCenter}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary-100 bg-white px-2.5 text-xs font-bold text-primary transition-colors duration-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            {t("export_snapshot")}
          </button>
        </div>
      </div>

      {!hasLoaded && isLoading ? <IntelligenceSkeleton /> : (
        <div className="space-y-5 p-5 sm:p-6">
          {state.unavailableSections.length ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800" role="status" aria-live="polite">
              {t("partial_data")}
            </p>
          ) : null}
          {quickStats.length ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {quickStats.map((stat) => (
                <Link
                  key={stat.key}
                  href={resolveDashboardActionTarget(stat.action.target)}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors duration-200 hover:border-primary-200 hover:bg-primary-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 cursor-pointer"
                >
                  <p className="truncate text-xs font-bold text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-gray-950">
                    {formatDashboardMetric(stat.value, locale)}
                    {stat.unit ? <span className="mr-1 text-xs font-bold text-gray-500">{stat.unit}</span> : null}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-700">
                    {stat.source}
                    <DirectionalArrow locale={locale} className="h-3.5 w-3.5" />
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          <AttentionQueue actions={topActions} risks={topRisks} locale={locale} />

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold text-gray-950">{t("analytics_preview")}</h3>
              </div>
              <Link href={analyticsHref} className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer">
                {t("tabs.analytics")}
                <DirectionalArrow locale={locale} className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5">
              <label htmlFor="dashboard-analytics-range" className="text-xs font-bold text-gray-700">{t("analytics_period")}</label>
              <select
                id="dashboard-analytics-range"
                value={analyticsRange}
                onChange={(event) => setAnalyticsRange(event.target.value as AnalyticsRange)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-100 cursor-pointer"
              >
                <option value="7d">{t("range_7d")}</option>
                <option value="30d">{t("range_30d")}</option>
                <option value="90d">{t("range_90d")}</option>
              </select>
            </div>
            {isAnalyticsLoading ? (
              <div className="flex justify-center py-6"><PartialLoader /></div>
            ) : state.analytics.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {state.analytics.map((chart) => <AnalyticsPreviewCard key={chart.chartKey} chart={chart} locale={locale} />)}
              </div>
            ) : <EmptyPanel message={t("no_analytics")} />}
          </section>

          {state.widgets.length ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-extrabold text-gray-950">{t("quick_overview")}</h3>
                <Link href={widgetsHref} className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer">
                  {t("tabs.overview")}
                  <DirectionalArrow locale={locale} className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {state.widgets.map((widget) => <ModuleWidgetCard key={widget.widgetKey} widget={widget} />)}
              </div>
            </section>
          ) : null}

          <TodayPlanner todos={state.todos} commandCenter={state.commandCenter} locale={locale} />
        </div>
      )}
    </section>
  );
}

function AttentionQueue({
  actions,
  risks,
  locale,
}: {
  actions: NonNullable<DashboardCommandCenterResponse>["topActions"];
  risks: NonNullable<DashboardCommandCenterResponse>["topRisks"];
  locale: string;
}) {
  const t = useTranslations("dashboard_new.command_center");
  const items = [
    ...actions.map((action) => ({
      id: action.key,
      label: action.label,
      detail: action.description,
      priority: action.priority,
      action: action.action,
      kind: "action" as const,
    })),
    ...risks.map((risk) => ({
      id: risk.key,
      label: risk.title,
      detail: t("affected", { count: risk.count }),
      priority: risk.severity,
      action: risk.action,
      kind: "risk" as const,
    })),
  ].sort((first, second) => attentionPriority(second.priority) - attentionPriority(first.priority));

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-gray-950">{t("attention_queue")}</p>
          <p className="mt-1 text-xs text-gray-600">{t("operational_health")}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary"><Activity className="h-4 w-4" /></span>
      </div>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {items.length ? items.map((item) => (
          <Link
            key={`${item.kind}-${item.id}`}
            href={resolveDashboardActionTarget(item.action.target)}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors duration-200 hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
          >
            {item.kind === "risk" ? <AlertTriangle className={`h-4 w-4 shrink-0 ${item.priority === "critical" ? "text-red-600" : "text-amber-600"}`} /> : <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${attentionDot(item.priority)}`} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-950">{item.label}</span>
              <span className="mt-1 block line-clamp-1 text-xs text-gray-600">{item.detail}</span>
            </span>
            <DirectionalArrow locale={locale} className="h-4 w-4 shrink-0 text-gray-400" />
          </Link>
        )) : <div className="lg:col-span-2"><EmptyPanel message={t("no_priority_actions")} /></div>}
      </div>
    </section>
  );
}

function TodayPlanner({
  todos,
  commandCenter,
  locale,
}: {
  todos: DashboardTodosResponse | null;
  commandCenter: DashboardCommandCenterResponse | null;
  locale: string;
}) {
  const t = useTranslations("dashboard_new.command_center");
  const items = todos?.todos ?? commandCenter?.todoPreview.items ?? [];
  const pending = todos?.summary.pending ?? commandCenter?.todoPreview.summary.pending ?? 0;
  const total = todos?.summary.total ?? commandCenter?.todoPreview.summary.total ?? 0;
  const plannerHref = commandCenter
    ? resolveDashboardActionTarget(commandCenter.todoPreview.action.target)
    : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><CalendarDays className="h-4 w-4" /></span>
          <div>
            <h3 className="text-base font-extrabold text-gray-950">{t("today_planner")}</h3>
            <p className="mt-0.5 text-xs text-gray-600">{t("pending_of", { pending, total })}</p>
          </div>
        </div>
        {plannerHref ? (
          <Link href={plannerHref} className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer">
            {t("today_tasks")}
            <DirectionalArrow locale={locale} className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.length ? items.slice(0, 4).map((todo, index) => (
          <div key={`${todo.title}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <ListTodo className={`h-4 w-4 shrink-0 ${todo.status === "completed" ? "text-emerald-500" : "text-violet-600"}`} />
            <span className={`truncate text-sm font-semibold ${todo.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>{todo.title}</span>
          </div>
        )) : <div className="sm:col-span-2 xl:col-span-4"><EmptyPanel message={t("no_tasks")} /></div>}
      </div>
    </section>
  );
}

function analyticsQuery(
  chart: DashboardAnalyticsChart,
  range: AnalyticsRange,
  academicYearId: string,
  termId: string,
): DashboardAnalyticsChartDataQuery | null {
  const supportsTime =
    chart.queryCapabilities?.timeFiltersApplicable ??
    chart.filters?.includes("range") ??
    false;
  const supportsGranularity =
    chart.queryCapabilities?.granularityApplicable ??
    chart.filters?.includes("granularity") ??
    false;
  const supportedRanges =
    chart.queryCapabilities?.supportedRanges ?? chart.supportedRanges ?? [];
  const supportedGranularities =
    chart.queryCapabilities?.supportedGranularities ??
    chart.supportedGranularities ??
    [];
  const requiredFilters =
    chart.queryCapabilities?.requiredHierarchyFilters ?? [];

  if (
    (requiredFilters.includes("academicYearId") && !academicYearId) ||
    (requiredFilters.includes("termId") && !termId) ||
    requiredFilters.some(
      (filter) =>
        filter !== "academicYearId" && filter !== "termId",
    )
  ) {
    return null;
  }

  let resolvedRange = supportsTime
    ? preferredRange(range, chart.defaultRange, supportedRanges)
    : undefined;
  const resolvedGranularity = supportsGranularity
    ? preferredGranularity(supportedGranularities)
    : undefined;

  if (
    resolvedRange &&
    resolvedGranularity &&
    !granularitySupportsRange(resolvedGranularity, resolvedRange)
  ) {
    const compatibleRange = supportedRanges.find((candidate) =>
      granularitySupportsRange(resolvedGranularity, candidate),
    );
    resolvedRange = compatibleRange ?? undefined;
  }

  return {
    ...(resolvedRange ? { range: resolvedRange } : {}),
    ...(resolvedGranularity ? { granularity: resolvedGranularity } : {}),
    ...((chart.queryCapabilities?.supportedHierarchyFilters?.includes("academicYearId") ?? chart.filters?.includes("academicYearId")) && academicYearId
      ? { academicYearId }
      : {}),
    ...((chart.queryCapabilities?.supportedHierarchyFilters?.includes("termId") ?? chart.filters?.includes("termId")) && termId
      ? { termId }
      : {}),
  };
}

function preferredRange(
  selectedRange: AnalyticsRange,
  defaultRange: string | undefined,
  supportedRanges: string[],
) {
  if (!supportedRanges.length || supportedRanges.includes(selectedRange)) {
    return selectedRange;
  }

  return defaultRange && supportedRanges.includes(defaultRange)
    ? defaultRange
    : supportedRanges[0];
}

function preferredGranularity(supportedGranularities: string[]) {
  if (!supportedGranularities.length || supportedGranularities.includes("day")) {
    return "day";
  }

  return supportedGranularities[0];
}

function granularitySupportsRange(granularity: string, range: string) {
  if (granularity === "day") return true;
  if (granularity === "week") return true;
  if (granularity === "month") return range !== "7d";
  return true;
}

function DirectionalArrow({ locale, className }: { locale: string; className: string }) {
  const Icon = locale === "ar" ? ArrowLeft : ArrowRight;
  return <Icon className={className} />;
}

function EmptyPanel({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-gray-200 bg-white/70 px-3 py-4 text-center text-sm text-gray-600">{message}</p>;
}

function IntelligenceSkeleton() {
  return <div className="space-y-5 p-5 sm:p-6" aria-live="polite"><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-44 animate-pulse rounded-xl bg-gray-100" /><div className="h-44 animate-pulse rounded-xl bg-gray-100" /></div></div>;
}

function attentionPriority(priority: string) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "warning" || priority === "medium") return 2;
  return 1;
}

function attentionDot(priority: string) {
  if (priority === "critical") return "bg-red-500";
  if (priority === "high" || priority === "warning") return "bg-amber-500";
  return "bg-primary";
}

function downloadExecutiveSnapshot(state: IntelligenceState, locale: string) {
  const commandCenter = state.commandCenter;
  if (!commandCenter) return;

  const rows = [
    ["Executive dashboard snapshot", commandCenter.school.name ?? "School"],
    ["Generated", new Date(commandCenter.generatedAt).toLocaleString(locale === "ar" ? "ar-EG" : "en")],
    [],
    ["Quick statistics"],
    ...commandCenter.quickStats.map((stat) => [stat.label, String(stat.value), stat.unit ?? ""]),
    [],
    ["Priority actions"],
    ...commandCenter.topActions.map((action) => [action.label, action.description, action.priority]),
    [],
    ["Risks"],
    ...commandCenter.topRisks.map((risk) => [risk.title, String(risk.count), risk.severity]),
    [],
    ["Today tasks"],
    ...(state.todos?.todos ?? commandCenter.todoPreview.items).map((todo) => [todo.title, todo.status, todo.priority ?? ""]),
  ];
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dashboard-executive-snapshot.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
