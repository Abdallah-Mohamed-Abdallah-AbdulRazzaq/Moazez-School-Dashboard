# Grades Submissions Gap Closure Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the grades submission list and review page cover the important backend contract fields, provide bilingual per-answer and bulk correction, enforce lifecycle rules, and make the submission page the only question-based correction experience.

**Architecture:** Keep transport and contract validation in the submissions service, put deterministic cascade/review/navigation rules in pure utilities, and keep the pages responsible for orchestration and UI state. Gradebook resolves a student submission and navigates to the canonical submission detail route; it no longer owns a second correction form.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, existing `src/components/ui` components, Vitest, Testing Library.

**Spec:** [2026-09-07-grades-submissions-gap-closure-design.md](../specs/2026-09-07-grades-submissions-gap-closure-design.md)

## Global Constraints

- Implement on a dedicated `fix/grades-submissions-gap-closure` branch or worktree after the owner has safely transferred the current uncommitted grades work. Do not build on the unrelated `fix/homework-publication-readiness` branch and do not discard any existing changes.
- Treat `E:/Moazzez/Moazez-Backend-main/src/modules/grades/assessments/dto/grade-submission.dto.ts`, the matching controller, service, and presenter as the contract authority. No backend changes are part of this plan.
- Never read, send, or display `reviewedById` in the UI. Its presence in the raw response type is not authorization to use it.
- Use existing components from `src/components/ui`; do not introduce one-off input, select, textarea, dialog, or button primitives.
- Use focused test commands with explicit file arguments while implementing. Before running `npm run test:run` without file arguments, `npm run test:all`, `npm run build`, or any equivalently broad command, stop and obtain explicit user approval.
- After every production-code task, run the `clean-code-guard` skill and fix actionable findings. After every test-code task, run the `test-guard` skill and fix actionable findings.
- Each commit below is optional until the work is isolated on the correct branch. Do not commit from the current dirty, unrelated branch.

---

## Task 1: Add deterministic cascading submission filters

**Files:**
- Create: `src/features/grades/submissions/utils/submissionFilters.ts`
- Create: `src/features/grades/submissions/utils/__tests__/submissionFilters.test.ts`
- Modify: `src/features/grades/submissions/types.ts`

- [ ] **Step 1: Write failing cascade tests**

Cover these rules with plain data fixtures using `ScopeEntityOption`:

```ts
expect(getSubmissionSections(sections, "grade-a").map(({ id }) => id))
  .toEqual(["section-a"]);
expect(getSubmissionClassrooms(classrooms, "section-a").map(({ id }) => id))
  .toEqual(["classroom-a"]);
expect(changeSubmissionGrade(current, "grade-b")).toEqual({
  gradeId: "grade-b",
  sectionId: "",
  classroomId: "",
});
expect(changeSubmissionSection(current, "section-b")).toEqual({
  ...current,
  sectionId: "section-b",
  classroomId: "",
});
```

Also verify that `toSubmissionListFilters` omits empty IDs and retains `status` and trimmed `search`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```powershell
& { npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionFilters.test.ts }
```

Expected: failure because the utility does not exist.

- [ ] **Step 3: Implement the pure filter model**

Add these public interfaces/functions:

```ts
export interface SubmissionScopeSelection {
  gradeId: string;
  sectionId: string;
  classroomId: string;
}

export function getSubmissionSections(
  sections: ScopeEntityOption[],
  gradeId: string,
): ScopeEntityOption[];

export function getSubmissionClassrooms(
  classrooms: ScopeEntityOption[],
  sectionId: string,
): ScopeEntityOption[];

export function changeSubmissionGrade(
  current: SubmissionScopeSelection,
  gradeId: string,
): SubmissionScopeSelection;

export function changeSubmissionSection(
  current: SubmissionScopeSelection,
  sectionId: string,
): SubmissionScopeSelection;

export function toSubmissionListFilters(
  selection: SubmissionScopeSelection,
  status: SubmissionStatus | "",
  search: string,
): SubmissionListFilters;
```

Filter children strictly by `parentId`; changing a parent clears every descendant instead of silently selecting the first child.

- [ ] **Step 4: Run the focused test and guards**

Run the Task 1 test again, then apply `test-guard` to the new test and `clean-code-guard` to the utility/type changes.

- [ ] **Step 5: Commit when on the isolated branch**

```powershell
& { git add -- 'src/features/grades/submissions/types.ts' 'src/features/grades/submissions/utils/submissionFilters.ts' 'src/features/grades/submissions/utils/__tests__/submissionFilters.test.ts'; git commit -m 'feat(grades): add submission scope cascade model' }
```

---

## Task 2: Expose Grade → Section → Classroom on the submissions list

**Files:**
- Modify: `src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx`
- Create: `src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing page behavior tests**

Mock `fetchGradesFiltersData` and `listAssessmentSubmissions`. Verify:

- the three selects use localized labels and the existing UI `Select` component;
- section options are disabled/empty until a grade is chosen;
- classroom options are disabled/empty until a section is chosen;
- changing grade clears section and classroom;
- changing section clears classroom;
- the list request contains only chosen `gradeId`, `sectionId`, and `classroomId` plus status/search;
- a bootstrap/filter-option failure shows a non-blocking warning while the submissions request and table still work.

- [ ] **Step 2: Run the focused page test and confirm it fails**

```powershell
& { npm run test:run -- src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx }
```

- [ ] **Step 3: Load scope options independently from list data**

Use `useSearchParams()` to read the existing `year` and `term` query values. When both exist, call:

```ts
fetchGradesFiltersData(academicYearId, termId)
```

Store `grades`, `sections`, and `classrooms`. If either context ID is absent, or bootstrap fails, leave the three scope selects unavailable and set a translated warning; do not set the fatal list error.

- [ ] **Step 4: Render the cascade and send its filters**

Place the three `Select` controls beside the existing search/status controls using a responsive grid. Build list params through `toSubmissionListFilters`:

```ts
const filters = toSubmissionListFilters(scopeSelection, status, search);
const response = await listAssessmentSubmissions(assessmentId, filters);
```

Keep the list request abort-safe and independent from bootstrap completion. Add a reset button that clears grade, section, classroom, status, and search in one action.

- [ ] **Step 5: Add exact translations**

Under `academics.grades.submissions` add matching English/Arabic keys for `grade`, `section`, `classroom`, `allGrades`, `allSections`, `allClassrooms`, `resetFilters`, and `filterOptionsUnavailable`. Do not reuse unrelated homework or XP messages.

- [ ] **Step 6: Run focused tests and guards**

Run the Task 1 and Task 2 tests together. Apply `test-guard` to the page test and `clean-code-guard` to the page and message usage.

- [ ] **Step 7: Commit when on the isolated branch**

```powershell
& { git add -- 'src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx' 'src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx' 'src/messages/en.json' 'src/messages/ar.json'; git commit -m 'feat(grades): add cascading submission filters' }
```

---

## Task 3: Separate bilingual review drafts from student answer drafts

**Files:**
- Modify: `src/features/grades/submissions/types.ts`
- Modify: `src/features/grades/submissions/utils/submissionAnswerPayload.ts`
- Modify: `src/features/grades/submissions/utils/__tests__/submissionAnswerPayload.test.ts`
- Create: `src/features/grades/submissions/utils/submissionReviewDrafts.ts`
- Create: `src/features/grades/submissions/utils/__tests__/submissionReviewDrafts.test.ts`

- [ ] **Step 1: Write failing review-draft tests**

Test initialization from `BackendSubmissionAnswerResponse`, normalized optional comments, dirty comparison, score bounds using `answer.maxPoints`, both 2,000-character limits, and bulk payload selection:

```ts
expect(createSubmissionReviewDraft(answer)).toEqual({
  awardedPoints: "2",
  reviewerComment: "Good structure",
  reviewerCommentAr: "ترتيب جيد",
});

expect(buildDirtyReviewPayloads(current, initial, answers)).toEqual([
  {
    answerId: "answer-1",
    awardedPoints: 2.5,
    reviewerComment: "Updated",
    reviewerCommentAr: "محدّث",
  },
]);
```

Verify unchanged reviews are excluded and any invalid dirty review prevents a bulk payload from being returned.

- [ ] **Step 2: Run both utility test files and confirm the new tests fail**

```powershell
& { npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionAnswerPayload.test.ts src/features/grades/submissions/utils/__tests__/submissionReviewDrafts.test.ts }
```

- [ ] **Step 3: Narrow `SubmissionAnswerDraft` to student-answer state**

Remove `awardedPoints` and `reviewerComment` from `SubmissionAnswerDraft`; retain only:

```ts
export interface SubmissionAnswerDraft {
  answerText: string;
  selectedOptionIds: string[];
  matchingAnswers: Record<string, string>;
}
```

Update `createSubmissionAnswerDraft` and its tests so answer entry has no correction responsibilities.

- [ ] **Step 4: Implement the review draft contract**

Create:

```ts
export interface SubmissionReviewDraft {
  awardedPoints: string;
  reviewerComment: string;
  reviewerCommentAr: string;
}

export interface SubmissionReviewValidation {
  awardedPoints?: "required" | "invalid" | "out_of_range";
  reviewerComment?: "too_long";
  reviewerCommentAr?: "too_long";
}
```

Export creation, equality/dirty, validation, single-payload, and dirty-bulk-payload helpers. Use `MAX_REVIEWER_COMMENT_LENGTH`; map blank optional comments to `null`; never include `reviewedById`.

- [ ] **Step 5: Run focused tests and guards**

Run both utility tests. Apply `test-guard` to both test files and `clean-code-guard` to types/utilities.

- [ ] **Step 6: Commit when on the isolated branch**

```powershell
& { git add -- 'src/features/grades/submissions/types.ts' 'src/features/grades/submissions/utils/submissionAnswerPayload.ts' 'src/features/grades/submissions/utils/submissionReviewDrafts.ts' 'src/features/grades/submissions/utils/__tests__/submissionAnswerPayload.test.ts' 'src/features/grades/submissions/utils/__tests__/submissionReviewDrafts.test.ts'; git commit -m 'refactor(grades): separate submission review drafts' }
```

---

## Task 4: Build reusable bilingual answer-review controls

**Files:**
- Create: `src/features/grades/submissions/components/SubmissionAnswerReviewFields.tsx`
- Create: `src/features/grades/submissions/components/__tests__/SubmissionAnswerReviewFields.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing component tests**

Render the component in editable and read-only modes. Verify it:

- shows awarded points with `min=0` and the supplied max;
- shows separate optional English and Arabic comment fields, each with `maxLength=2000`;
- reports field-specific validation text;
- emits a complete `SubmissionReviewDraft` through `onChange`;
- disables every field when saving or read-only;
- exposes a per-answer save button only in editable mode, disabled when unchanged or invalid.

- [ ] **Step 2: Run the focused component test and confirm it fails**

```powershell
& { npm run test:run -- src/features/grades/submissions/components/__tests__/SubmissionAnswerReviewFields.test.tsx }
```

- [ ] **Step 3: Implement with UI-folder primitives**

Use the existing `Input`, `TextArea`, and `Button` UI components. Accept this boundary:

```ts
interface SubmissionAnswerReviewFieldsProps {
  draft: SubmissionReviewDraft;
  maxPoints: number;
  validation: SubmissionReviewValidation;
  dirty: boolean;
  readOnly: boolean;
  saving: boolean;
  bulkSaving: boolean;
  onChange: (draft: SubmissionReviewDraft) => void;
  onSave: () => void;
}
```

Keep transport calls out of the component. Use a responsive two-column comment layout and label the fields explicitly as English and Arabic.

- [ ] **Step 4: Add translations**

Add keys for `reviewCommentEn`, `reviewCommentAr`, optional-field help, unsaved/saved indicators, and validation errors. Keep both locale trees structurally identical.

- [ ] **Step 5: Run focused tests and guards**

Run the component and review-draft test files. Apply `test-guard` and `clean-code-guard`.

- [ ] **Step 6: Commit when on the isolated branch**

```powershell
& { git add -- 'src/features/grades/submissions/components/SubmissionAnswerReviewFields.tsx' 'src/features/grades/submissions/components/__tests__/SubmissionAnswerReviewFields.test.tsx' 'src/messages/en.json' 'src/messages/ar.json'; git commit -m 'feat(grades): add bilingual review controls' }
```

---

## Task 5: Complete review, bulk save, finalization, and unsaved-change behavior

**Files:**
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Create: `src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx`
- Modify: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Extend service contract tests first**

Verify `reviewSubmissionAnswers` sends exactly:

```ts
{
  reviews: [{
    answerId: "answer-1",
    awardedPoints: 2.5,
    reviewerComment: "Clear",
    reviewerCommentAr: "واضحة",
  }],
}
```

Also verify the single-review request preserves both comment fields and the transport validator rejects comments over 2,000 characters. The review-draft utility test remains responsible for rejecting scores above the answer maximum because that maximum is page/domain state, not part of the transport payload.

- [ ] **Step 2: Write failing page behavior tests**

Mock permissions and submission services. Cover:

- `in_progress`: answer entry/save/submit only;
- `submitted` with review permission: bilingual review controls, individual save, and save-all;
- save-all sends only dirty valid answer reviews;
- individual and bulk saves disable one another while active;
- failed save preserves drafts and displays the mapped error;
- successful save reloads canonical backend state and resets the initial/current snapshots;
- finalize is disabled while reviews are dirty, invalid, or `pendingCorrectionCount > 0`;
- corrected submissions are read-only and expose sync only with review permission;
- navigating away with dirty review drafts requires confirmation and `beforeunload` is registered only while dirty.

- [ ] **Step 3: Run focused service/page tests and confirm page tests fail**

```powershell
& { npm run test:run -- src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx }
```

- [ ] **Step 4: Introduce separate initial/current review maps**

On load, create `initialReviewDrafts` and `reviewDrafts` keyed by `answer.id`. Keep student answer drafts keyed by `question.id`. Derive:

```ts
const dirtyAnswerIds = getDirtyReviewAnswerIds(reviewDrafts, initialReviewDrafts);
const hasDirtyReviews = dirtyAnswerIds.length > 0;
const hasInvalidDirtyReviews = dirtyAnswerIds.some((answerId) =>
  hasSubmissionReviewErrors(reviewValidationByAnswerId[answerId]),
);
```

Use `answer.maxPoints ?? question.points` for validation and display.

- [ ] **Step 5: Replace inline correction inputs with the reusable component**

Render `SubmissionAnswerReviewFields` only for answers. For submitted reviews, it is editable; for corrected submissions, show the same values read-only. Existing student answer renderers continue to handle all eight question types and do not gain review fields.

- [ ] **Step 6: Implement individual and dirty-only bulk save**

Single save calls `reviewSubmissionAnswer`; bulk save calls `reviewSubmissionAnswers`. Both include `reviewerComment` and `reviewerCommentAr`. Preserve drafts on error. Reload only after success; if a bulk request may have partially applied and reload fails, retain drafts and show the dedicated recovery message with the mapped error/trace identifier when supplied.

- [ ] **Step 7: Make lifecycle blockers visible**

Always render the finalize action when the user has review permission, but disable it unless status is `submitted`, there are no dirty/invalid drafts, and `pendingCorrectionCount === 0`. Show one translated reason near or in the control. Keep submit restricted to complete required answers and sync restricted to `corrected`.

- [ ] **Step 8: Protect dirty review work**

Register `beforeunload` while `hasDirtyReviews`. Route the page’s own back action through the existing `ConfirmDialog`; confirm discards and navigates, cancel stays. Do not attempt to intercept browser history with an unsafe global router patch.

- [ ] **Step 9: Handle stale lifecycle errors**

Use `describeGradesApiError` so mapped message, severity, field/reason, and optional `traceId` remain available. When the mapped key is `submission_already_submitted`, `submission_locked`, `submission_not_submitted`, `review_already_finalized`, or `review_pending_answers`, attempt a detail reload after surfacing the error; if reload succeeds, preserve only drafts that still correspond to editable submitted answers.

- [ ] **Step 10: Run focused tests and guards**

Run the Task 3–5 test files only. Apply `test-guard` to all changed tests and `clean-code-guard` to the page/component/service-facing changes.

- [ ] **Step 11: Commit when on the isolated branch**

```powershell
& { git add -- 'src/features/grades/submissions/pages/GradeSubmissionPage.tsx' 'src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx' 'src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts' 'src/messages/en.json' 'src/messages/ar.json'; git commit -m 'feat(grades): complete submission review workflow' }
```

---

## Task 6: Make the detail page canonical and remove the Gradebook review modal

**Files:**
- Modify: `src/features/grades/submissions/services/gradesSubmissionsService.ts`
- Modify: `src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts`
- Create: `src/features/grades/submissions/utils/submissionNavigation.ts`
- Create: `src/features/grades/submissions/utils/__tests__/submissionNavigation.test.ts`
- Modify: `src/features/grades/submissions/pages/AssessmentSubmissionsPage.tsx`
- Modify: `src/features/grades/submissions/pages/GradeSubmissionPage.tsx`
- Modify: `src/features/grades/shared/pages/GradesWorkspace.tsx`
- Modify: `src/features/grades/gradebook/services/gradesGradebookService.ts`
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/gradebook/utils/gradebookMappers.ts`
- Modify: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`
- Modify: `src/features/grades/shared/types.ts`
- Delete: `src/features/grades/gradebook/components/ReviewAssessmentSubmissionDialog.tsx`

- [ ] **Step 1: Write failing resolve and navigation tests**

Add a submissions service test proving:

```ts
await resolveGradeSubmission("e78bb128-f12e-4a93-8917-b89c37712201", {
  studentId: "6e64d66a-f3df-4ea2-b319-3b966d41993a",
  enrollmentId: "63272e19-dac3-45e4-bf92-07c41e430f91",
});
```

posts to `/grades/assessments/{assessmentId}/submissions/resolve` and returns the backend submission detail response.

Test navigation helpers with an allowlist of `year`, `term`, `scopeType`, `scopeId`, `subjectId`, and `deliveryMode`. Expected routes:

```ts
buildSubmissionDetailHref({
  locale: "ar",
  submissionId: "7d7b8ffd-3c9d-4899-a77a-404aadb7363c",
  source: "gradebook",
  context: new URLSearchParams("year=year-2026&term=term-1&unknown=drop-me"),
});
// /ar/grades/submissions/7d7b8ffd-3c9d-4899-a77a-404aadb7363c?source=gradebook&year=year-2026&term=term-1

buildSubmissionReturnHref({
  locale: "ar",
  source: "assessment-submissions",
  assessmentId: "e78bb128-f12e-4a93-8917-b89c37712201",
  context: new URLSearchParams("year=year-2026&term=term-1"),
});
// /ar/grades/assessments/e78bb128-f12e-4a93-8917-b89c37712201/submissions?year=year-2026&term=term-1
```

Reject/ignore arbitrary paths and unknown query keys; never accept a raw `returnTo` URL.

- [ ] **Step 2: Run focused tests and confirm they fail**

```powershell
& { npm run test:run -- src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts src/features/grades/submissions/utils/__tests__/submissionNavigation.test.ts }
```

- [ ] **Step 3: Add resolve to the submissions service**

Add:

```ts
export interface ResolveGradeSubmissionPayload {
  studentId: string;
  enrollmentId?: string;
}

export async function resolveGradeSubmission(
  assessmentId: string,
  payload: ResolveGradeSubmissionPayload,
): Promise<BackendSubmissionDetailResponse>;
```

Validate UUIDs consistently with the other submissions calls. Use the backend’s full `GradeSubmissionResponseDto` shape rather than the obsolete partial `BackendSubmissionResolveResponse`. Remove `BackendSubmissionResolveResponse` from `api.types.ts` after confirming it has no remaining references.

- [ ] **Step 4: Implement safe route helpers and list-page provenance**

Create `submissionNavigation.ts` with `buildSubmissionDetailHref`, `buildSubmissionReturnHref`, and the explicit context allowlist. Make list rows navigate with `source=assessment-submissions`, `assessmentId`, and allowed current query values.

- [ ] **Step 5: Replace Gradebook modal opening with resolve-and-navigate**

In `GradesWorkspace.openEditGradeDialog`, keep score-only assessments on `EditGradeDialog`. For `QUESTION_BASED`, call `resolveGradeSubmission(assessment.id, { studentId: row.studentId, enrollmentId: row.enrollmentId || undefined })`, then push the canonical detail href with `source=gradebook` and the current allowlisted context. On resolve failure, remain in Gradebook and show the mapped error.

- [ ] **Step 6: Remove the duplicate correction flow**

Delete modal state, saving state, handlers, render block, and imports from `GradesWorkspace`. Delete `ReviewAssessmentSubmissionDialog.tsx`. Remove `fetchAssessmentSubmissionReview` and `saveAssessmentSubmissionCorrection` from `gradesGradebookService.ts`, then remove only the mapper functions, tests, and shared types that become unused. Confirm with:

```powershell
& { rg -n 'ReviewAssessmentSubmissionDialog|fetchAssessmentSubmissionReview|saveAssessmentSubmissionCorrection|AssessmentSubmissionReview|mapSubmissionDetailToReview' src }
```

Expected: no matches.

- [ ] **Step 7: Give the detail page a safe return action**

Read only `source`, `assessmentId`, and allowlisted context values. Use `buildSubmissionReturnHref`; default to the assessment submissions page when an assessment ID is known, otherwise use `/${locale}/grades/gradebook`. Feed the result through the Task 5 unsaved-change confirmation.

- [ ] **Step 8: Run focused tests and guards**

Run the submissions service/navigation/page tests plus `gradebookMappers.test.ts`. Apply `test-guard` to changed tests and `clean-code-guard` to all production deletions/changes.

- [ ] **Step 9: Commit when on the isolated branch**

```powershell
& { git add -A -- 'src/features/grades/submissions' 'src/features/grades/shared/pages/GradesWorkspace.tsx' 'src/features/grades/gradebook/services/gradesGradebookService.ts' 'src/features/grades/gradebook/types/api.types.ts' 'src/features/grades/gradebook/utils/gradebookMappers.ts' 'src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts' 'src/features/grades/gradebook/components/ReviewAssessmentSubmissionDialog.tsx' 'src/features/grades/shared/types.ts'; git commit -m 'refactor(grades): use canonical submission review page' }
```

---

## Task 7: Focused verification and manual UI acceptance

**Files:**
- Verify only; update implementation files if a focused check exposes a defect.

- [ ] **Step 1: Run the complete focused grades-submission test set**

```powershell
& { npm run test:run -- src/features/grades/submissions/utils/__tests__/submissionFilters.test.ts src/features/grades/submissions/utils/__tests__/submissionAnswerPayload.test.ts src/features/grades/submissions/utils/__tests__/submissionReviewDrafts.test.ts src/features/grades/submissions/utils/__tests__/submissionNavigation.test.ts src/features/grades/submissions/components/__tests__/SubmissionAnswerReviewFields.test.tsx src/features/grades/submissions/pages/__tests__/AssessmentSubmissionsPage.test.tsx src/features/grades/submissions/pages/__tests__/GradeSubmissionPage.test.tsx src/features/grades/submissions/services/__tests__/gradesSubmissionsService.test.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts }
```

Expected: all listed files pass.

- [ ] **Step 2: Run targeted static checks**

```powershell
& { npx eslint src/features/grades/submissions src/features/grades/shared/pages/GradesWorkspace.tsx src/features/grades/gradebook/services/gradesGradebookService.ts src/features/grades/gradebook/utils/gradebookMappers.ts }
```

Run the repository typecheck only if it is considered an allowed focused check in the active session; otherwise ask first because it scans the whole project.

- [ ] **Step 3: Perform manual RTL/LTR acceptance**

Using the local app and a real question-based assessment, verify:

1. Submission list cascade, reset, empty states, bootstrap warning, and mobile wrapping in Arabic and English.
2. All eight answer types still render correctly: single choice, multiple choice, true/false, matching, short answer, essay, fill-in-the-blank, and media.
3. English and Arabic review comments can be edited independently; single save and dirty-only save-all behave correctly.
4. Invalid scores and overlong comments show field errors; finalize explains every blocked state.
5. Save failures retain edits; successful saves reload canonical values.
6. Gradebook question-based cells resolve and open the detail page; score-only cells still use the score dialog.
7. Back navigation returns to the correct list/Gradebook context and warns when review edits are dirty.
8. Corrected submissions are read-only and sync remains available only to authorized reviewers.

- [ ] **Step 4: Run final quality gates**

Apply `clean-code-guard` to the complete production diff and `test-guard` to the complete test diff. Resolve every correctness, duplication, contract, and brittle-test finding before handoff.

- [ ] **Step 5: Inspect the scoped diff**

```powershell
& { git diff --check; git status --short; git diff --stat }
```

Confirm the diff contains no unrelated changes, no use of `reviewedById`, and no duplicate review UI.

- [ ] **Step 6: Ask before broad verification**

Stop and request explicit user approval before any of:

```powershell
& { npm run test:run }
& { npm run build }
& { npm run test:all }
```

- [ ] **Step 7: Commit final fixes when on the isolated branch**

If manual/focused verification required fixes, commit only those scoped files:

```powershell
& { git add -- 'src/features/grades/submissions' 'src/features/grades/shared/pages/GradesWorkspace.tsx' 'src/features/grades/gradebook' 'src/features/grades/shared/types.ts' 'src/messages/en.json' 'src/messages/ar.json'; git commit -m 'fix(grades): harden submission review workflow' }
```
