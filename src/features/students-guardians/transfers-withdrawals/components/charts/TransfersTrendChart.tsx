// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersTrendChart.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";

type Period = "6months" | "year" | "all";

const LineChart = dynamic(
  () => import("@mui/x-charts/LineChart").then((mod) => mod.LineChart),
  { ssr: false },
);

export default function TransfersTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("6months");

  const months: string[] = [];
  const internalData: number[] = [];
  const externalData: number[] = [];

  const periodOptions: DropdownItem[] = [
    { label: t("filters.period.6months"), value: "6months" },
    { label: t("filters.period.year"), value: "year" },
    { label: t("filters.period.all"), value: "all" },
  ];

  return (
    <ChartCard
      title={t("charts.transfers_trend_title")}
      description={t("charts.transfers_trend_description")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={(value) => setSelectedPeriod(value as Period)}
      bgColor="#d1fae5"
    >
      <div className="w-full overflow-x-auto mt-4">
        <LineChart
          width={width}
          height={height}
          series={[
            {
              data: internalData,
              label: t("charts.internal_transfers"),
              color: "#10b981",
              curve: "linear",
            },
            {
              data: externalData,
              label: t("charts.external_transfers"),
              color: "#f59e0b",
              curve: "linear",
            },
          ]}
          xAxis={[
            {
              scaleType: "point",
              data: months,
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
          sx={{
            "& .MuiLineElement-root": {
              strokeWidth: 2,
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
