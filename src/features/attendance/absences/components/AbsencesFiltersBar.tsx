"use client";

import { useTranslations } from "next-intl";
import { Search, X, Download } from "lucide-react";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { AbsencesFilters, AttendanceIncidentType } from "../types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { formatLocalDate, parseLocalDate } from "@/features/attendance/roll-call/utils/localDate";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface AbsencesFiltersBarProps {
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
  isReadOnly: boolean;
  structureTree: StructureTree | null;
}

export default function AbsencesFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
  structureTree,
}: AbsencesFiltersBarProps) {
  const t = useTranslations("attendance.absences.filters");
  const tCommon = useTranslations("common");
  const invalidDateRange = isInvalidDateRange(filters.dateFrom, filters.dateTo);

  const statusOptions: { value: "ALL" | AttendanceIncidentType; label: string }[] = [
    { value: "ALL", label: t("allStatuses") },
    { value: "ABSENT", label: t("absent") },
    { value: "LATE", label: t("late") },
    { value: "EARLY_LEAVE", label: t("earlyLeave") },
    { value: "EXCUSED", label: t("excused") },
    { value: "UNMARKED", label: t("unmarked") },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
          style={{ color: "var(--text-muted)" }} 
        />
        <Input
          type="text"
          label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Scope Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {t("scope")}
        </h4>

        <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)" }}>
          <ScopePicker
            scopeType={filters.scopeType}
            scopeIds={filters.scopeIds || {}}
            stages={structureTree?.stages || []}
            grades={structureTree?.grades || []}
            sections={structureTree?.sections || []}
            classrooms={structureTree?.classrooms || []}
            onScopeTypeChange={(scopeType) => onFiltersChange({ scopeType, scopeIds: {} })}
            onScopeIdsChange={(scopeIds) => onFiltersChange({ scopeIds })}
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date From */}
        <DatePicker
          label={t("dateFrom")}
          value={filters.dateFrom ? parseLocalDate(filters.dateFrom) : null}
          maxDate={filters.dateTo ? parseLocalDate(filters.dateTo) : undefined}
          onChange={(value) => onFiltersChange({ dateFrom: value ? formatLocalDate(value) : undefined })}
          placeholder={t("dateFrom")}
        />

        {/* Date To */}
        <DatePicker
          label={t("dateTo")}
          value={filters.dateTo ? parseLocalDate(filters.dateTo) : null}
          minDate={filters.dateFrom ? parseLocalDate(filters.dateFrom) : undefined}
          onChange={(value) => onFiltersChange({ dateTo: value ? formatLocalDate(value) : undefined })}
          placeholder={t("dateTo")}
          error={invalidDateRange ? tCommon("invalidDateRange") : undefined}
        />

        {/* Status Single-Select */}
        <Select
          label={t("status")}
          value={filters.status}
          onChange={(value) => onFiltersChange({ status: value as "ALL" | AttendanceIncidentType })}
          options={statusOptions}
          selectSize="sm"
        />
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Only Unexcused Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyUnexcused}
            onChange={(e) => onFiltersChange({ onlyUnexcused: e.target.checked })}
            className="w-4 h-4 rounded text-primary focus:ring-primary"
            style={{ borderColor: "var(--color-neutral-300)" }}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {t("onlyUnexcused")}
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<X className="w-4 h-4" />}
            onClick={onClearFilters}
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={onExport}
          >
            {t("export")}
          </Button>
        </div>
      </div>
    </div>
  );
}
