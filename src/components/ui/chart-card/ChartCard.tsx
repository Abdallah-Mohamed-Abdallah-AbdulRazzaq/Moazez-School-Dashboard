"use client";

import { ReactNode, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showPeriodFilter?: boolean;
  periodOptions?: DropdownItem[];
  onPeriodChange?: (period: string) => void;
  defaultPeriod?: string;
  customFilter?: ReactNode;
  bgColor?: string;
}

const defaultPeriodOptions: DropdownItem[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last Year", value: "1y" },
  { label: "All Time", value: "all" },
];

export default function ChartCard({
  title,
  subtitle,
  description,
  children,
  className = "",
  showPeriodFilter = true,
  periodOptions = defaultPeriodOptions,
  onPeriodChange,
  defaultPeriod = "30d",
  customFilter,
}: ChartCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const locale = useLocale();
  const isRTL = locale === "ar";

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  const selectedPeriodLabel = periodOptions.find(
    (opt) => opt.value === selectedPeriod,
  )?.label;

  return (
    <div
      className={`rounded-2xl border border-border shadow-sm p-6 ${className}`}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 flex-wrap">
        {/* Title with Tooltip */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

            {description && (
              <div className="relative flex justify-center items-center">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-black/50 hover:text-black/60 transition-colors focus:outline-none"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                {/* Tooltip */}
                {showTooltip && (
                  <div
                    className={`absolute ${isRTL ? "right-[-10px]" : "left-[-10px]"} top-full mt-2 z-[100] w-64 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg`}
                    style={{
                      animation: "fadeIn 0.2s ease-out",
                    }}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="relative">
                      {/* Arrow */}
                      <div
                        className={`absolute -top-5 ${isRTL ? "right-0" : "left-0"} w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900`}
                      />

                      {description}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        {/* Period Filter */}
        {showPeriodFilter && !customFilter && (
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                <span>{selectedPeriodLabel}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            }
            items={periodOptions}
            onSelect={handlePeriodChange}
            width="w-40"
          />
        )}

        {/* Custom Filter */}
        {customFilter && customFilter}
      </div>

      {/* Chart Content */}
      <>{children}</>
    </div>
  );
}
