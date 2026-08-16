"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import {
  fetchWithdrawalsBehaviorBreakdown,
  type BehaviorBreakdownPoint,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

const BarChart = dynamic(
  () => import("@mui/x-charts/BarChart").then((mod) => mod.BarChart),
  { ssr: false },
);

export default function WithdrawalsByBehaviorChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width, height } = useResponsiveChart();
  const [behaviorData, setBehaviorData] = useState<BehaviorBreakdownPoint[]>(
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
        const data = await fetchWithdrawalsBehaviorBreakdown();
        if (!isCancelled) {
          setBehaviorData(data);
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

  const ranges = behaviorData.map((d) => d.label);
  const withdrawals = behaviorData.map((d) => d.withdrawals);

  return (
    <ChartCard
      title={t("charts.behavior.title")}
      description={t("charts.behavior.description")}
      bgColor="#ede9fe"
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
                data: withdrawals,
                label: t("charts.behavior.withdrawals"),
                color: "#ef4444",
              },
            ]}
            xAxis={[
              {
                scaleType: "band",
                data: ranges,
                label: t("charts.behavior.x_axis"),
                tickLabelStyle: {
                  fontSize: 14,
                  fontWeight: 500,
                },
              },
            ]}
            yAxis={[
              {
                label: t("charts.behavior.y_axis"),
                tickLabelStyle: {
                  fontSize: 14,
                  fontWeight: 500,
                },
              },
            ]}
            margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
          />
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900">
          {t("charts.behavior.insight_title")}:
        </p>
        <p className="text-sm text-blue-800 mt-1">
          {t("charts.behavior.insight_text")}
        </p>
      </div>
    </ChartCard>
  );
}
