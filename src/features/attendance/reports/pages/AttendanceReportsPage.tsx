"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import {
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceStack,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
import ReportsLoadingState from "../components/ReportsLoadingState";
import ReportsEmptyState from "../components/ReportsEmptyState";
import ReportsFiltersBar from "../components/ReportsFiltersBar";
import ReportsOverviewCards from "../components/ReportsOverviewCards";
import AttendanceTrendChart from "../components/AttendanceTrendChart";
import AbsenceAnalysisSection from "../components/AbsenceAnalysisSection";
import LateEarlyAnalysisSection from "../components/LateEarlyAnalysisSection";
import ExcusesAnalysisSection from "../components/ExcusesAnalysisSection";
import DerivedDailyAbsencesSection from "../components/DerivedDailyAbsencesSection";
import StudentRiskTable from "../components/StudentRiskTable";
import SectionPerformanceTable from "../components/SectionPerformanceTable";
import ReportsDrilldownDrawer, {
  type ReportsDrilldownState,
} from "../components/ReportsDrilldownDrawer";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import { isDateRangeValidationError, isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";
import {
  fetchAttendanceReportSummary,
  fetchDerivedDailyAbsences,
  type DerivedDailyAbsenceReportRow,
} from "../services/attendanceReportsService";
import { exportAttendanceReports } from "../utils/exportReports";
import { buildAttendanceReportsExportPayload } from "../utils/exportReports";
import {
  applyReportsStateToSearchParams,
  areReportsFiltersEqual,
  parseReportsExportDatasetFromSearchParams,
  parseReportsFiltersFromSearchParams,
} from "../utils/reportQueryState";
import type {
  AttendanceReportsData,
  AttendanceReportsFilters,
  ReportsAbsenceStudentRow,
  ReportsExportDataset,
  ReportsKpiCard,
  ReportsLateEarlyStudentRow,
  ReportsPerformanceRow,
  ReportsScopeBreakdownRow,
  ReportsTrendPoint,
} from "../types";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import { usePrint } from "@/components/print";
import AttendanceReportPrintDocument from "../components/AttendanceReportPrintDocument";

const DEFAULT_FILTERS: AttendanceReportsFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
  attendanceStatus: "ALL",
  excuseStatus: "ALL",
  incidentType: "ALL",
};

export default function AttendanceReportsPage() {
  const t = useTranslations("attendance.reportsPage");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const termContext = useAttendanceYearTermLayoutContext();

  const [structure, setStructure] = useState<StructureTree | null>(null);
  const [filters, setFilters] =
    useState<AttendanceReportsFilters>(DEFAULT_FILTERS);
  const [report, setReport] = useState<AttendanceReportsData | null>(null);
  const [derivedDailyAbsences, setDerivedDailyAbsences] = useState<
    DerivedDailyAbsenceReportRow[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [drilldown, setDrilldown] = useState<ReportsDrilldownState | null>(
    null,
  );
  const [exportDataset, setExportDataset] =
    useState<ReportsExportDataset>("summary");
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasHydratedFiltersFromUrl, setHasHydratedFiltersFromUrl] =
    useState(false);
  const lastSyncedQuery = useRef<string | null>(null);
  const printContentRef = useRef<HTMLDivElement>(null);

  const term = useMemo(
    () =>
      termContext.terms.find((item) => item.id === termContext.termId) || null,
    [termContext.termId, termContext.terms],
  );

  useEffect(() => {
    if (!term) return;

    void Promise.resolve().then(() => setHasHydratedFiltersFromUrl(false));

    const fallbackFilters: AttendanceReportsFilters = {
      ...DEFAULT_FILTERS,
      dateFrom: term.startDate,
      dateTo: term.endDate,
    };

    const nextFilters = parseReportsFiltersFromSearchParams(
      searchParams,
      fallbackFilters,
    );
    const nextExportDataset = parseReportsExportDatasetFromSearchParams(
      searchParams,
      "summary",
    );

    void Promise.resolve().then(() => {
      setFilters((prev) =>
        areReportsFiltersEqual(prev, nextFilters) ? prev : nextFilters,
      );
    });
    void Promise.resolve().then(() => {
      setExportDataset((prev) =>
        prev === nextExportDataset ? prev : nextExportDataset,
      );
    });
  }, [searchParams, term]);

  useEffect(() => {
    if (!term) return;

    const fallbackFilters: AttendanceReportsFilters = {
      ...DEFAULT_FILTERS,
      dateFrom: term.startDate,
      dateTo: term.endDate,
    };
    const urlFilters = parseReportsFiltersFromSearchParams(
      searchParams,
      fallbackFilters,
    );
    const urlExportDataset = parseReportsExportDatasetFromSearchParams(
      searchParams,
      "summary",
    );

    if (
      areReportsFiltersEqual(filters, urlFilters) &&
      exportDataset === urlExportDataset
    ) {
      void Promise.resolve().then(() => setHasHydratedFiltersFromUrl(true));
    }
  }, [exportDataset, filters, searchParams, term]);

  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(
          termContext.yearId!,
          termContext.termId!,
        );
        setStructure(tree);
      } catch (error) {
        console.error("Failed to load reports structure", error);
      }
    };

    loadStructure();
  }, [termContext.termId, termContext.yearId]);

  const loadReport = useCallback(async () => {
    if (
      !termContext.yearId ||
      !termContext.termId ||
      !filters.dateFrom ||
      !filters.dateTo
    )
      return;

    if (isInvalidDateRange(filters.dateFrom, filters.dateTo)) {
      setReport(null);
      setDerivedDailyAbsences([]);
      setLoading(false);
      return;
    }

    if (!isScopeSelectionComplete(filters.scopeType, filters.scopeIds)) {
      setReport(null);
      setDerivedDailyAbsences([]);
      return;
    }

    setLoading(true);
    try {
      const reportParams = {
        ...filters,
        yearId: termContext.yearId,
        termId: termContext.termId,
      };
      const [data, derivedRows] = await Promise.all([
        fetchAttendanceReportSummary(reportParams),
        fetchDerivedDailyAbsences(reportParams),
      ]);
      setReport(data);
      setDerivedDailyAbsences(
        filters.studentId
          ? derivedRows.filter((row) => row.studentId === filters.studentId)
          : derivedRows,
      );
    } catch (error) {
      console.error("Failed to load attendance reports", error);
      showError(
        isDateRangeValidationError(error)
          ? tCommon("invalidDateRange")
          : tCommon("error_loading"),
      );
    } finally {
      setLoading(false);
    }
  }, [filters, showError, tCommon, termContext.termId, termContext.yearId]);

  useEffect(() => {
    void Promise.resolve().then(loadReport);
  }, [loadReport]);

  useEffect(() => {
    if (
      !hasHydratedFiltersFromUrl ||
      !termContext.yearId ||
      !termContext.termId
    )
      return;

    const params = new URLSearchParams(searchParams.toString());
    applyReportsStateToSearchParams(params, {
      filters,
      exportDataset,
    });

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery || nextQuery === lastSyncedQuery.current)
      return;

    lastSyncedQuery.current = nextQuery;
    router.replace(nextQuery ? `?${nextQuery}` : pathname, { scroll: false });
  }, [
    exportDataset,
    filters,
    hasHydratedFiltersFromUrl,
    pathname,
    router,
    searchParams,
    termContext.termId,
    termContext.yearId,
  ]);

  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
    });
    setExportDataset("summary");
  };

  const getAttendanceStatusLabel = useCallback(
    (
      status:
        "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "EARLY_LEAVE" | "UNMARKED",
    ) => {
      if (status === "PRESENT") return t("filters.statuses.present");
      if (status === "ABSENT") return t("filters.statuses.absent");
      if (status === "EXCUSED") return t("filters.statuses.excused");
      if (status === "LATE") return t("filters.statuses.late");
      if (status === "UNMARKED") return status;
      return t("filters.statuses.earlyLeave");
    },
    [t],
  );

  const getExcuseStatusLabel = useCallback(
    (status: "PENDING" | "APPROVED" | "REJECTED") => {
      if (status === "PENDING") return t("filters.excuseStatuses.pending");
      if (status === "APPROVED") return t("filters.excuseStatuses.approved");
      return t("filters.excuseStatuses.rejected");
    },
    [t],
  );

  const getExcuseTypeLabel = useCallback(
    (type: "ABSENCE" | "LATE" | "EARLY_LEAVE") => {
      if (type === "ABSENCE") return t("excuses.types.ABSENCE");
      if (type === "LATE") return t("excuses.types.LATE");
      return t("excuses.types.EARLY_LEAVE");
    },
    [t],
  );

  const getPerformanceLevelLabel = useCallback(
    (level: "stage" | "grade" | "section" | "classroom") =>
      t(`performance.levels.${level}`),
    [t],
  );

  const buildAttendanceRows = useCallback(
    (
      rows: AttendanceReportsData["attendanceRows"],
      route?: "absences" | "lateEarly" | "excuses",
    ): ReportsDrilldownState => ({
      title: t("drilldown.attendanceRows"),
      columns: [
        { key: "date", label: t("drilldown.columns.date") },
        { key: "student", label: t("drilldown.columns.student") },
        { key: "scope", label: t("drilldown.columns.scope") },
        { key: "status", label: t("drilldown.columns.status") },
        { key: "period", label: t("drilldown.columns.period") },
      ],
      rows: rows.map((row) => ({
        date: row.date,
        student: locale === "ar" ? row.studentNameAr : row.studentNameEn,
        scope:
          locale === "ar"
            ? row.classroomNameAr ||
              row.sectionNameAr ||
              row.gradeNameAr ||
              row.stageNameAr ||
              "-"
            : row.classroomNameEn ||
              row.sectionNameEn ||
              row.gradeNameEn ||
              row.stageNameEn ||
              "-",
        status: getAttendanceStatusLabel(row.status),
        period:
          locale === "ar"
            ? row.periodNameAr || row.periodIndex || "-"
            : row.periodNameEn || row.periodIndex || "-",
      })),
      route,
    }),
    [getAttendanceStatusLabel, locale, t],
  );

  const openKpiDrilldown = (key: ReportsKpiCard["key"]) => {
    if (!report) return;

    if (key === "attendanceRate") {
      setDrilldown(buildAttendanceRows(report.attendanceRows));
      return;
    }
    if (key === "presentCount") {
      setDrilldown(
        buildAttendanceRows(
          report.attendanceRows.filter((row) => row.status === "PRESENT"),
        ),
      );
      return;
    }
    if (key === "absentCount") {
      setDrilldown(
        buildAttendanceRows(
          report.attendanceRows.filter((row) => row.status === "ABSENT"),
          "absences",
        ),
      );
      return;
    }
    if (key === "excusedCount") {
      setDrilldown(
        buildAttendanceRows(
          report.attendanceRows.filter((row) => row.status === "EXCUSED"),
          "excuses",
        ),
      );
      return;
    }
    if (key === "lateCount") {
      setDrilldown(
        buildAttendanceRows(
          report.attendanceRows.filter((row) => row.status === "LATE"),
          "lateEarly",
        ),
      );
      return;
    }
    if (key === "earlyLeaveCount") {
      setDrilldown(
        buildAttendanceRows(
          report.attendanceRows.filter((row) => row.status === "EARLY_LEAVE"),
          "lateEarly",
        ),
      );
      return;
    }
    if (key === "riskStudents") {
      setDrilldown({
        title: t("drilldown.riskStudents"),
        columns: [
          { key: "student", label: t("drilldown.columns.student") },
          {
            key: "attendanceRate",
            label: t("drilldown.columns.attendanceRate"),
          },
          { key: "flags", label: t("drilldown.columns.flags") },
        ],
        rows: report.riskStudents.map((row) => ({
          student: locale === "ar" ? row.studentNameAr : row.studentNameEn,
          attendanceRate: `${row.attendanceRate.toFixed(1)}%`,
          flags: row.flags
            .map((flag) => t(`risk.flags.${flag.code}`, { count: flag.count }))
            .join(" •"),
        })),
      });
      return;
    }

    setDrilldown({
      title: t("drilldown.groupsBelowThreshold"),
      columns: [
        { key: "name", label: t("drilldown.columns.scope") },
        { key: "level", label: t("drilldown.columns.level") },
        { key: "attendanceRate", label: t("drilldown.columns.attendanceRate") },
      ],
      rows: [...report.performance.section, ...report.performance.classroom]
        .filter((row) => row.attendanceRate < 85)
        .map((row) => ({
          name: locale === "ar" ? row.labelAr : row.labelEn,
          level: getPerformanceLevelLabel(row.level),
          attendanceRate: `${row.attendanceRate.toFixed(1)}%`,
        })),
    });
  };

  const openRoute = (route: "absences" | "lateEarly" | "excuses") => {
    const params = new URLSearchParams(searchParams.toString());
    applyReportsStateToSearchParams(params, {
      filters,
      exportDataset,
    });
    const query = params.toString();
    const targetPath = pathname.replace(
      "/reports",
      `/${route === "lateEarly" ? "late-early" : route}`,
    );
    router.push(`${targetPath}${query ? `?${query}` : ""}`);
  };

  const handleLegacyExport = (format: "csv" | "excel") => {
    if (!report || !structure || !term) return;

    exportAttendanceReports({
      dataset: exportDataset,
      report,
      locale,
      format,
      yearName: selectedYearName,
      termName: selectedTermName || "",
      scopeName: getAttendanceScopeLabel({
        scopeType: filters.scopeType,
        scopeIds: filters.scopeIds,
        stages: structure.stages,
        grades: structure.grades,
        sections: structure.sections,
        classrooms: structure.classrooms,
        locale,
        schoolLabel: t("scopeSchool"),
      }),
      dateRange: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
    });

    showSuccess(t("export.success"));
  };

  const exportDatasetOptions = useMemo(
    () => [
      { value: "summary", label: t("export.summary") },
      { value: "detailed", label: t("export.detailed") },
      { value: "risk", label: t("export.risk") },
      { value: "performance", label: t("export.performance") },
    ],
    [t],
  );

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.yearId ||
    "";

  const selectedTermName = term
    ? locale === "ar"
      ? term.nameAr || term.name
      : term.nameEn || term.name
    : "";

  const selectedScopeName = useMemo(
    () =>
      getAttendanceScopeLabel({
        scopeType: filters.scopeType,
        scopeIds: filters.scopeIds,
        stages: structure?.stages || [],
        grades: structure?.grades || [],
        sections: structure?.sections || [],
        classrooms: structure?.classrooms || [],
        locale,
        schoolLabel: t("scopeSchool"),
      }),
    [filters.scopeIds, filters.scopeType, locale, structure, t],
  );

  const exportPayload = useMemo(() => {
    if (!report || !structure || !term) return null;
    return buildAttendanceReportsExportPayload({
      dataset: exportDataset,
      report,
      locale,
      yearName: selectedYearName,
      termName: selectedTermName,
      scopeName: selectedScopeName,
      dateRange: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
    });
  }, [
    exportDataset,
    filters.dateFrom,
    filters.dateTo,
    locale,
    report,
    selectedTermName,
    selectedYearName,
    selectedScopeName,
    structure,
    term,
  ]);

  const printReport = usePrint({
    contentRef: printContentRef,
    title: exportPayload?.title || (locale === "ar" ? "تقرير الحضور" : "Attendance report"),
  });

  const handleExport = async (format: AttendanceExportFormat) => {
    if (!report || !structure || !term || !exportPayload) return;

    if (format === "excel") {
      handleLegacyExport("excel");
      return;
    }

    const columns: ExportColumn[] = Object.keys(
      exportPayload.data[0] || {},
    ).map((key) => ({
      key,
      label: key,
    }));

    const jsonDataByDataset = {
      summary: {
        title: "Attendance Reports Summary",
        metadata: {
          yearName:
            termContext.academicYears.find(
              (item) => item.id === termContext.yearId,
            )?.nameEn ||
            termContext.yearId ||
            "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages: structure.stages,
            grades: structure.grades,
            sections: structure.sections,
            classrooms: structure.classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
          viewName: "Reports",
          datasetName: exportDataset,
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        overview: report.overview,
        trend: report.trend,
      },
      detailed: {
        title: "Attendance Reports Detailed",
        metadata: {
          yearName:
            termContext.academicYears.find(
              (item) => item.id === termContext.yearId,
            )?.nameEn ||
            termContext.yearId ||
            "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages: structure.stages,
            grades: structure.grades,
            sections: structure.sections,
            classrooms: structure.classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
          viewName: "Reports",
          datasetName: exportDataset,
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        attendanceRows: report.attendanceRows,
      },
      risk: {
        title: "Attendance Reports Risk",
        metadata: {
          yearName:
            termContext.academicYears.find(
              (item) => item.id === termContext.yearId,
            )?.nameEn ||
            termContext.yearId ||
            "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages: structure.stages,
            grades: structure.grades,
            sections: structure.sections,
            classrooms: structure.classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
          viewName: "Reports",
          datasetName: exportDataset,
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        riskStudents: report.riskStudents,
      },
      performance: {
        title: "Attendance Reports Performance",
        metadata: {
          yearName:
            termContext.academicYears.find(
              (item) => item.id === termContext.yearId,
            )?.nameEn ||
            termContext.yearId ||
            "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages: structure.stages,
            grades: structure.grades,
            sections: structure.sections,
            classrooms: structure.classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
          viewName: "Reports",
          datasetName: exportDataset,
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        performance: report.performance,
      },
    } satisfies Record<ReportsExportDataset, Record<string, unknown>>;

    exportAttendanceData({
      title: exportPayload.title,
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        scopeTypeName: filters.scopeType,
        scopeName: getAttendanceScopeLabel({
          scopeType: filters.scopeType,
          scopeIds: filters.scopeIds,
          stages: structure.stages,
          grades: structure.grades,
          sections: structure.sections,
          classrooms: structure.classrooms,
          locale,
          schoolLabel: t("scopeSchool"),
        }),
        dateLabel: `${filters.dateFrom || "-"} - ${filters.dateTo || "-"}`,
        viewName: locale === "ar" ? "التقارير" : "Reports",
        datasetName: t(`export.${exportDataset}`),
        exportDate: formatAttendanceExportDate(locale),
      },
      filename: exportPayload.filename,
      format,
      columns,
      rows: exportPayload.data,
      jsonData: jsonDataByDataset[exportDataset],
      locale,
      emptyMessage: t("emptyStates.noData.description"),
    });

    showSuccess(t("export.success"));
  };

  const openStudentRiskDrilldown = (
    row: AttendanceReportsData["riskStudents"][number],
  ) => {
    if (!report) return;
    setDrilldown(
      buildAttendanceRows(
        report.attendanceRows.filter(
          (item) => item.studentId === row.studentId,
        ),
      ),
    );
  };

  const openPerformanceDrilldown = (row: ReportsPerformanceRow) => {
    if (!report) return;
    const matchingRows = report.attendanceRows.filter((item) => {
      if (row.level === "stage") return item.stageId === row.id;
      if (row.level === "grade") return item.gradeId === row.id;
      if (row.level === "section") return item.sectionId === row.id;
      return item.classroomId === row.id;
    });
    setDrilldown(buildAttendanceRows(matchingRows));
  };

  if (termContext.isLoading) {
    return <ReportsLoadingState />;
  }

  if (!termContext.yearId || !termContext.termId) {
    return (
      <AttendanceWorkspaceShell>
        <ReportsEmptyState
          title={t("emptyStates.noYearTerm.title")}
          description={t("emptyStates.noYearTerm.description")}
        />
      </AttendanceWorkspaceShell>
    );
  }

  return (
    <>
      <AttendanceWorkspaceShell scrollable>
        <AttendanceWorkspaceHeader>
          {structure ? (
            <AttendanceScopeHeader
              isReadOnly={termContext.isReadOnly}
              scopeType={filters.scopeType}
              scopeIds={filters.scopeIds}
              stages={structure.stages}
              grades={structure.grades}
              sections={structure.sections}
              classrooms={structure.classrooms}
            />
          ) : null}

          {!isMobile ? (
            <AttendanceFiltersPanel>
              <ReportsFiltersBar
                filters={filters}
                stages={structure?.stages || []}
                grades={structure?.grades || []}
                sections={structure?.sections || []}
                classrooms={structure?.classrooms || []}
                students={report?.studentOptions || []}
                onFiltersChange={(patch) =>
                  setFilters((prev) => ({ ...prev, ...patch }))
                }
                onReset={resetFilters}
                onOpenExport={() => setShowExportModal(true)}
                onPrint={printReport}
                exportDisabled={isInvalidDateRange(filters.dateFrom, filters.dateTo) || !exportPayload?.data.length}
              />
            </AttendanceFiltersPanel>
          ) : (
            <AttendanceWorkspaceMobileActions>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setFiltersDrawerOpen(true)}
              >
                {t("filters.open")}
              </Button>
            </AttendanceWorkspaceMobileActions>
          )}
        </AttendanceWorkspaceHeader>

        <AttendanceWorkspaceStack>
          {loading ? (
            <ReportsLoadingState />
          ) : report ? (
            <>
              <ReportsOverviewCards
                cards={report.overview.cards}
                trendPoints={report.trend.points}
                onCardClick={openKpiDrilldown}
              />
              <AttendanceTrendChart
                points={report.trend.points}
                onPointClick={(point) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter(
                        (row) =>
                          row.date >= point.dateFrom &&
                          row.date <= point.dateTo,
                      ),
                    ),
                  )
                }
              />
              <AbsenceAnalysisSection
                analysis={report.absenceAnalysis}
                onDateClick={(point) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter(
                        (row) =>
                          row.date >= point.dateFrom &&
                          row.date <= point.dateTo,
                      ),
                      "absences",
                    ),
                  )
                }
                onStudentClick={(student: ReportsAbsenceStudentRow) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter(
                        (row) => row.studentId === student.studentId,
                      ),
                      "absences",
                    ),
                  )
                }
                onScopeClick={(scope: ReportsScopeBreakdownRow, level) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter((row) => {
                        if (level === "grade") return row.gradeId === scope.id;
                        if (level === "section")
                          return row.sectionId === scope.id;
                        return row.classroomId === scope.id;
                      }),
                      "absences",
                    ),
                  )
                }
              />
              <DerivedDailyAbsencesSection
                rows={derivedDailyAbsences}
                attendanceRows={report.attendanceRows}
              />
              <LateEarlyAnalysisSection
                analysis={report.lateEarlyAnalysis}
                onTrendClick={(point: ReportsTrendPoint) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter(
                        (row) =>
                          row.date >= point.dateFrom &&
                          row.date <= point.dateTo &&
                          (row.status === "LATE" ||
                            row.status === "EARLY_LEAVE"),
                      ),
                      "lateEarly",
                    ),
                  )
                }
                onStudentClick={(student: ReportsLateEarlyStudentRow, type) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter(
                        (row) =>
                          row.studentId === student.studentId &&
                          row.status === type,
                      ),
                      "lateEarly",
                    ),
                  )
                }
                onScopeClick={(scope, level) =>
                  setDrilldown(
                    buildAttendanceRows(
                      report.attendanceRows.filter((row) => {
                        if (level === "grade") return row.gradeId === scope.id;
                        if (level === "section")
                          return row.sectionId === scope.id;
                        return row.classroomId === scope.id;
                      }),
                      "lateEarly",
                    ),
                  )
                }
              />
              <ExcusesAnalysisSection
                analysis={report.excusesAnalysis}
                onStudentClick={(studentId) =>
                  setDrilldown({
                    title: t("drilldown.excuseRequests"),
                    columns: [
                      { key: "dateFrom", label: t("drilldown.columns.date") },
                      { key: "student", label: t("drilldown.columns.student") },
                      { key: "type", label: t("drilldown.columns.type") },
                      { key: "status", label: t("drilldown.columns.status") },
                    ],
                    rows: report.excuseRequests
                      .filter((request) => request.studentId === studentId)
                      .map((request) => ({
                        dateFrom: `${request.dateFrom} - ${request.dateTo}`,
                        student:
                          locale === "ar"
                            ? request.studentNameAr
                            : request.studentNameEn,
                        type: getExcuseTypeLabel(request.type),
                        status: getExcuseStatusLabel(request.status),
                      })),
                    route: "excuses",
                  })
                }
                onScopeClick={(scope) =>
                  setDrilldown({
                    title: t("drilldown.excuseRequests"),
                    columns: [
                      { key: "dateFrom", label: t("drilldown.columns.date") },
                      { key: "student", label: t("drilldown.columns.student") },
                      { key: "type", label: t("drilldown.columns.type") },
                      { key: "status", label: t("drilldown.columns.status") },
                    ],
                    rows: report.excuseRequests
                      .filter(
                        (request) =>
                          `${request.scopeType}-${JSON.stringify(request.scopeIds || {})}` ===
                          scope.key,
                      )
                      .map((request) => ({
                        dateFrom: `${request.dateFrom} - ${request.dateTo}`,
                        student:
                          locale === "ar"
                            ? request.studentNameAr
                            : request.studentNameEn,
                        type: getExcuseTypeLabel(request.type),
                        status: getExcuseStatusLabel(request.status),
                      })),
                    route: "excuses",
                  })
                }
              />
              <StudentRiskTable
                rows={report.riskStudents}
                onStudentClick={openStudentRiskDrilldown}
              />
              <SectionPerformanceTable
                rowsByLevel={report.performance}
                onRowClick={openPerformanceDrilldown}
              />
            </>
          ) : (
            <ReportsEmptyState
              title={t("emptyStates.noData.title")}
              description={t("emptyStates.noData.description")}
            />
          )}
        </AttendanceWorkspaceStack>
      </AttendanceWorkspaceShell>

      <AttendanceBottomDrawer
        isOpen={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        heightClassName="h-[85vh]"
      >
        <div className="p-4">
          <ReportsFiltersBar
            filters={filters}
            stages={structure?.stages || []}
            grades={structure?.grades || []}
            sections={structure?.sections || []}
            classrooms={structure?.classrooms || []}
            students={report?.studentOptions || []}
            onFiltersChange={(patch) =>
              setFilters((prev) => ({ ...prev, ...patch }))
            }
            onReset={resetFilters}
            onOpenExport={() => setShowExportModal(true)}
            onPrint={printReport}
            exportDisabled={isInvalidDateRange(filters.dateFrom, filters.dateTo) || !exportPayload?.data.length}
          />
        </div>
      </AttendanceBottomDrawer>

      <ReportsDrilldownDrawer
        state={drilldown}
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        onOpenRoute={openRoute}
      />

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={exportPayload?.data.length || 0}
        emptyStateMessage={t("emptyStates.noData.description")}
        datasetOptions={exportDatasetOptions}
        selectedDataset={exportDataset}
        onDatasetChange={(value) =>
          setExportDataset(value as ReportsExportDataset)
        }
      />

      {exportPayload ? (
        <div className="print-source" aria-hidden="true">
          <div ref={printContentRef}>
            <AttendanceReportPrintDocument
              title={exportPayload.title}
              locale={locale}
              subtitle={t(`export.${exportDataset}`)}
              academicYear={selectedYearName}
              term={selectedTermName}
              scope={selectedScopeName}
              dateRange={`${filters.dateFrom || "-"} – ${filters.dateTo || "-"}`}
              rows={exportPayload.data}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
