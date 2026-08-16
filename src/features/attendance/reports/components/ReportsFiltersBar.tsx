"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import ScopePicker from "@/features/attendance/policies/components/ScopePicker";
import type {
  Classroom,
  Grade,
  Section,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceReportsFilters, ReportsStudentOption } from "../types";
import ReportsExportActions from "./ReportsExportActions";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface ReportsFiltersBarProps {
  filters: AttendanceReportsFilters;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  students: ReportsStudentOption[];
  onFiltersChange: (patch: Partial<AttendanceReportsFilters>) => void;
  onReset: () => void;
  onOpenExport: () => void;
  onPrint?: () => void;
  exportDisabled?: boolean;
}

export default function ReportsFiltersBar({
  filters,
  stages,
  grades,
  sections,
  classrooms,
  students,
  onFiltersChange,
  onReset,
  onOpenExport,
  onPrint,
  exportDisabled = false,
}: ReportsFiltersBarProps) {
  const t = useTranslations("attendance.reportsPage.filters");
  const tCommon = useTranslations("common");
  const invalidDateRange = isInvalidDateRange(filters.dateFrom, filters.dateTo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Input
          type="date"
          label={t("dateFrom")}
          value={filters.dateFrom || ""}
          max={filters.dateTo || undefined}
          onChange={(event) => onFiltersChange({ dateFrom: event.target.value })}
        />
        <Input
          type="date"
          label={t("dateTo")}
          value={filters.dateTo || ""}
          min={filters.dateFrom || undefined}
          onChange={(event) => onFiltersChange({ dateTo: event.target.value })}
          error={invalidDateRange ? tCommon("invalidDateRange") : undefined}
        />
        <Select
          label={t("student")}
          value={filters.studentId || ""}
          onChange={(value) => onFiltersChange({ studentId: value || undefined })}
          options={[
            { value: "", label: t("allStudents") },
            ...students.map((student) => ({
              value: student.id,
              label: student.label,
              searchText: `${student.label} ${student.studentNumber || ""}`,
            })),
          ]}
          placeholder={t("allStudents")}
          searchable
          searchPlaceholder={t("studentSearch")}
          noOptionsText={t("noStudents")}
          noResultsText={tCommon("noResults")}
        />
        <Select
          label={t("attendanceStatus")}
          value={filters.attendanceStatus}
          onChange={(value) => onFiltersChange({ attendanceStatus: value as AttendanceReportsFilters["attendanceStatus"] })}
          options={[
            { value: "ALL", label: t("allAttendanceStatuses") },
            { value: "PRESENT", label: t("statuses.present") },
            { value: "ABSENT", label: t("statuses.absent") },
            { value: "EXCUSED", label: t("statuses.excused") },
            { value: "LATE", label: t("statuses.late") },
            { value: "EARLY_LEAVE", label: t("statuses.earlyLeave") },
          ]}
        />
        <Select
          label={t("excuseStatus")}
          value={filters.excuseStatus}
          onChange={(value) => onFiltersChange({ excuseStatus: value as AttendanceReportsFilters["excuseStatus"] })}
          options={[
            { value: "ALL", label: t("allExcuseStatuses") },
            { value: "PENDING", label: t("excuseStatuses.pending") },
            { value: "APPROVED", label: t("excuseStatuses.approved") },
            { value: "REJECTED", label: t("excuseStatuses.rejected") },
          ]}
        />
        <Select
          label={t("incidentType")}
          value={filters.incidentType}
          onChange={(value) => onFiltersChange({ incidentType: value as AttendanceReportsFilters["incidentType"] })}
          options={[
            { value: "ALL", label: t("allIncidentTypes") },
            { value: "ABSENCE", label: t("incidentTypes.absence") },
            { value: "EXCUSED", label: t("incidentTypes.excused") },
            { value: "LATE", label: t("incidentTypes.late") },
            { value: "EARLY_LEAVE", label: t("incidentTypes.earlyLeave") },
          ]}
        />
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <ScopePicker
          scopeType={filters.scopeType}
          scopeIds={filters.scopeIds || {}}
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          onScopeTypeChange={(scopeType) => onFiltersChange({ scopeType, scopeIds: {} })}
          onScopeIdsChange={(scopeIds) => onFiltersChange({ scopeIds })}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <ReportsExportActions
          onOpenExport={onOpenExport}
          onPrint={onPrint}
          disabled={exportDisabled}
          printLabel={tCommon("print")}
        />
        <Button variant="outline" onClick={onReset}>
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
