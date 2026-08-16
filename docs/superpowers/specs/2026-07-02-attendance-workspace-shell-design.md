# Attendance Workspace Shell Design

## Goal

Standardize the repeated read-heavy attendance tabs after the contract-first service alignment. This pass covers:

- `src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx`
- `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`
- `src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx`
- `src/features/attendance/reports/pages/AttendanceReportsPage.tsx`

Roll-call and policies remain follow-up consumers after the shell stabilizes. Roll-call needs a session-picker rail and write-heavy action model. Policies needs a list/wizard variant.

## Current Shape

Absences, late/early, and excuses repeat the same workspace pattern:

- page wrapper with background and padding
- KPI/header area
- desktop filters in `AttendanceFiltersPanel`
- desktop `grid-cols-12` content split with table on the left and details card on the right
- mobile filter action button
- mobile bottom drawer for filters
- optional mobile bottom drawer for details
- table content wrapped in `AttendanceDataPanel`
- empty/select-scope states rendered through `AttendanceStatePanel`

Reports is a read-heavy analytics variant. It has the same outer workspace, filters, mobile filter drawer, loading, empty, and export concepts, but it uses a full-width stacked analytics body instead of a table/details split.

## Approach

Introduce a composition-based shared workspace shell. The shell owns layout, spacing, responsive structure, state-panel placement, and mobile action framing. Each page continues to own data fetching, filter state, table components, details components, drawers, exports, and modals.

This avoids a prop-heavy framework while still removing repeated layout decisions.

## Shared Components

Add a new shared component file:

`src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`

It will export small components rather than one large configuration object:

- `AttendanceWorkspaceShell`
  - Owns the outer `flex min-h-0 flex-1 flex-col` structure, background, padding, gap, and optional scroll behavior.
  - Accepts `children`, optional `readOnlyBanner`, and optional `className`.
- `AttendanceWorkspaceHeader`
  - Standardizes the top stacked area for scope header, KPI rows, and primary actions.
  - Accepts `children`.
- `AttendanceWorkspaceSplit`
  - Standardizes desktop `12-column` read-heavy layout.
  - Accepts `main`, `details`, and optional width classes.
  - Defaults to `main: col-span-8`, `details: col-span-4`.
- `AttendanceWorkspaceStack`
  - Standardizes full-width stacked content for reports.
  - Accepts `children`.
- `AttendanceWorkspaceMobileActions`
  - Wraps existing `AttendanceMobileActions` with consistent spacing and optional column count.
- `AttendanceWorkspaceContentPanel`
  - Wraps existing `AttendanceDataPanel` with consistent `flex-1`, `rounded-lg`, `border`, `overflow-hidden`, and `min-h-0` defaults.
- `AttendanceWorkspaceState`
  - Thin wrapper around `AttendanceStatePanel` for consistent full-height placement.

Existing shared primitives remain in use:

- `AttendanceDataPanel`
- `AttendanceDetailsCard`
- `AttendanceFiltersPanel`
- `AttendanceMobileActions`
- `AttendanceBottomDrawer`
- `AttendanceStatePanel`
- `AttendanceScopeHeader`

The new shell composes these primitives. It does not replace their public APIs.

## Page Integration

### Absences

Use `AttendanceWorkspaceShell` for the page wrapper, `AttendanceWorkspaceHeader` for scope and KPIs, `AttendanceWorkspaceSplit` for desktop table/details, `AttendanceWorkspaceMobileActions` for the mobile filter action, and `AttendanceWorkspaceContentPanel` for table loading/empty states.

Service integration:

- Keep using `fetchAbsenceRecords` for the table.
- Use the aligned service filters exactly as page state defines them.
- Integrate `fetchAbsenceSummary` only if it backs a visible summary/KPI section. Do not add a network request that does not drive UI.
- Keep `updateExcuse` and `updateEarlyLeaveMinutes` as page action services.

### Late/Early

Use the same shell structure as absences.

Service integration:

- Keep using `fetchIncidents` for the table.
- Keep `updateIncidentMinutes` for correction flows.
- Preserve the dedicated early-leave correction behavior already covered by service tests.
- Keep timetable and structure loading page-owned because they feed filter controls.

### Excuses

Use the same shell structure as absences with a two-column mobile action row for filters and create request.

Service integration:

- Keep using `fetchExcuseRequests` for the table.
- Keep create/update/delete/approve/reject services wired to the modal actions.
- Preserve attachment linking through the service layer; the page should not treat excuse request attachments as multipart uploads.
- Keep policy validation services page-owned because they validate modal form behavior before create/update.

### Reports

Use `AttendanceWorkspaceShell`, `AttendanceWorkspaceHeader`, `AttendanceWorkspaceStack`, `AttendanceWorkspaceMobileActions`, and the existing bottom drawer for mobile filters.

Service integration:

- Keep using `fetchAttendanceReportSummary` as the report aggregator.
- Keep `fetchDerivedDailyAbsences` as a separate service function and do not call it unless a visible report section consumes the returned rows.
- Preserve the service-boundary conversion where backend rates are `0..1` and current component-facing models receive percentage numbers.
- Keep URL query synchronization page-owned.

## Empty, Loading, and Error Behavior

The shell standardizes where states render, not what each state says.

- Loading states remain driven by each page's existing loading flag.
- Empty states keep each page's existing translation keys.
- Select-scope states keep existing scope completeness checks.
- Errors continue through existing toast handling for this pass.
- A later pass can add persistent inline error panels if product wants retry affordances on every tab.

## Mobile Behavior

Mobile pages should use one consistent action row directly above the content panel:

- single-column actions for absences, late/early, and reports
- two-column actions for excuses because it has filter and create actions
- filter controls open in `AttendanceBottomDrawer` or the page's existing drawer component
- details continue to open in bottom drawers for table rows

No sticky mobile action bar is introduced in this pass. That avoids overlapping table content and keeps the change focused.

## Visual Rules

- Use existing CSS variables for background, card, border, and text colors.
- Keep page sections unframed; use cards only for filters, data panels, details, and repeated content.
- Use `rounded-lg`/`rounded-xl` consistently according to existing attendance components.
- Preserve Lucide icons already used in actions.
- Keep dense dashboard spacing: `p-4`, `gap-4`, `min-h-0`, and stable panel dimensions.

## Testing

Add focused tests for the new shell only if the project has an existing pattern for shared layout tests. Otherwise verify through page tests and TypeScript.

Required verification:

- `npm run test:run -- src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts`
- `npm run typecheck`
- scoped eslint on changed attendance files

If page component tests already exist or are added during implementation, run those too. Full `npm run lint` currently fails on unrelated files under `docs/Reusable Light Mode Dropdown`, so the implementation should report full lint separately from scoped attendance lint unless those unrelated errors are fixed in a separate task.

## Out of Scope

- Roll-call workspace shell adoption
- Policies workspace shell adoption
- Teacher App classroom attendance screens
- Replacing page-owned filter state with one generic filter engine
- Adding new report sections for derived daily absences without visible product use
- Broad visual redesign outside attendance pages
