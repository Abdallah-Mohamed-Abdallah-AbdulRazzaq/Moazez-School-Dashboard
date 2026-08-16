// Presenter component for Students & Guardians Dashboard
// Pure presentation - receives data via props, no business logic

"use client";

import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Download,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import AbsenceHeatmap from "../components/charts/AbsenceHeatmap";
import StudentsByStatusChart from "../components/charts/StudentsByStatusChart";
import StudentsByGradeChart from "../components/charts/StudentsByGradeChart";
import RetentionCohortChart from "../components/charts/RetentionCohortChart";
import PassFailRatioChart from "../components/charts/PassFailRatioChart";
import type { StudentStats, RiskDistribution } from "@/features/students-guardians/dashboard/utils/studentStatsCalculator";
import type { Student } from "@/features/students-guardians/students/types";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import {
  createStudentsGuardiansDashboardAnalyticsJson,
  formatStudentsGuardiansDashboardAnalyticsForExport,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

interface StudentsGuardiansDashboardViewProps {
  stats: StudentStats;
  riskDistribution: RiskDistribution;
  students: Student[];
}

export default function StudentsGuardiansDashboardView({
  stats,
  riskDistribution,
  students,
}: StudentsGuardiansDashboardViewProps) {
  const t = useTranslations("students_guardians.overview");
  const tGrades = useTranslations("students_guardians.overview.grades");
  const tPassFail = useTranslations(
    "students_guardians.overview.charts.pass_fail_ratio",
  );
  const locale = useLocale();
  const [showExportModal, setShowExportModal] = useState(false);

  const dashboardAnalytics = useMemo(() => {
    const statusData = [
      { status: t("status.active"), count: students.filter((s) => s.status === "Active").length },
      { status: t("status.suspended"), count: students.filter((s) => s.status === "Suspended").length },
      { status: t("status.withdrawn"), count: students.filter((s) => s.status === "Withdrawn").length },
    ];

    const gradeCount: Record<string, number> = {};
    students.forEach((student) => {
      const grade =
        (student as Student & { enrollment?: { grade?: string } }).enrollment
          ?.grade || student.gradeRequested;
      if (grade) {
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      }
    });

    const gradeData = Object.entries(gradeCount).map(([grade, count]) => {
      const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
      const translatedGrade = tGrades.has(gradeKey) ? tGrades(gradeKey) : grade;
      return {
        grade: translatedGrade,
        count,
      };
    });

    const yearGroups: Record<string, { total: number; retained: number }> = {};
    students.forEach((student) => {
      const year = (student as Student & { enrollment?: { academicYear?: string } })
        .enrollment?.academicYear;
      if (!year) return;
      if (!yearGroups[year]) {
        yearGroups[year] = { total: 0, retained: 0 };
      }
      yearGroups[year].total += 1;
      if (student.status === "Active") {
        yearGroups[year].retained += 1;
      }
    });

    const retentionData = Object.entries(yearGroups).map(([year, data]) => ({
      year,
      retained: Math.round((data.retained / data.total) * 100),
      left: Math.round(((data.total - data.retained) / data.total) * 100),
    }));

    let passCount = 0;
    let failCount = 0;
    students.forEach((student) => {
      const gradeAverage = (student as Student & { ytdPerformance?: { gradeAverage?: number } })
        .ytdPerformance?.gradeAverage;
      if (gradeAverage !== undefined) {
        if (gradeAverage >= 50) {
          passCount += 1;
        } else {
          failCount += 1;
        }
      }
    });

    const passFailTotal = passCount + failCount;

    return {
      generatedAt: new Date().toISOString(),
      kpis: [
        {
          label: t("kpis.total_students"),
          value: stats.total,
          subtitle: t("kpis.active_count", { count: stats.active }),
        },
        {
          label: t("kpis.active_students"),
          value: stats.active,
          subtitle: t("kpis.currently_enrolled"),
        },
        {
          label: t("kpis.at_risk_students"),
          value: stats.atRisk,
          subtitle: t("kpis.need_attention"),
        },
        {
          label: t("kpis.avg_attendance"),
          value: `${stats.avgAttendance}%`,
          subtitle:
            stats.avgAttendance >= 90 ? t("kpis.good") : t("kpis.below_target"),
        },
        {
          label: t("kpis.avg_grade"),
          value: `${stats.avgGrade}%`,
          subtitle: t("kpis.overall_performance"),
        },
        {
          label: t("kpis.withdrawn"),
          value: stats.withdrawn,
          subtitle: t("kpis.this_year"),
        },
      ],
      riskSummary: [
        { label: t("risk.attendance_risk"), value: riskDistribution.attendance },
        { label: t("risk.low_grades"), value: riskDistribution.grades },
        { label: t("risk.behavior_issues"), value: riskDistribution.behavior },
      ],
      studentsByStatus: statusData,
      studentsByGrade: gradeData,
      retentionCohort:
        retentionData.length > 0
          ? retentionData
          : [
              { year: "2023-24", retained: 95, left: 5 },
              { year: "2024-25", retained: 92, left: 8 },
              { year: "2025-26", retained: 94, left: 6 },
            ],
      passFail: {
        pass: passCount,
        fail: failCount,
        total: passFailTotal,
        passRate:
          passFailTotal > 0
            ? `${((passCount / passFailTotal) * 100).toFixed(1)}%`
            : "0%",
      },
      absenceHeatmap: [
        { week: t("weeks.week_1"), sat: 2, sun: 3, mon: 1, tue: 4, wed: 2, thu: 3 },
        { week: t("weeks.week_2"), sat: 3, sun: 2, mon: 5, tue: 3, wed: 4, thu: 2 },
        { week: t("weeks.week_3"), sat: 1, sun: 4, mon: 2, tue: 2, wed: 3, thu: 4 },
        { week: t("weeks.week_4"), sat: 4, sun: 3, mon: 3, tue: 5, wed: 6, thu: 3 },
        { week: t("weeks.week_5"), sat: 2, sun: 1, mon: 4, tue: 3, wed: 2, thu: 5 },
        { week: t("weeks.week_6"), sat: 3, sun: 5, mon: 2, tue: 4, wed: 3, thu: 2 },
      ],
      passFailLabels: {
        pass: tPassFail("pass"),
        fail: tPassFail("fail"),
        totalStudents: tPassFail("total_students"),
        passRate: tPassFail("pass_rate"),
      },
    };
  }, [riskDistribution, stats, students, t, tGrades, tPassFail]);

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data:
        format === "json"
          ? createStudentsGuardiansDashboardAnalyticsJson(dashboardAnalytics)
          : formatStudentsGuardiansDashboardAnalyticsForExport(
              dashboardAnalytics,
              exportLocale,
            ),
      format,
      filenameBase: "students-guardians-overview",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("kpis.total_students")}
          value={stats.total}
          subtitle={t("kpis.active_count", { count: stats.active })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("kpis.active_students")}
          value={stats.active}
          subtitle={t("kpis.currently_enrolled")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpis.at_risk_students")}
          value={stats.atRisk}
          subtitle={t("kpis.need_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("kpis.avg_attendance")}
          value={`${stats.avgAttendance}%`}
          subtitle={
            stats.avgAttendance >= 90 ? t("kpis.good") : t("kpis.below_target")
          }
          icon={TrendingUp}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartColor="#8b5cf6"
        />
        <KPICardV2
          title={t("kpis.avg_grade")}
          value={`${stats.avgGrade}%`}
          subtitle={t("kpis.overall_performance")}
          icon={GraduationCap}
          iconColor="#6366f1"
          iconBgColor="#e0e7ff"
          chartColor="#6366f1"
        />
        <KPICardV2
          title={t("kpis.withdrawn")}
          value={stats.withdrawn}
          subtitle={t("kpis.this_year")}
          icon={UserX}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          chartColor="#6b7280"
        />
      </div>

      {/* Risk Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("risk.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">
                  {t("risk.attendance_risk")}
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {riskDistribution.attendance}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  {t("risk.low_grades")}
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {riskDistribution.grades}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  {t("risk.behavior_issues")}
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {riskDistribution.behavior}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section 1: Status and Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsByStatusChart />
        <StudentsByGradeChart />
      </div>

      {/* Charts Section 2: Pass/Fail and Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PassFailRatioChart />
        <RetentionCohortChart />
      </div>

      {/* Charts Section 3: Attendance */}
      <div className="grid grid-cols-1 gap-6">
        <AbsenceHeatmap />
      </div>

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("subtitle")}
      />
    </div>
  );
}
