import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  DashboardActivityFeedQuery,
  DashboardActivityFeedResponse,
  DashboardAlertsQuery,
  DashboardAlertsResponse,
  DashboardSummaryResponse,
  DashboardModulePage,
  DashboardModulesResponse,
  DashboardAnalyticsCatalogResponse,
  DashboardAnalyticsChartResponse,
  DashboardAnalyticsChartsResponse,
  DashboardAnalyticsChartsQuery,
  DashboardAnalyticsChartDataQuery,
  DashboardAnalyticsChartDataResponse,
  DashboardCommandCenterResponse,
  DashboardWidgetSource,
  DashboardWidgetType,
  DashboardWidgetResponse,
  DashboardWidgetsResponse,
} from "@/features/dashboard/types/dashboardApi.types";

interface DashboardApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

type QueryPrimitive = string | number | boolean | null | undefined;

const DASHBOARD_BASE_PATH = "/dashboard";

export function dashboardQueryString(
  queryParameters: Record<string, QueryPrimitive>,
) {
  const searchParameters = new URLSearchParams();

  Object.entries(queryParameters).forEach(([parameterName, parameterValue]) => {
    if (parameterValue === null || typeof parameterValue === "undefined") {
      return;
    }

    const normalizedParameterValue = String(parameterValue).trim();
    if (normalizedParameterValue) {
      searchParameters.set(parameterName, normalizedParameterValue);
    }
  });

  const queryString = searchParameters.toString();
  return queryString ? `?${queryString}` : "";
}

function unwrapDashboardResponse<T>(
  responsePayload: DashboardApiEnvelope<T> | T,
): T {
  if (!isDashboardEnvelope(responsePayload)) {
    return responsePayload;
  }

  if (responsePayload.error) {
    throw new Error(responsePayload.error);
  }

  if (typeof responsePayload.data === "undefined") {
    throw new Error(responsePayload.message || "Missing dashboard response data");
  }

  return responsePayload.data;
}

function isDashboardEnvelope<T>(
  responsePayload: DashboardApiEnvelope<T> | T,
): responsePayload is DashboardApiEnvelope<T> {
  if (!responsePayload || typeof responsePayload !== "object") {
    return false;
  }
  const keys = Object.keys(responsePayload);
  if (keys.length === 0) {
    return false;
  }
  return keys.every((key) => key === "data" || key === "error" || key === "message");
}

async function fetchDashboardContract<T>(endpoint: string): Promise<T> {
  const responsePayload = await apiGet<DashboardApiEnvelope<T> | T>(endpoint);
  return unwrapDashboardResponse(responsePayload);
}

export function fetchDashboardSummary() {
  return fetchDashboardContract<DashboardSummaryResponse>(
    `${DASHBOARD_BASE_PATH}/summary`,
  );
}

export function fetchDashboardCommandCenter() {
  return fetchDashboardContract<DashboardCommandCenterResponse>(
    `${DASHBOARD_BASE_PATH}/command-center`,
  );
}

export function fetchDashboardWidgets(query: { source?: DashboardWidgetSource; type?: DashboardWidgetType; limit?: number } = {}) {
  return fetchDashboardContract<DashboardWidgetsResponse>(
    `${DASHBOARD_BASE_PATH}/widgets${dashboardQueryString(query)}`,
  );
}

export function fetchDashboardWidget(widgetKey: string) {
  return fetchDashboardContract<DashboardWidgetResponse>(
    `${DASHBOARD_BASE_PATH}/widgets/${widgetKey}`,
  );
}

export function fetchDashboardAlerts(query: DashboardAlertsQuery = {}) {
  return fetchDashboardContract<DashboardAlertsResponse>(
    `${DASHBOARD_BASE_PATH}/alerts${dashboardQueryString({
      source: query.source,
      severity: query.severity,
      limit: query.limit,
      includeZeroCount: query.includeZeroCount,
    })}`,
  );
}

export function fetchDashboardActivityFeed(
  query: DashboardActivityFeedQuery = {},
) {
  return fetchDashboardContract<DashboardActivityFeedResponse>(
    `${DASHBOARD_BASE_PATH}/activity-feed${dashboardQueryString({
      source: query.source,
      eventType: query.eventType,
      actorType: query.actorType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
  );
}

export interface FetchLightModeDropdownQuery {
  locale?: "en" | "ar";
  timezone?: string;
  units?: "metric" | "imperial";
  date?: string;
}

export type DashboardTodoStatus = "pending" | "completed";
export type DashboardTodoPriority = "low" | "normal" | "high";

export interface DashboardTodo {
  todoId: string;
  date: string;
  title: string;
  notes: string | null;
  status: DashboardTodoStatus;
  priority: DashboardTodoPriority;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLightModeDropdownResponse {
  location: {
    label: string | null;
    city: string | null;
    country: string | null;
    timezone: string;
  };
  weather: {
    status: string;
    current: {
      temperature: number | null;
      lowTemperature: number | null;
      feelsLike: number | null;
      condition: string;
    };
    emptyState: {
      message: string;
    };
  };
  planner: {
    date: string;
    timezone: string;
    eventDates: string[];
    todos: DashboardTodo[];
  };
}

export interface DashboardTodosResponse {
  generatedAt: string;
  date: string;
  todos: DashboardTodo[];
  summary: {
    total: number;
    pending: number;
    completed: number;
  };
}

export interface CreateDashboardTodoResponse {
  generatedAt: string;
  todo: DashboardTodo;
}

export interface UpdateDashboardTodoResponse {
  generatedAt: string;
  todo: DashboardTodo;
}

export interface DeleteDashboardTodoResponse {
  generatedAt: string;
  deleted: true;
  todoId: string;
}

export interface FetchTodosQuery {
  date?: string;
  status?: "pending" | "completed" | "all";
  limit?: number;
  timezone?: string;
}

export interface CreateTodoBody {
  date: string;
  title: string;
  notes?: string | null;
  priority?: DashboardTodoPriority;
  sortOrder?: number;
}

export interface UpdateTodoBody {
  date?: string;
  title?: string;
  notes?: string | null;
  status?: DashboardTodoStatus;
  priority?: DashboardTodoPriority;
  sortOrder?: number;
}

export function fetchLightModeDropdown(query: FetchLightModeDropdownQuery = {}) {
  return fetchDashboardContract<DashboardLightModeDropdownResponse>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown${dashboardQueryString({
      locale: query.locale,
      timezone: query.timezone,
      units: query.units,
      date: query.date,
    })}`,
  );
}

export function fetchDashboardTodos(query: FetchTodosQuery = {}) {
  return fetchDashboardContract<DashboardTodosResponse>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos${dashboardQueryString({
      date: query.date,
      status: query.status,
      limit: query.limit,
      timezone: query.timezone,
    })}`,
  );
}

export async function createDashboardTodo(body: CreateTodoBody) {
  const response = await apiPost<CreateDashboardTodoResponse>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos`,
    body,
  );
  return unwrapDashboardResponse(response);
}

export async function updateDashboardTodo(todoId: string, body: UpdateTodoBody) {
  const response = await apiPatch<UpdateDashboardTodoResponse>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`,
    body,
  );
  return unwrapDashboardResponse(response);
}

export async function deleteDashboardTodo(todoId: string) {
  const response = await apiDelete<DeleteDashboardTodoResponse>(
    `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`,
  );
  return unwrapDashboardResponse(response);
}

export function fetchDashboardModules() {
  return fetchDashboardContract<DashboardModulesResponse>(
    `${DASHBOARD_BASE_PATH}/modules?status=available`,
  );
}

export function fetchDashboardModuleByKey(moduleKey: string) {
  return fetchDashboardContract<DashboardModulePage>(
    `${DASHBOARD_BASE_PATH}/modules/${moduleKey}`,
  );
}

export function fetchAnalyticsCatalog() {
  return fetchDashboardContract<DashboardAnalyticsCatalogResponse>(
    `${DASHBOARD_BASE_PATH}/analytics/catalog`,
  );
}

export function fetchAnalyticsCharts(query: DashboardAnalyticsChartsQuery = {}) {
  return fetchDashboardContract<DashboardAnalyticsChartsResponse>(
    `${DASHBOARD_BASE_PATH}/analytics/charts${dashboardQueryString({
      source: query.source,
      type: query.type,
      status: query.status,
      limit: query.limit,
    })}`,
  );
}

export function fetchAnalyticsChartByKey(chartKey: string) {
  return fetchDashboardContract<DashboardAnalyticsChartResponse>(
    `${DASHBOARD_BASE_PATH}/analytics/charts/${chartKey}`,
  );
}

export function fetchAnalyticsChartData(
  chartKey: string,
  query: DashboardAnalyticsChartDataQuery = {},
) {
  return fetchDashboardContract<DashboardAnalyticsChartDataResponse>(
    `${DASHBOARD_BASE_PATH}/analytics/charts/${chartKey}/data${dashboardQueryString({
      range: query.range,
      granularity: query.granularity,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      academicYearId: query.academicYearId,
      termId: query.termId,
      gradeId: query.gradeId,
      sectionId: query.sectionId,
      classroomId: query.classroomId,
    })}`,
  );
}
