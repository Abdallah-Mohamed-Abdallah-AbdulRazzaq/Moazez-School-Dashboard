# Dashboard Widgets & Module Pages Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically load module-specific dashboard views, widgets registry, and details as tabs for each module using state caching and Material-UI charts.

**Architecture:** Fetch active modules on dashboard mount to render dynamic tabs. Switch to a module tab lazily fetches the module page details, caches them in a state-based dictionary, and displays KPI stats, scoped risks, prioritised actions, and widgets (including Material-UI Line/Bar charts).

**Tech Stack:** React, Next.js, Material-UI Charts (`@mui/x-charts`), Lucide icons, Vitest.

## Global Constraints
- Do not run `npm run test:run` or similar broad tests; always run focused tests using `npx vitest src/features/dashboard`.
- Avoid emojis as icons; use Lucide/Heroicons SVG components.
- Enable smooth hover animations (`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`) on all interactive cards.

---

### Task 1: API Services & DTO Types

**Files:**
- Modify: [dashboardApiService.ts](file:///e:/sis-dashboard/src/features/dashboard/services/dashboardApiService.ts)
- Modify: [dashboardApi.types.ts](file:///e:/sis-dashboard/src/features/dashboard/types/dashboardApi.types.ts)
- Modify: [dashboardApiService.test.ts](file:///e:/sis-dashboard/src/features/dashboard/__tests__/dashboardApiService.test.ts)

**Interfaces:**
- Consumes: None (raw axios/fetch api client).
- Produces: 
  - `fetchDashboardModules()`: returns `Promise<DashboardModuleListItem[]>`
  - `fetchDashboardModuleByKey(moduleKey: string)`: returns `Promise<DashboardModulePage>`

- [ ] **Step 1: Write the failing tests in `dashboardApiService.test.ts`**
  ```typescript
  describe("fetchDashboardModules", () => {
    it("should fetch list of active dashboard modules", async () => {
      // Mock and assert correct GET query
    });
  });

  describe("fetchDashboardModuleByKey", () => {
    it("should fetch details for a specific module key", async () => {
      // Mock and assert correct GET path
    });
  });
  ```
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/dashboard/__tests__/dashboardApiService.test.ts`
  Expected: FAIL (missing imports/functions)
- [ ] **Step 3: Add types to `dashboardApi.types.ts`**
  Add `DashboardModuleListItem`, `DashboardModulePage`, `DashboardWidget` types matching the backend structures.
- [ ] **Step 4: Implement fetch functions in `dashboardApiService.ts`**
  Implement `fetchDashboardModules` and `fetchDashboardModuleByKey` using standard axios wrapper.
- [ ] **Step 5: Run tests to verify they pass**
  Run: `npx vitest run src/features/dashboard/__tests__/dashboardApiService.test.ts`
  Expected: PASS
- [ ] **Step 6: Commit**
  ```bash
  git add src/features/dashboard/services/dashboardApiService.ts src/features/dashboard/types/dashboardApi.types.ts src/features/dashboard/__tests__/dashboardApiService.test.ts
  git commit -m "feat(dashboard): implement api services and types for dynamic modules"
  ```

---

### Task 2: State Controls & Caching

**Files:**
- Modify: [SchoolDashboardContainer.tsx](file:///e:/sis-dashboard/src/features/dashboard/container/SchoolDashboardContainer.tsx)
- Modify: [SchoolDashboardView.tsx](file:///e:/sis-dashboard/src/features/dashboard/views/SchoolDashboardView.tsx)
- Modify: [SchoolDashboardContainer.test.tsx](file:///e:/sis-dashboard/src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx)

**Interfaces:**
- Consumes: `fetchDashboardModules`, `fetchDashboardModuleByKey` from Task 1.
- Produces: Dynamically mapped tab bar selector and caching orchestrator in dashboard view.

- [ ] **Step 1: Write the failing test in `SchoolDashboardContainer.test.tsx`**
  Assert that modules are fetched on mount and tabs are rendered dynamically.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`
  Expected: FAIL
- [ ] **Step 3: Modify `SchoolDashboardContainer.tsx`**
  Add state hooks for `modules` (fetch on mount) and cache management `cachedModules` + loading/error states. Pass them down to the view.
- [ ] **Step 4: Update `SchoolDashboardView.tsx`**
  Replace static `dashboardTabs` with dynamic ones mapping from `modules` array.
- [ ] **Step 5: Run tests to verify they pass**
  Run: `npx vitest run src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx`
  Expected: PASS
- [ ] **Step 6: Commit**
  ```bash
  git add src/features/dashboard/container/SchoolDashboardContainer.tsx src/features/dashboard/views/SchoolDashboardView.tsx src/features/dashboard/__tests__/SchoolDashboardContainer.test.tsx
  git commit -m "feat(dashboard): integrate dynamic tabs and on-demand caching state"
  ```

---

### Task 3: ModuleTabDashboardView & Widgets Layout

**Files:**
- Create: `src/features/dashboard/components/ModuleTabDashboardView.tsx`
- Create: `src/features/dashboard/components/ModuleWidgetCard.tsx`
- Modify: [SchoolDashboardView.tsx](file:///e:/sis-dashboard/src/features/dashboard/views/SchoolDashboardView.tsx)
- Create: `src/features/dashboard/__tests__/ModuleTabDashboardView.test.tsx`

**Interfaces:**
- Consumes: `DashboardModulePage` details from Task 2.
- Produces: Layout matching stats, actions, risks, widgets grid, and line/bar charts.

- [ ] **Step 1: Write the failing test in `ModuleTabDashboardView.test.tsx`**
  Assert correct widgets, quick stats, risks, and charts are mapped and rendered.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/dashboard/__tests__/ModuleTabDashboardView.test.tsx`
  Expected: FAIL
- [ ] **Step 3: Implement `ModuleWidgetCard.tsx`**
  Create cards for `stat-card`, `progress-card` (SVG segments), `todo-card` (checklist), and `calendar-card` (timeline list).
- [ ] **Step 4: Implement `ModuleTabDashboardView.tsx`**
  Create the view that lists Quick Stats, scoped Risks/Actions, Widgets grid, and charts. Map dynamic trend data to `@mui/x-charts/LineChart` or `BarChart`.
- [ ] **Step 5: Integrate into `SchoolDashboardView.tsx`**
  When a module tab is selected and resolved, render `ModuleTabDashboardView`.
- [ ] **Step 6: Run tests to verify they pass**
  Run: `npx vitest run src/features/dashboard`
  Expected: PASS
- [ ] **Step 7: Commit**
  ```bash
  git add src/features/dashboard/components/ModuleTabDashboardView.tsx src/features/dashboard/components/ModuleWidgetCard.tsx src/features/dashboard/views/SchoolDashboardView.tsx src/features/dashboard/__tests__/ModuleTabDashboardView.test.tsx
  git commit -m "feat(dashboard): implement module tab view layout, widget components, and chart rendering"
  ```
