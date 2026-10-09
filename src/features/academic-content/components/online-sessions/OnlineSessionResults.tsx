"use client";

import {
  ArrowUpDown,
  CalendarClock,
  Clock3,
  Eye,
  MoreHorizontal,
  RefreshCw,
  UsersRound,
  Video,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Select from "@/components/ui/input/Select";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  onlineSessionDurationMinutes,
  onlineSessionSummary,
  onlineSessionTemporalState,
  type OnlineSessionTemporalState,
} from "../../model/onlineSessions";
import type { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import MeetingPlatformIcon from "../overview/MeetingPlatformIcon";

type Row = AcademicContentLibraryItem & Record<string, unknown>;
interface Props {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
  search: string;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
  hasFilters: boolean;
  now: Date;
  onOpen: (id: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

const TEMPORAL_STYLES: Record<OnlineSessionTemporalState, string> = {
  incomplete: "bg-gray-100 text-gray-700",
  live: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-amber-50 text-amber-700",
  ended: "bg-violet-50 text-violet-700",
};

function Pagination(
  props: Pick<
    Props,
    "page" | "limit" | "total" | "onPageChange" | "onPageSizeChange"
  >,
) {
  const t = useAcademicContentTranslations("online_sessions");
  return (
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
        options={[5, 10, 25, 50, 100].map((size) => ({
          value: String(size),
          label: String(size),
        }))}
        onChange={(value) => props.onPageSizeChange(Number(value))}
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
}

export default function OnlineSessionResults(props: Props) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("online_sessions");
  const platformT = useAcademicContentTranslations("platforms");
  const audienceT = useAcademicContentTranslations("audiences");
  const formatDate = (instant: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(instant));
  const formatDuration = (item: AcademicContentLibraryItem) => {
    const minutes = onlineSessionDurationMinutes(item);
    if (!minutes) return t("unavailable");
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return hours
      ? t("duration_hours", { hours, minutes: remaining })
      : t("duration_minutes", { minutes });
  };
  const platform = (item: AcademicContentLibraryItem) => {
    const summary = onlineSessionSummary(item);
    return summary ? (
      <span className="inline-flex items-center gap-2">
        <MeetingPlatformIcon platform={summary.platform} />
        <span className="text-sm font-medium text-gray-800">
          {platformT(summary.platform)}
        </span>
      </span>
    ) : (
      <span className="text-sm text-gray-500">{t("incomplete_setup")}</span>
    );
  };
  const timing = (item: AcademicContentLibraryItem) => {
    const summary = onlineSessionSummary(item);
    return summary ? (
      <div className="min-w-44">
        <time
          dateTime={summary.startAt}
          className="block font-medium text-gray-900"
        >
          {formatDate(summary.startAt)}
        </time>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {formatDuration(item)}
        </span>
      </div>
    ) : (
      <span className="text-sm text-gray-500">{t("incomplete_setup")}</span>
    );
  };
  const temporal = (item: AcademicContentLibraryItem) => {
    const state = onlineSessionTemporalState(item, props.now);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${TEMPORAL_STYLES[state]}`}
      >
        <CalendarClock aria-hidden="true" className="size-3.5" />
        {t(`temporal.${state}`)}
      </span>
    );
  };
  const audience = (item: AcademicContentLibraryItem) => (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      <UsersRound aria-hidden="true" className="size-3.5" />
      {audienceT(item.audience)}
    </span>
  );
  const actions = (item: AcademicContentLibraryItem) => (
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
            onClick: () => props.onOpen(item.id),
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
          icon={<Video aria-hidden="true" className="size-10" />}
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
      label: t("columns.session"),
      searchable: true,
      render: (_, item) => (
        <div className="min-w-56">
          <p className="font-semibold text-gray-950">{item.title}</p>
          {item.description ? (
            <RichTextContent
              value={item.description}
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
      key: "platform",
      label: t("columns.platform"),
      render: (_, item) => platform(item),
    },
    {
      key: "startAt",
      label: t("columns.date_time"),
      render: (_, item) => timing(item),
    },
    {
      key: "audience",
      label: t("columns.audience"),
      render: (_, item) => audience(item),
    },
    {
      key: "temporal",
      label: t("columns.time_state"),
      render: (_, item) => temporal(item),
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (_, item) => <AcademicContentStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: t("columns.actions"),
      render: (_, item) => actions(item),
    },
  ];
  const cards = (
    <div className="grid gap-4 sm:grid-cols-2">
      {props.isLoading ? (
        <div
          role="status"
          className="col-span-full rounded-xl bg-white p-6 text-sm text-gray-500"
        >
          {t("loading")}
        </div>
      ) : (
        props.items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              {platform(item)}
              {actions(item)}
            </div>
            <button
              type="button"
              className="mt-3 text-start text-base font-semibold text-gray-950 hover:text-primary"
              onClick={() => props.onOpen(item.id)}
            >
              {item.title}
            </button>
            {item.description ? (
              <RichTextContent
                value={item.description}
                className="mt-2 line-clamp-2 text-sm text-gray-500"
              />
            ) : null}
            <div className="mt-4">{timing(item)}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              {audience(item)}
              {temporal(item)}
              <AcademicContentStatusBadge status={item.status} />
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
        <span className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 sm:inline-flex">
          <ArrowUpDown aria-hidden="true" className="size-4" />
          {t("last_updated")}
        </span>
      </div>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={props.items as Row[]}
          getRowKey={(item) => item.id}
          onRowClick={(item) => props.onOpen(item.id)}
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
      {props.total > 0 ? (
        <div className="md:hidden">
          <Pagination {...props} />
        </div>
      ) : null}
    </section>
  );
}
