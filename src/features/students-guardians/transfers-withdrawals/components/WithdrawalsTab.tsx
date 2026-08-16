// FILE: src/components/students-guardians/transfers-withdrawals/WithdrawalsTab.tsx

"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  Plus,
  UserMinus,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Search,
  X,
} from "lucide-react";
import { FilterPanel } from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import WithdrawalsTable from "./WithdrawalsTable";
import CreateWithdrawalModal from "./modals/CreateWithdrawalModal";
import WithdrawalsTrendChart from "./charts/WithdrawalsTrendChart";
import WithdrawalsByStageChart from "./charts/WithdrawalsByStageChart";
import WithdrawalReasonsChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalsByBehaviorChart";
import type { WithdrawalsFilters as FiltersType } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  createWithdrawal,
  filterWithdrawals,
  getTransfersWithdrawalsSnapshot,
  subscribeTransfersWithdrawals,
  updateWithdrawalStatus,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatWithdrawalsForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function WithdrawalsTab() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    stage: "all",
    reason: "all",
    status: "all",
    behaviorBand: "all",
    financialClearance: "all",
  });

  useSyncExternalStore(
    subscribeTransfersWithdrawals,
    getTransfersWithdrawalsSnapshot,
    getTransfersWithdrawalsSnapshot,
  );

  const filteredData = filterWithdrawals({ ...filters, searchQuery });

  // Calculate KPIs
  const withdrawalsThisMonth = filteredData.length;
  const dropoutRate = 0;
  const behaviorRelated = filteredData.filter(
    (w) => w.reason === "behavior",
  ).length;
  const financialPending = filteredData.filter(
    (w) => w.financialClearance === "pending",
  ).length;

  // Show alert if dropout rate exceeds threshold
  const dropoutThreshold = 5;
  const showDropoutAlert = dropoutRate > dropoutThreshold;

  const hasActiveFilters =
    searchQuery !== "" ||
    filters.stage !== "all" ||
    filters.reason !== "all" ||
    filters.status !== "all" ||
    filters.behaviorBand !== "all" ||
    filters.financialClearance !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      stage: "all",
      reason: "all",
      status: "all",
      behaviorBand: "all",
      financialClearance: "all",
    });
  };

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatWithdrawalsForExport(filteredData, exportLocale),
      format,
      filenameBase: "withdrawals",
      emptyMessage: t("withdrawals.table.no_data"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("withdrawals.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("withdrawals.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t("withdrawals.new_withdrawal")}
          </button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <KPICardV2
          title={t("withdrawals.kpis.financial_pending")}
          value={financialPending}
          subtitle={t("withdrawals.kpis.awaiting_clearance")}
          icon={DollarSign}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WithdrawalsTrendChart />
        <WithdrawalsByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters.filters_button")}
        toggleAriaLabel={t("filters.filters_button")}
        className="p-0 bg-transparent shadow-none"
        clearAction={null}
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("filters.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                {t("filters.clear_filters")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.stage")}
              </label>
              <select
                value={filters.stage || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    stage: e.target.value as
                      | "all"
                      | "primary"
                      | "preparatory"
                      | "secondary",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_stages")}</option>
                <option value="primary">{t("filters.stages.primary")}</option>
                <option value="preparatory">
                  {t("filters.stages.preparatory")}
                </option>
                <option value="secondary">
                  {t("filters.stages.secondary")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.reason")}
              </label>
              <select
                value={filters.reason || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    reason: e.target.value as
                      | "all"
                      | "relocation"
                      | "financial"
                      | "academic"
                      | "behavior"
                      | "health"
                      | "other",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_reasons")}</option>
                <option value="relocation">
                  {t("filters.reasons.relocation")}
                </option>
                <option value="financial">
                  {t("filters.reasons.financial")}
                </option>
                <option value="academic">
                  {t("filters.reasons.academic")}
                </option>
                <option value="behavior">
                  {t("filters.reasons.behavior")}
                </option>
                <option value="health">{t("filters.reasons.health")}</option>
                <option value="other">{t("filters.reasons.other")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.status")}
              </label>
              <select
                value={filters.status || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as
                      | "all"
                      | "draft"
                      | "submitted"
                      | "under_review"
                      | "finance_clearance"
                      | "behavior_review"
                      | "approved"
                      | "rejected"
                      | "executed",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_statuses")}</option>
                <option value="draft">{t("filters.statuses.draft")}</option>
                <option value="submitted">
                  {t("filters.statuses.submitted")}
                </option>
                <option value="under_review">
                  {t("filters.statuses.under_review")}
                </option>
                <option value="finance_clearance">
                  {t("filters.statuses.finance_clearance")}
                </option>
                <option value="behavior_review">
                  {t("filters.statuses.behavior_review")}
                </option>
                <option value="approved">
                  {t("filters.statuses.approved")}
                </option>
                <option value="rejected">
                  {t("filters.statuses.rejected")}
                </option>
                <option value="executed">
                  {t("filters.statuses.executed")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.behavior_band")}
              </label>
              <select
                value={filters.behaviorBand || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    behaviorBand: e.target.value as
                      | "all"
                      | "low"
                      | "medium"
                      | "high",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_bands")}</option>
                <option value="low">{t("filters.behavior_bands.low")}</option>
                <option value="medium">
                  {t("filters.behavior_bands.medium")}
                </option>
                <option value="high">{t("filters.behavior_bands.high")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("filters.financial_clearance")}
              </label>
              <select
                value={filters.financialClearance || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    financialClearance: e.target.value as
                      | "all"
                      | "pending"
                      | "cleared"
                      | "blocked",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_clearances")}</option>
                <option value="pending">
                  {t("filters.financial_clearances.pending")}
                </option>
                <option value="cleared">
                  {t("filters.financial_clearances.cleared")}
                </option>
                <option value="blocked">
                  {t("filters.financial_clearances.blocked")}
                </option>
              </select>
            </div>
          </div>
        }
      />

      {/* Table */}
      <WithdrawalsTable
        data={filteredData}
        onApprove={async (id) => {
          await updateWithdrawalStatus(id, "approved");
        }}
        onReject={async (id) => {
          await updateWithdrawalStatus(id, "rejected");
        }}
        onExecute={async (id) => {
          await updateWithdrawalStatus(id, "executed");
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWithdrawalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createWithdrawal(data);
            setShowCreateModal(false);
          }}
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("withdrawals.subtitle")}
        datasetCount={filteredData.length}
        emptyStateMessage={t("withdrawals.table.no_data")}
      />
    </div>
  );
}
