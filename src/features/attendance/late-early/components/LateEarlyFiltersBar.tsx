"use client";

import { useTranslations } from "next-intl";
import { Search, RotateCcw, Download } from "lucide-react";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { Classroom, Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { LateEarlyFilters } from "../types";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface LateEarlyFiltersBarProps {
  filters: LateEarlyFilters;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  onFiltersChange: (patch: Partial<LateEarlyFilters>) => void;
  onResetFilters: () => void;
  onOpenExport: () => void;
}

export default function LateEarlyFiltersBar({
  filters,
  stages,
  grades,
  sections,
  classrooms,
  onFiltersChange,
  onResetFilters,
  onOpenExport,
}: LateEarlyFiltersBarProps) {
  const t = useTranslations("attendance.lateEarly.filters");
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
            label={t("type")}
            value={filters.type}
            onChange={(value) => onFiltersChange({ type: value as LateEarlyFilters["type"] })}
            options={[
              { value: "ALL", label: t("allTypes") },
              { value: "LATE", label: t("late") },
              { value: "EARLY_LEAVE", label: t("earlyLeave") },
            ]}
            selectSize="sm"
          />
        </div>
        <div className="lg:col-span-2">
          <Select
            label={t("sessionStatus")}
            value={filters.sessionStatus || "ALL"}
            onChange={(value) => onFiltersChange({ sessionStatus: value as LateEarlyFilters["sessionStatus"] })}
            options={[
              { value: "ALL", label: t("allSessionStatuses") },
              { value: "DRAFT", label: t("sessionDraft") },
              { value: "SUBMITTED", label: t("sessionSubmitted") },
            ]}
            selectSize="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-5 rounded-lg border p-3" style={{ borderColor: "var(--border-color)" }}>
          <ScopePicker
            scopeType={filters.scopeType}
            scopeIds={filters.scopeIds || {}}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onScopeTypeChange={(scopeType) => onFiltersChange({ scopeType, scopeIds: {} })}
            onScopeIdsChange={(scopeIds) => onFiltersChange({ scopeIds })}
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label={t("minutesMin")}
            type="number"
            min={0}
            value={typeof filters.minutesMin === "number" ? filters.minutesMin : ""}
            onChange={(event) => {
              const value = event.target.value;
              onFiltersChange({ minutesMin: value === "" ? undefined : Math.max(0, Number(value)) });
            }}
            placeholder={t("minutesMin")}
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label={t("minutesMax")}
            type="number"
            min={0}
            value={typeof filters.minutesMax === "number" ? filters.minutesMax : ""}
            onChange={(event) => {
              const value = event.target.value;
              onFiltersChange({ minutesMax: value === "" ? undefined : Math.max(0, Number(value)) });
            }}
            placeholder={t("minutesMax")}
          />
        </div>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={filters.onlyViolations}
            onChange={(event) => onFiltersChange({ onlyViolations: event.target.checked })}
            className="w-4 h-4"
          />
          <span>{t("onlyViolations")}</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onResetFilters}>
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
    </div>
  );
}
