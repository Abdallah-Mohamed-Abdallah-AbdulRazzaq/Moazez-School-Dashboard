"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock3, FileCheck2, FileClock, FileX2, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type { ReportsExcusesAnalysis, ReportsExcuseScopeRow } from "../types";

interface ExcusesAnalysisSectionProps {
  analysis: ReportsExcusesAnalysis;
  onStudentClick: (studentId: string) => void;
  onScopeClick: (scope: ReportsExcuseScopeRow) => void;
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

export default function ExcusesAnalysisSection({
  analysis,
  onStudentClick,
  onScopeClick,
}: ExcusesAnalysisSectionProps) {
  const t = useTranslations("attendance.reportsPage.excuses");
  const locale = useLocale();
  const yAxisWidth = locale === "ar" ? 80 : 140;

  const metricCards = [
    {
      key: "total",
      title: t("totalRequests"),
      value: analysis.totalRequests,
      icon: FileCheck2,
      ...getKpiIconStyle(analysis.totalRequests > 0 ? "primary" : "neutral"),
    },
    {
      key: "pending",
      title: t("pending"),
      value: analysis.pendingCount,
      icon: Clock3,
      ...getKpiIconStyle(analysis.pendingCount > 0 ? "warning" : "neutral"),
    },
    {
      key: "approved",
      title: t("approved"),
      value: analysis.approvedCount,
      icon: CheckCircle2,
      ...getKpiIconStyle(analysis.approvedCount > 0 ? "success" : "neutral"),
    },
    {
      key: "rejected",
      title: t("rejected"),
      value: analysis.rejectedCount,
      icon: FileX2,
      ...getKpiIconStyle(analysis.rejectedCount > 0 ? "danger" : "neutral"),
    },
    {
      key: "rate",
      title: t("approvalRate"),
      value: `${analysis.approvalRate.toFixed(1)}%`,
      icon: Percent,
      ...getKpiIconStyle(analysis.approvalRate >= 75 ? "success" : analysis.approvalRate >= 50 ? "warning" : "danger"),
    },
    {
      key: "late",
      title: t("lateSubmissions"),
      value: analysis.lateSubmissionsCount,
      icon: FileClock,
      ...getKpiIconStyle(analysis.lateSubmissionsCount > 0 ? "warning" : "neutral"),
    },
  ];

  const byTypeData = analysis.byType.map((item) => ({
    ...item,
    label: t(`types.${item.type}`),
    value: item.count,
  }));

  const topStudentsData = analysis.topStudents.slice(0, 8).map((student) => ({
    ...student,
    label: locale === "ar" ? student.studentNameAr : student.studentNameEn,
  }));

  const topScopesData = analysis.topScopes.map((scope) => ({
    ...scope,
    label: locale === "ar" ? scope.labelAr : scope.labelEn,
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("byType")}
          </div>
          <div className="h-72">
            {byTypeData.length === 0 ? (
              <ChartEmptyState message={t("emptyChart")} />
            ) : (
              <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byTypeData} dataKey="value" nameKey="label" outerRadius={90}>
                      {byTypeData.map((item, index) => (
                        <Cell
                          key={item.type}
                          fill={["var(--primary-color)", "var(--accent-color)", "var(--color-primary-200)"][index % 3]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
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
                      const payload = getChartPayload<{ studentId: string }>(state);
                      if (payload?.studentId) onStudentClick(payload.studentId);
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
                      formatter={(value) => [`${value}`, t("totalRequests")]}
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as (typeof topStudentsData)[number] | undefined;
                        if (!row) return "";
                        const name = locale === "ar" ? row.studentNameAr : row.studentNameEn;
                        return `${name} - ${t("studentSummary", {
                          count: row.count,
                          approved: row.approvedCount,
                          rejected: row.rejectedCount,
                        })}`;
                      }}
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("topScopes")}
          </div>
          <div className="h-72">
            {topScopesData.length === 0 ? (
              <ChartEmptyState message={t("emptyChart")} />
            ) : (
              <div className="h-full rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topScopesData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 28, bottom: 8 }}
                    onClick={(state) => {
                      const payload = getChartPayload<ReportsExcuseScopeRow>(state);
                      if (payload) onScopeClick(payload);
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
                      contentStyle={{
                        backgroundColor: "var(--surface-color)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="total" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
