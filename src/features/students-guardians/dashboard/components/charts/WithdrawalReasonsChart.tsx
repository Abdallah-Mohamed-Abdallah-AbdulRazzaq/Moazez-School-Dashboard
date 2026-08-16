"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import { fetchWithdrawalReasonsBreakdown } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

type Stage = "all" | "primary" | "preparatory" | "secondary";

const PieChart = dynamic(
  () => import("@mui/x-charts/PieChart").then((mod) => mod.PieChart),
  { ssr: false },
);

export default function WithdrawalReasonsChart() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const { width } = useResponsiveChart();
  const [selectedStage, setSelectedStage] = useState<Stage>("all");
  const [reasons, setReasons] = useState<{ reason: string; value: number }[]>(
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
        const data = await fetchWithdrawalReasonsBreakdown(selectedStage);
        if (!isCancelled) {
          setReasons(data);
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

  const chartData = useMemo(
    () =>
      reasons.map((item, index) => ({
        id: index,
        value: item.value,
        label: t(`filters.reasons.${item.reason}`),
        color: ["#036b80", "#3b82f6", "#8b5cf6", "#ef4444", "#6b7280"][index % 5],
      })),
    [reasons, t],
  );

  const stageOptions: DropdownItem[] = [
    { label: t("filters.all_stages"), value: "all" },
    { label: t("filters.stages.primary"), value: "primary" },
    { label: t("filters.stages.preparatory"), value: "preparatory" },
    { label: t("filters.stages.secondary"), value: "secondary" },
  ];

  return (
    <ChartCard
      title={t("charts.reasons.title")}
      description={t("charts.reasons.description")}
      periodOptions={stageOptions}
      defaultPeriod={selectedStage}
      onPeriodChange={(value) => setSelectedStage(value as Stage)}
      bgColor="#fef3c7"
    >
      <div className="w-full flex flex-col items-center mt-4">
        {isLoading ? (
          <PartialLoader />
        ) : (
          <PieChart
            series={[
              {
                data: chartData,
                highlightScope: { fade: "global", highlight: "item" },
                innerRadius: 60,
                outerRadius: 120,
                paddingAngle: 2,
                cornerRadius: 5,
                arcLabel: (item) => `${item.value}`,
                arcLabelMinAngle: 35,
              },
            ]}
            width={Math.min(width, 500)}
            height={300}
            margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
            slotProps={{
              legend: {
                direction: "horizontal",
                position: { vertical: "bottom", horizontal: "center" },
              },
            }}
          />
        )}
      </div>
    </ChartCard>
  );
}
