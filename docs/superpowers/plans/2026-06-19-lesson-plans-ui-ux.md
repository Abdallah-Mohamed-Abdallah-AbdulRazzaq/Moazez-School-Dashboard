# Lesson Plans UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Lesson Plans page into a clear, responsive planning workspace while preserving its backend contracts, permissions, and mutation behavior.

**Architecture:** Keep `useLessonPlansData` and `useLessonPlanMutations` as the data and mutation boundaries. Add pure presentation selectors for week visibility and state, then compose the existing page from focused header, summary, validation, library, and board components using the current UI library. All new copy lives under `academics.lessonPlans` in both locale files.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Lucide icons, existing SIS UI components, Vitest, Testing Library.

---

## File Structure

- Create `src/features/academics/lesson-plans/components/lessonPlansPresentation.ts` for pure week-filter and visual-state selectors.
- Create `src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts` for selector coverage.
- Create `src/features/academics/lesson-plans/components/LessonPlansPageHeader.tsx` for page title, actions, and scope chips.
- Create `src/features/academics/lesson-plans/components/LessonPlansSkeleton.tsx` for page-level loading placeholders.
- Modify `LessonPlansPage.tsx` to compose the new header and checked loading/empty states without changing service calls.
- Modify `LessonPlansFilters.tsx` to use compact existing `Select` controls and translated labels.
- Modify `ProgressSummary.tsx` to render backend totals as KPI cards.
- Modify `LessonPlanValidationPanel.tsx` to translate summary labels and collapse issue details.
- Modify `LessonPlansBoard.tsx`, `WeeksBoardDesktop.tsx`, `WeeksBoardMobile.tsx`, and `WeekColumn.tsx` for board filters and professional week states.
- Modify `LessonLibrary.tsx` and `LessonPlanItemCard.tsx` for readable metadata and accessible actions.
- Prefer fixing dropdown trigger accessibility locally inside lesson-plan components. Modify `src/components/ui/dropdown/DropdownMenu.tsx` only if local fixes cannot make the lesson-plan menus keyboard-operable; if it is modified, verify existing dropdown usages still open, close, and keep their visual output.
- Modify `src/messages/en.json` and `src/messages/ar.json` together for every new label and state.

### Task 1: Pure Presentation Selectors

**Files:**

- Create: `src/features/academics/lesson-plans/components/lessonPlansPresentation.ts`
- Create: `src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts`

- [ ] **Step 1: Write failing selector tests**

```ts
import { describe, expect, it } from "vitest";
import {
  deriveIssueWeekIndexes,
  filterLessonPlanWeeks,
  getWeekPresentation,
} from "../lessonPlansPresentation";

describe("lesson plan presentation selectors", () => {
  const weeks = [
    {
      weekIndex: 1,
      startDate: "2026-09-01",
      endDate: "2026-09-07",
      instructionalDays: ["2026-09-01"],
      holidayDays: [],
      lostTeachingDays: 0,
      hasHolidays: false,
    },
    {
      weekIndex: 2,
      startDate: "2026-09-08",
      endDate: "2026-09-14",
      instructionalDays: [],
      holidayDays: [{ date: "2026-09-09", eventId: "holiday-1", title: "Holiday" }],
      lostTeachingDays: 1,
      hasHolidays: true,
    },
  ];

  it("filters the backend array without creating weeks", () => {
    const result = filterLessonPlanWeeks({
      weeks,
      plans: [{ weekIndex: 1, items: [{ id: "item-1" }] }] as never,
      issueWeekIndexes: new Set([2]),
      filter: "PLANNED",
      today: "2026-09-03",
    });
    expect(result.map((week) => week.weekIndex)).toEqual([1]);
    expect(result.every((week) => weeks.includes(week))).toBe(true);
  });

  it("marks current, planned, issue, and non-instructional states", () => {
    expect(
      getWeekPresentation({
        week: weeks[1],
        itemCount: 0,
        hasIssue: true,
        today: "2026-09-10",
      }),
    ).toEqual({
      isCurrent: true,
      hasPlannedItems: false,
      hasIssue: true,
      hasInstructionalDays: false,
    });
  });

  it("associates validation items only through existing plan items", () => {
    const indexes = deriveIssueWeekIndexes({
      plans: [{ weekIndex: 3, items: [{ id: "item-3" }] }] as never,
      issues: [{ code: "holiday", severity: "warning", message: "Holiday", itemId: "item-3" }],
    });
    expect([...indexes]).toEqual([3]);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts`

Expected: FAIL because `lessonPlansPresentation.ts` does not exist.

- [ ] **Step 3: Implement the selectors**

```ts
import type { LessonPlan, WeekInfo } from "../services/lessonPlansService";

export type WeekBoardFilter = "ALL" | "CURRENT_UPCOMING" | "PLANNED" | "ISSUES";

export function deriveIssueWeekIndexes({
  plans,
  issues,
}: {
  plans: LessonPlan[];
  issues: Array<{ itemId?: string }>;
}) {
  const weekByItemId = new Map(
    plans.flatMap((plan) => plan.items.map((item) => [item.id, plan.weekIndex] as const)),
  );
  return new Set(
    issues.flatMap((issue) => {
      const weekIndex = issue.itemId ? weekByItemId.get(issue.itemId) : undefined;
      return weekIndex === undefined ? [] : [weekIndex];
    }),
  );
}

export function getWeekPresentation({
  week,
  itemCount,
  hasIssue,
  today,
}: {
  week: WeekInfo;
  itemCount: number;
  hasIssue: boolean;
  today: string;
}) {
  return {
    isCurrent: week.startDate <= today && today <= week.endDate,
    hasPlannedItems: itemCount > 0,
    hasIssue,
    hasInstructionalDays: week.instructionalDays.length > 0,
  };
}

export function filterLessonPlanWeeks({
  weeks,
  plans,
  issueWeekIndexes,
  filter,
  today,
}: {
  weeks: WeekInfo[];
  plans: LessonPlan[];
  issueWeekIndexes: Set<number>;
  filter: WeekBoardFilter;
  today: string;
}) {
  const itemCountByWeek = new Map(plans.map((plan) => [plan.weekIndex, plan.items.length]));
  return weeks.filter((week) => {
    if (filter === "CURRENT_UPCOMING") return week.endDate >= today;
    if (filter === "PLANNED") return (itemCountByWeek.get(week.weekIndex) ?? 0) > 0;
    if (filter === "ISSUES") return issueWeekIndexes.has(week.weekIndex);
    return true;
  });
}
```

The issue-index set contains only issues whose `itemId` matches an item in an existing plan. Issues without that reliable association remain visible in the validation panel and do not mark a guessed week.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts`

Expected: PASS.

```bash
git add src/features/academics/lesson-plans/components/lessonPlansPresentation.ts src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts
git commit -m "feat: add lesson plan presentation selectors"
```

### Task 2: Header, Scope Chips, and Compact Filters

**Files:**

- Create: `src/features/academics/lesson-plans/components/LessonPlansPageHeader.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/LessonPlansPageHeader.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/LessonPlansFilters.tsx`
- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write a failing header test**

Render the header inside the repository's next-intl test wrapper and assert visible scope names and accessible actions:

```tsx
expect(screen.getByRole("heading", { name: messages.academics.lessonPlans.title })).toBeVisible();
expect(screen.getByRole("button", { name: messages.academics.lessonPlans.actions.autoPlan })).toBeEnabled();
expect(screen.getByRole("button", { name: messages.academics.lessonPlans.actions.validateRefresh })).toBeEnabled();
expect(screen.getByRole("button", { name: messages.academics.lessonPlans.actions.export })).toBeEnabled();
expect(screen.getByText("Grade 6")).toBeVisible();
expect(screen.getByText("Mathematics")).toBeVisible();
```

Add a separate test for the unavailable Auto-plan path:

```tsx
expect(screen.getByRole("button", { name: messages.academics.lessonPlans.actions.autoPlan })).toBeDisabled();
expect(screen.getByText(messages.academics.lessonPlans.tooltips.autoPlanUnavailable)).toBeVisible();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlansPageHeader.test.tsx`

Expected: FAIL because the header component does not exist.

- [ ] **Step 3: Create the focused header component**

Define props containing translated scope values rather than IDs:

```ts
interface LessonPlansPageHeaderProps {
  scopeLabels: string[];
  autoPlanDisabled: boolean;
  autoPlanUnavailableReason?: string;
  exportDisabled: boolean;
  refreshing: boolean;
  onAutoPlan: () => void;
  onRefresh: () => void;
  onExport: () => void;
}
```

Use existing `Button`, Lucide `Sparkles`, `RefreshCw`, and `Download`, and render scope labels as bordered rounded chips with text. Do not add raw buttons.

Auto-plan must only be enabled when the real `AutoPlanDialog` and backend mutation are already wired in the current page. If either is missing, render the button disabled with a translated tooltip from `academics.lessonPlans.tooltips.autoPlanUnavailable`. Do not mock, fake, or simulate auto-plan behavior.

- [ ] **Step 4: Replace the page's inline header**

In `LessonPlansPage.tsx`, derive display names from the already-loaded arrays with `useMemo`, pass `refreshPlans` to the refresh action, and keep existing Auto-plan and Export handlers only if the real dialog and mutation are already implemented. Do not add a validation endpoint call because `refreshPlans` already reloads plans, summary, and validation.

- [ ] **Step 5: Compact and translate filters**

Add `disabled?: boolean` and `loading?: boolean` props to `LessonPlansFilters`. Keep every field as the existing `Select`. Replace locale conditionals for Classroom and Select Classroom with `t("classroom")` and `t("selectClassroom")`. Use a responsive grid:

```tsx
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
```

- [ ] **Step 6: Add English and Arabic messages**

Add matching keys under `academics.lessonPlans`:

```json
{
  "actions": { "validateRefresh": "Validate and refresh" },
  "filters": { "classroom": "Classroom", "selectClassroom": "Select classroom" },
  "scope": { "title": "Selected scope" }
}
```

Arabic values:

```json
{
  "actions": { "validateRefresh": "التحقق والتحديث" },
  "filters": { "classroom": "الفصل", "selectClassroom": "اختر الفصل" },
  "scope": { "title": "النطاق المحدد" }
}
```

- [ ] **Step 7: Run tests and commit**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlansPageHeader.test.tsx && npm run guard:i18n`

Expected: PASS.

```bash
git add src/features/academics/lesson-plans/components/LessonPlansPageHeader.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlansPageHeader.test.tsx src/features/academics/lesson-plans/components/LessonPlansFilters.tsx src/features/academics/lesson-plans/pages/LessonPlansPage.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: refine lesson plans header and filters"
```

### Task 3: Backend Summary KPI Cards

**Files:**

- Modify: `src/features/academics/lesson-plans/components/ProgressSummary.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/ProgressSummary.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing summary assertions**

```tsx
renderSummary({
  lessonPlansCount: 3,
  itemsCount: 12,
  plannedItemsCount: 7,
  completedItemsCount: 4,
  unplannedLessonsCount: 2,
  coveragePercent: 75,
});
expect(screen.getByText("Lesson plans")).toBeVisible();
expect(screen.getByText("Unplanned lessons")).toBeVisible();
expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/ProgressSummary.test.tsx`

Expected: FAIL because the current progress bar has no progress semantics and summary is not card-based.

- [ ] **Step 3: Implement six responsive KPI cards**

Create a configuration array backed only by `LessonPlanSummary` values. Reuse the current KPI-card visual tokens or `KPICard` when its required props match. Use Lucide icons such as `CalendarRange`, `ListChecks`, `Clock3`, `CircleCheck`, `BookOpen`, and `ChartNoAxesCombined`. Clamp the visual bar only:

```ts
const coverageWidth = Math.min(100, Math.max(0, summary.coveragePercent));
```

Keep the displayed number unchanged and add `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.

- [ ] **Step 4: Add matching translations and run tests**

Add explicit English and Arabic labels for all six values. Run:

`npm run test:run -- src/features/academics/lesson-plans/components/__tests__/ProgressSummary.test.tsx && npm run guard:i18n`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/academics/lesson-plans/components/ProgressSummary.tsx src/features/academics/lesson-plans/components/__tests__/ProgressSummary.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: add lesson plan summary KPI cards"
```

### Task 4: Human-Readable Validation Panel

**Files:**

- Modify: `src/features/academics/lesson-plans/components/LessonPlanValidationPanel.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Replace the existing test with success and warning behavior**

```tsx
expect(screen.getByText("No validation issues")).toBeVisible();
expect(screen.queryByText("duplicateLessons")).not.toBeInTheDocument();

await user.click(screen.getByRole("button", { name: "Show 2 issues" }));
expect(screen.getByText("Warning")).toBeVisible();
expect(screen.queryByText("academics.lesson_plan.duplicate")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx`

Expected: FAIL because raw keys and codes are currently rendered and the list is always expanded.

- [ ] **Step 3: Implement translated summary configuration**

Use `useTranslations("academics.lessonPlans.validationPanel")`, a typed summary configuration, `CheckCircle2` for success, and `TriangleAlert` for warnings. Toggle issue details with an actual button carrying `aria-expanded` and `aria-controls`.

Render issue text by resolving a translation for `issue.code` first, using a mapping such as `academics.lessonPlans.validationIssues.${issue.code}` when that key exists, then falling back to `issue.message`. Translate severity, and omit raw `issue.code`, IDs, and allocation IDs from normal UI. Raw codes may appear only in tests/debug logs, not in the visible user-facing panel.

- [ ] **Step 4: Add complete locale keys**

Add titles for success, warning, show/hide issue actions, severities, and all six summary labels in English and Arabic.

- [ ] **Step 5: Run tests, audit raw keys, and commit**

Run:

```bash
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx
rg -n "duplicateLessons|outsideTermItems|holidayItems|missingPlannedLessons|itemsChecked|lessonPlansChecked" src/features/academics/lesson-plans/components
npm run guard:i18n
```

Expected: test PASS; ripgrep returns no user-facing raw-label render; translation guard PASS.

```bash
git add src/features/academics/lesson-plans/components/LessonPlanValidationPanel.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: improve lesson plan validation feedback"
```

### Task 5: Board Filters and Week States

**Files:**

- Modify: `src/features/academics/lesson-plans/components/LessonPlansBoard.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeeksBoardDesktop.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeeksBoardMobile.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeekColumn.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/WeeksBoardDesktop.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing board behavior tests**

Test that:

```tsx
expect(screen.getAllByTestId("week-column")).toHaveLength(backendWeeks.length);
await user.click(screen.getByRole("button", { name: "Planned only" }));
expect(screen.getAllByTestId("week-column")).toHaveLength(1);
expect(screen.getByText("No lessons planned")).toBeVisible();
expect(screen.getByText("Drag a lesson here")).toBeVisible();
expect(screen.getByText("This week has no instructional days.")).toBeVisible();
```

Also dispatch drag-over/drop on a non-instructional week and assert `onDropOnWeek` is not called.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/WeeksBoardDesktop.test.tsx`

Expected: FAIL because board controls and the compact empty guidance do not exist.

- [ ] **Step 3: Add the four filter chips to `LessonPlansBoard`**

Store `WeekBoardFilter` locally, use `filterLessonPlanWeeks`, and render four translated `Button` controls with `aria-pressed`. Pass only the filtered backend week references to desktop/mobile boards. Show a translated no-matching-weeks state when a local filter produces an empty result.

- [ ] **Step 4: Refine the desktop and mobile layouts**

Use a three-column maximum desktop grid:

```tsx
<div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
```

Keep mobile accordions. Add `data-testid="week-column"` to the semantic week container for focused tests.

- [ ] **Step 5: Implement explicit week states**

Pass `isCurrent` and `hasIssue` to `WeekColumn`. Use text badges and icons in addition to border/background differences. Keep `week.weekIndex`, `startDate`, and `endDate` from backend. Preserve the existing no-instructional-days drop guard.

Replace the valid empty-week body with translated title and helper text. For non-instructional weeks, show only the disabled explanation.

- [ ] **Step 6: Add translations, run tests, and commit**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlansPresentation.test.ts src/features/academics/lesson-plans/components/__tests__/WeeksBoardDesktop.test.tsx && npm run guard:i18n`

Expected: PASS.

```bash
git add src/features/academics/lesson-plans/components/LessonPlansBoard.tsx src/features/academics/lesson-plans/components/WeeksBoardDesktop.tsx src/features/academics/lesson-plans/components/WeeksBoardMobile.tsx src/features/academics/lesson-plans/components/WeekColumn.tsx src/features/academics/lesson-plans/components/__tests__/WeeksBoardDesktop.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: clarify lesson plan week board"
```

### Task 6: Lesson Library and Item Cards

**Files:**

- Modify: `src/features/academics/lesson-plans/components/LessonLibrary.tsx`
- Modify: `src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx`
- Modify: `src/components/ui/dropdown/DropdownMenu.tsx` only if local lesson-plan trigger fixes are insufficient
- Create: `src/features/academics/lesson-plans/components/__tests__/LessonLibrary.test.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing library tests**

Assert curriculum guidance, unit title, estimated duration, planned label, no-results copy, and an accessible Add button for an unplanned lesson. Verify the Add button invokes the same selection callback used by the existing mobile/library flow; add a focused optional callback prop rather than a new mutation.

- [ ] **Step 2: Write failing item-card tests**

```tsx
expect(screen.getByText("In progress")).toBeVisible();
expect(screen.getByText("Sep 9 · Period 2")).toBeVisible();
expect(screen.getByLabelText("Has notes")).toBeVisible();
await user.click(screen.getByRole("button", { name: "Lesson actions" }));
expect(screen.getByRole("button", { name: "Complete" })).toBeVisible();
expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
```

- [ ] **Step 3: Run both tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonLibrary.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx`

Expected: FAIL because the metadata, Add action, icons, and accessible menu trigger are incomplete.

- [ ] **Step 4: Refine the library**

Keep existing `Input` and `Select`. Group by unit after filtering with a stable `Map<string, Lesson[]>`. Render `lesson.estimatedMinutes` only when non-null. Keep drag behavior, add a visible Add button wired to the existing lesson-selection callback, and distinguish:

- zero curriculum lessons;
- zero filtered results.

Make the desktop library sticky with a constrained viewport height rather than changing its data flow.

- [ ] **Step 5: Refine item cards and supported actions**

Use a typed status-style map for the supported UI item statuses only: `PLANNED`, `IN_PROGRESS`, `DONE`, `SKIPPED`, `CANCELLED`, and `UNKNOWN`. Do not introduce or display `RESCHEDULED`; moving or rescheduling an item uses the move endpoint and does not change item status. Render planned date and period only when present. Translate Move up/Move down and every dropdown label. Add Lucide icons to status actions, notes, reorder, and delete. Do not add an unsupported generic move endpoint; retain only the existing supported reorder and drag-move handlers.

- [ ] **Step 6: Make custom dropdown triggers keyboard-operable**

First try to make the lesson-plan custom trigger itself a semantic `button` and pass it to `DropdownMenu` without requiring shared component changes. Only if the shared wrapper prevents this, change the shared `DropdownMenu` custom-trigger wrapper from a clickable `div` to a semantic button or require the supplied trigger itself to be a button and attach the toggling handler through a keyboard-operable wrapper. Preserve existing visual output and add `aria-haspopup="menu"` and `aria-expanded`.

Add `role="menu"` to the menu container and `role="menuitem"` to enabled action buttons.

If `src/components/ui/dropdown/DropdownMenu.tsx` changes, run a quick repo search for other `DropdownMenu` usages and add or adjust focused checks if any usage relies on the old non-button wrapper behavior.

- [ ] **Step 7: Add translations, run tests, and commit**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonLibrary.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx && npm run guard:i18n`

Expected: PASS.

```bash
git add src/features/academics/lesson-plans/components/LessonLibrary.tsx src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx src/features/academics/lesson-plans/components/__tests__/LessonLibrary.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx src/messages/en.json src/messages/ar.json
# Add src/components/ui/dropdown/DropdownMenu.tsx only if the shared dropdown was actually changed.
git commit -m "feat: improve lesson planning cards and library"
```

### Task 7: Loading and Checked Empty States

**Files:**

- Create: `src/features/academics/lesson-plans/components/LessonPlansSkeleton.tsx`
- Create: `src/features/academics/lesson-plans/pages/__tests__/lessonPlansEmptyState.test.tsx`
- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Modify: `src/features/academics/lesson-plans/hooks/useLessonPlansData.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing state-selection tests**

Extract or extend the existing pure page-state helper so the test can assert this order:

```ts
expect(resolveLessonPlansView({ loading: true, scopeResolved: false, dataChecked: false })).toBe("loading");
expect(resolveLessonPlansView({ loading: false, scopeResolved: true, dataChecked: false, teacherSubjectAllocationId: "" })).toBe("no-allocation");
expect(resolveLessonPlansView({ loading: false, scopeResolved: true, dataChecked: false, teacherSubjectAllocationId: "a", curriculumId: "" })).toBe("no-curriculum");
expect(resolveLessonPlansView({ loading: false, scopeResolved: true, dataChecked: true, curriculumId: "c", weeks: [] })).toBe("no-weeks");
expect(resolveLessonPlansView({ loading: false, scopeResolved: true, dataChecked: true, curriculumId: "c", weeks: [week], lessons: [] })).toBe("no-lessons");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/pages/__tests__/lessonPlansEmptyState.test.tsx`

Expected: FAIL because the checked-state resolver and `dataChecked` signal are missing.

- [ ] **Step 3: Add an explicit checked signal to the data hook**

Set `dataChecked` false before a scoped request and true after success or handled failure. Keep it false when the required scope is absent, but do not let that produce an infinite skeleton: once options and scope resolution have finished, missing required filters/options must resolve to focused empty states such as no allocation or no curriculum. Do not replace or merge existing loading flags.

- [ ] **Step 4: Build the skeleton and empty-state composition**

`LessonPlansSkeleton.tsx` renders animated neutral blocks for header actions, five filters, six KPI cards, library, and three week cards. It performs no data reads.

In `LessonPlansPage.tsx`, render the skeleton while initialization/options/scope/data are genuinely loading. After options and scope resolution finish, render translated focused empty states for missing allocation, curriculum, backend weeks, curriculum lessons, and plans. Missing required filters/options must not wait for `dataChecked`, because no backend data request can run without that scope. The no-plans state still displays the valid backend week board so the user can add the first lesson lazily.

- [ ] **Step 5: Add locale keys and run tests**

Run: `npm run test:run -- src/features/academics/lesson-plans/pages/__tests__/lessonPlansEmptyState.test.tsx && npm run guard:i18n`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/lesson-plans/components/LessonPlansSkeleton.tsx src/features/academics/lesson-plans/pages/__tests__/lessonPlansEmptyState.test.tsx src/features/academics/lesson-plans/pages/LessonPlansPage.tsx src/features/academics/lesson-plans/hooks/useLessonPlansData.ts src/messages/en.json src/messages/ar.json
git commit -m "feat: add lesson plans loading and empty states"
```

### Task 8: RTL, Accessibility, and Final Verification

**Files:**

- Modify: all Lesson Plans files touched in Tasks 2–7 as findings require.
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Run focused tests and fix only observed failures**

Run: `npm run test:run -- src/features/academics/lesson-plans`

Expected: all Lesson Plans tests PASS.

- [ ] **Step 2: Audit hard-coded and raw backend text**

Run:

```bash
rg -n "duplicateLessons|outsideTermItems|holidayItems|missingPlannedLessons|itemsChecked|lessonPlansChecked|No validation issues|No lessons planned|Drag a lesson" src/features/academics/lesson-plans --glob "!**/__tests__/**"
rg -n "<select|<textarea|type=\"date\"" src/features/academics/lesson-plans --glob "!**/__tests__/**"
```

Expected: no hard-coded user-facing matches and no raw form controls.

- [ ] **Step 3: Audit unsupported API routes**

Run:

```bash
rg -n "apiWithToken|/lesson-plans/items/reorder|POST.*lesson-plans/items/move|items/:itemId/status|items/:itemId/notes" src/features/academics/lesson-plans
```

Expected: no matches.

- [ ] **Step 4: Verify RTL and accessibility through component tests**

Render header, filters, week board, library, and item card with Arabic messages. Assert Arabic labels, button roles, menu roles, `aria-expanded`, `aria-pressed`, progressbar semantics, and disabled week controls. Avoid snapshot-only assertions.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run guard:i18n
```

Expected: typecheck and translation guard PASS; no new lint errors; all Lesson Plans tests PASS. If unrelated pre-existing repository tests fail, record their exact test names and rerun the Lesson Plans suite separately to prove feature isolation.

- [ ] **Step 6: Review production and test code guards**

Apply `clean-code-guard` to changed production code and `test-guard` to changed tests. Remove duplicated style maps, assertions that only mirror implementation details, inaccessible click targets, and unused props found by the reviews.

- [ ] **Step 7: Commit final corrections**

```bash
git add src/features/academics/lesson-plans src/messages/en.json src/messages/ar.json
# Add src/components/ui/dropdown/DropdownMenu.tsx only if the shared dropdown was actually changed and verified.
git commit -m "feat: polish lesson plans planning workspace"
```
