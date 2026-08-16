"use client";

import { useTranslations } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers,
  Shield,
  Target,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type { ReportsKpiCard, ReportsTrendPoint } from "../types";

interface ReportsOverviewCardsProps {
  cards: ReportsKpiCard[];
  trendPoints: ReportsTrendPoint[];
  onCardClick: (key: ReportsKpiCard["key"]) => void;
}

export default function ReportsOverviewCards({
  cards,
  trendPoints,
  onCardClick,
}: ReportsOverviewCardsProps) {
  const t = useTranslations("attendance.reportsPage.kpis");

  const getCardConfig = (card: ReportsKpiCard) => {
    switch (card.key) {
      case "attendanceRate":
        return {
          icon: Target,
          trendValues: trendPoints.map((point) => point.attendanceRate),
          ...getKpiIconStyle(card.value >= 95 ? "success" : card.value >= 85 ? "primary" : "warning"),
        };
      case "presentCount":
        return {
          icon: CheckCircle2,
          trendValues: trendPoints.map((point) => point.presentCount),
          ...getKpiIconStyle("success"),
        };
      case "absentCount":
        return {
          icon: AlertCircle,
          trendValues: trendPoints.map((point) => point.absentCount),
          ...getKpiIconStyle(card.value > 0 ? "danger" : "neutral"),
        };
      case "excusedCount":
        return {
          icon: Shield,
          trendValues: trendPoints.map((point) => point.excusedCount),
          ...getKpiIconStyle("primary"),
        };
      case "lateCount":
        return {
          icon: Clock3,
          trendValues: trendPoints.map((point) => point.lateCount),
          ...getKpiIconStyle(card.value > 0 ? "warning" : "neutral"),
        };
      case "earlyLeaveCount":
        return {
          icon: CalendarClock,
          trendValues: trendPoints.map((point) => point.earlyLeaveCount),
          ...getKpiIconStyle(card.value > 0 ? "warning" : "neutral"),
        };
      case "riskStudents":
        return {
          icon: AlertTriangle,
          trendValues: [],
          ...getKpiIconStyle(card.value > 0 ? "danger" : "neutral"),
        };
      default:
        return {
          icon: Layers,
          trendValues: [],
          ...getKpiIconStyle(card.value > 0 ? "warning" : "neutral"),
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const config = getCardConfig(card);
        const chartData = config.trendValues.map((value, index) => ({
          label: trendPoints[index]?.label || String(index + 1),
          value,
          ts: trendPoints[index]?.dateTo,
        }));

        return (
        <button
          key={card.key}
          type="button"
          onClick={() => onCardClick(card.key)}
          className="text-start transition-transform hover:-translate-y-0.5"
        >
          <KPICardV2
            title={t(card.key)}
            value={card.displayValue}
            change={
              typeof card.delta === "number"
                ? {
                    value: card.delta,
                    percentage: Math.abs(card.delta),
                    isPositive: card.delta >= 0,
                  }
                : undefined
            }
            icon={config.icon}
            iconColor={config.iconFg}
            iconBgColor={config.iconBg}
            chartData={chartData}
            chartColor={config.iconFg}
            showChart={chartData.length > 0}
            className="h-full"
          />
        </button>
        );
      })}
    </div>
  );
}
