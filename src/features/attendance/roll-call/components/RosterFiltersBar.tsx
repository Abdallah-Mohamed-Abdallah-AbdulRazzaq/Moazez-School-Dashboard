"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import { FilterPanel } from "@/components/ui";
import RollCallQuickPresets from "./RollCallQuickPresets";
import type { AttendanceStatus } from "../types";

export interface RosterFilters {
  search: string;
  status:
    | "ALL"
    | "UNMARKED"
    | "PRESENT"
    | "ABSENT"
    | "LATE"
    | "EXCUSED"
    | "EARLY_LEAVE";
  excuseCompleteness?: "ALL" | "COMPLETE" | "MISSING";
  lateMin?: number;
  earlyLeaveMin?: number;
}

interface RosterFiltersBarProps {
  filters: RosterFilters;
  onFiltersChange: (filters: RosterFilters) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export default function RosterFiltersBar({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
}: RosterFiltersBarProps) {
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

  const handleReset = () => {
    onFiltersChange({
      search: "",
      status: "ALL",
      excuseCompleteness: "ALL",
      lateMin: undefined,
      earlyLeaveMin: undefined,
    });
  };

  const handlePresetSelect = (
    status: "ALL" | AttendanceStatus | "UNMARKED",
  ) => {
    onFiltersChange({
      ...filters,
      status,
      // Clear numeric filters unless it's LATE or EARLY_LEAVE
      lateMin: status === "LATE" ? filters.lateMin : undefined,
      earlyLeaveMin:
        status === "EARLY_LEAVE" ? filters.earlyLeaveMin : undefined,
    });
  };

  return (
    <div
      style={{
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--color-border)",
      }}
      className="px-4 py-3"
    >
      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        toggleTitle={showFilters ? t("hideFilters") : t("showFilters")}
        toggleAriaLabel={showFilters ? t("hideFilters") : t("showFilters")}
        className="border-0 bg-transparent p-0 shadow-none"
        clearAction={
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<X className="w-4 h-4" />}
          >
            {t("reset")}
          </Button>
        }
        hasActiveFilters={
          filters.search !== "" ||
          filters.status !== "ALL" ||
          filters.excuseCompleteness !== "ALL" ||
          filters.lateMin !== undefined ||
          filters.earlyLeaveMin !== undefined
        }
        searchSlot={
          <div className="relative flex-1">
            <Search
              style={{ color: "var(--color-neutral-400)" }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            />
            <Input
              type="text"
              label={t("search")}
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
        }
        bodySlot={
          <RollCallQuickPresets
            selectedStatus={filters.status}
            onSelect={handlePresetSelect}
          />
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

            <Select
              value={filters.excuseCompleteness || "ALL"}
              onChange={(value) =>
                onFiltersChange({
                  ...filters,
                  excuseCompleteness:
                    value as RosterFilters["excuseCompleteness"],
                })
              }
              options={excuseCompletenessOptions}
              selectSize="sm"
              label={t("excuseLabel")}
            />

            <div>
              <label
                style={{ color: "var(--color-gray-700)" }}
                className="mb-1 block text-sm font-medium"
              >
                {t("lateMinLabel")}
              </label>
              <Input
                type="number"
                value={filters.lateMin?.toString() || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    lateMin: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0"
                min="0"
                className="text-sm"
              />
            </div>

            <div>
              <label
                style={{ color: "var(--color-gray-700)" }}
                className="mb-1 block text-sm font-medium"
              >
                {t("earlyLeaveMinLabel")}
              </label>
              <Input
                type="number"
                value={filters.earlyLeaveMin?.toString() || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    earlyLeaveMin: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0"
                min="0"
                className="text-sm"
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
