"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlarmClockCheck, CalendarClock, Clock3, ShieldAlert, TimerReset } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type {
  ReportsLateEarlyAnalysis,
  ReportsLateEarlyStudentRow,
  ReportsScopeBreakdownRow,
  ReportsTrendPoint,
} from "../types";

interface LateEarlyAnalysisSectionProps {
  analysis: ReportsLateEarlyAnalysis;
  onTrendClick: (point: ReportsTrendPoint) => void;
  onStudentClick: (student: ReportsLateEarlyStudentRow, type: "LATE" | "EARLY_LEAVE") => void;
  onScopeClick: (scope: ReportsScopeBreakdownRow, level: "grade" | "section" | "classroom") => void;
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex h-full items-center justify-center rounded-lg border p-4 text-center text-sm"
      style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
    >
      {message}
    </div>
  );
}

function getChartPayload<T>(state: unknown): T | undefined {
  return (state as { activePayload?: Array<{ payload?: T }> } | undefined)?.activePayload?.[0]?.payload;
}

function CategoryTick({
  x = 0,
  y = 0,
  payload,
  locale,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  locale: string;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-70}
        y={0}
        dy={4}
        textAnchor="end"
        direction={locale === "ar" ? "rtl" : "ltr"}
        unicodeBidi="plaintext"
        fill="var(--text-secondary)"
        fontSize="12"
      >
        {payload?.value || ""}
      </text>
    </g>
  );
}

export default function LateEarlyAnalysisSection({
  analysis,
  onTrendClick,
  onStudentClick,
  onScopeClick,
}: LateEarlyAnalysisSectionProps) {
  const t = useTranslations("attendance.reportsPage.lateEarly");
  const locale = useLocale();
  const yAxisWidth = locale === "ar" ? 80 : 140;

  const maxTrend = Math.max(...analysis.trend.map((point) => point.lateCount + point.earlyLeaveCount), 1);

  const metricCards = [
    {
      key: "late",
      title: t("lateCount"),
      value: analysis.totalLate,
      icon: Clock3,
      ...getKpiIconStyle(analysis.totalLate > 0 ? "warning" : "neutral"),
    },
    {
      key: "early",
      title: t("earlyLeaveCount"),
      value: analysis.totalEarlyLeave,
      icon: CalendarClock,
      ...getKpiIconStyle(analysis.totalEarlyLeave > 0 ? "warning" : "neutral"),
    },
    {
      key: "violations",
      title: t("violations"),
      value: analysis.violationCount,
      icon: ShieldAlert,
      ...getKpiIconStyle(analysis.violationCount > 0 ? "danger" : "neutral"),
    },
    {
      key: "avgLate",
      title: t("avgLateMinutes"),
      value: analysis.averageLateMinutes.toFixed(1),
      icon: AlarmClockCheck,
      ...getKpiIconStyle("primary"),
    },
    {
      key: "avgEarly",
      title: t("avgEarlyLeaveMinutes"),
      value: analysis.averageEarlyLeaveMinutes.toFixed(1),
      icon: TimerReset,
      ...getKpiIconStyle("primary"),
    },
  ];

  const trendData = analysis.trend.slice(-8).map((point) => ({
    ...point,
    incidents: point.lateCount + point.earlyLeaveCount,
  }));

  const studentChart = (
    title: string,
    rows: ReportsLateEarlyStudentRow[],
    type: "LATE" | "EARLY_LEAVE"
  ) => {
    const data = rows.slice(0, 8).map((row) => ({
      ...row,
      label: locale === "ar" ? row.studentNameAr : row.studentNameEn,
    }));

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </div>
        <div className="h-72">
          {data.length === 0 ? (
            <ChartEmptyState message={t("emptyChart")} />
          ) : (
            <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 28, bottom: 8 }}
                  onClick={(state) => {
                    const payload = getChartPayload<ReportsLateEarlyStudentRow>(state);
                    if (payload) onStudentClick(payload, type);
                  }}
                >
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={yAxisWidth}
                    tick={<CategoryTick locale={locale} />}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}`, t("incidents")]}
                    labelFormatter={(_label, payload) => {
                      const row = payload?.[0]?.payload as ReportsLateEarlyStudentRow | undefined;
                      if (!row) return "";
                      const name = locale === "ar" ? row.studentNameAr : row.studentNameEn;
                      return `${name} - ${t("studentSummary", {
                        count: row.incidentCount,
                        minutes: row.averageMinutes.toFixed(1),
                      })}`;
                    }}
                    contentStyle={{
                      backgroundColor: "var(--surface-color)",
                      borderColor: "var(--border-color)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="incidentCount" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  const breakdownBlocks = [
    { title: t("byGrade"), rows: analysis.byGrade, level: "grade" as const },
    { title: t("bySection"), rows: analysis.bySection, level: "section" as const },
    { title: t("byClassroom"), rows: analysis.byClassroom, level: "classroom" as const },
  ];

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
    >
      <div>
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconFg}
            iconBgColor={card.iconBg}
            showChart={false}
            className="h-full"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("trend")}
          </div>
          <div className="h-72">
            {trendData.length === 0 ? (
              <ChartEmptyState message={t("emptyChart")} />
            ) : (
              <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                    onClick={(state) => {
                      const payload = getChartPayload<ReportsTrendPoint & { incidents: number }>(state);
                      if (payload) onTrendClick(payload);
                    }}
                  >
                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, maxTrend]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, t("incidents")]}
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="incidents" fill="var(--primary-color)" radius={[6, 6, 0, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {studentChart(t("topLateStudents"), analysis.topLateStudents, "LATE")}
          {studentChart(t("topEarlyLeaveStudents"), analysis.topEarlyLeaveStudents, "EARLY_LEAVE")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {breakdownBlocks.map((block) => {
          const data = block.rows.slice(0, 5).map((row) => ({
            ...row,
            label: locale === "ar" ? row.labelAr : row.labelEn,
          }));

          return (
            <div key={block.level} className="space-y-2">
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {block.title}
              </div>
              <div className="h-64">
                {data.length === 0 ? (
                  <ChartEmptyState message={t("emptyChart")} />
                ) : (
                  <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 8, right: 12, left: 28, bottom: 8 }}
                        onClick={(state) => {
                          const payload = getChartPayload<ReportsScopeBreakdownRow>(state);
                          if (payload) onScopeClick(payload, block.level);
                        }}
                      >
                        <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={locale === "ar" ? 150 : 120}
                          tick={<CategoryTick locale={locale} />}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}`, t("incidents")]}
                          contentStyle={{
                            backgroundColor: "var(--surface-color)",
                            borderColor: "var(--border-color)",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="incidents" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
