"use client";

import { useMemo, useState } from "react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import type { DashboardAcademicPerformanceData } from "@/features/dashboard/utils/dashboardStatsCalculator";

type StatType = "positive" | "negative";
type Period = "today" | "this_week" | "this_term";

interface StatCardProps {
  labelKey: StatType;
  value: string;
  change: string;
  isPositive: boolean;
}

interface AcademicPerformanceCardProps {
  performance: DashboardAcademicPerformanceData;
}

const StatCard = ({ labelKey, value, change, isPositive }: StatCardProps) => {
  const t = useTranslations("charts");

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex-1">
      <p className="text-black text-xs font-medium uppercase mb-2">
        {t(labelKey)}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-black">{value}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? "positive-tag" : "negative-tag"
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
};

export default function AcademicPerformanceCard({
  performance,
}: AcademicPerformanceCardProps) {
  const t = useTranslations("charts");
  const [period, setPeriod] = useState<Period>("today");

  const periodOptions: DropdownItem[] = useMemo(
    () => [
      { label: t("period.today"), value: "today" },
      { label: t("period.this_week"), value: "this_week" },
      { label: t("period.this_term"), value: "this_term" },
    ],
    [t]
  );

  const chartData = useMemo(() => performance.trends[period], [performance, period]);

  return (
    <ChartCard
      title={t("academic_performance")}
      subtitle={t("academic_performance_subtitle")}
      description={t("academic_performance_description")}
      periodOptions={periodOptions}
      onPeriodChange={(value) => setPeriod(value as Period)}
      defaultPeriod={period}
      bgColor="#dbeafe"
      customFilter={
        <div className="flex items-center gap-1.5 positive-tag px-3 py-1 rounded-full">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-bold">{t("good")}</span>
        </div>
      }
    >
      <div className="flex gap-4 mb-6">
        <StatCard
          labelKey="positive"
          value={`${performance.positiveRate}%`}
          change={`+${Math.max(1, Math.round(performance.positiveRate / 9))}%`}
          isPositive
        />
        <StatCard
          labelKey="negative"
          value={`${performance.negativeRate}%`}
          change={`-${Math.max(1, Math.round(performance.negativeRate / 3))}%`}
          isPositive={false}
        />
      </div>

      <div className="w-full">
        <SparkLineChart
          data={chartData}
          height={180}
          color="#036b80"
          curve="natural"
          showTooltip
          showHighlight
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          slotProps={{
            line: {
              filter: "url(#lineShadow)",
              stroke: "url(#lineGradient)",
            },
          }}
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2.5,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            },
          }}
        >
          <defs>
            <filter
              id="lineShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="4"
                floodColor="#036b80"
                floodOpacity="0.2"
              />
            </filter>

            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0" y2="0">
              <stop offset="0%" stopColor="#036b80" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#036b80" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#036b80" stopOpacity="1" />
            </linearGradient>
          </defs>
        </SparkLineChart>
      </div>
    </ChartCard>
  );
}
