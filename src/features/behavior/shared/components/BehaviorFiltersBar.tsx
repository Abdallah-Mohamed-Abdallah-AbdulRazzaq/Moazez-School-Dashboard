"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { BehaviorFilters, BehaviorStatus, BehaviorType } from "../../types";
import { useToast } from "@/components/ui/toast/Toast";
import { validateDateRange } from "../utils/behaviorUiRules";

interface BehaviorFiltersBarProps {
  filters: BehaviorFilters;
  onChange: (filters: Partial<BehaviorFilters>) => void;
  onClear: () => void;
}

export default function BehaviorFiltersBar({
  filters,
  onChange,
  onClear,
}: BehaviorFiltersBarProps) {
  const t = useTranslations("behavior.filters");
  const tCommon = useTranslations("common");
  const { showError } = useToast();

  const typeOptions: { value: "" | BehaviorType; label: string }[] = [
    { value: "", label: t("allTypes") },
    { value: "positive", label: t("positive") },
    { value: "negative", label: t("negative") },
  ];

  const statusOptions: { value: "" | BehaviorStatus; label: string }[] = [
    { value: "", label: t("allStatuses") },
    { value: "draft", label: t("draft") },
    { value: "submitted", label: t("submitted") },
    { value: "approved", label: t("approved") },
    { value: "rejected", label: t("rejected") },
    { value: "cancelled", label: t("cancelled") },
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
          placeholder={t("searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Type */}
        <Select
          label={t("type")}
          value={filters.type ?? ""}
          onChange={(value) =>
            onChange({ type: (value as BehaviorType) || undefined })
          }
          options={typeOptions}
          selectSize="sm"
        />

        {/* Status */}
        <Select
          label={t("status")}
          value={filters.status ?? ""}
          onChange={(value) =>
            onChange({ status: (value as BehaviorStatus) || undefined })
          }
          options={statusOptions}
          selectSize="sm"
        />

        {/* Date From */}
        <DatePicker
          label={t("dateFrom")}
          value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
          onChange={(date) => {
            const dateStr = date ? date.toISOString() : undefined;
            if (dateStr && filters.dateTo && !validateDateRange(dateStr, filters.dateTo)) {
              showError(t("invalidDateRangeFrom"));
              return;
            }
            onChange({ dateFrom: dateStr });
          }}
        />

        {/* Date To */}
        <DatePicker
          label={t("dateTo")}
          value={filters.dateTo ? new Date(filters.dateTo) : undefined}
          onChange={(date) => {
            const dateStr = date ? date.toISOString() : undefined;
            if (dateStr && filters.dateFrom && !validateDateRange(filters.dateFrom, dateStr)) {
              showError(t("invalidDateRangeTo"));
              return;
            }
            onChange({ dateTo: dateStr });
          }}
        />
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<X className="w-4 h-4" />}
          onClick={onClear}
        >
          {tCommon("reset")}
        </Button>
      </div>
    </div>
  );
}
