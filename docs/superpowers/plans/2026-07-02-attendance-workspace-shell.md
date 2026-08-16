# Attendance Workspace Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a shared read-heavy attendance workspace shell and migrate absences, late/early, excuses, and reports to it while preserving the aligned service integrations.

**Architecture:** Add composition-based shell primitives in `AttendanceWorkspaceShell.tsx`. Pages keep their own data fetching, filters, tables, drawers, exports, and modals; the shell owns repeated spacing, desktop split layout, mobile action framing, content panel defaults, and state placement. Do not migrate roll-call or policies in this pass.

**Tech Stack:** Next.js client components, React, TypeScript, Tailwind utility classes, existing attendance shared components, Vitest service tests, ESLint, `tsc`.

---

## File Structure

- Create: `src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`
  - Exports layout-only shell primitives:
    - `AttendanceWorkspaceShell`
    - `AttendanceWorkspaceHeader`
    - `AttendanceWorkspaceSplit`
    - `AttendanceWorkspaceStack`
    - `AttendanceWorkspaceMobileActions`
    - `AttendanceWorkspaceContentPanel`
    - `AttendanceWorkspaceState`
- Modify: `src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx`
  - Replace repeated workspace wrappers with shell primitives.
  - Keep `fetchAbsenceRecords`, `updateExcuse`, `updateEarlyLeaveMinutes`, and existing filter state.
- Modify: `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`
  - Replace repeated workspace wrappers with shell primitives.
  - Keep `fetchIncidents`, `updateIncidentMinutes`, structure loading, and timetable loading.
- Modify: `src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx`
  - Replace repeated workspace wrappers with shell primitives.
  - Keep excuse CRUD/decision services and policy validation services.
- Modify: `src/features/attendance/reports/pages/AttendanceReportsPage.tsx`
  - Replace repeated workspace wrappers with shell primitives.
  - Keep `fetchAttendanceReportSummary`, URL query sync, drilldowns, and export modal.
  - Do not call `fetchDerivedDailyAbsences`.

## Task 1: Add Shared Workspace Shell

**Files:**
- Create: `src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`

- [ ] **Step 1: Create the shell component file**

Use `apply_patch` to add this file:

```tsx
"use client";

import type { PropsWithChildren, ReactNode } from "react";
import AttendanceDataPanel from "./AttendanceDataPanel";
import AttendanceMobileActions from "./AttendanceMobileActions";
import AttendanceStatePanel from "./AttendanceStatePanel";

type WorkspaceColumns = "8/4" | "9/3";

interface AttendanceWorkspaceShellProps extends PropsWithChildren {
  readOnlyBanner?: ReactNode;
  className?: string;
  contentClassName?: string;
  scrollable?: boolean;
}

export function AttendanceWorkspaceShell({
  children,
  readOnlyBanner,
  className = "",
  contentClassName = "",
  scrollable = false,
}: AttendanceWorkspaceShellProps) {
  const scrollClassName = scrollable ? "overflow-auto" : "overflow-hidden";

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      {readOnlyBanner}
      <div
        className={`flex min-h-0 flex-1 flex-col gap-4 p-4 ${scrollClassName} ${contentClassName}`.trim()}
        style={{ backgroundColor: "var(--background)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function AttendanceWorkspaceHeader({ children }: PropsWithChildren) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

interface AttendanceWorkspaceSplitProps {
  main: ReactNode;
  details: ReactNode;
  columns?: WorkspaceColumns;
  className?: string;
}

export function AttendanceWorkspaceSplit({
  main,
  details,
  columns = "8/4",
  className = "",
}: AttendanceWorkspaceSplitProps) {
  const mainClassName = columns === "9/3" ? "col-span-9" : "col-span-8";
  const detailsClassName = columns === "9/3" ? "col-span-3" : "col-span-4";

  return (
    <div className={`grid min-h-0 flex-1 grid-cols-12 gap-4 ${className}`.trim()}>
      <div className={`${mainClassName} flex min-h-0 flex-col gap-4`}>
        {main}
      </div>
      <div className={`${detailsClassName} min-h-0`}>{details}</div>
    </div>
  );
}

export function AttendanceWorkspaceStack({ children }: PropsWithChildren) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>;
}

interface AttendanceWorkspaceMobileActionsProps extends PropsWithChildren {
  columns?: 1 | 2;
  className?: string;
}

export function AttendanceWorkspaceMobileActions({
  children,
  columns = 1,
  className = "",
}: AttendanceWorkspaceMobileActionsProps) {
  return (
    <AttendanceMobileActions columns={columns} className={className}>
      {children}
    </AttendanceMobileActions>
  );
}

interface AttendanceWorkspaceContentPanelProps extends PropsWithChildren {
  loading?: boolean;
  className?: string;
  loaderClassName?: string;
}

export function AttendanceWorkspaceContentPanel({
  children,
  loading = false,
  className = "",
  loaderClassName = "flex h-full items-center justify-center",
}: AttendanceWorkspaceContentPanelProps) {
  return (
    <AttendanceDataPanel
      loading={loading}
      className={`flex-1 rounded-lg border overflow-hidden min-h-0 ${className}`.trim()}
      loaderClassName={loaderClassName}
    >
      {children}
    </AttendanceDataPanel>
  );
}

interface AttendanceWorkspaceStateProps {
  title: string;
  description?: string;
  compact?: boolean;
}

export function AttendanceWorkspaceState({
  title,
  description,
  compact = false,
}: AttendanceWorkspaceStateProps) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center">
      <AttendanceStatePanel
        title={title}
        description={description}
        compact={compact}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript on the new component**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run scoped eslint on the new component**

Run:

```bash
npx eslint src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
```

Expected: PASS with 0 errors.

- [ ] **Step 4: Commit the shell component**

Run:

```bash
git add src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
git commit -m "feat: add attendance workspace shell"
```

## Task 2: Migrate Absences Page

**Files:**
- Modify: `src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx`

- [ ] **Step 1: Replace shared layout imports**

Remove these imports:

```tsx
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
```

Add:

```tsx
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceSplit,
  AttendanceWorkspaceStack,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
```

Keep these imports:

```tsx
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceDetailsCard from "@/features/attendance/shared/components/AttendanceDetailsCard";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
```

- [ ] **Step 2: Replace no-year/term state wrapper**

Replace the no-year/term return with:

```tsx
return (
  <AttendanceWorkspaceShell>
    <AttendanceWorkspaceState
      title={t("emptyStates.noYearTerm.title")}
      description={t("emptyStates.noYearTerm.description")}
    />
  </AttendanceWorkspaceShell>
);
```

- [ ] **Step 3: Extract the table state body**

Add this local constant before the main return:

```tsx
const recordsBody = isScopeSelectionIncomplete ? (
  <AttendanceWorkspaceState
    title={t("emptyStates.selectScope.title")}
    description={t("emptyStates.selectScope.description")}
  />
) : records.length === 0 ? (
  <AttendanceWorkspaceState
    title={t("emptyStates.noRecords.title")}
    description={t("emptyStates.noRecords.description")}
  />
) : (
  <AbsencesTable
    records={records}
    onRecordClick={handleRecordClick}
    onEditExcuse={handleEditExcuse}
    onEditEarlyLeave={handleEditEarlyLeave}
    isReadOnly={isReadOnly}
  />
);
```

- [ ] **Step 4: Replace main layout wrapper**

Replace:

```tsx
<div className="flex min-h-0 flex-1 flex-col">
  <div className="flex-1 flex flex-col gap-4 p-4 min-h-0">
```

with:

```tsx
<AttendanceWorkspaceShell>
```

Then replace the matching closing `</div></div>` pair before the drawers/modals with:

```tsx
</AttendanceWorkspaceShell>
```

- [ ] **Step 5: Wrap header content**

Replace the top `AttendanceScopeHeader` and `AbsencesKpisBar` section with:

```tsx
<AttendanceWorkspaceHeader>
  <AttendanceScopeHeader
    isReadOnly={isReadOnly}
    scopeType={filters.scopeType}
    scopeIds={filters.scopeIds}
    stages={structureTree?.stages || []}
    grades={structureTree?.grades || []}
    sections={structureTree?.sections || []}
    classrooms={structureTree?.classrooms || []}
  />
  <AbsencesKpisBar kpis={kpis} />
</AttendanceWorkspaceHeader>
```

- [ ] **Step 6: Replace desktop split**

Replace the desktop `grid grid-cols-12` block with:

```tsx
{!isMobile && (
  <AttendanceWorkspaceSplit
    main={
      <>
        <AttendanceFiltersPanel className="rounded-lg">
          <AbsencesFiltersBar
            filters={{ ...filters, search: searchInput }}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onExport={() => setShowExportModal(true)}
            isReadOnly={isReadOnly}
            structureTree={structureTree}
          />
        </AttendanceFiltersPanel>
        <AttendanceWorkspaceContentPanel loading={isLoading}>
          {recordsBody}
        </AttendanceWorkspaceContentPanel>
      </>
    }
    details={
      <AttendanceDetailsCard className="rounded-lg">
        <AbsenceDetailsPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onEditExcuse={handleEditExcuse}
          onEditEarlyLeave={handleEditEarlyLeave}
          isReadOnly={isReadOnly}
        />
      </AttendanceDetailsCard>
    }
  />
)}
```

- [ ] **Step 7: Replace mobile layout**

Replace the mobile layout block with:

```tsx
{isMobile && (
  <AttendanceWorkspaceStack>
    <AttendanceWorkspaceMobileActions>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Filter className="w-4 h-4" />}
        onClick={() => setShowFiltersDrawer(true)}
      >
        {t("filters.filters")}
      </Button>
    </AttendanceWorkspaceMobileActions>
    <AttendanceWorkspaceContentPanel loading={isLoading}>
      {recordsBody}
    </AttendanceWorkspaceContentPanel>
  </AttendanceWorkspaceStack>
)}
```

- [ ] **Step 8: Run absences verification**

Run:

```bash
npm run test:run -- src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts
npx eslint src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
npm run typecheck
```

Expected: service tests pass, scoped eslint has 0 errors, typecheck passes.

- [ ] **Step 9: Commit absences migration**

Run:

```bash
git add src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
git commit -m "refactor: use workspace shell on attendance absences"
```

## Task 3: Migrate Late/Early Page

**Files:**
- Modify: `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`

- [ ] **Step 1: Replace shared layout imports**

Remove:

```tsx
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
```

Add:

```tsx
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceSplit,
  AttendanceWorkspaceStack,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
```

- [ ] **Step 2: Replace no-year/term state wrapper**

Use:

```tsx
return (
  <AttendanceWorkspaceShell>
    <AttendanceWorkspaceState
      title={t("emptyStates.noYearTerm.title")}
      description={t("emptyStates.noYearTerm.description")}
    />
  </AttendanceWorkspaceShell>
);
```

- [ ] **Step 3: Extract incident body**

Add before the main return:

```tsx
const incidentsBody = isScopeSelectionIncomplete ? (
  <AttendanceWorkspaceState
    title={t("emptyStates.selectScope.title")}
    description={t("emptyStates.selectScope.description")}
  />
) : incidents.length === 0 ? (
  <AttendanceWorkspaceState
    title={t("emptyStates.noRecords.title")}
    description={t("emptyStates.noRecords.description")}
  />
) : (
  <LateEarlyTable
    incidents={incidents}
    isReadOnly={isReadOnly}
    onView={handleOpenIncident}
    onEditMinutes={handleEditMinutes}
  />
);
```

- [ ] **Step 4: Replace main wrapper and header**

Replace the outer content wrapper with:

```tsx
<AttendanceWorkspaceShell>
  <AttendanceWorkspaceHeader>
    <AttendanceScopeHeader
      isReadOnly={isReadOnly}
      scopeType={filters.scopeType}
      scopeIds={filters.scopeIds}
      stages={stages}
      grades={grades}
      sections={sections}
      classrooms={classrooms}
    />
    <LateEarlyKpisBar kpis={kpis} />
  </AttendanceWorkspaceHeader>
```

Close it before the filters drawer with:

```tsx
</AttendanceWorkspaceShell>
```

- [ ] **Step 5: Replace desktop and mobile content**

Desktop:

```tsx
{!isMobile && (
  <AttendanceWorkspaceSplit
    main={
      <>
        <AttendanceFiltersPanel>
          <LateEarlyFiltersBar
            filters={{ ...filters, search: searchInput }}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            periods={periods}
            onFiltersChange={(patch) => {
              if ("search" in patch) {
                setSearchInput(patch.search || "");
              }
              setFilters((prev) => ({ ...prev, ...patch }));
            }}
            onResetFilters={resetFilters}
            onOpenExport={() => setShowExportModal(true)}
          />
        </AttendanceFiltersPanel>
        <AttendanceWorkspaceContentPanel loading={loading}>
          {incidentsBody}
        </AttendanceWorkspaceContentPanel>
      </>
    }
    details={
      <AttendanceDetailsCard>
        <IncidentDetailsDrawer
          incident={selectedIncident}
          isReadOnly={isReadOnly}
          onClose={() => setSelectedIncident(null)}
          onEditMinutes={handleEditMinutes}
        />
      </AttendanceDetailsCard>
    }
  />
)}
```

Mobile:

```tsx
{isMobile && (
  <AttendanceWorkspaceStack>
    <AttendanceWorkspaceMobileActions>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Filter className="w-4 h-4" />}
        onClick={() => setFiltersDrawerOpen(true)}
      >
        {t("filters.filters")}
      </Button>
    </AttendanceWorkspaceMobileActions>
    <AttendanceWorkspaceContentPanel loading={loading}>
      {incidentsBody}
    </AttendanceWorkspaceContentPanel>
  </AttendanceWorkspaceStack>
)}
```

- [ ] **Step 6: Run late/early verification**

Run:

```bash
npm run test:run -- src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts
npx eslint src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
npm run typecheck
```

Expected: service tests pass, scoped eslint has 0 errors, typecheck passes.

- [ ] **Step 7: Commit late/early migration**

Run:

```bash
git add src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx
git commit -m "refactor: use workspace shell on late early attendance"
```

## Task 4: Migrate Excuses Page

**Files:**
- Modify: `src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx`

- [ ] **Step 1: Replace shared layout imports**

Remove:

```tsx
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
```

Add:

```tsx
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceSplit,
  AttendanceWorkspaceStack,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
```

- [ ] **Step 2: Replace no-year/term state wrapper**

Use:

```tsx
return (
  <AttendanceWorkspaceShell>
    <AttendanceWorkspaceState
      title={t("emptyStates.noYearTerm.title")}
      description={t("emptyStates.noYearTerm.description")}
    />
  </AttendanceWorkspaceShell>
);
```

- [ ] **Step 3: Extract request body**

Add before the main return:

```tsx
const requestsBody = requests.length === 0 ? (
  <AttendanceWorkspaceState
    title={t("emptyStates.noRecords.title")}
    description={t("emptyStates.noRecords.description")}
  />
) : (
  <ExcusesTable
    requests={requests}
    isReadOnly={isReadOnly}
    onView={(request) => {
      setSelectedRequest(request);
      if (isMobile) {
        setShowDetailsDrawer(true);
      }
    }}
    onApprove={(request) => openDecision(request, "APPROVE")}
    onReject={(request) => openDecision(request, "REJECT")}
    onEdit={handleEditRequest}
    onDelete={(request) => setDeleteTarget(request)}
  />
);
```

- [ ] **Step 4: Replace main wrapper and header**

Use:

```tsx
<AttendanceWorkspaceShell>
  <AttendanceWorkspaceHeader>
    <ExcusesKpisBar kpis={kpis} />
    {!isMobile && (
      <div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isReadOnly}
          onClick={handleCreateRequest}
        >
          {t("createRequest")}
        </Button>
      </div>
    )}
  </AttendanceWorkspaceHeader>
```

Close it before `ExcusesFiltersDrawer` with:

```tsx
</AttendanceWorkspaceShell>
```

- [ ] **Step 5: Replace desktop and mobile content**

Desktop:

```tsx
{!isMobile && (
  <AttendanceWorkspaceSplit
    main={
      <>
        <AttendanceFiltersPanel>
          <ExcusesFiltersBar
            filters={filters}
            onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onReset={resetFilters}
            onOpenExport={() => setShowExportModal(true)}
          />
        </AttendanceFiltersPanel>
        <AttendanceWorkspaceContentPanel loading={loading}>
          {requestsBody}
        </AttendanceWorkspaceContentPanel>
      </>
    }
    details={
      <AttendanceDetailsCard>
        <ExcuseDetailsDrawer
          request={selectedRequest}
          effectivePolicy={selectedRequestPolicy}
          isReadOnly={isReadOnly}
          onClose={() => setSelectedRequest(null)}
          onApprove={(request) => openDecision(request, "APPROVE")}
          onReject={(request) => openDecision(request, "REJECT")}
          onEdit={handleEditRequest}
        />
      </AttendanceDetailsCard>
    }
  />
)}
```

Mobile:

```tsx
{isMobile && (
  <AttendanceWorkspaceStack>
    <AttendanceWorkspaceMobileActions columns={2}>
      <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} onClick={() => setShowFiltersDrawer(true)}>
        {t("filters.filters")}
      </Button>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus className="w-4 h-4" />}
        disabled={isReadOnly}
        onClick={handleCreateRequest}
      >
        {t("createRequest")}
      </Button>
    </AttendanceWorkspaceMobileActions>
    <AttendanceWorkspaceContentPanel loading={loading}>
      {requestsBody}
    </AttendanceWorkspaceContentPanel>
  </AttendanceWorkspaceStack>
)}
```

- [ ] **Step 6: Run excuses verification**

Run:

```bash
npm run test:run -- src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts
npx eslint src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
npm run typecheck
```

Expected: service tests pass, scoped eslint has 0 errors, typecheck passes.

- [ ] **Step 7: Commit excuses migration**

Run:

```bash
git add src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx
git commit -m "refactor: use workspace shell on attendance excuses"
```

## Task 5: Migrate Reports Page

**Files:**
- Modify: `src/features/attendance/reports/pages/AttendanceReportsPage.tsx`

- [ ] **Step 1: Replace mobile action import**

Remove:

```tsx
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
```

Add:

```tsx
import {
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceStack,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
```

Keep:

```tsx
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
```

- [ ] **Step 2: Replace no-year/term state wrapper**

Use the existing `ReportsEmptyState`, but put it inside the shell:

```tsx
return (
  <AttendanceWorkspaceShell>
    <ReportsEmptyState
      title={t("emptyStates.noYearTerm.title")}
      description={t("emptyStates.noYearTerm.description")}
    />
  </AttendanceWorkspaceShell>
);
```

- [ ] **Step 3: Replace main wrapper**

Replace:

```tsx
<div className="flex min-h-0 flex-1 flex-col">
  <div className="flex-1 p-4 flex flex-col gap-4 min-h-0 overflow-auto" style={{ backgroundColor: "var(--background)" }}>
```

with:

```tsx
<AttendanceWorkspaceShell scrollable>
```

Close it before the filter drawer with:

```tsx
</AttendanceWorkspaceShell>
```

- [ ] **Step 4: Wrap header/filter actions**

Use:

```tsx
<AttendanceWorkspaceHeader>
  {structure ? (
    <AttendanceScopeHeader
      isReadOnly={termContext.isReadOnly}
      scopeType={filters.scopeType}
      scopeIds={filters.scopeIds}
      stages={structure.stages}
      grades={structure.grades}
      sections={structure.sections}
      classrooms={structure.classrooms}
    />
  ) : null}

  {!isMobile ? (
    <AttendanceFiltersPanel>
      <ReportsFiltersBar
        filters={filters}
        stages={structure?.stages || []}
        grades={structure?.grades || []}
        sections={structure?.sections || []}
        classrooms={structure?.classrooms || []}
        students={report?.studentOptions || []}
        onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={resetFilters}
        onOpenExport={() => setShowExportModal(true)}
        exportDisabled={!exportPayload?.data.length}
      />
    </AttendanceFiltersPanel>
  ) : (
    <AttendanceWorkspaceMobileActions>
      <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} onClick={() => setFiltersDrawerOpen(true)}>
        {t("filters.open")}
      </Button>
    </AttendanceWorkspaceMobileActions>
  )}
</AttendanceWorkspaceHeader>
```

- [ ] **Step 5: Wrap analytics body in stack**

Wrap the loading/report/empty block with:

```tsx
<AttendanceWorkspaceStack>
  {loading ? (
    <ReportsLoadingState />
  ) : report ? (
    <>
      {/* existing report sections stay unchanged */}
    </>
  ) : (
    <ReportsEmptyState
      title={t("emptyStates.noData.title")}
      description={t("emptyStates.noData.description")}
    />
  )}
</AttendanceWorkspaceStack>
```

Do not add any call to `fetchDerivedDailyAbsences`.

- [ ] **Step 6: Run reports verification**

Run:

```bash
npm run test:run -- src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts
npx eslint src/features/attendance/reports/pages/AttendanceReportsPage.tsx src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
npm run typecheck
```

Expected: report service tests pass, scoped eslint has 0 errors, typecheck passes.

- [ ] **Step 7: Commit reports migration**

Run:

```bash
git add src/features/attendance/reports/pages/AttendanceReportsPage.tsx
git commit -m "refactor: use workspace shell on attendance reports"
```

## Task 6: Final Verification

**Files:**
- Review: `src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx`
- Review: migrated page files

- [ ] **Step 1: Run focused service tests**

Run:

```bash
npm run test:run -- src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts src/features/attendance/late-early/services/__tests__/attendanceLateEarlyService.test.ts src/features/attendance/excuses/services/__tests__/attendanceExcusesService.test.ts src/features/attendance/reports/services/__tests__/attendanceReportsService.test.ts
```

Expected: all listed test files pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run scoped attendance eslint**

Run:

```bash
npx eslint src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx src/features/attendance/reports/pages/AttendanceReportsPage.tsx
```

Expected: PASS with 0 errors.

- [ ] **Step 4: Run full lint and record known unrelated status**

Run:

```bash
npm run lint
```

Expected: May fail on existing unrelated files under `docs/Reusable Light Mode Dropdown`. If it fails only there, report the exact unrelated errors in the final summary. Do not fix those files in this task.

- [ ] **Step 5: Confirm deferred scope stayed deferred**

Run:

```bash
git diff --name-only HEAD~5..HEAD
```

Expected changed implementation files include only the new shell and these pages:

```text
src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx
src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx
src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx
src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx
src/features/attendance/reports/pages/AttendanceReportsPage.tsx
```

Docs or plan files may also be present from the planning phase. Roll-call and policies page files should not appear.

- [ ] **Step 6: Commit final verification fixes if needed**

If final verification required code fixes, commit them:

```bash
git add src/features/attendance/shared/components/AttendanceWorkspaceShell.tsx src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx src/features/attendance/reports/pages/AttendanceReportsPage.tsx
git commit -m "chore: finish attendance workspace shell verification"
```

If no files changed since the last task commit, do not create an empty commit.
