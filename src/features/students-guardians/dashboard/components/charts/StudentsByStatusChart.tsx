// FILE: src/components/students-guardians/charts/StudentsByStatusChart.tsx

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

export default function StudentsByStatusChart() {
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

  // Calculate status data
  const statusData = useMemo(() => {
    const activeCount = allStudents.filter(
      (s) => s.status === "Active",
    ).length;
    const suspendedCount = allStudents.filter(
      (s) => s.status === "Suspended",
    ).length;
    const withdrawnCount = allStudents.filter(
      (s) => s.status === "Withdrawn",
    ).length;

    return [
      { status: t("status.active"), count: activeCount },
      { status: t("status.suspended"), count: suspendedCount },
      { status: t("status.withdrawn"), count: withdrawnCount },
    ];
  }, [allStudents, t]);

  // Period options for ChartCard
  const periodOptions: DropdownItem[] = [
    { label: t("filters.all_time"), value: "all" },
    { label: t("filters.this_year"), value: "year" },
    { label: t("filters.this_term"), value: "term" },
  ];

  return (
    <ChartCard
      title={t("charts.students_by_status")}
      description={t("charts.students_by_status_desc")}
      showPeriodFilter={true}
      periodOptions={periodOptions}
      defaultPeriod="all"
      bgColor="#dbeafe"
    >
      {/* Chart */}
      <div className="h-64 sm:h-80 w-full overflow-x-auto overflow-y-hidden mt-4">
        <div className="min-w-[300px]">
          {isLoading ? (
            <PartialLoader />
          ) : (
          <BarChart
            dataset={statusData}
            xAxis={[
              {
                scaleType: "band",
                dataKey: "status",
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
                dataKey: "count",
                label: t("charts.students_label"),
                color: "#036b80",
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
