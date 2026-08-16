"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  BarChart3,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  FunnelChart,
  Funnel,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { Button, DatePicker, FilterPanel, Select } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import {
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { ApiError, isApiError } from "@/lib/api-error";
import type {
  DashboardAnalyticsCatalog,
  DashboardAnalyticsChart,
  DashboardAnalyticsChartDataResponse,
  DashboardAnalyticsChartDataQuery,
} from "@/features/dashboard/types/dashboardApi.types";

interface AnalyticsFilters {
  source: string;
  type: string;
  status: string;
}

const defaultFilters: AnalyticsFilters = {
  source: "",
  type: "",
  status: "available",
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
];

function defaultCustomDateRange() {
  const today = new Date();
  // Use midday so converting the values to an ISO date cannot shift them to
  // the previous calendar day in timezones east of UTC.
  const dateFrom = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );
  const dateTo = new Date(dateFrom);
  dateTo.setDate(dateTo.getDate() + 1);

  return { dateFrom, dateTo };
}

type ChartQuery = Omit<
  DashboardAnalyticsChartDataQuery,
  // year/term come from context and are injected at fetch time — never stored in user-editable state
  "academicYearId" | "termId" | "dateFrom" | "dateTo"
> & {
  dateFrom?: Date | string;
  dateTo?: Date | string;
};

interface ChartError {
  message: string;
  code?: string;
  fields?: string[];
  traceId?: string;
  hierarchyUnavailable?: boolean;
  reportingPeriodUnavailable?: boolean;
  granularityRangeInvalid?: boolean;
  clientValidation?: boolean;
}

type ChartDataState =
  | { status: "loading" }
  | { status: "success"; data: DashboardAnalyticsChartDataResponse }
  | { status: "error"; error: ChartError };

type HierarchyFilterKey =
  | "academicYearId"
  | "termId"
  | "gradeId"
  | "sectionId"
  | "classroomId";

function chartSupportsFilter(
  chart: DashboardAnalyticsChart,
  filter: HierarchyFilterKey,
) {
  return (
    chart.queryCapabilities?.supportedHierarchyFilters?.includes(filter) ??
    chart.filters?.includes(filter) ??
    false
  );
}

function chartSupportsTimeFilter(chart: DashboardAnalyticsChart) {
  return (
    chart.queryCapabilities?.timeFiltersApplicable ??
    chart.filters?.includes("range") ??
    false
  );
}

function chartSupportsGranularity(chart: DashboardAnalyticsChart) {
  return (
    chart.queryCapabilities?.granularityApplicable ??
    chart.filters?.includes("granularity") ??
    false
  );
}

function isUnavailableAnalyticsHierarchy(error: unknown): error is ApiError {
  return (
    isApiError(error) &&
    error.status === 404 &&
    error.code === "not_found" &&
    error.message === "Dashboard analytics hierarchy was not found"
  );
}

function isUnavailableReportingPeriod(
  error: unknown,
  query: ChartQuery,
): boolean {
  return (
    (query.range === "academic_year" || query.range === "term") &&
    isUnavailableAnalyticsHierarchy(error)
  );
}

function minimumGranularityDays(granularity: ChartQuery["granularity"]): number {
  if (granularity === "week") return 7;
  if (granularity === "month") return 28;
  return 0;
}

function customRangeError(query: ChartQuery): ChartError | null {
  if (query.range !== "custom") return null;
  if (!query.dateFrom || !query.dateTo) {
    return { message: "Custom analytics range requires both dates", fields: ["dateFrom", "dateTo"], clientValidation: true };
  }

  const start = new Date(query.dateFrom);
  const end = new Date(query.dateTo);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { message: "Analytics civil date is invalid", fields: ["dateFrom", "dateTo"], clientValidation: true };
  }

  const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (inclusiveDays < 1) {
    return { message: "Custom analytics range is reversed", fields: ["dateFrom", "dateTo"], clientValidation: true };
  }
  if (inclusiveDays > 366) {
    return { message: "Custom analytics range is too large", fields: ["dateFrom", "dateTo"], clientValidation: true };
  }
  return null;
}

function isGranularityRangeTooShort(query: ChartQuery): boolean {
  const minimumDays = minimumGranularityDays(query.granularity);
  if (!minimumDays) return false;

  if (query.range === "7d" || query.range === "30d" || query.range === "90d") {
    const days = Number.parseInt(query.range, 10);
    return days < minimumDays;
  }

  if (query.range !== "custom" || !query.dateFrom || !query.dateTo) return false;

  const start = new Date(query.dateFrom);
  const end = new Date(query.dateTo);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1 < minimumDays;
}

function isGranularityRangeValidationError(error: unknown): error is ApiError {
  return (
    isApiError(error) &&
    error.code === "validation.failed" &&
    (error.message === "Weekly analytics requires at least seven civil days" ||
      error.message === "Monthly analytics requires at least twenty-eight civil days")
  );
}

function analyticsValidationMessage(
  message: string | undefined,
  t: ReturnType<typeof useTranslations>,
): string | undefined {
  const messageKeys: Record<string, string> = {
    "Custom analytics range requires both dates": "analytics.custom_dates_required",
    "Custom analytics range is reversed": "analytics.custom_dates_reversed",
    "Custom analytics range is too large": "analytics.custom_dates_too_large",
    "Analytics civil date is invalid": "analytics.custom_dates_invalid",
    "Weekly analytics requires at least seven civil days": "analytics.short_range_error",
    "Monthly analytics requires at least twenty-eight civil days": "analytics.short_range_error",
  };
  const key = message ? messageKeys[message] : undefined;
  return key ? t(key) : message;
}

function defaultChartQuery(chart: DashboardAnalyticsChart): ChartQuery {
  const query: ChartQuery = {};

  if (chartSupportsTimeFilter(chart)) {
    query.range =
      chart.defaultRange ||
      chart.queryCapabilities?.supportedRanges?.[0] ||
      "30d";
  }

  if (chartSupportsGranularity(chart)) {
    query.granularity =
      chart.queryCapabilities?.supportedGranularities?.[0] || "day";
  }

  return query;
}

function reconcileChartQuery(
  chart: DashboardAnalyticsChart,
  query: ChartQuery,
): ChartQuery {
  const nextQuery = { ...query };

  if (chartSupportsTimeFilter(chart)) {
    nextQuery.range ??=
      chart.defaultRange ||
      chart.queryCapabilities?.supportedRanges?.[0] ||
      "30d";
  } else {
    delete nextQuery.range;
    delete nextQuery.dateFrom;
    delete nextQuery.dateTo;
  }

  if (chartSupportsGranularity(chart)) {
    nextQuery.granularity ??=
      chart.queryCapabilities?.supportedGranularities?.[0] || "day";
  } else {
    delete nextQuery.granularity;
  }

  // Remove filters the selected chart does not support.
  if (!chartSupportsFilter(chart, "gradeId")) delete nextQuery.gradeId;
  if (!chartSupportsFilter(chart, "sectionId")) delete nextQuery.sectionId;
  if (!chartSupportsFilter(chart, "classroomId")) delete nextQuery.classroomId;

  return nextQuery;
}

function formatChartQuery(
  query: ChartQuery,
  chart: DashboardAnalyticsChart,
  contextYearId: string,
  contextTermId: string,
): DashboardAnalyticsChartDataQuery {
  const formattedQuery: DashboardAnalyticsChartDataQuery = {};

  for (const [key, queryValue] of Object.entries(query)) {
    if (queryValue === undefined) continue;
    if (queryValue instanceof Date) {
      formattedQuery[key as keyof DashboardAnalyticsChartDataQuery] = queryValue
        .toISOString()
        .split("T")[0];
    } else {
      formattedQuery[key as keyof DashboardAnalyticsChartDataQuery] =
        queryValue;
    }
  }

  // Inject year/term from context — never from user-editable state.
  if (contextYearId && chartSupportsFilter(chart, "academicYearId")) {
    formattedQuery.academicYearId = contextYearId;
  }
  if (contextTermId && chartSupportsFilter(chart, "termId")) {
    formattedQuery.termId = contextTermId;
  }

  return formattedQuery;
}

interface DashboardAnalyticsChartFiltersProps {
  chart: DashboardAnalyticsChart;
  query: ChartQuery | undefined;
  catalog: DashboardAnalyticsCatalog | null;
  structureTree: StructureTree | null;
  locale: string;
  validationFields?: string[];
  validationMessage?: string;
  onQueryChange: (
    field: keyof ChartQuery,
    queryValue: ChartQuery[keyof ChartQuery],
  ) => void;
}

function DashboardAnalyticsChartFilters({
  chart,
  query,
  catalog,
  structureTree,
  locale,
  validationFields,
  validationMessage,
  onQueryChange,
}: DashboardAnalyticsChartFiltersProps) {
  const t = useTranslations("dashboard_new");
  if (!query) return null;

  const showRange = chartSupportsTimeFilter(chart);
  const showGranularity = chartSupportsGranularity(chart);
  const showGrade = chartSupportsFilter(chart, "gradeId");
  const showSection = chartSupportsFilter(chart, "sectionId");
  const showClassroom = chartSupportsFilter(chart, "classroomId");

  if (
    !showRange &&
    !showGranularity &&
    !showGrade &&
    !showSection &&
    !showClassroom
  ) {
    return null;
  }

  const chartRangeOptions = (
    chart.queryCapabilities?.supportedRanges ||
    chart.supportedRanges ||
    catalog?.supportedRanges ||
    []
  ).map((range) => ({
    value: range,
    label: t(`analytics.ranges.${range}`),
  }));

  const chartGranularityOptions = (
    chart.queryCapabilities?.supportedGranularities ||
    chart.supportedGranularities ||
    catalog?.supportedGranularities ||
    []
  ).map((granularity) => {
    const unavailable = isGranularityRangeTooShort({
      ...query,
      granularity,
    });
    return {
      value: granularity,
      label: t(`analytics.granularities.${granularity}`),
      disabled: unavailable,
    };
  });

  const granularityUnavailable = isGranularityRangeTooShort(query);

  const chartGradeOptions = [
    { value: "", label: t("analytics.all_grades") },
    ...(structureTree?.grades || []).map((grade) => ({
      value: grade.id,
      label: locale === "ar"
        ? (grade.nameAr || grade.nameEn || grade.name)
        : (grade.nameEn || grade.nameAr || grade.name),
    })),
  ];

  const chartSectionOptions = [
    { value: "", label: t("analytics.all_sections") },
    ...(structureTree?.sections || [])
      .filter((section) => !query.gradeId || section.gradeId === query.gradeId)
      .map((section) => ({
        value: section.id,
        label: locale === "ar"
          ? (section.nameAr || section.nameEn || section.name)
          : (section.nameEn || section.nameAr || section.name),
      })),
  ];

  const chartClassroomOptions = [
    { value: "", label: t("analytics.all_classrooms") },
    ...(structureTree?.classrooms || [])
      .filter(
        (classroom) =>
          !query.sectionId || classroom.sectionId === query.sectionId,
      )
      .map((classroom) => ({
        value: classroom.id,
        label: locale === "ar"
          ? (classroom.nameAr || classroom.nameEn || classroom.name)
          : (classroom.nameEn || classroom.nameAr || classroom.name),
      })),
  ];

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:grid-cols-2 md:grid-cols-3">
      {showRange && (
        <Select
          label={t("analytics.range")}
          value={query.range || ""}
          onChange={(range) => onQueryChange("range", range)}
          options={chartRangeOptions}
          error={validationFields?.includes("range") ? validationMessage : undefined}
        />
      )}
      {showGranularity && (
        <Select
          label={t("analytics.granularity")}
          value={query.granularity || ""}
          onChange={(granularity) => onQueryChange("granularity", granularity)}
          options={chartGranularityOptions}
          error={validationFields?.includes("granularity") ? validationMessage : undefined}
        />
      )}
      {showGranularity && granularityUnavailable && (
        <p className="col-span-full -mt-1 text-xs text-amber-700" role="status" aria-live="polite">
          {t("analytics.granularity_unavailable")}
        </p>
      )}
      {showGrade && (
        <Select
          label={t("analytics.grade")}
          value={query.gradeId || ""}
          onChange={(gradeId) => onQueryChange("gradeId", gradeId || undefined)}
          options={chartGradeOptions}
          error={validationFields?.includes("gradeId") ? validationMessage : undefined}
        />
      )}
      {showSection && (
        <Select
          label={t("analytics.section")}
          value={query.sectionId || ""}
          onChange={(sectionId) =>
            onQueryChange("sectionId", sectionId || undefined)
          }
          options={chartSectionOptions}
          error={validationFields?.includes("sectionId") ? validationMessage : undefined}
        />
      )}
      {showClassroom && (
        <Select
          label={t("analytics.classroom")}
          value={query.classroomId || ""}
          onChange={(classroomId) =>
            onQueryChange("classroomId", classroomId || undefined)
          }
          options={chartClassroomOptions}
          error={validationFields?.includes("classroomId") ? validationMessage : undefined}
        />
      )}
      {showRange && query.range === "custom" && (
        <div className="col-span-full grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DatePicker
            label={t("analytics.from")}
            value={
              query.dateFrom instanceof Date
                ? query.dateFrom
                : query.dateFrom
                  ? new Date(query.dateFrom)
                  : null
            }
            onChange={(dateFrom) =>
              onQueryChange("dateFrom", dateFrom ?? undefined)
            }
            maxDate={
              query.dateTo
                ? new Date(query.dateTo)
                : undefined
            }
            error={validationFields?.includes("dateFrom") ? validationMessage : undefined}
          />
          <DatePicker
            label={t("analytics.to")}
            value={
              query.dateTo instanceof Date
                ? query.dateTo
                : query.dateTo
                  ? new Date(query.dateTo)
                  : null
            }
            onChange={(dateTo) => onQueryChange("dateTo", dateTo ?? undefined)}
            minDate={
              query.dateFrom
                ? new Date(query.dateFrom)
                : undefined
            }
            maxDate={
              query.dateFrom
                ? new Date(new Date(query.dateFrom).getTime() + 365 * 86_400_000)
                : undefined
            }
            error={validationFields?.includes("dateTo") ? validationMessage : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardAnalyticsPage() {
  return (
    <DashboardPermissionGuard permission="dashboard.analytics.view">
      <DashboardAnalyticsContent />
    </DashboardPermissionGuard>
  );
}

function DashboardAnalyticsContent() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard_new");
  const isMountedRef = useRef(true);

  const {
    academicYearId: contextYearId,
    termId: contextTermId,
    refreshAcademicYears,
    refreshTerms,
    requestAcademicYearChange,
  } = useAcademicYearTermLayoutContext();

  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [catalog, setCatalog] = useState<DashboardAnalyticsCatalog | null>(
    null,
  );
  const [charts, setCharts] = useState<DashboardAnalyticsChart[]>([]);
  const [chartSummary, setChartSummary] = useState<{
    total: number;
    byStatus: Record<string, number>;
  } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(
    null,
  );
  const [chartDataStates, setChartDataStates] = useState<
    Record<string, ChartDataState>
  >({});
  const [showHierarchyRecoveryNotice, setShowHierarchyRecoveryNotice] =
    useState(false);
  const hierarchyRecoveryInProgressRef = useRef(false);

  // Helper to construct dashboard base href
  const dashboardHref = useMemo(() => {
    const segments = pathname.split("/");
    const dashboardIndex = segments.indexOf("dashboard");
    if (dashboardIndex !== -1) {
      return segments.slice(0, dashboardIndex + 1).join("/");
    }
    return `/${locale}/dashboard`;
  }, [pathname, locale]);

  const [chartQueries, setChartQueries] = useState<Record<string, ChartQuery>>(
    {},
  );

  // Sync structure tree when layout context values update
  useEffect(() => {
    if (contextYearId && contextTermId) {
      fetchStructureTree(contextYearId, contextTermId)
        .then((tree) => {
          setStructureTree(tree);
        })
        .catch((err) => {
          console.error("Failed to load academic structure tree:", err);
        });
    }
  }, [contextYearId, contextTermId]);

  const resolvedChartQueries = useMemo(
    () =>
      Object.fromEntries(
        charts.map((chart) => {
          const savedQuery =
            chartQueries[chart.chartKey] ?? defaultChartQuery(chart);
          return [chart.chartKey, reconcileChartQuery(chart, savedQuery)];
        }),
      ) as Record<string, ChartQuery>,
    [charts, chartQueries],
  );

  // Load Catalog on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalyticsCatalog()
      .then((res) => {
        if (isMountedRef.current) {
          setCatalog(res.catalog);
          setLoadingCatalog(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch analytics catalog:", err);
        if (isMountedRef.current) {
          setLoadingCatalog(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch charts whenever filter properties change
  useEffect(() => {
    let active = true;
    fetchAnalyticsCharts({
      source: filters.source || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      limit: 100,
    })
      .then((res) => {
        if (active) {
          setCharts(res.charts || []);
          setChartSummary(res.summary);
        }
      })
      .catch((err) => {
        console.error("Failed to load charts list:", err);
      });

    return () => {
      active = false;
    };
  }, [filters.source, filters.type, filters.status]);

  const recoverUnavailableHierarchy = useCallback(
    async (chartKey: string) => {
      setChartQueries((currentQueries) => ({
        ...currentQueries,
        [chartKey]: {
          ...currentQueries[chartKey],
          gradeId: undefined,
          sectionId: undefined,
          classroomId: undefined,
        },
      }));
      setShowHierarchyRecoveryNotice(true);

      if (hierarchyRecoveryInProgressRef.current) return;
      hierarchyRecoveryInProgressRef.current = true;

      try {
        const academicYears = await refreshAcademicYears();
        const selectedYear =
          academicYears.find((year) => year.id === contextYearId) ??
          academicYears[0];

        if (!selectedYear) return;

        const availableTerms = await refreshTerms(selectedYear.id);
        const selectedTermIsAvailable = availableTerms.some(
          (term) => term.id === contextTermId,
        );

        if (
          selectedYear.id !== contextYearId ||
          !selectedTermIsAvailable
        ) {
          await requestAcademicYearChange(selectedYear.id);
        }
      } catch (error) {
        console.error("Failed to refresh the academic analytics context:", error);
      } finally {
        hierarchyRecoveryInProgressRef.current = false;
      }
    },
    [
      contextTermId,
      contextYearId,
      refreshAcademicYears,
      refreshTerms,
      requestAcademicYearChange,
    ],
  );

  // Fetch individual chart data
  const fetchDataForChart = useCallback(
    (chartKey: string, chart: DashboardAnalyticsChart, query: ChartQuery) => {
      const dateRangeError = customRangeError(query);
      if (dateRangeError) {
        setChartDataStates((prev) => ({
          ...prev,
          [chartKey]: { status: "error", error: dateRangeError },
        }));
        return;
      }

      setChartDataStates((prev) => ({
        ...prev,
        [chartKey]: { status: "loading" },
      }));

      fetchAnalyticsChartData(
        chartKey,
        formatChartQuery(query, chart, contextYearId, contextTermId),
      )
        .then((res) => {
          if (isMountedRef.current) {
            setChartDataStates((prev) => ({
              ...prev,
              [chartKey]: { status: "success", data: res },
            }));
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            const hierarchyUnavailable = isUnavailableAnalyticsHierarchy(err);
            const reportingPeriodUnavailable = isUnavailableReportingPeriod(
              err,
              query,
            );
            const granularityRangeInvalid = isGranularityRangeValidationError(err);
            const chartError: ChartError = isApiError(err)
              ? {
                  message: err.message,
                  code: err.code,
                  fields: (() => {
                    const det = err.details as { fields?: string[] } | null;
                    return Array.isArray(det?.fields) ? det.fields : undefined;
                  })(),
                  traceId: err.traceId,
                  hierarchyUnavailable,
                  reportingPeriodUnavailable,
                  granularityRangeInvalid,
                }
              : {
                  message:
                    err instanceof Error
                      ? err.message
                      : "Failed to load chart data",
                };
            setChartDataStates((prev) => ({
              ...prev,
              [chartKey]: { status: "error", error: chartError },
            }));
            if (hierarchyUnavailable && !reportingPeriodUnavailable) {
              void recoverUnavailableHierarchy(chartKey);
            }
          }
        });
    },
    [contextYearId, contextTermId, recoverUnavailableHierarchy],
  );

  // Load chart data when its resolved filter set changes.
  const lastFetchedQueriesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    charts.forEach((chart) => {
      const key = chart.chartKey;
      const query = resolvedChartQueries[key];
      if (!query) return;

      const queryStr = JSON.stringify(
        formatChartQuery(query, chart, contextYearId, contextTermId),
      );

      if (lastFetchedQueriesRef.current[key] !== queryStr) {
        lastFetchedQueriesRef.current[key] = queryStr;
        fetchDataForChart(key, chart, query);
      }
    });
  }, [
    charts,
    fetchDataForChart,
    resolvedChartQueries,
    contextYearId,
    contextTermId,
  ]);

  const isAnyChartLoading = useMemo(() => {
    return Object.values(chartDataStates).some((s) => s.status === "loading");
  }, [chartDataStates]);

  const handleRefreshAll = useCallback(() => {
    charts.forEach((chart) => {
      const key = chart.chartKey;
      const query = resolvedChartQueries[key];
      if (query) {
        fetchDataForChart(key, chart, query);
      }
    });
  }, [charts, resolvedChartQueries, fetchDataForChart]);

  const updateFilter = useCallback(
    <TKey extends keyof AnalyticsFilters>(
      filterName: TKey,
      filterValue: AnalyticsFilters[TKey],
    ) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        [filterName]: filterValue,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateChartQuery = useCallback(
    (
      chartKey: string,
      field: keyof ChartQuery,
      queryValue: ChartQuery[keyof ChartQuery],
    ) => {
      setChartQueries((currentQueries) => {
        const currentQuery = currentQueries[chartKey];
        const shouldSetCustomDateDefaults =
          field === "range" &&
          queryValue === "custom" &&
          (!currentQuery?.dateFrom || !currentQuery?.dateTo);
        const customDateDefaults: Pick<
          ChartQuery,
          "dateFrom" | "dateTo"
        > = shouldSetCustomDateDefaults
          ? defaultCustomDateRange()
          : { dateFrom: undefined, dateTo: undefined };
        const nextQuery = {
          ...currentQuery,
          [field]: queryValue,
          ...(shouldSetCustomDateDefaults
            ? {
                dateFrom: currentQuery?.dateFrom ?? customDateDefaults.dateFrom,
                dateTo: currentQuery?.dateTo ?? customDateDefaults.dateTo,
              }
            : {}),
          ...(field === "gradeId"
            ? { sectionId: undefined, classroomId: undefined }
            : {}),
          ...(field === "sectionId" ? { classroomId: undefined } : {}),
        };

        if (field === "range" && queryValue !== "custom") {
          nextQuery.dateFrom = undefined;
          nextQuery.dateTo = undefined;
        }

        if (isGranularityRangeTooShort(nextQuery)) {
          nextQuery.granularity = "day";
        }

        return {
          ...currentQueries,
          [chartKey]: nextQuery,
        };
      });
    },
    [],
  );

  const handleExportCSV = useCallback(
    (chartKey: string, chartTitle: string) => {
      const state = chartDataStates[chartKey];
      if (state?.status !== "success" || !state.data?.data?.series) {
        return;
      }

      const series = state.data.data.series;
      if (series.length === 0) return;

      // Header row
      const headers = ["Label", ...series.map((s) => s.label || s.key)];
      const rows = [headers];

      // Find all unique x labels across all series
      const pointsMap: Record<string, Record<string, number>> = {};
      series.forEach((s) => {
        s.points.forEach((p) => {
          if (!pointsMap[p.x]) {
            pointsMap[p.x] = {};
          }
          pointsMap[p.x][s.key] = p.y;
        });
      });

      Object.entries(pointsMap).forEach(([xVal, values]) => {
        const row = [xVal];
        series.forEach((s) => {
          row.push(values[s.key] !== undefined ? String(values[s.key]) : "0");
        });
        rows.push(row);
      });

      const csvContent =
        "data:text/csv;charset=utf-8,\ufeff" +
        rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `${chartTitle.replace(/\s+/g, "_")}_export.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [chartDataStates],
  );

  const sourceOptions = [
    { value: "", label: t("analytics.all_modules") },
    ...(catalog?.sources || []).map((s) => ({
      value: s.source,
      label: s.label,
      disabled: s.status !== "available" && filters.status === "available",
    })),
  ];

  const statusOptions = [
    { value: "", label: t("analytics.all_statuses") },
    { value: "available", label: t("analytics.status_available") },
    { value: "planned", label: t("analytics.status_planned") },
    { value: "deferred", label: t("analytics.status_deferred") },
  ];

  const chartTypeOptions = [
    { value: "", label: t("analytics.all_types") },
    ...(catalog?.supportedChartTypes || []).map((chartType) => ({
      value: chartType,
      label: t(`analytics.chart_types.${chartType}`),
    })),
  ];

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  if (loadingCatalog) {
    return <MainLoader />;
  }

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* LTR Styles */
        [dir="ltr"] .recharts-default-legend .recharts-legend-item {
          margin-right: 16px !important;
          margin-left: 0 !important;
        }
        [dir="ltr"] .recharts-default-legend .recharts-legend-item .recharts-surface {
          margin-right: 6px !important;
          margin-left: 0 !important;
        }

        /* RTL Styles */
        [dir="rtl"] .recharts-default-legend .recharts-legend-item {
          margin-left: 16px !important;
          margin-right: 0 !important;
        }
        [dir="rtl"] .recharts-default-legend .recharts-legend-item .recharts-surface {
          margin-left: 6px !important;
          margin-right: 0 !important;
        }
      `}} />
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
              {t("analytics.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t("analytics.description")}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              leftIcon={
                <RefreshCw
                  className={`h-4 w-4 ${isAnyChartLoading ? "animate-spin" : ""}`}
                />
              }
              onClick={handleRefreshAll}
              disabled={isAnyChartLoading}
            >
              {t("analytics.refresh_all")}
            </Button>
            <p className="text-xs text-gray-500">
              {t("analytics.showing_charts", { count: chartSummary?.total ?? charts.length })}
            </p>
          </div>
        </div>
      </header>

      {showHierarchyRecoveryNotice && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold">
              {t("analytics.context_refreshed_title")}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {t("analytics.context_refreshed_description")}
            </p>
          </div>
        </div>
      )}

      {/* Global Filter Bar */}
      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((show) => !show)}
        hasActiveFilters={Boolean(filters.source || filters.type || filters.status !== "available")}
        toggleTitle={t("analytics.dashboard_filters")}
        toggleAriaLabel={t("analytics.toggle_filters")}
        className="mb-5 border border-gray-200"
        clearAction={
          <Button
            type="button"
            variant="outline"
            leftIcon={<X className="h-4 w-4" />}
            onClick={resetFilters}
          >
            {t("filters.reset")}
          </Button>
        }
        filtersSlot={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
              <Select
                label={t("analytics.module_source")}
                value={filters.source}
                onChange={(value) => updateFilter("source", value)}
                options={sourceOptions}
              />
              <Select
                label={t("analytics.chart_type")}
                value={filters.type}
                onChange={(value) => updateFilter("type", value)}
                options={chartTypeOptions}
              />
              <Select
                label={t("analytics.chart_status")}
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={statusOptions}
              />
            </div>
          </div>
        }
      />

      {/* Analytics Charts Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {charts.map((chart) => {
          const state = chartDataStates[chart.chartKey];
          return (
            <article
              key={chart.chartKey}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    {chart.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {chart.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const query = resolvedChartQueries[chart.chartKey];
                      if (query) {
                        fetchDataForChart(chart.chartKey, chart, query);
                      }
                    }}
                    disabled={state?.status === "loading"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title={t("analytics.refresh_chart")}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${state?.status === "loading" ? "animate-spin" : ""}`}
                    />
                  </button>
                  {state?.status === "success" && (
                    <button
                      onClick={() => handleExportCSV(chart.chartKey, chart.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("analytics.csv_export")}
                    </button>
                  )}
                </div>
              </div>

              <DashboardAnalyticsChartFilters
                chart={chart}
                query={resolvedChartQueries[chart.chartKey]}
                catalog={catalog}
                structureTree={structureTree}
                locale={locale}
                validationFields={
                  state?.status === "error" &&
                  (state.error.granularityRangeInvalid || state.error.clientValidation ||
                    state.error.code === "validation.failed")
                    ? state.error.fields
                    : undefined
                }
                validationMessage={
                  state?.status === "error" &&
                  (state.error.granularityRangeInvalid || state.error.clientValidation ||
                    state.error.code === "validation.failed")
                    ? analyticsValidationMessage(state.error.message, t)
                    : undefined
                }
                onQueryChange={(field, queryValue) =>
                  updateChartQuery(chart.chartKey, field, queryValue)
                }
              />

              {state?.status === "success" && (
                <DashboardAnalyticsContractMetadata data={state.data} />
              )}

              {/* Chart Body Render */}
              <div className="mt-5 flex-1 min-h-[300px] flex items-center justify-center">
                <DashboardAnalyticsChartContent
                  chart={chart}
                  state={state}
                  locale={locale}
                  onSwitchToDaily={() =>
                    updateChartQuery(chart.chartKey, "granularity", "day")
                  }
                  onRetry={() => {
                    const query = resolvedChartQueries[chart.chartKey];
                    if (query) fetchDataForChart(chart.chartKey, chart, query);
                  }}
                />
              </div>
            </article>
          );
        })}

        {charts.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              {t("analytics.no_charts")}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {t("analytics.adjust_filters")}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

interface DashboardAnalyticsChartContentProps {
  chart: DashboardAnalyticsChart;
  state: ChartDataState | undefined;
  locale: string;
  onSwitchToDaily: () => void;
  onRetry: () => void;
}

function DashboardAnalyticsContractMetadata({
  data,
}: {
  data: DashboardAnalyticsChartDataResponse;
}) {
  const t = useTranslations("dashboard_new");
  const query = data.meta?.query;
  const ignoredFilters = query?.notApplicableFilters || [];

  if (!query && data.meta?.dataAvailability === "available") return null;

  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
      {query?.resolvedWindow && (
        <span>
          {t("analytics.effective_period", {
            from: query.resolvedWindow.startCivilDate,
            to: query.resolvedWindow.endCivilDate,
          })}
        </span>
      )}
      {data.generatedAt && (
        <span>{t("analytics.data_updated", { value: new Date(data.generatedAt).toLocaleString() })}</span>
      )}
      {ignoredFilters.length > 0 && (
        <span className="text-amber-800" role="status">
          {t("analytics.ignored_filters", { filters: ignoredFilters.join(", ") })}
        </span>
      )}
    </div>
  );
}

interface FormattedChartDataPoint {
  name: string;
  [seriesKey: string]: number | string;
}

function DashboardAnalyticsChartContent({
  chart,
  state,
  locale,
  onSwitchToDaily,
  onRetry,
}: DashboardAnalyticsChartContentProps) {
  const t = useTranslations("dashboard_new");
  if (!state || state.status === "loading") {
    return <PartialLoader />;
  }

  if (state.status === "error") {
    if (state.error.reportingPeriodUnavailable) {
      return (
        <div
          className="w-full rounded-xl border border-amber-200 bg-amber-50 p-6 text-center"
          role="status"
          aria-live="polite"
        >
          <HelpCircle className="mx-auto h-8 w-8 text-amber-700" />
          <p className="mt-3 text-sm font-semibold text-amber-950">
            {t("analytics.reporting_period_unavailable_title")}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-amber-800">
            {t("analytics.reporting_period_unavailable_description")}
          </p>
        </div>
      );
    }

    const { message, code, fields, traceId, hierarchyUnavailable } = state.error;
    if (state.error.granularityRangeInvalid || state.error.clientValidation) {
      const isGranularityError = state.error.granularityRangeInvalid;
      return (
        <div
          className="w-full rounded-xl border border-amber-200 bg-amber-50 p-5 text-center"
          role="alert"
        >
          <AlertTriangle className="mx-auto h-6 w-6 text-amber-700" />
          <p className="mt-2 text-sm font-semibold text-amber-950">
            {isGranularityError
              ? t("analytics.short_range_title")
              : t("analytics.custom_range_title")}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-amber-800">
            {analyticsValidationMessage(message, t)}
          </p>
          {isGranularityError && (
            <Button className="mt-4" onClick={onSwitchToDaily}>
              {t("analytics.switch_to_daily")}
            </Button>
          )}
        </div>
      );
    }
    return (
      <div
        className="w-full rounded-xl border border-red-100 bg-red-50 p-5 space-y-4"
        role="alert"
      >
        {/* Icon + heading row */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 rounded-full bg-red-100 p-1.5">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-red-900 leading-tight">
                {hierarchyUnavailable
                  ? t("analytics.context_unavailable_title")
                  : t("analytics.load_failed")}
              </p>
              {code && !hierarchyUnavailable && (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  {code}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-red-700 leading-relaxed">
              {hierarchyUnavailable
                ? t("analytics.context_unavailable_description")
                : message}
            </p>
          </div>
        </div>

        {/* Affected fields */}
        {fields && fields.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
              {t("analytics.affected_fields")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-mono text-red-700 ring-1 ring-inset ring-red-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Retry button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:bg-red-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("analytics.retry")}
          </button>

          {/* Trace ID */}
          {traceId && !hierarchyUnavailable && (
            <p
              className="text-[10px] font-mono text-red-400 select-all truncate max-w-[200px]"
              title={traceId}
            >
              Trace: {traceId}
            </p>
          )}
        </div>
      </div>
    );
  }

  const chartData: DashboardAnalyticsChartDataResponse = state.data;
  if (chartData.emptyState) {
    const isDeferred = chartData.emptyState.reason === "not_implemented";
    return (
      <div className="text-center p-6 space-y-2">
        <HelpCircle className="mx-auto h-8 w-8 text-gray-400" />
        <p className="text-sm font-semibold text-gray-900">
          {isDeferred ? t("analytics.data_not_available") : t("analytics.no_data")}
        </p>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto">
          {chartData.emptyState.message || t("analytics.no_events")}
        </p>
      </div>
    );
  }

  const series = chartData.data?.series || [];
  if (series.length === 0) {
    return <p className="text-sm text-gray-400">{t("analytics.empty_series")}</p>;
  }

  const formattedData: FormattedChartDataPoint[] = [];
  const pointsKeys = new Set<string>();

  series.forEach((s) => {
    s.points.forEach((p) => {
      pointsKeys.add(p.x);
    });
  });

  const uniqueX = Array.from(pointsKeys).sort();

  uniqueX.forEach((xVal) => {
    const entry: FormattedChartDataPoint = { name: xVal };
    series.forEach((s) => {
      const pt = s.points.find((p) => p.x === xVal);
      entry[s.key] = pt ? pt.y : 0;
    });
    formattedData.push(entry);
  });

  // Table visualization fallback
  if (chart.type === "table") {
    return (
      <div className="w-full overflow-x-auto max-h-[280px] border border-border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-center font-semibold text-gray-700">
                {t("analytics.table_label")}
              </th>
              {series.map((s) => (
                <th
                  key={s.key}
                  className="px-4 py-2 text-center font-semibold text-gray-700"
                >
                  {s.label || s.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {formattedData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-center font-medium text-gray-950">
                  {row.name}
                </td>
                {series.map((s) => (
                  <td
                    key={s.key}
                    className="px-4 py-2 text-center text-gray-600"
                  >
                    {row[s.key] !== undefined ? row[s.key] : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Pie / Donut Chart
  if (chart.type === "pie" || chart.type === "donut") {
    // Pie chart usually summarizes a single series or totals
    const pieData =
      series[0]?.points.map((p) => ({
        name: p.x,
        value: p.y,
      })) || [];

    const innerRadius = chart.type === "donut" ? 60 : 0;

    const renderCustomLabel = (props: PieLabelRenderProps) => {
      const { cx, cy, midAngle, outerRadius: or, percent, name } = props;
      if (!percent || percent < 0.05) return null;

      const RADIAN = Math.PI / 180;
      const radius = (or ?? 85) + 24;
      const x = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
      const y = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

      // In RTL (Arabic), text direction is reversed, so we invert the text-anchor to prevent overlaps
      const anchor =
        locale === "ar"
          ? x > (cx ?? 0)
            ? "end"
            : "start"
          : x > (cx ?? 0)
            ? "start"
            : "end";

      return (
        <text
          x={x}
          y={y}
          fill="#374151"
          textAnchor={anchor}
          dominantBaseline="central"
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "inherit",
            direction: locale === "ar" ? "rtl" : "ltr",
            unicodeBidi: "embed",
          }}
        >
          {`${name ?? ""} (${(percent * 100).toFixed(0)}%)`}
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="46%"
            innerRadius={innerRadius}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            labelLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
            label={renderCustomLabel}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Area Chart
  if (chart.type === "area") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={formattedData}>
          <defs>
            {series.map((s, idx) => (
              <linearGradient
                key={`grad-${s.key}`}
                id={`area-gradient-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS[idx % CHART_COLORS.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS[idx % CHART_COLORS.length]}
                  stopOpacity={0.02}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, idx) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label || s.key}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              fill={`url(#area-gradient-${s.key})`}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Bar Chart
  if (chart.type === "bar" || chart.type === "stacked-bar") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label || s.key}
              fill={CHART_COLORS[idx % CHART_COLORS.length]}
              stackId={chart.type === "stacked-bar" ? "stack" : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Funnel Chart
  if (chart.type === "funnel") {
    const funnelData =
      series[0]?.points.map((p, idx) => ({
        name: p.x,
        value: p.y,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })) || [];

    return (
      <ResponsiveContainer width="100%" height={280}>
        <FunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={funnelData} isAnimationActive>
            <LabelList
              position="right"
              fill="#374151"
              stroke="none"
              dataKey="name"
              style={{ fontSize: 11, fontWeight: 500 }}
            />
            {funnelData.map((entry, index) => (
              <Cell key={`funnel-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    );
  }

  // Heatmap Chart (custom SVG grid)
  if (chart.type === "heatmap") {
    // Heatmap: rows = series keys, columns = x-axis categories
    const xLabels = uniqueX;
    const rows = series.map((s) => ({
      key: s.key,
      label: s.label || s.key,
      values: xLabels.map((x) => {
        const pt = s.points.find((p) => p.x === x);
        return pt ? pt.y : 0;
      }),
    }));

    // Calculate value range for color scaling
    const allValues = rows.flatMap((r) => r.values);
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 1);
    const range = maxVal - minVal || 1;

    const cellW = 40;
    const cellH = 32;
    const labelW = 100;
    const topPad = 28;
    const svgW = labelW + xLabels.length * cellW;
    const svgH = topPad + rows.length * cellH;

    const heatColor = (val: number) => {
      const t = (val - minVal) / range;
      // From light blue (#eff6ff) to dark blue (#1e40af)
      const r = Math.round(239 - t * 209);
      const g = Math.round(246 - t * 182);
      const b = Math.round(255 - t * 80);
      return `rgb(${r},${g},${b})`;
    };

    return (
      <div className="w-full overflow-x-auto">
        <svg width={svgW} height={svgH} className="text-xs">
          {/* Column headers */}
          {xLabels.map((label, ci) => (
            <text
              key={`col-${ci}`}
              x={labelW + ci * cellW + cellW / 2}
              y={topPad - 8}
              textAnchor="middle"
              fill="#6b7280"
              style={{ fontSize: 9 }}
            >
              {label.length > 6 ? label.slice(0, 6) + "…" : label}
            </text>
          ))}
          {/* Rows */}
          {rows.map((row, ri) => (
            <g key={`row-${ri}`}>
              {/* Row label */}
              <text
                x={labelW - 8}
                y={topPad + ri * cellH + cellH / 2 + 4}
                textAnchor={locale === "ar" ? "start" : "end"}
                fill="#374151"
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  direction: locale === "ar" ? "rtl" : "ltr",
                  unicodeBidi: "embed",
                }}
              >
                {row.label.length > 14
                  ? row.label.slice(0, 14) + "…"
                  : row.label}
              </text>
              {/* Cells */}
              {row.values.map((val, ci) => (
                <g key={`cell-${ri}-${ci}`}>
                  <rect
                    x={labelW + ci * cellW}
                    y={topPad + ri * cellH}
                    width={cellW - 2}
                    height={cellH - 2}
                    rx={4}
                    fill={heatColor(val)}
                  />
                  <text
                    x={labelW + ci * cellW + (cellW - 2) / 2}
                    y={topPad + ri * cellH + (cellH - 2) / 2 + 4}
                    textAnchor="middle"
                    fill={val > minVal + range * 0.6 ? "#fff" : "#374151"}
                    style={{ fontSize: 10, fontWeight: 600 }}
                  >
                    {val}
                  </text>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // Radial Progress Chart
  if (chart.type === "radial-progress") {
    const radialData =
      series.length === 1 && series[0].points.length > 1
        ? series[0].points.map((p, idx) => ({
            name: `${p.x}: ${p.y}`,
            value: p.y,
            fill: CHART_COLORS[idx % CHART_COLORS.length],
          }))
        : series.map((s, idx) => {
            const val = s.points[0]?.y ?? 0;
            return {
              name: `${s.label || s.key}: ${val}`,
              value: val,
              fill: CHART_COLORS[idx % CHART_COLORS.length],
            };
          });

    const sumValues = radialData.reduce((sum, d) => sum + d.value, 0);
    const maxValue =
      radialData.length === 1 && sumValues <= 100
        ? 100
        : sumValues;
    const domain: [number, number] = [0, maxValue > 0 ? maxValue : 100];

    return (
      <ResponsiveContainer width="100%" height={280}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="90%"
          barSize={14}
          data={radialData}
          startAngle={180}
          endAngle={-180}
        >
          <PolarAngleAxis
            type="number"
            domain={domain}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#f3f4f6" }}
            dataKey="value"
            cornerRadius={6}
          >
            {radialData.map((entry, index) => (
              <Cell key={`radial-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
          <Tooltip />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    );
  }

  // Timeline Chart
  if (chart.type === "timeline") {
    const timelinePoints = series[0]?.points || [];

    return (
      <div className="w-full overflow-x-auto px-2 py-4">
        <div
          className="relative"
          style={{ minWidth: Math.max(timelinePoints.length * 120, 300) }}
        >
          {/* Horizontal line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200" />
          {/* Points */}
          <div className="flex justify-between relative">
            {timelinePoints.map((point, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center"
                style={{ minWidth: 100 }}
              >
                {/* Dot */}
                <div
                  className="z-10 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm"
                  style={{
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  }}
                />
                {/* Value */}
                <span
                  className="mt-2 text-sm font-bold"
                  style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                >
                  {point.y}
                </span>
                {/* Label */}
                <span className="mt-0.5 text-[10px] text-gray-500 max-w-[90px] truncate">
                  {point.x}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Line Chart (default fallback)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#6b7280", style: { direction: locale === "ar" ? "rtl" : "ltr" } }}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, idx) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
