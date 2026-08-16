"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { GradebookStudentRow } from "../types";

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;
type GradebookStatusFilter = "all" | "entered" | "missing" | "absent";

interface GradesGradebookSectionProps {
  isLoading: boolean;
  hasAssessments: boolean;
  rows: GradebookTableRow[];
  columns: Column<GradebookTableRow>[];
}

export default function GradesGradebookSection({
  isLoading,
  hasAssessments,
  rows,
  columns,
}: GradesGradebookSectionProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GradebookStatusFilter>("all");
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    return rows.filter((row) => {
      const studentMatches = !normalizedSearch || [row.studentNameAr, row.studentNameEn, row.classroomName]
        .some((label) => label?.toLocaleLowerCase(locale).includes(normalizedSearch));
      const statuses = Object.values(row.statusByAssessmentId);
      return studentMatches && (status === "all" || statuses.includes(status));
    });
  }, [locale, rows, search, status]);
  const hasActiveFilters = search.trim().length > 0 || status !== "all";
  const emptyStateMessage = hasAssessments
    ? t("emptyState.noStudents")
    : t("emptyState.noAssessments");

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div className="mb-4">
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("gradebook.title")}</div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("gradebook.subtitle")}</div>
      </div>
      {!isLoading && rows.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px]">
          <Input
            aria-label={t("gradebook.search")}
            placeholder={t("gradebook.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            aria-label={t("gradebook.statusFilter")}
            value={status}
            onChange={(value) => setStatus(value as GradebookStatusFilter)}
            options={[
              { value: "all", label: t("gradebook.statuses.all") },
              { value: "entered", label: t("gradebook.statuses.entered") },
              { value: "missing", label: t("gradebook.statuses.missing") },
              { value: "absent", label: t("gradebook.statuses.absent") },
            ]}
          />
        </div>
      ) : null}
      {isLoading ? (
        <div className="flex justify-center py-10"><PartialLoader /></div>
      ) : rows.length === 0 || filteredRows.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          {hasActiveFilters && rows.length > 0 ? t("emptyState.noResults") : emptyStateMessage}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredRows} showPagination searchQuery={search} />
      )}
    </div>
  );
}
