"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Loader2,
  School,
  Users,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchTeacherLoads } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { teacherAllocationUiError } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";
import type { TeacherLoadViewModel } from "@/features/academics/teacher-allocation/services/teacherAllocationMappers";
import TeacherAllocationTechnicalDetails from "./TeacherAllocationTechnicalDetails";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";

interface TeacherLoadViewProps {
  termId: string;
  teachers: Teacher[];
}

type TeacherLoadAssignment = TeacherLoadViewModel["assignments"][number];

function localizedTeacherName(teacher: Teacher, locale: string) {
  return locale === "ar"
    ? teacher.nameAr || teacher.nameEn || teacher.id
    : teacher.nameEn || teacher.nameAr || teacher.id;
}

function localizedPairName(
  record: { nameAr: string; nameEn: string },
  locale: string,
) {
  return locale === "ar"
    ? record.nameAr || record.nameEn
    : record.nameEn || record.nameAr;
}

function assignmentGradeName(
  assignment: TeacherLoadAssignment,
  locale: string,
) {
  return localizedPairName(
    { nameAr: assignment.gradeNameAr, nameEn: assignment.gradeNameEn },
    locale,
  );
}

function assignmentClassroomName(
  assignment: TeacherLoadAssignment,
  locale: string,
) {
  return localizedPairName(
    { nameAr: assignment.classroomNameAr, nameEn: assignment.classroomNameEn },
    locale,
  );
}

function assignmentSubjectName(
  assignment: TeacherLoadAssignment,
  locale: string,
) {
  return localizedPairName(
    { nameAr: assignment.subjectNameAr, nameEn: assignment.subjectNameEn },
    locale,
  );
}

function teacherInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TeacherLoadView({
  termId,
  teachers,
}: TeacherLoadViewProps) {
  const t = useTranslations("academics.teacherAllocation.load");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTeacherUserId = searchParams.get("loadTeacher") || "";

  const [teacherLoads, setTeacherLoads] = useState<TeacherLoadViewModel[]>([]);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorTraceId, setLoadErrorTraceId] = useState<
    string | undefined
  >();
  const [loadErrorDetails, setLoadErrorDetails] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const syncTeacherFilter = useCallback(
    (teacherUserId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (teacherUserId) {
        params.set("loadTeacher", teacherUserId);
      } else {
        params.delete("loadTeacher");
      }
      const nextQuery = params.toString();
      router.replace(nextQuery ? `?${nextQuery}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let isCurrentRequest = true;

    queueMicrotask(() => {
      if (!isCurrentRequest) {
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      setLoadErrorTraceId(undefined);
      setLoadErrorDetails([]);
    });

    fetchTeacherLoads({
      termId,
      teacherUserId: selectedTeacherUserId || undefined,
    })
      .then((loads) => {
        if (isCurrentRequest) {
          setTeacherLoads(loads);
          setExpandedTeacherId(null);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load teacher loads:", error);
        if (isCurrentRequest) {
          const uiError = teacherAllocationUiError(
            error,
            "Failed to load teacher loads.",
          );
          setTeacherLoads([]);
          setLoadError(uiError.message);
          setLoadErrorTraceId(uiError.traceId);
          setLoadErrorDetails(uiError.details);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedTeacherUserId, termId]);

  const kpis = useMemo(() => {
    const totalWeeklyHours = teacherLoads.reduce(
      (total, load) => total + load.totalWeeklyPeriods,
      0,
    );
    const totalWarnings = teacherLoads.reduce(
      (total, load) => total + load.warningsCount,
      0,
    );

    return {
      teachersCount: teacherLoads.length,
      totalWeeklyHours,
      allocationCount: teacherLoads.reduce(
        (total, load) => total + load.assignmentCount,
        0,
      ),
      totalWarnings,
    };
  }, [teacherLoads]);

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return teacherLoads.flatMap((load) => {
      if (load.assignments.length === 0) {
        return [
          {
            teacher: load.teacherName,
            allocationCount: load.assignmentCount,
            totalWeeklyHours: load.totalWeeklyPeriods,
            classroomsCount: load.classroomsCount,
            subjectsCount: load.subjectsCount,
            warning: load.warnings.map((warning) => warning.message).join("; "),
            grade: "",
            classroom: "",
            subject: "",
            weeklyHours: 0,
          },
        ];
      }

      return load.assignments.map((assignment) => ({
        teacher: load.teacherName,
        allocationCount: load.assignmentCount,
        totalWeeklyHours: load.totalWeeklyPeriods,
        classroomsCount: load.classroomsCount,
        subjectsCount: load.subjectsCount,
        warning: load.warnings.map((warning) => warning.message).join("; "),
        grade: assignmentGradeName(assignment, locale),
        classroom: assignmentClassroomName(assignment, locale),
        subject: assignmentSubjectName(assignment, locale),
        weeklyHours: assignment.weeklyHours,
      }));
    });
  }, [locale, teacherLoads]);

  const maxTeacherWeeklyHours = Math.max(
    1,
    ...teacherLoads.map((load) => load.totalWeeklyPeriods),
  );

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      termName: termId,
      exportDate: formatExportDate(locale),
    };
    const exportColumns: ExportColumn[] = [
      { key: "teacher", label: t("table.teacher") },
      { key: "allocationCount", label: t("metrics.allocationCount") },
      { key: "totalWeeklyHours", label: t("metrics.totalWeeklyHours") },
      { key: "classroomsCount", label: t("metrics.classroomsCount") },
      { key: "subjectsCount", label: t("metrics.subjectsCount") },
      { key: "grade", label: t("breakdown.grade") },
      { key: "classroom", label: t("breakdown.classroom") },
      { key: "subject", label: t("breakdown.subject") },
      { key: "weeklyHours", label: t("metrics.weeklyHours") },
      { key: "warning", label: t("metrics.warnings") },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("teacher-loads", termId),
      format,
      columns: exportColumns,
      rows: exportRows,
      locale,
      jsonData: {
        title: t("title"),
        metadata,
        rows: exportRows,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>{t("loadingTeacherLoads")}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-[1440px] space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LoadMetricCard
            label={t("kpi.teachers")}
            value={kpis.teachersCount}
            icon={<Users className="h-4 w-4" />}
            tone="blue"
          />
          <LoadMetricCard
            label={t("kpi.allocations")}
            value={kpis.allocationCount}
            icon={<BookOpen className="h-4 w-4" />}
            tone="emerald"
          />
          <LoadMetricCard
            label={t("kpi.weeklyHours")}
            value={kpis.totalWeeklyHours}
            icon={<Clock className="h-4 w-4" />}
            tone="violet"
          />
          <LoadMetricCard
            label={t("kpi.warnings")}
            value={kpis.totalWarnings}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={kpis.totalWarnings > 0 ? "amber" : "slate"}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                {t("title")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("teacherSummary.allocations", {
                  count: kpis.allocationCount,
                })}
                {" · "}
                {t("teacherSummary.weeklyHours", {
                  count: kpis.totalWeeklyHours,
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-80">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("filters.teacher")}
                </label>
                <select
                  value={selectedTeacherUserId}
                  onChange={(event) => syncTeacherFilter(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t("filters.allTeachers")}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {localizedTeacherName(teacher, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="secondary"
                onClick={() => setShowExportModal(true)}
                leftIcon={<Download className="h-4 w-4" />}
                disabled={exportRows.length === 0}
              >
                {tExport("button")}
              </Button>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{loadError}</div>
            <TeacherAllocationTechnicalDetails
              traceId={loadErrorTraceId}
              details={loadErrorDetails}
            />
          </div>
        )}

        {!loadError && teacherLoads.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
            {t("empty")}
          </div>
        )}

        <div className="space-y-3">
          {teacherLoads.map((load) => {
            const isExpanded = expandedTeacherId === load.teacherId;
            const loadPercent = Math.min(
              100,
              Math.round(
                (load.totalWeeklyPeriods / maxTeacherWeeklyHours) * 100,
              ),
            );
            return (
              <div
                key={load.teacherId}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedTeacherId(isExpanded ? null : load.teacherId)
                  }
                  className="w-full p-4 text-start transition-colors hover:bg-slate-50"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.2fr)_2fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {teacherInitials(load.teacherName)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-950">
                          {load.teacherName}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            {t("teacherSummary.allocations", {
                              count: load.assignmentCount,
                            })}
                          </span>
                          <span>
                            {t("teacherSummary.weeklyHours", {
                              count: load.totalWeeklyPeriods,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <InlineMetric
                        label={t("metrics.weeklyHours")}
                        value={load.totalWeeklyPeriods}
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                      <InlineMetric
                        label={t("metrics.allocationCount")}
                        value={load.assignmentCount}
                        icon={<BookOpen className="h-3.5 w-3.5" />}
                      />
                      <InlineMetric
                        label={t("metrics.classroomsCount")}
                        value={load.classroomsCount}
                        icon={<School className="h-3.5 w-3.5" />}
                      />
                      <InlineMetric
                        label={t("metrics.subjectsCount")}
                        value={load.subjectsCount}
                        icon={<Users className="h-3.5 w-3.5" />}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      {load.warningsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t("teacherSummary.warnings", {
                            count: load.warningsCount,
                          })}
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {t("filters.normal")}
                        </span>
                      )}
                      <span className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        load.warningsCount > 0 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                    <AssignmentList
                      assignments={load.assignments}
                      locale={locale}
                      labels={{
                        noAssignments: t("noAssignments"),
                        grade: t("breakdown.grade"),
                        classroom: t("breakdown.classroom"),
                        subject: t("breakdown.subject"),
                        weeklyHours: t("metrics.weeklyHours"),
                      }}
                    />
                    <WarningList warnings={load.warnings} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={exportRows.length}
      />
    </div>
  );
}

function AssignmentList({
  assignments,
  locale,
  labels,
}: {
  assignments: TeacherLoadAssignment[];
  locale: string;
  labels: {
    noAssignments: string;
    grade: string;
    classroom: string;
    subject: string;
    weeklyHours: string;
  };
}) {
  if (assignments.length === 0) {
    return <p className="text-sm text-gray-500">{labels.noAssignments}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <TableHeader label={labels.grade} />
            <TableHeader label={labels.classroom} />
            <TableHeader label={labels.subject} />
            <TableHeader label={labels.weeklyHours} align="center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {assignments.map((assignment) => (
            <tr key={assignment.allocationId}>
              <TableCell>{assignmentGradeName(assignment, locale)}</TableCell>
              <TableCell>
                {assignmentClassroomName(assignment, locale)}
              </TableCell>
              <TableCell>{assignmentSubjectName(assignment, locale)}</TableCell>
              <TableCell align="center">{assignment.weeklyHours}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarningList({
  warnings,
}: {
  warnings: TeacherLoadViewModel["warnings"];
}) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {warnings.map((warning) => (
        <div
          key={`${warning.code}-${warning.message}`}
          className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  );
}

function TableHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "center";
}) {
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <td
      className={`px-3 py-2 text-sm text-gray-900 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function LoadMetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "blue" | "emerald" | "violet" | "amber" | "slate";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">
            {value}
          </div>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InlineMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}
