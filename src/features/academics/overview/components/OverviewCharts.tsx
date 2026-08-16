"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "@/components/ui/chart-card/ChartCard";
import { TrendingUp, CheckCircle, XCircle } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface ReadinessDatum {
  key: "ready" | "notReady";
  name: string;
  value: number;
  color: string;
}

interface OverviewChartsProps {
  readinessData: ReadinessDatum[];
  readyForScheduling?: boolean;
  readyForLearningFlow?: boolean;
  isLoading?: boolean;
}

export default function OverviewCharts({
  readinessData,
  readyForScheduling,
  readyForLearningFlow,
  isLoading,
}: OverviewChartsProps) {
  const t = useTranslations("academics.overview.charts.readiness");
  const tSnapshot = useTranslations("academics.overview.readinessSnapshot");

  if (isLoading) {
    return <PartialLoader />;
  }

  const hasReadinessData =
    readinessData.length > 0 && readinessData.some((d) => d.value > 0);

  const readinessInsight = hasReadinessData
    ? (() => {
        const readyData = readinessData.find((datum) => datum.key === "ready");
        const percentage = readyData?.value || 0;
        return percentage >= 75
          ? t("insightGood", { percentage })
          : t("insightNeedsWork", { percentage });
      })()
    : "";

  return (
    <div className="grid grid-cols-1 gap-6">
      <ChartCard title={tSnapshot("title")} showPeriodFilter={false}>
        {readinessInsight && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">{readinessInsight}</p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {hasReadinessData ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={readinessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {readinessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800">
                  {readinessData.find((d) => d.key === "ready")?.value || 0}%
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-2">
                {readinessData.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex min-w-0 items-center gap-2 text-xs text-gray-600"
                    dir="auto"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{entry.name}</span>
                    <span className="font-semibold text-gray-800">
                      {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {t("noData")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-1 items-center justify-center text-center p-2 rounded bg-gray-50">
              <span className="text-xs text-gray-500">
                {tSnapshot("readyForScheduling")}
              </span>
              {readyForScheduling ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex flex-col gap-1 items-center justify-center text-center p-2 rounded bg-gray-50">
              <span className="text-xs text-gray-500">
                {tSnapshot("readyForLearningFlow")}
              </span>
              {readyForLearningFlow ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
