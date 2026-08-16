"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@mui/material";
import { X, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type { AbsencesFilters, AttendanceIncidentType } from "../types";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { formatLocalDate, parseLocalDate } from "@/features/attendance/roll-call/utils/localDate";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface AbsencesFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AbsencesFilters;
  onFiltersChange: (filters: Partial<AbsencesFilters>) => void;
  onClearFilters: () => void;
  onExport: () => void;
  structureTree: StructureTree | null;
}

export default function AbsencesFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  onExport,
  structureTree,
}: AbsencesFiltersDrawerProps) {
  const t = useTranslations("attendance.absences.filters");
  const tCommon = useTranslations("common");

  // Local draft state for mobile - only apply on "Apply" button
  const [draftFilters, setDraftFilters] = useState<AbsencesFilters>(filters);
  const invalidDateRange = isInvalidDateRange(draftFilters.dateFrom, draftFilters.dateTo);

  // Update draft when filters change externally
  useEffect(() => {
    void Promise.resolve().then(() => setDraftFilters(filters));
  }, [filters]);

  const statusOptions: { value: "ALL" | AttendanceIncidentType; label: string }[] = [
    { value: "ALL", label: t("allStatuses") },
    { value: "ABSENT", label: t("absent") },
    { value: "LATE", label: t("late") },
    { value: "EARLY_LEAVE", label: t("earlyLeave") },
    { value: "EXCUSED", label: t("excused") },
    { value: "UNMARKED", label: t("unmarked") },
  ];

  const handleDraftChange = (changes: Partial<AbsencesFilters>) => {
    setDraftFilters(prev => ({ ...prev, ...changes }));
  };

  const handleApply = () => {
    onFiltersChange(draftFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AbsencesFilters = {
      dateFrom: undefined,
      dateTo: undefined,
      scopeType: "SCHOOL",
      status: "ALL",
      granularities: ["DAILY", "PERIOD"],
      onlyUnexcused: false,
      search: "",
    };
    setDraftFilters(resetFilters);
    onClearFilters();
  };

  const handleExport = () => {
    onExport();
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div
          className="flex items-center justify-between p-4 border-b shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("filters")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("search")}
              </label>
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={draftFilters.search}
                onChange={(e) => handleDraftChange({ search: e.target.value })}
              />
            </div>

            {/* Scope Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {t("scope")}
              </h4>

              <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)" }}>
                <ScopePicker
                  scopeType={draftFilters.scopeType}
                  scopeIds={draftFilters.scopeIds || {}}
                  stages={structureTree?.stages || []}
                  grades={structureTree?.grades || []}
                  sections={structureTree?.sections || []}
                  classrooms={structureTree?.classrooms || []}
                  onScopeTypeChange={(scopeType) =>
                    handleDraftChange({
                      scopeType,
                      scopeIds: {},
                    })
                  }
                  onScopeIdsChange={(scopeIds) =>
                    handleDraftChange({ scopeIds })
                  }
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("dateFrom")}
              </label>
              <DatePicker
                value={draftFilters.dateFrom ? parseLocalDate(draftFilters.dateFrom) : null}
                maxDate={draftFilters.dateTo ? parseLocalDate(draftFilters.dateTo) : undefined}
                onChange={(value) => handleDraftChange({ dateFrom: value ? formatLocalDate(value) : undefined })}
                placeholder={t("dateFrom")}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("dateTo")}
              </label>
              <DatePicker
                value={draftFilters.dateTo ? parseLocalDate(draftFilters.dateTo) : null}
                minDate={draftFilters.dateFrom ? parseLocalDate(draftFilters.dateFrom) : undefined}
                onChange={(value) => handleDraftChange({ dateTo: value ? formatLocalDate(value) : undefined })}
                placeholder={t("dateTo")}
                error={invalidDateRange ? tCommon("invalidDateRange") : undefined}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                {t("status")}
              </label>
              <Select
                value={draftFilters.status}
                onChange={(value) => handleDraftChange({ status: value as "ALL" | AttendanceIncidentType })}
                options={statusOptions}
                selectSize="sm"
              />
            </div>

            {/* Only Unexcused */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draftFilters.onlyUnexcused}
                onChange={(e) => handleDraftChange({ onlyUnexcused: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
                style={{ borderColor: "var(--color-neutral-300)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {t("onlyUnexcused")}
              </span>
            </label>
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          className="flex items-center gap-3 p-4 border-t shrink-0"
          style={{
            backgroundColor: "var(--card-background)",
            borderColor: "var(--border-color)",
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            {tCommon("reset")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            className="flex-1"
          >
            {t("export")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            disabled={invalidDateRange}
            className="flex-1"
          >
            {tCommon("apply")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
