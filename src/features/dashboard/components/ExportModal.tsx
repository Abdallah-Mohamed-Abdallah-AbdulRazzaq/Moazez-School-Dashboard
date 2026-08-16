"use client";

import { useMemo, useState } from "react";
import { FileJson, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
} from "@/utils/exportUtils";
import type { DashboardExportRow } from "@/features/dashboard/mappers/dashboardViewMapper";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYearName: string;
  termName: string;
  exportRows: DashboardExportRow[];
}

type ExportFormat = "csv" | "excel" | "json" | "pdf";

const EXPORT_PREVIEW_ROW_LIMIT = 12;

export default function ExportModal({
  isOpen,
  onClose,
  academicYearName,
  termName,
  exportRows,
}: ExportModalProps) {
  const t = useTranslations("dashboard_new");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const timestamp = useMemo(() => new Date().toISOString().split("T")[0], []);
  const previewRows = exportRows.slice(0, EXPORT_PREVIEW_ROW_LIMIT);
  const hiddenPreviewRowCount = Math.max(
    exportRows.length - previewRows.length,
    0,
  );
  const exportFormats = useMemo(
    () => [
      {
        value: "excel" as const,
        label: t("export.formats.excel.label"),
        icon: FileSpreadsheet,
        description: t("export.formats.excel.description"),
      },
      {
        value: "csv" as const,
        label: t("export.formats.csv.label"),
        icon: FileText,
        description: t("export.formats.csv.description"),
      },
      {
        value: "json" as const,
        label: t("export.formats.json.label"),
        icon: FileJson,
        description: t("export.formats.json.description"),
      },
      {
        value: "pdf" as const,
        label: t("export.formats.pdf.label"),
        icon: Printer,
        description: t("export.formats.pdf.description"),
      },
    ],
    [t],
  );

  const handleExport = () => {
    const filename = `dashboard-summary-${timestamp}`;
    const exportTableRows = exportRows.map((exportRow) => ({
      label: exportRow.label,
      value: exportRow.value,
    }));

    if (selectedFormat === "pdf") {
      exportToPDF();
      onClose();
      return;
    }

    if (selectedFormat === "json") {
      exportToJSON(exportTableRows, filename);
      onClose();
      return;
    }

    if (selectedFormat === "csv") {
      exportToCSV(exportTableRows, filename);
      onClose();
      return;
    }

    exportToExcel(exportTableRows, filename);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("export.title")}
      description={`${academicYearName} - ${termName}`}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("export.cancel")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-hover"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("export.export_data")}
          </button>
        </>
      }
    >
      <div className="space-y-6 py-2">
        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            {t("export.format_label")}
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {exportFormats.map((formatOption) => {
              const Icon = formatOption.icon;
              const isSelected = selectedFormat === formatOption.value;

              return (
                <button
                  key={formatOption.value}
                  type="button"
                  onClick={() => setSelectedFormat(formatOption.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`h-6 w-6 shrink-0 ${
                        isSelected ? "text-primary" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <div
                        className={`font-semibold ${
                          isSelected ? "text-primary" : "text-gray-700"
                        }`}
                      >
                        {formatOption.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatOption.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          {previewRows.map((exportRow) => (
            <div
              key={exportRow.label}
              className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
            >
              <span className="text-sm text-gray-500">{exportRow.label}</span>
              <span className="text-right text-sm font-semibold text-gray-900">
                {exportRow.value}
              </span>
            </div>
          ))}
          {hiddenPreviewRowCount > 0 ? (
            <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
              {hiddenPreviewRowCount} more rows will be included in the exported file.
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
