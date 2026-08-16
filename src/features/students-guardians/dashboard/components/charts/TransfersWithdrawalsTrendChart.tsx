"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import {
  fetchTransfersWithdrawalsTrendData,
  type TransfersWithdrawalsTrendPoint,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

type Stage = "all" | "primary" | "preparatory" | "secondary";

const LineChart = dynamic(
  () => import("@mui/x-charts/LineChart").then((mod) => mod.LineChart),
  { ssr: false },
);

export default function TransfersWithdrawalsTrendChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [selectedStage, setSelectedStage] = useState<Stage>("all");
  const [chartData, setChartData] = useState<TransfersWithdrawalsTrendPoint[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await fetchTransfersWithdrawalsTrendData(selectedStage);
        if (!isCancelled) {
          setChartData(data);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedStage]);

  const months = chartData.map((d) => d.month);
  const transfers = chartData.map((d) => d.transfers);
  const withdrawals = chartData.map((d) => d.withdrawals);

  const stageOptions: DropdownItem[] = [
    { label: t("filters.all_stages"), value: "all" },
    { label: t("filters.stages.primary"), value: "primary" },
    { label: t("filters.stages.preparatory"), value: "preparatory" },
    { label: t("filters.stages.secondary"), value: "secondary" },
  ];

  return (
    <ChartCard
      title={t("charts.trend.title")}
      description={t("charts.trend.description")}
      periodOptions={stageOptions}
      defaultPeriod={selectedStage}
      onPeriodChange={(value) => setSelectedStage(value as Stage)}
      bgColor="#dbeafe"
    >
      <div className="w-full overflow-x-auto mt-4">
        {isLoading ? (
          <PartialLoader />
        ) : (
          <LineChart
            width={width}
            height={height}
            series={[
              {
                data: transfers,
                label: t("charts.trend.transfers"),
                color: "#036b80",
                curve: "linear",
              },
              {
                data: withdrawals,
                label: t("charts.trend.withdrawals"),
                color: "#ef4444",
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
          />
        )}
      </div>
    </ChartCard>
  );
}
