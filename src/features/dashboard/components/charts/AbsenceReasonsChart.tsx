"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import type { DashboardAbsenceReasonsData } from "@/features/dashboard/utils/dashboardStatsCalculator";

interface AbsenceReasonsChartProps {
  reasons: DashboardAbsenceReasonsData;
}

export default function AbsenceReasonsChart({
  reasons,
}: AbsenceReasonsChartProps) {
  const locale = useLocale();
  const t = useTranslations("absence_reasons");

  const data = useMemo(
    () => [
      { id: 0, key: "medical" as const, value: reasons.medical, color: "#10b981" },
      {
        id: 1,
        key: "permission" as const,
        value: reasons.permission,
        color: "#f59e0b",
      },
      {
        id: 2,
        key: "no_excuse" as const,
        value: reasons.noExcuse,
        color: "#ef4444",
      },
    ],
    [reasons]
  );

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        id: item.id,
        value: item.value,
        label: t(`types.${item.key}`),
        color: item.color,
      })),
    [data, t]
  );

  return (
    <ChartCard
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      showPeriodFilter={false}
      bgColor="#fee2e2"
      className="h-full flex flex-col justify-between"
    >
      <div className="flex items-center justify-center">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 50,
              outerRadius: 80,
              paddingAngle: 2,
              cornerRadius: 4,
            },
          ]}
          width={280}
          height={200}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      </div>

      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-md text-gray-600">
              {t(`types.${item.key}`)} ({item.value}%)
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-600">{reasons.noExcuse}%</span>{" "}
            {t("insight.without_valid_excuse")}
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
              {t("actions.contact_parents")}
            </Button>

            <Button size="sm" variant="secondary">
              {t("actions.create_plan")}
            </Button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
