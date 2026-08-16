"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DataTable from "@/components/ui/data-table/DataTable";
import type { ReportsPerformanceLevel, ReportsPerformanceRow } from "../types";

interface SectionPerformanceTableProps {
  rowsByLevel: Record<ReportsPerformanceLevel, ReportsPerformanceRow[]>;
  onRowClick: (row: ReportsPerformanceRow) => void;
}

export default function SectionPerformanceTable({ rowsByLevel, onRowClick }: SectionPerformanceTableProps) {
  const t = useTranslations("attendance.reportsPage.performance");
  const locale = useLocale();
  const [level, setLevel] = useState<ReportsPerformanceLevel>("section");

  const rows = useMemo(() => rowsByLevel[level] || [], [level, rowsByLevel]);

  const columns = [
    {
      key: "name",
      label: t("name"),
      searchable: true,
      render: (_: unknown, row: ReportsPerformanceRow) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {locale === "ar" ? row.labelAr : row.labelEn}
        </span>
      ),
    },
    {
      key: "attendanceRate",
      label: t("attendanceRate"),
      render: (value: unknown) => <span>{Number(value).toFixed(1)}%</span>,
    },
    { key: "markedCount", label: t("markedCount") },
    { key: "absentCount", label: t("absent") },
    { key: "lateCount", label: t("late") },
    {
      key: "delta",
      label: t("delta"),
      render: (value: unknown) => (
        <span>{typeof value === "number" ? Number(value).toFixed(1) : "-"}</span>
      ),
    },
  ];

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("title")}
          </div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("subtitle")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["stage", "grade", "section", "classroom"] as ReportsPerformanceLevel[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className="rounded-full px-3 py-1.5 text-sm"
              style={{
                backgroundColor: level === item ? "var(--primary-color)" : "var(--hover-background)",
                color: level === item ? "var(--white-color)" : "var(--text-primary)",
              }}
            >
              {t(`levels.${item}`)}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
        data={rows as unknown as { [key: string]: unknown }[]}
        onRowClick={(row) => onRowClick(row as unknown as ReportsPerformanceRow)}
        itemsPerPage={10}
        showPagination
      />
    </div>
  );
}
