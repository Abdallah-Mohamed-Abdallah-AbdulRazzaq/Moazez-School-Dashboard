// FILE: src/components/students-guardians/transfers-withdrawals/charts/TransfersByReasonChart.tsx

"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";

const PieChart = dynamic(
  () => import("@mui/x-charts/PieChart").then((mod) => mod.PieChart),
  { ssr: false },
);

export default function TransfersByReasonChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const chartData: Array<{
    id: number;
    value: number;
    label: string;
    color: string;
  }> = [];

  return (
    <ChartCard
      title={t("charts.transfers_by_reason.title")}
      description={t("charts.transfers_by_reason.description")}
      bgColor="#dbeafe"
    >
      <div className="w-full flex flex-col items-center mt-4">
        <PieChart
          series={[
            {
              data: chartData,
              highlightScope: { fade: "global", highlight: "item" },
              innerRadius: 60,
              outerRadius: 120,
              paddingAngle: 2,
              cornerRadius: 5,
              arcLabel: (item) => `${item.value}%`,
              arcLabelMinAngle: 35,
            },
          ]}
          width={Math.min(width, 500)}
          height={Math.min(height, 300)}
          margin={{ top: 100, right: 70, bottom: 100, left: 70 }}
          slotProps={{
            legend: {
              direction: "horizontal",
              position: { vertical: 'bottom', horizontal: 'center' },
            },
          }}
        />
      </div>
    </ChartCard>
  );
}
