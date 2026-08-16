// FILE: src/components/students-guardians/charts/PassFailRatioChart.tsx

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useOptionalStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

type Period = "term" | "academic_year";

export default function PassFailRatioChart() {
  const t = useTranslations(
    "students_guardians.overview.charts.pass_fail_ratio",
  );
  const { height } = useResponsiveChart();
  const context = useOptionalStudentsGuardiansYearTermContext();
  const yearId = context?.yearId ?? null;
  const isContextLoading = context?.isLoading ?? false;

  const [period, setPeriod] = useState<Period>("term");

  // Custom period options with translations
  const periodOptions: DropdownItem[] = useMemo(
    () => [
      { label: t("period.term"), value: "term" },
      { label: t("period.academic_year"), value: "academic_year" },
    ],
    [t],
  );

  // Get all students with enrollment data
  const [allStudents, setAllStudents] = useState<
    studentsService.StudentWithEnrollmentContext[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (isContextLoading) {
      void Promise.resolve().then(() => setAllStudents([]));
    void Promise.resolve().then(() => setIsLoading(true));
      return () => {
        isCancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const students =
          yearId
            ? await studentsService.fetchStudentsWithEnrollmentForContext(yearId)
            : await studentsService.fetchStudentsWithEnrollment();
        if (!isCancelled) {
          setAllStudents(students);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isContextLoading, yearId]);

  // Filter and calculate pass/fail data based on period
  const chartData = useMemo(() => {
    // Calculate pass/fail based on grade average (passing grade >= 50%)
    const PASSING_GRADE = 50;
    let passCount = 0;
    let failCount = 0;

    allStudents.forEach((student) => {
      const gradeAverage = student.ytdPerformance?.gradeAverage;
      if (gradeAverage !== undefined) {
        if (gradeAverage >= PASSING_GRADE) {
          passCount++;
        } else {
          failCount++;
        }
      }
    });

    const total = passCount + failCount;
    const passPercentage =
      total > 0 ? ((passCount / total) * 100).toFixed(1) : "0";

    return {
      data: [
        { id: 0, value: passCount, label: t("pass"), color: "#10b981" },
        { id: 1, value: failCount, label: t("fail"), color: "#ef4444" },
      ],
      total,
      passCount,
      failCount,
      passPercentage,
    };
  }, [allStudents, t]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
  };

  return (
    <ChartCard
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      periodOptions={periodOptions}
      onPeriodChange={handlePeriodChange}
      defaultPeriod={period}
      bgColor="#d1fae5"
      className="h-full"
    >
      {isLoading ? (
        <PartialLoader />
      ) : chartData.total > 0 ? (
        <>
          {/* Legend on the left */}
          <div className="flex items-center gap-8 mb-4">
            {chartData.data.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="flex justify-center">
            <PieChart
              series={[
                {
                  data: chartData.data,
                },
              ]}
              height={height}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("total_students")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {chartData.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("pass_rate")}</p>
              <p className="text-2xl font-bold text-green-600">
                {chartData.passPercentage}%
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      )}
    </ChartCard>
  );
}
