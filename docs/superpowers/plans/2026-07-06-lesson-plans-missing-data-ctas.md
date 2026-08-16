# Lesson Plans Missing-Data CTAs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized, scope-aware navigation buttons for every approved actionable missing-data state on the Lesson Plans page and Auto-plan dialog.

**Architecture:** A pure route builder owns the destination-specific query contracts. A small reusable CTA component maps missing-data states to routes and labels; the Lesson Plans page and Auto-plan backend-error UI consume it without duplicating URL construction.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Vitest, Testing Library.

---

## File structure

- Create `src/features/academics/lesson-plans/components/lessonPlansMissingData.ts`: missing-state types and pure scoped URL builder.
- Create `src/features/academics/lesson-plans/components/LessonPlansMissingDataCta.tsx`: localized CTA rendering and navigation callback.
- Create `src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts`: destination query-contract coverage.
- Create `src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx`: state-to-button behavior coverage.
- Create `src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx`: backend no-slots/no-curriculum CTA regression coverage.
- Modify `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`: render CTAs for missing scope, allocation, curriculum, and lessons.
- Modify `src/features/academics/lesson-plans/components/AutoPlanDialog.tsx`: retain actionable backend failure state and render its CTA.
- Modify `src/messages/en.json` and `src/messages/ar.json`: state-specific CTA labels.

### Task 1: Scoped missing-data route builder

**Files:**
- Create: `src/features/academics/lesson-plans/components/lessonPlansMissingData.ts`
- Test: `src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts`

- [ ] **Step 1: Write the failing route tests**

Create table-driven tests using this complete scope:

```ts
const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  stageId: "stage-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

it.each([
  ["missing-grade", "/en/academics/structure?year=year-1&term=term-1&nodeType=stage&nodeId=stage-1"],
  ["missing-section", "/en/academics/structure?year=year-1&term=term-1&nodeType=grade&nodeId=grade-1"],
  ["missing-classroom", "/en/academics/structure?year=year-1&term=term-1&nodeType=section&nodeId=section-1"],
  ["missing-subject", "/en/academics/subjects?year=year-1&term=term-1&tab=subjects"],
  ["missing-teacher-allocation", "/en/academics/teacher-allocation?year=year-1&term=term-1&tab=matrix&grade=grade-1&section=section-1&classroom=classroom-1&subject=subject-1"],
  ["missing-curriculum", "/en/academics/curriculum?year=year-1&term=term-1&grade=grade-1&subject=subject-1"],
  ["no-curriculum-lessons", "/en/academics/curriculum?year=year-1&term=term-1&grade=grade-1&subject=subject-1"],
  ["missing-timetable-slots", "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1"],
] as const)("builds %s destination", (status, expected) => {
  expect(buildLessonPlansMissingDataHref(status, "en", scope)).toBe(expected);
});
```

Add a second test asserting empty optional IDs are omitted and never serialized as empty strings.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts`

Expected: FAIL because `lessonPlansMissingData` does not exist.

- [ ] **Step 3: Implement the minimal pure route builder**

Define `LessonPlansMissingDataStatus`, `LessonPlansMissingDataScope`, and `buildLessonPlansMissingDataHref`. Use a shared `URLSearchParams`, append `year` and `term` when present, then append only the keys supported by the selected destination. Structure states set `nodeType`/`nodeId` only when their parent ID exists; subject and allocation destinations set their required `tab` value.

```ts
export function buildLessonPlansMissingDataHref(
  status: LessonPlansMissingDataStatus,
  locale: string,
  scope: LessonPlansMissingDataScope,
): string {
  const params = new URLSearchParams();
  setIfPresent(params, "year", scope.academicYearId);
  setIfPresent(params, "term", scope.termId);
  // Switch status, select pathname, and add only destination-supported keys.
  const query = params.toString();
  return `/${locale}${pathname}${query ? `?${query}` : ""}`;
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run the Task 1 command again.

Expected: all route cases PASS.

- [ ] **Step 5: Commit the route unit**

```bash
git add src/features/academics/lesson-plans/components/lessonPlansMissingData.ts src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts
git commit -m "feat: build scoped lesson plan prerequisite routes"
```

### Task 2: Reusable missing-data CTA component

**Files:**
- Create: `src/features/academics/lesson-plans/components/LessonPlansMissingDataCta.tsx`
- Test: `src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing component tests**

Mock `next-intl` to return keys and render the component for every `LessonPlansMissingDataStatus`. Assert the visible label key and navigation target:

```tsx
const onNavigate = vi.fn();
render(
  <LessonPlansMissingDataCta
    status="missing-classroom"
    locale="en"
    scope={scope}
    onNavigate={onNavigate}
  />,
);
await userEvent.click(screen.getByRole("button", { name: "ctas.academicStructure" }));
expect(onNavigate).toHaveBeenCalledWith(
  "/en/academics/structure?year=year-1&term=term-1&nodeType=section&nodeId=section-1",
);
```

Use `it.each` to verify the label mapping: Structure for grade/section/classroom, Subjects for subject, Teacher Allocation for allocation, Curriculum for curriculum/lessons, and Timetable for slots.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- --run src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Add bilingual labels**

Under `academics.lessonPlans.emptyState`, add:

```json
"ctas": {
  "academicStructure": "Go to Academic Structure",
  "subjects": "Go to Subjects",
  "teacherAllocation": "Go to Teacher Allocation",
  "curriculum": "Go to Curriculum",
  "timetable": "Go to Timetable"
}
```

Add equivalent Arabic labels: `الذهاب إلى الهيكل الأكاديمي`, `الذهاب إلى المواد`, `الذهاب إلى توزيع المعلمين`, `الذهاب إلى المنهج`, and `الذهاب إلى الجدول الدراسي`.

- [ ] **Step 4: Implement the component**

Use `useTranslations("academics.lessonPlans.emptyState")`, a total status-to-label map, the Task 1 builder, and the existing `Button` component:

```tsx
const labelKeyByStatus: Record<LessonPlansMissingDataStatus, CtaLabelKey> = {
  "missing-grade": "ctas.academicStructure",
  "missing-section": "ctas.academicStructure",
  "missing-classroom": "ctas.academicStructure",
  "missing-subject": "ctas.subjects",
  "missing-teacher-allocation": "ctas.teacherAllocation",
  "missing-curriculum": "ctas.curriculum",
  "no-curriculum-lessons": "ctas.curriculum",
  "missing-timetable-slots": "ctas.timetable",
};
```

The button calls `onNavigate(buildLessonPlansMissingDataHref(...))`.

- [ ] **Step 5: Run component and route tests**

Run: `npm test -- --run src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the reusable CTA**

```bash
git add src/features/academics/lesson-plans/components/LessonPlansMissingDataCta.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: add lesson plan prerequisite CTA component"
```

### Task 3: Integrate CTAs into Lesson Plans empty states

**Files:**
- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Modify: `src/features/academics/lesson-plans/pages/lessonPlansPageState.ts`
- Test: `src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`

- [ ] **Step 1: Add failing state-to-CTA tests**

Export a pure `missingDataStatusForLessonPlansView` function and test the precedence explicitly:

```ts
it.each([
  ["missing-grade", "missing-grade"],
  ["missing-section", "missing-section"],
  ["missing-classroom", "missing-classroom"],
  ["missing-subject", "missing-subject"],
  ["missing-teacher-allocation", "missing-teacher-allocation"],
  ["missing-curriculum", "missing-curriculum"],
] as const)("maps scope status %s", (scopeStatus, expected) => {
  expect(missingDataStatusForLessonPlansView(scopeStatus, "no-selection")).toBe(expected);
});

expect(missingDataStatusForLessonPlansView("ready", "no-lessons"))
  .toBe("no-curriculum-lessons");
expect(missingDataStatusForLessonPlansView("ready", "no-weeks")).toBeNull();
```

- [ ] **Step 2: Run the page-state test and verify RED**

Run: `npm test -- --run src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`

Expected: FAIL because the mapper is not exported.

- [ ] **Step 3: Implement the pure mapper**

Return approved actionable scope statuses unchanged, map `no-allocation` to `missing-teacher-allocation`, `no-curriculum` to `missing-curriculum`, and `no-lessons` to `no-curriculum-lessons`. Return `null` for loading, selection-only, no-weeks, and ready states.

- [ ] **Step 4: Render the CTA in the page**

Build one memoized scope object from `academicYearId`, `termId`, `selectedStageId`, `selectedGradeId`, `selectedSectionId`, `resolvedClassroomId`, and `selectedSubjectId`. Render `LessonPlansMissingDataCta` under the message in the generic missing-scope branch when the mapper returns a status. Replace both direct Curriculum buttons with the reusable component. Use `onNavigate={router.push}` through a stable callback.

Remove `handleGoToCurriculum` after all call sites are replaced.

- [ ] **Step 5: Run focused Lesson Plans tests**

Run: `npm test -- --run src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts src/features/academics/lesson-plans/components/__tests__/lessonPlansMissingData.test.ts src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit page integration**

```bash
git add src/features/academics/lesson-plans/pages/LessonPlansPage.tsx src/features/academics/lesson-plans/pages/lessonPlansPageState.ts src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts
git commit -m "feat: route lesson plan missing states to setup pages"
```

### Task 4: Add actionable Auto-plan backend-error CTAs

**Files:**
- Modify: `src/features/academics/lesson-plans/components/AutoPlanDialog.tsx`
- Modify: `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- Test: `src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx`

- [ ] **Step 1: Write the failing Auto-plan tests**

Render an open, ready dialog with `onPreview` rejecting an `ApiError` with code `academics.lesson_plan.auto_plan_no_slots`. Click Preview, then assert a Timetable CTA appears and navigates to the scoped timetable URL. Add the paired `auto_plan_no_curriculum` case asserting the Curriculum CTA.

```tsx
expect(await screen.findByRole("button", { name: "ctas.timetable" })).toBeInTheDocument();
await userEvent.click(screen.getByRole("button", { name: "ctas.timetable" }));
expect(onNavigate).toHaveBeenCalledWith(
  "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
);
```

- [ ] **Step 2: Run the Auto-plan test and verify RED**

Run: `npm test -- --run src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx`

Expected: FAIL because backend errors only create a toast and no CTA.

- [ ] **Step 3: Retain actionable backend failure state**

Add `locale`, `scope`, and `onNavigate` props. Add local state typed as `"missing-curriculum" | "missing-timetable-slots" | null`. Clear it whenever the dialog opens or a new run starts. In the catch block, map `auto_plan_no_curriculum` and `auto_plan_no_slots` to those states while preserving the existing translated toast.

- [ ] **Step 4: Render and wire the Auto-plan CTA**

Render `LessonPlansMissingDataCta` below the readiness list when actionable backend failure state exists. Pass the current scope, locale, and navigation callback from `LessonPlansPage.tsx`.

- [ ] **Step 5: Run all focused tests**

Run: `npm test -- --run src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx src/features/academics/lesson-plans/components/__tests__/LessonPlansMissingDataCta.test.tsx src/features/academics/lesson-plans/pages/__tests__/lessonPlansPageState.test.ts`

Expected: PASS with no warnings.

- [ ] **Step 6: Commit Auto-plan integration**

```bash
git add src/features/academics/lesson-plans/components/AutoPlanDialog.tsx src/features/academics/lesson-plans/components/__tests__/AutoPlanDialog.test.tsx src/features/academics/lesson-plans/pages/LessonPlansPage.tsx
git commit -m "feat: add auto-plan prerequisite navigation"
```

### Task 5: Quality gates and final verification

**Files:**
- Review all files changed in Tasks 1-4.

- [ ] **Step 1: Run Lesson Plans tests**

Run: `npm test -- --run src/features/academics/lesson-plans`

Expected: all Lesson Plans tests PASS.

- [ ] **Step 2: Run TypeScript validation**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 3: Run lint on changed source files**

Run: `npx eslint src/features/academics/lesson-plans/components/lessonPlansMissingData.ts src/features/academics/lesson-plans/components/LessonPlansMissingDataCta.tsx src/features/academics/lesson-plans/components/AutoPlanDialog.tsx src/features/academics/lesson-plans/pages/lessonPlansPageState.ts src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`

Expected: exit code 0 with no warnings.

- [ ] **Step 4: Run clean-code and test quality review**

Apply `clean-code-guard` to production changes and `test-guard` to new/changed tests. Correct any concrete findings, then rerun the affected focused tests.

- [ ] **Step 5: Verify repository diff**

Run: `git status --short && git diff --check HEAD~4..HEAD`

Expected: no uncommitted implementation files and no whitespace errors. Preserve unrelated user changes if present.
