"use client";

import { useTranslations } from "next-intl";
import { Search, RotateCcw, Download } from "lucide-react";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import type { ExcuseRequestFilters } from "../types";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface ExcusesFiltersBarProps {
  filters: ExcuseRequestFilters;
  onFiltersChange: (patch: Partial<ExcuseRequestFilters>) => void;
  onReset: () => void;
  onOpenExport: () => void;
}

export default function ExcusesFiltersBar({
  filters,
  onFiltersChange,
  onReset,
  onOpenExport,
}: ExcusesFiltersBarProps) {
  const t = useTranslations("attendance.excuses.filters");
  const tCommon = useTranslations("common");
  const invalidDateRange = isInvalidDateRange(filters.dateFrom, filters.dateTo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4">
          <Input
            label={t("search")}
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            placeholder={t("searchPlaceholder")}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="lg:col-span-2">
          <DatePicker
            label={t("dateFrom")}
            value={filters.dateFrom ? new Date(filters.dateFrom) : null}
            maxDate={filters.dateTo ? new Date(filters.dateTo) : undefined}
            onChange={(value) => onFiltersChange({ dateFrom: value ? value.toISOString().split("T")[0] : undefined })}
            placeholder={t("dateFrom")}
          />
        </div>
        <div className="lg:col-span-2">
          <DatePicker
            label={t("dateTo")}
            value={filters.dateTo ? new Date(filters.dateTo) : null}
            minDate={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
            onChange={(value) => onFiltersChange({ dateTo: value ? value.toISOString().split("T")[0] : undefined })}
            placeholder={t("dateTo")}
            error={invalidDateRange ? tCommon("invalidDateRange") : undefined}
          />
        </div>
        <div className="lg:col-span-2">
          <Select
            label={t("status")}
            value={filters.status}
            onChange={(value) => onFiltersChange({ status: value as ExcuseRequestFilters["status"] })}
            options={[
              { value: "ALL", label: t("allStatuses") },
              { value: "PENDING", label: t("pending") },
              { value: "APPROVED", label: t("approved") },
              { value: "REJECTED", label: t("rejected") },
            ]}
            selectSize="sm"
          />
        </div>
        <div className="lg:col-span-2">
          <Select
            label={t("type")}
            value={filters.type}
            onChange={(value) => onFiltersChange({ type: value as ExcuseRequestFilters["type"] })}
            options={[
              { value: "ALL", label: t("allTypes") },
              { value: "ABSENCE", label: t("absence") },
              { value: "LATE", label: t("late") },
              { value: "EARLY_LEAVE", label: t("earlyLeave") },
            ]}
            selectSize="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-4">
          <Select
            label={t("hasAttachment")}
            value={filters.hasAttachment}
            onChange={(value) => onFiltersChange({ hasAttachment: value as ExcuseRequestFilters["hasAttachment"] })}
            options={[
              { value: "ALL", label: t("allAttachments") },
              { value: "YES", label: t("withAttachment") },
              { value: "NO", label: t("withoutAttachment") },
            ]}
            selectSize="sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onReset}>
          {tCommon("reset")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={onOpenExport}
        >
          {t("export")}
        </Button>
      </div>
    </div>
  );
}
