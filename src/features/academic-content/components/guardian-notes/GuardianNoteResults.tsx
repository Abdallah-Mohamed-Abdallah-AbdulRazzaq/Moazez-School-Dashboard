"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  Eye,
  Grid2X2,
  List,
  MessageSquareText,
  MoreHorizontal,
  RefreshCw,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Select from "@/components/ui/input/Select";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { GuardianNoteView } from "../../model/guardianNotes";
import type { academicContentUiError } from "../../services/academicContentErrors";
import type {
  AcademicContentLibraryItem,
  AcademicGuardianNotePriority,
} from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";

type GuardianNoteRow = AcademicContentLibraryItem & Record<string, unknown>;

interface GuardianNoteResultsProps {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  search: string;
  view: GuardianNoteView;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
  hasFilters: boolean;
  onOpen: (contentId: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onViewChange: (view: GuardianNoteView) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

const PRIORITY_STYLES: Record<AcademicGuardianNotePriority, string> = {
  NORMAL: "bg-blue-50 text-blue-700",
  IMPORTANT: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-red-700",
};

function guardianSummary(note: AcademicContentLibraryItem) {
  return note.summary?.type === "GUARDIAN_WEEKLY_NOTE" ? note.summary : null;
}

function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
}: Pick<
  GuardianNoteResultsProps,
  "page" | "limit" | "total" | "onPageChange" | "onPageSizeChange"
>) {
  const t = useAcademicContentTranslations("guardian_notes");
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
      <Button
        aria-label={t("previous_page")}
        size="sm"
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </Button>
      <Select
        fullWidth={false}
        value={String(limit)}
        triggerAriaLabel={t("page_size")}
        options={[5, 10, 25, 50, 100].map((size) => ({
          value: String(size),
          label: String(size),
        }))}
        onChange={(value) => onPageSizeChange(Number(value))}
      />
      <Button
        aria-label={t("next_page")}
        size="sm"
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </Button>
    </div>
  );
}

export default function GuardianNoteResults(props: GuardianNoteResultsProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("guardian_notes");
  const formatDate = (instant: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant));
  const audienceBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
      <UsersRound aria-hidden="true" className="size-3.5" />
      {t("guardians")}
    </span>
  );
  const priorityBadge = (note: AcademicContentLibraryItem) => {
    const priority = guardianSummary(note)?.priority;
    return priority ? (
      <span
        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
      >
        {t(`priorities.${priority}`)}
      </span>
    ) : (
      <span className="text-sm text-gray-500">{t("unavailable")}</span>
    );
  };
  const acknowledgement = (note: AcademicContentLibraryItem) => {
    const summary = guardianSummary(note);
    if (!summary) {
      return <span className="text-sm text-gray-500">{t("unavailable")}</span>;
    }
    const required = summary.requiresAcknowledgement;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-medium ${required ? "text-amber-700" : "text-gray-500"}`}
      >
        {required ? (
          <CheckCircle2 aria-hidden="true" className="size-4" />
        ) : (
          <XCircle aria-hidden="true" className="size-4" />
        )}
        {t(
          required
            ? "acknowledgement.required"
            : "acknowledgement.not_required",
        )}
      </span>
    );
  };
  const actions = (note: AcademicContentLibraryItem) => (
    <div data-row-action onClick={(event) => event.stopPropagation()}>
      <DropdownMenu
        width="w-48"
        trigger={
          <button
            type="button"
            aria-label={t("actions.open_menu")}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </button>
        }
        items={[
          {
            label: t("actions.open"),
            value: "open",
            icon: <Eye aria-hidden="true" className="size-4" />,
            onClick: () => props.onOpen(note.id),
          },
        ]}
      />
    </div>
  );

  if (props.error) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-white shadow-sm"
      >
        <EmptyState
          title={t("unavailable_title")}
          message={props.error.message}
          icon={<RefreshCw aria-hidden="true" className="size-10" />}
          action={<Button onClick={props.onRetry}>{t("retry")}</Button>}
        />
      </section>
    );
  }
  if (!props.isLoading && props.total === 0) {
    return (
      <section className="rounded-xl bg-white shadow-sm">
        <EmptyState
          title={t(props.hasFilters ? "filtered_empty_title" : "empty_title")}
          message={t(
            props.hasFilters
              ? "filtered_empty_description"
              : "empty_description",
          )}
          icon={<MessageSquareText aria-hidden="true" className="size-10" />}
          action={
            props.hasFilters ? (
              <Button variant="secondary" onClick={props.onClearFilters}>
                {t("clear_filters")}
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  }

  const columns: Column<GuardianNoteRow>[] = [
    {
      key: "title",
      label: t("columns.note"),
      searchable: true,
      render: (_, note) => (
        <div className="min-w-56">
          <p className="font-semibold text-gray-950">{note.title}</p>
          {note.description ? (
            <RichTextContent
              value={note.description}
              className="mt-1 line-clamp-1 text-xs text-gray-500"
            />
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              {t("description_unavailable")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "audience",
      label: t("columns.audience"),
      render: () => audienceBadge,
    },
    {
      key: "priority",
      label: t("columns.priority"),
      render: (_, note) => priorityBadge(note),
    },
    {
      key: "acknowledgement",
      label: t("columns.acknowledgement"),
      render: (_, note) => acknowledgement(note),
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (_, note) => <AcademicContentStatusBadge status={note.status} />,
    },
    {
      key: "updatedAt",
      label: t("columns.updated"),
      render: (updatedAt) => (
        <time dateTime={String(updatedAt)}>
          {formatDate(String(updatedAt))}
        </time>
      ),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      render: (_, note) => actions(note),
    },
  ];
  const cards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.isLoading ? (
        <div
          role="status"
          className="col-span-full rounded-xl bg-white p-6 text-sm text-gray-500"
        >
          {t("loading")}
        </div>
      ) : (
        props.items.map((note) => (
          <article
            key={note.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              {priorityBadge(note)}
              {actions(note)}
            </div>
            <button
              type="button"
              className="mt-3 text-start text-base font-semibold text-gray-950 hover:text-primary"
              onClick={() => props.onOpen(note.id)}
            >
              {note.title}
            </button>
            {note.description ? (
              <RichTextContent
                value={note.description}
                className="mt-2 line-clamp-2 text-sm text-gray-500"
              />
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {audienceBadge}
              {acknowledgement(note)}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <AcademicContentStatusBadge status={note.status} />
              <time className="text-xs text-gray-500" dateTime={note.updatedAt}>
                {formatDate(note.updatedAt)}
              </time>
            </div>
          </article>
        ))
      )}
    </div>
  );

  return (
    <section
      aria-label={t("results", { count: props.total })}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-b-0 border-gray-200 bg-white px-4 py-3">
        <h2 className="font-semibold text-gray-950">
          {t("results", { count: props.total })}
        </h2>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 sm:inline-flex">
            <ArrowUpDown aria-hidden="true" className="size-4" />
            {t("last_updated")}
          </span>
          <div
            className="flex rounded-lg border border-gray-200 bg-white p-1"
            aria-label={t("view_options")}
          >
            <Button
              size="sm"
              variant={props.view === "table" ? "primary" : "ghost"}
              aria-label={t("table_view")}
              onClick={() => props.onViewChange("table")}
            >
              <List aria-hidden="true" className="size-4" />
            </Button>
            <Button
              size="sm"
              variant={props.view === "grid" ? "primary" : "ghost"}
              aria-label={t("grid_view")}
              onClick={() => props.onViewChange("grid")}
            >
              <Grid2X2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {props.view === "table" ? (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={props.items as GuardianNoteRow[]}
              getRowKey={(note) => note.id}
              onRowClick={(note) => props.onOpen(note.id)}
              isLoading={props.isLoading}
              searchQuery={props.search}
              showDensityToggle={false}
              serverPagination={{
                enabled: true,
                currentPage: props.page,
                pageSize: props.limit,
                totalItems: props.total,
                onPageChange: props.onPageChange,
                onPageSizeChange: props.onPageSizeChange,
              }}
            />
          </div>
          <div className="md:hidden">{cards}</div>
        </>
      ) : (
        cards
      )}
      {props.total > 0 ? (
        <div className={props.view === "table" ? "md:hidden" : undefined}>
          <Pagination {...props} />
        </div>
      ) : null}
    </section>
  );
}
