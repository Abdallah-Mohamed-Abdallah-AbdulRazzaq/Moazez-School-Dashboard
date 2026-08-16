"use client";

import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useLocale } from "next-intl";
import { formatDateTime } from "@/utils/formatters/dateTime";

interface DataPoint {
  month: string;
  value: number;
  ts?: string | number; // Optional timestamp (ISO string or epoch milliseconds)
}

interface KPICardWithChartProps {
  title: string;
  currentValue: number;
  currentMonth: string;
  previousValue: number;
  data: DataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DataPoint }>;
  locale?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, locale = "en" }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const hasTimestamp = dataPoint.ts !== undefined;
    
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-[#036b80] font-sans">
        {hasTimestamp && (
          <p className="text-[10px] text-gray-500 mb-1">
            {formatDateTime(dataPoint.ts!, locale)}
          </p>
        )}
        <p className="text-xs font-semibold text-[#036b80]">
          {payload[0].value}
        </p>
        {!hasTimestamp && dataPoint.month && (
          <p className="text-[10px] text-gray-500 mt-1">
            {dataPoint.month}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function KPICardWithChart({
  title,
  currentValue,
  currentMonth,
  previousValue,
  data,
  valuePrefix = "",
  valueSuffix = "",
}: KPICardWithChartProps) {
  const locale = useLocale();
  
  // Calculate change
  const absoluteChange = currentValue - previousValue;
  const percentageChange = ((absoluteChange / previousValue) * 100).toFixed(1);
  const isPositive = absoluteChange >= 0;

  // Format the change value
  const formattedChange = valuePrefix
    ? `${isPositive ? "+" : ""}${valuePrefix}${Math.abs(absoluteChange)}`
    : `${isPositive ? "+" : ""}${Math.abs(absoluteChange)}${valueSuffix}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl font-semibold text-gray-900">
              {valuePrefix}
              {currentValue.toLocaleString()}
              {valueSuffix}
            </p>
            <p className="text-sm text-gray-500 mt-1">On {currentMonth}</p>
          </div>

          <div className="text-right">
            <p
              className={`font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}
            >
              {isPositive ? "+" : ""}
              {percentageChange}% ({formattedChange})
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[120px] -mx-2 cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id={`colorValue-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#036b80", fontSize: 12 }}
              ticks={[data[0]?.month, data[data.length - 1]?.month]}
              interval="preserveStartEnd"
            />

            <Tooltip content={<CustomTooltip locale={locale} />} cursor={false} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#036b80"
              strokeWidth={2}
              fill={`url(#colorValue-${title})`}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#036b80",
                stroke: "#ffffff",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
