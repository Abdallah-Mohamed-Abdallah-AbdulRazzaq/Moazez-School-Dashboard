"use client";

import { useLocale, useTranslations } from "next-intl";
import DataTable from "@/components/ui/data-table/DataTable";
import type { ReportsRiskStudentRow } from "../types";

interface StudentRiskTableProps {
  rows: ReportsRiskStudentRow[];
  onStudentClick: (row: ReportsRiskStudentRow) => void;
}

export default function StudentRiskTable({ rows, onStudentClick }: StudentRiskTableProps) {
  const t = useTranslations("attendance.reportsPage.risk");
  const locale = useLocale();

  const columns = [
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: ReportsRiskStudentRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
            {row.studentNumber}
          </div>
        </div>
      ),
    },
    {
      key: "scope",
      label: t("scope"),
      render: (_: unknown, row: ReportsRiskStudentRow) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {locale === "ar" ? row.scopeLabelAr : row.scopeLabelEn}
        </span>
      ),
    },
    {
      key: "attendanceRate",
      label: t("attendanceRate"),
      render: (value: unknown) => <span>{Number(value).toFixed(1)}%</span>,
    },
    { key: "absenceCount", label: t("absences") },
    { key: "lateCount", label: t("late") },
    { key: "rejectedExcuses", label: t("rejectedExcuses") },
    { key: "missingMarks", label: t("missingMarks") },
    {
      key: "flags",
      label: t("flagsLabel"),
      sortable: false,
      render: (_: unknown, row: ReportsRiskStudentRow) => (
        <div className="flex flex-wrap gap-2">
          {row.flags.map((flag) => (
            <span
              key={flag.code}
              className="rounded-full px-2 py-1 text-xs"
              style={{
                backgroundColor: "color-mix(in oklab, var(--accent-color) 14%, white)",
                color: "var(--text-primary)",
              }}
            >
              {t(`flags.${flag.code}`, { count: flag.count })}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
    >
      <div>
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </div>
      </div>

      <DataTable
        columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
        data={rows as unknown as { [key: string]: unknown }[]}
        onRowClick={(row) => onStudentClick(row as unknown as ReportsRiskStudentRow)}
        itemsPerPage={10}
        showPagination
      />
    </div>
  );
}
