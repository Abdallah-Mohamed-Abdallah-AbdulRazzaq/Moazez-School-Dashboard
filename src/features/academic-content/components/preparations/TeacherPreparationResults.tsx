"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Select from "@/components/ui/input/Select";
import type { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";

type PreparationRow = AcademicContentLibraryItem & Record<string, unknown>;

interface TeacherPreparationResultsProps {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  search: string;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
  hasFilters: boolean;
  onOpen: (contentId: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

export default function TeacherPreparationResults({
  items,
  page,
  limit,
  total,
  search,
  isLoading,
  error,
  hasFilters,
  onOpen,
  onRetry,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
}: TeacherPreparationResultsProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("teacher_preparations");
  const formatDate = (instant: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(instant));
  const topic = (content: AcademicContentLibraryItem) =>
    content.summary?.type === "TEACHER_PREPARATION" && content.summary.topic
      ? content.summary.topic
      : t("topic_unavailable");
  const status = (content: AcademicContentLibraryItem) =>
    content.status === "SUBMITTED" ? (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{t("pending_approval")}</span>
    ) : (
      <AcademicContentStatusBadge status={content.status} />
    );

  if (error) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white shadow-sm">
        <EmptyState title={t("unavailable_title")} message={error.message} icon={<RefreshCw aria-hidden="true" className="size-10" />} action={<Button onClick={onRetry}>{t("retry")}</Button>} />
      </section>
    );
  }

  if (!isLoading && total === 0) {
    return (
      <section className="rounded-xl bg-white shadow-sm">
        <EmptyState
          title={t(hasFilters ? "filtered_empty_title" : "empty_title")}
          message={t(hasFilters ? "filtered_empty_description" : "empty_description")}
          icon={<FileText aria-hidden="true" className="size-10" />}
          action={hasFilters ? <Button variant="secondary" onClick={onClearFilters}>{t("clear_filters")}</Button> : undefined}
        />
      </section>
    );
  }

  const columns: Column<PreparationRow>[] = [
    { key: "title", label: t("columns.preparation"), searchable: true, render: (_, row) => <div className="min-w-48"><p className="font-semibold text-gray-950">{row.title}</p><p className="mt-1 text-xs text-gray-500">{topic(row)}</p></div> },
    { key: "description", label: t("columns.description"), render: (description) => <p className="max-w-sm text-sm text-gray-600">{description ? String(description) : t("description_unavailable")}</p> },
    { key: "status", label: t("columns.status"), render: (_, row) => status(row) },
    { key: "updatedAt", label: t("columns.updated"), render: (updatedAt) => <time dateTime={String(updatedAt)}>{formatDate(String(updatedAt))}</time> },
    { key: "actions", label: t("columns.actions"), render: (_, row) => <Button data-row-action type="button" size="sm" variant="ghost" onClick={() => onOpen(row.id)}>{t("open")}</Button> },
  ];
  const rows = items as PreparationRow[];
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section aria-label={t("results", { count: total })}>
      <div className="hidden md:block">
        <DataTable columns={columns} data={rows} getRowKey={(row) => row.id} onRowClick={(row) => onOpen(row.id)} isLoading={isLoading} searchQuery={search} showDensityToggle={false} serverPagination={{ enabled: true, currentPage: page, pageSize: limit, totalItems: total, onPageChange, onPageSizeChange }} />
      </div>
      <div className="space-y-3 md:hidden">
        {isLoading ? <div role="status" className="rounded-xl bg-white p-6 text-sm text-gray-500">{t("loading")}</div> : items.map((content) => (
          <article key={content.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold text-gray-950">{content.title}</h2><p className="mt-1 text-xs text-gray-500">{topic(content)}</p></div>{status(content)}</div>
            <p className="mt-3 text-sm text-gray-600">{content.description || t("description_unavailable")}</p>
            <div className="mt-4 flex items-center justify-between gap-3"><time dateTime={content.updatedAt} className="text-xs text-gray-500">{formatDate(content.updatedAt)}</time><Button size="sm" variant="ghost" onClick={() => onOpen(content.id)}>{t("open")}</Button></div>
          </article>
        ))}
        {!isLoading && total > 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
            <Button aria-label={t("previous_page")} size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</Button>
            <Select fullWidth={false} value={String(limit)} triggerAriaLabel={t("page_size")} options={[5, 10, 25, 50, 100].map((size) => ({ value: String(size), label: String(size) }))} onChange={(nextLimit) => onPageSizeChange(Number(nextLimit))} />
            <Button aria-label={t("next_page")} size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
