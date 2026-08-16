"use client";

import { useTranslations, useLocale } from "next-intl";
import { Edit2, FileText } from "lucide-react";
import { Tooltip } from "@mui/material";
import DataTable from "@/components/ui/data-table/DataTable";
import { getAttendanceStatusStyle } from "@/features/attendance/shared/statusStyles";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AbsenceRecord } from "../types";
import type { AttendanceStatus } from "@/features/attendance/roll-call/types";
import { getLocalizedStructureName } from "../utils/localizedStructureName";
import { canCorrectIncidentToEarlyLeave } from "../utils/correctionPermissions";

interface AbsencesTableProps {
  records: AbsenceRecord[];
  onRecordClick: (record: AbsenceRecord) => void;
  onEditExcuse: (record: AbsenceRecord) => void;
  onEditEarlyLeave: (record: AbsenceRecord) => void;
  isReadOnly: boolean;
  structureTree: StructureTree | null;
}

export default function AbsencesTable({
  records,
  onRecordClick,
  onEditExcuse,
  onEditEarlyLeave,
  isReadOnly,
  structureTree,
}: AbsencesTableProps) {
  const t = useTranslations("attendance.absences.table");
  const locale = useLocale();

  const getStatusLabel = (status: string) => {
    const statusKeys: Record<string, "absent" | "late" | "earlyLeave" | "excused" | "unmarked"> = {
      ABSENT: "absent",
      LATE: "late",
      EARLY_LEAVE: "earlyLeave",
      EXCUSED: "excused",
      UNMARKED: "unmarked",
    };
    return t(`statusLabels.${statusKeys[status] || "unmarked"}`);
  };

  const getStatusChip = (row: AbsenceRecord) => {
    const { status, granularity } = row;

    if (granularity === "DAILY_DERIVED") {
      const style = getAttendanceStatusStyle(status as AttendanceStatus);
      const statusLabel = status === "EXCUSED"
        ? t("statusTransition", { from: getStatusLabel("ABSENT"), to: getStatusLabel(status) })
        : getStatusLabel(status);
      return (
        <span 
          style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
          className="inline-flex px-2 py-1 text-xs font-medium rounded border"
        >
          {t("dailyStatus", { status: statusLabel })}
        </span>
      );
    }

    const style = getAttendanceStatusStyle(status as AttendanceStatus);
    const statusLabel = getStatusLabel(status);

    return (
      <span 
        style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
        className="inline-flex px-2 py-1 text-xs font-medium rounded border"
      >
        {statusLabel}
      </span>
    );
  };

  const columns = [
    {
      key: "date",
      label: t("date"),
      sortable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <span style={{ color: "var(--color-gray-900)" }} className="text-sm">{row.date}</span>
      ),
    },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <div>
          <div style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
          <div style={{ color: "var(--color-neutral-500)" }} className="text-xs">
            {locale === "ar" ? row.studentNameEn : row.studentNameAr}
          </div>
          <div style={{ color: "var(--color-neutral-400)" }} className="text-xs">{row.studentNumber || "—"}</div>
        </div>
      ),
    },
    {
      key: "grade",
      label: t("grade"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {getLocalizedStructureName(row, structureTree, "grade", locale)}
        </div>
      ),
    },
    {
      key: "section",
      label: t("section"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {getLocalizedStructureName(row, structureTree, "section", locale)}
        </div>
      ),
    },
    {
      key: "classroom",
      label: t("classroom"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {getLocalizedStructureName(row, structureTree, "classroom", locale)}
        </div>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: AbsenceRecord) => getStatusChip(row),
    },
    {
      key: "period",
      label: t("period"),
      render: (_: unknown, row: AbsenceRecord) => {
        if (row.granularity !== "PERIOD") {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">-</span>;
        }
        return (
          <span style={{ color: "var(--color-gray-700)" }} className="text-sm">
            {(locale === "ar" ? row.periodNameAr : row.periodNameEn) ||
              (row.periodIndex ? `P${row.periodIndex}` : row.periodKey || "-")}
          </span>
        );
      },
    },
    {
      key: "minutes",
      label: t("minutes"),
      render: (_: unknown, row: AbsenceRecord) => {
        const minutes = row.minutesLate || row.minutesEarlyLeave;
        if (!minutes) return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">-</span>;
        return <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{minutes}</span>;
      },
    },
    {
      key: "excuse",
      label: t("excuse"),
      render: (_: unknown, row: AbsenceRecord) => {
        if (!row.excuse) {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">{t("noExcuse")}</span>;
        }
        return (
          <Tooltip title={row.excuse.reasonAr || row.excuse.reasonEn || ""} arrow>
            <div className="flex items-center gap-1 text-sm text-green-700 cursor-help">
              <FileText className="w-3.5 h-3.5" />
              <span>{t("hasExcuse")}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: AbsenceRecord) => {
        // Can't edit daily derived records directly
        if (row.granularity === "DAILY_DERIVED") {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-xs">{t("viewOnly")}</span>;
        }

        const canCorrect = !isReadOnly && row.sessionStatus === "SUBMITTED";

        return (
          <div className="flex items-center gap-2">
            {row.status !== "EXCUSED" && (
              <Tooltip title={t("editExcuse")} arrow>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditExcuse(row);
                  }}
                  disabled={!canCorrect}
                  style={{ color: "var(--color-gray-600)" }}
                  className="p-1.5 hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
            {canCorrectIncidentToEarlyLeave(row.status) && (
              <Tooltip title={t("editEarlyLeave")} arrow>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEarlyLeave(row);
                  }}
                  disabled={!canCorrect}
                  style={{ color: "var(--color-gray-600)" }}
                  className="p-1.5 hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
      data={records as unknown as { [key: string]: unknown }[]}
      onRowClick={(row) => onRecordClick(row as unknown as AbsenceRecord)}
      searchQuery=""
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
