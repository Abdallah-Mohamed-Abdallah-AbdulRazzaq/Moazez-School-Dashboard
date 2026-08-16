"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
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
import { Button } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import { fetchDashboardCommandCenter } from "@/features/dashboard/services/dashboardApiService";
import type { DashboardCommandCenterResponse } from "@/features/dashboard/types/dashboardApi.types";
import { resolveDashboardActionTarget } from "@/features/dashboard/utils/resolveDashboardActionTarget";

type CommandCenterAction = { label: string; target: string };
type CommandCenterTab = "overview" | "operations" | "analytics";

const statusStyles: Record<string, { badge: string; bar: string }> = {
  healthy: { badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  success: { badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  info: { badge: "bg-sky-50 text-sky-700", bar: "bg-sky-500" },
  warning: { badge: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  critical: { badge: "bg-red-50 text-red-700", bar: "bg-red-500" },
  not_configured: { badge: "bg-gray-100 text-gray-700", bar: "bg-gray-400" },
};

const chartColors = ["#2563eb", "#0f766e", "#d97706", "#7c3aed"];
const commandCenterTabs: Array<{ id: CommandCenterTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "operations", label: "Operations" },
  { id: "analytics", label: "Analytics" },
];

export default function DashboardCommandCenterPage() {
  return (
    <DashboardPermissionGuard permission="dashboard.command_center.view">
      <DashboardCommandCenterContent />
    </DashboardPermissionGuard>
  );
}

function DashboardCommandCenterContent() {
  const t = useTranslations("dashboard_new.command_center");
  const [data, setData] = useState<DashboardCommandCenterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CommandCenterTab>("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchDashboardCommandCenter());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load the command center.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchDashboardCommandCenter()
      .then((response) => {
        if (mounted) setData(response);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load the command center.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading && !data) return <MainLoader />;

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <section className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <CircleAlert className="mx-auto h-8 w-8 text-red-600" />
          <h1 className="mt-3 text-lg font-semibold text-gray-950">
            {t("unavailable")}
          </h1>
          <p className="mt-2 text-sm text-gray-600" role="alert">
            {error ?? "Please try again."}
          </p>
          <Button
            className="mt-5"
            onClick={() => void load()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {t("retry")}
          </Button>
        </section>
      </main>
    );
  }

  const deferred = Object.entries(data.meta.deferred)
    .filter(([, state]) => state === "deferred")
    .map(([feature]) => feature.replace(/([A-Z])/g, " $1").toLowerCase());

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {data.school.name ?? "School"} · {data.today.dayOfWeek},{" "}
              {data.today.date} · {data.today.timezone}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {data.operator.displayName} ·{" "}
              {data.academicContext.academicYear?.name ?? "No academic year"}
              {data.academicContext.term?.name
                ? ` · ${data.academicContext.term.name}`
                : ""}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {loading ? t("refreshing") : t("refresh")}
          </Button>
        </header>

        <nav
          className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
          aria-label={t("tabs_label")}
        >
          <div className="flex min-w-max gap-1" role="tablist">
            {commandCenterTabs.map((tab) => (
              <button
                key={tab.id}
                id={`command-center-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`command-center-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${activeTab === tab.id ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"}`}
              >
                {t(`tabs.${tab.id}`)}
              </button>
            ))}
          </div>
        </nav>

        <section
          id={`command-center-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`command-center-tab-${activeTab}`}
          className="mt-6"
        >
          {activeTab === "overview" && <OverviewTab data={data} />}
          {activeTab === "operations" && <OperationsTab data={data} />}
          {activeTab === "analytics" && (
            <AnalyticsSection charts={data.analyticsPreview} />
          )}
        </section>

        <footer className="mt-6 text-xs text-gray-500">
          Live data · Updated {formatDateTime(data.generatedAt)} ·{" "}
          {data.meta.version}
          {deferred.length > 0
            ? ` · Not yet available: ${deferred.join(", ")}`
            : ""}
        </footer>
      </div>
    </main>
  );
}

function NavigationCard({
  action,
  children,
  className = "",
}: {
  action: CommandCenterAction;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={resolveDashboardActionTarget(action.target)}
      className={`block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
    >
      {children}
    </Link>
  );
}

function OverviewTab({ data }: { data: DashboardCommandCenterResponse }) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <div className="space-y-6">
      <section
        aria-label={t("quick_overview")}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {data.quickStats.map((stat) => (
          <NavigationCard
            key={stat.key}
            action={stat.action}
            className="min-h-32"
          >
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {stat.value}
              {stat.unit ? ` ${stat.unit}` : ""}
            </p>
            <p className="mt-3 text-xs text-gray-500">{stat.source}</p>
          </NavigationCard>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <ActionList title={t("priority_actions")} items={data.topActions} />
        <AlertList title={t("top_risks")} items={data.topRisks} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <AlertList title={t("alerts")} items={data.alertsPreview} />
        <TodoSection preview={data.todoPreview} />
      </section>
    </div>
  );
}

function OperationsTab({ data }: { data: DashboardCommandCenterResponse }) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <div className="space-y-6">
      <HealthSection
        title={t("operational_health")}
        items={data.operationalHealth}
      />
      <ReadinessSection items={data.moduleReadiness} />
      <ActivitySection items={data.activityPreview} />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      {children}
    </section>
  );
}

function ActionList({
  title,
  items,
}: {
  title: string;
  items: DashboardCommandCenterResponse["topActions"];
}) {
  return (
    <Panel title={title}>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <NavigationCard key={item.key} action={item.action}>
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.priority === "critical" ? "bg-red-500" : item.priority === "high" ? "bg-amber-500" : "bg-sky-500"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-950">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </NavigationCard>
          ))
        ) : (
          <EmptyMessage message="No priority actions right now." />
        )}
      </div>
    </Panel>
  );
}

function AlertList({
  title,
  items,
}: {
  title: string;
  items:
    | DashboardCommandCenterResponse["topRisks"]
    | DashboardCommandCenterResponse["alertsPreview"];
}) {
  return (
    <Panel title={title}>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <NavigationCard key={item.key} action={item.action}>
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${item.severity === "critical" ? "text-red-600" : "text-amber-600"}`}
                />
                <div className="min-w-0 flex-2">
                  <p className="text-sm font-medium text-gray-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.count} affected · {item.source}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </NavigationCard>
          ))
        ) : (
          <EmptyMessage message="No alerts require attention." />
        )}
      </div>
    </Panel>
  );
}

function HealthSection({
  title,
  items,
}: {
  title: string;
  items: DashboardCommandCenterResponse["operationalHealth"];
}) {
  return (
    <Panel title={title}>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <ScoreCard
            key={item.key}
            label={item.label}
            status={item.status}
            score={item.score}
            summary={item.summary}
            action={item.action}
          />
        ))}
      </div>
    </Panel>
  );
}

function ReadinessSection({
  items,
}: {
  items: DashboardCommandCenterResponse["moduleReadiness"];
}) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <Panel title={t("module_readiness")}>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.length ? (
          items.map((item) => (
            <ScoreCard
              key={item.source}
              label={item.label}
              status={item.status}
              score={item.score}
              summary={item.summary}
              action={item.action}
              detail={item.metrics
                .map(
                  (metric) => `${metric.label}: ${formatValue(metric.value)}`,
                )
                .join(" · ")}
            />
          ))
        ) : (
          <EmptyMessage message="No module readiness information is available." />
        )}
      </div>
    </Panel>
  );
}

function ScoreCard({
  label,
  status,
  score,
  summary,
  action,
  detail,
}: {
  label: string;
  status: string;
  score: number;
  summary: string;
  action: CommandCenterAction;
  detail?: string;
}) {
  const style = statusStyles[status] ?? statusStyles.info;
  const boundedScore = Math.max(0, Math.min(100, score));
  return (
    <NavigationCard action={action}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-950">{label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.badge}`}
        >
          {status.replace("_", " ")}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${style.bar}`}
            style={{ width: `${boundedScore}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums text-gray-950">
          {boundedScore}%
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-600">{summary}</p>
      {detail ? <p className="mt-2 text-xs text-gray-500">{detail}</p> : null}
    </NavigationCard>
  );
}

function AnalyticsSection({
  charts,
}: {
  charts: DashboardCommandCenterResponse["analyticsPreview"];
}) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <Panel title={t("analytics_preview")}>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {charts.map((chart) => (
          <NavigationCard
            key={chart.chartKey}
            action={chart.action}
            className="min-h-64"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-950">
                  {chart.title}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {chart.summary?.value ??
                    Object.values(chart.totals).reduce(
                      (sum, value) => sum + value,
                      0,
                    )}
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
            </div>
            {chart.empty ? (
              <EmptyMessage message="No data for this period." />
            ) : (
              <CommandCenterChart chart={chart} />
            )}
          </NavigationCard>
        ))}
      </div>
      {charts.length === 0 ? (
        <div className="mt-4">
          <EmptyMessage message="No analytics previews are available." />
        </div>
      ) : null}
    </Panel>
  );
}

function CommandCenterChart({
  chart,
}: {
  chart: DashboardCommandCenterResponse["analyticsPreview"][number];
}) {
  const pointsByX = new Map<string, Record<string, string | number>>();
  chart.series.forEach((series) =>
    series.points.forEach((point) => {
      const chartPoint = pointsByX.get(point.x) ?? { label: point.x };
      chartPoint[series.key] = point.y;
      pointsByX.set(point.x, chartPoint);
    }),
  );
  const chartData = Array.from(pointsByX.values());

  if (chartData.length === 0)
    return (
      <div className="mt-4">
        <EmptyMessage message="No data points are available." />
      </div>
    );

  const chartLines = chart.series.map((series, index) => ({
    ...series,
    color: chartColors[index % chartColors.length],
  }));
  const sharedAxis = (
    <>
      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        minTickGap={24}
        tick={{ fill: "#6b7280", fontSize: 10 }}
      />
      <YAxis
        width={32}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "#6b7280", fontSize: 10 }}
      />
      <Tooltip
        contentStyle={{
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: 12,
        }}
      />
    </>
  );

  return (
    <div
      className="mt-4 h-36"
      role="img"
      aria-label={`${chart.title}: ${chart.summary?.label ?? "analytics chart"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {chart.analytics.chartType === "area" ? (
          <AreaChart data={chartData}>
            {sharedAxis}
            {chartLines.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                fill={series.color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            {sharedAxis}
            {chartLines.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function TodoSection({
  preview,
}: {
  preview: DashboardCommandCenterResponse["todoPreview"];
}) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <Panel title={t("today_tasks")}>
      <p className="mt-1 text-xs text-gray-500">
        {preview.summary.pending} pending of {preview.summary.total}
      </p>
      <div className="mt-4 space-y-2">
        {preview.items.length ? (
          preview.items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${item.status === "completed" ? "text-emerald-500" : "text-gray-300"}`}
              />
              <span
                className={
                  item.status === "completed"
                    ? "line-through text-gray-400"
                    : ""
                }
              >
                {item.title}
              </span>
            </div>
          ))
        ) : (
          <EmptyMessage message="Nothing is assigned for today." />
        )}
      </div>
      <Link
        href={resolveDashboardActionTarget(preview.action.target)}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {preview.action.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Panel>
  );
}

function ActivitySection({
  items,
}: {
  items: DashboardCommandCenterResponse["activityPreview"];
}) {
  const t = useTranslations("dashboard_new.command_center");
  return (
    <Panel title={t("recent_activity")}>
      <div className="mt-4 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.eventType}-${item.occurredAt}`}>
              <p className="text-sm font-medium text-gray-950">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                {item.description}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {item.actor.displayName} · {item.subject.label} ·{" "}
                {formatDateTime(item.occurredAt)}
              </p>
            </div>
          ))
        ) : (
          <EmptyMessage message="No recent activity." />
        )}
      </div>
    </Panel>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
      {message}
    </p>
  );
}
function formatValue(value: string | number | boolean | null) {
  return value === null ? "—" : String(value);
}
function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
