import { LucideIcon } from "lucide-react";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { useLocale } from "next-intl";
import { formatDateTime } from "@/utils/formatters/dateTime";

interface DataPoint {
  value: number;
  ts?: string | number; // Optional timestamp
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trendData?: number[] | DataPoint[]; // Support both formats
  numbers?: string;
  variant?: "default" | "gradient";
  iconBgColor?: string;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trendData,
  numbers,
  variant = "default",
  iconBgColor = "bg-primary-600",
}: KPICardProps) {
  const isGradient = variant === "gradient";
  const locale = useLocale();

  // Normalize trendData to always be an array of numbers for SparkLineChart
  const chartData = trendData
    ? Array.isArray(trendData) && typeof trendData[0] === "object"
      ? (trendData as DataPoint[]).map((d) => d.value)
      : (trendData as number[])
    : [];

  // Check if we have timestamp data
  const hasTimestamps =
    trendData &&
    Array.isArray(trendData) &&
    typeof trendData[0] === "object" &&
    "ts" in trendData[0];

  // Create value formatter that includes timestamp if available
  const valueFormatter = ((value: number | null, context?: { dataIndex: number }) => {
    if (value === null) return "";
    
    if (hasTimestamps && trendData && context) {
      const dataPoint = (trendData as DataPoint[])[context.dataIndex];
      if (dataPoint?.ts) {
        const dateTime = formatDateTime(dataPoint.ts, locale);
        return `${value}\n${dateTime}`;
      }
    }
    
    return value.toString();
  }) as (value: number | null) => string;

  // Auto-detect number styling based on prefix
  const getNumbersStyle = () => {
    if (!numbers) return "";
    if (numbers.startsWith("+")) {
      return "bg-emerald-100 text-emerald-600";
    }
    if (numbers.startsWith("-")) {
      return "bg-red-100 text-red-600";
    }
    // Neutral styling for numbers without prefix
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div
      className={`
        relative overflow-hidden transition-all hover:shadow-md rounded-[20px] p-8 shadow-(--main-box-shadow)
        ${
          isGradient
            ? "bg-linear-to-r from-[#0491AD] via-[#006D82] to-[#003043]"
            : "bg-white"
        }
      `}
    >
      {/* Gradient Overlay on Right */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none ${
          isGradient
            ? "bg-linear-to-l from-white/10 to-transparent"
            : "bg-linear-to-l from-gray-100/50 to-transparent"
        }`}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
            isGradient ? "bg-white/20" : iconBgColor
          }`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[16px] tracking-[-0.32px] font-medium mb-1 ${
              isGradient ? "text-white/70" : "text-gray-400"
            }`}
          >
            {title}
          </p>
          <div className="flex gap-2 justify-between items-center w-fit">
            <h3
              className={`text-2xl font-bold ${
                isGradient ? "text-white" : "text-gray-900"
              }`}
            >
              {value}
            </h3>
            {numbers && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${getNumbersStyle()}`}
              >
                {numbers}
              </span>
            )}
          </div>
        </div>

        {/* Trend Chart */}
        {chartData && chartData.length > 0 && (
          <div className="w-16 h-10 shrink-0 cursor-crosshair">
            <SparkLineChart
              data={chartData}
              height={40}
              width={64}
              color={isGradient ? "#ffffff" : "#036b80"}
              curve="natural"
              showTooltip={true}
              showHighlight={true}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              area
              valueFormatter={valueFormatter}
              sx={{
                "& .MuiLineElement-root": {
                  strokeWidth: 2,
                  strokeLinejoin: "round",
                  strokeLinecap: "round",
                },
                "& .MuiAreaElement-root": {
                  fill: isGradient
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(3,107,128,0.25)",
                },
                "& .MuiChartsTooltip-root": {
                  backgroundColor: "white",
                  border: `1px solid ${isGradient ? "#ffffff" : "#036b80"}`,
                  borderRadius: "8px",
                  padding: "8px 12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                },
                "& .MuiChartsTooltip-table": {
                  fontFamily: "var(--font-somar), sans-serif",
                  fontSize: "11px",
                  lineHeight: "1.4",
                  color: isGradient ? "#036b80" : "#036b80",
                  whiteSpace: "pre-line",
                },
                "& .MuiChartsTooltip-cell": {
                  fontWeight: 600,
                },
                "& .MuiHighlightElement-root": {
                  fill: isGradient ? "#ffffff" : "#036b80",
                  stroke: "white",
                  strokeWidth: 2,
                },
              }}
            >
              <defs>
                <filter
                  id="lineShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="4"
                    floodColor="#036b80"
                    floodOpacity="0.2"
                  />
                </filter>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  x2="100%"
                  y1="0"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#036b80" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#036b80" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#036b80" stopOpacity="1" />
                </linearGradient>
              </defs>
            </SparkLineChart>
          </div>
        )}
      </div>
    </div>
  );
}
