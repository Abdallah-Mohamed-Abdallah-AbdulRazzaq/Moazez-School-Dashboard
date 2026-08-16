"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Select } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import ModuleWidgetCard from "@/features/dashboard/components/ModuleWidgetCard";
import { fetchDashboardWidgets } from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardWidgetSource,
  DashboardWidgetType,
  DashboardWidgetsResponse,
} from "@/features/dashboard/types/dashboardApi.types";

const widgetSources: DashboardWidgetSource[] = [
  "admissions",
  "students",
  "academics",
  "attendance",
  "grades",
  "homework",
  "behavior",
  "reinforcement",
  "communication",
  "settings",
  "activity",
  "todos",
  "calendar",
];
const widgetTypes: DashboardWidgetType[] = [
  "stat-card",
  "progress-card",
  "risk-card",
  "action-card",
  "timeline-card",
  "mini-chart-card",
  "calendar-card",
  "todo-card",
];
const widgetLimits = [10, 20, 30, 50] as const;

export default function DashboardWidgetsPage() {
  return (
    <DashboardPermissionGuard permission="dashboard.widgets.view">
      <DashboardWidgetsContent />
    </DashboardPermissionGuard>
  );
}

function DashboardWidgetsContent() {
  const t = useTranslations("dashboard_new.widgets");
  const [response, setResponse] = useState<DashboardWidgetsResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DashboardWidgetSource | "">("");
  const [type, setType] = useState<DashboardWidgetType | "">("");
  const [limit, setLimit] = useState<(typeof widgetLimits)[number]>(20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResponse(
        await fetchDashboardWidgets({
          source: source || undefined,
          type: type || undefined,
          limit,
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("load_failed"));
    } finally {
      setLoading(false);
    }
  }, [limit, source, t, type]);

  useEffect(() => {
    let mounted = true;
    fetchDashboardWidgets({
      source: source || undefined,
      type: type || undefined,
      limit,
    })
      .then((nextResponse) => {
        if (mounted) setResponse(nextResponse);
      })
      .catch((reason: unknown) => {
        if (mounted)
          setError(reason instanceof Error ? reason.message : t("load_failed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [limit, source, t, type]);
  if (loading && !response) return <MainLoader />;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600">{t("description")}</p>
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
        <WidgetFilters
          source={source}
          type={type}
          limit={limit}
          onSourceChange={setSource}
          onTypeChange={setType}
          onLimitChange={setLimit}
        />
        {error && !response ? (
          <WidgetsError message={error} onRetry={load} />
        ) : response ? (
          <>
            <WidgetSummary response={response} />
            {response.widgets.length ? (
              <WidgetGrid widgets={response.widgets} />
            ) : (
              <EmptyWidgets />
            )}
            <WidgetMetadata response={response} />
          </>
        ) : null}
      </div>
    </main>
  );
}

function WidgetFilters({
  source,
  type,
  limit,
  onSourceChange,
  onTypeChange,
  onLimitChange,
}: {
  source: DashboardWidgetSource | "";
  type: DashboardWidgetType | "";
  limit: (typeof widgetLimits)[number];
  onSourceChange: (source: DashboardWidgetSource | "") => void;
  onTypeChange: (type: DashboardWidgetType | "") => void;
  onLimitChange: (limit: (typeof widgetLimits)[number]) => void;
}) {
  const t = useTranslations("dashboard_new.widgets");
  return (
    <section className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <Select
        label={t("source")}
        value={source}
        onChange={(value) => onSourceChange(value as DashboardWidgetSource | "")}
        options={[{ value: "", label: t("all_sources") }, ...widgetSources.map((option) => ({ value: option, label: formatLabel(option) }))]}
      />
      <Select
        label={t("limit")}
        value={String(limit)}
        onChange={(value) => onLimitChange(Number(value) as (typeof widgetLimits)[number])}
        options={widgetLimits.map((option) => ({ value: String(option), label: t("limit_option", { count: option }) }))}
      />
      <Select
        label={t("type")}
        value={type}
        onChange={(value) => onTypeChange(value as DashboardWidgetType | "")}
        options={[{ value: "", label: t("all_types") }, ...widgetTypes.map((option) => ({ value: option, label: formatLabel(option) }))]}
      />
    </section>
  );
}

function WidgetSummary({ response }: { response: DashboardWidgetsResponse }) {
  return (
    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">
        Showing {response.widgets.length} of {response.summary.total} widgets
        {response.filters.source
          ? ` · ${formatLabel(response.filters.source)}`
          : ""}
        {response.filters.type
          ? ` · ${formatLabel(response.filters.type)}`
          : ""}
      </p>
      <WidgetBreakdown label="Types" values={response.summary.byType} />
      <WidgetBreakdown label="Sources" values={response.summary.bySource} />
    </section>
  );
}

function WidgetMetadata({ response }: { response: DashboardWidgetsResponse }) {
  return (
    <footer className="mt-5 text-xs text-gray-500">
      Updated {formatDate(response.generatedAt)} · Capabilities:{" "}
      {Object.entries(response.deferred)
        .map(([key, status]) => `${formatLabel(key)} (${formatLabel(status)})`)
        .join(" · ")}
    </footer>
  );
}

function WidgetBreakdown({
  label,
  values,
}: {
  label: string;
  values: Record<string, number | undefined>;
}) {
  const entries = Object.entries(values).filter(
    ([, count]) => count !== undefined,
  );
  return entries.length ? (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-600">{label}:</span>
      {entries.map(([key, count]) => (
        <span
          key={key}
          className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
        >
          {formatLabel(key)} {count}
        </span>
      ))}
    </div>
  ) : null;
}

function WidgetsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => Promise<void>;
}) {
  const t = useTranslations("dashboard_new.widgets");
  return (
    <section className="rounded-xl border border-red-200 bg-white p-6 text-center">
      <p role="alert" className="text-sm text-red-700">
        {message}
      </p>
      <Button className="mt-4" onClick={() => void onRetry()}>
        {t("retry")}
      </Button>
    </section>
  );
}

function WidgetGrid({
  widgets,
}: {
  widgets: DashboardWidgetsResponse["widgets"];
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {widgets.map((widget) => (
        <ModuleWidgetCard key={widget.widgetKey} widget={widget} />
      ))}
    </section>
  );
}

function EmptyWidgets() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-gray-950">
        No widgets are available
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Widgets will appear here when they are enabled for this school.
      </p>
    </section>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
