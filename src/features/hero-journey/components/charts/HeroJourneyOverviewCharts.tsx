"use client";

import { useLocale, useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { ChartCard } from "@/components/ui";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import type { HeroJourneyOverviewMetrics } from "../../types";

interface HeroJourneyOverviewChartsProps {
  overview: HeroJourneyOverviewMetrics;
}

function LegendList({
  items,
  locale,
}: {
  items: HeroJourneyOverviewMetrics["missionStatusBreakdown"];
  locale: string;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-sm text-gray-700">
              {locale === "ar" ? item.labelAr : item.labelEn}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function HeroJourneyOverviewCharts({
  overview,
}: HeroJourneyOverviewChartsProps) {
  const locale = useLocale();
  const t = useTranslations("heroJourney.charts");
  const chart = useResponsiveChart();

  const stageDataset = overview.completionByStage.map((item) => ({
    label: locale === "ar" ? item.stageNameAr : item.stageNameEn,
    completionRate: item.completionRate,
    activeStudents: item.activeStudents,
  }));

  const streakDataset = overview.streakDistribution.map((item) => ({
    label: locale === "ar" ? item.labelAr : item.labelEn,
    value: item.value,
  }));

  const dropOffDataset = overview.topMissionDropOff.map((item) => ({
    label:
      locale === "ar"
        ? item.titleAr.split(":")[0] || item.titleAr
        : item.titleEn.split(":")[0] || item.titleEn,
    value: item.dropOffRate,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard
        title={t("missionStatusBreakdown")}
        subtitle={t("missionStatusBreakdownSubtitle")}
        showPeriodFilter={false}
        className="overflow-hidden p-4 sm:p-6"
      >
        <PieChart
          height={chart.isMobile ? 220 : 260}
          series={[
            {
              data: overview.missionStatusBreakdown.map((item) => ({
                id: item.id,
                value: item.value,
                label: locale === "ar" ? item.labelAr : item.labelEn,
                color: item.color,
              })),
              innerRadius: 45,
              outerRadius: 88,
            },
          ]}
        />
        <LegendList items={overview.missionStatusBreakdown} locale={locale} />
      </ChartCard>

      <ChartCard
        title={t("xpTrend")}
        subtitle={t("xpTrendSubtitle")}
        showPeriodFilter={false}
        className="overflow-hidden p-4 sm:p-6"
      >
        <LineChart
          dataset={
            overview.xpTrend as unknown as Array<Record<string, string | number>>
          }
          xAxis={[{ scaleType: "point", dataKey: "label" }]}
          series={[{ dataKey: "value", color: "#0f766e" }]}
          height={chart.height}
          margin={{ top: 16, right: 20, left: chart.leftMargin, bottom: 36 }}
        />
      </ChartCard>

      <ChartCard
        title={t("completionByStage")}
        subtitle={t("completionByStageSubtitle")}
        showPeriodFilter={false}
        className="overflow-hidden p-4 sm:p-6"
      >
        <BarChart
          dataset={stageDataset as Array<Record<string, string | number>>}
          xAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "completionRate", color: "#036b80" }]}
          height={chart.height}
          margin={{ top: 16, right: 20, left: chart.leftMargin, bottom: 36 }}
        />
      </ChartCard>

      <ChartCard
        title={t("streakDistribution")}
        subtitle={t("streakDistributionSubtitle")}
        showPeriodFilter={false}
        className="overflow-hidden p-4 sm:p-6"
      >
        <BarChart
          dataset={streakDataset as Array<Record<string, string | number>>}
          xAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "value", color: "#0ea5e9" }]}
          height={chart.height}
          margin={{ top: 16, right: 20, left: chart.leftMargin, bottom: 36 }}
        />
      </ChartCard>

      <ChartCard
        title={t("topMissionDropOff")}
        subtitle={t("topMissionDropOffSubtitle")}
        showPeriodFilter={false}
        className="overflow-hidden p-4 sm:p-6 xl:col-span-2"
      >
        <BarChart
          dataset={dropOffDataset as Array<Record<string, string | number>>}
          xAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "value", color: "#f59e0b" }]}
          height={chart.isMobile ? 260 : 300}
          margin={{ top: 16, right: 20, left: chart.leftMargin, bottom: 56 }}
        />
      </ChartCard>
    </div>
  );
}
