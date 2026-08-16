import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import {
  dashboardQueryString,
  fetchDashboardActivityFeed,
  fetchDashboardAlerts,
  fetchDashboardSummary,
  fetchLightModeDropdown,
  fetchDashboardTodos,
  createDashboardTodo,
  updateDashboardTodo,
  deleteDashboardTodo,
  fetchDashboardModules,
  fetchDashboardModuleByKey,
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartByKey,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiDelete = vi.mocked(apiDelete);

describe("dashboardApiService", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
    mockedApiPatch.mockReset();
    mockedApiDelete.mockReset();
  });

  it("omits empty query parameters and preserves supported boolean and numeric values", () => {
    expect(
      dashboardQueryString({
        source: "attendance",
        severity: undefined,
        includeZeroCount: true,
        limit: 10,
        cursor: "",
      }),
    ).toBe("?source=attendance&includeZeroCount=true&limit=10");
  });

  it("requests the documented dashboard endpoint paths", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ generatedAt: "2026-06-13T10:00:00.000Z" })
      .mockResolvedValueOnce({ alerts: [] })
      .mockResolvedValueOnce({ items: [] });

    await fetchDashboardSummary();
    await fetchDashboardAlerts({ source: "attendance", limit: 5 });
    await fetchDashboardActivityFeed({ actorType: "admin", limit: 3 });

    expect(mockedApiGet).toHaveBeenNthCalledWith(1, "/dashboard/summary");
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/alerts?source=attendance&limit=5",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/dashboard/activity-feed?actorType=admin&limit=3",
    );
  });

  it("serializes the full activity feed query contract", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await fetchDashboardActivityFeed({
      source: "attendance",
      eventType: "attendance.session.submit",
      actorType: "admin",
      dateFrom: "2026-06-01T00:00:00.000Z",
      dateTo: "2026-06-13T23:59:59.999Z",
      limit: 20,
      cursor: "cursor-2",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/dashboard/activity-feed?source=attendance&eventType=attendance.session.submit&actorType=admin&dateFrom=2026-06-01T00%3A00%3A00.000Z&dateTo=2026-06-13T23%3A59%3A59.999Z&limit=20&cursor=cursor-2",
    );
  });

  it("unwraps API envelopes and reports envelope errors", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ data: { alerts: [] } })
      .mockResolvedValueOnce({ error: "Forbidden" });

    await expect(fetchDashboardAlerts()).resolves.toEqual({ alerts: [] });
    await expect(fetchDashboardAlerts()).rejects.toThrow("Forbidden");
  });

  it("requests light-mode-dropdown and todo CRUD paths", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ location: { city: "Cairo" } })
      .mockResolvedValueOnce({ todos: [] });
    mockedApiPost.mockResolvedValueOnce({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: { todoId: "todo-123" },
    });
    mockedApiPatch.mockResolvedValueOnce({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: { todoId: "todo-123", status: "completed" },
    });
    mockedApiDelete.mockResolvedValueOnce({
      generatedAt: "2026-07-15T09:00:00.000Z",
      deleted: true,
      todoId: "todo-123",
    });

    await fetchLightModeDropdown({ date: "2026-07-15", locale: "ar" });
    await fetchDashboardTodos({ status: "all" });
    const createdTodo = await createDashboardTodo({ date: "2026-07-15", title: "Test Todo" });
    const updatedTodo = await updateDashboardTodo("todo-123", { status: "completed" });
    await deleteDashboardTodo("todo-123");

    expect(createdTodo.todo.todoId).toBe("todo-123");
    expect(updatedTodo.todo.status).toBe("completed");

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/dashboard/light-mode-dropdown?locale=ar&date=2026-07-15",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/light-mode-dropdown/todos?status=all",
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/dashboard/light-mode-dropdown/todos",
      { date: "2026-07-15", title: "Test Todo" },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/dashboard/light-mode-dropdown/todos/todo-123",
      { status: "completed" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/dashboard/light-mode-dropdown/todos/todo-123",
    );
  });

  it("requests dashboard modules and dynamic module page details", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ modules: [] })
      .mockResolvedValueOnce({ module: { moduleKey: "academics" } });

    await fetchDashboardModules();
    await fetchDashboardModuleByKey("academics");

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/dashboard/modules?status=available",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/modules/academics",
    );
  });

  it("requests dashboard analytics catalog, charts, and chart data", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ sources: [] })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ chartKey: "academics.gpa_trend" })
      .mockResolvedValueOnce({ chartKey: "academics.gpa_trend", data: {} });

    await fetchAnalyticsCatalog();
    await fetchAnalyticsCharts({ source: "academics", status: "available" });
    await fetchAnalyticsChartByKey("academics.gpa_trend");
    await fetchAnalyticsChartData("academics.gpa_trend", { range: "30d", gradeId: "grade-1" });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/dashboard/analytics/catalog",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/analytics/charts?source=academics&status=available",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/dashboard/analytics/charts/academics.gpa_trend",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      4,
      "/dashboard/analytics/charts/academics.gpa_trend/data?range=30d&gradeId=grade-1",
    );
  });
});
