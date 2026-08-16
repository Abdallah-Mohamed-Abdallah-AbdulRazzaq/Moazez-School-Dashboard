// FILE: src/components/students-guardians/charts/StudentsByGradeChart.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PieChart } from "@mui/x-charts/PieChart";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useOptionalStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

export default function StudentsByGradeChart() {
  const t = useTranslations("students_guardians.overview");
  const t_grades = useTranslations("students_guardians.overview.grades");
  const { height, width, isMobile } = useResponsiveChart();
  const context = useOptionalStudentsGuardiansYearTermContext();
  const yearId = context?.yearId ?? null;
  const isContextLoading = context?.isLoading ?? false;

  // Get all students
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

  // Calculate grade data
  const gradeData = useMemo(() => {
    const gradeCount: Record<string, number> = {};

    allStudents.forEach((student) => {
      const grade = student.enrollment?.grade || student.gradeRequested;
      if (grade) {
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      }
    });

    return Object.entries(gradeCount).map(([grade, count]) => {
      // Convert grade to translation key (e.g., "Grade 6" -> "grade_6")
      const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
      const displayGrade = t_grades.has(gradeKey) ? t_grades(gradeKey) : grade;
      const label =
        isMobile && displayGrade.length > 18
          ? `${displayGrade.slice(0, 15)}...`
          : displayGrade;

      return {
        id: grade,
        label,
        value: count,
      };
    });
  }, [allStudents, isMobile, t_grades]);

  // Period options for ChartCard
  const periodOptions: DropdownItem[] = [
    { label: t("filters.all_time"), value: "all" },
    { label: t("filters.this_year"), value: "year" },
    { label: t("filters.this_term"), value: "term" },
  ];

  return (
    <ChartCard
      title={t("charts.students_by_grade")}
      description={t("charts.students_by_grade_desc")}
      showPeriodFilter={true}
      periodOptions={periodOptions}
      defaultPeriod="all"
      bgColor="#d1fae5"
    >
      {/* Chart */}
      <div className="h-64 sm:h-80 w-full flex flex-col items-center justify-center mt-4">
        {isLoading ? (
          <PartialLoader />
        ) : gradeData.length > 0 ? (
          <div className="w-full flex justify-center">
            <PieChart
              series={[
                {
                  data: gradeData,
                  highlightScope: { fade: "global", highlight: "item" },
                  arcLabel: (item) => `${item.value}`,
                  arcLabelMinAngle: 35,
                },
              ]}
              height={height}
              width={width}
              margin={{
                top: 10,
                bottom: 80,
                left: 10,
                right: 10,
              }}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{t("charts.no_data")}</p>
        )}
      </div>
    </ChartCard>
  );
}
