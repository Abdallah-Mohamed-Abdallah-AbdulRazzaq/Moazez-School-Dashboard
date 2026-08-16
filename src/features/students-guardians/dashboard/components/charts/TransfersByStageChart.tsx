"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import {
  fetchTransfersWithdrawalsStageBreakdown,
  type StageBreakdownPoint,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

const BarChart = dynamic(
  () => import("@mui/x-charts/BarChart").then((mod) => mod.BarChart),
  { ssr: false },
);

export default function TransfersByStageChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [stageData, setStageData] = useState<StageBreakdownPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await fetchTransfersWithdrawalsStageBreakdown();
        if (!isCancelled) {
          setStageData(data);
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
  }, []);

  const stages = stageData.map((d) => t(`filters.stages.${d.stage.toLowerCase()}`));
  const transfers = stageData.map((d) => d.transfers);
  const withdrawals = stageData.map((d) => d.withdrawals);

  return (
    <ChartCard
      title={t("charts.by_stage.title")}
      description={t("charts.by_stage.description")}
      bgColor="#d1fae5"
    >
      <div className="w-full overflow-x-auto mt-4">
        {isLoading ? (
          <PartialLoader />
        ) : (
          <BarChart
            width={width}
            height={height}
            series={[
              {
                data: transfers,
                label: t("charts.by_stage.transfers"),
                color: "#036b80",
                stack: "total",
              },
              {
                data: withdrawals,
                label: t("charts.by_stage.withdrawals"),
                color: "#ef4444",
                stack: "total",
              },
            ]}
            xAxis={[
              {
                scaleType: "band",
                data: stages,
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
