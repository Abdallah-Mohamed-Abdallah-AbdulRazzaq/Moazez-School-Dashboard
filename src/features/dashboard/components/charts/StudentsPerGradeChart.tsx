"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import type { DashboardStudentsPerGradeData } from "@/features/dashboard/utils/dashboardStatsCalculator";

type Filter = "all" | "new" | "existing";

interface StudentsPerGradeChartProps {
  data: DashboardStudentsPerGradeData;
}

export default function StudentsPerGradeChart({
  data: distribution,
}: StudentsPerGradeChartProps) {
  const t = useTranslations("students_per_grade");
  const tGrades = useTranslations("admissions.grades");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");

  const getGradeKey = (grade: string): string =>
    grade.toLowerCase().replace(/\s+/g, "_");

  const translatedGrades = useMemo(
    () =>
      distribution.grades.map((grade) => {
        const key = getGradeKey(grade);
        return tGrades.has(key) ? tGrades(key) : grade;
      }),
    [distribution.grades, tGrades]
  );

  const chartValues = useMemo(() => {
    if (filter === "new") {
      return distribution.newStudents;
    }
    if (filter === "existing") {
      return distribution.existingStudents;
    }

    return distribution.newStudents.map(
      (value, index) => value + distribution.existingStudents[index]
    );
  }, [distribution.existingStudents, distribution.newStudents, filter]);

  const highestIndex = useMemo(() => {
    let maxIndex = 0;
    for (let index = 1; index < chartValues.length; index += 1) {
      if (chartValues[index] > chartValues[maxIndex]) {
        maxIndex = index;
      }
    }
    return maxIndex;
  }, [chartValues]);

  const highestGradeLabel =
    translatedGrades[highestIndex] ?? translatedGrades[0] ?? t("title");

  return (
    <ChartCard
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      showPeriodFilter={false}
      customFilter={
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["all", "new", "existing"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {t(`filter.${key}`)}
            </button>
          ))}
        </div>
      }
      className="h-full flex flex-col justify-between"
    >
      <BarChart
        xAxis={[{ data: translatedGrades, scaleType: "band" }]}
        series={[{ data: chartValues, color: "#036b80" }]}
        height={180}
        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
      />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-600">
            {t("insight.prefix", { grade: highestGradeLabel })}{" "}
            <span className="font-semibold text-primary-600">
              {t("insight.highlight")}
            </span>
          </p>

          <Button
            size="sm"
            rightIcon={
              locale === "ar" ? (
                <ArrowLeft className="w-3 h-3" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )
            }
          >
            {t("actions.view_class_distribution")}
          </Button>
        </div>
      </div>
    </ChartCard>
  );
}
