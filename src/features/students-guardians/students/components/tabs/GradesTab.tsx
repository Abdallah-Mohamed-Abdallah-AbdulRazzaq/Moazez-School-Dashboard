"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp, Award, BookOpen, Target, Percent } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import StudentEnrollmentMissingState from "@/features/students-guardians/students/components/StudentEnrollmentMissingState";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import { isStudentEnrollmentNotFoundError } from "@/features/students-guardians/students/utils/studentProfileErrors";
import { fetchStudentGradesSnapshot } from "@/features/grades/overview/services/gradesOverviewService";
import type { StudentGradesSnapshot } from "@/features/grades/overview/types";

interface GradesTabProps {
  student: Student;
  academicYearId?: string | null;
  termId?: string | null;
}

export default function GradesTab({
  student,
  academicYearId,
  termId,
}: GradesTabProps) {
  const t = useTranslations("students_guardians.profile.grades");
  const locale = useLocale();
  const [snapshot, setSnapshot] = useState<StudentGradesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollmentMissing, setIsEnrollmentMissing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadSnapshot = async () => {
      if (!academicYearId || !termId) {
        setSnapshot(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsEnrollmentMissing(false);

      try {
        const nextSnapshot = await fetchStudentGradesSnapshot(student.id, {
          academicYearId,
          termId,
        });

        if (!isCancelled) {
          setSnapshot(nextSnapshot);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setSnapshot(null);
          if (isStudentEnrollmentNotFoundError(loadError)) {
            setIsEnrollmentMissing(true);
            return;
          }
          const message = loadError instanceof Error ? loadError.message : "";
          if (
            message.includes("not found") ||
            message.includes("404") ||
            message.includes("enrollment")
          ) {
            setError(t("no_snapshot_available"));
          } else {
            setError(message || t("loading_error"));
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSnapshot();

    return () => {
      isCancelled = true;
    };
  }, [student.id, academicYearId, termId, t]);

  const subjectRows = useMemo(() => snapshot?.subjectRows || [], [snapshot]);
  const assessments = useMemo(() => snapshot?.assessments || [], [snapshot]);

  const subjectColumns = useMemo(
    () => [
      {
        key: "subject",
        label: t("table.subject"),
      },
      {
        key: "average",
        label: t("table.average"),
        render: (value: unknown) =>
          value != null ? (
            <span className="font-semibold">{Number(value).toFixed(1)}%</span>
          ) : (
            "--"
          ),
      },
      {
        key: "completedWeight",
        label: t("col_completed_weight"),
        render: (value: unknown) =>
          value != null ? `${Number(value)}%` : "--",
      },
      {
        key: "enteredTotal",
        label: t("col_entered"),
      },
      {
        key: "missing",
        label: t("col_missing"),
        render: (value: unknown) => (
          <span className={Number(value) > 0 ? "font-semibold text-red-600" : ""}>
            {value as number}
          </span>
        ),
      },
      {
        key: "absent",
        label: t("col_absent"),
        render: (value: unknown) => (
          <span className={Number(value) > 0 ? "font-semibold text-amber-600" : ""}>
            {value as number}
          </span>
        ),
      },
      {
        key: "last_assessment",
        label: t("table.last_assessment"),
        render: (value: unknown) =>
          value == null ? "-" : `${Number(value).toFixed(1)}%`,
      },
      {
        key: "assessments_count",
        label: t("table.assessments"),
        render: (value: unknown) =>
          `${value as number} ${t("total_assessments_suffix")}`,
      },
      {
        key: "status",
        label: t("status", { defaultValue: "Status" }),
        render: (value: unknown) => {
          if (!value) return "-";
          const statusStr = String(value);
          const upper = statusStr.toUpperCase();
          const badgeClass =
            upper === "PASS" || upper === "PASSING"
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : upper === "FAIL" || upper === "FAILING"
              ? "bg-red-100 text-red-800 border-red-300"
              : "bg-amber-100 text-amber-800 border-amber-300";
          return (
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${badgeClass}`}
            >
              {statusStr}
            </span>
          );
        },
      },
      {
        key: "trend",
        label: t("table.trend"),
      },
    ],
    [t],
  );

  const subjectTableData = useMemo(
    () =>
      subjectRows.map((row) => ({
        id: row.subjectId,
        subject:
          (locale === "ar" ? row.subjectNameAr : row.subjectName) ||
          row.subjectName,
        average: row.average,
        completedWeight: row.completedWeight,
        enteredTotal: `${row.enteredCount ?? 0}/${row.assessmentsCount ?? row.assessmentCount ?? 0}`,
        missing: row.missingCount ?? 0,
        absent: row.absentCount ?? 0,
        last_assessment: row.lastAssessmentScore,
        assessments_count: row.assessmentsCount ?? row.assessmentCount ?? 0,
        status: row.status,
        trend: row.trend,
      })),
    [subjectRows, locale],
  );

  const assessmentColumns = useMemo(
    () => [
      {
        key: "title",
        label: t("col_title", { defaultValue: "Title" }),
      },
      {
        key: "subject",
        label: t("table.subject"),
      },
      {
        key: "type",
        label: t("col_type", { defaultValue: "Type" }),
      },
      {
        key: "date",
        label: t("col_date", { defaultValue: "Date" }),
      },
      {
        key: "weight",
        label: t("col_weight"),
        render: (value: unknown) =>
          value != null ? `${Number(value)}%` : "-",
      },
      {
        key: "maxScore",
        label: t("col_max_score"),
        render: (value: unknown) => (value != null ? String(value) : "-"),
      },
      {
        key: "score",
        label: t("col_score"),
        render: (value: unknown) => (value != null ? String(value) : "-"),
      },
      {
        key: "weightedContribution",
        label: t("col_contribution"),
        render: (value: unknown) =>
          value != null ? `${Number(value).toFixed(1)}%` : "-",
      },
      {
        key: "status",
        label: t("col_status", { defaultValue: "Status" }),
        render: (value: unknown, row: Record<string, unknown>) => {
          const statusStr = String(value || "");
          const isVirtualMissing = Boolean(row.isVirtualMissing);
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                  statusStr === "entered" || statusStr === "graded"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : statusStr === "missing"
                    ? "bg-red-100 text-red-800 border-red-300"
                    : statusStr === "absent"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-gray-100 text-gray-800 border-gray-300"
                }`}
              >
                {t(`status_${statusStr}`, { defaultValue: statusStr })}
              </span>
              {isVirtualMissing && (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded border bg-red-100 text-red-800 border-red-300">
                  {t("pending_tag", { defaultValue: "Pending" })}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [t],
  );

  const assessmentTableData = useMemo(
    () =>
      assessments.map((item) => {
        const rawTitle =
          locale === "ar"
            ? item.titleAr || item.title
            : item.titleEn || item.title;
        const displayTitle = rawTitle || `${item.type} — ${item.date}`;
        const foundSub = subjectRows.find(
          (s) => s.subjectId === item.subjectId,
        );
        const subjectName = foundSub
          ? (locale === "ar"
              ? foundSub.subjectNameAr
              : foundSub.subjectName) || foundSub.subjectName
          : item.subjectId;

        return {
          id: item.assessmentId,
          title: displayTitle,
          subject: subjectName,
          type: item.type,
          date: item.date,
          weight: item.weight,
          maxScore: item.maxScore,
          score:
            item.score != null
              ? item.score
              : item.percent != null
              ? `${item.percent}%`
              : null,
          weightedContribution: item.weightedContribution,
          status: item.status,
          isVirtualMissing: item.isVirtualMissing,
        };
      }),
    [assessments, subjectRows, locale],
  );

  if (!academicYearId || !termId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {t("missing_term_context")}
      </div>
    );
  }

  if (isLoading) {
    return <StudentTabSkeleton variant="dashboard" />;
  }

  if (isEnrollmentMissing) {
    return <StudentEnrollmentMissingState />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!snapshot || subjectRows.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--surface-color)",
        }}
      >
        {t("empty_state")}
      </div>
    );
  }

  const topSubject = subjectRows[0];
  const lowestSubject = subjectRows[subjectRows.length - 1];

  return (
    <div className="space-y-6">
      {/* Rule Info Card & Overall Status Badge */}
      {(snapshot.rule || snapshot.status) && (
        <div
          className="rounded-xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--surface-color)",
          }}
        >
          <div>
            {snapshot.rule && (
              <>
                <h4
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("rule_info")}
                </h4>
                <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-1">
                  <span>
                    Source:{" "}
                    <strong className="capitalize">
                      {snapshot.rule.source}
                    </strong>
                  </span>
                  <span>
                    {t("pass_mark")}: <strong>{snapshot.rule.passMark}%</strong>
                  </span>
                  <span>
                    {t("grading_scale")}:{" "}
                    <strong className="capitalize">
                      {snapshot.rule.gradingScale}
                    </strong>
                  </span>
                  <span>
                    {t("rounding")}:{" "}
                    <strong className="capitalize">
                      {snapshot.rule.rounding}
                    </strong>
                  </span>
                </div>
              </>
            )}
          </div>
          {snapshot.status && (
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  snapshot.status.toUpperCase() === "PASS" ||
                  snapshot.status.toLowerCase() === "passing"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : snapshot.status.toUpperCase() === "FAIL" ||
                      snapshot.status.toLowerCase() === "failing"
                    ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {snapshot.status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
          snapshot.completedWeight != null
            ? "lg:grid-cols-5"
            : "lg:grid-cols-4"
        }`}
      >
        <KPICardV2
          title={t("kpis.term_average")}
          value={
            snapshot.currentAverage != null
              ? `${snapshot.currentAverage.toFixed(1)}%`
              : "--"
          }
          subtitle={t("overall_gpa")}
          icon={Award}
          iconColor="var(--primary-color)"
          iconBgColor="var(--color-primary-100)"
          chartData={snapshot.performanceTrend.map((point, index) => ({
            label: `P${index + 1}`,
            value: point.average,
          }))}
          chartColor="var(--primary-color)"
        />
        {snapshot.completedWeight != null && (
          <div
            className="rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col justify-between bg-white"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--surface-color)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-primary-100)" }}
              >
                <Percent
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "var(--primary-color)" }}
                />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                  {t("completed_weight")}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {snapshot.completedWeight}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, snapshot.completedWeight))}%`,
                  backgroundColor: "var(--primary-color, #2563eb)",
                }}
              />
            </div>
          </div>
        )}
        <KPICardV2
          title={t("kpis.highest_grade")}
          value={
            snapshot.highestAverage != null
              ? `${snapshot.highestAverage.toFixed(1)}%`
              : "--"
          }
          subtitle={
            (locale === "ar" ? topSubject.subjectNameAr : topSubject.subjectName) ||
            topSubject.subjectName
          }
          icon={Target}
          iconColor="var(--success-text)"
          iconBgColor="var(--success-bg)"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.lowest_grade")}
          value={
            snapshot.lowestAverage != null
              ? `${snapshot.lowestAverage.toFixed(1)}%`
              : "--"
          }
          subtitle={
            (locale === "ar" ? lowestSubject.subjectNameAr : lowestSubject.subjectName) ||
            lowestSubject.subjectName
          }
          icon={BookOpen}
          iconColor="var(--warning-text)"
          iconBgColor="var(--warning-bg)"
          showChart={false}
        />
        <KPICardV2
          title={t("total_assessments")}
          value={snapshot.totalAssessments}
          subtitle={t("this_semester")}
          icon={TrendingUp}
          iconColor="var(--accent-color)"
          iconBgColor="var(--color-primary-50)"
          showChart={false}
        />
      </div>

      {/* Line Chart */}
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--surface-color)",
        }}
      >
        <h3
          className="mb-4 text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("performance_over_time")}
        </h3>
        <div className="h-80">
          <LineChart
            xAxis={[
              {
                scaleType: "point",
                data: snapshot.performanceTrend.map((point) => point.label),
              },
            ]}
            series={[
              {
                data: snapshot.performanceTrend.map((point) => point.average),
                label: t("average_grade"),
                color: "var(--primary-color)",
                curve: "linear",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          />
        </div>
      </div>

      {/* Enhanced Subject Table */}
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--surface-color)",
        }}
      >
        <div
          className="mb-4 border-b pb-4"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("subject_grades")}
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("subject_grades_subtitle")}
          </p>
        </div>
        <DataTable
          columns={subjectColumns}
          data={subjectTableData}
          showPagination={false}
        />
      </div>

      {/* Assessments Table */}
      {assessments.length > 0 && (
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--surface-color)",
          }}
        >
          <div
            className="mb-4 border-b pb-4"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("assessments_title")}
            </h3>
          </div>
          <DataTable
            columns={assessmentColumns}
            data={assessmentTableData}
            showPagination={false}
          />
        </div>
      )}
    </div>
  );
}
