"use client";

import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { AlertTriangle, ChartColumn, CheckCheck, Trophy } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { GradesAnalyticsReport } from "../types";

interface GradesAnalyticsSectionProps {
  report: GradesAnalyticsReport;
  isLoading: boolean;
}

export default function GradesAnalyticsSection({ report, isLoading }: GradesAnalyticsSectionProps) {
  const t = useTranslations("academics.grades.analytics");
  const hasDistribution = report.distribution.some((distributionBucket) => distributionBucket.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={t("kpis.classAverage")} value={`${report.kpis.classAverage.toFixed(1)}%`} icon={ChartColumn} iconColor="var(--primary-color)" iconBgColor="var(--color-primary-100)" showChart={false} />
        <KPICardV2 title={t("kpis.passRate")} value={`${report.kpis.passRate.toFixed(1)}%`} icon={CheckCheck} iconColor="var(--success-text)" iconBgColor="var(--success-bg)" showChart={false} />
        <KPICardV2 title={t("kpis.completionRate")} value={`${report.kpis.completionRate.toFixed(1)}%`} icon={Trophy} iconColor="var(--accent-color)" iconBgColor="var(--color-primary-50)" showChart={false} />
        <KPICardV2 title={t("kpis.failingStudents")} value={report.kpis.failingStudents} icon={AlertTriangle} iconColor="var(--warning-text)" iconBgColor="var(--warning-bg)" showChart={false} />
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("distribution.title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("distribution.subtitle")}</div>
          </div>
          <div className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
            {t("supportedContract")}
          </div>
        </div>
        {isLoading || !hasDistribution ? (
          <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
            {t("empty")}
          </div>
        ) : (
          <BarChart
            dataset={report.distribution}
            xAxis={[{ scaleType: "band", dataKey: "label" }]}
            series={[{ dataKey: "count", label: t("distribution.count"), color: "var(--primary-color)" }]}
            height={280}
            margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
          />
        )}
      </div>
    </div>
  );
}
