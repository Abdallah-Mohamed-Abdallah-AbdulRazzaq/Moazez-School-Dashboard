// FILE: src/components/students-guardians/transfers-withdrawals/charts/WithdrawalsByStageChart.tsx

"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";

const BarChart = dynamic(
  () => import("@mui/x-charts/BarChart").then((mod) => mod.BarChart),
  { ssr: false },
);

export default function WithdrawalsByStageChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals.charts");

  const stages: string[] = [];
  const behaviorData: number[] = [];
  const financialData: number[] = [];
  const otherData: number[] = [];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("by_stage.title")}
        </h3>
      </div>

      <BarChart
        height={300}
        series={[
          { data: behaviorData, label: t("behavior_related"), stack: "total" },
          {
            data: financialData,
            label: t("financial_related"),
            stack: "total",
          },
          { data: otherData, label: t("other_reasons"), stack: "total" },
        ]}
        xAxis={[{ scaleType: "band", data: stages }]}
      />
    </div>
  );
}
