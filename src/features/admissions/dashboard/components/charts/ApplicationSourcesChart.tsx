// FILE: src/components/admissions/charts/ApplicationSourcesChart.tsx

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChartCard } from "@/components/ui/chart-card";

interface ApplicationSourcesChartProps {
  data: { source: string; count: number }[];
}

const SOURCE_COLORS: Record<string, string> = {
  "In App": "#036b80", // primary teal
  Referral: "#10b981", // green
  "Walk-in": "#f59e0b", // amber
  Other: "#6b7280", // gray
};

export default function ApplicationSourcesChart({
  data,
}: ApplicationSourcesChartProps) {
  const t = useTranslations("admissions.charts");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Helper function to get translation key from source
  const getSourceKey = (source: string): string => {
    return source.toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_");
  };

  // Get translated source label
  const getTranslatedSource = (source: string): string => {
    const key = getSourceKey(source);
    return t(key);
  };

  const chartData = data.map((item, index) => ({
    id: index,
    value: item.count,
    color: SOURCE_COLORS[item.source] || SOURCE_COLORS["Other"],
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const periodOptions = [
    { label: t("all_time"), value: "all" },
    { label: t("this_month"), value: "month" },
    { label: t("this_term"), value: "term" },
    { label: t("this_year"), value: "year" },
  ];

  if (total === 0) {
    return (
      <ChartCard
        title={t("application_sources")}
        subtitle={t("source_distribution")}
        description={t("application_sources_desc")}
        periodOptions={periodOptions}
        defaultPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        bgColor="#d1fae5"
        className="h-full flex flex-col justify-between"
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={t("application_sources")}
      subtitle={t("source_distribution")}
      description={t("application_sources_desc")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      bgColor="#d1fae5"
    >
      <div className="flex items-center justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
              faded: { innerRadius: 30, additionalRadius: -10, color: "gray" },
            },
          ]}
          height={280}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    SOURCE_COLORS[item.source] || SOURCE_COLORS["Other"],
                }}
              />
              <span className="text-sm text-gray-700">
                {getTranslatedSource(item.source)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">
                {item.count}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
