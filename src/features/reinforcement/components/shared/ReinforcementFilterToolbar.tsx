"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Filter, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { useDebounce } from "@/hooks/useDebounce";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "search" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

export interface ReinforcementFilterToolbarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClearAll: () => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string) => void;
  searchKey?: string;
  debounceMs?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReinforcementFilterToolbar({
  filters,
  values,
  onChange,
  onClearAll,
  activeFilters,
  onRemoveFilter,
  searchKey,
  debounceMs = 350,
}: ReinforcementFilterToolbarProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const isRTL = locale === "ar";

  const [isExpanded, setIsExpanded] = useState(true);
  const [localSearchValue, setLocalSearchValue] = useState(
    searchKey ? values[searchKey] || "" : "",
  );

  const debouncedSearch = useDebounce(localSearchValue, debounceMs);

  // Sync debounced search value to parent
  useEffect(() => {
    if (searchKey && debouncedSearch !== values[searchKey]) {
      onChange(searchKey, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Sync external value changes back to local (e.g. on clear all)
  useEffect(() => {
    if (searchKey) {
      const externalValue = values[searchKey] || "";
      if (externalValue !== localSearchValue && externalValue === "") {
      void Promise.resolve().then(() => setLocalSearchValue(""));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, searchKey]);

  const activeCount = activeFilters.length;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearchValue(e.target.value);
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setLocalSearchValue("");
    onClearAll();
  }, [onClearAll]);

  const renderFilterControl = (filter: FilterConfig) => {
    if (filter.type === "search") {
      return (
        <Input
          key={filter.key}
          label={filter.label}
          placeholder={filter.placeholder}
          value={localSearchValue}
          onChange={handleSearchChange}
          leftIcon={<Search className="h-4 w-4" />}
          inputSize="sm"
        />
      );
    }

    if (filter.type === "select") {
      return (
        <Select
          key={filter.key}
          label={filter.label}
          value={values[filter.key] || ""}
          onChange={(value) => onChange(filter.key, value)}
          options={filter.options || []}
          selectSize="sm"
        />
      );
    }

    if (filter.type === "date") {
      return (
        <Input
          key={filter.key}
          label={filter.label}
          type="date"
          placeholder={filter.placeholder}
          value={values[filter.key] || ""}
          onChange={(e) => onChange(filter.key, e.target.value)}
          inputSize="sm"
        />
      );
    }

    return null;
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* ─── Toolbar Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-t-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
        {/* Toggle button with badge — visible on all sizes */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>{t("filters.title")}</span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Clear all button */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            leftIcon={<X className="h-3.5 w-3.5" />}
          >
            {t("filters.clearFilters")}
          </Button>
        )}
      </div>

      {/* ─── Collapsible Filter Controls ────────────────────────────────── */}
      {isExpanded && (
        <div className="border-x border-b border-gray-100 bg-white px-4 pb-4 pt-2 shadow-sm">
          {/* Desktop: inline row */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filters.map(renderFilterControl)}
          </div>

          {/* Mobile: stacked */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filters.map(renderFilterControl)}
          </div>
        </div>
      )}

      {/* ─── Active Filter Chips ────────────────────────────────────────── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-x border-b border-gray-100 bg-gray-50 px-4 py-2.5 rounded-b-lg">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
            >
              <span className="text-gray-500">{filter.label}:</span>
              <span>{filter.displayValue}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter(filter.key)}
                className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
