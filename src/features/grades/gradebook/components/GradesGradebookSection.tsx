"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { GradebookStudentRow } from "../types";
import type { Assessment } from "../../shared/types";
import GradebookAssessmentView from "./GradebookAssessmentView";
import GradebookStudentView from "./GradebookStudentView";

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;
type GradebookStatusFilter = "all" | "entered" | "missing" | "absent";
type GradebookViewMode = "student" | "assessment" | "matrix";

interface AssessmentGroup {
  id: string;
  label: string;
}

interface GradesGradebookSectionProps {
  isLoading: boolean;
  hasAssessments: boolean;
  rows: GradebookTableRow[];
  columns: Column<GradebookTableRow>[];
  assessmentGroups: AssessmentGroup[];
  assessmentColumnGroups: Record<string, string>;
  assessments: Assessment[];
  onOpenGrade: (assessment: Assessment, row: GradebookStudentRow) => void;
}

export default function GradesGradebookSection({
  isLoading,
  hasAssessments,
  rows,
  columns,
  assessmentGroups,
  assessmentColumnGroups,
  assessments,
  onOpenGrade,
}: GradesGradebookSectionProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GradebookStatusFilter>("all");
  const [viewMode, setViewMode] = useState<GradebookViewMode>("student");
  const [hiddenGroupIds, setHiddenGroupIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    return rows.filter((row) => {
      const studentMatches =
        !normalizedSearch ||
        [
          row.studentNameAr,
          row.studentNameEn,
          row.studentCode,
          row.admissionNo,
          row.classroomName,
        ].some((label) =>
          label?.toLocaleLowerCase(locale).includes(normalizedSearch),
        );
      const statuses = Object.values(row.statusByAssessmentId);
      return studentMatches && (status === "all" || statuses.includes(status));
    });
  }, [locale, rows, search, status]);
  const hasActiveFilters = search.trim().length > 0 || status !== "all";
  const visibleColumns = useMemo(
    () =>
      columns.filter((column) => {
        const groupId = assessmentColumnGroups[column.key];
        return !groupId || !hiddenGroupIds.has(groupId);
      }),
    [assessmentColumnGroups, columns, hiddenGroupIds],
  );
  const summary = useMemo(() => {
    const counts = { entered: 0, missing: 0, absent: 0 };
    for (const row of filteredRows) {
      for (const gradeStatus of Object.values(row.statusByAssessmentId))
        counts[gradeStatus]++;
    }
    return counts;
  }, [filteredRows]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(
    () =>
      filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize),
    [activePage, filteredRows, pageSize],
  );

  const toggleAssessmentGroup = (groupId: string) => {
    setHiddenGroupIds((currentGroupIds) => {
      const nextGroupIds = new Set(currentGroupIds);
      if (nextGroupIds.has(groupId)) nextGroupIds.delete(groupId);
      else nextGroupIds.add(groupId);
      return nextGroupIds;
    });
  };

  const changePageSize = (nextPageSize: string) => {
    setPageSize(Number(nextPageSize));
    setCurrentPage(1);
  };

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      <div className="mb-4">
        <div
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("gradebook.title")}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("gradebook.subtitle")}
        </div>
      </div>
      {!isLoading && hasAssessments && rows.length > 0 ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["students", filteredRows.length],
              ["entered", summary.entered],
              ["missing", summary.missing],
              ["absent", summary.absent],
            ].map(([key, value]) => (
              <div
                key={String(key)}
                className="rounded-lg border px-3 py-2"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--background-color)",
                }}
              >
                <div
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t(`gradebook.summary.${key}`)}
                </div>
                <div
                  className="mt-0.5 text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px]">
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
          <div
            className="mb-4 flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label={t("gradebook.viewMode")}
          >
            {(["student", "assessment", "matrix"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={viewMode === mode ? "secondary" : "ghost"}
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {t(`gradebook.views.${mode}`)}
              </Button>
            ))}
          </div>
          {viewMode === "matrix" && assessmentGroups.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("gradebook.groups")}
              </span>
              {assessmentGroups.map((group) => (
                <Button
                  key={group.id}
                  type="button"
                  size="sm"
                  variant={hiddenGroupIds.has(group.id) ? "ghost" : "secondary"}
                  aria-pressed={!hiddenGroupIds.has(group.id)}
                  onClick={() => toggleAssessmentGroup(group.id)}
                >
                  {group.label}
                </Button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <PartialLoader />
        </div>
      ) : !hasAssessments ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" aria-hidden="true" />}
          title={t("gradebook.emptyStates.noAssessmentsTitle")}
          message={t("emptyState.noAssessments")}
          className="rounded-lg border"
        />
      ) : rows.length === 0 || filteredRows.length === 0 ? (
        <div
          className="rounded-lg border p-6 text-center text-sm"
          style={{
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          {hasActiveFilters && rows.length > 0
            ? t("emptyState.noResults")
            : t("emptyState.noStudents")}
        </div>
      ) : viewMode === "student" ? (
        <GradebookStudentView
          rows={paginatedRows}
          assessments={assessments}
          onOpenGrade={onOpenGrade}
          pagination={{
            currentPage: activePage,
            totalPages,
            pageSize,
            totalItems: filteredRows.length,
            onPageChange: setCurrentPage,
            onPageSizeChange: changePageSize,
          }}
        />
      ) : viewMode === "assessment" ? (
        <GradebookAssessmentView
          rows={paginatedRows}
          assessments={assessments}
          onOpenGrade={onOpenGrade}
        />
      ) : (
        <DataTable
          columns={visibleColumns}
          data={filteredRows}
          showPagination
          searchQuery={search}
        />
      )}
      {!isLoading && filteredRows.length > 0 && viewMode === "assessment" ? (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("gradebook.pagination.summary", {
              from: (activePage - 1) * pageSize + 1,
              to: Math.min(activePage * pageSize, filteredRows.length),
              total: filteredRows.length,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label={t("gradebook.pagination.pageSize")}
              value={String(pageSize)}
              onChange={changePageSize}
              options={[10, 25, 50].map((size) => ({
                value: String(size),
                label: String(size),
              }))}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={activePage === 1}
              onClick={() => setCurrentPage(activePage - 1)}
            >
              {t("gradebook.pagination.previous")}
            </Button>
            <span
              className="text-xs text-nowrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("gradebook.pagination.page", {
                page: activePage,
                total: totalPages,
              })}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(activePage + 1)}
            >
              {t("gradebook.pagination.next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
