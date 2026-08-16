// FILE: src/components/students-guardians/transfers-withdrawals/TransfersOverviewPage.tsx

"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Download,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TransfersTrendChart from "./charts/TransfersTrendChart";
import TransfersByStageChart from "@/features/students-guardians/dashboard/components/charts/TransfersByStageChart";
import TransfersByReasonChart from "./charts/TransfersByReasonChart";
import {
  fetchTransfersWithdrawalsStageBreakdown,
  getAllTransfers,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import {
  createTransfersOverviewAnalyticsJson,
  formatTransfersOverviewAnalyticsForExport,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function TransfersOverviewPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [showExportModal, setShowExportModal] = useState(false);

  const allTransfers = useMemo(() => getAllTransfers(), []);

  // Calculate KPIs
  const transfersThisMonth = allTransfers.length;
  const internalTransfers = allTransfers.filter(
    (t) => t.type === "internal",
  ).length;
  const externalTransfers = allTransfers.filter(
    (t) => t.type === "external",
  ).length;
  const netChange = internalTransfers - externalTransfers;

  const handleExport = async (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );
    const isEnglish = exportLocale === "en";
    const stageBreakdown = await fetchTransfersWithdrawalsStageBreakdown();

    const analyticsData = {
      generatedAt: new Date().toISOString(),
      kpis: [
        {
          label: isEnglish ? "Transfers This Month" : t("transfers.kpis.transfers_this_month"),
          value: transfersThisMonth,
          subtitle: isEnglish ? "Total transfers" : t("transfers.kpis.total_transfers"),
        },
        {
          label: isEnglish ? "Internal Transfers" : t("transfers.kpis.internal_transfers"),
          value: internalTransfers,
          subtitle: isEnglish ? "Within school" : t("transfers.kpis.within_school"),
        },
        {
          label: isEnglish ? "External Transfers" : t("transfers.kpis.external_transfers"),
          value: externalTransfers,
          subtitle: isEnglish ? "To other schools" : t("transfers.kpis.to_other_schools"),
        },
        {
          label: isEnglish ? "Net Change" : t("transfers.kpis.net_change"),
          value: netChange,
          subtitle:
            netChange >= 0
              ? isEnglish
                ? "Net positive"
                : t("transfers.kpis.net_positive")
              : isEnglish
                ? "Net negative"
                : t("transfers.kpis.net_negative"),
        },
      ],
      trend: [
        { period: "Jan", internal: 5, external: 3 },
        { period: "Feb", internal: 8, external: 4 },
        { period: "Mar", internal: 6, external: 5 },
        { period: "Apr", internal: 10, external: 3 },
        { period: "May", internal: 7, external: 6 },
        { period: "Jun", internal: 9, external: 4 },
      ],
      reasons: [
        {
          reason: isEnglish ? "Academic" : t("charts.reasons.academic"),
          percentage: 35,
        },
        {
          reason: isEnglish ? "Relocation" : t("charts.reasons.relocation"),
          percentage: 25,
        },
        {
          reason: isEnglish ? "Better Fit" : t("charts.reasons.better_fit"),
          percentage: 20,
        },
        {
          reason: isEnglish ? "Other" : t("charts.reasons.other"),
          percentage: 20,
        },
      ],
      byStage: stageBreakdown.map((item) => ({
        stage: isEnglish
          ? item.stage.charAt(0).toUpperCase() + item.stage.slice(1)
          : t(`filters.stages.${item.stage}`),
        transfers: item.transfers,
        withdrawals: item.withdrawals,
      })),
    };

    downloadStudentsGuardiansExport({
      data:
        format === "json"
          ? createTransfersOverviewAnalyticsJson(analyticsData)
          : formatTransfersOverviewAnalyticsForExport(
              analyticsData,
              exportLocale,
            ),
      format,
      filenameBase: "transfers-overview",
      emptyMessage: t("transfers.table.no_data"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("transfers.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t("transfers.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("transfers.kpis.transfers_this_month")}
          value={transfersThisMonth}
          subtitle={t("transfers.kpis.total_transfers")}
          icon={ArrowLeftRight}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("transfers.kpis.internal_transfers")}
          value={internalTransfers}
          subtitle={t("transfers.kpis.within_school")}
          icon={ArrowRight}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
        <KPICardV2
          title={t("transfers.kpis.external_transfers")}
          value={externalTransfers}
          subtitle={t("transfers.kpis.to_other_schools")}
          icon={ArrowLeft}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("transfers.kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          subtitle={
            netChange >= 0
              ? t("transfers.kpis.net_positive")
              : t("transfers.kpis.net_negative")
          }
          icon={TrendingUp}
          iconColor={netChange >= 0 ? "#10b981" : "#ef4444"}
          iconBgColor={netChange >= 0 ? "#d1fae5" : "#fee2e2"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TransfersTrendChart />
        <TransfersByReasonChart />
      </div>

      <TransfersByStageChart />

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("transfers.subtitle")}
      />
    </div>
  );
}
