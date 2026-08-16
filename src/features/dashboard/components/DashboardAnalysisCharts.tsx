"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { DashboardCommandCenterResponse } from "@/features/dashboard/types/dashboardApi.types";
import { resolveDashboardActionTarget } from "@/features/dashboard/utils/resolveDashboardActionTarget";

const chartColors = ["#036b80", "#0ea5a4", "#f59e0b", "#7c3aed"];

export default function DashboardAnalysisCharts({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenterResponse | null;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard_new.command_center");
  const charts =
    commandCenter?.analyticsPreview.filter(
      (chart) =>
        !chart.empty && chart.series.some((series) => series.points.length),
    ) ?? [];
  const operationalHealth = commandCenter?.operationalHealth.slice(0, 3) ?? [];
  const moduleReadiness = commandCenter?.moduleReadiness.slice(0, 3) ?? [];

  if (!charts.length && !operationalHealth.length && !moduleReadiness.length)
    return null;

  return (
    <section
      aria-labelledby="dashboard-analysis-charts-title"
      className="overflow-hidden rounded-2xl border border-primary-100 bg-white/90 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-[linear-gradient(115deg,#ffffff,#f0fbfc)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(3,107,128,0.18)]">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="dashboard-analysis-charts-title"
              className="text-base font-extrabold text-gray-950"
            >
              {t("analysis_charts")}
            </h2>
            <p className="text-xs font-medium text-gray-500">
              {t("analysis_charts_description")}
            </p>
          </div>
        </div>
        {charts.length ? (
          <span className="rounded-full border border-primary-100 bg-white px-3 py-1.5 text-xs font-bold text-primary-700">
            {charts.length} {t("analytics_preview")}
          </span>
        ) : null}
      </div>
      {charts.length ? (
        <div className="grid gap-px bg-gray-100 lg:grid-cols-2">
          {charts.slice(0, 2).map((chart) => (
            <AnalysisChart key={chart.chartKey} chart={chart} locale={locale} />
          ))}
        </div>
      ) : null}
      {operationalHealth.length || moduleReadiness.length ? (
        <div className="grid gap-px border-t border-gray-100 bg-gray-100 lg:grid-cols-2">
          <RingChart
            title={t("operational_health")}
            items={operationalHealth}
            locale={locale}
          />
          <RingChart
            title={t("module_readiness")}
            items={moduleReadiness}
            locale={locale}
          />
        </div>
      ) : null}
    </section>
  );
}

function RingChart({
  title,
  items,
  locale,
}: {
  title: string;
  items: Array<{
    key?: string;
    label: string;
    score: number;
    summary?: string;
  }>;
  locale: string;
}) {
  const t = useTranslations("dashboard_new.command_center");
  const colors = ["#2563eb", "#0ea5a4", "#7c3aed"];
  const data = items.map((item, index) => ({
    name: item.label,
    value: Math.min(100, Math.max(0, item.score)),
    fill: colors[index % colors.length],
  }));
  const average = data.length
    ? Math.round(
        data.reduce((total, item) => total + item.value, 0) / data.length,
      )
    : 0;

  if (!data.length) return null;

  return (
    <article className="bg-[radial-gradient(circle_at_center,#f8fbff_0%,#ffffff_58%)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-gray-950">{title}</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            {t("analysis_ring_caption")}
          </p>
        </div>
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-extrabold text-primary-700">
          {formatMetric(average, locale)}%
        </span>
      </div>
      <div
        className="relative mx-auto mt-2 h-52 max-w-[280px]"
        role="img"
        aria-label={title}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="42%"
            outerRadius="96%"
            startAngle={90}
            endAngle={-270}
            barSize={13}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "#edf2f7" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tracking-tight text-gray-950">
            {formatMetric(average, locale)}%
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {title}
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <div
            key={item.name}
            className="min-w-0 rounded-xl border border-gray-100 bg-white/80 px-3 py-2"
          >
            <p className="flex items-center gap-1.5 truncate text-[11px] font-bold text-gray-600">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              {item.name}
            </p>
            <p className="mt-1 text-sm font-extrabold text-gray-950">
              {formatMetric(item.value, locale)}%
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AnalysisChart({
  chart,
  locale,
}: {
  chart: DashboardCommandCenterResponse["analyticsPreview"][number];
  locale: string;
}) {
  const data = pointsToChartData(chart);
  const total =
    chart.summary?.value ??
    Object.values(chart.totals).reduce((sum, value) => sum + value, 0);
  const lines = chart.series.map((series, index) => ({
    ...series,
    color: chartColors[index % chartColors.length],
  }));

  return (
    <Link
      href={resolveDashboardActionTarget(chart.action.target)}
      className="group bg-white p-5 transition-colors hover:bg-primary-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-gray-950">
            {chart.title}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary-800">
            {formatMetric(total, locale)}
          </p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 h-44" role="img" aria-label={chart.title}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "area" ? (
            <AreaChart data={data}>
              <ChartAxes />
              {lines.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.13}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <ChartAxes />
              {lines.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {lines.map((series) => (
          <span
            key={series.key}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>
    </Link>
  );
}

function ChartAxes() {
  return (
    <>
      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
        minTickGap={28}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 10, fill: "#64748b" }}
      />
      <YAxis
        width={30}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 10, fill: "#64748b" }}
      />
      <Tooltip
        contentStyle={{
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          fontSize: 12,
        }}
      />
    </>
  );
}

function pointsToChartData(
  chart: DashboardCommandCenterResponse["analyticsPreview"][number],
) {
  const pointsByLabel = new Map<string, Record<string, string | number>>();
  chart.series.forEach((series) =>
    series.points.forEach((point) => {
      const item = pointsByLabel.get(point.x) ?? { label: point.x };
      item[series.key] = point.y;
      pointsByLabel.set(point.x, item);
    }),
  );
  return Array.from(pointsByLabel.values());
}

function formatMetric(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(value);
}
