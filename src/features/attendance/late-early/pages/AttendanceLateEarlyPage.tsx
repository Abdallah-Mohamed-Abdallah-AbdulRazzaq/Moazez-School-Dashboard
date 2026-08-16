"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceStack,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import { isDateRangeValidationError, isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchIncidents, updateIncidentMinutes } from "../services/attendanceLateEarlyService";
import { exportLateEarly } from "../utils/lateEarlyExport";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import type { Incident, LateEarlyFilters, LateEarlyKpis } from "../types";
import LateEarlyKpisBar from "../components/LateEarlyKpisBar";
import LateEarlyFiltersBar from "../components/LateEarlyFiltersBar";
import LateEarlyFiltersDrawer from "../components/LateEarlyFiltersDrawer";
import LateEarlyTable from "../components/LateEarlyTable";
import IncidentDetailsDrawer from "../components/IncidentDetailsDrawer";
import MinutesEditorModal from "../components/MinutesEditorModal";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import MainLoader from "@/components/ui/loaders/MainLoader";

function computeKpis(incidents: Incident[]): LateEarlyKpis {
  const late = incidents.filter((incident) => incident.type === "LATE");
  const early = incidents.filter((incident) => incident.type === "EARLY_LEAVE");

  const average = (values: number[]) => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  return {
    totalIncidents: incidents.length,
    totalLate: late.length,
    totalEarlyLeave: early.length,
    avgLateMinutes: average(late.map((incident) => incident.minutes)),
    avgEarlyLeaveMinutes: average(early.map((incident) => incident.minutes)),
    violationsCount: incidents.filter((incident) => incident.isViolation).length,
  };
}

export default function AttendanceLateEarlyPage() {
  const { hasPermission } = usePermissions();
  const t = useTranslations("attendance.lateEarly");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceYearTermLayoutContext();

  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<LateEarlyFilters>({
    scopeType: "SCHOOL",
    scopeIds: {},
    type: "ALL",
    onlyViolations: false,
    search: "",
    sessionStatus: "ALL",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [minutesEditorOpen, setMinutesEditorOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleFiltersChange = (patch: Partial<LateEarlyFilters>) => {
    if ("search" in patch) {
      setSearchInput(patch.search || "");
    }

    const nonSearchFilters = { ...patch };
    delete nonSearchFilters.search;
    if (Object.keys(nonSearchFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...nonSearchFilters }));
    }
  };

  const isReadOnly = termContext.isReadOnly;
  const isEntryReadOnly = isReadOnly || !hasPermission("attendance.entries.manage");
  const kpis = useMemo(() => computeKpis(incidents), [incidents]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setFilters({
      scopeType: "SCHOOL",
      scopeIds: {},
      type: "ALL",
      onlyViolations: false,
      search: "",
      sessionStatus: "ALL",
    });
  }, []);

  const reloadIncidents = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;

    if (isInvalidDateRange(filters.dateFrom, filters.dateTo)) {
      setIncidents([]);
      setSelectedIncident(null);
      setLoading(false);
      return;
    }

    if (!isScopeSelectionComplete(filters.scopeType, filters.scopeIds)) {
      setIncidents([]);
      return;
    }

    setLoading(true);
    try {
      const list = await fetchIncidents({ yearId: termContext.yearId, termId: termContext.termId, ...filters });
      setIncidents(list);
      
      // Update selected incident if it exists in the new list
      setSelectedIncident((prev) => {
        if (!prev) return null;
        return list.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      console.error("Failed to load incidents", error);
      showError(
        isDateRangeValidationError(error)
          ? tCommon("invalidDateRange")
          : tCommon("error_loading"),
      );
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, filters, showError, tCommon]);

  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      const structure = await fetchStructureTree(
        termContext.yearId!,
        termContext.termId!,
      );

      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);
      setClassrooms(structure.classrooms);
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  useEffect(() => {
    void Promise.resolve().then(reloadIncidents);
  }, [reloadIncidents]);

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

  const handleLegacyExport = (format: "csv" | "excel") => {
    if (!term) return;

    exportLateEarly(incidents, locale, format, {
      yearName: selectedYearName,
      termName: selectedTermName || "",
      scopeName: getAttendanceScopeLabel({
        scopeType: filters.scopeType,
        scopeIds: filters.scopeIds,
        stages,
        grades,
        sections,
        classrooms,
        locale,
        schoolLabel: t("scopeSchool"),
      }),
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleExport = async (format: AttendanceExportFormat) => {
    if (!term) return;

    const scopeName = getAttendanceScopeLabel({
      scopeType: filters.scopeType,
      scopeIds: filters.scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
      schoolLabel: t("scopeSchool"),
    });

    if (format === "excel") {
      handleLegacyExport("excel");
      return;
    }

    const columns: ExportColumn[] = [
      { key: "date", label: locale === "ar" ? "التاريخ" : "Date" },
      { key: "period", label: locale === "ar" ? "الحصة" : "Period" },
      { key: "studentNumber", label: locale === "ar" ? "رقم الطالب" : "Student Number" },
      { key: "studentName", label: locale === "ar" ? "الطالب" : "Student" },
      { key: "studentNameEn", label: locale === "ar" ? "الطالب (بالإنجليزية)" : "Student (English)" },
      { key: "studentNameAr", label: locale === "ar" ? "الطالب (بالعربية)" : "Student (Arabic)" },
      { key: "grade", label: locale === "ar" ? "الصف" : "Grade" },
      { key: "section", label: locale === "ar" ? "الشعبة" : "Section" },
      { key: "classroom", label: locale === "ar" ? "الفصل" : "Classroom" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "minutes", label: locale === "ar" ? "الدقائق" : "Minutes" },
      { key: "threshold", label: locale === "ar" ? "الحد" : "Threshold" },
      { key: "violation", label: locale === "ar" ? "مخالفة" : "Violation" },
      { key: "sessionStatus", label: locale === "ar" ? "حالة الجلسة" : "Session Status" },
    ];

    const rowsForExport = incidents.map((incident) => ({
      date: incident.date,
      period:
        locale === "ar"
          ? incident.periodNameAr || incident.periodNameEn || incident.periodKey || "-"
          : incident.periodNameEn || incident.periodNameAr || incident.periodKey || "-",
      studentNumber: incident.studentNumber || "-",
      studentName: locale === "ar" ? incident.studentNameAr : incident.studentNameEn,
      studentNameEn: incident.studentNameEn,
      studentNameAr: incident.studentNameAr,
      grade: locale === "ar"
        ? incident.gradeNameAr || incident.gradeNameEn || "-"
        : incident.gradeNameEn || incident.gradeNameAr || "-",
      section: locale === "ar"
        ? incident.sectionNameAr || incident.sectionNameEn || "-"
        : incident.sectionNameEn || incident.sectionNameAr || "-",
      classroom: locale === "ar"
        ? incident.classroomNameAr || incident.classroomNameEn || "-"
        : incident.classroomNameEn || incident.classroomNameAr || "-",
      type:
        incident.type === "LATE"
          ? locale === "ar"
            ? "تأخير"
            : "Late"
          : locale === "ar"
            ? "مغادرة مبكرة"
            : "Early Leave",
      minutes: incident.minutes,
      threshold: incident.threshold ?? "",
      violation: incident.isViolation === null
        ? locale === "ar"
          ? "غير معروف"
          : "Unknown"
        : incident.isViolation
          ? locale === "ar"
            ? "نعم"
            : "Yes"
          : locale === "ar"
            ? "لا"
            : "No",
      sessionStatus: incident.sessionStatus || "",
    }));

    exportAttendanceData({
      title: locale === "ar" ? "التأخير والمغادرة المبكرة" : "Late & Early Leave",
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        scopeTypeName: filters.scopeType,
        scopeName,
        dateLabel:
          filters.dateFrom && filters.dateTo
            ? `${filters.dateFrom} - ${filters.dateTo}`
            : t("allDates"),
        viewName: locale === "ar" ? "التأخير والمغادرة المبكرة" : "Late & Early Leave",
        exportDate: formatAttendanceExportDate(locale),
      },
      filename: generateAttendanceExportFilename(
        "attendance-late-early",
        termContext.termId || undefined,
        filters.scopeType.toLowerCase(),
      ),
      format,
      columns,
      rows: rowsForExport,
      jsonData: {
        title: "Attendance Late Early",
        metadata: {
          yearName:
            termContext.academicYears.find((item) => item.id === termContext.yearId)
              ?.nameEn || termContext.yearId || "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages,
            grades,
            sections,
            classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel:
            filters.dateFrom && filters.dateTo
              ? `${filters.dateFrom} - ${filters.dateTo}`
              : "All dates",
          viewName: "Late & Early Leave",
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        incidents,
      },
      locale,
      emptyMessage: t("emptyStates.noRecords.description"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleOpenIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailsDrawerOpen(true);
  };

  const handleEditMinutes = (incident: Incident) => {
    if (isEntryReadOnly || incident.sessionStatus !== "SUBMITTED") return;
    setEditingIncident(incident);
    setMinutesEditorOpen(true);
  };

  const handleSaveMinutes = async ({
    minutes,
    correctionReason,
  }: {
    minutes: number;
    correctionReason: string;
  }) => {
    if (!editingIncident) return;

    try {
      await updateIncidentMinutes({
        yearId: editingIncident.yearId,
        termId: editingIncident.termId,
        sessionId: editingIncident.sessionId,
        studentId: editingIncident.studentId,
        type: editingIncident.type,
        minutes,
        correctionReason,
        incidentId: editingIncident.id,
      });
      showSuccess(t("minutesSaved"));
      await reloadIncidents();
    } catch (error) {
      console.error("Failed to update minutes", error);
      showError(tCommon("save_failed"));
      throw error;
    }
  };

  if (termContext.isLoading) {
    return (
     <MainLoader />
    );
  }

  if (!termContext.yearId || !termContext.termId) {
    return (
      <AttendanceWorkspaceShell>
        <AttendanceWorkspaceState
          title={t("emptyStates.noYearTerm.title")}
          description={t("emptyStates.noYearTerm.description")}
        />
      </AttendanceWorkspaceShell>
    );
  }

  const isScopeSelectionIncomplete = !isScopeSelectionComplete(filters.scopeType, filters.scopeIds);

  const incidentsBody = isScopeSelectionIncomplete ? (
    <AttendanceWorkspaceState
      title={t("emptyStates.selectScope.title")}
      description={t("emptyStates.selectScope.description")}
    />
  ) : incidents.length === 0 ? (
    <AttendanceWorkspaceState
      title={t("emptyStates.noRecords.title")}
      description={t("emptyStates.noRecords.description")}
    />
  ) : (
    <LateEarlyTable
      incidents={incidents}
      isReadOnly={isEntryReadOnly}
      onView={handleOpenIncident}
      onEditMinutes={handleEditMinutes}
    />
  );

  return (
    <>
      <AttendanceWorkspaceShell>
        <AttendanceWorkspaceHeader>
          <AttendanceScopeHeader
            isReadOnly={isEntryReadOnly}
            scopeType={filters.scopeType}
            scopeIds={filters.scopeIds}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
          />
          <LateEarlyKpisBar kpis={kpis} />
        </AttendanceWorkspaceHeader>

        {!isMobile && (
          <>
            <AttendanceFiltersPanel>
              <LateEarlyFiltersBar
                filters={{ ...filters, search: searchInput }}
                stages={stages}
                grades={grades}
                sections={sections}
                classrooms={classrooms}
                onFiltersChange={handleFiltersChange}
                onResetFilters={resetFilters}
                onOpenExport={() => setShowExportModal(true)}
              />
            </AttendanceFiltersPanel>
            <AttendanceWorkspaceContentPanel loading={loading}>
              {incidentsBody}
            </AttendanceWorkspaceContentPanel>
          </>
        )}

        {isMobile && (
          <AttendanceWorkspaceStack>
            <AttendanceWorkspaceMobileActions>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setFiltersDrawerOpen(true)}
              >
                {t("filters.filters")}
              </Button>
            </AttendanceWorkspaceMobileActions>

            <AttendanceWorkspaceContentPanel loading={loading}>
              {incidentsBody}
            </AttendanceWorkspaceContentPanel>
          </AttendanceWorkspaceStack>
        )}
      </AttendanceWorkspaceShell>

      <LateEarlyFiltersDrawer
        isOpen={filtersDrawerOpen}
        filters={{ ...filters, search: searchInput }}
        stages={stages}
        grades={grades}
        sections={sections}
        classrooms={classrooms}
        onClose={() => setFiltersDrawerOpen(false)}
        onApply={() => setFiltersDrawerOpen(false)}
        onFiltersChange={handleFiltersChange}
        onResetFilters={resetFilters}
        onOpenExport={() => setShowExportModal(true)}
      />

      <AttendanceBottomDrawer
        isOpen={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedIncident(null);
        }}
        anchor={isMobile ? "bottom" : "left"}
        heightClassName={isMobile ? "h-[80vh]" : "h-full w-[min(32rem,100vw)]"}
      >
        <IncidentDetailsDrawer
          incident={selectedIncident}
          isReadOnly={isEntryReadOnly}
          onClose={() => {
            setDetailsDrawerOpen(false);
            setSelectedIncident(null);
          }}
          onEditMinutes={handleEditMinutes}
        />
      </AttendanceBottomDrawer>

      <MinutesEditorModal
        isOpen={minutesEditorOpen}
        type={editingIncident?.type || "LATE"}
        initialMinutes={editingIncident?.minutes || 0}
        isReadOnly={isEntryReadOnly}
        onClose={() => {
          setMinutesEditorOpen(false);
          setEditingIncident(null);
        }}
        onSave={handleSaveMinutes}
      />

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={incidents.length}
        emptyStateMessage={t("emptyStates.noRecords.description")}
      />
    </>
  );
}
