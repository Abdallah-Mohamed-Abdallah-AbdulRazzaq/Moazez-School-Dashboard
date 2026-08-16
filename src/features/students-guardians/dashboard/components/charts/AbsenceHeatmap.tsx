// FILE: src/components/students-guardians/charts/AbsenceHeatmap.tsx

"use client";

import { useTranslations } from "next-intl";

interface HeatmapData {
  week: string;
  data: number[];
}

interface AbsenceHeatmapProps {
  data?: HeatmapData[];
}

export default function AbsenceHeatmap({ data }: AbsenceHeatmapProps) {
  const t = useTranslations("students_guardians.overview");
  const heatmapData = data ?? [];

  const days = [
    t("days.sat"),
    t("days.sun"),
    t("days.mon"),
    t("days.tue"),
    t("days.wed"),
    t("days.thu"),
  ];

  const getIntensityClass = (value: number): string => {
    if (value <= 2) {
      return "bg-green-100 text-green-800";
    } else if (value <= 4) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-main space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900">
        {t("charts.absence_heatmap")}
      </h3>
      <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-[480px] sm:min-w-[500px]">
          {/* Heatmap Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-600"></div>
            {days.map((day) => (
              <div
                key={day}
                className="text-[10px] sm:text-xs font-medium text-gray-600 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Rows */}
          {heatmapData.map((row) => (
            <div
              key={row.week}
              className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2"
            >
              <div className="text-[10px] sm:text-xs font-medium text-gray-600 flex items-center">
                {row.week}
              </div>
              {row.data.map((value, idx) => (
                <div
                  key={idx}
                  className={`h-10 sm:h-12 rounded flex items-center justify-center text-xs sm:text-sm font-semibold ${getIntensityClass(value)}`}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs flex-wrap">
            <span className="text-gray-600">{t("heatmap.absences")}:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.low")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.medium")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 rounded"></div>
              <span className="text-gray-600">{t("heatmap.high")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
