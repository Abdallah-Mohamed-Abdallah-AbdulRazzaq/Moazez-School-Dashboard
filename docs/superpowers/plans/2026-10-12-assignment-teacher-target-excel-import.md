# Assignment Teacher Target Excel Import Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan inline, following the user's existing execution preference. Steps use checkbox syntax for tracking.

**Goal:** Reuse one assignment workbook for selected classes taught by one teacher in one subject.

**Architecture:** Extend batch selection and planning with a teacher scope. Snapshot candidate class IDs when the teacher/subject is chosen and retain explicit exclusions, so refreshed allocations cannot silently add classes. Use existing context reads, eligibility, signatures, payloads, save coordinator, and shared UI controls.

**Tech Stack:** TypeScript, React, Next.js, next-intl, shared UI components, Vitest/Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-assignment-teacher-target-excel-import-design.md`

## Global constraints

- Frontend-only and assignments-only; current workbook and request contracts remain.
- Current year/term, one teacher user ID, one subject; unique class/subject allocation required.
- Eligible classes selected by default; search/retry preserve exclusions.
- Existing permissions, locked saves, partial recovery, and tab behavior remain; no window.focus.
- Shared UI controls with English/Arabic and scoped sizing protections.
- Inline execution on existing branch/PR; focused tests only; no merge/deployment.
- Clean Code Guard on production changes, Test Guard on test changes, Docs Guard on records.

## Task 1: Teacher target planning

**Files:** Modify `src/features/academics/homework/utils/homeworkImportBatch.types.ts`, `homeworkImportBatchTargets.ts`, and `utils/__tests__/homeworkImportBatchTargets.test.ts`. Create `utils/homeworkImportTeacherTargets.ts` for teacher option/candidate derivation.

**Interfaces:** Add this selection variant; consume existing context and `homeworkBatchPlan`, produce the existing plan/result/payload types:

```ts
{ type: "teacher"; teacherUserId: string; classroomIds: string[]; excludedClassroomIds: string[] }
```

`classroomIds` is the snapshot of matching candidate IDs, including ineligible candidates for skip explanations. Exclusions remove deliberate deselections from the plan. Eligibility still determines which rows are checked/created. Derive teacher/subject options from current-term allocations, never names as identity.

- [x] Add planner regressions for teacher/subject/term isolation, duplicate/ambiguous allocations, section-only records, empty/missing classes, exclusions, changed ownership, and new allocation IDs outside the snapshot. Include explicit allowed payload fields.

```ts
const selection = { type: "teacher" as const, teacherUserId: batchIds.teacherA,
  classroomIds: [batchIds.classA, batchIds.classB], excludedClassroomIds: [] };
const plan = homeworkBatchPlan({ ...request(), selection });
expect(plan.rows.find(row => row.classroomId === batchIds.classB)?.eligible).toBe(false);
```

- [x] Run `npx vitest run src/features/academics/homework/utils/__tests__/homeworkImportBatchTargets.test.ts`; confirm new teacher behavior fails before implementation.
- [x] Extend planner IDs to teacher snapshots minus exclusions, preserving existing group scopes. Before returning an eligible row, require the unique allocation's teacher ID to equal the selected teacher. Use existing `missingAllocation` skip message for a stale/foreign teacher allocation; do not substitute ownership.

```ts
if (request.selection.type === "teacher" && allocation.teacherId !== request.selection.teacherUserId)
  return { ...base, eligible: false, skipReason: "missingAllocation" };
```

- [x] Rerun planner tests; review with both guards and commit the independently tested planner/helper changes.

## Task 2: Teacher selection UI and state

**Files:** Modify `hooks/useHomeworkImportBatch.ts`, `components/HomeworkImportBatchTargets.tsx`, and English/Arabic message files. Create `components/HomeworkImportTeacherTargets.tsx` to keep teacher-specific controls focused. Extend `components/__tests__/HomeworkImportBatchPanel.test.tsx`.

**Interfaces:** Teacher component consumes current hook context, subject, selection, and setters. Expose academicYearId/termId for default plan calculation. Helper `teacherClassroomIds(context, termId, subjectId, teacherUserId): string[]` derives unique explicit class IDs. Use `homeworkBatchPlan` for checkbox eligibility, maintaining the planner as source of truth.

- [x] Add component flow assertions: select Teacher's classes, choose teacher, retain valid subject, default selected classes, search/deselect/clear/reselect, no writes after ownership refresh, and selection lock during/after creation. Use current real workbook/context fixture and mock HTTP/window boundaries.
- [x] Run the batch-panel test file to confirm new scope/control behavior fails before implementation.
- [x] Add teacher scope, a shared searchable Select for teacher and subject, shared Input/Checkbox/Button selection controls, and empty states. Reset candidate snapshot/exclusions only on explicit teacher/subject changes. Preserve valid current subject; otherwise set it empty. A clear teacher choice must produce an empty candidate snapshot.

```ts
batch.setSelection({ type: "teacher", teacherUserId,
  classroomIds: teacherClassroomIds(context, termId, subjectId, teacherUserId),
  excludedClassroomIds: [] });
```

- [x] Reuse existing preflight signature and frozen-plan flow; add no effect that auto-selects on context refresh. Add translated Teacher, choose-teacher, empty-teachers/subjects/classes, selection controls, and teacher-help copy. Keep other scopes' controls unchanged.
- [x] Run affected panel/Create/planner focused tests, typecheck, and lint; inspect guards and commit working feature.

## Task 3: Verify and deliver

**Files:** Implementation/spec records and existing draft PR description; external synthetic browser harness if needed.

- [x] Run focused tests for the planner, panel, and three assignment Create/import test files. Run `npm run lint`, `npm run typecheck`, and `npm run build`. No full suite.
- [x] Exercise actual Create page with fixture HTTP/auth/router boundaries and a real workbook; choose teacher scope and deselect a class. Check English/Arabic at 375/768/1024/1440 for dropdown widths, checkbox state, selection counts, and results. Record any live-backend/browser limits honestly.
- [x] Verify changed files and whitespace; record measured results without placeholders. Commit normally, push existing feature branch, update/attach PR #85, and provide handoff with actual SHA/manifest/checks. No merge or deployment.

## Execution record — 2026-10-12

- Teacher snapshots, ownership checks, candidate option helpers, exclusions, controls, and messages implemented. The new teacher mode shares the existing eligibility, preflight, request mapper, and save coordinator. No new API read or write contract, dependency, assessment behavior, or tab focus request was added.
- The first teacher planner regression failed before implementation; the first component regression failed before the new scope was added. Final focused verification covered **41 unique tests across five files**: 21 target-planner tests, 10 batch-panel tests, and 10 tests across three assignment Create/import files. The panel was rerun after adding subject-change/empty-state coverage. All passed. Full tests remain unrun by user preference.
- Full-project lint, typecheck, production build, and whitespace checks passed. The final additional test changes also passed scoped lint. Clean Code Guard, Test Guard, and Docs Guard checks completed.
- The synthetic Chrome harness exercised the actual Create page and real five-question workbook with HTTP/auth/context/router/window fixtures. It selected the teacher scope, chose a teacher with two classes, excluded the second class, created one draft, and retained one editor link at each of eight English/Arabic viewport combinations (375/768/1024/1440). No runtime errors, page overflow, number-field overlap, or dropdown container overflow were observed, including the unlayered content-box simulation. Arabic mobile and English desktop screenshots were inspected.
- Browser QA used synthetic data; authenticated live backend saves and browser tab activation were not verified. The original backend contract audit is retained as historical evidence; this extension adds no backend fields or endpoints.
- Delivery uses normal commits on the existing branch and draft PR #85. The external owner handoff records the final pushed SHA, complete file manifest, and check results. No merge or deployment is performed.
