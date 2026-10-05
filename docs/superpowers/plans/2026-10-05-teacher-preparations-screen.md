# Teacher Preparations Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, responsive Teacher Preparations management page whose counts, filters, results, navigation, and actions use only the current Academic Content backend contract.

**Architecture:** Add a dedicated route and preparation-specific presentation layer while reusing the existing Academic Content API client, academic context, permission hooks, browse-option source, status badge, and UI primitives. A focused service fixes every request to `TEACHER_PREPARATION`; a URL-backed page hook coordinates the paginated list and four independently retryable count resources without modifying the backend or the existing generic library.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-teacher-preparations-screen-design.md`

## Global Constraints

- Work only in `C:\Users\Ahmed Mostafa\.codex\worktrees\academic-content-plan\School-Dashboard` on `feat/academic-content-center-wave-1-2`.
- Do not modify the backend or any API contract.
- Read `E:\Moazzez\School-Dashboard\Must Read Before Push.txt` before implementation.
- Preserve unrelated modified and untracked files; stage only explicit task paths or exact translation hunks.
- Use primitives from `src/components/ui` rather than creating replacements for Button, Input, Select, DropdownMenu, Skeleton, EmptyState, or DataTable.
- Every production-code change receives a Clean Code Guard pass.
- Every test change receives a Test Guard pass.
- Do not run the repository-wide test suite without explicit user approval.
- Use one PowerShell execution gate, `& { ... }`, for every command group.
- Keep the current backend ordering (`updatedAt DESC`, then ID descending); do not add a client-visible sorting control.
- Never render teacher identity, target labels, readiness percentages, historical trends, bulk actions, or other values absent from the list response.
- Preserve English/LTR and Arabic/RTL behavior.

## Planned File Structure

### New files

- `src/app/[lang]/(dashboard)/academic-content-hub/preparations/page.tsx` — binds the dedicated route to the feature page.
- `src/features/academic-content/model/teacherPreparations.ts` — preparation filter parsing, query construction, active-filter rules, and count definitions.
- `src/features/academic-content/model/__tests__/teacherPreparations.test.ts` — pure URL/query/count mapping tests.
- `src/features/academic-content/services/teacherPreparationsService.ts` — fixed-type list and count requests.
- `src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts` — HTTP-boundary contract tests.
- `src/features/academic-content/hooks/useTeacherPreparations.ts` — URL state, debounced search, list state, count resources, retries, and stale-response protection.
- `src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx` — hook behavior tests.
- `src/features/academic-content/components/preparations/TeacherPreparationsHeader.tsx` — breadcrumb, title, description, and permission-gated creation action.
- `src/features/academic-content/components/preparations/PreparationStatsGrid.tsx` — four independent count cards.
- `src/features/academic-content/components/preparations/TeacherPreparationFilters.tsx` — supported filter controls, active chips, and Clear All.
- `src/features/academic-content/components/preparations/TeacherPreparationResults.tsx` — desktop table, mobile cards, loading/empty/error presentation, and pagination.
- `src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx` — visible header, summary, filter, result, mobile-content, and accessibility behavior.
- `src/features/academic-content/pages/TeacherPreparationsPage.tsx` — composes data, browse options, navigation, and presentation.
- `src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx` — page integration and permission/navigation tests.
- `src/messages/__tests__/teacherPreparationsTranslations.test.ts` — English/Arabic namespace parity.

### Modified files

- `src/features/academic-content/components/overview/overviewRoutes.ts` — route Teacher Preparations to the dedicated page and preserve the generic routes for other types.
- `src/features/academic-content/components/overview/ContentTypeGrid.tsx` — consume the type-specific href helper.
- `src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx` — assert the new Teacher Preparations href while preserving the other five library hrefs.
- `src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx` — assert the new route export.
- `src/messages/en.json` — add English Teacher Preparations screen copy.
- `src/messages/ar.json` — add Arabic Teacher Preparations screen copy.

The existing generic library, editor, lifecycle actions, and browse-option implementation are consumed but not refactored by this plan.

---

### Task 1: Contract-Safe Preparation Query Model and Service

**Files:**
- Create: `src/features/academic-content/model/teacherPreparations.ts`
- Create: `src/features/academic-content/model/__tests__/teacherPreparations.test.ts`
- Create: `src/features/academic-content/services/teacherPreparationsService.ts`
- Create: `src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts`

**Interfaces:**
- Consumes: `ListAcademicContentQuery`, `AcademicContentStatus`, `AcademicContentListResponse`, and `listAcademicContent(query)`.
- Produces: `TeacherPreparationFilters`, `TeacherPreparationFilterUpdate`, `TeacherPreparationCountKey`, `PREPARATION_COUNT_DEFINITIONS`, `readTeacherPreparationFilters(searchParams)`, `teacherPreparationListQuery(filters, academicYearId, termId)`, `listTeacherPreparations(query)`, and `getTeacherPreparationCount(context, status)`.

- [ ] **Step 1: Write failing model tests for supported URL values and fixed query values**

Cover these exact scenarios with real `URLSearchParams`:

```ts
expect(
  readTeacherPreparationFilters(
    new URLSearchParams(
      "page=2&limit=25&contentStatus=SUBMITTED&teacherUserId=t1&stageId=s1&gradeId=g1&classroomId=c1&subjectId=sub1&search=fractions&readiness=100",
    ),
  ),
).toEqual({
  page: 2,
  limit: 25,
  status: "SUBMITTED",
  teacherUserId: "t1",
  stageId: "s1",
  gradeId: "g1",
  classroomId: "c1",
  subjectId: "sub1",
  search: "fractions",
});

expect(
  teacherPreparationListQuery(filters, "year-1", "term-1"),
).toEqual({
  academicYearId: "year-1",
  termId: "term-1",
  page: 2,
  limit: 25,
  status: "SUBMITTED",
  teacherUserId: "t1",
  stageId: "s1",
  gradeId: "g1",
  classroomId: "c1",
  subjectId: "sub1",
  search: "fractions",
});
```

Also verify invalid pages fall back to 1, limits are capped at 100, invalid statuses become empty, search is capped at 120 characters, and unsupported `readiness` and sort parameters never enter the query.

- [ ] **Step 2: Run the model test and verify it fails**

Run:

```powershell
& { npx vitest run src/features/academic-content/model/__tests__/teacherPreparations.test.ts; exit $LASTEXITCODE }
```

Expected: FAIL because `teacherPreparations.ts` does not exist.

- [ ] **Step 3: Implement the pure preparation model**

Define only the supported filter surface:

```ts
export interface TeacherPreparationFilters {
  page: number;
  limit: number;
  status: AcademicContentStatus | "";
  teacherUserId: string;
  stageId: string;
  gradeId: string;
  classroomId: string;
  subjectId: string;
  search: string;
}

export type TeacherPreparationFilterUpdate = Partial<
  Omit<TeacherPreparationFilters, "page" | "limit" | "search">
>;

export const PREPARATION_COUNT_DEFINITIONS = [
  { key: "total", status: undefined },
  { key: "draft", status: "DRAFT" },
  { key: "pendingApproval", status: "SUBMITTED" },
  { key: "approved", status: "APPROVED" },
] as const;

export type TeacherPreparationCountKey =
  (typeof PREPARATION_COUNT_DEFINITIONS)[number]["key"];
```

Use the existing academic-content status enum for validation. Return `Omit<ListAcademicContentQuery, "type">` from `teacherPreparationListQuery`; the service is the single boundary that adds `type: "TEACHER_PREPARATION"`. Omit empty strings with `Object.fromEntries` exactly as the existing library does.

- [ ] **Step 4: Write failing service tests at the network boundary**

Mock `@/lib/api` rather than the preparation model or service internals. Assert the observable GET parameters:

```ts
await listTeacherPreparations({
  academicYearId: "year-1",
  termId: "term-1",
  page: 2,
  limit: 10,
  status: "DRAFT",
});

expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
  params: {
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    page: 2,
    limit: 10,
    status: "DRAFT",
  },
});
```

Add a data-driven count test for `undefined`, `DRAFT`, `SUBMITTED`, and `APPROVED`; every call must use `page=1`, `limit=1`, and `type=TEACHER_PREPARATION`.

- [ ] **Step 5: Implement the service and make the focused tests pass**

Use `apiGet<AcademicContentListResponse>` directly with the existing base path. Keep two public functions:

```ts
export function listTeacherPreparations(
  query: Omit<ListAcademicContentQuery, "type">,
): Promise<AcademicContentListResponse>;

export function getTeacherPreparationCount(
  context: { academicYearId: string; termId: string },
  status?: AcademicContentStatus,
): Promise<number>;
```

Run:

```powershell
& {
  npx vitest run src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts
  exit $LASTEXITCODE
}
```

Expected: both files PASS.

- [ ] **Step 6: Apply Clean Code Guard and Test Guard, then commit**

Confirm the fixed type exists in one place, functions have at most four parameters, no internal helper is mocked, and no speculative sort/readiness option exists.

```powershell
& {
  git add -- src/features/academic-content/model/teacherPreparations.ts src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/teacherPreparationsService.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts
  git commit -m "feat(academic-content): add preparation list contract"
}
```

---

### Task 2: URL-Backed Preparation State and Independent Counts

**Files:**
- Create: `src/features/academic-content/hooks/useTeacherPreparations.ts`
- Create: `src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx`

**Interfaces:**
- Consumes: Task 1 filter/query functions and service functions, `useAcademicYearTermLayoutContext`, Next navigation hooks, `useDebounce`, and `academicContentUiError`.
- Produces: `useTeacherPreparations()` returning `{ filters, search, items, total, isLoading, error, counts, setSearch, setFilters, setPage, setLimit, clearFilters, reload, retryCount }`.

- [ ] **Step 1: Write failing hook tests against observable URL and HTTP behavior**

Use real Academic Content item objects and mock only Next navigation, academic context, and the network-facing preparation service. Cover:

1. No requests when academic year or term is missing.
2. One list request plus four count requests when context is complete.
3. Search debounce writes `search` to the URL and resets `page`.
4. Filter changes use `contentStatus` for status and reset `page`.
5. Page-size changes preserve year/term and clear page.
6. A failed count leaves the other three successful counts intact.
7. `retryCount("draft")` repeats only the Draft count request.
8. A stale list response cannot replace a newer filter response.
9. `clearFilters()` removes only preparation filter keys, preserving `year` and `term`.

Use fake timers only for the documented 300 ms debounce and restore real timers after the test.

- [ ] **Step 2: Run the hook test and verify it fails**

```powershell
& { npx vitest run src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx; exit $LASTEXITCODE }
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook with separate list and count resource state**

Use this resource contract:

```ts
export interface TeacherPreparationResource<T> {
  data: T;
  isLoading: boolean;
  error: ReturnType<typeof academicContentUiError> | null;
}

export type TeacherPreparationCounts = Record<
  TeacherPreparationCountKey,
  TeacherPreparationResource<number | null>
>;
```

Keep independent retry versions per count key. Use monotonically increasing request IDs for the list and each count resource. Update URL state with `router.replace(..., { scroll: false })`, preserving unrelated parameters such as `year` and `term`.

The list request must come from `teacherPreparationListQuery`. Count requests must use the definitions from Task 1. Never infer a failed count as zero.

- [ ] **Step 4: Run the hook tests and the earlier contract tests**

```powershell
& {
  npx vitest run src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts
  exit $LASTEXITCODE
}
```

Expected: all tests PASS without React `act` warnings.

- [ ] **Step 5: Apply Clean Code Guard and Test Guard, then commit**

Split URL updates, list loading, and count loading into named callbacks when the main hook becomes difficult to scan. Do not introduce a generic data-fetching framework or cancellation abstraction used nowhere else.

```powershell
& {
  git add -- src/features/academic-content/hooks/useTeacherPreparations.ts src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx
  git commit -m "feat(academic-content): load teacher preparations"
}
```

---

### Task 3: Preparation Header, Statistics, and Translation Contract

**Files:**
- Create: `src/features/academic-content/components/preparations/TeacherPreparationsHeader.tsx`
- Create: `src/features/academic-content/components/preparations/PreparationStatsGrid.tsx`
- Create: `src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create: `src/messages/__tests__/teacherPreparationsTranslations.test.ts`

**Interfaces:**
- Consumes: `TeacherPreparationCounts`, `Button`, `Skeleton`, `usePermissions`, `useLocale`, `useRouter`, academic context, and `academicContentOverviewHref`.
- Produces: `TeacherPreparationsHeader` and `PreparationStatsGrid`.

- [ ] **Step 1: Add failing translation parity and presentation tests**

Define a nested `academic_content.teacher_preparations` namespace in both locales. The parity test recursively compares key paths and asserts these critical keys exist:

```text
title
description
new_preparation
breadcrumb.overview
stats.total
stats.draft
stats.pending_approval
stats.approved
stats.unavailable
retry
```

Presentation tests must assert:

- The localized page title and four statistic labels are visible.
- `0` remains visible as a real count.
- An unavailable count does not render `0` and exposes a scoped Retry button.
- Clicking the Draft retry calls `onRetry("draft")` only.
- New Preparation is hidden without `academics.academic_content.manage`.
- With permission, New Preparation navigates to `/en/academic-content-hub/new?year=year-1&term=term-1&type=TEACHER_PREPARATION`.

- [ ] **Step 2: Run the new tests and verify they fail**

```powershell
& {
  npx vitest run src/messages/__tests__/teacherPreparationsTranslations.test.ts src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx
  exit $LASTEXITCODE
}
```

Expected: FAIL because the namespace and components do not exist.

- [ ] **Step 3: Add complete English and Arabic copy**

Add all copy required by the approved specification in one namespace, including header, stats, filters, table columns, actions, pagination context, loading, empty, filtered-empty, unavailable, and retry states. Use page-specific copy `Pending approval` / `بانتظار الموافقة` for `SUBMITTED`; do not globally rename the existing generic status translation.

Because `src/messages/en.json` and `src/messages/ar.json` already contain unrelated working-tree changes, apply and stage only the new namespace hunks.

- [ ] **Step 4: Implement the header and statistics grid**

Use existing UI components and semantic structure:

```tsx
<header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
  <div>{/* breadcrumb, icon, h1, description */}</div>
  {canManage ? <Button leftIcon={<Plus />}>{t("new_preparation")}</Button> : null}
</header>
```

The statistics grid uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`. Each card renders a Skeleton, a localized unavailable state plus Retry, or the exact numeric count.

- [ ] **Step 5: Run the presentation and translation tests**

```powershell
& {
  npx vitest run src/messages/__tests__/teacherPreparationsTranslations.test.ts src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx
  exit $LASTEXITCODE
}
```

Expected: PASS.

- [ ] **Step 6: Apply Docs Guard, Clean Code Guard, and Test Guard, then commit exact hunks**

Verify every translation key used by the components exists in both locale files. Stage the two new components and tests normally; use interactive hunk staging for locale files so unrelated message changes remain unstaged.

```powershell
& {
  git add -- src/features/academic-content/components/preparations/TeacherPreparationsHeader.tsx src/features/academic-content/components/preparations/PreparationStatsGrid.tsx src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx src/messages/__tests__/teacherPreparationsTranslations.test.ts
  git add -p -- src/messages/en.json src/messages/ar.json
  git diff --cached --name-only
  git commit -m "feat(academic-content): add preparation page summary"
}
```

Before committing, inspect `git diff --cached` and confirm only the Teacher Preparations namespace is staged from the locale files.

---

### Task 4: Contract-Supported Preparation Filters

**Files:**
- Create: `src/features/academic-content/components/preparations/TeacherPreparationFilters.tsx`
- Modify: `src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx`

**Interfaces:**
- Consumes: `TeacherPreparationFilters`, `TeacherPreparationFilterUpdate`, `AcademicContentBrowseOptionsState`, `Input`, `Select`, `Button`, and `AcademicContentAppliedFilters`.
- Produces: `TeacherPreparationFilters` presentation with `onSearchChange`, `onFiltersChange`, and `onClear` callbacks.

- [ ] **Step 1: Extend the presentation test with filter behavior**

Construct real browse-option objects. Assert the page exposes only:

- Search.
- Teacher.
- Stage.
- Grade.
- Classroom.
- Subject.
- Status.

Assert there is no Readiness or Sort control. Change Stage and expect `onFiltersChange({ stageId: "stage-1" })`. Remove an active Subject chip and expect `{ subjectId: "" }`. Click Clear All and expect `onClear()`.

- [ ] **Step 2: Run the presentation test and verify the new assertions fail**

```powershell
& { npx vitest run src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx; exit $LASTEXITCODE }
```

Expected: FAIL because the filters component does not exist.

- [ ] **Step 3: Implement the filters with existing UI primitives**

Use a labeled search Input and the existing Select component. Build status options from `ACADEMIC_CONTENT_STATUSES`; display `SUBMITTED` with the page-specific Pending Approval key. Build teacher and academic hierarchy options from `AcademicContentBrowseOptionsState` without fetching inside the component.

Render active chips through `AcademicContentAppliedFilters`. Do not show chips for page, limit, or search. Disable dependent selects exactly when their option collections are unavailable according to the browse-option state.

- [ ] **Step 4: Run the focused component test**

```powershell
& { npx vitest run src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx; exit $LASTEXITCODE }
```

Expected: PASS.

- [ ] **Step 5: Apply Clean Code Guard and Test Guard, then commit**

Keep option mapping and active-chip construction in small named functions. Do not copy the entire generic `AcademicContentFilters` component or add preparation-only behavior to it.

```powershell
& {
  git add -- src/features/academic-content/components/preparations/TeacherPreparationFilters.tsx src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx
  git commit -m "feat(academic-content): add preparation filters"
}
```

---

### Task 5: Responsive Preparation Results

**Files:**
- Create: `src/features/academic-content/components/preparations/TeacherPreparationResults.tsx`
- Modify: `src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx`

**Interfaces:**
- Consumes: `AcademicContentLibraryItem[]`, list loading/error state, page, limit, total, search, `AcademicContentStatusBadge`, `DataTable`, `EmptyState`, and `Button`.
- Produces: `TeacherPreparationResults` with `onOpen`, `onRetry`, `onClearFilters`, `onPageChange`, and `onPageSizeChange` callbacks.

- [ ] **Step 1: Add failing result-state and contract tests**

Use real `AcademicContentLibraryItem` objects for these scenarios:

1. A preparation summary renders title, topic, description, status, and semantic updated time.
2. A null summary uses localized topic-unavailable copy rather than inventing a value.
3. `SUBMITTED` renders the page-specific Pending Approval label.
4. Teacher, classroom, subject, and readiness values are absent.
5. Clicking a row or Open action calls `onOpen(id)` once.
6. List failure shows the normalized error and Retry.
7. Empty unfiltered results show the collection-empty state.
8. Empty filtered results show the no-match state and Clear Filters.
9. Pagination callbacks receive the selected page and page size.
10. The same contract fields are present in desktop-table markup and the mobile-card region.

- [ ] **Step 2: Run the presentation test and verify the new assertions fail**

```powershell
& { npx vitest run src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx; exit $LASTEXITCODE }
```

Expected: FAIL because the result component does not exist.

- [ ] **Step 3: Implement desktop and mobile presentations from one item list**

Desktop uses the existing DataTable with non-sortable columns:

```ts
const columns = [
  { key: "title", label: t("columns.preparation"), render: renderPreparation },
  { key: "description", label: t("columns.description"), render: renderDescription },
  { key: "status", label: t("columns.status"), render: renderStatus },
  { key: "updatedAt", label: t("columns.updated"), render: renderUpdatedAt },
  { key: "actions", label: t("columns.actions"), render: renderOpenAction },
];
```

Pass `showDensityToggle={false}` and server pagination. Do not mark any column sortable.

Mobile uses `md:hidden` cards and the table wrapper uses `hidden md:block`. Both paths use the same formatting and page-specific status-label helpers. Every updated date is a `time` element with the original ISO value in `dateTime`.

For Screen 2, the row action is Open only. Archive, restore, delete, approval, and publication actions remain in the existing details/editor workflow where their complete state and confirmations are available.

- [ ] **Step 4: Run the presentation tests**

```powershell
& { npx vitest run src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx; exit $LASTEXITCODE }
```

Expected: PASS.

- [ ] **Step 5: Apply Clean Code Guard and Test Guard, then commit**

Verify table and cards share formatting functions without duplicating backend interpretation. Keep the actions cell marked with the DataTable interactive-target convention so the row click does not fire twice.

```powershell
& {
  git add -- src/features/academic-content/components/preparations/TeacherPreparationResults.tsx src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx
  git commit -m "feat(academic-content): add preparation results"
}
```

---

### Task 6: Compose the Dedicated Page and Route Screen 1 Navigation

**Files:**
- Create: `src/features/academic-content/pages/TeacherPreparationsPage.tsx`
- Create: `src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/preparations/page.tsx`
- Modify: `src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx`
- Modify: `src/features/academic-content/components/overview/overviewRoutes.ts`
- Modify: `src/features/academic-content/components/overview/ContentTypeGrid.tsx`
- Modify: `src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–5, `useAcademicContentBrowseOptions`, locale/router/search parameters, academic context, and `academicContentOverviewHref`.
- Produces: the dedicated route and `academicContentTypeHref({ locale, contentType, yearId, termId })`.

- [ ] **Step 1: Write failing route and type-card navigation tests**

Add the route identity assertion:

```ts
expect(PreparationsRoute).toBe(TeacherPreparationsPage);
```

Update the overview card test so Teacher Preparations points to:

```text
/en/academic-content-hub/preparations?year=year-1&term=term-1
```

Retain data-driven assertions that the other five content types still point to `/library` with their `type` query values.

- [ ] **Step 2: Write the failing page integration test**

Mock only the network boundary and application navigation/context boundaries. Assert:

- The title, counts, supported filters, and returned preparation render together.
- Opening `content/1` navigates to `/en/academic-content-hub/content%2F1?year=year-1&term=term-1`.
- New Preparation includes the fixed type query.
- A list failure retains the header and filters while exposing Retry.
- A count failure does not remove successful results.

- [ ] **Step 3: Run route, overview, and page tests to verify failure**

```powershell
& {
  npx vitest run 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx
  exit $LASTEXITCODE
}
```

Expected: FAIL because the page, route, and type-specific href do not exist.

- [ ] **Step 4: Add the type-specific overview href helper**

Implement:

```ts
export function academicContentTypeHref(input: {
  locale: string;
  contentType: AcademicContentType;
  yearId: string;
  termId: string;
}): string;
```

For `TEACHER_PREPARATION`, return the dedicated `/preparations` route with year and term. For every other current type, return `/library` with year, term, and `type`. Update `ContentTypeGrid` to use this helper.

- [ ] **Step 5: Compose the page and add the route export**

`TeacherPreparationsPage` obtains the hook and browse-option state once, constructs the existing editor href with encoded content ID, and renders:

```tsx
<main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
  <TeacherPreparationsHeader />
  <PreparationStatsGrid counts={preparations.counts} onRetry={preparations.retryCount} />
  <TeacherPreparationFilters {...filterProps} />
  <TeacherPreparationResults {...resultProps} />
</main>
```

Return `null` before academic context exists, matching the existing Academic Content page behavior. The app route file only re-exports the feature page.

- [ ] **Step 6: Run the full Screen 2 targeted test set**

```powershell
& {
  npx vitest run src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx src/features/academic-content/components/preparations/__tests__/TeacherPreparationsPresentation.test.tsx src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx src/messages/__tests__/teacherPreparationsTranslations.test.ts
  exit $LASTEXITCODE
}
```

Expected: all targeted tests PASS.

- [ ] **Step 7: Apply Clean Code Guard and Test Guard, then commit**

Inspect the complete Screen 2 diff for dead exports, duplicated URL knowledge, broad error handling, unsupported fields, implementation-detail mocks, and redundant tests. Fix all findings before committing.

```powershell
& {
  git add -- 'src/app/[lang]/(dashboard)/academic-content-hub/preparations/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/pages/TeacherPreparationsPage.tsx src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx src/features/academic-content/components/overview/overviewRoutes.ts src/features/academic-content/components/overview/ContentTypeGrid.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx
  git commit -m "feat(academic-content): route teacher preparations page"
}
```

---

### Task 7: Final Scoped Verification and Handoff

**Files:**
- Review all files added or modified by Tasks 1–6.
- Do not stage or commit unrelated working-tree changes.

**Interfaces:**
- Consumes: the complete Screen 2 implementation.
- Produces: verified code and an accurate handoff report.

- [ ] **Step 1: Run exact-file ESLint**

```powershell
& {
  npx eslint src/features/academic-content/model/teacherPreparations.ts src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/teacherPreparationsService.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts src/features/academic-content/hooks/useTeacherPreparations.ts src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx src/features/academic-content/components/preparations src/features/academic-content/pages/TeacherPreparationsPage.tsx src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx src/features/academic-content/components/overview/overviewRoutes.ts src/features/academic-content/components/overview/ContentTypeGrid.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/messages/__tests__/teacherPreparationsTranslations.test.ts
  exit $LASTEXITCODE
}
```

Expected: exit 0 with no new warnings.

- [ ] **Step 2: Run TypeScript validation**

```powershell
& { npm run typecheck; exit $LASTEXITCODE }
```

Expected: exit 0.

- [ ] **Step 3: Run the final targeted tests**

Run the exact test command from Task 6 Step 6 again after all guard fixes. Expected: all Screen 2 and affected Screen 1 navigation tests PASS.

- [ ] **Step 4: Ask before the full test suite**

Request explicit user approval before running `npm run test:run` without file arguments. If approval is not provided, record `FULL_TEST_SUITE=NOT_RUN (approval required)` in the handoff.

- [ ] **Step 5: Run the production build**

```powershell
& { npm run build; Write-Output "BUILD_EXIT=$LASTEXITCODE"; exit $LASTEXITCODE }
```

Expected: exit 0 and the route table includes `/[lang]/academic-content-hub/preparations`.

- [ ] **Step 6: Perform the final guard passes and repository inspection**

Run Clean Code Guard over production diff and Test Guard over test diff. Verify:

- No unsupported backend field is rendered.
- Every list and count request fixes `TEACHER_PREPARATION`.
- Failed counts are not shown as zero.
- No fake sort, readiness, trend, or bulk action appears.
- English and Arabic keys match.
- No staged file belongs to unrelated dirty work.

Inspect:

```powershell
& {
  git diff --check
  git diff --cached --name-only
  git status --short
  git log --oneline --max-count=10
}
```

- [ ] **Step 7: Commit guard fixes only when required**

If the guard passes require changes, rerun the affected targeted tests and create one focused commit:

```powershell
& {
  git add -- 'src/app/[lang]/(dashboard)/academic-content-hub/preparations/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/model/teacherPreparations.ts src/features/academic-content/model/__tests__/teacherPreparations.test.ts src/features/academic-content/services/teacherPreparationsService.ts src/features/academic-content/services/__tests__/teacherPreparationsService.test.ts src/features/academic-content/hooks/useTeacherPreparations.ts src/features/academic-content/hooks/__tests__/useTeacherPreparations.test.tsx src/features/academic-content/components/preparations src/features/academic-content/pages/TeacherPreparationsPage.tsx src/features/academic-content/pages/__tests__/TeacherPreparationsPage.test.tsx src/features/academic-content/components/overview/overviewRoutes.ts src/features/academic-content/components/overview/ContentTypeGrid.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx src/messages/__tests__/teacherPreparationsTranslations.test.ts
  git add -p -- src/messages/en.json src/messages/ar.json
  git commit -m "refactor(academic-content): tighten preparation page boundaries"
}
```

Inspect the staged diff before committing and confirm the locale files contain only Teacher Preparations hunks. Never use `git add .` in this worktree. If no guard fix is required, do not create an empty commit.

- [ ] **Step 8: Deliver the handoff**

Report the route, backend-contract decisions, commit range, targeted-test result, lint, typecheck, build, full-suite status, and the presence of untouched unrelated worktree changes. Do not push, create a pull request, merge, or deploy unless separately requested.
