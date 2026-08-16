# Design Specification: Light Mode Dropdown & Todo CRUD Integration

## 1. Goal

Integrate the mock-based `LightModeDropdown` component and personal Todo list with the real backend APIs to display actual locations, calendar event indicators, and support complete create, read, update, and delete operations on the user's Todo records.

## 2. User Review Required

> [!IMPORTANT]
> **Weather Status Fallback**: Since the backend weather provider is officially deferred/unavailable for V1 (`status: 'provider_not_configured'`), we will render a beautiful **Weather Integration Pending** panel inside the main weather card showing the backend's empty state message. The empty weather secondary cards (highlights, cities, forecast) will be hidden to provide a clean, focused, and premium layout.

## 3. Proposed Changes

We will introduce the API contracts and hooks in the dashboard feature module, update the `LightModeDropdown` component, and integrate the network handlers.

### 3.1 API Client Extensions

#### [MODIFY] [dashboardApiService.ts](file:///e:/sis-dashboard/src/features/dashboard/services/dashboardApiService.ts)
We will add the following endpoints to interface with the `/api/v1/dashboard/light-mode-dropdown` routes:
- `fetchLightModeDropdown(query)`
- `fetchDashboardTodos(query)`
- `createDashboardTodo(body)`
- `updateDashboardTodo(todoId, body)`
- `deleteDashboardTodo(todoId)`

### 3.2 UI Component Updates

#### [MODIFY] [LightModeDropdown.tsx](file:///e:/sis-dashboard/src/components/ui/dropdown/LightModeDropdown.tsx)
- Integrate network requests on mount and date selection changes.
- Parse the backend's DTO format into the component's internal structure.
- Map the backend Todo DTO (`todoId`, `notes`, `status`, etc.) to the local React state.
- Wire the UI action handlers (Add, Toggle, Delete, Edit) to call the corresponding dashboard endpoints.
- Render a premium placeholder for weather when the status is not `available`.

## 4. Verification Plan

### Automated Tests
- Run focused tests with `npx vitest src/features/dashboard` to verify that dashboard-related tests pass.
- Add unit tests in `dashboardApiService.test.ts` to cover the new endpoints.
- Add integration tests in `LightModeDropdown.test.tsx` or similar.

### Manual Verification
- Expand the Light Mode Dropdown on the dashboard page.
- Verify the location reflects the active school context.
- Verify today's clock, day, and month calendar labels match.
- Add a new Todo, toggle it to completed, edit it, and delete it. Verify changes persist across re-expansion.
