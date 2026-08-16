"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  Target,
  Calendar,
  Clock,
  AlertCircle,
  Layers,
  Bell,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { PolicyKpis } from "../utils/policyKpis";
import { EXPIRY_WINDOW_DAYS } from "../utils/policyKpis";
import { getKpiIconStyle, getCoverageStyle } from "@/features/attendance/shared/statusStyles";

interface PoliciesKpiPanelProps {
  kpis: PolicyKpis | null;
  isLoading: boolean;
}

export default function PoliciesKpiPanel({
  kpis,
  isLoading,
}: PoliciesKpiPanelProps) {
  const t = useTranslations("attendance.policies.kpis");

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="mb-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 h-24 animate-pulse"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  const kpiCards = [
    {
      title: t("activePolicies"),
      value: kpis.activePoliciesCount,
      subtitle: undefined,
      icon: Shield,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle("primary"),
    },
    {
      title: t("coverage"),
      value: `${kpis.coveragePercent}%`,
      subtitle: t("coveredSections", {
        covered: kpis.coveredSectionsCount,
        total: kpis.totalSectionsCount,
      }),
      icon: Target,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getCoverageStyle(kpis.coveragePercent),
    },
    {
      title: t("dailyPolicies"),
      value: kpis.dailyCount,
      subtitle: kpis.derivedDailyCount > 0 ? t("derivedCount", { count: kpis.derivedDailyCount }) : undefined,
      icon: Calendar,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle(kpis.hasDaily ? "success" : "neutral"),
    },
    {
      title: t("periodPolicies"),
      value: kpis.periodCount,
      subtitle: undefined,
      icon: Clock,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle(kpis.hasPeriod ? "success" : "neutral"),
    },
    {
      title: t("notificationsEnabled"),
      value: kpis.notificationsEnabledCount,
      subtitle: undefined,
      icon: Bell,
      iconColor: "#8b5cf6",
      iconBgColor: "#ede9fe",
      ...getKpiIconStyle(kpis.notificationsEnabledCount > 0 ? "primary" : "neutral"),
    },
    {
      title: t("conflicts"),
      value: kpis.conflictsCount,
      subtitle: undefined,
      icon: AlertCircle,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle(kpis.conflictsCount > 0 ? "danger" : "success"),
    },
    {
      title: t("incompleteConfig"),
      value: kpis.incompleteConfigCount,
      subtitle: undefined,
      icon: AlertTriangle,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle(kpis.incompleteConfigCount > 0 ? "warning" : "neutral"),
    },
    {
      title: t("expiringSoon"),
      value: kpis.expiringSoonCount,
      subtitle: t("expiringSoonHint", { days: EXPIRY_WINDOW_DAYS }),
      icon: Layers,
      iconColor: undefined,
      iconBgColor: undefined,
      ...getKpiIconStyle(kpis.expiringSoonCount > 0 ? "warning" : "neutral"),
    },
  ];

  return (
    <div className="mb-6">
      {/* Header with Ready Badge */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        
        {/* Roll Call Ready Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            kpis.isRollCallReady
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {kpis.isRollCallReady ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("ready")}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>{t("needsSetup")}</span>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, index) => (
          <KPICardV2
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            iconColor={card.iconColor}
            iconBgColor={card.iconBgColor}
            showChart={false}
            className="h-full"
          />
        ))}
      </div>
    </div>
  );
}
