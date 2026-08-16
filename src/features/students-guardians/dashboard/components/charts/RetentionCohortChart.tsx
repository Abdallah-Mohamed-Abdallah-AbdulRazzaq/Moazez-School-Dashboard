// FILE: src/components/students-guardians/charts/RetentionCohortChart.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useOptionalStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { useResponsiveChart } from "@/hooks/useResponsiveChart";
import { ChartCard } from "@/components/ui/chart-card";
import { DropdownItem } from "@/components/ui/dropdown";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

export default function RetentionCohortChart() {
  const t = useTranslations("students_guardians.overview");
  const { height, leftMargin } = useResponsiveChart();
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

  // Calculate retention data by academic year
  const retentionData = useMemo(() => {
    // Group students by academic year
    const yearGroups: Record<string, { total: number; retained: number }> = {};

    allStudents.forEach((student) => {
      const year = student.enrollment?.academicYear;
      if (year) {
        if (!yearGroups[year]) {
          yearGroups[year] = { total: 0, retained: 0 };
        }
        yearGroups[year].total++;
        if (student.status === "Active") {
          yearGroups[year].retained++;
        }
      }
    });

    // Convert to chart format
    return Object.entries(yearGroups)
      .map(([year, data]) => ({
        year,
        retained: Math.round((data.retained / data.total) * 100),
        left: Math.round(((data.total - data.retained) / data.total) * 100),
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [allStudents]);

  // Period options for ChartCard
  const periodOptions: DropdownItem[] = [
    { label: t("filters.all_time"), value: "all" },
    { label: t("filters.this_year"), value: "year" },
    { label: t("filters.this_term"), value: "term" },
  ];

  return (
    <ChartCard
      title={t("charts.retention_cohort")}
      description={t("charts.retention_cohort_desc")}
      showPeriodFilter={true}
      periodOptions={periodOptions}
      defaultPeriod="all"
      bgColor="#ede9fe"
    >
      {/* Chart */}
      <div className="h-64 sm:h-80 w-full overflow-x-auto overflow-y-hidden mt-4">
        <div className="min-w-[300px]">
          {isLoading ? (
            <PartialLoader />
          ) : (
          <BarChart
            dataset={retentionData}
            xAxis={[{ scaleType: "band", dataKey: "year" }]}
            series={[
              {
                dataKey: "retained",
                label: t("charts.retained"),
                color: "#10b981",
                stack: "total",
              },
              {
                dataKey: "left",
                label: t("charts.left"),
                color: "#ef4444",
                stack: "total",
              },
            ]}
            height={height}
            margin={{
              top: 20,
              bottom: 40,
              left: leftMargin,
              right: 20,
            }}
          />
          )}
        </div>
      </div>
    </ChartCard>
  );
}
