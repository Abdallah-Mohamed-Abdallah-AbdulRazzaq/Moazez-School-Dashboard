"use client";

import { useEffect, useState } from "react";
import { Download, Table } from "lucide-react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import type { GradesExportFormat } from "@/features/grades/shared/utils/gradesExport";

interface GradesExportDatasetOption {
  value: string;
  label: string;
  description?: string;
}

interface GradesGlobalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: GradesExportFormat) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  datasetCount?: number;
  emptyStateMessage?: string;
  datasetOptions?: GradesExportDatasetOption[];
  selectedDataset?: string;
  onDatasetChange?: (value: string) => void;
}

export default function GradesGlobalExportModal({
  isOpen,
  onClose,
  onExport,
  title,
  subtitle,
  confirmLabel,
  datasetCount,
  emptyStateMessage,
  datasetOptions,
  selectedDataset,
  onDatasetChange,
}: GradesGlobalExportModalProps) {
  const t = useTranslations("academics.grades.export");
  const [format, setFormat] = useState<GradesExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      void Promise.resolve().then(() => setFormat("csv"));
      void Promise.resolve().then(() => setIsExporting(false));
    }
  }, [isOpen]);

  const hasData = datasetCount === undefined || datasetCount > 0;

  const handleExport = async () => {
    if (!hasData) {
      alert(emptyStateMessage || t("errors.noData"));
      return;
    }

    setIsExporting(true);
    try {
      await onExport(format);
      onClose();
    } catch (error) {
      console.error("Grades export error:", error);
      alert(
        error instanceof Error ? error.message : t("errors.exportFailedGeneric"),
      );
    } finally {
      setIsExporting(false);
    }
  };

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
        disabled={isExporting || !hasData}
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
            {confirmLabel || t("actions.export")}
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
        {datasetOptions && datasetOptions.length > 0 ? (
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              {t("datasets.label")}
            </label>
            <div className="space-y-3">
              {datasetOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onDatasetChange?.(option.value)}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    selectedDataset === option.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`font-semibold ${
                      selectedDataset === option.value
                        ? "text-primary"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </div>
                  {option.description ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {option.description}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            {t("format.label")}
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["csv", "json", "excel"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFormat(option)}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  format === option
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`font-semibold ${
                    format === option ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {t(`format.${option}.title`)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t(`format.${option}.description`)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {typeof datasetCount === "number" ? (
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
        ) : null}
      </div>
    </Modal>
  );
}
