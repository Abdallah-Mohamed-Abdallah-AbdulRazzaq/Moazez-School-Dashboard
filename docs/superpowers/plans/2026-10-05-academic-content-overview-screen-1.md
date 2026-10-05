# Academic Content Overview Screen 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the contract-faithful Academic Content overview from Screen 1, preserve the existing library at a dedicated route, and expose only data supported by the current backend.

**Architecture:** Keep the existing Academic Content vertical slice and API client. Add pure overview presentation helpers, a focused overview service and hook that coordinate ten lightweight library requests with independent settled states, and feature-specific overview components built from existing `src/components/ui` primitives. The root route becomes the overview while the current library moves intact to `/academic-content-hub/library`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, Tailwind CSS, Lucide icons, existing UI primitives, Vitest, and Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-academic-content-overview-design.md`

## Global Constraints

- Work only in `C:\Users\Ahmed Mostafa\.codex\worktrees\academic-content-plan\School-Dashboard` on `feat/academic-content-center-wave-1-2`.
- Preserve all existing uncommitted Academic Content work; stage only files named by the current task.
- `src/messages/en.json`, `src/messages/ar.json`, and `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` already contain unrelated uncommitted work. Stage only Screen 1 hunks from those shared files and inspect the cached diff before committing.
- Do not modify backend code, endpoints, DTOs, authentication, deployment files, or environment files.
- The backend contract source of truth is `E:\Moazzez\Moazez-Backend` at `f71d8af2`.
- Do not render teacher, updater, subject, grade, classroom, deadline, readiness, or join-link data on the overview because the list response does not provide it.
- Approval labels apply only to Teacher Preparations; Work in Progress uses only Draft and Changes Requested lifecycle states.
- Upcoming Online Sessions uses `sessionStartAtFrom=<request time>` and shows only Upcoming or Starting Soon.
- Use components from `src/components/ui`; create only Academic Content feature components where no existing primitive fits the approved layout.
- Preserve English/LTR and Arabic/RTL behavior. Add every visible string to both locale files.
- Preserve year and term query parameters in overview navigation.
- Keep interactive targets keyboard accessible, focus-visible, and at least 44px where the existing primitive supports it.
- Verify layout behavior at 375px, 768px, 1024px, and 1440px without page-level horizontal overflow.
- Run Clean Code Guard after every production-code change and Test Guard after every test change.
- Ask the user before running the repository-wide `npm run test:run`. Targeted test files, ESLint, typecheck, and build do not require additional approval.
- Use one PowerShell execution gate (`& { ... }`) for each command group.
- Do not commit screenshots, generated logs, `.next*`, environment files, or unrelated working-tree changes.

## File Structure

### Create

```text
src/app/[lang]/(dashboard)/academic-content-hub/library/page.tsx
src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx
src/features/academic-content/model/academicContentOverview.ts
src/features/academic-content/model/__tests__/academicContentOverview.test.ts
src/features/academic-content/services/academicContentOverviewService.ts
src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts
src/features/academic-content/hooks/useAcademicContentOverview.ts
src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx
src/features/academic-content/components/overview/AcademicContentOverviewHeader.tsx
src/features/academic-content/components/overview/ContentTypeGrid.tsx
src/features/academic-content/components/overview/WorkInProgressPanel.tsx
src/features/academic-content/components/overview/UpcomingSessionsPanel.tsx
src/features/academic-content/components/overview/RecentlyUpdatedPanel.tsx
src/features/academic-content/components/overview/AcademicContentQuickLinks.tsx
src/features/academic-content/components/overview/AcademicContentOverviewSkeleton.tsx
src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx
src/features/academic-content/components/overview/__tests__/AcademicContentOverviewPanels.test.tsx
src/features/academic-content/pages/AcademicContentOverviewPage.tsx
src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx
```

### Modify

```text
src/app/[lang]/(dashboard)/academic-content-hub/page.tsx
src/features/academic-content/index.ts
src/features/academic-content/components/AcademicContentShell.tsx
src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx
src/features/academic-content/pages/CreateAcademicContentPage.tsx
src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx
src/messages/en.json
src/messages/ar.json
src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

---

### Task 1: Add Pure Overview Presentation Policy

**Files:**
- Create: `src/features/academic-content/model/academicContentOverview.ts`
- Test: `src/features/academic-content/model/__tests__/academicContentOverview.test.ts`

**Interfaces:**
- Consumes: `AcademicContentLibraryItem`, `AcademicContentOnlineSessionSummary`, and ISO timestamps from `types/contracts.ts`.
- Produces:

```ts
export type AcademicContentSessionState = "STARTING_SOON" | "UPCOMING";

export interface UpcomingAcademicContentSession {
  item: AcademicContentLibraryItem;
  summary: AcademicContentOnlineSessionSummary;
  state: AcademicContentSessionState;
}

export function mergeWorkInProgress(
  drafts: readonly AcademicContentLibraryItem[],
  changesRequested: readonly AcademicContentLibraryItem[],
  limit?: number,
): AcademicContentLibraryItem[];

export function sessionState(
  startAt: string,
  now: Date,
  startingSoonMinutes?: number,
): AcademicContentSessionState;

export function selectUpcomingSessions(
  items: readonly AcademicContentLibraryItem[],
  now: Date,
  limit?: number,
): UpcomingAcademicContentSession[];
```

- [ ] **Step 1: Write failing unit tests for ordering, limits, type narrowing, and temporal boundaries**

Cover duplicate removal by content ID, descending Work in Progress `updatedAt`, ascending session `startAt`, exclusion of null/non-session summaries, a 30-minute Starting Soon boundary, and a four-item default limit.

```ts
expect(mergeWorkInProgress(drafts, changes)).toEqual([
  newestDraft,
  requestedChanges,
]);

expect(sessionState("2026-10-05T10:29:59.000Z", now)).toBe(
  "STARTING_SOON",
);
expect(sessionState("2026-10-05T10:30:01.000Z", now)).toBe("UPCOMING");

expect(selectUpcomingSessions(mixedItems, now).map(({ item }) => item.id)).toEqual([
  "session-nearest",
  "session-later",
]);
```

- [ ] **Step 2: Run the model test and verify it fails because the module is missing**

```powershell
& {
  npm run test:run -- src/features/academic-content/model/__tests__/academicContentOverview.test.ts
}
```

Expected: FAIL with an unresolved `academicContentOverview` import.

- [ ] **Step 3: Implement the pure helpers**

Use timestamp comparisons only; do not derive unsupported academic or user fields.

```ts
const DEFAULT_PANEL_LIMIT = 4;
const DEFAULT_STARTING_SOON_MINUTES = 30;

export function sessionState(
  startAt: string,
  now: Date,
  startingSoonMinutes = DEFAULT_STARTING_SOON_MINUTES,
): AcademicContentSessionState {
  const millisecondsUntilStart = new Date(startAt).getTime() - now.getTime();
  return millisecondsUntilStart <= startingSoonMinutes * 60_000
    ? "STARTING_SOON"
    : "UPCOMING";
}
```

`selectUpcomingSessions` must require `summary?.type === "ONLINE_SESSION"`, sort a copy rather than mutating API data, and apply the limit after sorting.

- [ ] **Step 4: Re-run the unit test**

Expected: PASS.

- [ ] **Step 5: Apply Test Guard and Clean Code Guard**

Review the new test file with Test Guard and the production helper with Clean Code Guard. Fix every must-fix finding and re-run the targeted test.

- [ ] **Step 6: Commit only the model and its test**

```powershell
& {
  git add -- src/features/academic-content/model/academicContentOverview.ts src/features/academic-content/model/__tests__/academicContentOverview.test.ts
  git commit -m "feat(academic-content): add overview presentation policy"
}
```

---

### Task 2: Add the Contract-Faithful Overview Data Boundary

**Files:**
- Create: `src/features/academic-content/services/academicContentOverviewService.ts`
- Create: `src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts`
- Create: `src/features/academic-content/hooks/useAcademicContentOverview.ts`
- Create: `src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx`

**Interfaces:**
- Consumes: `listAcademicContent`, `academicContentUiError`, `ACADEMIC_CONTENT_TYPES`, selected `academicYearId`, selected `termId`, and Task 1 helpers.
- Produces:

```ts
export interface AcademicContentOverviewContext {
  academicYearId: string;
  termId: string;
}

export interface OverviewSectionResult<T> {
  data: T;
  error: AcademicContentUiError | null;
  partial: boolean;
}

export function loadContentTypeTotal(
  context: AcademicContentOverviewContext,
  type: AcademicContentType,
): Promise<number>;

export function loadWorkInProgress(
  context: AcademicContentOverviewContext,
): Promise<OverviewSectionResult<AcademicContentLibraryItem[]>>;

export function loadUpcomingSessions(
  context: AcademicContentOverviewContext,
  now: Date,
): Promise<UpcomingAcademicContentSession[]>;

export function loadRecentlyUpdated(
  context: AcademicContentOverviewContext,
): Promise<AcademicContentLibraryItem[]>;
```

The hook exposes independent state and retries:

```ts
export interface OverviewResource<T> {
  data: T;
  isLoading: boolean;
  error: AcademicContentUiError | null;
  partial: boolean;
}

export interface AcademicContentOverviewState {
  totals: Record<AcademicContentType, OverviewResource<number | null>>;
  workInProgress: OverviewResource<AcademicContentLibraryItem[]>;
  upcomingSessions: OverviewResource<UpcomingAcademicContentSession[]>;
  recentlyUpdated: OverviewResource<AcademicContentLibraryItem[]>;
  retryType: (type: AcademicContentType) => void;
  retryWorkInProgress: () => void;
  retryUpcomingSessions: () => void;
  retryRecentlyUpdated: () => void;
}
```

- [ ] **Step 1: Write failing service tests for all exact backend queries**

Assert these calls:

```ts
expect(listAcademicContent).toHaveBeenCalledWith({
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  page: 1,
  limit: 1,
});

expect(listAcademicContent).toHaveBeenCalledWith({
  academicYearId: "year-1",
  termId: "term-1",
  status: "DRAFT",
  page: 1,
  limit: 4,
});

expect(listAcademicContent).toHaveBeenCalledWith({
  academicYearId: "year-1",
  termId: "term-1",
  type: "ONLINE_SESSION",
  sessionStartAtFrom: "2026-10-05T09:00:00.000Z",
  page: 1,
  limit: 100,
});
```

Also assert the Recently Updated request uses `page: 1` and `limit: 5`, and that Work in Progress returns successful rows with `partial: true` when only one status request fails.

- [ ] **Step 2: Run the service test and verify the missing-module failure**

```powershell
& {
  npm run test:run -- src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts
}
```

- [ ] **Step 3: Implement the overview service**

Use `Promise.allSettled` only for the two Work in Progress calls so Draft data remains usable if Changes Requested fails, and vice versa. Map rejected reasons through `academicContentUiError`. Keep all request construction in this service so components cannot diverge from the backend contract.

- [ ] **Step 4: Write failing hook tests**

Use deferred promises to verify:

- No requests without both context IDs.
- Six independent type-total states.
- Section-level loading and errors.
- Scoped retry calls only the requested loader.
- A context change ignores all stale responses from the prior context.
- Unmount ignores late responses.

```ts
expect(result.current.totals.TEACHER_PREPARATION.data).toBe(142);
expect(result.current.totals.WEEKLY_PLAN.error?.message).toBe(
  "Weekly total unavailable",
);

rerender({ academicYearId: "year-2", termId: "term-2" });
oldRequest.resolve(oldResponse);
expect(result.current.recentlyUpdated.data).not.toEqual(oldResponse.items);
```

- [ ] **Step 5: Implement the hook with a generation token**

Increment a `useRef` generation whenever context changes. Every resolver checks that generation before setting state. Use a stable `nowFactory` dependency in tests so the session filter and temporal labels use the same instant.

```ts
export function useAcademicContentOverview(input: {
  academicYearId: string;
  termId: string;
  nowFactory?: () => Date;
}): AcademicContentOverviewState;
```

- [ ] **Step 6: Run the service and hook tests together**

```powershell
& {
  npm run test:run -- src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx
}
```

Expected: PASS.

- [ ] **Step 7: Apply Test Guard and Clean Code Guard**

Review both test files with Test Guard and both production files with Clean Code Guard. Fix findings, then re-run both targeted tests.

- [ ] **Step 8: Commit the service and hook boundary**

```powershell
& {
  git add -- src/features/academic-content/services/academicContentOverviewService.ts src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts src/features/academic-content/hooks/useAcademicContentOverview.ts src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx
  git commit -m "feat(academic-content): load overview data"
}
```

---

### Task 3: Add Localized Header, Type Cards, and Quick Links

**Files:**
- Create: `src/features/academic-content/components/overview/AcademicContentOverviewHeader.tsx`
- Create: `src/features/academic-content/components/overview/ContentTypeGrid.tsx`
- Create: `src/features/academic-content/components/overview/AcademicContentQuickLinks.tsx`
- Create: `src/features/academic-content/components/overview/AcademicContentOverviewSkeleton.tsx`
- Create: `src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

**Interfaces:**
- Consumes: `DropdownMenu`, `Button`, `Skeleton`, `usePermissions`, locale, context query values, and Task 2 total states.
- Produces:

```ts
interface AcademicContentOverviewHeaderProps {
  yearId: string;
  termId: string;
}

interface ContentTypeGridProps {
  yearId: string;
  termId: string;
  totals: AcademicContentOverviewState["totals"];
  onRetryType: (type: AcademicContentType) => void;
}

interface AcademicContentQuickLinksProps {
  yearId: string;
  termId: string;
  canApprove: boolean;
}
```

- [ ] **Step 1: Add failing translation parity assertions**

Require the same keys in English and Arabic under `academic_content.overview`, including:

```text
title
description
create
unavailable
view_all
types.TEACHER_PREPARATION.description
types.WEEKLY_PLAN.description
types.GUARDIAN_WEEKLY_NOTE.description
types.SUBJECT_RESOURCE.description
types.ONLINE_SESSION.description
types.GENERAL_RESOURCE.description
work_in_progress.*
upcoming_sessions.*
recently_updated.*
quick_links.*
session_states.STARTING_SOON
session_states.UPCOMING
```

- [ ] **Step 2: Add failing header/card/quick-link component tests**

Cover:

- Create menu hidden without `academics.academic_content.manage`.
- Six menu options with `type`, `year`, and `term` in the destination.
- Six cards rendered with real zero versus unavailable states.
- Type links use `/academic-content-hub/library?type=...` and preserve context.
- Failed totals expose a scoped Retry button.
- Review Queue is hidden without approval permission.
- No `Screen 1` copy is rendered.

- [ ] **Step 3: Run the translation and component tests to verify failure**

```powershell
& {
  npm run test:run -- src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx
}
```

- [ ] **Step 4: Add exact English and Arabic overview copy**

Use concise labels that describe only supported behavior. English type descriptions:

```text
Teacher Preparations: Lesson preparation, objectives, activities, and teaching notes.
Weekly Plans: Weekly topics, objectives, homework, and assessments.
Guardian Notes: Messages and weekly notes prepared for guardians.
Subject Resources: Worksheets, presentations, references, and learning material.
Online Sessions: Scheduled online classes and meeting instructions.
General Resources: Additional academic material for the selected audience.
```

Provide meaning-equivalent Arabic copy rather than literal machine translation.

- [ ] **Step 5: Implement the header with existing Button and DropdownMenu**

Build menu items from `ACADEMIC_CONTENT_TYPES`. Use `router.push` with an encoded query:

```ts
const query = new URLSearchParams({ year: yearId, term: termId, type });
router.push(`/${locale}/academic-content-hub/new?${query.toString()}`);
```

Use Lucide icons only. Do not recreate the global school header or sidebar.

- [ ] **Step 6: Implement the card grid, quick links, and skeleton**

Use responsive classes `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. Use semantic links for navigation and existing Button for retry. Quick Links routes preserve `year` and `term`.

- [ ] **Step 7: Re-run targeted tests**

Expected: PASS.

- [ ] **Step 8: Apply Test Guard, Clean Code Guard, and Docs Guard**

Use Test Guard for the two changed test surfaces, Clean Code Guard for the components, and Docs Guard for the locale copy claims. Fix findings and re-run targeted tests.

- [ ] **Step 9: Commit only this task's components and translations**

```powershell
& {
  git add -- src/features/academic-content/components/overview/AcademicContentOverviewHeader.tsx src/features/academic-content/components/overview/ContentTypeGrid.tsx src/features/academic-content/components/overview/AcademicContentQuickLinks.tsx src/features/academic-content/components/overview/AcademicContentOverviewSkeleton.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx
  git add -p -- src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
  git diff --cached -- src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
  git commit -m "feat(academic-content): add overview navigation cards"
}
```

Accept only Screen 1 translation and parity-test hunks during `git add -p`. If a Screen 1 edit shares one inseparable hunk with pre-existing work, split it with a cached patch instead of staging the unrelated lines.

---

### Task 4: Build the Three Operational Overview Panels

**Files:**
- Create: `src/features/academic-content/components/overview/WorkInProgressPanel.tsx`
- Create: `src/features/academic-content/components/overview/UpcomingSessionsPanel.tsx`
- Create: `src/features/academic-content/components/overview/RecentlyUpdatedPanel.tsx`
- Create: `src/features/academic-content/components/overview/__tests__/AcademicContentOverviewPanels.test.tsx`

**Interfaces:**
- Consumes: Task 1 presentation values, Task 2 `OverviewResource<T>`, existing status badges, `Button`, `EmptyState`, `Skeleton`, locale, and context-aware open callbacks.
- Produces:

```ts
interface OverviewPanelBaseProps {
  onRetry: () => void;
  onOpen: (contentId: string) => void;
}

interface WorkInProgressPanelProps extends OverviewPanelBaseProps {
  resource: OverviewResource<AcademicContentLibraryItem[]>;
}

interface UpcomingSessionsPanelProps extends OverviewPanelBaseProps {
  resource: OverviewResource<UpcomingAcademicContentSession[]>;
}

interface RecentlyUpdatedPanelProps extends OverviewPanelBaseProps {
  resource: OverviewResource<AcademicContentLibraryItem[]>;
}
```

- [ ] **Step 1: Write failing panel tests**

Verify:

- Work in Progress renders only title, type, lifecycle status, updated time, and open action.
- A partial Work in Progress response shows its rows plus a non-blocking warning.
- Upcoming Sessions renders title, date/time, platform, and only Upcoming or Starting Soon.
- Upcoming rows never render teacher, subject, classroom, or join URL values from fixtures.
- Recently Updated renders Title, Content Type, Updated, Status, and Actions, with no Updated By column.
- Every panel distinguishes loading, empty, error, and populated states.
- Retry invokes only the supplied callback.
- Timestamps use `time[dateTime]`.

```ts
expect(screen.queryByText("Updated By")).not.toBeInTheDocument();
expect(screen.queryByText("Omar Hassan")).not.toBeInTheDocument();
expect(screen.getByText("Starting soon")).toBeInTheDocument();
expect(document.querySelector("time")).toHaveAttribute(
  "datetime",
  "2026-10-05T09:15:00.000Z",
);
```

- [ ] **Step 2: Run the panel test and verify missing-component failures**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/overview/__tests__/AcademicContentOverviewPanels.test.tsx
}
```

- [ ] **Step 3: Implement a consistent feature-panel shell inside each component**

Use the approved rounded border/background/shadow classes and existing primitives. Do not add a competing generic Panel primitive. Keep headings at `h2` level beneath the page heading.

- [ ] **Step 4: Implement responsive populated states**

- Work in Progress and Upcoming Sessions use compact semantic lists.
- Recently Updated uses a semantic desktop table at `md` and stacked cards below `md`.
- Every row has an explicit accessible Open action; do not rely only on row click.
- Use `Intl.DateTimeFormat(locale, ...)` for absolute values and a small local formatter for relative Updated copy while preserving the full timestamp in an accessible label.

- [ ] **Step 5: Re-run the panel test**

Expected: PASS.

- [ ] **Step 6: Apply Test Guard and Clean Code Guard**

Fix all must-fix findings, especially duplicated panel-state rendering, unstable date assertions, and inaccessible action-only icons. Re-run the panel test.

- [ ] **Step 7: Commit the operational panels**

```powershell
& {
  git add -- src/features/academic-content/components/overview/WorkInProgressPanel.tsx src/features/academic-content/components/overview/UpcomingSessionsPanel.tsx src/features/academic-content/components/overview/RecentlyUpdatedPanel.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewPanels.test.tsx
  git commit -m "feat(academic-content): add overview activity panels"
}
```

---

### Task 5: Compose the Overview Page and Preserve the Library Route

**Files:**
- Create: `src/features/academic-content/pages/AcademicContentOverviewPage.tsx`
- Create: `src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/library/page.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx`
- Modify: `src/app/[lang]/(dashboard)/academic-content-hub/page.tsx`
- Modify: `src/features/academic-content/index.ts`

**Interfaces:**
- Consumes: `useAcademicYearTermLayoutContext`, `useAcademicContentOverview`, Task 3 and Task 4 components, `usePermissions`, locale, router, and search parameters.
- Produces: exported `AcademicContentOverviewPage` and root/library route bindings.

- [ ] **Step 1: Write failing page composition tests**

Mock the overview hook and academic context. Verify:

- The six cards and three panels receive the matching resource states.
- The Quick Links approval flag follows `academics.academic_content.approve`.
- Open actions preserve `year` and `term` and route to `/{locale}/academic-content-hub/{contentId}`.
- Missing context renders no overview requests; the surrounding `AcademicsContextLayout` remains authoritative for its established empty state.
- The page composes the overview data and navigation callbacks without unsupported fields.

In `routes.test.tsx`, import both route modules and assert the root renders the overview export while `/library` renders the existing library export.

- [ ] **Step 2: Run the page test and verify failure**

```powershell
& {
  npm run test:run -- src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx'
}
```

- [ ] **Step 3: Implement the overview page**

Compose the approved layout:

```tsx
<main className="mx-auto min-w-0 max-w-screen-2xl space-y-4 p-4 sm:p-6">
  <ContentTypeGrid {...typeGridProps} />
  <div className="grid gap-4 xl:grid-cols-2">
    <WorkInProgressPanel {...workProps} />
    <UpcomingSessionsPanel {...sessionProps} />
  </div>
  <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
    <RecentlyUpdatedPanel {...recentProps} />
    <AcademicContentQuickLinks {...quickLinkProps} />
  </div>
</main>
```

The header remains composed by the route-aware shell in Task 6 so it is not duplicated.

- [ ] **Step 4: Bind routes and exports**

Root:

```ts
export { default } from "@/features/academic-content/pages/AcademicContentOverviewPage";
```

Library:

```ts
export { default } from "@/features/academic-content/pages/AcademicContentLibraryPage";
```

Export the overview page from the feature index.

- [ ] **Step 5: Re-run the page test**

Expected: PASS.

- [ ] **Step 6: Apply Test Guard and Clean Code Guard**

Review the new page test and production route/page changes, fix findings, and re-run the targeted page test.

- [ ] **Step 7: Commit the page and route composition**

```powershell
& {
  git add -- 'src/app/[lang]/(dashboard)/academic-content-hub/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/library/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/index.ts src/features/academic-content/pages/AcademicContentOverviewPage.tsx src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx
  git commit -m "feat(academic-content): compose overview screen"
}
```

---

### Task 6: Update Shell Navigation and Type-Prefilled Creation

**Files:**
- Modify: `src/features/academic-content/components/AcademicContentShell.tsx`
- Modify: `src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx`
- Modify: `src/features/academic-content/pages/CreateAcademicContentPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx`

**Interfaces:**
- Consumes: `AcademicContentOverviewHeader`, `ACADEMIC_CONTENT_TYPES`, `useSearchParams`, existing shell permissions, locale, and context query values.
- Produces: route-aware shell navigation and safe initial type selection on the existing create page.

- [ ] **Step 1: Update shell tests first**

Change expected routes to:

```text
Overview  -> /en/academic-content-hub?year=year-1&term=term-1
All Content -> /en/academic-content-hub/library?year=year-1&term=term-1
Drafts -> /en/academic-content-hub/library?year=year-1&term=term-1&contentStatus=DRAFT
Archived -> /en/academic-content-hub/library?year=year-1&term=term-1&contentStatus=ARCHIVED
```

Test active states at the root, library, review, templates, and settings routes. Assert the overview header appears exactly once on the root and the existing compact shell header remains on non-root routes.

- [ ] **Step 2: Add failing create-page query tests**

Mock `useSearchParams` and verify:

- `type=ONLINE_SESSION` initializes the Online Session type and its allowed audience.
- An unknown `type` falls back to `TEACHER_PREPARATION`.
- Changing type after initialization preserves existing audience policy.
- Submitting still sends the selected academic year and term.

- [ ] **Step 3: Run shell and create-page tests and verify failure**

```powershell
& {
  npm run test:run -- src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx
}
```

- [ ] **Step 4: Implement route-aware shell navigation**

Use exact path comparison for the overview. On the root, render `AcademicContentOverviewHeader` in the shell header area. On other routes, preserve the existing compact title and create action. Route Drafts and Archived through `/library`; preserve only `year`, `term`, and the intended `contentStatus` value.

- [ ] **Step 5: Implement safe type initialization**

```ts
const requestedType = searchParams.get("type");
const initialType = ACADEMIC_CONTENT_TYPES.find(
  (contentType) => contentType === requestedType,
) ?? "TEACHER_PREPARATION";

const [type, setType] = useState<AcademicContentType>(initialType);
const [audience, setAudience] = useState<AcademicContentAudience>(
  allowedAudiences(initialType)[0],
);
```

Do not accept arbitrary query values through a type assertion.

- [ ] **Step 6: Re-run shell and create tests**

Expected: PASS.

- [ ] **Step 7: Apply Test Guard and Clean Code Guard**

Review both test files with Test Guard and both production files with Clean Code Guard. Fix findings and re-run the targeted tests.

- [ ] **Step 8: Commit navigation and create-flow integration**

```powershell
& {
  git add -- src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx src/features/academic-content/pages/CreateAcademicContentPage.tsx src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx
  git commit -m "feat(academic-content): route overview navigation"
}
```

---

### Task 7: Run the Screen 1 Quality Gate

**Files:**
- Review every file created or modified by Tasks 1-6.
- Do not modify unrelated dirty files to make commands pass.

- [ ] **Step 1: Run all targeted Screen 1 tests**

```powershell
& {
  npm run test:run -- src/features/academic-content/model/__tests__/academicContentOverview.test.ts src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewHeader.test.tsx src/features/academic-content/components/overview/__tests__/AcademicContentOverviewPanels.test.tsx src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
}
```

Expected: PASS. This is a targeted test invocation, not the repository-wide test suite.

- [ ] **Step 2: Run ESLint on the exact Screen 1 files**

```powershell
& {
  npx eslint src/features/academic-content/model/academicContentOverview.ts src/features/academic-content/model/__tests__/academicContentOverview.test.ts src/features/academic-content/services/academicContentOverviewService.ts src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts src/features/academic-content/hooks/useAcademicContentOverview.ts src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx src/features/academic-content/components/overview src/features/academic-content/pages/AcademicContentOverviewPage.tsx src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx src/features/academic-content/pages/CreateAcademicContentPage.tsx src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx
}
```

Expected: no new errors or warnings caused by Screen 1.

- [ ] **Step 3: Run typecheck**

```powershell
& {
  npm run typecheck
}
```

Expected: PASS. If unrelated pre-existing dirty work causes failure, record the exact diagnostic and verify Screen 1 files separately rather than modifying unrelated files.

- [ ] **Step 4: Run the production build**

```powershell
& {
  npm run build
}
```

Expected: PASS. Do not change deployment configuration to work around a failure.

- [ ] **Step 5: Perform responsive and accessibility inspection**

Inspect English and Arabic at 375px, 768px, 1024px, and 1440px. Confirm:

- No page-level horizontal scroll.
- Cards reflow 1/2/3 columns as specified.
- Recently Updated switches to cards below `md`.
- Focus is visible on cards, menu items, retries, quick links, and row actions.
- Directional icons mirror correctly in RTL.
- Status meaning is not color-only.
- No unsupported user, academic-target, deadline, readiness, or join-link data appears.

- [ ] **Step 6: Apply final Test Guard and Clean Code Guard passes**

Review the complete Screen 1 test diff with Test Guard and the complete production-code diff with Clean Code Guard. Fix findings and repeat the affected targeted commands.

- [ ] **Step 7: Inspect the task-only diff and commit any quality-gate fixes**

```powershell
& {
  git status --short
  git diff --check
  git diff --name-only HEAD~6..HEAD
}
```

Confirm no unrelated pre-existing path was staged or committed. If quality-gate fixes were required, stage only the affected Screen 1 files and commit them with:

```powershell
& {
  git add -- src/features/academic-content/model/academicContentOverview.ts src/features/academic-content/model/__tests__/academicContentOverview.test.ts src/features/academic-content/services/academicContentOverviewService.ts src/features/academic-content/services/__tests__/academicContentOverviewService.test.ts src/features/academic-content/hooks/useAcademicContentOverview.ts src/features/academic-content/hooks/__tests__/useAcademicContentOverview.test.tsx src/features/academic-content/components/overview src/features/academic-content/pages/AcademicContentOverviewPage.tsx src/features/academic-content/pages/__tests__/AcademicContentOverviewPage.test.tsx 'src/app/[lang]/(dashboard)/academic-content-hub/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/library/page.tsx' 'src/app/[lang]/(dashboard)/academic-content-hub/__tests__/routes.test.tsx' src/features/academic-content/index.ts src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx src/features/academic-content/pages/CreateAcademicContentPage.tsx src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx
  git add -p -- src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
  git diff --cached
  git commit -m "fix(academic-content): harden overview screen"
}
```

Do not run `npm run test:run` without file arguments unless the user explicitly approves the full suite.

## Definition of Done

- The root Academic Content route renders the approved Screen 1 overview.
- The existing library remains available at `/academic-content-hub/library` with its URL filters and behavior intact.
- Six type totals are real, independently loaded, and distinguish zero from unavailable.
- Work in Progress uses only Draft and Changes Requested data.
- Upcoming Online Sessions uses only contract fields and only Upcoming or Starting Soon states.
- Recently Updated has no unsupported Updated By field.
- Quick Links and Create actions obey existing permissions.
- Navigation preserves academic year and term context.
- All new copy is bilingual and RTL-safe.
- Targeted tests, lint, typecheck, and build results are reported accurately.
- The full repository test suite is not run without explicit approval.
- Existing unrelated working-tree changes remain untouched.
