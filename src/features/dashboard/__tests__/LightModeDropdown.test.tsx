import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LightModeDropdown from "@/components/ui/dropdown/LightModeDropdown";
import * as api from "@/features/dashboard/services/dashboardApiService";
import "@/features/dashboard/__tests__/dashboardI18nMock";

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchLightModeDropdown: vi.fn(),
  fetchDashboardWidgets: vi.fn(),
  fetchDashboardTodos: vi.fn(),
  createDashboardTodo: vi.fn(),
  updateDashboardTodo: vi.fn(),
  deleteDashboardTodo: vi.fn(),
}));

const mockFetchDropdown = vi.mocked(api.fetchLightModeDropdown);
const mockFetchDashboardWidgets = vi.mocked(api.fetchDashboardWidgets);
const mockCreateTodo = vi.mocked(api.createDashboardTodo);
const mockUpdateTodo = vi.mocked(api.updateDashboardTodo);

describe("LightModeDropdown Integration", () => {
  it("disables todo creation when manage access is absent", async () => {
    mockFetchDashboardWidgets.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      widgets: [],
      summary: { total: 0, byType: {}, bySource: {} },
      filters: { source: null, type: "calendar-card", limit: 1 },
      deferred: {
        customLayouts: "deferred",
        widgetPreferences: "deferred",
        analyticsCharts: "available",
        weatherWidgets: "deferred",
        todoWidgets: "available",
        analyticsStandalone: "available",
        todosStandalone: "persisted",
        calendarTodoComposition: "available",
        plannerCalendar: "available",
        crossModulePlannerItems: "available",
      },
    });
    mockFetchDropdown.mockResolvedValue({
      location: { label: null, city: null, country: null, timezone: "Africa/Cairo" },
      weather: {
        status: "provider_not_configured",
        current: { temperature: null, lowTemperature: null, feelsLike: null, condition: "Weather unavailable" },
        emptyState: { message: "Weather provider is not configured." },
      },
      planner: { date: "2026-07-15", timezone: "Africa/Cairo", eventDates: [], todos: [] },
    });

    render(<LightModeDropdown canManageTodos={false} defaultExpanded />);

    expect(
      await screen.findByRole("button", { name: "add" }),
    ).toBeDisabled();
  });

  it("loads dropdown details when the page opens", async () => {
    mockFetchDashboardWidgets.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      widgets: [],
      summary: { total: 0, byType: {}, bySource: {} },
      filters: { source: null, type: "calendar-card", limit: 1 },
      deferred: {
        customLayouts: "deferred",
        widgetPreferences: "deferred",
        analyticsCharts: "available",
        weatherWidgets: "deferred",
        todoWidgets: "available",
        analyticsStandalone: "available",
        todosStandalone: "persisted",
        calendarTodoComposition: "available",
        plannerCalendar: "available",
        crossModulePlannerItems: "available",
      },
    });
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
        source: "school_profile",
      },
      weather: {
        status: "provider_not_configured",
        provider: null,
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather Unavailable",
          conditionCode: "provider_not_configured",
          iconKey: "cloud",
          observedAt: null,
        },
        emptyState: {
          reason: "provider_not_configured",
          message: "Weather provider is not configured.",
        },
      },
      hints: [],
      highlights: [],
      cities: [],
      forecast: [],
      planner: {
        timezone: "Africa/Cairo",
        date: "2026-07-15",
        eventDates: [],
        events: [],
        todos: [
          {
            todoId: "todo-1",
            date: "2026-07-15",
            title: "Configure admissions email template",
            notes: "Must be done by term start",
            status: "pending",
            priority: "high",
            sortOrder: 10,
            completedAt: null,
            createdAt: "2026-07-15T09:00:00.000Z",
            updatedAt: "2026-07-15T09:00:00.000Z",
          },
        ],
      },
    });

    render(<LightModeDropdown canManageTodos />);

    await waitFor(() => {
      expect(mockFetchDropdown).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "en",
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    await waitFor(() => {
      expect(
        screen.getByText("Configure admissions email template"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Must be done by term start"),
      ).toBeInTheDocument();
      expect(screen.getByText("agenda")).toBeInTheDocument();
    });
  });

  it("uses the server-selected school date and persisted Todo ID when creating a Todo", async () => {
    mockFetchDashboardWidgets.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      widgets: [],
      summary: { total: 0, byType: {}, bySource: {} },
      filters: { source: null, type: "calendar-card", limit: 1 },
      deferred: {
        customLayouts: "deferred",
        widgetPreferences: "deferred",
        analyticsCharts: "available",
        weatherWidgets: "deferred",
        todoWidgets: "available",
        analyticsStandalone: "available",
        todosStandalone: "persisted",
        calendarTodoComposition: "available",
        plannerCalendar: "available",
        crossModulePlannerItems: "available",
      },
    });
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
      },
      weather: {
        status: "provider_not_configured",
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather Unavailable",
        },
        emptyState: { message: "Weather provider is not configured." },
      },
      planner: {
        timezone: "Africa/Cairo",
        date: "2026-07-15",
        eventDates: [],
        todos: [],
      },
    });
    mockCreateTodo.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: {
        todoId: "todo-created",
        date: "2026-07-15",
        title: "Created Todo",
        notes: null,
        status: "pending",
        priority: "normal",
        sortOrder: 0,
        completedAt: null,
        createdAt: "2026-07-15T09:00:00.000Z",
        updatedAt: "2026-07-15T09:00:00.000Z",
      },
    });
    mockUpdateTodo.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00.000Z",
      todo: {
        todoId: "todo-created",
        date: "2026-07-15",
        title: "Created Todo",
        notes: null,
        status: "completed",
        priority: "normal",
        sortOrder: 0,
        completedAt: "2026-07-15T09:00:00.000Z",
        createdAt: "2026-07-15T09:00:00.000Z",
        updatedAt: "2026-07-15T09:00:00.000Z",
      },
    });

    render(<LightModeDropdown canManageTodos defaultExpanded />);

    await waitFor(() => {
      expect(mockFetchDropdown).toHaveBeenCalled();
    });
    fireEvent.change(screen.getByPlaceholderText("addTitle"), {
      target: { value: "Created Todo" },
    });
    fireEvent.change(screen.getByPlaceholderText("addDescription"), {
      target: { value: "Created from planner details" },
    });
    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        date: "2026-07-15",
        title: "Created Todo",
        notes: "Created from planner details",
        priority: "normal",
      });
    });

    await screen.findByText("Created Todo");
    fireEvent.click(screen.getByRole("button", { name: "markDone" }));

    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith("todo-created", {
        status: "completed",
      });
    });
  });

  it("keeps the edit form open when saving a Todo fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockFetchDropdown.mockResolvedValue({
      location: {
        label: "Test Cairo Campus",
        city: "Cairo",
        country: "Egypt",
        timezone: "Africa/Cairo",
      },
      weather: {
        status: "provider_not_configured",
        current: {
          temperature: null,
          lowTemperature: null,
          feelsLike: null,
          condition: "Weather Unavailable",
        },
        emptyState: { message: "Weather provider is not configured." },
      },
      planner: {
        timezone: "Africa/Cairo",
        date: "2026-07-15",
        eventDates: [],
        todos: [
          {
            todoId: "todo-1",
            date: "2026-07-15",
            title: "Retryable Todo",
            notes: "Keep this note",
            status: "pending",
            priority: "normal",
            sortOrder: 0,
            completedAt: null,
            createdAt: "2026-07-15T09:00:00.000Z",
            updatedAt: "2026-07-15T09:00:00.000Z",
          },
        ],
      },
    });
    mockUpdateTodo.mockRejectedValueOnce(new Error("Network error"));

    render(<LightModeDropdown canManageTodos defaultExpanded />);

    await screen.findByText("Retryable Todo");
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("updateFailed");
      expect(screen.getByRole("button", { name: "save" })).toBeInTheDocument();
    });
    consoleError.mockRestore();
  });
});
