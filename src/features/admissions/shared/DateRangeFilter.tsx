// FILE: src/components/admissions/DateRangeFilter.tsx

"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

export type DateRangeValue = "7" | "30" | "60" | "90" | "all" | "custom";

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
  showAllTime?: boolean;
}

export default function DateRangeFilter({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  showAllTime = true,
}: DateRangeFilterProps) {
  const t = useTranslations("admissions.date_filter");

  const options = [
    ...(showAllTime ? [{ value: "all" as const, label: t("all_time") }] : []),
    { value: "7" as const, label: t("last_7_days") },
    { value: "30" as const, label: t("last_30_days") },
    { value: "60" as const, label: t("last_60_days") },
    { value: "90" as const, label: t("last_90_days") },
    { value: "custom" as const, label: t("custom_range") },
  ];

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-gray-700">
              {t("filter_by_period")}
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
                  value === option.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {value === "custom" && onCustomDateChange && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700 shrink-0">
                {t("from")}
              </label>
              <input
                type="date"
                value={customStartDate || ""}
                onChange={(e) =>
                  onCustomDateChange(e.target.value, customEndDate || "")
                }
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[40px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700 shrink-0">
                {t("to")}
              </label>
              <input
                type="date"
                value={customEndDate || ""}
                onChange={(e) =>
                  onCustomDateChange(customStartDate || "", e.target.value)
                }
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[40px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
