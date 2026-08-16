"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ExportModal from "./ExportModal";
import type { DashboardExportRow } from "@/features/dashboard/mappers/dashboardViewMapper";

interface FilterBarProps {
  academicYearName: string;
  termName: string;
  exportRows: DashboardExportRow[];
}

export default function FilterBar({
  academicYearName,
  termName,
  exportRows,
}: FilterBarProps) {
  const t = useTranslations("filter_bar");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-4 flex-wrap">
      <button
        onClick={() => setIsExportModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{t("export")}</span>
      </button>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        academicYearName={academicYearName}
        termName={termName}
        exportRows={exportRows}
      />
    </div>
  );
}
