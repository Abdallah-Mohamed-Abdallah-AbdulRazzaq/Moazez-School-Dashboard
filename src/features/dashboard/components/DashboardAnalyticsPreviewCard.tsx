"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardAnalyticsChartDataResponse } from "@/features/dashboard/types/dashboardApi.types";
import { formatDashboardMetric } from "@/features/dashboard/utils/formatDashboardMetric";

const chartColors = ["#036b80", "#0ea5a4", "#f59e0b", "#7c3aed"];

export default function DashboardAnalyticsPreviewCard({
  chart,
  locale,
}: {
  chart: DashboardAnalyticsChartDataResponse;
  locale: string;
}) {
  const chartData = useMemo(() => seriesToChartData(chart), [chart]);
  const chartLines = chart.data.series.map((series, index) => ({
    ...series,
    color: chartColors[index % chartColors.length],
  }));
  const value = chart.data.summary?.value ?? Object.values(chart.data.totals)
    .reduce((total, current) => total + current, 0);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-gray-950">{chart.title}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary-800">
            {formatDashboardMetric(value, locale)}
          </p>
        </div>
        <span className="rounded-lg bg-primary-50 p-2 text-primary"><BarChart3 className="h-4 w-4" /></span>
      </div>
      {chart.data.empty || !chartData.length ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white/70 px-3 py-4 text-center text-sm text-gray-600">
          {chart.emptyState?.message ?? "No data"}
        </p>
      ) : (
        <div className="mt-3 h-36" role="img" aria-label={chart.title}>
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === "area" ? (
              <AreaChart data={chartData}>
                <ChartAxes />
                {chartLines.map((series) => <Area key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} fill={series.color} fillOpacity={0.12} strokeWidth={2} />)}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <ChartAxes />
                {chartLines.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

function ChartAxes() {
  return <><CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={28} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><YAxis width={30} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} /></>;
}

function seriesToChartData(chart: DashboardAnalyticsChartDataResponse) {
  const pointsByLabel = new Map<string, Record<string, string | number>>();
  chart.data.series.forEach((series) => series.points.forEach((point) => {
    const item = pointsByLabel.get(point.x) ?? { label: point.x };
    item[series.key] = point.y;
    pointsByLabel.set(point.x, item);
  }));
  return Array.from(pointsByLabel.values());
}
