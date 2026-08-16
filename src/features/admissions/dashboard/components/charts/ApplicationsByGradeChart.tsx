// FILE: src/components/admissions/charts/ApplicationsByGradeChart.tsx

"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChartCard } from "@/components/ui/chart-card";

interface GradeData {
  grade: string;
  count: number;
}

interface ApplicationsByGradeChartProps {
  data: GradeData[];
}

// Define logical grade order
const GRADE_ORDER = [
  "KG1",
  "KG2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export default function ApplicationsByGradeChart({
  data,
}: ApplicationsByGradeChartProps) {
  const t = useTranslations("admissions.charts");
  const t_grades = useTranslations("admissions.grades");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Helper function to convert grade name to translation key
  const getGradeKey = (grade: string): string => {
    return grade.toLowerCase().replace(/\s+/g, "_");
  };

  // Sort data by logical grade order
  const sortedData = [...data].sort((a, b) => {
    const indexA = GRADE_ORDER.indexOf(a.grade);
    const indexB = GRADE_ORDER.indexOf(b.grade);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.grade.localeCompare(b.grade);
  });

  const grades = sortedData.map((item) => item.grade);
  const counts = sortedData.map((item) => item.count);
  const total = counts.reduce((sum, count) => sum + count, 0);

  // Get translated grade labels for display
  const translatedGrades = grades.map((grade) => {
    const key = getGradeKey(grade);
    return t_grades.has(key) ? t_grades(key) : grade;
  });

  // Get most requested grade with translation
  const mostRequestedGrade =
    sortedData.length > 0
      ? (() => {
          const mostRequested = sortedData.reduce((max, item) =>
            item.count > max.count ? item : max,
          );
          const key = getGradeKey(mostRequested.grade);
          return t_grades.has(key) ? t_grades(key) : mostRequested.grade;
        })()
      : t("no_data");

  const periodOptions = [
    { label: t("all_time"), value: "all" },
    { label: t("this_month"), value: "month" },
    { label: t("this_term"), value: "term" },
    { label: t("this_year"), value: "year" },
  ];

  if (total === 0 || sortedData.length === 0) {
    return (
      <ChartCard
        title={t("applications_by_grade")}
        subtitle={t("grade_distribution")}
        description={t("applications_by_grade_desc")}
        periodOptions={periodOptions}
        defaultPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        bgColor="#dbeafe"
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={t("applications_by_grade")}
      subtitle={t("grade_distribution")}
      description={t("applications_by_grade_desc")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      bgColor="#dbeafe"
      className="h-full flex flex-col justify-between"
    >
      <div className="flex items-center justify-center">
        <BarChart
          xAxis={[
            {
              scaleType: "band",
              data: translatedGrades,
              categoryGapRatio: 0.3,
              barGapRatio: 0.1,
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: {
                fontSize: 14,
                fontWeight: 500,
              },
            },
          ]}
          series={[
            {
              data: counts,
              color: "#036b80",
              label: t("applications"),
            },
          ]}
          height={300}
          margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("total_applications")}</p>
            <p className="text-lg font-bold text-gray-900">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("grade_levels")}</p>
            <p className="text-lg font-bold text-gray-900">{grades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("most_requested")}</p>
            <p className="text-lg font-bold text-primary">
              {mostRequestedGrade}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{t("highest_demand")}</p>
            <p className="text-lg font-bold text-primary">
              {Math.max(...counts)} {t("apps")}
            </p>
          </div>
        </div>
      </div>

      {/* Grade Distribution List */}
      <div className="mt-4 space-y-2">
        {sortedData.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const key = getGradeKey(item.grade);
          const displayGrade = t_grades.has(key) ? t_grades(key) : item.grade;

          return (
            <div
              key={item.grade}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700 font-medium">{displayGrade}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-900 font-semibold w-8 text-right">
                  {item.count}
                </span>
                <span className="text-gray-500 text-xs w-12 text-right">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
