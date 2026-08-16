
"use client";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type {
  ReportsAbsenceAnalysis,
  ReportsAbsenceStudentRow,
  ReportsScopeBreakdownRow,
  ReportsTrendPoint,
} from "../types";

interface AbsenceAnalysisSectionProps {
  analysis: ReportsAbsenceAnalysis;
  onDateClick: (point: ReportsTrendPoint) => void;
  onStudentClick: (student: ReportsAbsenceStudentRow) => void;
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

function BreakdownChart({
  rows,
  locale,
  emptyMessage,
  onClick,
  t,
}: {
  rows: ReportsScopeBreakdownRow[];
  locale: string;
  emptyMessage: string;
  onClick: (row: ReportsScopeBreakdownRow) => void;
  t: (key: string) => string;
}) {
  const data = rows.slice(0, 5).map((row) => ({
    ...row,
    label: locale === "ar" ? row.labelAr : row.labelEn,
  }));
  const yAxisWidth = locale === "ar" ? 80 : 120;

  if (data.length === 0) {
    return (
      <div className="h-64">
        <ChartEmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="h-64 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 20, bottom: 8 }}
          onClick={(state) => {
            const payload = getChartPayload<ReportsScopeBreakdownRow>(state);
            if (payload) onClick(payload);
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
  );
}

export default function AbsenceAnalysisSection({
  analysis,
  onDateClick,
  onStudentClick,
  onScopeClick,
}: AbsenceAnalysisSectionProps) {
  const t = useTranslations("attendance.reportsPage.absence");
  const locale = useLocale();
  const yAxisWidth = locale === "ar" ? 160 : 140;

  const absenceCards = [
    {
      key: "total",
      title: t("totalAbsences"),
      value: analysis.totalAbsences,
      icon: AlertCircle,
      ...getKpiIconStyle(analysis.totalAbsences > 0 ? "danger" : "neutral"),
    },
    {
      key: "excused",
      title: t("excused"),
      value: analysis.excusedCount,
      icon: Shield,
      ...getKpiIconStyle(analysis.excusedCount > 0 ? "primary" : "neutral"),
    },
    {
      key: "unexcused",
      title: t("unexcused"),
      value: analysis.unexcusedCount,
      icon: CheckCircle2,
      ...getKpiIconStyle(analysis.unexcusedCount > 0 ? "warning" : "neutral"),
    },
  ];

  const byDateData = analysis.byDate.slice(-8).map((point) => ({
    ...point,
    incidents: point.absentCount + point.excusedCount,
  }));

  const topStudentsData = analysis.topStudents.slice(0, 8).map((student) => ({
    ...student,
    label: locale === "ar" ? student.studentNameAr : student.studentNameEn,
  }));

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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {absenceCards.map((card) => (
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
            {t("byDate")}
          </div>
          <div className="h-72">
            {byDateData.length === 0 ? (
              <ChartEmptyState message={t("emptyChart")} />
            ) : (
              <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byDateData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                    onClick={(state) => {
                      const payload = getChartPayload<ReportsTrendPoint & { incidents: number }>(state);
                      if (payload) onDateClick(payload);
                    }}
                  >
                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, t("incidents")]}
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="incidents" fill="var(--accent-color)" radius={[6, 6, 0, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("topStudents")}
          </div>
          <div className="h-72">
            {topStudentsData.length === 0 ? (
              <ChartEmptyState message={t("emptyChart")} />
            ) : (
              <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topStudentsData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 28, bottom: 8 }}
                    onClick={(state) => {
                      const payload = getChartPayload<ReportsAbsenceStudentRow>(state);
                      if (payload) onStudentClick(payload);
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
                      formatter={(value) => [
                        `${value}`,
                        t("incidents"),
                      ]}
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as ReportsAbsenceStudentRow | undefined;
                        if (!row) return "";
                        const name = locale === "ar" ? row.studentNameAr : row.studentNameEn;
                        return `${name} - ${t("excusedUnexcused", {
                          excused: row.excusedCount,
                          unexcused: row.unexcusedCount,
                        })}`;
                      }}
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="absenceCount" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("byGrade")}
          </div>
          <BreakdownChart rows={analysis.byGrade} locale={locale} emptyMessage={t("emptyChart")} onClick={(row) => onScopeClick(row, "grade")} t={t} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("bySection")}
          </div>
          <BreakdownChart rows={analysis.bySection} locale={locale} emptyMessage={t("emptyChart")} onClick={(row) => onScopeClick(row, "section")} t={t} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("byClassroom")}
          </div>
          <BreakdownChart rows={analysis.byClassroom} locale={locale} emptyMessage={t("emptyChart")} onClick={(row) => onScopeClick(row, "classroom")} t={t} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {t("weekdayPattern")}
        </div>
        <div className="h-64">
          {analysis.weekdayPattern.length === 0 ? (
            <ChartEmptyState message={t("emptyChart")} />
          ) : (
            <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.weekdayPattern} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="weekday" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "count") {
                        return [`${value}`, t("incidents")];
                      }
                      return [`${value}`, name];
                    }}
                    contentStyle={{
                      backgroundColor: "var(--surface-color)",
                      borderColor: "var(--border-color)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {analysis.weekdayPattern.map((row) => (
                      <Cell key={row.weekday} fill="var(--primary-color)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
