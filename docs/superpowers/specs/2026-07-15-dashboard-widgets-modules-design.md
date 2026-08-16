# Design Specification - Dashboard Widgets & Module Pages Integration

## 1. Goal & Context
The goal is to dynamically load and display module-specific dashboard views, widgets registries, and details as tabs for each module. 

Instead of hardcoded high-level tabs, the system will:
1. Load the active modules dynamically from `GET /api/v1/dashboard/modules?status=available`.
2. Generate dynamic tab bar options (starting with a static "Overview" tab, followed by all loaded module tabs).
3. Fetch module-specific data from `GET /api/v1/dashboard/modules/:moduleKey` on-demand when a tab is clicked.
4. Cache the retrieved data in React state to make switch-backs instantaneous.
5. Render a rich module-specific layout with Quick Stats, scoped Risks/Next Actions, assigned Widgets (of type `stat-card`, `progress-card`, `todo-card`, etc.), and dynamic Charts using the existing `@mui/x-charts` library.

---

## 2. API Service Layer & DTO Types

We will extend [dashboardApiService.ts](file:///e:/sis-dashboard/src/features/dashboard/services/dashboardApiService.ts) and [dashboardApi.types.ts](file:///e:/sis-dashboard/src/features/dashboard/types/dashboardApi.types.ts):

### Data Structures
- `DashboardModuleListItem`: Mapped from `DashboardModuleListItemDto` (identity, status, summary stats, capability toggles).
- `DashboardModulePage`: Mapped from `DashboardModulePageResponseDto`. Includes:
  - `module`: Base identity, title, description, routes.
  - `overview`: Quick stats, scoped risks, and prioritized next actions.
  - `widgets`: Registry widgets assigned to the module.
  - `analytics`: Scoped chart definitions and computed trend data.
- `DashboardWidget`: Registry widget object containing type, title, tone, and data payload.

### Endpoints
- `fetchDashboardModules()`: Calls `GET /api/v1/dashboard/modules?status=available`
- `fetchDashboardModuleByKey(moduleKey)`: Calls `GET /api/v1/dashboard/modules/:moduleKey`
- `fetchDashboardWidgets(query)`: Calls `GET /api/v1/dashboard/widgets` (optional utility/list search)

---

## 3. UI State Flow & Caching

### State Hooks in `SchoolDashboardContainer` / `SchoolDashboardView`
- `modules`: List of active modules fetched on mount.
- `activeTab`: Currently active tab ID (can be `"overview"` or any active module key like `"admissions"`, `"academics"`, etc.).
- `cachedModules`: A cache dictionary (`Record<string, DashboardModulePage>`) storing resolved module data.
- `tabLoadingState`: Track loading status per module key (`loading` | `success` | `error`).

### Switching Tab Action
When tab is clicked:
1. Switch `activeTab` to target key.
2. If the tab is `"overview"`, render the standard comprehensive dashboard layout.
3. If the tab is a module key:
   - Check if `cachedModules[moduleKey]` exists.
   - If it exists, render the `ModuleTabDashboardView` immediately using cached data.
   - If not, set `tabLoadingState[moduleKey]` to `loading`, fetch via `fetchDashboardModuleByKey(moduleKey)`, save response to `cachedModules[moduleKey]`, and update state to render.

---

## 4. UI Layout & Component Design

The dynamic module tab page renders the following sections:

### 4.1 Header block
- Module title (e.g. "Admissions Dashboard"), description, and quick link button to navigate to the full frontend route of the module.

### 4.2 Quick Stats Grid
- A row of summary metrics cards (`grid-cols-2 lg:grid-cols-4`).
- Styled with modern, high-contrast typography, hover translation animations, and matching visual icons.

### 4.3 Risks & Next Actions Row
- **Module Risks (Left, 2/3 width)**:
  - Displays list of warning/critical risks. Each row is interactive and links to the resolution screen.
- **Next Actions (Right, 1/3 width)**:
  - Check-list of prioritised tasks with status tags and navigational triggers.

### 4.4 Widgets Grid
- Renders custom cards based on widget type:
  - `stat-card`: Standard numerical KPI layout.
  - `progress-card`: Displays structured percentage segments.
  - `todo-card`: Quick checklist of tasks.
  - `calendar-card` / `timeline-card`: Vertical list of events or assessments.

### 4.5 Scoped Charts Card
- Render computed charts using `@mui/x-charts`:
  - Match dynamic `analytics.availableData` to `LineChart` (for line trends) or `BarChart` (for comparisons).
  - Use exact theme colors (Slate primary `#0F172A`, emerald positive trend `#22C55E`, and warning tones).

---

## 5. Verification & Test Plan

### Automated Test Suites
- Create [SchoolDashboardView.test.tsx](file:///e:/sis-dashboard/src/features/dashboard/__tests__/SchoolDashboardView.test.tsx) updates or specialized dynamic tabs test suite to assert:
  - Correct render of tab selectors on module load.
  - Loading spinner displayed on first tab click.
  - Correct mapping and render of widgets, quick stats, risks, and next actions on API resolution.
  - Re-fetches are skipped when switching back to a cached tab.

### Manual Verification
- Expand tabs, verify interactive state transitions, loading indicators, and responsiveness.
