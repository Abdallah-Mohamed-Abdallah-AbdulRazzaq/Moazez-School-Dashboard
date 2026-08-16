"use client";

import { useMemo } from "react";

interface GaugeChartProps {
  value: number; // 0-100
  presentLabel?: string;
  absentLabel?: string;
  presentColor?: string;
  absentColor?: string;
  size?: number;
  thickness?: number;
  showTooltip?: boolean;
}

export default function GaugeChart({
  value,
  presentLabel = "حاضر",
  absentLabel = "غائب",
  presentColor = "#036b80",
  absentColor = "#14b8a6",
  size = 200,
  thickness = 40,
  showTooltip = true,
}: GaugeChartProps) {
  const absentValue = 100 - value;

  // Calculate SVG paths for the gauge
  const { presentPath, absentPath, center } = useMemo(() => {
    const center = size / 2;
    const radius = (size - thickness) / 2;

    // Start angle: 180 degrees (left side)
    // End angle: 0 degrees (right side)
    // Total: 180 degrees (semi-circle)

    const startAngle = 180;
    const totalAngle = 180;

    const presentAngle = (value / 100) * totalAngle;
    const absentAngle = (absentValue / 100) * totalAngle;

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const getPoint = (angle: number) => {
      const rad = toRadians(angle);
      return {
        x: center + radius * Math.cos(rad),
        y: center + radius * Math.sin(rad),
      };
    };

    // Present arc (from start to present percentage)
    const presentStart = getPoint(startAngle);
    const presentEnd = getPoint(startAngle - presentAngle);
    const presentLargeArc = presentAngle > 90 ? 1 : 0;

    const presentPath = `
      M ${presentStart.x} ${presentStart.y}
      A ${radius} ${radius} 0 ${presentLargeArc} 1 ${presentEnd.x} ${presentEnd.y}
    `;

    // Absent arc (from present end to total end)
    const absentStart = presentEnd;
    const absentEnd = getPoint(startAngle - totalAngle);
    const absentLargeArc = absentAngle > 90 ? 1 : 0;

    const absentPath = `
      M ${absentStart.x} ${absentStart.y}
      A ${radius} ${radius} 0 ${absentLargeArc} 1 ${absentEnd.x} ${absentEnd.y}
    `;

    return { presentPath, absentPath, center, radius };
  }, [value, absentValue, size, thickness]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Gauge Chart */}
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          width={size}
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.6}`}
          className="overflow-visible"
        >
          {/* Present Arc */}
          <path
            d={presentPath}
            fill="none"
            stroke={presentColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />

          {/* Absent Arc */}
          <path
            d={absentPath}
            fill="none"
            stroke={absentColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />

          {/* Center Value */}
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            className="text-4xl font-bold fill-gray-900"
          >
            {value}
          </text>
        </svg>

        {/* Tooltip on hover (optional) */}
        {showTooltip && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              {presentLabel}: {value}% | {absentLabel}: {absentValue}%
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: presentColor }}
            />
            <span className="text-2xl font-bold text-gray-900">{value}%</span>
          </div>
          <span className="text-sm text-gray-500">{presentLabel}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: absentColor }}
            />
            <span className="text-2xl font-bold text-gray-900">
              {absentValue}%
            </span>
          </div>
          <span className="text-sm text-gray-500">{absentLabel}</span>
        </div>
      </div>
    </div>
  );
}
