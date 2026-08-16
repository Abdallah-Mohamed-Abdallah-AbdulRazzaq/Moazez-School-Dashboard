"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import type { DashboardAttendanceTrendPeriod } from "@/features/dashboard/utils/dashboardStatsCalculator";

type Period = "days_30" | "week" | "term" | "academic_year";

interface AttendanceTrendChartProps {
  trendByPeriod: Record<Period, DashboardAttendanceTrendPeriod>;
}

export default function AttendanceTrendChart({
  trendByPeriod,
}: AttendanceTrendChartProps) {
  const t = useTranslations("attendance_trend");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("days_30");

  const periodOptions: DropdownItem[] = useMemo(
    () => [
      { label: t("period.days_30"), value: "days_30" },
      { label: t("period.week"), value: "week" },
      { label: t("period.term"), value: "term" },
      { label: t("period.academic_year"), value: "academic_year" },
    ],
    [t]
  );

  const selectedTrend = trendByPeriod[period];
  const avgLine = useMemo(
    () => Array(selectedTrend.days.length).fill(selectedTrend.average),
    [selectedTrend.average, selectedTrend.days.length]
  );

  return (
    <ChartCard
      title={t("title", { period: t(`period.${period}`) })}
      subtitle={t("subtitle")}
      description={t("description")}
      periodOptions={periodOptions}
      onPeriodChange={(value) => setPeriod(value as Period)}
      defaultPeriod={period}
      bgColor="#d1fae5"
      className="h-full flex flex-col justify-between"
    >
      <div className="flex justify-end mb-2">
        <div className="text-right">
          <p className="text-xs text-gray-500">{t("average_label")}</p>
          <p className="text-lg font-bold text-primary-600">
            {selectedTrend.average}%
          </p>
        </div>
      </div>

      <div>
        <LineChart
          xAxis={[{ data: selectedTrend.days, scaleType: "linear" }]}
          series={[
            {
              data: selectedTrend.attendanceData,
              label: t("series.attendance"),
              color: "#036b80",
              curve: "natural",
            },
            {
              data: avgLine,
              label: t("series.average"),
              color: "#f59e0b",
              curve: "linear",
            },
          ]}
          height={300}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 align-bottom">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">
              {t("below_days", { days: selectedTrend.belowDays })}
            </span>{" "}
            {t("below_threshold_suffix")}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              rightIcon={
                locale === "ar" ? (
                  <ArrowLeft className="w-3 h-3" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )
              }
            >
              {t("actions.view_details")}
            </Button>

            <Button size="sm" variant="secondary">
              {t("actions.send_alert")}
            </Button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
