// FILE: src/components/students-guardians/transfers-withdrawals/TransfersTab.tsx

"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  Plus,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Search,
  X,
} from "lucide-react";
import { FilterPanel } from "@/components/ui";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TransfersTable from "./TransfersTable";
import CreateTransferModal from "./modals/CreateTransferModal";
import TransfersTrendChart from "./charts/TransfersTrendChart";
import TransfersByStageChart from "@/features/students-guardians/dashboard/components/charts/TransfersByStageChart";
import TransfersByReasonChart from "./charts/TransfersByReasonChart";
import type { TransfersFilters as FiltersType } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  createTransfer,
  filterTransfers,
  getTransfersWithdrawalsSnapshot,
  subscribeTransfersWithdrawals,
  updateTransferStatus,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatTransfersForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function TransfersTab() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({
    stage: "all",
    type: "all",
    status: "all",
    behaviorBand: "all",
  });

  useSyncExternalStore(
    subscribeTransfersWithdrawals,
    getTransfersWithdrawalsSnapshot,
    getTransfersWithdrawalsSnapshot,
  );

  const filteredData = filterTransfers({ ...filters, searchQuery });

  // Calculate KPIs
  const transfersThisMonth = filteredData.length;
  const internalTransfers = filteredData.filter(
    (t) => t.type === "internal",
  ).length;
  const externalTransfers = filteredData.filter(
    (t) => t.type === "external",
  ).length;
  const netChange = internalTransfers - externalTransfers;

  const hasActiveFilters =
    searchQuery !== "" ||
    filters.stage !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.behaviorBand !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      stage: "all",
      type: "all",
      status: "all",
      behaviorBand: "all",
    });
  };

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatTransfersForExport(filteredData, exportLocale),
      format,
      filenameBase: "transfers",
      emptyMessage: t("transfers.table.no_data"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("transfers.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("transfers.subtitle")}
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
            {t("transfers.new_transfer")}
          </button>
        </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TransfersTrendChart />
        </div>
        <TransfersByReasonChart />
      </div>

      <TransfersByStageChart />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                {t("filters.type")}
              </label>
              <select
                value={filters.type || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    type: e.target.value as "all" | "internal" | "external",
                  })
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("filters.all_types")}</option>
                <option value="internal">{t("filters.types.internal")}</option>
                <option value="external">{t("filters.types.external")}</option>
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
          </div>
        }
      />

      {/* Table */}
      <TransfersTable
        data={filteredData}
        onApprove={async (id) => {
          await updateTransferStatus(id, "approved");
        }}
        onReject={async (id) => {
          await updateTransferStatus(id, "rejected");
        }}
        onExecute={async (id) => {
          await updateTransferStatus(id, "executed");
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTransferModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createTransfer(data);
            setShowCreateModal(false);
          }}
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("transfers.subtitle")}
        datasetCount={filteredData.length}
        emptyStateMessage={t("transfers.table.no_data")}
      />
    </div>
  );
}
