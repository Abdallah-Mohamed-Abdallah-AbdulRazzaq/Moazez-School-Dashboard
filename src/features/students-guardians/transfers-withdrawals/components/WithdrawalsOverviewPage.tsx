// FILE: src/components/students-guardians/transfers-withdrawals/WithdrawalsOverviewPage.tsx

"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UserMinus, TrendingDown, AlertTriangle, Download } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import WithdrawalsTrendChart from "./charts/WithdrawalsTrendChart";
import WithdrawalsByStageChart from "./charts/WithdrawalsByStageChart";
import WithdrawalReasonsChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalsByBehaviorChart";
import {
  fetchWithdrawalReasonsBreakdown,
  fetchWithdrawalsBehaviorBreakdown,
  getAllWithdrawals,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import {
  createWithdrawalsOverviewAnalyticsJson,
  formatWithdrawalsOverviewAnalyticsForExport,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function WithdrawalsOverviewPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [showExportModal, setShowExportModal] = useState(false);

  const allWithdrawals = useMemo(() => getAllWithdrawals(), []);

  // Calculate KPIs
  const withdrawalsThisMonth = allWithdrawals.length;
  const dropoutRate = 0;
  const behaviorRelated = allWithdrawals.filter(
    (w) => w.reason === "behavior",
  ).length;

  // Show alert if dropout rate exceeds threshold
  const dropoutThreshold = 5;
  const showDropoutAlert = dropoutRate > dropoutThreshold;

  const handleExport = async (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );
    const isEnglish = exportLocale === "en";
    const [reasonsBreakdown, behaviorBreakdown] = await Promise.all([
      fetchWithdrawalReasonsBreakdown(),
      fetchWithdrawalsBehaviorBreakdown(),
    ]);

    const analyticsData = {
      generatedAt: new Date().toISOString(),
      kpis: [
        {
          label:
            isEnglish
              ? "Withdrawals This Month"
              : t("withdrawals.kpis.withdrawals_this_month"),
          value: withdrawalsThisMonth,
          subtitle:
            isEnglish
              ? "Total withdrawals"
              : t("withdrawals.kpis.total_withdrawals"),
        },
        {
          label: isEnglish ? "Dropout Rate" : t("withdrawals.kpis.dropout_rate"),
          value: `${dropoutRate}%`,
          subtitle:
            dropoutRate > dropoutThreshold
              ? isEnglish
                ? "Above threshold"
                : t("withdrawals.kpis.above_threshold")
              : isEnglish
                ? "Within normal"
                : t("withdrawals.kpis.within_normal"),
        },
        {
          label:
            isEnglish
              ? "Behavior Related"
              : t("withdrawals.kpis.behavior_related"),
          value: behaviorRelated,
          subtitle:
            isEnglish
              ? "Low behavior score"
              : t("withdrawals.kpis.low_behavior_score"),
        },
      ],
      trend: [
        { period: "Jan", withdrawals: 4 },
        { period: "Feb", withdrawals: 6 },
        { period: "Mar", withdrawals: 5 },
        { period: "Apr", withdrawals: 8 },
        { period: "May", withdrawals: 7 },
        { period: "Jun", withdrawals: 6 },
      ],
      byStage: [
        {
          stage: isEnglish ? "Primary" : t("charts.stages.primary"),
          behaviorRelated: 3,
          financialRelated: 2,
          otherReasons: 4,
        },
        {
          stage: isEnglish ? "Preparatory" : t("charts.stages.preparatory"),
          behaviorRelated: 5,
          financialRelated: 3,
          otherReasons: 2,
        },
        {
          stage: isEnglish ? "Secondary" : t("charts.stages.secondary"),
          behaviorRelated: 4,
          financialRelated: 2,
          otherReasons: 3,
        },
      ],
      reasons: reasonsBreakdown.map((item) => ({
        reason: isEnglish
          ? item.reason.charAt(0).toUpperCase() + item.reason.slice(1)
          : t(`filters.reasons.${item.reason}`),
        count: item.value,
      })),
      behavior: behaviorBreakdown.map((item) => ({
        category: item.label,
        count: item.withdrawals,
      })),
    };

    downloadStudentsGuardiansExport({
      data:
        format === "json"
          ? createWithdrawalsOverviewAnalyticsJson(analyticsData)
          : formatWithdrawalsOverviewAnalyticsForExport(
              analyticsData,
              exportLocale,
            ),
      format,
      filenameBase: "withdrawals-overview",
      emptyMessage: t("withdrawals.table.no_data"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("withdrawals.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("withdrawals.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
      </div>

      {/* Dropout Alert */}
      {showDropoutAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {t("withdrawals.alerts.high_dropout_rate")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("withdrawals.alerts.dropout_message", { rate: dropoutRate })}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("withdrawals.kpis.withdrawals_this_month")}
          value={withdrawalsThisMonth}
          subtitle={t("withdrawals.kpis.total_withdrawals")}
          icon={UserMinus}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
        />
        <KPICardV2
          title={t("withdrawals.kpis.dropout_rate")}
          value={`${dropoutRate}%`}
          subtitle={
            dropoutRate > dropoutThreshold
              ? t("withdrawals.kpis.above_threshold")
              : t("withdrawals.kpis.within_normal")
          }
          icon={TrendingDown}
          iconColor={dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"}
          iconBgColor={dropoutRate > dropoutThreshold ? "#fee2e2" : "#d1fae5"}
        />
        <KPICardV2
          title={t("withdrawals.kpis.behavior_related")}
          value={behaviorRelated}
          subtitle={t("withdrawals.kpis.low_behavior_score")}
          icon={AlertTriangle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WithdrawalsTrendChart />
        <WithdrawalsByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("withdrawals.subtitle")}
      />
    </div>
  );
}
