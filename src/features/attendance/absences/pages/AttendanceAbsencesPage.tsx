"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Filter } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
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
import AbsencesKpisBar from "../components/AbsencesKpisBar";
import AbsencesFiltersBar from "../components/AbsencesFiltersBar";
import AbsencesFiltersDrawer from "../components/AbsencesFiltersDrawer";
import AbsencesTable from "../components/AbsencesTable";
import AbsenceDetailsPanel from "../components/AbsenceDetailsPanel";
import ExcuseModal from "@/features/attendance/roll-call/components/ExcuseModal";
import EarlyLeaveEditorModal from "../components/EarlyLeaveEditorModal";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import {
  fetchAbsenceRecords,
  computeAbsencesKPIs,
  updateExcuse,
  updateEarlyLeaveMinutes,
} from "../services/attendanceAbsencesService";
import { exportAbsencesToExcel } from "../utils/absencesExport";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  resolveEffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import { isDateRangeValidationError, isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type { AbsenceRecord, AbsencesFilters } from "../types";

export default function AttendanceAbsencesPage() {
  const { hasPermission } = usePermissions();
  const t = useTranslations("attendance.absences");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceYearTermLayoutContext();
  const [structureTree, setStructureTree] = useState<StructureTree | null>(
    null,
  );

  const isReadOnly = termContext.isReadOnly;
  const isEntryReadOnly = isReadOnly || !hasPermission("attendance.entries.manage");

  // State
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const latestRecordsRequest = useRef(0);
  const [selectedRecord, setSelectedRecord] = useState<AbsenceRecord | null>(
    null,
  );
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<AbsencesFilters>({
    scopeType: "SCHOOL",
    status: "ALL",
    granularities: ["DAILY", "PERIOD"],
    onlyUnexcused: false,
    search: "",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modals
  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [earlyLeaveModalOpen, setEarlyLeaveModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AbsenceRecord | null>(null);

  // Reusable reload function
  const reloadRecords = useCallback(async () => {
    const requestId = ++latestRecordsRequest.current;

    if (!termContext.yearId || !termContext.termId) {
      setIsLoading(false);
      return;
    }

    if (isInvalidDateRange(filters.dateFrom, filters.dateTo)) {
      if (requestId === latestRecordsRequest.current) {
        setRecords([]);
        setSelectedRecord(null);
        setIsLoading(false);
      }
      return;
    }

    if (!isScopeSelectionComplete(filters.scopeType, filters.scopeIds)) {
      if (requestId === latestRecordsRequest.current) {
        setRecords([]);
        setSelectedRecord(null);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAbsenceRecords({
        yearId: termContext.yearId,
        termId: termContext.termId,
        ...filters,
      });
      if (requestId === latestRecordsRequest.current) {
        setRecords(data);
        setSelectedRecord((selected) =>
          selected ? data.find((record) => record.id === selected.id) ?? null : null,
        );
      }
    } catch (error) {
      console.error("Failed to load absences:", error);
      if (requestId === latestRecordsRequest.current) {
        if (isDateRangeValidationError(error)) {
          setRecords([]);
          setSelectedRecord(null);
          showError(tCommon("invalidDateRange"));
        } else {
          showError(tCommon("error_loading"));
        }
      }
    } finally {
      if (requestId === latestRecordsRequest.current) setIsLoading(false);
    }
  }, [termContext.yearId, termContext.termId, filters, showError, tCommon]);

  // Load structure tree when year/term changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    let cancelled = false;
    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(
          termContext.yearId!,
          termContext.termId!,
        );
        if (cancelled) return;
        setStructureTree(tree);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load structure tree:", error);
      }
    };

    void loadStructure();
    return () => {
      cancelled = true;
    };
  }, [termContext.yearId, termContext.termId]);

  // Load data when filters change
  useEffect(() => {
    void Promise.resolve().then(reloadRecords);
  }, [reloadRecords]);

  // Compute KPIs
  const kpis = useMemo(() => computeAbsencesKPIs(records), [records]);

  // Handlers
  const handleFiltersChange = (newFilters: Partial<AbsencesFilters>) => {
    if ("search" in newFilters) {
      setSearchInput(newFilters.search || "");
    }

    const nonSearchFilters = { ...newFilters };
    delete nonSearchFilters.search;
    if (Object.keys(nonSearchFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...nonSearchFilters }));
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      scopeType: "SCHOOL",
      status: "ALL",
      granularities: ["DAILY", "PERIOD"],
      onlyUnexcused: false,
      search: "",
    });
  };

  const handleRecordClick = (record: AbsenceRecord) => {
    setSelectedRecord(record);
    setShowDetailsDrawer(true);
  };

  const handleEditExcuse = async (record: AbsenceRecord) => {
    if (
      isEntryReadOnly ||
      record.sessionStatus !== "SUBMITTED" ||
      record.status === "EXCUSED"
    ) return;

    try {
      // Resolve effective policy for this record
      const policy = await resolveEffectiveExcusePolicy(
        termContext.yearId!,
        termContext.termId!,
        record.scopeType,
        record.scopeIds,
        record.date,
      );

      // Check if excuses are allowed by policy
      if (policy && !policy.allowExcuses) {
        showError(t("messages.excusesDisabledByPolicy"));
        return;
      }

      setRecordToEdit(record);
      setExcuseModalOpen(true);
    } catch (error) {
      console.error("Failed to resolve excuse policy:", error);
      showError(tCommon("error_loading"));
    }
  };

  const handleEditEarlyLeave = (record: AbsenceRecord) => {
    if (
      isEntryReadOnly ||
      record.sessionStatus !== "SUBMITTED" ||
      record.status === "EXCUSED"
    ) return;
    setRecordToEdit(record);
    setEarlyLeaveModalOpen(true);
  };

  const handleSaveExcuse = async (reason: string) => {
    if (!recordToEdit) return;

    try {
      await updateExcuse(recordToEdit, reason);
      showSuccess(t("excuseSaved"));
      await reloadRecords();
    } catch (error) {
      console.error("Failed to save excuse:", error);
      showError(tCommon("save_failed"));
    }
  };

  const handleSaveEarlyLeave = async ({
    minutes,
    correctionReason,
  }: {
    minutes: number;
    correctionReason: string;
  }) => {
    if (!recordToEdit) return;

    try {
      await updateEarlyLeaveMinutes(recordToEdit, minutes, correctionReason);
      showSuccess(t("minutesSaved"));
      await reloadRecords();
    } catch (error) {
      console.error("Failed to save minutes:", error);
      showError(tCommon("save_failed"));
    }
  };

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.yearId ||
    "";

  const selectedTermName = termContext.terms.find(
    (item) => item.id === termContext.termId,
  )
    ? locale === "ar"
      ? termContext.terms.find((item) => item.id === termContext.termId)
          ?.nameAr ||
        termContext.terms.find((item) => item.id === termContext.termId)?.name
      : termContext.terms.find((item) => item.id === termContext.termId)
          ?.nameEn ||
        termContext.terms.find((item) => item.id === termContext.termId)?.name
    : termContext.termId || "";

  const handleLegacyExport = () => {
    if (!termContext.yearId || !termContext.termId) return;

    const scopeName = getAttendanceScopeLabel({
      scopeType: filters.scopeType,
      scopeIds: filters.scopeIds,
      stages: structureTree?.stages || [],
      grades: structureTree?.grades || [],
      sections: structureTree?.sections || [],
      classrooms: structureTree?.classrooms || [],
      locale,
    });

    exportAbsencesToExcel(records, locale, {
      yearName: selectedYearName,
      termName: selectedTermName || "",
      scopeName,
      dateRange:
        filters.dateFrom && filters.dateTo
          ? `${filters.dateFrom} - ${filters.dateTo}`
          : locale === "ar"
            ? "جميع التواريخ"
            : "All dates",
    });

    showSuccess(t("exportSuccess"));
  };

  const handleExport = async (format: AttendanceExportFormat) => {
    if (!termContext.yearId || !termContext.termId) return;

    if (format === "excel") {
      handleLegacyExport();
      return;
    }

    const scopeName = getAttendanceScopeLabel({
      scopeType: filters.scopeType,
      scopeIds: filters.scopeIds,
      stages: structureTree?.stages || [],
      grades: structureTree?.grades || [],
      sections: structureTree?.sections || [],
      classrooms: structureTree?.classrooms || [],
      locale,
    });

    const columns: ExportColumn[] = [
      { key: "date", label: locale === "ar" ? "التاريخ" : "Date" },
      {
        key: "studentNumber",
        label: locale === "ar" ? "رقم الطالب" : "Student Number",
      },
      { key: "studentName", label: locale === "ar" ? "الطالب" : "Student" },
      {
        key: "studentNameEn",
        label: locale === "ar" ? "الطالب (بالإنجليزية)" : "Student (English)",
      },
      {
        key: "studentNameAr",
        label: locale === "ar" ? "الطالب (بالعربية)" : "Student (Arabic)",
      },
      { key: "grade", label: locale === "ar" ? "الصف" : "Grade" },
      { key: "section", label: locale === "ar" ? "الشعبة" : "Section" },
      { key: "classroom", label: locale === "ar" ? "الفصل" : "Classroom" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "granularity", label: locale === "ar" ? "النوع" : "Granularity" },
      { key: "period", label: locale === "ar" ? "الحصة" : "Period" },
      { key: "minutes", label: locale === "ar" ? "الدقائق" : "Minutes" },
      { key: "hasExcuse", label: locale === "ar" ? "العذر" : "Has Excuse" },
    ];

    const rowsForExport = records.map((record) => ({
      date: record.date,
      studentNumber: record.studentNumber,
      studentName:
        locale === "ar" ? record.studentNameAr : record.studentNameEn,
      studentNameEn: record.studentNameEn,
      studentNameAr: record.studentNameAr,
      grade:
        locale === "ar"
          ? record.gradeNameAr || record.gradeNameEn || "-"
          : record.gradeNameEn || record.gradeNameAr || "-",
      section:
        locale === "ar"
          ? record.sectionNameAr || record.sectionNameEn || "-"
          : record.sectionNameEn || record.sectionNameAr || "-",
      classroom:
        locale === "ar"
          ? record.classroomNameAr || record.classroomNameEn || "-"
          : record.classroomNameEn || record.classroomNameAr || "-",
      status: record.status,
      granularity: record.granularity,
      period:
        locale === "ar"
          ? record.periodNameAr || record.periodKey || record.periodIndex || "-"
          : record.periodNameEn || record.periodKey || record.periodIndex || "-",
      minutes: record.minutesLate || record.minutesEarlyLeave || "",
      hasExcuse: record.excuse
        ? locale === "ar"
          ? "نعم"
          : "Yes"
        : locale === "ar"
          ? "لا"
          : "No",
    }));

    exportAttendanceData({
      title: locale === "ar" ? "الغياب والإجازات" : "Absences & Leaves",
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        scopeTypeName: filters.scopeType,
        scopeName,
        dateLabel:
          filters.dateFrom && filters.dateTo
            ? `${filters.dateFrom} - ${filters.dateTo}`
            : locale === "ar"
              ? "جميع التواريخ"
              : "All dates",
        viewName: locale === "ar" ? "الغياب والإجازات" : "Absences",
        exportDate: formatAttendanceExportDate(locale),
      },
      filename: generateAttendanceExportFilename(
        "attendance-absences",
        termContext.termId || undefined,
        filters.scopeType.toLowerCase(),
      ),
      format,
      columns,
      rows: rowsForExport,
      jsonData: {
        title: "Attendance Absences",
        metadata: {
          yearName:
            termContext.academicYears.find(
              (item) => item.id === termContext.yearId,
            )?.nameEn ||
            termContext.yearId ||
            "",
          termName:
            termContext.terms.find((item) => item.id === termContext.termId)
              ?.nameEn ||
            termContext.terms.find((item) => item.id === termContext.termId)
              ?.name ||
            termContext.termId ||
            "",
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages: structureTree?.stages || [],
            grades: structureTree?.grades || [],
            sections: structureTree?.sections || [],
            classrooms: structureTree?.classrooms || [],
            locale: "en",
          }),
          dateLabel:
            filters.dateFrom && filters.dateTo
              ? `${filters.dateFrom} - ${filters.dateTo}`
              : "All dates",
          viewName: "Absences",
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        records,
      },
      locale,
      emptyMessage: t("emptyStates.noRecords.description"),
    });

    showSuccess(t("exportSuccess"));
  };

  // Empty states
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

  const isScopeSelectionIncomplete = !isScopeSelectionComplete(
    filters.scopeType,
    filters.scopeIds,
  );

  const recordsBody = isScopeSelectionIncomplete ? (
    <AttendanceWorkspaceState
      title={t("emptyStates.selectScope.title")}
      description={t("emptyStates.selectScope.description")}
    />
  ) : records.length === 0 ? (
    <AttendanceWorkspaceState
      title={t("emptyStates.noRecords.title")}
      description={t("emptyStates.noRecords.description")}
    />
  ) : (
    <AbsencesTable
      records={records}
      onRecordClick={handleRecordClick}
      onEditExcuse={handleEditExcuse}
      onEditEarlyLeave={handleEditEarlyLeave}
      isReadOnly={isEntryReadOnly}
      structureTree={structureTree}
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
            stages={structureTree?.stages || []}
            grades={structureTree?.grades || []}
            sections={structureTree?.sections || []}
            classrooms={structureTree?.classrooms || []}
          />
          <AbsencesKpisBar kpis={kpis} />
        </AttendanceWorkspaceHeader>

        {!isMobile && (
          <>
            <AttendanceFiltersPanel className="rounded-lg">
              <AbsencesFiltersBar
                filters={{ ...filters, search: searchInput }}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                onExport={() => setShowExportModal(true)}
                isReadOnly={isReadOnly}
                structureTree={structureTree}
              />
            </AttendanceFiltersPanel>
            <AttendanceWorkspaceContentPanel loading={isLoading}>
              {recordsBody}
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
                onClick={() => setShowFiltersDrawer(true)}
              >
                {t("filters.filters")}
              </Button>
            </AttendanceWorkspaceMobileActions>
            <AttendanceWorkspaceContentPanel loading={isLoading}>
              {recordsBody}
            </AttendanceWorkspaceContentPanel>
          </AttendanceWorkspaceStack>
        )}
      </AttendanceWorkspaceShell>

      <AbsencesFiltersDrawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        filters={{ ...filters, search: searchInput }}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        onExport={() => setShowExportModal(true)}
        structureTree={structureTree}
      />

      <AttendanceBottomDrawer
        isOpen={showDetailsDrawer}
        disableEnforceFocus={attachmentPreviewOpen}
        onClose={() => {
          setAttachmentPreviewOpen(false);
          setShowDetailsDrawer(false);
          setSelectedRecord(null);
        }}
        anchor={isMobile ? "bottom" : "left"}
        heightClassName={isMobile ? "h-[80vh]" : "h-full w-[min(32rem,100vw)]"}
      >
        <AbsenceDetailsPanel
          record={selectedRecord}
          onClose={() => {
            setAttachmentPreviewOpen(false);
            setShowDetailsDrawer(false);
            setSelectedRecord(null);
          }}
          onEditExcuse={handleEditExcuse}
          onEditEarlyLeave={handleEditEarlyLeave}
          isReadOnly={isEntryReadOnly}
          structureTree={structureTree}
          onAttachmentPreviewChange={setAttachmentPreviewOpen}
        />
      </AttendanceBottomDrawer>

      <ExcuseModal
        isOpen={excuseModalOpen}
        onClose={() => {
          setExcuseModalOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveExcuse}
        initialReason={
          recordToEdit?.excuse?.reasonAr ||
          recordToEdit?.excuse?.reasonEn ||
          ""
        }
        attachmentMode="UNSUPPORTED"
        isReadOnly={isEntryReadOnly}
      />

      <EarlyLeaveEditorModal
        isOpen={earlyLeaveModalOpen}
        onClose={() => {
          setEarlyLeaveModalOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveEarlyLeave}
        initialMinutes={recordToEdit?.minutesEarlyLeave || 0}
        isReadOnly={isEntryReadOnly}
      />

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={records.length}
        emptyStateMessage={t("emptyStates.noRecords.description")}
      />
    </>
  );
}
