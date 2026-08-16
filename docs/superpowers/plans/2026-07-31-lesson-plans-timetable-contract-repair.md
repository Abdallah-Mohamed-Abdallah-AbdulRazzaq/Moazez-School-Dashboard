# Lesson Plans and Timetable Contract Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair duplicate lesson-plan loading, timetable scope and slot selection, reorder behavior, Auto-plan readiness, and lesson-plan DTO presentation so the frontend matches `Moazez-Backend` commit `2f87a155cf27f2186cfd7746026562ef18cb4f71`.

**Architecture:** Keep the existing Lesson Plans page and API adapters. Add exact backend DTOs, isolate timetable candidate resolution and dashboard-entry selection into pure service helpers, and leave React components responsible for request lifecycle and presentation. Reconcile non-atomic reorder operations from backend detail after both item patches settle.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, next-intl, Axios-based API helpers, Vitest 2, Testing Library.

## Global Constraints

- Frontend-only: do not modify `Moazez-Backend` or add API routes.
- Preserve the Lesson Plans route, filters, weekly board, dialogs, permissions, and responsive layouts.
- Preserve unrelated dirty-worktree changes, especially student-profile work.
- If execution starts in an isolated worktree, first port only the current
  uncommitted diffs for `useLessonPlansData.ts` and
  `useLessonPlansData.test.tsx`; a worktree created from `HEAD` will not contain
  the already-completed Task 1 repair.
- `src/messages/en.json` and `src/messages/ar.json` already contain unrelated
  dirty-worktree edits; stage only Lesson Plans translation hunks with
  `git add -p` and inspect `git diff --cached` before every commit that includes
  either file.
- Treat backend commit `2f87a155cf27f2186cfd7746026562ef18cb4f71` as the contract authority.
- Follow test-driven development: add or update the focused regression test, observe the expected failure, implement the smallest contract-aligned change, and rerun the test.
- Timetable metadata fallback is `CLASSROOM -> SECTION -> GRADE -> TERM` and continues only for error code `academics.timetable.config_not_found`.
- Manual timetable slots require an exact, non-null `teacherSubjectAllocationId`; do not add a legacy classroom/subject/teacher fallback.
- `RESCHEDULED` is display-only and terminal.
- Closed terms may submit Auto-plan preview with `dryRun: true`, but never Apply with `dryRun: false`.
- Maintain recursive English/Arabic translation-key parity.
- Do not add a new allocation-summary screen.

---

### Task 1: Stabilize lesson-plan scope loading

**Files:**
- Modify: `src/features/academics/lesson-plans/hooks/useLessonPlansData.ts`
- Test: `src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx`

**Interfaces:**
- Produces: `refreshSummaryForQuery(query, options)` and `refreshValidationForQuery(query, options)`, stable callbacks that do not close over selected React scope.
- Preserves: public `refreshSummary`, `refreshValidation`, and `refreshSummaryAndValidation` signatures returned by `useLessonPlansData`.
- Current state: this repair and its regression test already exist as
  uncommitted Lesson Plans changes in the shared worktree; verify and land them
  without reverting or duplicating them.

- [ ] **Step 1: Review the existing duplicate-request regression test**

Add a test that begins with an incomplete classroom/subject selection, rerenders with the complete scope, waits for `scopeStatus === "ready"`, and asserts one call each:

```tsx
expect(fetchCurriculumForScope).toHaveBeenCalledTimes(1);
expect(fetchTeacherAllocations).toHaveBeenCalledTimes(1);
expect(listLessonPlanWeeks).toHaveBeenCalledTimes(1);
expect(listLessonPlans).toHaveBeenCalledTimes(1);
expect(getLessonPlanSummary).toHaveBeenCalledTimes(1);
expect(getLessonPlanValidation).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run the hook test and verify the existing repair**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx
```

Expected in the current worktree: PASS, with one curriculum, allocation, weeks,
plan, summary, and validation request set.

- [ ] **Step 3: Verify the explicit-query implementation**

Implement stable query consumers:

```ts
const refreshSummaryForQuery = useCallback(
  async (
    query: LessonPlanSummaryQuery,
    options: RefreshLessonPlansOptions = {},
  ) => {
    const currentRequest = ++summaryRequestId.current;
    if (!options.silent) {
      setSummaryLoading(true);
      setSummaryError(null);
    }
    try {
      const nextSummary = await getLessonPlanSummary(query);
      if (currentRequest === summaryRequestId.current) {
        setSummary(nextSummary);
      }
    } catch (error) {
      if (currentRequest === summaryRequestId.current) {
        setSummaryError(
          error instanceof Error
            ? error
            : new Error("Failed to load lesson plan summary"),
        );
      }
    } finally {
      if (currentRequest === summaryRequestId.current) {
        setSummaryLoading(false);
      }
    }
  },
  [],
);

const refreshValidationForQuery = useCallback(
  async (
    query: LessonPlanSummaryQuery,
    options: RefreshLessonPlansOptions = {},
  ) => {
    const currentRequest = ++validationRequestId.current;
    if (!options.silent) {
      setValidationLoading(true);
      setValidationError(null);
    }
    try {
      const nextValidation = await getLessonPlanValidation(query);
      if (currentRequest === validationRequestId.current) {
        setValidation(nextValidation);
      }
    } catch (error) {
      if (currentRequest === validationRequestId.current) {
        setValidationError(
          error instanceof Error
            ? error
            : new Error("Failed to load lesson plan validation"),
        );
      }
    } finally {
      if (currentRequest === validationRequestId.current) {
        setValidationLoading(false);
      }
    }
  },
  [],
);
```

Wrap them for callers that need the current selected scope:

```ts
const refreshSummary = useCallback(
  async (
    options: RefreshLessonPlansOptions = {},
    explicitQuery?: LessonPlanSummaryQuery,
  ) => {
    const query = explicitQuery || scopedLessonPlansQuery();
    if (!query) return;
    await refreshSummaryForQuery(query, options);
  },
  [refreshSummaryForQuery, scopedLessonPlansQuery],
);
```

Confirm the existing uncommitted implementation has these boundaries. In the
main loader, the explicit-query pair must receive its already-derived
`summaryQuery`; it must not depend on `scopedLessonPlansQuery` or the public
refresh wrappers. Make changes only if the worktree diff does not match this
contract.

- [ ] **Step 4: Run the hook test and verify one request set**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx
```

Expected: PASS, including existing stale-response and scope-readiness tests.

- [ ] **Step 5: Commit the isolated request-stability repair**

```powershell
git add -- src/features/academics/lesson-plans/hooks/useLessonPlansData.ts src/features/academics/lesson-plans/hooks/__tests__/useLessonPlansData.test.tsx
git commit -m "fix: stabilize lesson plan scope requests"
```

### Task 2: Model the timetable dashboard backend response

**Files:**
- Modify: `src/features/academics/timetable/services/timetableApiTypes.ts`
- Modify: `src/features/academics/timetable/services/timetableApiAdapter.ts`
- Test: `src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts`

**Interfaces:**
- Produces: `TimetableDashboardAllResponseDto` with `items: TimetableDashboardItemDto[]`.
- Produces: `getDashboardTimetable(params): Promise<TimetableDashboardAllResponseDto>`.
- Preserves: existing `DashboardTimetableParams` query fields `termId`, optional `gradeId`, and optional `classroomId`.

- [ ] **Step 1: Update the adapter test to assert grouped dashboard data**

Mock `/academics/timetable/all` with:

```ts
const dashboardResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  publishedAt: null,
  isPublished: false,
  items: [
    {
      classroomId: "classroom-1",
      classroom: { id: "classroom-1", nameAr: "الفصل", nameEn: "Class A" },
      gradeId: "grade-1",
      grade: { id: "grade-1", nameAr: "الصف", nameEn: "Grade 1" },
      configs: [],
      periods: [],
      entries: [],
    },
  ],
};
```

Assert that `getDashboardTimetable({ termId: "term-1", classroomId: "classroom-1" })` returns that complete object and does not flatten `items`.

- [ ] **Step 2: Run the adapter test and verify the type/shape mismatch**

Run:

```powershell
npm run test:run -- src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts
```

Expected before implementation: the current flat `ListResponse<BackendTimetableEntryDto>` contract does not represent the grouped response.

- [ ] **Step 3: Add exact dashboard DTOs**

Add these interfaces to `timetableApiTypes.ts`:

```ts
export interface TimetableDashboardConfigSummaryDto {
  id: string;
  name: string;
  scopeType: string;
  scopeKey: string;
  status: string;
  activeDays: number[];
}

export interface TimetableDashboardItemDto {
  classroomId: string;
  classroom: { id: string; nameAr: string; nameEn: string };
  gradeId: string;
  grade: { id: string; nameAr: string; nameEn: string };
  configs: TimetableDashboardConfigSummaryDto[];
  periods: BackendTimetablePeriodDto[];
  entries: BackendTimetableEntryDto[];
}

export interface TimetableDashboardAllResponseDto {
  termId: string;
  academicYearId: string;
  publishedAt: string | null;
  isPublished: boolean;
  items: TimetableDashboardItemDto[];
}
```

Change `BackendTimetableEntryDto.teacherSubjectAllocationId` from `string | null` to `string`, matching the backend response DTO. Keep selection helpers defensive at runtime by rejecting falsy values rather than widening the API contract.

- [ ] **Step 4: Correct `getDashboardTimetable`**

Replace the flat return type with:

```ts
export const getDashboardTimetable = (
  params: DashboardTimetableParams,
): Promise<TimetableDashboardAllResponseDto> =>
  apiGet<TimetableDashboardAllResponseDto>(
    `${BASE}/all`,
    requestConfig(params),
  ).then(unwrap);
```

Update the existing timetable adapter consumers explicitly:

```ts
const dashboardEntries = (
  response: TimetableDashboardAllResponseDto,
): BackendTimetableEntryDto[] =>
  response.items.flatMap((item) => item.entries);

async fetchTimetable(termId, sectionId, classroomId) {
  const response = await getDashboardTimetable({ termId, classroomId });
  const entries = response.items
    .find((item) => item.classroomId === classroomId)
    ?.entries ?? [];
  return entries.map(mapBackendEntryToUi);
},

async fetchAllTimetablesForTerm(termId) {
  const response = await getDashboardTimetable({ termId });
  return dashboardEntries(response).map(mapBackendEntryToUi);
},
```

- [ ] **Step 5: Run adapter and timetable hook tests**

Run:

```powershell
npm run test:run -- src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
```

Expected: PASS with the real backend response shape.

- [ ] **Step 6: Commit the dashboard contract correction**

```powershell
git add -- src/features/academics/timetable/services/timetableApiTypes.ts src/features/academics/timetable/services/timetableApiAdapter.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
git commit -m "fix: model grouped timetable dashboard response"
```

### Task 3: Resolve timetable metadata and lesson-plan slots independently

**Files:**
- Create: `src/features/academics/lesson-plans/services/lessonPlanTimetable.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts`
- Modify: `src/features/academics/lesson-plans/components/TimetableSlotSelect.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/TimetableSlotSelect.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/AddLessonDialog.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/AddLessonDialog.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/EditLessonPlanItemDialog.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/EditLessonPlanItemDialog.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/MoveLessonDialog.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/MoveLessonDialog.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/LessonPlansBoard.tsx`
- Create: `src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx`
- Modify: `src/features/academics/timetable/services/timetableErrorHandling.ts`
- Modify: `src/features/academics/timetable/services/timetableConfigService.ts`
- Modify: `src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts`
- Modify: `src/features/academics/timetable/hooks/useTimetableData.ts`
- Modify: `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `getConfig`, `getDashboardTimetable`, `ApiError`, `TimetableDashboardAllResponseDto`, and `BackendTimetableEntryDto`.
- Produces: `TimetableSlotScope` and `TimetableConfigLookupParams` from the
  lesson-plan timetable service.
- Produces:
  `timetableConfigCandidates(scope): TimetableConfigLookupParams[]`.
- Produces: shared `isTimetableConfigNotFound(error): boolean` from `timetableErrorHandling.ts`.
- Produces: `dashboardEntriesForScope(response, scope, dayOfWeek): BackendTimetableEntryDto[]`.
- Produces: `useTimetableConfigForScope(scope, enabled)` result
  `{ config, isLoading, error, isMissing }`.
- Preserves: the first successful config as the sole source of `activeDays` and `weekStartDay`.
- Removes: unused `listAvailableTimetableDays`, `responseEntries`,
  `filterEntriesForScope`, and the compatibility-based
  `entryMatchesTimetableScope`.

- [ ] **Step 1: Write pure resolver and entry-selection tests**

Cover these exact assertions:

```ts
expect(timetableConfigCandidates(scope)).toEqual([
  {
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "CLASSROOM",
    gradeId: "grade-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
  },
  {
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "SECTION",
    gradeId: "grade-1",
    sectionId: "section-1",
  },
  {
    academicYearId: "year-1",
    termId: "term-1",
    scopeType: "GRADE",
    gradeId: "grade-1",
  },
  { academicYearId: "year-1", termId: "term-1", scopeType: "TERM" },
]);
```

Also prove in the lesson-plan and timetable service tests:

- exact `academics.timetable.config_not_found` returns `true`;
- another API error with HTTP 404 returns `false`;
- network errors return `false`;
- `fetchTimetableConfig` returns `null` only for the exact config-not-found code;
- `fetchTimetableConfig` propagates hierarchy/entity 404 errors;
- `fetchTimetableConfigs` supplies `gradeId` to section lookups and both
  `gradeId` and `sectionId` to classroom lookups;
- the matching classroom item is selected from `response.items`;
- only the selected day, non-cancelled status, and exact allocation ID survive;
- a missing or different allocation ID is rejected.

- [ ] **Step 2: Run the pure service test and verify missing exports**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts
```

Expected: FAIL because `lessonPlanTimetable.ts` does not exist.

- [ ] **Step 3: Implement the pure timetable helpers**

Define the shared service contracts so the service does not import component
types:

```ts
export interface TimetableSlotScope {
  academicYearId: string;
  termId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  teacherUserId: string;
  subjectId: string;
  teacherSubjectAllocationId: string;
}

export interface TimetableConfigLookupParams {
  academicYearId: string;
  termId: string;
  scopeType: TimetableScopeType;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}
```

Export `TimetableSlotScope` from `TimetableSlotSelect.tsx` as a type re-export
so its existing dialog imports remain valid:

```ts
import type { TimetableSlotScope } from "../services/lessonPlanTimetable";
export type { TimetableSlotScope } from "../services/lessonPlanTimetable";
```

Use exact allocation matching:

```ts
export function dashboardEntriesForScope(
  response: TimetableDashboardAllResponseDto,
  scope: TimetableSlotScope,
  dayOfWeek: number,
): BackendTimetableEntryDto[] {
  const classroom = response.items.find(
    (item) => item.classroomId === scope.classroomId,
  );

  return (classroom?.entries ?? []).filter(
    (entry) =>
      entry.dayOfWeek === dayOfWeek &&
      entry.status.toLowerCase() !== "cancelled" &&
      Boolean(entry.teacherSubjectAllocationId) &&
      entry.teacherSubjectAllocationId === scope.teacherSubjectAllocationId,
  );
}
```

Add the shared guard to `timetableErrorHandling.ts` using the existing API error
type from `@/lib/api-error` and the exact backend code:

```ts
export const isTimetableConfigNotFound = (error: unknown): boolean =>
  isApiError(error) &&
  error.code === "academics.timetable.config_not_found";
```

Replace `error.status === 404` checks in `timetableConfigService.ts` and
`useTimetableData.ts` with this shared guard.

When `fetchTimetableConfigs` constructs exact lookup requests, preserve the
ancestor chain already present in `FetchTimetableConfigsParams`:

```ts
fetchTimetableConfig({
  academicYearId: params.academicYearId,
  termId: params.termId,
  scopeType: "SECTION",
  gradeId: params.gradeId,
  sectionId: params.sectionId,
});

fetchTimetableConfig({
  academicYearId: params.academicYearId,
  termId: params.termId,
  scopeType: "CLASSROOM",
  gradeId: params.gradeId,
  sectionId: params.sectionId,
  classroomId: params.classroomId,
});
```

- [ ] **Step 4: Run the pure tests and verify all branches pass**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts
```

Expected: PASS.

- [ ] **Step 5: Rewrite component tests around independent requests**

Mock `getConfig` for `useTimetableConfigForScope` tests and
`getDashboardTimetable` for selector tests; remove `listEntries` mocks. Add
tests proving:

- config lookup sends the complete ancestor chain;
- exact config-not-found advances to the next candidate;
- generic 404, permission, and network failures stop without broader attempts;
- the config hook exposes non-config-not-found errors to its caller;
- exhausting all four exact config candidates sets `isMissing: true` without
  manufacturing an API error;
- a successful classroom config stops metadata fallback, regardless of whether
  the independent dashboard request has matching entries;
- dashboard entries from multiple configs appear when their allocation matches;
- missing/different allocation entries are absent and cannot call `onChange`;
- dashboard failure renders an error state distinct from `noSlotsMessage`;
- rerendering with a new scope ignores the obsolete config/dashboard response.

Add focused dialog/board assertions that a metadata error renders
`timetableSlotOptions.loadError`, does not render
`validation.no_instructional_days`, and prevents add, edit, move, or drag
mutations. This prevents a permission, hierarchy, or network failure from being
misreported as a school calendar with zero instructional days.

- [ ] **Step 6: Run the component test and verify current behavior fails**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/TimetableSlotSelect.test.tsx
```

Expected before implementation: failures show catch-all fallback, single-config entry loading, and the legacy flat-ID allocation fallback.

- [ ] **Step 7: Update `TimetableSlotSelect` orchestration**

Import:

```ts
import {
  dashboardEntriesForScope,
  timetableConfigCandidates,
} from "../services/lessonPlanTimetable";
import { isTimetableConfigNotFound } from "@/features/academics/timetable/services/timetableErrorHandling";
import {
  getConfig,
  getDashboardTimetable,
} from "@/features/academics/timetable/services/timetableApiAdapter";
```

`useTimetableConfigForScope` owns metadata resolution and must use:

```ts
for (const candidate of timetableConfigCandidates(scope)) {
  try {
    const resolved = await getConfig(candidate);
    if (active) setConfig(resolved);
    return;
  } catch (error) {
    if (!isTimetableConfigNotFound(error)) throw error;
  }
}
```

Catch non-config-not-found errors inside the hook's async effect, store them in
`error`, and return `{ config, isLoading, error, isMissing }`; do not allow an
unhandled rejected promise. Set `isMissing` only after every exact candidate
returns `academics.timetable.config_not_found`. Clear `error` and `isMissing`
when a new enabled scope begins and ignore stale responses after cleanup.

The default `TimetableSlotSelect` component must not call `getConfig`. Its
parent dialog has already resolved metadata to build the valid date list, and a
second config request would reintroduce duplicate calls. Load slots only from
the dashboard:

```ts
const dashboard = await getDashboardTimetable({
  termId: scope.termId,
  classroomId: scope.classroomId,
});
const entries = dashboardEntriesForScope(
  dashboard,
  scope,
  dayOfWeekFromDateOnly(plannedDate),
);
```

The selector maintains only dashboard loading/error state. Reset it on scope
changes, guard every state write with the active request flag, and never
translate an exception into an empty entry array. Delete the unused
single-config `listAvailableTimetableDays` path and compatibility helpers so no
export preserves behavior that the backend would reject.

Add a required `loadErrorMessage: string` prop. Render it as the Select helper
text when the dashboard request has failed; render `noSlotsMessage` only after
the dashboard request succeeded and the filtered entry list is empty:

```tsx
helperText={
  loadError
    ? loadErrorMessage
    : !isLoading && entries.length === 0
      ? noSlotsMessage
      : undefined
}
```

Pass `t("timetableSlotOptions.loadError")` from `AddLessonDialog`,
`EditLessonPlanItemDialog`, and `MoveLessonDialog`. Read `error` from
`useTimetableConfigForScope`; show `loadError` on the planned-day Select and
disable confirmation when that error exists. `LessonPlansBoard` must check the
same hook error before drag/create logic and call
`showError(t("timetableSlotOptions.loadError"))` instead of the
no-instructional-days message.

Read `isMissing` separately and show
`t("timetableSlotOptions.noConfig")`. Reserve
`validation.no_instructional_days` for a successfully resolved config whose
active days do not overlap the selected teaching week. Prevent add, edit, move,
and drag mutations while `isMissing` is true.

Add matching locale values:

```json
{
  "loadError": "Failed to load timetable slots. Please try again.",
  "noConfig": "No timetable configuration exists for this academic scope."
}
```

```json
{
  "loadError": "تعذر تحميل حصص الجدول. يرجى المحاولة مرة أخرى.",
  "noConfig": "لا يوجد إعداد للجدول الدراسي لهذا النطاق الأكاديمي."
}
```

- [ ] **Step 8: Run timetable selector and adapter tests**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/TimetableSlotSelect.test.tsx src/features/academics/lesson-plans/components/__tests__/AddLessonDialog.test.tsx src/features/academics/lesson-plans/components/__tests__/EditLessonPlanItemDialog.test.tsx src/features/academics/lesson-plans/components/__tests__/MoveLessonDialog.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit timetable resolution and slot discovery**

```powershell
git add -- src/features/academics/lesson-plans/services/lessonPlanTimetable.ts src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts src/features/academics/lesson-plans/components/TimetableSlotSelect.tsx src/features/academics/lesson-plans/components/__tests__/TimetableSlotSelect.test.tsx src/features/academics/lesson-plans/components/AddLessonDialog.tsx src/features/academics/lesson-plans/components/__tests__/AddLessonDialog.test.tsx src/features/academics/lesson-plans/components/EditLessonPlanItemDialog.tsx src/features/academics/lesson-plans/components/__tests__/EditLessonPlanItemDialog.test.tsx src/features/academics/lesson-plans/components/MoveLessonDialog.tsx src/features/academics/lesson-plans/components/__tests__/MoveLessonDialog.test.tsx src/features/academics/lesson-plans/components/LessonPlansBoard.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx src/features/academics/timetable/services/timetableErrorHandling.ts src/features/academics/timetable/services/timetableConfigService.ts src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
git add -p -- src/messages/en.json src/messages/ar.json
git diff --cached -- src/messages/en.json src/messages/ar.json
git commit -m "fix: align lesson plan timetable selection"
```

### Task 4: Complete lesson-plan DTO and presentation coverage

**Files:**
- Modify: `src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts`
- Modify: `src/features/academics/lesson-plans/services/lessonPlansMappers.ts`
- Modify: `src/features/academics/lesson-plans/components/lessonPlanBoardActions.ts`
- Modify: `src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx`
- Modify: `src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts`
- Modify: `src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`
- Modify: `src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Produces: `LessonPlanItemStatusDto` with `"rescheduled"` and `LessonPlanItemStatus` with `"RESCHEDULED"`.
- Produces: `LessonPlanAllocationSummaryDto`.
- Produces: `LessonPlanSummary` containing aggregate totals plus `byTeacherAllocation`.
- Preserves: unknown status fallback to `"UNKNOWN"` and unknown validation issue fallback to `issue.message`.

- [ ] **Step 1: Add failing mapper and transition tests**

Assert:

```ts
expect(mapLessonPlanItemDto(itemDto({ status: "rescheduled" })).status)
  .toBe("RESCHEDULED");
expect(lessonPlanItemTransitions("RESCHEDULED")).toEqual([]);
```

Use a populated allocation summary and assert:

```ts
expect(mapLessonPlanSummaryDto(response)).toEqual({
  ...response.summary,
  byTeacherAllocation: response.byTeacherAllocation,
});
```

Keep an unknown value such as `"future_status"` mapped to `"UNKNOWN"`.

- [ ] **Step 2: Run mapper and action tests and verify failures**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx
```

Expected before implementation: `rescheduled` maps to `UNKNOWN`, has no typed translation/style, and allocation details are discarded.

- [ ] **Step 3: Add exact lesson-plan types**

Add:

```ts
export interface LessonPlanSafeTeacherSummaryDto {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}

export interface LessonPlanSubjectSummaryDto extends NamedSummaryDto {
  code: string | null;
  color: string | null;
}

export interface LessonPlanAllocationSummaryDto {
  teacherSubjectAllocationId: string;
  teacher: LessonPlanSafeTeacherSummaryDto;
  subject: LessonPlanSubjectSummaryDto;
  classroom: NamedSummaryDto;
  plannedItemsCount: number;
  completedItemsCount: number;
  unplannedLessonsCount: number;
  coveragePercent: number;
}
```

Change the summary types to:

```ts
export interface LessonPlanSummaryResponseDto {
  termId: string;
  academicYearId: string;
  summary: LessonPlanSummaryTotals;
  byTeacherAllocation: LessonPlanAllocationSummaryDto[];
}

export interface LessonPlanSummary extends LessonPlanSummaryTotals {
  byTeacherAllocation: LessonPlanAllocationSummaryDto[];
}
```

- [ ] **Step 4: Map the added contract fields**

Add `rescheduled: "RESCHEDULED"` to `itemStatuses`, and return:

```ts
export const mapLessonPlanSummaryDto = (
  dto: LessonPlanSummaryResponseDto,
): LessonPlanSummary => ({
  ...dto.summary,
  byTeacherAllocation: dto.byTeacherAllocation.map((allocation) => ({
    ...allocation,
    teacher: { ...allocation.teacher },
    subject: { ...allocation.subject },
    classroom: { ...allocation.classroom },
  })),
});
```

The copies prevent consumers from mutating the transport response while preserving all backend fields.

- [ ] **Step 5: Make `RESCHEDULED` terminal and display-only**

Add `RESCHEDULED: []` to the transition record. Add a localized status label and a neutral terminal style in `LessonPlanItemCard`; do not add a transition action or mutation endpoint.

Add matching locale entries:

```json
{
  "RESCHEDULED": "Rescheduled"
}
```

```json
{
  "RESCHEDULED": "تمت إعادة الجدولة"
}
```

Under `academics.lessonPlans.validationIssues`, add matching English and Arabic keys for:

```text
missing_planned_lesson
missing_planned_date
holiday_planned_item
outside_term_item
duplicate_planned_lesson
```

Extend `LessonPlanValidationPanel.test.tsx` with all five exact backend codes
and one unknown code. Assert the exact codes use localized messages and the
unknown code renders `issue.message`.

- [ ] **Step 6: Run DTO, mapper, card, action, and locale tests**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx
```

Expected: PASS; allocation data survives mapping and `RESCHEDULED` exposes no lifecycle control.

- [ ] **Step 7: Commit lesson-plan contract presentation**

```powershell
git add -- src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts src/features/academics/lesson-plans/services/lessonPlansMappers.ts src/features/academics/lesson-plans/components/lessonPlanBoardActions.ts src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlanValidationPanel.test.tsx
git add -p -- src/messages/en.json src/messages/ar.json
git diff --cached -- src/messages/en.json src/messages/ar.json
git commit -m "fix: complete lesson plan response presentation"
```

### Task 5: Reorder both adjacent lesson-plan items and reconcile

**Files:**
- Modify: `src/features/academics/lesson-plans/components/lessonPlanBoardActions.ts`
- Modify: `src/features/academics/lesson-plans/components/LessonPlansBoard.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`
- Modify: `src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx`

**Interfaces:**
- Produces: `adjacentReorderCommands(plan, itemId, direction)` returning exactly two `ReorderLessonPlanItemCommand` values or an empty array at a boundary.
- Consumes: existing `reorderLessonPlanItem` and `onRefreshPlanDetail(planId, { silent: true })`.
- Preserves: backend non-atomic behavior; frontend never claims rollback.

- [ ] **Step 1: Write a failing pure swap test**

For item orders `10`, `20`, and `30`, assert moving the middle item up returns:

```ts
[
  {
    lessonPlanId: "plan-1",
    itemId: "item-2",
    payload: { sortOrder: 10 },
  },
  {
    lessonPlanId: "plan-1",
    itemId: "item-1",
    payload: { sortOrder: 20 },
  },
]
```

Also assert moving the first item up and the last item down return `[]`.

- [ ] **Step 2: Run the action test and verify the helper is missing**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts
```

Expected: FAIL because `adjacentReorderCommands` is not exported.

- [ ] **Step 3: Implement the pure adjacent swap**

Sort a copied item list by `order`, find the adjacent target, and return commands that exchange the two existing values:

```ts
return [
  {
    lessonPlanId: plan.id,
    itemId: current.id,
    payload: { sortOrder: target.order },
  },
  {
    lessonPlanId: plan.id,
    itemId: target.id,
    payload: { sortOrder: current.order },
  },
];
```

- [ ] **Step 4: Run the pure action test**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write board orchestration tests**

Render the board with two items and mock the service. Prove:

- both IDs are pending while either patch remains unresolved;
- both reorder calls receive swapped values;
- `onRefreshPlanDetail("plan-1", { silent: true })` runs after both promises settle;
- summary/validation refresh runs only after successful detail reconciliation;
- if the second patch rejects, detail still refreshes before `showError`;
- no optimistic `onUpsertPlanItem` result is treated as authoritative.

Use deferred promises so pending state can be asserted before resolution:

```ts
let resolveFirst!: (value: LessonPlanItem) => void;
const first = new Promise<LessonPlanItem>((resolve) => {
  resolveFirst = resolve;
});
```

- [ ] **Step 6: Run the board test and verify single-item behavior fails**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx
```

Expected before implementation: only the selected item is patched and marked pending, and failure does not guarantee reconciliation.

- [ ] **Step 7: Implement two-patch settlement and reconciliation**

Replace the current single request with:

```ts
const commands = adjacentReorderCommands(plan, itemId, direction);
if (commands.length !== 2) return;

const affectedIds = commands.map((command) => command.itemId);
affectedIds.forEach((id) => markItemPending(id, true));
setIsUpdating(true);

const results = await Promise.allSettled(
  commands.map((command) => reorderLessonPlanItem(command)),
);

let refreshError: unknown;
try {
  await onRefreshPlanDetail(plan.id, { silent: true });
} catch (error) {
  refreshError = error;
}

const mutationFailure = results.find(
  (result): result is PromiseRejectedResult => result.status === "rejected",
);
if (mutationFailure) throw mutationFailure.reason;
if (refreshError) throw refreshError;

await onRefreshSummaryAndValidation({ silent: true });
```

Clear both pending IDs in `finally`. Do not update either item from individual mutation responses because one request may have succeeded while the other failed.

- [ ] **Step 8: Run board and action tests**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx
```

Expected: PASS for success, partial failure, pending state, and boundaries.

- [ ] **Step 9: Commit reorder reconciliation**

```powershell
git add -- src/features/academics/lesson-plans/components/lessonPlanBoardActions.ts src/features/academics/lesson-plans/components/LessonPlansBoard.tsx src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlansBoard.test.tsx
git commit -m "fix: reconcile adjacent lesson plan reorder"
```

### Task 6: Split Auto-plan preview and Apply readiness

**Files:**
- Modify: `src/features/academics/lesson-plans/services/autoPlanReadiness.ts`
- Create: `src/features/academics/lesson-plans/services/__tests__/autoPlanReadiness.test.ts`
- Modify: `src/features/academics/lesson-plans/components/AutoPlanDialog.tsx`
- Modify: `src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx`
- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Modify: `src/features/academics/lesson-plans/pages/lessonPlansPageState.ts`
- Modify: `src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Produces: `AutoPlanReadiness` with `canPreview`, `canApply`, `previewBlockingReasons`, `applyBlockingReasons`, and `warnings`.
- Produces: `canOpenAutoPlan({ canManage, canPreview }): boolean` for the page
  header gate.
- Produces: `AutoPlanDialog` props `previewBlockedMessage` and
  `applyBlockedMessage`.
- Consumes: existing `previewAutoPlan` and `applyAutoPlan` functions, which already force `dryRun: true` and `dryRun: false` respectively.
- Preserves: all readiness checks except closed-term writability is Apply-only.

- [ ] **Step 1: Write failing readiness tests**

Create a shared ready input and assert:

```ts
expect(getAutoPlanReadiness({
  ...readyInput,
  termStatus: "closed",
})).toMatchObject({
  canPreview: true,
  canApply: false,
  previewBlockingReasons: [],
  applyBlockingReasons: ["closed_term"],
});
```

Also assert:

- open terms allow both;
- missing curriculum, allocation, classroom, lessons, or date range blocks both;
- known absence of timetable slots blocks both;
- unknown timetable slot availability remains a warning for both.

- [ ] **Step 2: Run the readiness test and verify the old single gate fails**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/autoPlanReadiness.test.ts
```

Expected: FAIL because only `canAutoPlan` and one blocking-reason list exist.

- [ ] **Step 3: Implement separate readiness decisions**

Build common reasons first:

```ts
const previewBlockingReasons = unique(commonBlockingReasons);
const applyBlockingReasons = unique([
  ...commonBlockingReasons,
  ...(termStatus === "closed" ? ["closed_term" as const] : []),
]);

return {
  canPreview: previewBlockingReasons.length === 0,
  canApply: applyBlockingReasons.length === 0,
  previewBlockingReasons,
  applyBlockingReasons,
  warnings,
};
```

Do not retain `closed_term` in the common list.

- [ ] **Step 4: Run readiness tests**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/autoPlanReadiness.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add dialog interaction tests**

Update fixtures to the new readiness shape. Assert:

- a closed-term user can submit Preview and `onPreview` receives the form request;
- Apply remains disabled for the same readiness;
- Apply never calls `onApply` while `canApply` is false;
- open-term preview followed by Apply still calls both handlers;
- preview and Apply show their corresponding first blocked reason.
- the readiness checklist uses preview reasons, while a closed-term Apply-only
  warning remains visible after a successful preview.

- [ ] **Step 6: Run the dialog test and verify the single gate fails**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx
```

Expected before implementation: a closed term cannot preview because the dialog uses `readiness.canAutoPlan` for every action.

- [ ] **Step 7: Wire separate gates through page and dialog**

In the dialog:

```ts
const canPreview = valid && readiness.canPreview;
const canApply = Boolean(preview) && readiness.canApply;
```

Guard handlers independently:

```ts
if (!readiness.canPreview) return;
await onPreview(values);

if (!readiness.canApply) return;
await onApply(values);
```

Replace every `readiness.canAutoPlan` and `readiness.blockingReasons` reference
inside `AutoPlanDialog`. The readiness badge and prerequisite checklist use
`canPreview` and `previewBlockingReasons`. The Preview button uses
`canPreview`; the Apply button uses `canApply` and still requires a completed
preview.

Change the dialog interface from one ambiguous `blockedMessage` to:

```ts
previewBlockedMessage: string;
applyBlockedMessage: string;
```

Use the matching message in each handler guard. After a closed-term preview,
render `applyBlockedMessage` near the disabled Apply action so the user is not
left with an unexplained disabled button.

Add and test this page-state helper:

```ts
export function canOpenAutoPlan(input: {
  canManage: boolean;
  canPreview: boolean;
}): boolean {
  return input.canManage && input.canPreview;
}
```

In `LessonPlansPage`, derive separate first preview/apply reasons and localized
messages. Use `canOpenAutoPlan` for the header gate, which allows a closed-term
manager to open the dialog when preview-ready without weakening `isReadOnly`
for create, edit, reorder, lifecycle, move, or delete operations:

```ts
const canOpenAutoPlanDialog = canOpenAutoPlan({
  canManage: canManageLessonPlans,
  canPreview: autoPlanReadiness.canPreview,
});
```

Pass `previewBlockedMessage` and `applyBlockedMessage` to the dialog.

- [ ] **Step 8: Add matching closed-term preview copy**

Change the existing Apply-only reason to:

```json
{
  "closed_term": "Preview is available, but applying Auto-plan is disabled because the selected term is closed."
}
```

```json
{
  "closed_term": "يمكنك معاينة التخطيط التلقائي، لكن لا يمكن تطبيقه لأن الفصل الدراسي مغلق."
}
```

Keep keys identical between locales. In `backendAutoPlanError`, map backend code
`academics.lesson_plan.closed_term` to `tReadiness("closed_term")`; the current
`closedTerm` lookup does not exist under the Lesson Plans Auto-plan readiness
namespace.

- [ ] **Step 9: Run readiness, dialog, page-state, and mutation tests**

Run:

```powershell
npm run test:run -- src/features/academics/lesson-plans/services/__tests__/autoPlanReadiness.test.ts src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts src/features/academics/lesson-plans/hooks/__tests__/useLessonPlanMutations.test.tsx
```

Expected: PASS, including explicit `dryRun: true` preview and `dryRun: false` Apply payload checks.

- [ ] **Step 10: Commit Auto-plan readiness**

```powershell
git add -- src/features/academics/lesson-plans/services/autoPlanReadiness.ts src/features/academics/lesson-plans/services/__tests__/autoPlanReadiness.test.ts src/features/academics/lesson-plans/components/AutoPlanDialog.tsx src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx src/features/academics/lesson-plans/pages/LessonPlansPage.tsx src/features/academics/lesson-plans/pages/lessonPlansPageState.ts src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts
git add -p -- src/messages/en.json src/messages/ar.json
git diff --cached -- src/messages/en.json src/messages/ar.json
git commit -m "fix: allow closed term auto plan previews"
```

### Task 7: Contract regression and quality verification

**Files:**
- Verify all files changed in Tasks 1-6.
- Review: `docs/superpowers/specs/2026-07-31-lesson-plans-timetable-contract-repair-design.md`

**Interfaces:**
- Verifies: the implemented behavior against the approved design and pinned backend commit.
- Verifies: shared timetable-config changes against Attendance Roll Call,
  Excuses, and Policy consumers.
- Produces: no new feature surface; only corrections found by verification.

- [ ] **Step 1: Run the complete focused Lesson Plans suite**

```powershell
npm run test:run -- src/features/academics/lesson-plans
```

Expected: all Lesson Plans service, hook, component, and page tests pass.

- [ ] **Step 2: Run the focused timetable suite**

```powershell
npm run test:run -- src/features/academics/timetable
```

Expected: all timetable adapter, service, hook, component, and utility tests pass.

- [ ] **Step 3: Run shared Attendance consumer regressions**

Run the shared timetable-config consumer suite first:

```powershell
npm run test:run -- src/features/attendance
```

Expected: all Attendance policy, excuse, roll-call, late/early, absence, and
report tests pass. In particular, config-not-found remains a normal missing
scope only for `academics.timetable.config_not_found`; permission, invalid
hierarchy, and network errors remain visible.

- [ ] **Step 4: Verify locale JSON and recursive key parity**

Run:

```powershell
@'
const fs = require("fs");
const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf8"));
const ar = JSON.parse(fs.readFileSync("src/messages/ar.json", "utf8"));
const flatten = (value, prefix = "", result = []) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      flatten(value[key], prefix ? `${prefix}.${key}` : key, result);
    }
  } else {
    result.push(prefix);
  }
  return result;
};
const enKeys = new Set(flatten(en.academics.lessonPlans));
const arKeys = new Set(flatten(ar.academics.lessonPlans));
const onlyEn = [...enKeys].filter((key) => !arKeys.has(key));
const onlyAr = [...arKeys].filter((key) => !enKeys.has(key));
if (onlyEn.length || onlyAr.length) {
  console.error({ onlyEn, onlyAr });
  process.exit(1);
}
console.log(`Lesson Plans locale parity OK: ${enKeys.size} leaf keys`);
'@ | node
```

Expected: exit code `0` and `Lesson Plans locale parity OK`. Scope the check to
Lesson Plans because unrelated dirty Behavior translation work is outside this
plan and must not be staged or repaired here.

- [ ] **Step 5: Run TypeScript and scoped ESLint**

```powershell
npm run typecheck
npx eslint src/features/academics/lesson-plans src/features/academics/timetable
```

Expected: both commands exit `0`.

- [ ] **Step 6: Check whitespace and review only in-scope diffs**

```powershell
git diff --check
git diff -- src/features/academics/lesson-plans src/features/academics/timetable src/messages/en.json src/messages/ar.json
```

Expected: no whitespace errors; no student-profile or unrelated feature edits appear in the implementation commits.

- [ ] **Step 7: Run required code and test quality gates**

Invoke `clean-code-guard` for changed production code and `test-guard` for changed Vitest/Testing Library tests. Fix concrete findings, rerun the affected focused tests, TypeScript, ESLint, locale parity, and `git diff --check`.

- [ ] **Step 8: Commit verification corrections only if needed**

If Step 7 required changes:

```powershell
git add -- src/features/academics/lesson-plans src/features/academics/timetable
git add -p -- src/messages/en.json src/messages/ar.json
git diff --cached -- src/messages/en.json src/messages/ar.json
git commit -m "test: harden lesson plan contract repairs"
```

If Step 7 required no changes, do not create an empty commit.
