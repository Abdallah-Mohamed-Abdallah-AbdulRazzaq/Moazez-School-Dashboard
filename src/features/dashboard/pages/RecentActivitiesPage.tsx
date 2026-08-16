"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Activity, ArrowLeft, ArrowRight, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, DatePicker, FilterPanel, Input, Select } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import {
  appendDashboardActivityFeedPage,
  mapDashboardActivityFeedToViewModel,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import type {
  DashboardActivityFeedViewModel,
  DashboardViewActivity,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import { fetchDashboardActivityFeed } from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardActivityFeedQuery,
  DashboardActorType,
  DashboardSource,
} from "@/features/dashboard/types/dashboardApi.types";

interface RecentActivityFilters {
  source: "" | DashboardSource;
  eventType: string;
  actorType: "" | DashboardActorType;
  dateFrom: Date | null;
  dateTo: Date | null;
  limit: string;
}

type RecentActivitiesLoadState =
  | { status: "loading" }
  | {
      status: "success";
      activityFeed: DashboardActivityFeedViewModel;
      isLoadingMore: boolean;
      loadMoreError: string | null;
    }
  | { status: "error"; message: string };

const defaultRecentActivityFilters: RecentActivityFilters = {
  source: "",
  eventType: "",
  actorType: "",
  dateFrom: null,
  dateTo: null,
  limit: "20",
};

export default function RecentActivitiesPage() {
  return (
    <DashboardPermissionGuard permission="dashboard.activity_feed.view">
      <RecentActivitiesContent />
    </DashboardPermissionGuard>
  );
}

function RecentActivitiesContent() {
  const { isInitializing } = useAcademicYearTermLayoutContext();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard_new");
  const isMountedRef = useRef(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<RecentActivityFilters>(
    defaultRecentActivityFilters,
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadState, setLoadState] = useState<RecentActivitiesLoadState>({
    status: "loading",
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    let shouldIgnoreResponse = false;

    fetchDashboardActivityFeed(activityQueryFromFilters(filters))
      .then((activityFeedResponse) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setLoadState({
          status: "success",
          activityFeed: mapDashboardActivityFeedToViewModel(activityFeedResponse),
          isLoadingMore: false,
          loadMoreError: null,
        });
        setIsFiltering(false);
      })
      .catch((activityFeedError: unknown) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setLoadState({
          status: "error",
          message: recentActivitiesErrorMessage(activityFeedError, t),
        });
        setIsFiltering(false);
      });

    return () => {
      shouldIgnoreResponse = true;
    };
  }, [filters, isInitializing, t]);

  const loadNextActivityPage = useCallback(() => {
    if (
      loadState.status !== "success" ||
      loadState.isLoadingMore ||
      !loadState.activityFeed.pageInfo.nextCursor
    ) {
      return;
    }

    const nextCursor = loadState.activityFeed.pageInfo.nextCursor;
    const nextPageQuery = activityQueryFromFilters(filters, nextCursor);

    setLoadState({
      ...loadState,
      isLoadingMore: true,
      loadMoreError: null,
    });

    fetchDashboardActivityFeed(nextPageQuery)
      .then((activityFeedResponse) => {
        if (!isMountedRef.current) {
          return;
        }

        setLoadState((latestState) => {
          if (latestState.status !== "success") {
            return latestState;
          }

          return {
            status: "success",
            activityFeed: appendDashboardActivityFeedPage(
              latestState.activityFeed,
              activityFeedResponse,
            ),
            isLoadingMore: false,
            loadMoreError: null,
          };
        });
      })
      .catch((activityFeedError: unknown) => {
        if (!isMountedRef.current) {
          return;
        }

        setLoadState((latestState) => {
          if (latestState.status !== "success") {
            return latestState;
          }

          return {
            ...latestState,
            isLoadingMore: false,
            loadMoreError: recentActivitiesErrorMessage(activityFeedError, t),
          };
        });
      });
  }, [filters, loadState, t]);

  const updateFilter = useCallback(
    <TKey extends keyof RecentActivityFilters>(
      filterName: TKey,
      filterValue: RecentActivityFilters[TKey],
    ) => {
      setIsFiltering(true);
      setFilters((currentFilters) => ({
        ...currentFilters,
        [filterName]: filterValue,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    if (!hasActiveFilters(filters)) {
      return;
    }

    setIsFiltering(true);
    setFilters(defaultRecentActivityFilters);
  }, [filters]);

  if (isInitializing || loadState.status === "loading") {
    return <MainLoader />;
  }

  if (loadState.status === "error") {
    return (
      <RecentActivitiesErrorPanel
        dashboardHref={dashboardPath(pathname)}
        locale={locale}
        message={loadState.message}
        t={t}
      />
    );
  }

  return (
    <RecentActivitiesView
      activityFeed={loadState.activityFeed}
      dashboardHref={dashboardPath(pathname)}
      filters={filters}
      hasActiveFilters={hasActiveFilters(filters)}
      isFiltering={isFiltering}
      isLoadingMore={loadState.isLoadingMore}
      locale={locale}
      loadMoreError={loadState.loadMoreError}
      showFilters={showFilters}
      t={t}
      onFilterChange={updateFilter}
      onLoadMore={loadNextActivityPage}
      onResetFilters={resetFilters}
      onToggleFilters={() => setShowFilters((currentValue) => !currentValue)}
    />
  );
}

function RecentActivitiesView({
  activityFeed,
  dashboardHref,
  filters,
  hasActiveFilters,
  isFiltering,
  isLoadingMore,
  locale,
  loadMoreError,
  showFilters,
  t,
  onFilterChange,
  onLoadMore,
  onResetFilters,
  onToggleFilters,
}: {
  activityFeed: DashboardActivityFeedViewModel;
  dashboardHref: string;
  filters: RecentActivityFilters;
  hasActiveFilters: boolean;
  isFiltering: boolean;
  isLoadingMore: boolean;
  locale: string;
  loadMoreError: string | null;
  showFilters: boolean;
  t: ReturnType<typeof useTranslations>;
  onFilterChange: <TKey extends keyof RecentActivityFilters>(
    filterName: TKey,
    filterValue: RecentActivityFilters[TKey],
  ) => void;
  onLoadMore: () => void;
  onResetFilters: () => void;
  onToggleFilters: () => void;
}) {
  const canLoadMore =
    activityFeed.pageInfo.hasMore && !!activityFeed.pageInfo.nextCursor;
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-hover"
        >
          <BackIcon className="h-4 w-4" />
          {t("common.back_to_dashboard")}
        </Link>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">
              {t("activity_page.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t("activity_page.description")}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {t("activity_page.showing", { count: activityFeed.items.length })}
          </p>
        </div>
      </header>

      <RecentActivitiesFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        t={t}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        onToggleFilters={onToggleFilters}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {isFiltering ? (
          <RecentActivitiesSkeleton t={t} />
        ) : activityFeed.items.length === 0 ? (
          <RecentActivitiesEmptyState t={t} />
        ) : (
          <div className="divide-y divide-gray-100">
            {activityFeed.items.map((activityEntry) => (
              <RecentActivityRow
                key={activityEntry.id}
                activityEntry={activityEntry}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        )}

        {loadMoreError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadMoreError}
          </p>
        ) : null}

        {canLoadMore ? (
          <div className="mt-5 flex justify-center">
            <Button
              type="button"
              onClick={onLoadMore}
              loading={isLoadingMore}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              {t("activity_page.load_more")}
            </Button>
          </div>
        ) : null}
      </section>

      {activityFeed.deferredFeatures.length > 0 ? (
        <aside className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-950">
            {t("dashboard.version_notes")}
          </h2>
          <div
            className={`mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 ${
              activityFeed.deferredFeatures.length > 7
                ? "max-h-[28rem] overflow-y-auto pr-2"
                : ""
            }`}
          >
            {activityFeed.deferredFeatures.map((feature) => (
              <div
                key={feature.id}
                className="rounded-lg border border-dashed border-gray-200 p-3"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {feature.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}

function RecentActivitiesFilters({
  filters,
  hasActiveFilters,
  showFilters,
  t,
  onFilterChange,
  onResetFilters,
  onToggleFilters,
}: {
  filters: RecentActivityFilters;
  hasActiveFilters: boolean;
  showFilters: boolean;
  t: ReturnType<typeof useTranslations>;
  onFilterChange: <TKey extends keyof RecentActivityFilters>(
    filterName: TKey,
    filterValue: RecentActivityFilters[TKey],
  ) => void;
  onResetFilters: () => void;
  onToggleFilters: () => void;
}) {
  const sourceOptions = dashboardSourceOptions(t);
  const actorTypeOptions = [
    { value: "", label: t("filters.all_actor_types") },
    { value: "system", label: t("actor_types.system") },
    { value: "admin", label: t("actor_types.admin") },
    { value: "teacher", label: t("actor_types.teacher") },
    { value: "student", label: t("actor_types.student") },
    { value: "parent", label: t("actor_types.parent") },
    { value: "unknown", label: t("actor_types.unknown") },
  ];
  const limitOptions = [10, 20, 50, 100].map((limitValue) => ({
    value: String(limitValue),
    label: t("filters.page_size_limit", { count: limitValue }),
  }));

  return (
    <FilterPanel
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={t("filters.title")}
      toggleAriaLabel={t("filters.toggle_activities")}
      className="mb-5 border border-gray-200"
      searchSlot={
        <Input
          value={filters.eventType}
          onChange={(event) => onFilterChange("eventType", event.target.value)}
          placeholder={t("filters.event_type_placeholder")}
          helperText={t("filters.event_type_helper")}
        />
      }
      clearAction={
        <Button
          type="button"
          variant="outline"
          leftIcon={<X className="h-4 w-4" />}
          onClick={onResetFilters}
        >
          {t("filters.reset")}
        </Button>
      }
      filtersSlot={
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label={t("filters.source")}
            value={filters.source}
            onChange={(value) =>
              onFilterChange("source", value as RecentActivityFilters["source"])
            }
            options={sourceOptions}
          />
          <Select
            label={t("filters.actor_type")}
            value={filters.actorType}
            onChange={(value) =>
              onFilterChange(
                "actorType",
                value as RecentActivityFilters["actorType"],
              )
            }
            options={actorTypeOptions}
          />
          <DatePicker
            label={t("filters.from")}
            value={filters.dateFrom}
            onChange={(date) => onFilterChange("dateFrom", date)}
            maxDate={filters.dateTo ?? undefined}
          />
          <DatePicker
            label={t("filters.to")}
            value={filters.dateTo}
            onChange={(date) => onFilterChange("dateTo", date)}
            minDate={filters.dateFrom ?? undefined}
          />
          <Select
            label={t("filters.page_size")}
            value={filters.limit}
            onChange={(value) => onFilterChange("limit", value)}
            options={limitOptions}
          />
        </div>
      }
    />
  );
}

function RecentActivitiesSkeleton({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      aria-label={t("activity_page.loading")}
      className="divide-y divide-gray-100"
    >
      {Array.from({ length: 5 }).map((_, skeletonIndex) => (
        <div key={skeletonIndex} className="flex gap-3 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="w-full space-y-3">
            <div className="h-4 w-2/5 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="flex flex-wrap gap-2">
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-32 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-28 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivityRow({
  activityEntry,
  locale,
  t,
}: {
  activityEntry: DashboardViewActivity;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-950">
            {activityEntry.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {activityEntry.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {t(`sources.${activityEntry.source}`)}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {activityEntry.eventType}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {t(`actor_types.${activityEntry.actorType}`)}:{" "}
              {activityEntry.actorName}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {activityEntry.subjectType}: {activityEntry.subjectLabel}
            </span>
          </div>
        </div>
      </div>
      <time className="shrink-0 text-xs font-medium text-gray-500">
        {formatActivityDateTime(activityEntry.occurredAt, locale)}
      </time>
    </article>
  );
}

function RecentActivitiesEmptyState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
      <Activity className="mx-auto mb-2 h-7 w-7 text-gray-400" />
      <p className="text-sm font-semibold text-gray-800">
        {t("activity_page.empty_title")}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {t("activity_page.empty_description")}
      </p>
    </div>
  );
}

function RecentActivitiesErrorPanel({
  dashboardHref,
  locale,
  message,
  t,
}: {
  dashboardHref: string;
  locale: string;
  message: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-hover"
        >
          <BackIcon className="h-4 w-4" />
          {t("common.back_to_dashboard")}
        </Link>
        <p className="mt-5 text-sm font-semibold text-red-600">
          {t("activity_page.unavailable")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          {t("activity_page.load_failed")}
        </h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </section>
    </main>
  );
}

function dashboardPath(pathname: string) {
  return pathname.replace(/\/dashboard\/recent-activities\/?$/, "/dashboard");
}

function activityQueryFromFilters(
  filters: RecentActivityFilters,
  cursor?: string,
): DashboardActivityFeedQuery {
  return {
    source: filters.source || undefined,
    eventType: filters.eventType.trim() || undefined,
    actorType: filters.actorType || undefined,
    dateFrom: filters.dateFrom ? startOfDayIso(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? endOfDayIso(filters.dateTo) : undefined,
    limit: Number(filters.limit),
    cursor,
  };
}

function startOfDayIso(dateValue: Date) {
  const dateFrom = new Date(dateValue);
  dateFrom.setHours(0, 0, 0, 0);
  return dateFrom.toISOString();
}

function endOfDayIso(dateValue: Date) {
  const dateTo = new Date(dateValue);
  dateTo.setHours(23, 59, 59, 999);
  return dateTo.toISOString();
}

function hasActiveFilters(filters: RecentActivityFilters) {
  return (
    Boolean(filters.source) ||
    Boolean(filters.eventType.trim()) ||
    Boolean(filters.actorType) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.limit !== defaultRecentActivityFilters.limit
  );
}

function dashboardSourceOptions(t: ReturnType<typeof useTranslations>) {
  const sources: DashboardSource[] = [
    "admissions",
    "students",
    "academics",
    "attendance",
    "grades",
    "homework",
    "behavior",
    "reinforcement",
    "communication",
    "settings",
  ];

  return [
    { value: "", label: t("filters.all_sources") },
    ...sources.map((source) => ({
      value: source,
      label: t(`sources.${source}`),
    })),
  ];
}

function formatActivityDateTime(occurredAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(occurredAt));
}

function recentActivitiesErrorMessage(
  activityFeedError: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  if (activityFeedError instanceof Error && activityFeedError.message) {
    return activityFeedError.message;
  }

  return t("activity_page.default_error");
}
