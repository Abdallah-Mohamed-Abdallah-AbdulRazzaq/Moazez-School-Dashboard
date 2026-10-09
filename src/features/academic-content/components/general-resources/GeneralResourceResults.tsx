"use client";

import {
  ArrowUpDown,
  Eye,
  FolderOpen,
  Grid2X2,
  List,
  MoreHorizontal,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Select from "@/components/ui/input/Select";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { GeneralResourceView } from "../../model/generalResources";
import type { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";

type Row = AcademicContentLibraryItem & Record<string, unknown>;
interface Props {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  search: string;
  view: GeneralResourceView;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
  hasFilters: boolean;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onViewChange: (view: GeneralResourceView) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

export default function GeneralResourceResults(props: Props) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("general_resources");
  const audienceT = useAcademicContentTranslations("audiences");
  const formatDate = (instant: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant));
  const audienceBadge = (resource: AcademicContentLibraryItem) => (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
      <UsersRound aria-hidden="true" className="size-3.5" />
      {audienceT(resource.audience)}
    </span>
  );
  const actions = (resource: AcademicContentLibraryItem) => (
    <div data-row-action onClick={(event) => event.stopPropagation()}>
      <DropdownMenu
        width="w-48"
        trigger={
          <button
            type="button"
            aria-label={t("actions.open_menu")}
            className="cursor-pointer rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </button>
        }
        items={[
          {
            label: t("actions.open"),
            value: "open",
            icon: <Eye aria-hidden="true" className="size-4" />,
            onClick: () => props.onOpen(resource.id),
          },
        ]}
      />
    </div>
  );

  if (props.error)
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
  if (!props.isLoading && props.total === 0)
    return (
      <section className="rounded-xl bg-white shadow-sm">
        <EmptyState
          title={t(props.hasFilters ? "filtered_empty_title" : "empty_title")}
          message={t(
            props.hasFilters
              ? "filtered_empty_description"
              : "empty_description",
          )}
          icon={<FolderOpen aria-hidden="true" className="size-10" />}
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

  const columns: Column<Row>[] = [
    {
      key: "title",
      label: t("columns.resource"),
      searchable: true,
      render: (_, resource) => (
        <div className="min-w-64">
          <p className="font-semibold text-gray-950">{resource.title}</p>
          {resource.description ? (
            <RichTextContent
              value={resource.description}
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
      render: (_, resource) => audienceBadge(resource),
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (_, resource) => (
        <AcademicContentStatusBadge status={resource.status} />
      ),
    },
    {
      key: "updatedAt",
      label: t("columns.updated"),
      render: (instant) => (
        <time dateTime={String(instant)}>{formatDate(String(instant))}</time>
      ),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      render: (_, resource) => actions(resource),
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
        props.items.map((resource) => (
          <article
            key={resource.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <FolderOpen aria-hidden="true" className="size-5" />
              </span>
              {actions(resource)}
            </div>
            <button
              type="button"
              className="mt-3 cursor-pointer text-start text-base font-semibold text-gray-950 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => props.onOpen(resource.id)}
            >
              {resource.title}
            </button>
            {resource.description ? (
              <RichTextContent
                value={resource.description}
                className="mt-2 line-clamp-2 text-sm text-gray-500"
              />
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
              {audienceBadge(resource)}
              <AcademicContentStatusBadge status={resource.status} />
            </div>
            <time
              className="mt-3 block text-xs text-gray-500"
              dateTime={resource.updatedAt}
            >
              {formatDate(resource.updatedAt)}
            </time>
          </article>
        ))
      )}
    </div>
  );
  const pagination = (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
      <Button
        aria-label={t("previous_page")}
        size="sm"
        variant="secondary"
        disabled={props.page <= 1}
        onClick={() => props.onPageChange(props.page - 1)}
      >
        ‹
      </Button>
      <Select
        fullWidth={false}
        value={String(props.limit)}
        triggerAriaLabel={t("page_size")}
        options={[5, 10, 25, 50, 100].map((pageSize) => ({
          value: String(pageSize),
          label: String(pageSize),
        }))}
        onChange={(pageSize) => props.onPageSizeChange(Number(pageSize))}
      />
      <Button
        aria-label={t("next_page")}
        size="sm"
        variant="secondary"
        disabled={
          props.page >= Math.max(1, Math.ceil(props.total / props.limit))
        }
        onClick={() => props.onPageChange(props.page + 1)}
      >
        ›
      </Button>
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
              data={props.items as Row[]}
              getRowKey={(resource) => resource.id}
              onRowClick={(resource) => props.onOpen(resource.id)}
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
          {pagination}
        </div>
      ) : null}
    </section>
  );
}
