"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, FilterPanel, Select } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import {
  mapDashboardAlertsToViewModel,
  type DashboardAlertsViewModel,
  type DashboardDeferredFeature,
  type DashboardTone,
  type DashboardViewAlert,
} from "@/features/dashboard/mappers/dashboardViewMapper";
import { fetchDashboardAlerts } from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardAlertsQuery,
  DashboardAlertSeverity,
  DashboardSource,
} from "@/features/dashboard/types/dashboardApi.types";

type DashboardAlertSource = Exclude<DashboardSource, "students">;

interface DashboardAlertFilters {
  source: "" | DashboardAlertSource;
  severity: "" | DashboardAlertSeverity;
  limit: string;
  includeZeroCount: boolean;
}

type DashboardAlertsLoadState =
  | { status: "loading" }
  | { status: "success"; alertsViewModel: DashboardAlertsViewModel }
  | { status: "error"; message: string };

const defaultAlertFilters: DashboardAlertFilters = {
  source: "",
  severity: "",
  limit: "20",
  includeZeroCount: false,
};

const severityRank: Record<DashboardAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const toneStyles: Record<
  DashboardTone,
  { bg: string; text: string; dot: string; border: string }
> = {
  critical: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  info: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    border: "border-cyan-200",
  },
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  neutral: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-400",
    border: "border-gray-200",
  },
};

export default function DashboardAlertsPage() {
  return (
    <DashboardPermissionGuard permission="dashboard.alerts.view">
      <DashboardAlertsContent />
    </DashboardPermissionGuard>
  );
}

function DashboardAlertsContent() {
  const { isInitializing } = useAcademicYearTermLayoutContext();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard_new");
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] =
    useState<DashboardAlertFilters>(defaultAlertFilters);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadState, setLoadState] = useState<DashboardAlertsLoadState>({
    status: "loading",
  });

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    let shouldIgnoreResponse = false;

    fetchDashboardAlerts(alertQueryFromFilters(filters))
      .then((alertsResponse) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setLoadState({
          status: "success",
          alertsViewModel: mapDashboardAlertsToViewModel(alertsResponse),
        });
        setIsFiltering(false);
      })
      .catch((alertsError: unknown) => {
        if (shouldIgnoreResponse) {
          return;
        }

        setLoadState({
          status: "error",
          message: dashboardAlertsErrorMessage(alertsError, t),
        });
        setIsFiltering(false);
      });

    return () => {
      shouldIgnoreResponse = true;
    };
  }, [filters, isInitializing, t]);

  const updateFilter = useCallback(
    <TKey extends keyof DashboardAlertFilters>(
      filterName: TKey,
      filterValue: DashboardAlertFilters[TKey],
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
    setFilters(defaultAlertFilters);
  }, [filters]);

  if (isInitializing || loadState.status === "loading") {
    return <MainLoader />;
  }

  if (loadState.status === "error") {
    return (
      <DashboardAlertsErrorPanel
        dashboardHref={dashboardPath(pathname)}
        locale={locale}
        message={loadState.message}
        t={t}
      />
    );
  }

  return (
    <DashboardAlertsView
      alertsViewModel={loadState.alertsViewModel}
      dashboardHref={dashboardPath(pathname)}
      filters={filters}
      hasActiveFilters={hasActiveFilters(filters)}
      isFiltering={isFiltering}
      locale={locale}
      showFilters={showFilters}
      pathname={pathname}
      t={t}
      onFilterChange={updateFilter}
      onResetFilters={resetFilters}
      onToggleFilters={() => setShowFilters((currentValue) => !currentValue)}
    />
  );
}

function DashboardAlertsView({
  alertsViewModel,
  dashboardHref,
  filters,
  hasActiveFilters,
  isFiltering,
  locale,
  showFilters,
  pathname,
  t,
  onFilterChange,
  onResetFilters,
  onToggleFilters,
}: {
  alertsViewModel: DashboardAlertsViewModel;
  dashboardHref: string;
  filters: DashboardAlertFilters;
  hasActiveFilters: boolean;
  isFiltering: boolean;
  locale: string;
  showFilters: boolean;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
  onFilterChange: <TKey extends keyof DashboardAlertFilters>(
    filterName: TKey,
    filterValue: DashboardAlertFilters[TKey],
  ) => void;
  onResetFilters: () => void;
  onToggleFilters: () => void;
}) {
  const sortedAlerts = dashboardAlertsByPriority(alertsViewModel.alerts);

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <DashboardAlertsHeader
        dashboardHref={dashboardHref}
        alertsViewModel={alertsViewModel}
        locale={locale}
        t={t}
      />

      <DashboardAlertsFilters
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
          <DashboardAlertsSkeleton t={t} />
        ) : sortedAlerts.length === 0 ? (
          <DashboardAlertsEmptyState t={t} />
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedAlerts.map((alertEntry) => (
              <DashboardAlertRow
                key={alertEntry.id}
                alertEntry={alertEntry}
                locale={locale}
                pathname={pathname}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {alertsViewModel.deferredFeatures.length > 0 ? (
        <DashboardAlertVersionNotes
          deferredFeatures={alertsViewModel.deferredFeatures}
          t={t}
        />
      ) : null}
    </main>
  );
}

function DashboardAlertsHeader({
  alertsViewModel,
  dashboardHref,
  locale,
  t,
}: {
  alertsViewModel: DashboardAlertsViewModel;
  dashboardHref: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <header className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <Link
        href={dashboardHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-hover"
      >
        <BackIcon className="h-4 w-4" />
        {t("common.back_to_dashboard")}
      </Link>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">
            {t("alerts_page.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("alerts_page.description")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600 sm:grid-cols-4">
          <AlertSummaryPill
            label={t("alerts_page.summary.total")}
            value={alertsViewModel.summary.total}
            locale={locale}
          />
          <AlertSummaryPill
            label={t("alerts_page.summary.critical")}
            value={alertsViewModel.summary.critical}
            locale={locale}
          />
          <AlertSummaryPill
            label={t("alerts_page.summary.warnings")}
            value={alertsViewModel.summary.warning}
            locale={locale}
          />
          <AlertSummaryPill
            label={t("alerts_page.summary.info")}
            value={alertsViewModel.summary.info}
            locale={locale}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        {t("alerts_page.showing", {
          definitions: alertsViewModel.alerts.length,
          signals: alertsViewModel.summary.total,
        })}
      </p>
    </header>
  );
}

function AlertSummaryPill({
  label,
  locale,
  value,
}: {
  label: string;
  locale: string;
  value: number;
}) {
  return (
    <span className="rounded-lg bg-gray-50 px-3 py-2 text-center">
      {label}: {value.toLocaleString(locale === "ar" ? "ar-EG" : "en")}
    </span>
  );
}

function DashboardAlertsFilters({
  filters,
  hasActiveFilters,
  showFilters,
  t,
  onFilterChange,
  onResetFilters,
  onToggleFilters,
}: {
  filters: DashboardAlertFilters;
  hasActiveFilters: boolean;
  showFilters: boolean;
  t: ReturnType<typeof useTranslations>;
  onFilterChange: <TKey extends keyof DashboardAlertFilters>(
    filterName: TKey,
    filterValue: DashboardAlertFilters[TKey],
  ) => void;
  onResetFilters: () => void;
  onToggleFilters: () => void;
}) {
  const sourceOptions = dashboardSourceOptions(t, false);
  const severityOptions = [
    { value: "", label: t("filters.all_severities") },
    { value: "critical", label: t("severity.critical") },
    { value: "warning", label: t("severity.warning") },
    { value: "info", label: t("severity.info") },
  ];
  const limitOptions = [5, 20, 50, 100].map((limitValue) => ({
    value: String(limitValue),
    label: t("filters.alert_limit", { count: limitValue }),
  }));

  return (
    <FilterPanel
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={t("filters.title")}
      toggleAriaLabel={t("filters.toggle_alerts")}
      className="mb-5 border border-gray-200"
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
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label={t("filters.source")}
            value={filters.source}
            onChange={(value) =>
              onFilterChange("source", value as DashboardAlertFilters["source"])
            }
            options={sourceOptions}
          />
          <Select
            label={t("filters.severity")}
            value={filters.severity}
            onChange={(value) =>
              onFilterChange(
                "severity",
                value as DashboardAlertFilters["severity"],
              )
            }
            options={severityOptions}
          />
          <Select
            label={t("filters.limit")}
            value={filters.limit}
            onChange={(value) => onFilterChange("limit", value)}
            options={limitOptions}
          />
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={filters.includeZeroCount}
              onChange={(event) =>
                onFilterChange("includeZeroCount", event.target.checked)
              }
            />
            {t("filters.include_zero_count")}
          </label>
        </div>
      }
    />
  );
}

function DashboardAlertsSkeleton({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div
      aria-label={t("alerts_page.loading")}
      className="divide-y divide-gray-100"
    >
      {Array.from({ length: 5 }).map((_, skeletonIndex) => (
        <div key={skeletonIndex} className="flex gap-3 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="w-full space-y-3">
            <div className="h-4 w-2/5 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardAlertRow({
  alertEntry,
  locale,
  pathname,
  t,
}: {
  alertEntry: DashboardViewAlert;
  locale: string;
  pathname: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const toneStyle = toneStyles[alertEntry.tone];

  return (
    <article className="flex flex-col gap-4 py-4 md:flex-row md:items-start md:justify-between">
      <div className="flex gap-3">
        <div
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${toneStyle.border} ${toneStyle.bg} ${toneStyle.text}`}
        >
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-950">
            {alertEntry.title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {alertEntry.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium text-gray-500">
            <span
              className={`rounded-full px-2 py-0.5 ${toneStyle.bg} ${toneStyle.text}`}
            >
              {t(`severity.${alertEntry.severity}`)}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {t(`sources.${alertEntry.source}`)}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {t("alerts_page.count", {
                count: alertEntry.count.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en",
                ),
              })}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              {alertEntry.id}
            </span>
          </div>
        </div>
      </div>
      {alertEntry.actionLabel && alertEntry.actionTarget ? (
        <Link
          href={localizedPath(pathname, alertEntry.actionTarget)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-hover"
        >
          {alertEntry.actionLabel}
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : null}
    </article>
  );
}

function DashboardAlertsEmptyState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
      <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" />
      <p className="text-sm font-semibold text-gray-800">
        {t("alerts_page.empty_title")}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {t("alerts_page.empty_description")}
      </p>
    </div>
  );
}

function DashboardAlertVersionNotes({
  deferredFeatures,
  t,
}: {
  deferredFeatures: DashboardDeferredFeature[];
  t: ReturnType<typeof useTranslations>;
}) {
  const shouldScrollVersionNotes = deferredFeatures.length > 7;

  return (
    <aside className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-950">
        {t("dashboard.version_notes")}
      </h2>
      <div
        className={`mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 ${
          shouldScrollVersionNotes
            ? "max-h-[28rem] overflow-y-auto pr-2"
            : ""
        }`}
      >
        {deferredFeatures.map((feature) => (
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
  );
}

function DashboardAlertsErrorPanel({
  dashboardHref,
  message,
  locale,
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
          {t("alerts_page.unavailable")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          {t("alerts_page.load_failed")}
        </h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </section>
    </main>
  );
}

function dashboardAlertsByPriority(alerts: DashboardViewAlert[]) {
  return [...alerts].sort((firstAlert, secondAlert) => {
    const severityDelta =
      severityRank[firstAlert.severity] - severityRank[secondAlert.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    const sourceDelta = firstAlert.source.localeCompare(secondAlert.source);
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return firstAlert.id.localeCompare(secondAlert.id);
  });
}

function dashboardPath(pathname: string) {
  return pathname.replace(/\/dashboard\/alerts\/?$/, "/dashboard");
}

function alertQueryFromFilters(
  filters: DashboardAlertFilters,
): DashboardAlertsQuery {
  return {
    source: filters.source || undefined,
    severity: filters.severity || undefined,
    limit: Number(filters.limit),
    includeZeroCount: filters.includeZeroCount || undefined,
  };
}

function hasActiveFilters(filters: DashboardAlertFilters) {
  return (
    Boolean(filters.source) ||
    Boolean(filters.severity) ||
    filters.limit !== defaultAlertFilters.limit ||
    filters.includeZeroCount
  );
}

function localizedPath(pathname: string, targetPath: string) {
  if (!targetPath.startsWith("/")) {
    return targetPath;
  }

  const localePrefix = localePathPrefix(pathname);
  if (!localePrefix || targetPath.startsWith(`${localePrefix}/`)) {
    return targetPath;
  }

  return `${localePrefix}${targetPath}`;
}

function localePathPrefix(pathname: string) {
  const firstPathSegment = pathname.split("/")[1];

  if (!firstPathSegment || !/^[a-z]{2}(-[A-Z]{2})?$/.test(firstPathSegment)) {
    return "";
  }

  return `/${firstPathSegment}`;
}

function dashboardSourceOptions(
  t: ReturnType<typeof useTranslations>,
  includeStudents: boolean,
) {
  const sources: DashboardSource[] = [
    "admissions",
    ...(includeStudents ? (["students"] as const) : []),
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

function dashboardAlertsErrorMessage(
  alertsError: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  if (alertsError instanceof Error && alertsError.message) {
    return alertsError.message;
  }

  return t("alerts_page.default_error");
}
