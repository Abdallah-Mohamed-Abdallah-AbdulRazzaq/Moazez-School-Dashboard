# Lesson Plans Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing Lesson Plans page, hooks, board, and dialogs to the production allocation- and plan-scoped backend contract.

**Architecture:** Exact backend DTOs feed pure mappers that preserve the existing weekly-board model. A route-accurate API adapter becomes the production service default; hooks resolve teacher allocations and curricula, while board mutations carry plan and item IDs to supported endpoints.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios-backed API helpers, Vitest, Testing Library.

---

## File structure

- Create `src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts` for verified request/response DTOs and canonical UI models.
- Create `src/features/academics/lesson-plans/services/lessonPlansMappers.ts` for status conversion, DTO mapping, week bucketing, and summary mapping.
- Create `src/features/academics/lesson-plans/services/lessonPlansErrors.ts` for backend-code-to-UI error mapping.
- Replace `lessonPlansAdapter.ts`, `lessonPlansApiAdapter.ts`, and `lessonPlansService.ts` with the production contract.
- Modify `useLessonPlansData.ts` to resolve allocation/curriculum scope and load plans, detail items, backend weeks, and backend summary.
- Modify `useLessonPlanMutations.ts` and `LessonPlansBoard.tsx` to use plan/item IDs and supported mutations.
- Modify `LessonPlansPage.tsx` only for the new hook/board props and archived-plan read-only state.
- Modify `ProgressSummary.tsx` to display only totals returned by `/summary`; remove mock-only weekly breakdown and inferred status totals.
- Preserve all other presentation components unless their status type requires `CANCELLED` support.

### Task 1: Backend types, mappers, and errors

**Files:**

- Create: `src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts`
- Create: `src/features/academics/lesson-plans/services/lessonPlansMappers.ts`
- Create: `src/features/academics/lesson-plans/services/lessonPlansErrors.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/lessonPlansErrors.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Cover ID fallback, lowercase statuses, `sortOrder -> order`, notes, week mapping, planned-date bucketing, and real summary totals:

```ts
it("maps backend detail into the existing weekly board model", () => {
  const plan = mapLessonPlanDetailDto(detailDto);
  expect(plan).toMatchObject({
    id: "plan-1",
    rawStatus: "active",
    status: "ACTIVE",
    teacherSubjectAllocationId: "allocation-1",
    curriculumId: "curriculum-1",
  });
  expect(plan.items[0]).toMatchObject({
    id: "item-1",
    planId: "plan-1",
    status: "IN_PROGRESS",
    rawStatus: "in_progress",
    order: 3,
    notes: "Prepare examples",
  });
});

it("preserves a newly introduced backend status without crashing", () => {
  const plan = mapLessonPlanDetailDto({ ...detailDto, status: "paused" });
  expect(plan.status).toBe("UNKNOWN");
  expect(plan.rawStatus).toBe("paused");

  const item = mapLessonPlanItemDto({ ...itemDto, status: "blocked" });
  expect(item.status).toBe("UNKNOWN");
  expect(item.rawStatus).toBe("blocked");
});

it("maps backend weeks without recomputing term dates", () => {
  expect(mapLessonPlanWeeksDto(weeksDto)[0]).toMatchObject({
    weekIndex: 1,
    startDate: "2026-09-01",
    endDate: "2026-09-07",
    plannedItemsCount: 2,
  });
});

it("maps backend summary instead of calculating coverage locally", () => {
  expect(mapLessonPlanSummaryDto(summaryDto)).toMatchObject({
    lessonPlansCount: 2,
    itemsCount: 10,
    plannedItemsCount: 7,
    completedItemsCount: 3,
    unplannedLessonsCount: 4,
    coveragePercent: 42,
  });
});
```

- [ ] **Step 2: Run mapper tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts`

Expected: FAIL because the backend types and mappers do not exist.

- [ ] **Step 3: Define exact backend DTOs and UI models**

Implement the DTOs verified from backend commit `dc9a73cfa9d9158688de24597288f0ffe7657d2d`, including:

```ts
export type LessonPlanStatusDto = "draft" | "active" | "archived";
export type LessonPlanItemStatusDto =
  | "planned"
  | "in_progress"
  | "done"
  | "skipped"
  | "rescheduled"
  | "cancelled";

export interface LessonPlanItemResponseDto {
  id: string;
  itemId: string;
  lessonPlanId: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  unitTitle: string;
  lessonTitle: string;
  timetableEntryId: string | null;
  plannedDate: string | null;
  dayOfWeek: number | null;
  periodId: string | null;
  periodLabel: string | null;
  title: string;
  notes: string | null;
  status: LessonPlanItemStatusDto;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Also define every request type listed in the approved spec and all weeks/summary/validation/auto-plan response types.

Define forward-compatible UI status types:

```ts
export type LessonPlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "UNKNOWN";
export type LessonPlanItemStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SKIPPED"
  | "CANCELLED"
  | "UNKNOWN";
```

DTOs document currently known backend values, including `rescheduled`, but mapper inputs must tolerate arbitrary status strings at runtime. A known backend status with no supported UI representation also maps to `UNKNOWN` while retaining `rawStatus`.

- [ ] **Step 4: Implement pure mappers**

Use explicit maps for known statuses, map any unrecognized plan or item status to `UNKNOWN`, and always preserve the original string in `rawStatus` for diagnostics. Status mapping must never throw merely because the backend introduced a new enum value. Derive board `weekIndex` by locating `plannedDate` inside backend week ranges, falling back to plan week dates only for unscheduled items.

- [ ] **Step 5: Write and run error mapping tests**

Test all verified `academics.lesson_plan.*` codes, trace IDs, nested details, and non-API fallback behavior.

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts src/features/academics/lesson-plans/services/__tests__/lessonPlansErrors.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts src/features/academics/lesson-plans/services/lessonPlansMappers.ts src/features/academics/lesson-plans/services/lessonPlansErrors.ts src/features/academics/lesson-plans/services/__tests__
git commit -m "feat: add lesson plans backend contract"
```

### Task 2: Route-accurate API adapter

**Files:**

- Replace: `src/features/academics/lesson-plans/services/lessonPlansAdapter.ts`
- Replace: `src/features/academics/lesson-plans/services/lessonPlansApiAdapter.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`. Assert exact method, path, query, and payload for every supported operation. Representative assertions:

```ts
expect(apiGet).toHaveBeenCalledWith(
  "/academics/lesson-plans?termId=term-1&teacherSubjectAllocationId=allocation-1",
);
expect(apiPatch).toHaveBeenCalledWith(
  "/academics/lesson-plans/plan-1/items/item-1/reorder",
  { sortOrder: 2 },
);
expect(apiPatch).toHaveBeenCalledWith(
  "/academics/lesson-plans/items/item-1/move",
  { weekIndex: 3, sortOrder: 0 },
);
expect(apiPost).toHaveBeenCalledWith(
  "/academics/lesson-plans/plan-1/items/item-1/skip",
  { note: "Holiday" },
);
```

Assert the adapter source contains no `apiWithToken`, `/items/status`, `/items/notes`, bulk reorder, or PUT request.

- [ ] **Step 2: Run adapter tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts`

Expected: FAIL against the current deprecated, unsupported routes.

- [ ] **Step 3: Replace the adapter interface**

Define methods for list/create/get/update/activate/archive/delete plans; weeks/summary/validation/auto-plan/move; and create/update/reorder/status/delete items. Use request-object parameters where a call would otherwise exceed four arguments.

- [ ] **Step 4: Replace the API implementation**

Use only imports from `@/lib/api`:

```ts
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
```

Build query strings by omitting undefined/empty values while preserving uppercase list status filters. Map every response through Task 1 mappers.

- [ ] **Step 5: Run adapter tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/lesson-plans/services/lessonPlansAdapter.ts src/features/academics/lesson-plans/services/lessonPlansApiAdapter.ts src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts
git commit -m "feat: align lesson plans API routes"
```

### Task 3: Real production service boundary

**Files:**

- Replace: `src/features/academics/lesson-plans/services/lessonPlansService.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/lessonPlansService.test.ts`

- [ ] **Step 1: Write failing service tests**

Assert the default adapter is `lessonPlansApiAdapter`, public functions delegate without section IDs, and production exports do not use in-memory maps, delay helpers, generated IDs, local summary calculation, or `NEXT_PUBLIC_USE_LESSON_PLANS_API`.

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansService.test.ts`

Expected: FAIL because the service is mock-first and section-scoped.

- [ ] **Step 3: Replace the service**

Export canonical types from `lessonPlansBackendTypes.ts`, retain adapter injection only for tests, and provide named delegates such as:

```ts
export const listLessonPlans = (filters: LessonPlanListFilters) =>
  getLessonPlansAdapter().listLessonPlans(filters);
export const createLessonPlanItem = (request: CreateLessonPlanItemCommand) =>
  getLessonPlansAdapter().createLessonPlanItem(request);
export const moveLessonPlanItem = (
  itemId: string,
  payload: MoveLessonPlanItemRequest,
) => getLessonPlansAdapter().moveLessonPlanItem(itemId, payload);
```

Do not export the old section-scoped mutation signatures.

- [ ] **Step 4: Run service tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/academics/lesson-plans/services/lessonPlansService.ts src/features/academics/lesson-plans/services/__tests__/lessonPlansService.test.ts
git commit -m "feat: use real lesson plans service by default"
```

### Task 4: Allocation, curriculum, weeks, plans, and summary loading

**Files:**

- Modify: `src/features/academics/lesson-plans/hooks/useLessonPlansData.ts`
- Create: `src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Mock external API boundaries and verify that a selected section/classroom/subject resolves an allocation, then calls:

```ts
listLessonPlanWeeks({
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
});
listLessonPlans({
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
});
getLessonPlanSummary({
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
});
```

Verify each list result is followed by `getLessonPlan(plan.id)` so item detail is real, and verify no request occurs when allocation or curriculum resolution fails.

- [ ] **Step 2: Run hook tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx`

Expected: FAIL because the hook computes weeks locally and calls section-based service methods.

- [ ] **Step 3: Replace curriculum loading**

Use `fetchCurriculumForScope({ academicYearId, termId, gradeId, subjectId })`; read units and lessons from the returned hierarchy. Store `curriculumId` for plan creation.

- [ ] **Step 4: Resolve allocation before lesson-plan requests**

Fetch term allocations, use the existing `resolveTeacherAllocationForTarget`, and store both `teacherSubjectAllocationId` and teacher ID. Keep section/classroom filters only as allocation-selection inputs.

- [ ] **Step 5: Load backend workflow data**

Remove `fetchTermEvents` and `computeTermWeeks`. Fetch weeks, plans, plan details, and summary from the backend in one refresh flow with stale-request protection. Return `teacherSubjectAllocationId`, `curriculumId`, and detailed plans from the hook.

- [ ] **Step 6: Run hook tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/academics/lesson-plans/hooks/useLessonPlansData.ts src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx
git commit -m "feat: load lesson plans from backend workflow APIs"
```

### Task 5: Create plans and add lesson items

**Files:**

- Modify: `src/features/academics/lesson-plans/hooks/useLessonPlanMutations.ts`
- Create: `src/features/academics/lesson-plans/hooks/__tests__/useLessonPlanMutations.test.tsx`

- [ ] **Step 1: Write failing add-lesson tests**

Cover both cases:

1. Existing plan contains the selected week: call `createLessonPlanItem` with its plan ID.
2. No plan contains the week: call `createLessonPlan` using academic year, term, allocation, curriculum, teacher/classroom/subject, and backend week dates; then create the item using the returned plan ID.

Assert item payload contains `unitId`, `lessonId`, `plannedDate` from the target week start, and `sortOrder`, with no section ID or uppercase status.

- [ ] **Step 2: Run mutation tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlanMutations.test.tsx`

Expected: FAIL because the hook calls `upsertLessonPlanItem` with section-based fields.

- [ ] **Step 3: Implement create-plan-before-item orchestration**

Pass `academicYearId`, `teacherSubjectAllocationId`, `curriculumId`, plan list, and week list into the hook. Create a plan title from the selected lesson/subject and the week range without adding fields outside `CreateLessonPlanRequest`.

- [ ] **Step 4: Run mutation tests and verify GREEN**

Run: `npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlanMutations.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/academics/lesson-plans/hooks/useLessonPlanMutations.ts src/features/academics/lesson-plans/hooks/__tests__/useLessonPlanMutations.test.tsx
git commit -m "feat: create backend lesson plans and items"
```

### Task 6: Board item updates, movement, lifecycle, and deletion

**Files:**

- Modify: `src/features/academics/lesson-plans/components/LessonPlansBoard.tsx`
- Modify: `src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeeksBoardDesktop.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeeksBoardMobile.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeekColumn.tsx`
- Modify: `src/features/academics/lesson-plans/components/ProgressSummary.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`

- [ ] **Step 1: Write failing action-routing tests**

Extract and test pure helpers that select the supported lifecycle operation:

```ts
expect(lessonPlanItemAction("IN_PROGRESS")).toBe("start");
expect(lessonPlanItemAction("DONE")).toBe("complete");
expect(lessonPlanItemAction("SKIPPED")).toBe("skip");
expect(lessonPlanItemAction("CANCELLED")).toBe("cancel");
expect(() => lessonPlanItemAction("PLANNED")).toThrow();
```

Test lookup of `lessonPlanId` from an item before update/delete/reorder.

- [ ] **Step 2: Run board action tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`

Expected: FAIL because the old board targets unsupported status/notes routes.

- [ ] **Step 3: Replace item mutation calls**

- Notes: `updateLessonPlanItem({ lessonPlanId, itemId, payload: { notes } })`.
- Start/complete: plan-scoped lifecycle POST.
- Skip/cancel: plan-scoped lifecycle POST with `{ note }`.
- Delete: plan-scoped item DELETE.
- Move: global item PATCH with `weekIndex` and target `sortOrder`.
- Reorder: individual plan-scoped PATCH with `{ sortOrder }`; never send an ordered-ID array.
- Remove any UI action that attempts to move a progressed item back to `PLANNED`; the backend exposes no reset endpoint.

- [ ] **Step 4: Update status and notes presentation**

Continue showing existing board labels for planned/in-progress/done/skipped. Add read-only display handling for cancelled backend items. Convert the bilingual notes dialog into one backend `notes` string deterministically: use the current locale field when non-empty, otherwise the other field.

Update `ProgressSummary` to render only `lessonPlansCount`, `itemsCount`, `plannedItemsCount`, `completedItemsCount`, `unplannedLessonsCount`, and `coveragePercent` from `/summary`. Do not derive in-progress/skipped totals or a weekly breakdown that the backend did not return.

- [ ] **Step 5: Run board and component tests**

Run: `npm run test:run -- src/features/academics/lesson-plans/components`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/lesson-plans/components
git commit -m "feat: align lesson plan board mutations"
```

### Task 7: Page scope, permissions, archived read-only state, and final verification

**Files:**

- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create: `src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`

- [ ] **Step 1: Write failing page-state tests**

Test the derived mutation gate:

```ts
expect(
  canEditLessonPlans({
    canManage: true,
    termStatus: "open",
    plans: activePlans,
  }),
).toBe(true);
expect(
  canEditLessonPlans({
    canManage: true,
    termStatus: "closed",
    plans: activePlans,
  }),
).toBe(false);
expect(
  canEditLessonPlans({
    canManage: true,
    termStatus: "open",
    plans: archivedPlans,
  }),
).toBe(false);
expect(
  canEditLessonPlans({
    canManage: false,
    termStatus: "open",
    plans: activePlans,
  }),
).toBe(false);
```

Verify page access remains under `academics.lesson_plans.view` and write actions require `academics.lesson_plans.manage`.

- [ ] **Step 2: Run page-state tests and verify RED**

Run: `npm run test:run -- src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`

Expected: FAIL because archived plans are not part of the current read-only derivation.

- [ ] **Step 3: Wire new hook and board props**

Pass allocation, curriculum, plan, and item scope IDs from `useLessonPlansData` through `LessonPlansPage` to `useLessonPlanMutations` and `LessonPlansBoard`. Remove section IDs from service calls while preserving filter UI and URL behavior.

- [ ] **Step 4: Add verified error translations and read-only messaging**

Add English and Arabic messages for the error codes from the approved spec. Use `lessonPlansUiError` in hooks/board instead of generic console-only failures. Keep trace IDs available in surfaced errors.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm run test:run -- src/features/academics/lesson-plans
npm run typecheck
npm run lint -- src/features/academics/lesson-plans
npm run guard:i18n
npm run build
rg -n "apiWithToken|/lesson-plans/items/reorder|/lesson-plans/items/move|/items/.*/status|/items/.*/notes|method: \"PUT\"|sectionId" src/features/academics/lesson-plans
```

Expected: tests, typecheck, lint, translation guard, and build pass. The final search returns no deprecated helper, legacy bulk-reorder or POST-move route, unsupported status/notes route, PUT operation, or section-scoped service contract. The supported move call remains `PATCH /academics/lesson-plans/items/:itemId/move`.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/lesson-plans src/messages/en.json src/messages/ar.json
git commit -m "feat: integrate lesson plans backend"
```
