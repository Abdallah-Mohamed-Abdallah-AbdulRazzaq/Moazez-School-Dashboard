"use client";

import { useEffect, useState } from "react";
import { Download, FileText, BarChart3, Calendar, Table } from "lucide-react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import type { AdmissionsExportFormat } from "@/features/admissions/shared/utils/admissionsExport";

type DashboardExportType = "data" | "analytics";
type DashboardDataset = "leads" | "applications" | "decisions" | "enrollments";

interface AdmissionsGlobalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: AdmissionsExportFormat;
    exportType?: DashboardExportType;
    datasets?: DashboardDataset[];
  }) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  currentDateRange?: {
    value: string;
    customStart?: string;
    customEnd?: string;
  };
  mode?: "list" | "dashboard";
  datasetCount?: number;
  emptyStateMessage?: string;
}

export default function AdmissionsGlobalExportModal({
  isOpen,
  onClose,
  onExport,
  title,
  subtitle,
  confirmLabel,
  currentDateRange,
  mode = "list",
  datasetCount,
  emptyStateMessage,
}: AdmissionsGlobalExportModalProps) {
  const t = useTranslations("admissions.export");
  const [exportType, setExportType] = useState<DashboardExportType>("data");
  const [format, setFormat] = useState<AdmissionsExportFormat>("csv");
  const [selectedDatasets, setSelectedDatasets] = useState<DashboardDataset[]>([
    "leads",
    "applications",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      void Promise.resolve().then(() => {
        setExportType("data");
        setFormat("csv");
        setSelectedDatasets(["leads", "applications"]);
        setIsExporting(false);
      });
    }
  }, [isOpen]);

  const isDashboard = mode === "dashboard";
  const hasListData = datasetCount === undefined || datasetCount > 0;

  const datasetOptions: Array<{
    value: DashboardDataset;
    label: string;
    description: string;
  }> = [
    {
      value: "leads",
      label: t("datasets.leads.label"),
      description: t("datasets.leads.description"),
    },
    {
      value: "applications",
      label: t("datasets.applications.label"),
      description: t("datasets.applications.description"),
    },
    {
      value: "decisions",
      label: t("datasets.decisions.label"),
      description: t("datasets.decisions.description"),
    },
    {
      value: "enrollments",
      label: t("datasets.enrollments.label"),
      description: t("datasets.enrollments.description"),
    },
  ];

  const toggleDataset = (dataset: DashboardDataset) => {
    setSelectedDatasets((previous) =>
      previous.includes(dataset)
        ? previous.filter((item) => item !== dataset)
        : [...previous, dataset],
    );
  };

  const handleExport = async () => {
    if (isDashboard && exportType === "data" && selectedDatasets.length === 0) {
      alert(t("errors.noDatasets"));
      return;
    }

    if (!isDashboard && !hasListData) {
      alert(emptyStateMessage || t("errors.noData"));
      return;
    }

    setIsExporting(true);

    try {
      await onExport({
        format,
        exportType: isDashboard ? exportType : undefined,
        datasets: isDashboard ? selectedDatasets : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Admissions export error:", error);
      alert(
        error instanceof Error
          ? error.message
          : t("errors.exportFailedGeneric"),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const actionLabel =
    confirmLabel ||
    (isDashboard
      ? exportType === "data"
        ? t("actions.exportData")
        : t("actions.exportAnalytics")
      : t("actions.export"));

  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={isExporting}
        className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
      >
        {t("actions.cancel")}
      </button>
      <button
        onClick={handleExport}
        disabled={
          isExporting ||
          (isDashboard &&
            exportType === "data" &&
            selectedDatasets.length === 0) ||
          (!isDashboard && !hasListData)
        }
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-hover disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t("actions.exporting")}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {actionLabel}
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t("title")}
      description={subtitle || t("subtitle")}
      size="lg"
      footer={footer}
      icon={<Download className="h-6 w-6" />}
      variant="confirm"
      className="max-h-[90vh]"
    >
      <div className="space-y-6 py-2">
          {isDashboard && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                {t("exportType.label")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportType("data")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    exportType === "data"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText
                      className={`h-6 w-6 shrink-0 ${
                        exportType === "data" ? "text-primary" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <div
                        className={`font-semibold ${
                          exportType === "data" ? "text-primary" : "text-gray-700"
                        }`}
                      >
                        {t("exportType.data.title")}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {t("exportType.data.description")}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setExportType("analytics")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    exportType === "analytics"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <BarChart3
                      className={`h-6 w-6 shrink-0 ${
                        exportType === "analytics"
                          ? "text-primary"
                          : "text-gray-400"
                      }`}
                    />
                    <div>
                      <div
                        className={`font-semibold ${
                          exportType === "analytics"
                            ? "text-primary"
                            : "text-gray-700"
                        }`}
                      >
                        {t("exportType.analytics.title")}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {t("exportType.analytics.description")}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {isDashboard && exportType === "data" && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                {t("datasets.label")}
              </label>
              <div className="space-y-2">
                {datasetOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDatasets.includes(option.value)}
                      onChange={() => toggleDataset(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              {t("format.label")}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => setFormat("csv")}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  format === "csv"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === "csv" ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t("format.csv.title")}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t("format.csv.description")}
                </div>
              </button>

              <button
                onClick={() => setFormat("json")}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  format === "json"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === "json" ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t("format.json.title")}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t("format.json.description")}
                </div>
              </button>

              <button
                onClick={() => setFormat("excel")}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  format === "excel"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === "excel" ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t("format.excel.title")}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t("format.excel.description")}
                </div>
              </button>
            </div>
          </div>

          {typeof datasetCount === "number" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <Table className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">
                    {t("selection.title")}
                  </h4>
                  <p className="mt-1 text-xs text-emerald-800">
                    {datasetCount > 0
                      ? t("selection.visibleRows", { count: datasetCount })
                      : emptyStateMessage || t("errors.noData")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentDateRange && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">
                    {t("dateRange.title")}
                  </h4>
                  <p className="mt-1 text-xs text-blue-800">
                    {currentDateRange.value === "custom"
                      ? t("dateRange.custom", {
                          start: currentDateRange.customStart ?? "",
                          end: currentDateRange.customEnd ?? "",
                        })
                      : currentDateRange.value === "all"
                        ? t("dateRange.allTime")
                        : t("dateRange.lastDays", {
                            days: currentDateRange.value || "30",
                          })}
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    {t("dateRange.description")}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </Modal>
  );
}
