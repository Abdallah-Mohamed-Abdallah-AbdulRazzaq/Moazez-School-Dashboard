"use client";

import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown";
import { formatDateTime } from "@/utils/formatters/dateTime";

interface DataPoint {
  label: string;
  value: number;
  ts?: string | number; // Optional timestamp (ISO string or epoch milliseconds)
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DataPoint }>;
}

// Custom tooltip component defined outside of render
const CustomTooltip = ({
  active,
  payload,
  chartColor,
  locale,
}: TooltipProps & { chartColor: string; locale: string }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const hasTimestamp = dataPoint.ts !== undefined;
    
    return (
      <div
        className="bg-white px-3 py-2 rounded-lg shadow-lg border font-sans"
        style={{ borderColor: chartColor }}
      >
        {hasTimestamp && (
          <p className="text-[10px] text-gray-500 mb-1">
            {formatDateTime(dataPoint.ts!, locale)}
          </p>
        )}
        <p className="text-xs font-semibold" style={{ color: chartColor }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

CustomTooltip.displayName = "CustomTooltip";

interface KPICardV2Props {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: {
    value: number;
    percentage: number;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  chartData?: DataPoint[];
  chartColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  showChart?: boolean;
  className?: string;
  showPeriodFilter?: boolean;
  periodOptions?: DropdownItem[];
  onPeriodChange?: (period: string) => void;
  defaultPeriod?: string;
}

export default function KPICardV2({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "#ef4444",
  iconBgColor = "#fef2f2",
  chartData,
  chartColor = "#f87171",
  valuePrefix = "",
  valueSuffix = "",
  showChart = true,
  className = "",
  showPeriodFilter = false,
  periodOptions = [],
  onPeriodChange,
  defaultPeriod = "7d",
}: KPICardV2Props) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const locale = useLocale();

  const changeColor = change
    ? change.isPositive !== false
      ? "bg-emerald-500"
      : "bg-red-500"
    : "bg-emerald-500";



  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  const selectedPeriodLabel = periodOptions.find(
    (opt) => opt.value === selectedPeriod,
  )?.label;

  // Determine if we should show chart
  const hasChart = showChart && chartData && chartData.length > 0;

  return (
    <div
      className={`rounded-2xl border border-gray-200 shadow-sm p-3 relative ${className}`}
    >
      {/* Conditional Layout: Horizontal without chart, Vertical with chart */}
      {!hasChart ? (
        // Horizontal Layout (No Chart)
        <div className="flex items-center gap-2 sm:gap-3 h-full">
          {/* Icon */}
          <div>
          {Icon && (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconBgColor }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />
            </div>

            
          )}

           
            </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
              {title}
            </h3>

            {/* Value */}
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {valuePrefix}
              {typeof value === "number" ? value.toLocaleString() : value}
              {valueSuffix}
            </p>

            {/* Subtitle or Change */}
            {change ? (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`${changeColor} text-white text-xs font-semibold px-1.5 py-0.5 rounded`}
                >
                  {change.isPositive !== false ? "+" : ""}
                  {change.percentage.toFixed(0)}%
                </span>
                {subtitle && (
                  <span className="text-xs text-gray-400">{subtitle}</span>
                )}
              </div>
            ) : (
              subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )
            )}
          </div>
        </div>
      ) : (
        // Vertical Layout (With Chart)
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full gap-3 sm:gap-0">
          {/* Left Section */}
          <div className={`w-full sm:flex-1 ${showPeriodFilter || change ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-4" } `}>
            {/* Icon */}
            <div className="flex items-center gap-3 sm:gap-5">
            {Icon && (
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: iconBgColor }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />
              </div>
            )}

             {change && (
              <div className="flex flex-col items-end">
                <span
                  className={`${changeColor} text-white text-xs font-semibold px-2 py-1 rounded-lg`}
                >
                  {change.isPositive !== false ? "+" : ""}
                  {change.percentage.toFixed(0)}%
                </span>
               
              </div>
            )}
</div>
            {/* Title */}
            <div className="w-full">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
              {title}
            </h3>

            {/* Value */}
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {valuePrefix}
              {typeof value === "number" ? value.toLocaleString() : value}
              {valueSuffix}
            </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end justify-end mb-2 h-full w-full sm:w-auto">
            {/* Change Badge */}
          
 {showPeriodFilter && periodOptions.length > 0  && (
                  <div className="mt-1 relative">
                    <DropdownMenu
                      trigger={
                        <div className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 cursor-pointer">
                          <span>{selectedPeriodLabel}</span>
                          <svg
                            className="w-3 h-3"
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
                        </div>
                      }
                      items={periodOptions}
                      onSelect={handlePeriodChange}
                      width="w-40"
                    />
                  </div>
                )
              }
            {/* Chart */}
            <div className="w-full sm:w-40 h-16 mt-2 relative cursor-crosshair">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 3, left: 3, bottom: 7}}
                >
                  <defs>
                    <linearGradient
                      id={`colorValue-${title}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartColor}
                        stopOpacity={0.08}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <Tooltip
                    content={<CustomTooltip chartColor={chartColor} locale={locale} />}
                    cursor={false}
                  />

                  <Area
                    type="natural"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fillOpacity={0.05}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: chartColor,
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
