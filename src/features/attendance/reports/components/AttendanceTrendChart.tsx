"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportsTrendPoint } from "../types";

interface AttendanceTrendChartProps {
  points: ReportsTrendPoint[];
  onPointClick: (point: ReportsTrendPoint) => void;
}

export default function AttendanceTrendChart({ points, onPointClick }: AttendanceTrendChartProps) {
  const locale = useLocale();
  const t = useTranslations("attendance.reportsPage.trend");

  if (points.length === 0) {
    return (
      <div className="rounded-xl border p-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </div>
        <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("empty")}
        </div>
      </div>
    );
  }

  const maxRate = Math.max(...points.map((point) => point.attendanceRate), 100);
  const chartData = points.map((point) => ({
    ...point,
    displayLabel: formatTrendLabel(point, locale),
  }));

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div>
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
            onClick={(state) => {
              const payload = getChartPayload<ReportsTrendPoint>(state);
              if (payload) onPointClick(payload);
            }}
          >
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="displayLabel" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxRate]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-color)",
                borderColor: "var(--border-color)",
                borderRadius: "12px",
              }}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as (ReportsTrendPoint & { displayLabel?: string }) | undefined;
                return point?.displayLabel || "";
              }}
              formatter={(tooltipValue, seriesName) => [
                seriesName === "attendanceRate"
                  ? `${Number(tooltipValue || 0).toFixed(1)}%`
                  : Number(tooltipValue || 0).toLocaleString(),
                seriesName === "attendanceRate" ? t("rateSeries") : t("volumeSeries"),
              ]}
            />
            <Bar
              yAxisId="right"
              dataKey="markedCount"
              fill="var(--color-primary-100)"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="attendanceRate"
              stroke="var(--primary-color)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--primary-color)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getChartPayload<T>(state: unknown): T | undefined {
  const payload = (state as { activePayload?: Array<{ payload?: T }> } | undefined)?.activePayload?.[0]?.payload;
  return payload;
}

function formatTrendLabel(point: ReportsTrendPoint, locale: string) {
  if (point.dateFrom === point.dateTo) {
    return point.dateFrom;
  }

  const separator = locale === "ar" ? " \u2190 " : " -> ";
  return `\u200E${point.dateFrom}\u200E${separator}\u200E${point.dateTo}\u200E`;
}
