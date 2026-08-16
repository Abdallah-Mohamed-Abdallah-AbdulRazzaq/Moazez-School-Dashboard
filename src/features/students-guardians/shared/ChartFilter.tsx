// FILE: src/components/students-guardians/shared/ChartFilter.tsx

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/ui";

export type DateRangeValue = "7" | "30" | "60" | "90" | "all" | "custom";

export interface ChartFilterValues {
  academicYear: string;
  term: string;
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

interface ChartFilterProps {
  values: ChartFilterValues;
  onChange: (values: ChartFilterValues) => void;
  academicYears: string[];
  terms: string[];
  showAdvancedFilters?: boolean;
}

export default function ChartFilter({
  values,
  onChange,
  academicYears,
  terms,
  showAdvancedFilters = true,
}: ChartFilterProps) {
  const t = useTranslations("students_guardians.students");

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    values.academicYear !== "all" || values.term !== "all";

  const clearFilters = () => {
    onChange({
      academicYear: "all",
      term: "all",
      dateRange: "all",
      customStartDate: "",
      customEndDate: "",
    });
  };

  const updateFilter = (key: keyof ChartFilterValues, value: string) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <FilterPanel
      showFilters={showAdvancedFilters && showFilters}
      onToggleFilters={() => setShowFilters((current) => !current)}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={t("filters")}
      toggleAriaLabel={t("filters")}
      className="bg-transparent p-0 shadow-none"
      clearAction={null}
      searchSlot={
        hasActiveFilters ? (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100"
            >
              <X className="h-4 w-4" />
              {t("clear")}
            </button>
          </div>
        ) : (
          <div />
        )
      }
      filtersSlot={
        showAdvancedFilters ? (
          <div className="grid flex-1 grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {t("filter_labels.academic_year")}
              </label>
              <select
                value={values.academicYear}
                onChange={(e) => updateFilter("academicYear", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-transparent focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t("filter_options.all_years")}</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {t("filter_labels.term")}
              </label>
              <select
                value={values.term}
                onChange={(e) => updateFilter("term", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-transparent focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t("filter_options.all_terms")}</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null
      }
    />
  );
}
