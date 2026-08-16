"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";

export type AcademicsOverviewExportDataset =
  | "summary"
  | "checklist"
  | "upcomingEvents";

interface AcademicsOverviewFiltersBarProps {
  exportDataset: AcademicsOverviewExportDataset;
  onExportDatasetChange: (
    value: AcademicsOverviewExportDataset
  ) => void;
  onExportClick: () => void;
}

export default function AcademicsOverviewFiltersBar({
  exportDataset,
  onExportDatasetChange,
  onExportClick,
}: AcademicsOverviewFiltersBarProps) {
  const t = useTranslations("academics.overview.filters");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 max-w-sm">
          <Select
            label={t("exportDataset")}
            value={exportDataset}
            onChange={(value) =>
              onExportDatasetChange(value as AcademicsOverviewExportDataset)
            }
            options={[
              { value: "summary", label: t("options.summary") },
              { value: "checklist", label: t("options.checklist") },
              { value: "upcomingEvents", label: t("options.upcomingEvents") },
            ]}
            selectSize="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onExportClick}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
        </div>
      </div>
    </div>
  );
}
