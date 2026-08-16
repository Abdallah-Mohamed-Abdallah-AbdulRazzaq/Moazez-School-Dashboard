# Absence Flow Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make absence filtering, corrections, permissions, dates, and response data match the supported backend contract.

**Architecture:** The backend will interpret a selected scope as a hierarchy boundary rather than an exact session scope and will return the student number required by the dashboard. The frontend will omit the all-school scope filter, use local calendar dates, expose every valid correction transition, protect prerequisite calls, and discard stale responses.

**Tech Stack:** Next.js, TypeScript, Vitest, NestJS, Prisma, Jest.

## Global Constraints

- Preserve existing unrelated worktree changes.
- Add regression tests before each production behavior change.
- Keep the scope query tenant-scoped through the existing Prisma service.
- Do not change the submitted-session or incident-status restrictions.

---

### Task 1: Hierarchical absence filtering

**Files:**
- Modify: `E:\Moazzez\Moazez-Backend-main\src\modules\attendance\absences\infrastructure\attendance-absences.repository.ts`
- Modify: `E:\Moazzez\Moazez-Backend-main\src\modules\attendance\absences\tests\attendance-absences.repository.spec.ts`

**Interfaces:**
- Consumes: `ListAttendanceAbsencesFilters` from the repository.
- Produces: a session `where` filter that uses selected placement IDs without requiring an exact session `scopeType`/`scopeKey`.

- [ ] **Step 1: Write failing repository and presenter tests**

```ts
expect(where.session).not.toHaveProperty('scopeType');
expect(where.session).toMatchObject({ sectionId: 'section-1' });
```

- [ ] **Step 2: Run the focused Jest tests and verify they fail because the old query includes exact scope fields.**

Run: `npx jest --runInBand --runTestsByPath src/modules/attendance/absences/tests/attendance-absences.repository.spec.ts src/modules/attendance/absences/tests/attendance-absences.presenter.spec.ts`

- [ ] **Step 3: Build session filters from hierarchy IDs only.**

```ts
// Scope IDs constrain placement; scopeType/scopeKey identify the source session only.
```

- [ ] **Step 4: Re-run the focused Jest tests and verify they pass.**

### Task 2: Frontend query and local-date contract

**Files:**
- Modify: `src/features/attendance/absences/services/attendanceAbsencesService.ts`
- Modify: `src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts`
- Modify: `src/features/attendance/absences/components/AbsencesFiltersBar.tsx`
- Modify: `src/features/attendance/absences/components/AbsencesFiltersDrawer.tsx`
- Reuse: `src/features/attendance/roll-call/utils/localDate.ts`

**Interfaces:**
- Consumes: `AbsencesFilters` and the shared local-date formatter.
- Produces: an unscoped all-school request and local `YYYY-MM-DD` filter parameters.

- [ ] **Step 1: Write a failing service test asserting the School selection omits `scopeType` and `scopeKey`.**

```ts
expect(mockedApiGet).toHaveBeenCalledWith('/attendance/absences/summary', {
  params: { academicYearId: 'year-1', termId: 'term-1', dateFrom: '2026-02-01', dateTo: '2026-02-28' },
});
```

- [ ] **Step 2: Run the frontend service test and verify it fails because it currently sends `SCHOOL` and `school`.**

Run: `npx vitest run src/features/attendance/absences/services/__tests__/attendanceAbsencesService.test.ts`

- [ ] **Step 3: Omit scope parameters for School and serialize DatePicker values with the shared local-date helper.**

```ts
scopeType: params.scopeType === 'SCHOOL' ? undefined : params.scopeType
```

- [ ] **Step 4: Re-run the focused Vitest test and verify it passes.**

### Task 3: Correction actions, permissions, and stale responses

**Files:**
- Modify: `src/app/[lang]/(dashboard)/attendance/(with-context)/absences/page.tsx`
- Modify: `src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx`
- Modify: `src/features/attendance/absences/components/AbsencesTable.tsx`
- Modify: `src/features/attendance/absences/components/AbsenceDetailsPanel.tsx`
- Add or modify: `src/features/attendance/absences/pages/__tests__/AttendanceAbsencesPage.test.tsx`

**Interfaces:**
- Consumes: `AttendancePermissionGuard`, entries-manage permission, and latest request identifier.
- Produces: a page gated for structure and policy reads, early-leave actions for ABSENT/LATE/EARLY_LEAVE, and only the latest list result applied to state.

- [ ] **Step 1: Write failing component tests for early-leave actions on ABSENT and LATE records and a stale response arriving after a newer query.**

```tsx
expect(screen.getByTitle('Edit early leave')).toBeInTheDocument();
expect(screen.getByText('Newest student')).toBeInTheDocument();
expect(screen.queryByText('Stale student')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the focused Vitest tests and verify the missing action and stale-result behavior fail.**

- [ ] **Step 3: Gate the prerequisites, permit all backend-valid early-leave transitions, and ignore superseded load results.**

```ts
const latestRequest = useRef(0);
const requestId = ++latestRequest.current;
if (requestId === latestRequest.current) setRecords(records);
```

- [ ] **Step 4: Re-run the focused component tests and verify they pass.**

### Task 4: Verification and quality gate

**Files:**
- Review all files from Tasks 1–3.

- [ ] **Step 1: Run frontend absence tests and type checking.**

Run: `npx vitest run src/features/attendance/absences && npm run typecheck`

- [ ] **Step 2: Run backend absence tests and TypeScript build.**

Run: `npx jest --runInBand --runTestsByPath src/modules/attendance/absences/tests/attendance-incident.spec.ts src/modules/attendance/absences/tests/attendance-absences.repository.spec.ts src/modules/attendance/absences/tests/attendance-absences.presenter.spec.ts src/modules/attendance/absences/tests/attendance-absences.use-case.spec.ts && npm run build`

- [ ] **Step 3: Run targeted linting and `git diff --check`, then inspect the diff with the clean-code guard.**
