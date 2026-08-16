// FILE: src/components/students-guardians/transfers-withdrawals/TransfersApplicationsPage.tsx

"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Plus, Search, X } from "lucide-react";
import { FilterPanel } from "@/components/ui";
import TransfersTable from "./TransfersTable";
import CreateTransferModal from "./modals/CreateTransferModal";
import type { TransfersFilters as FiltersType } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  createTransfer,
  filterTransfers,
  getTransfersWithdrawalsSnapshot,
  subscribeTransfersWithdrawals,
  updateTransferStatus,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatTransfersForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

export default function TransfersApplicationsPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { values, setValue, reset } = useUrlQueryState<{
    search: string;
    stage: string;
    type: string;
    status: string;
    behaviorBand: string;
  }>({
    defaults: {
      search: "",
      stage: "all",
      type: "all",
      status: "all",
      behaviorBand: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const searchQuery = values.search;
  const filters: FiltersType = {
    stage: values.stage as FiltersType["stage"],
    type: values.type as FiltersType["type"],
    status: values.status as FiltersType["status"],
    behaviorBand: values.behaviorBand as FiltersType["behaviorBand"],
  };

  useSyncExternalStore(
    subscribeTransfersWithdrawals,
    getTransfersWithdrawalsSnapshot,
    getTransfersWithdrawalsSnapshot,
  );

  const filteredData = filterTransfers({ ...filters, searchQuery });

  const hasActiveFilters =
    searchQuery !== "" ||
    filters.stage !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.behaviorBand !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
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
            {t("transfers.table.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("transfers.applications_subtitle")}
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
                onChange={(e) => setValue("search", e.target.value, "replace")}
                suppressHydrationWarning
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
                onChange={(e) => {
                  setValue("stage", e.target.value, "push");
                }}
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
                onChange={(e) => {
                  setValue("type", e.target.value, "push");
                }}
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
                onChange={(e) => {
                  setValue("status", e.target.value, "push");
                }}
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
                onChange={(e) => {
                  setValue("behaviorBand", e.target.value, "push");
                }}
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
        urlStateKeyPrefix="transferApplicationsTable"
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
        subtitle={t("transfers.applications_subtitle")}
        datasetCount={filteredData.length}
        emptyStateMessage={t("transfers.table.no_data")}
      />
    </div>
  );
}
