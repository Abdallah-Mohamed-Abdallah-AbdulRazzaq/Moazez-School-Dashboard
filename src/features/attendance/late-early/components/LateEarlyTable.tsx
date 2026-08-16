"use client";

import { useLocale, useTranslations } from "next-intl";
import { Tooltip } from "@mui/material";
import { Eye, PencilLine, TriangleAlert } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import type { Incident } from "../types";

interface LateEarlyTableProps {
  incidents: Incident[];
  isReadOnly: boolean;
  onView: (incident: Incident) => void;
  onEditMinutes: (incident: Incident) => void;
}

export default function LateEarlyTable({ incidents, isReadOnly, onView, onEditMinutes }: LateEarlyTableProps) {
  const t = useTranslations("attendance.lateEarly.table");
  const locale = useLocale();

  const columns = [
    { key: "date", label: t("date"), render: (_value: unknown, row: Incident) => <span>{row.date}</span> },
    {
      key: "period",
      label: t("period"),
      render: (_value: unknown, row: Incident) => (
        <span>
          {(locale === "ar" ? row.periodNameAr : row.periodNameEn) ||
            (row.periodIndex ? `P${row.periodIndex}` : row.periodKey || "-")}
        </span>
      ),
    },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_value: unknown, row: Incident) => (
        <div className="min-w-0">
          <div className="truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
            {locale === "ar" ? row.studentNameEn : row.studentNameAr}
          </div>
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
            {row.studentNumber || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "gradeSection",
      label: t("gradeSection"),
      render: (_value: unknown, row: Incident) => (
        <span>
          {(locale === "ar" ? row.gradeNameAr : row.gradeNameEn) || row.gradeNameEn || row.gradeNameAr || "-"} / {(locale === "ar" ? row.sectionNameAr : row.sectionNameEn) || row.sectionNameEn || row.sectionNameAr || "-"}
          {row.classroomId
            ? ` / ${((locale === "ar" ? row.classroomNameAr : row.classroomNameEn) || row.classroomNameEn || row.classroomNameAr || "-")}`
            : ""}
        </span>
      ),
    },
    {
      key: "type",
      label: t("type"),
      render: (_value: unknown, row: Incident) => {
        const label = row.type === "LATE" ? t("late") : t("earlyLeave");
        const bg = row.type === "LATE" ? "var(--color-warning-100)" : "var(--color-info-100)";
        const fg = row.type === "LATE" ? "var(--color-warning-700)" : "var(--color-info-700)";
        return <span className="inline-flex px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>{label}</span>;
      },
    },
    { key: "minutes", label: t("minutes"), render: (_value: unknown, row: Incident) => <span>{row.minutes}</span> },
    {
      key: "threshold",
      label: t("threshold"),
      render: (_value: unknown, row: Incident) => (
        <Tooltip title={row.policyScopeSummary} arrow>
          <span>{typeof row.threshold === "number" ? row.threshold : "-"}</span>
        </Tooltip>
      ),
    },
    {
      key: "violation",
      label: t("violation"),
      render: (_value: unknown, row: Incident) => {
        const isUnknown = row.isViolation === null;
        const bg = isUnknown
          ? "var(--color-neutral-100)"
          : row.isViolation
            ? "var(--color-accent-100)"
            : "var(--color-success-100)";
        const fg = isUnknown
          ? "var(--color-neutral-700)"
          : row.isViolation
            ? "var(--color-accent-700)"
            : "var(--color-success-700)";

        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>
              {isUnknown ? t("unknown") : row.isViolation ? t("yes") : t("no")}
            </span>
            {row.isViolation && typeof row.threshold === "number" && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-accent-700)" }}>
                <TriangleAlert className="w-3.5 h-3.5" />
                {t("thresholdReached", { threshold: row.threshold })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_value: unknown, row: Incident) => (
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Tooltip title={t("view")} arrow>
            <button className="p-1.5 rounded" style={{ color: "var(--text-secondary)" }} onClick={() => onView(row)}>
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip title={t("editMinutes")} arrow>
            <button
              className="p-1.5 rounded disabled:opacity-50"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => onEditMinutes(row)}
              disabled={isReadOnly || row.sessionStatus !== "SUBMITTED"}
            >
              <PencilLine className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
      data={incidents as unknown as { [key: string]: unknown }[]}
      onRowClick={(row) => onView(row as unknown as Incident)}
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
