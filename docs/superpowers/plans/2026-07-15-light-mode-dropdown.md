# Light Mode Dropdown & Todo CRUD Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the mock-based frontend `LightModeDropdown` and Todo lists to the real backend APIs, providing a fully functional civil-date event calendar planner and Todo CRUD interface.

**Architecture:** Use the existing API client wrapper (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) to invoke the dashboard endpoints, parse response structures in the component, and handle mutations with instant optimistic UI state updates.

**Tech Stack:** React 19, Next.js 16, Axios, Vitest, Testing Library.

## Global Constraints

- Expose no private user/school identifiers in the dropdown UI.
- Use CIVIL date formatting (`YYYY-MM-DD`) for all API payloads.
- Hide empty weather cards (`highlights`, `forecast`, `cities`) when the weather status is `provider_not_configured` or `location_missing`.
- Verify using focused test commands: `npx vitest src/features/dashboard` instead of the full test suite.

## Backend DTO References

Below is the exact response structure of the backend `/api/v1/dashboard/light-mode-dropdown` DTO from `Moazez-Backend`:

```typescript
export interface DashboardLightModeDropdownLocationDto {
  label: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  source: 'school_profile' | 'school_record' | 'fallback';
}

export interface DashboardLightModeDropdownWeatherCurrentDto {
  temperature: number | null;
  lowTemperature: number | null;
  feelsLike: number | null;
  condition: string;
  conditionCode: string;
  iconKey: string;
  observedAt: string | null;
}

export interface DashboardLightModeDropdownEmptyStateDto {
  reason: 'provider_not_configured' | 'location_missing';
  message: string;
}

export interface DashboardLightModeDropdownWeatherDto {
  status: string;
  provider: string | null;
  current: DashboardLightModeDropdownWeatherCurrentDto;
  emptyState: DashboardLightModeDropdownEmptyStateDto;
}

export interface DashboardLightModeDropdownPlannerEventDto {
  eventId: string;
  source:
    | 'academic_calendar'
    | 'attendance_session'
    | 'placement_test'
    | 'interview'
    | 'homework_due'
    | 'grade_assessment';
  eventType:
    | 'holiday'
    | 'exam'
    | 'activity'
    | 'other'
    | 'attendance'
    | 'placement_test'
    | 'interview'
    | 'homework_due'
    | 'assessment';
  title: string;
  date: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  tone: 'info' | 'warning' | 'success' | 'neutral';
  iconKey: string;
}

export interface DashboardLightModeDropdownPlannerTodoDto {
  todoId: string;
  date: string;
  title: string;
  notes: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'normal' | 'high';
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLightModeDropdownPlannerDto {
  timezone: string;
  date: string;
  eventDates: string[];
  events: DashboardLightModeDropdownPlannerEventDto[];
  todos: DashboardLightModeDropdownPlannerTodoDto[];
}

export interface DashboardLightModeDropdownResponseDto {
  generatedAt: string;
  location: DashboardLightModeDropdownLocationDto;
  weather: DashboardLightModeDropdownWeatherDto;
  hints: any[];
  highlights: any[];
  cities: any[];
  forecast: any[];
  planner: DashboardLightModeDropdownPlannerDto;
}
```

---

### Task 1: API Services Integration

Add the API definitions, query interfaces, and CRUD request wrappers to the dashboard API service and write matching unit tests.

**Files:**
- Modify: `src/features/dashboard/services/dashboardApiService.ts`
- Test: `src/features/dashboard/__tests__/dashboardApiService.test.ts`

**Interfaces:**
- Consumes: `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `@/lib/api`
- Produces:
  - `fetchLightModeDropdown(query?: FetchLightModeDropdownQuery)`
  - `fetchDashboardTodos(query?: FetchTodosQuery)`
  - `createDashboardTodo(body: CreateTodoBody)`
  - `updateDashboardTodo(todoId: string, body: UpdateTodoBody)`
  - `deleteDashboardTodo(todoId: string)`

- [ ] **Step 1: Write failing tests in `src/features/dashboard/__tests__/dashboardApiService.test.ts`**
  Add tests inside `describe("dashboardApiService")`:
  ```typescript
  it("requests light-mode-dropdown and todo CRUD paths", async () => {
    mockedApiGet
      .mockResolvedValueOnce({ location: { city: "Cairo" } })
      .mockResolvedValueOnce({ todos: [] });

    await fetchLightModeDropdown({ date: "2026-07-15", locale: "ar" });
    await fetchDashboardTodos({ status: "all" });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/dashboard/light-mode-dropdown?locale=ar&date=2026-07-15",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/dashboard/light-mode-dropdown/todos?status=all",
    );
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npx vitest src/features/dashboard/__tests__/dashboardApiService.test.ts`
  Expected: FAIL (functions not defined)

- [ ] **Step 3: Implement minimal code in `src/features/dashboard/services/dashboardApiService.ts`**
  ```typescript
  export interface FetchLightModeDropdownQuery {
    locale?: string;
    timezone?: string;
    units?: string;
    date?: string;
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
    priority?: "low" | "normal" | "high";
    sortOrder?: number;
  }

  export interface UpdateTodoBody {
    date?: string;
    title?: string;
    notes?: string | null;
    status?: "pending" | "completed";
    priority?: "low" | "normal" | "high";
    sortOrder?: number;
  }

  import { apiPost, apiPatch, apiDelete } from "@/lib/api";

  export function fetchLightModeDropdown(query: FetchLightModeDropdownQuery = {}) {
    return fetchDashboardContract<any>(
      `${DASHBOARD_BASE_PATH}/light-mode-dropdown${dashboardQueryString({
        locale: query.locale,
        timezone: query.timezone,
        units: query.units,
        date: query.date,
      })}`,
    );
  }

  export function fetchDashboardTodos(query: FetchTodosQuery = {}) {
    return fetchDashboardContract<any>(
      `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos${dashboardQueryString({
        date: query.date,
        status: query.status,
        limit: query.limit,
        timezone: query.timezone,
      })}`,
    );
  }

  export async function createDashboardTodo(body: CreateTodoBody) {
    const response = await apiPost<any>(
      `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos`,
      body
    );
    return unwrapDashboardResponse(response);
  }

  export async function updateDashboardTodo(todoId: string, body: UpdateTodoBody) {
    const response = await apiPatch<any>(
      `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`,
      body
    );
    return unwrapDashboardResponse(response);
  }

  export async function deleteDashboardTodo(todoId: string) {
    const response = await apiDelete<any>(
      `${DASHBOARD_BASE_PATH}/light-mode-dropdown/todos/${todoId}`
    );
    return unwrapDashboardResponse(response);
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest src/features/dashboard/__tests__/dashboardApiService.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/dashboard/services/dashboardApiService.ts src/features/dashboard/__tests__/dashboardApiService.test.ts
  git commit -m "feat(dashboard): add light mode dropdown and todos API endpoints"
  ```

---

### Task 2: Dropdown Integration & State Synchronization

Update the `LightModeDropdown` component to consume endpoints, synchronize date parameters, perform optimistic CRUD mutations, and display elegant fallback cards.

**Files:**
- Modify: `src/components/ui/dropdown/LightModeDropdown.tsx`
- Test: `src/features/dashboard/__tests__/LightModeDropdown.test.tsx`

**Interfaces:**
- Consumes: API service functions from Task 1

- [ ] **Step 1: Write integration tests in `src/features/dashboard/__tests__/LightModeDropdown.test.tsx`**
  ```typescript
  import { describe, expect, it, vi } from "vitest";
  import { render, screen, waitFor } from "@testing-library/react";
  import LightModeDropdown from "@/components/ui/dropdown/LightModeDropdown";
  import * as api from "@/features/dashboard/services/dashboardApiService";
  import { NextIntlClientProvider } from "next-intl";

  vi.mock("@/features/dashboard/services/dashboardApiService");

  const messages = {
    lightModeDropdown: {
      collapse: "Collapse",
      weatherStatus: "Weather Service",
      todoTitle: "Today's Todo List",
      low: "Low",
      feels: "Feels",
      clock: "Clock",
      calendar: "Calendar",
      priorities: { low: "Low", medium: "Medium", high: "High" },
    }
  };

  describe("LightModeDropdown Integration", () => {
    it("renders loading and fetches data when expanded", async () => {
      const mockFetch = vi.spyOn(api, "fetchLightModeDropdown").mockResolvedValue({
        location: { label: "Test School Location", city: "Cairo", country: "Egypt", resolvedTimezone: "Africa/Cairo" },
        weather: { status: "provider_not_configured", current: { condition: "Weather Unavailable" } },
        planner: { events: [], todos: [] },
      });

      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <LightModeDropdown defaultExpanded={true} />
        </NextIntlClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Test School Location")).toBeInTheDocument();
      });
      expect(mockFetch).toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npx vitest src/features/dashboard/__tests__/LightModeDropdown.test.tsx`
  Expected: FAIL (cannot fetch or mocks fail)

- [ ] **Step 3: Modify `LightModeDropdown.tsx`**
  - Import the new fetch and mutation wrappers.
  - Implement dynamic state loading inside `useEffect` triggered when `isExpanded` is true.
  - Parse response fields to construct `LightModeDropdownData` using `location`, `planner.todos`, `planner.events` and weather status.
  - Wire actions: `addTodo` calls `createDashboardTodo`, `toggleTodo` calls `updateDashboardTodo`, `deleteTodo` calls `deleteDashboardTodo`. Update local state array on success.
  - Set default condition message from emptyState, render a sleek pending card if weather status is not available, and conditionally hide highlights/forecast/cities.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest src/features/dashboard/__tests__/LightModeDropdown.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ui/dropdown/LightModeDropdown.tsx src/features/dashboard/__tests__/LightModeDropdown.test.tsx
  git commit -m "feat(dashboard): integrate LightModeDropdown UI with backend endpoints"
  ```
