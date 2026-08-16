"use client";

import { useTranslations } from "next-intl";
import { Drawer } from "@mui/material";
import { Search, X } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import RollCallQuickPresets from "./RollCallQuickPresets";
import type { RosterFilters } from "./RosterFiltersBar";
import type { AttendanceStatus } from "../types";

interface RollCallFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: RosterFilters;
  onFiltersChange: (filters: RosterFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function RollCallFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: RollCallFiltersDrawerProps) {
  const t = useTranslations("attendance.rollCall.filters");
  const tStatus = useTranslations("attendance.rollCall.filters.status");

  const statusOptions = [
    { value: "ALL", label: tStatus("all") },
    { value: "UNMARKED", label: tStatus("unmarked") },
    { value: "PRESENT", label: tStatus("present") },
    { value: "ABSENT", label: tStatus("absent") },
    { value: "LATE", label: tStatus("late") },
    { value: "EXCUSED", label: tStatus("excused") },
    { value: "EARLY_LEAVE", label: tStatus("earlyLeave") },
  ];

  const excuseCompletenessOptions = [
    { value: "ALL", label: t("excuseAll") },
    { value: "COMPLETE", label: t("excuseComplete") },
    { value: "MISSING", label: t("excuseMissing") },
  ];

  const handlePresetSelect = (status: "ALL" | AttendanceStatus | "UNMARKED") => {
    onFiltersChange({
      ...filters,
      status,
      lateMin: status === "LATE" ? filters.lateMin : undefined,
      earlyLeaveMin: status === "EARLY_LEAVE" ? filters.earlyLeaveMin : undefined,
    });
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="p-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: "var(--color-gray-900)" }} className="text-lg font-semibold">{t("title")}</h3>
          <button
            onClick={onClose}
            style={{ color: "var(--color-neutral-500)" }}
            className="p-1 rounded hover:text-[var(--color-gray-700)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
            {t("search")}
          </label>
          <div className="relative">
            <Search style={{ color: "var(--color-neutral-400)" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <RollCallQuickPresets
            selectedStatus={filters.status}
            onSelect={handlePresetSelect}
          />
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <Select
            value={filters.status}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as RosterFilters["status"],
              })
            }
            options={statusOptions}
            selectSize="sm"
            label={t("statusLabel")}
          />
        </div>

        <div className="mb-4">
            <Select
              value={filters.excuseCompleteness || "ALL"}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  excuseCompleteness: value as RosterFilters["excuseCompleteness"],
                })
              }
              options={excuseCompletenessOptions}
              selectSize="sm"
              label={t("excuseLabel")}
            />
        </div>

        {/* Late Minutes Filter */}
        <div className="mb-4">
          <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
            {t("lateMinLabel")}
          </label>
          <Input
            type="number"
            value={filters.lateMin?.toString() || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                lateMin: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="0"
            min="0"
            className="text-sm"
          />
        </div>

        {/* Early Leave Minutes Filter */}
        <div className="mb-4">
          <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-1">
            {t("earlyLeaveMinLabel")}
          </label>
          <Input
            type="number"
            value={filters.earlyLeaveMin?.toString() || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                earlyLeaveMin: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="0"
            min="0"
            className="text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ borderColor: "var(--color-border)" }} className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
            {t("reset")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} className="flex-1">
            {t("apply")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
