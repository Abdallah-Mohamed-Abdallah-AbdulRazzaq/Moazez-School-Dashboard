// FILE: src/components/admissions/charts/WeeklyInquiriesChart.tsx

"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChartCard } from "@/components/ui/chart-card";

interface WeeklyInquiriesChartProps {
  data: { weekStart: string; count: number }[];
}

export default function WeeklyInquiriesChart({
  data,
}: WeeklyInquiriesChartProps) {
  const t = useTranslations("admissions.charts");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const periodOptions = [
    { label: t("all_time"), value: "all" },
    { label: t("this_month"), value: "month" },
    { label: t("this_term"), value: "term" },
    { label: t("this_year"), value: "year" },
  ];

  if (data.length === 0) {
    return (
      <ChartCard
        title={t("weekly_inquiries")}
        subtitle={t("inquiries_trend")}
        description={t("weekly_inquiries_desc")}
        periodOptions={periodOptions}
        defaultPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        bgColor="#e0e7ff"
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </ChartCard>
    );
  }

  // Format week labels (e.g., "Jan 15" or "Week 1")
  const xAxisData = data.map((item) => {
    const date = new Date(item.weekStart);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const yAxisData = data.map((item) => item.count);
  const maxValue = Math.max(...yAxisData, 1);
  const totalLeads = yAxisData.reduce((sum, val) => sum + val, 0);
  const avgPerWeek = (totalLeads / yAxisData.length).toFixed(1);

  return (
    <ChartCard
      title={t("weekly_inquiries")}
      subtitle={t("inquiries_trend")}
      description={t("weekly_inquiries_desc")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      bgColor="#e0e7ff"
      className="h-full flex flex-col justify-between"
    >
      <div className="w-full">
        <LineChart
          xAxis={[
            {
              data: xAxisData,
              scaleType: "point",
              tickLabelStyle: {
                fontSize: 11,
                fill: "#6b7280",
              },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: maxValue + Math.ceil(maxValue * 0.1),
              tickLabelStyle: {
                fontSize: 11,
                fill: "#6b7280",
              },
            },
          ]}
          series={[
            {
              data: yAxisData,
              color: "#036b80",
              curve: "natural",
              showMark: true,
              area: true,
            },
          ]}
          height={280}
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2.5,
            },
            "& .MuiMarkElement-root": {
              scale: "0.8",
              fill: "#036b80",
              strokeWidth: 2,
            },
            "& .MuiAreaElement-root": {
              fill: "url(#areaGradient)",
            },
          }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#036b80" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#036b80" stopOpacity={0.05} />
            </linearGradient>
          </defs>
        </LineChart>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">{t("total_leads")}</p>
            <p className="text-sm font-semibold text-gray-900">{totalLeads}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("peak_week")}</p>
            <p className="text-sm font-semibold text-gray-900">{maxValue}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("avg_per_week")}</p>
            <p className="text-sm font-semibold text-gray-900">{avgPerWeek}</p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
