"use client";

import {
  ArrowUpDown,
  CalendarDays,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Select from "@/components/ui/input/Select";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";

type WeeklyPlanRow = AcademicContentLibraryItem & Record<string, unknown>;

interface WeeklyPlanResultsProps {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  search: string;
  view: "table" | "calendar";
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
  hasFilters: boolean;
  onOpen: (contentId: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

function RowActions({
  plan,
  onOpen,
}: {
  plan: AcademicContentLibraryItem;
  onOpen: (id: string) => void;
}) {
  const t = useAcademicContentTranslations("weekly_plans");
  return (
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
            onClick: () => onOpen(plan.id),
          },
        ]}
      />
    </div>
  );
}

function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
}: Pick<
  WeeklyPlanResultsProps,
  "page" | "limit" | "total" | "onPageChange" | "onPageSizeChange"
>) {
  const t = useAcademicContentTranslations("weekly_plans");
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
        onChange={(nextLimit) => onPageSizeChange(Number(nextLimit))}
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

export default function WeeklyPlanResults(props: WeeklyPlanResultsProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("weekly_plans");
  const formatDate = (instant: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant));
  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(`${date}T00:00:00.000Z`),
    );
  const week = (plan: AcademicContentLibraryItem) =>
    plan.summary?.type === "WEEKLY_PLAN"
      ? `${formatDay(plan.summary.weekStartDate)} – ${formatDay(plan.summary.weekEndDate)}`
      : t("week_unavailable");

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
          icon={<CalendarDays aria-hidden="true" className="size-10" />}
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

  const audience = (plan: AcademicContentLibraryItem) => (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      <Users aria-hidden="true" className="size-3.5" />
      {t(`audiences.${plan.audience}`)}
    </span>
  );
  const columns: Column<WeeklyPlanRow>[] = [
    {
      key: "week",
      label: t("columns.week"),
      render: (_, plan) => (
        <span className="min-w-28 text-sm font-medium text-gray-800">
          {week(plan)}
        </span>
      ),
    },
    {
      key: "title",
      label: t("columns.plan"),
      searchable: true,
      render: (_, plan) => (
        <div className="min-w-52">
          <p className="font-semibold text-gray-950">{plan.title}</p>
          {plan.description ? (
            <RichTextContent
              value={plan.description}
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
      render: (_, plan) => audience(plan),
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (_, plan) => <AcademicContentStatusBadge status={plan.status} />,
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
      render: (_, plan) => <RowActions plan={plan} onOpen={props.onOpen} />,
    },
  ];

  const planCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.isLoading ? (
        <div
          role="status"
          className="col-span-full rounded-xl bg-white p-6 text-sm text-gray-500"
        >
          {t("loading")}
        </div>
      ) : (
        props.items.map((plan) => (
          <article
            key={plan.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-emerald-700">
                {week(plan)}
              </span>
              <RowActions plan={plan} onOpen={props.onOpen} />
            </div>
            <button
              type="button"
              className="mt-3 text-start text-base font-semibold text-gray-950 hover:text-primary"
              onClick={() => props.onOpen(plan.id)}
            >
              {plan.title}
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {audience(plan)}
              <AcademicContentStatusBadge status={plan.status} />
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
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          <ArrowUpDown aria-hidden="true" className="size-4" />
          {t("last_updated")}
        </span>
      </div>
      {props.view === "table" ? (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={props.items as WeeklyPlanRow[]}
              getRowKey={(plan) => plan.id}
              onRowClick={(plan) => props.onOpen(plan.id)}
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
          <div className="md:hidden">{planCards}</div>
        </>
      ) : (
        planCards
      )}
      {props.view === "calendar" && props.total > 0 ? (
        <Pagination {...props} />
      ) : null}
      {props.view === "table" && props.total > 0 ? (
        <div className="md:hidden">
          <Pagination {...props} />
        </div>
      ) : null}
    </section>
  );
}
