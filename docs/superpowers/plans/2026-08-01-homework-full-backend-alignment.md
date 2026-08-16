# Homework Full Backend Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make the Homework frontend preserve and enforce the backend assignment, review, and grade-sync contract before requests are sent.

**Architecture:** Normalize backend meaning at the Homework type/mapper boundary, put reusable contract predicates in small pure utilities, and make pages/panels consume those predicates. Keep backend domain errors authoritative, while preventing requests the backend is known to reject and reconciling local state after non-atomic question mutations.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Vitest, Testing Library, MUI.

## Global Constraints

- Frontend only. Do not add, change, or simulate backend routes.
- Treat the approved design at `docs/superpowers/specs/2026-08-01-homework-full-backend-alignment-design.md` as the source of truth.
- Preserve all unrelated dirty-worktree changes. Inspect every touched-file diff before staging; use `git add -p` for files such as `src/messages/en.json` and `src/messages/ar.json` when they contain unrelated hunks.
- Do not convert backend `null` to a numeric sentinel and do not invent rollback after a partially applied mutation.
- Keep backend lifecycle, ownership, concurrency, and cross-resource checks authoritative.
- Add no placeholder, TODO, fake candidate, or hard-coded test-only production behavior.
- Run each red test before implementation, then the focused green test after implementation.
- Backend verification baseline is commit `c2433ac3809225bac59b779fc175efbd0b9f5744` on `Moazez-Backend/main`. Re-run the contract audit before implementation if that branch advances.

## Backend Contract Evidence

- Assignment fields, ranges, and nullability: `src/modules/homework/dto/homework-assignment.dto.ts`.
- Graded-marks, future-due, and publish/due behavior: `src/modules/homework/application/homework-assignments.use-cases.ts`.
- Assignment response hierarchy and nullable marks: `src/modules/homework/presenters/homework-assignment.presenter.ts`.
- Answer score/comment DTO limits and bulk size: `src/modules/homework/dto/homework-answer.dto.ts`.
- Required-answer completion, read-only answer review, rollup, and question-point limits: `src/modules/homework/application/homework-answer-review.use-cases.ts`.
- Final-review DTO and body-only/question-based behavior: `src/modules/homework/dto/homework-submission.dto.ts` and `src/modules/homework/application/homework-submissions.use-cases.ts`.
- Grade-sync permissions: `src/modules/homework/controller/homework-grade-sync.controller.ts`.
- Link, scope, lock, reviewed-target, score, and duplicate-link guards: `src/modules/homework/application/homework-grade-sync.use-cases.ts`.
- Pending-sync response terminology: `src/modules/homework/dto/homework-grade-sync.dto.ts` and `src/modules/homework/presenters/homework-grade-sync.presenter.ts`.
- Assessment discovery permission: `src/modules/grades/assessments/controller/grades-assessments.controller.ts`.

The implementation must keep these gates independent:

```ts
const canViewGradeSyncStatus =
  hasPermission("homework.assignments.view") &&
  hasPermission("grades.items.view");
const canDiscoverAssessments = hasPermission("grades.assessments.view");
const canLinkGradeAssessment =
  hasPermission("homework.assignments.manage") &&
  hasPermission("grades.assessments.manage");
const canSyncGrades =
  hasPermission("homework.assignments.manage") &&
  hasPermission("grades.items.manage");
```

---

### Task 1: Preserve Homework contract semantics in types and mappers

**Files:**
- Modify: `src/features/academics/homework/services/homeworkApi.types.ts`
- Modify: `src/features/academics/homework/services/homeworkMappers.ts`
- Modify: `src/features/academics/curriculum/services/curriculumService.ts`
- Test: `src/features/academics/homework/services/__tests__/homeworkMappers.test.ts`
- Test: `src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts`

- [ ] **Step 1: Add failing mapper and adapter tests**

Cover these exact cases:

```ts
const homework = mapBackendHomeworkAssignmentToUi({
  id: "homework-1",
  title: "Practice",
  totalMarks: null,
  classroom: {
    section: { id: "section-1" },
    grade: { id: "grade-1" },
  },
});
expect(homework.totalMarks).toBeNull();
expect(mapHomeworkUiToBuilderAssignment(homework).maxScore).toBeNull();
expect(homework.classroomSectionId).toBe("section-1");
expect(homework.classroomGradeId).toBe("grade-1");

const question = mapBackendHomeworkQuestionToBuilder({
  questionId: "question-1",
  homeworkId: "homework-1",
  prompt: "Optional prompt",
  type: "short_answer",
  points: 1,
  sortOrder: 0,
  isRequired: false,
});
expect(question.isRequired).toBe(false);
expect(mapBuilderQuestionToHomeworkCreatePayload(question).isRequired).toBe(false);
```

In the adapter test, mock `apiGet` with `syncSummary: { pendingSyncSubmissions: 3 }`, call `homeworkApiAdapter.getGradeSyncStatus("homework-1")`, and assert `status.syncSummary?.pending === 3` and that the result has no `skipped` property.

Also assert that mapping an unrelated edit from an assignment whose `totalMarks` is null does not emit `totalMarks: 0`.

- [ ] **Step 2: Run the red tests**

Run:

```bash
npx vitest run src/features/academics/homework/services/__tests__/homeworkMappers.test.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
```

Expected: failures show null marks becoming zero, `isRequired` being dropped, hierarchy IDs missing, and pending being named skipped.

- [ ] **Step 3: Normalize the public Homework model**

Make these type changes:

```ts
export interface HomeworkAssignmentUiModel {
  totalMarks: number | null;
  classroomSectionId?: string;
  classroomGradeId?: string;
}

export interface HomeworkGradeSyncStatusUiModel {
  syncSummary?: {
    total?: number;
    synced?: number;
    pending?: number;
    failed?: number;
    lastSyncedAt?: string | null;
  };
}
```

Change the shared builder field to `maxScore?: number | null` so null survives in builder state. Add `isRequired?: boolean` to the shared `AssignmentQuestion` type. Keep the new question flag optional there so non-Homework curriculum callers remain source-compatible; Homework mappers must always populate it from the backend and default it to `true` only for genuinely new questions.

- [ ] **Step 4: Correct response and request mapping**

Implement the mapper behavior, including:

```ts
totalMarks: dto.totalMarks ?? null,
isRequired: dto.isRequired,
// New questions only:
isRequired: question.isRequired ?? true,
pending: summary.pendingSyncSubmissions,
```

Retain `classroom.section.id` and the sibling `classroom.grade.id` from the backend response in the UI model. Update assignment request mapping so nullable marks stay null or omitted according to the caller's intent and are never synthesized as zero.

- [ ] **Step 5: Run focused tests and typecheck**

```bash
npx vitest run src/features/academics/homework/services/__tests__/homeworkMappers.test.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
npm run typecheck
```

- [ ] **Step 6: Review and commit only Task 1 hunks**

```bash
git diff -- src/features/academics/homework/services/homeworkApi.types.ts src/features/academics/homework/services/homeworkMappers.ts src/features/academics/curriculum/services/curriculumService.ts src/features/academics/homework/services/__tests__/homeworkMappers.test.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
git add src/features/academics/homework/services/homeworkApi.types.ts src/features/academics/homework/services/homeworkMappers.ts src/features/academics/curriculum/services/curriculumService.ts src/features/academics/homework/services/__tests__/homeworkMappers.test.ts
git add -p src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
git commit -m "fix: preserve homework backend contract values"
```

### Task 2: Centralize assignment validation and nullable input behavior

**Files:**
- Modify: `src/features/academics/homework/utils/homeworkValidation.ts`
- Modify: `src/features/academics/homework/utils/homeworkValidation.test.ts`
- Modify: `src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx`
- Modify: `src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx`
- Modify: `src/features/academics/homework/pages/CreateHomeworkPage.tsx`
- Modify: `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`
- Create: `src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx`
- Create: `src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Replace the incorrect zero-value test with contract tests**

Create a pure input contract so create and edit use the same validator:

```ts
interface HomeworkAssignmentContractInput {
  title: string;
  description?: string | null;
  dueAt: string;
  publishAt?: string | null;
  isGraded: boolean;
  totalMarks?: number | null;
  estimatedMinutes?: number | null;
}

export function validateHomeworkAssignmentContract(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
  now: Date = new Date(),
): ValidationErrors;
```

Tests must reject: blank or over-180 title; over-4,000 description; invalid/past/equal-now due date; due date not later than `publishAt`; missing graded marks; marks below `0.01`; marks with more than two decimals; duration below `1`, non-integer, or non-finite. Tests must accept nullable ungraded marks and nullable duration.

- [ ] **Step 2: Run the validator red test**

```bash
npx vitest run src/features/academics/homework/utils/homeworkValidation.test.ts
```

- [ ] **Step 3: Implement the pure validation rules**

Use integer and decimal predicates that avoid string-format assumptions:

```ts
const hasAtMostTwoDecimals = (value: number) => {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-8;
};
```

Pass a fixed `now` in all date tests.

- [ ] **Step 4: Add failing input component tests**

Assert that nullable marks render as an empty input, the marks input uses `min="0.01"` and `step="0.01"`, estimated minutes uses `min="1"` and `step="1"`, and title/description expose the correct maximum lengths. Assert clearing marks calls the change handler with `null`, not zero.

- [ ] **Step 5: Update shared assignment controls and both submit paths**

Keep numeric input text empty for null values. Invoke `validateHomeworkAssignmentContract` before create and before builder save. Map validation errors into existing field feedback and prevent the API call when invalid. Trim submitted text without changing the user's draft while typing.

Do not add a new grading mode if the existing page already derives it. Feed the actual `isGraded`, `publishAt`, and nullable values into the validator.

- [ ] **Step 6: Add page-level validation regression tests**

Mock `createHomeworkAssignment` and `updateHomeworkAssignment`. For each page, submit at least one invalid contract case and assert the relevant service was not called; then submit one valid boundary case and assert the normalized request. Include a nullable ungraded edit so the builder test proves an unrelated edit does not send zero marks.

- [ ] **Step 7: Add localized validation messages**

Add English and Arabic keys for the limits and date relationships. Reuse existing keys where their meaning is exact. Do not reuse question-title messages for assignment-title failures.

- [ ] **Step 8: Run focused tests and typecheck**

```bash
npx vitest run src/features/academics/homework/utils/homeworkValidation.test.ts src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx
npm run typecheck
```

- [ ] **Step 9: Review and commit Task 2 hunks**

Use `git add -p` for the builder and translation files because they already contain other work.

```bash
git diff --check
git add src/features/academics/homework/utils/homeworkValidation.ts src/features/academics/homework/utils/homeworkValidation.test.ts src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx src/features/academics/homework/pages/CreateHomeworkPage.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx
git add -p src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx
git add -p src/messages/en.json
git add -p src/messages/ar.json
git commit -m "fix: enforce homework assignment constraints"
```

### Task 3: Encode submission-review rules as pure workflow functions

**Files:**
- Create: `src/features/academics/homework/utils/homeworkReview.ts`
- Create: `src/features/academics/homework/utils/homeworkReview.test.ts`

- [ ] **Step 1: Write failing unit tests for reviewability and answer validation**

Cover:

- `submitted` and `late` are potentially reviewable; `reviewed`, draft, and unknown statuses are read-only;
- answer review also requires a `published` or `closed` assignment, matching the answer-review use case;
- final review rejects cancelled or archived assignments and any non-`submitted`/`late` submission;
- score is optional/null or finite, non-negative, no greater than question points, and at most two decimals;
- the prospective answer-score rollup must not exceed nullable assignment total marks;
- optional feedback is trimmed and at most 2,000 characters;
- required completion uses `question.isRequired` and `answer.reviewedAt`, not score presence;
- a reviewed required answer with null score counts complete;
- rollup sums finite answer scores and treats null as zero;
- final note is omitted when blank, otherwise trimmed, non-empty, and at most 2,000 characters;
- question-based finalization fails with unsaved answer changes or incomplete required reviews;
- body-only graded marks are optional, non-negative, at most two decimals, and no greater than total marks;
- body-only ungraded requests omit `awardedMarks`.
- bulk answer-review requests contain 1-100 unique answers; split larger dirty sets into sequential batches of at most 100 while retaining partial-mutation error visibility.

- [ ] **Step 2: Run the red unit test**

```bash
npx vitest run src/features/academics/homework/utils/homeworkReview.test.ts
```

- [ ] **Step 3: Implement narrow pure functions**

Export only the predicates/builders the component needs, for example:

```ts
export function isHomeworkAnswerReviewable(
  assignmentStatus: HomeworkAssignmentStatus,
  submissionStatus: string,
): boolean;
export function isHomeworkFinalReviewable(
  assignmentStatus: HomeworkAssignmentStatus,
  submissionStatus: string,
): boolean;
export function validateHomeworkAnswerDraft(draft: AnswerReviewDraft): AnswerReviewErrors;
export function requiredAnswerReviewsComplete(
  questions: AssignmentQuestion[],
  answers: HomeworkSubmissionAnswerUiModel[],
): boolean;
export function calculateAnswerScoreRollup(answers: HomeworkSubmissionAnswerUiModel[]): number;
export function calculateProspectiveAnswerScoreRollup(
  answers: HomeworkSubmissionAnswerUiModel[],
  drafts: ReadonlyMap<string, AnswerReviewDraft>,
): number;
export function buildHomeworkSubmissionReviewRequest(input: FinalReviewInput):
  | { request: HomeworkSubmissionReviewRequest }
  | { errors: FinalReviewErrors };
```

Keep translations out of the core predicates: return stable error keys and translate at the component boundary.

- [ ] **Step 4: Run the focused test and typecheck**

```bash
npx vitest run src/features/academics/homework/utils/homeworkReview.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit the pure workflow layer**

```bash
git add src/features/academics/homework/utils/homeworkReview.ts src/features/academics/homework/utils/homeworkReview.test.ts
git commit -m "test: define homework review workflow"
```

### Task 4: Make the submission review panel follow backend behavior

**Files:**
- Modify: `src/features/academics/homework/components/HomeworkSubmissionReviewPanel.tsx`
- Modify: `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`
- Create: `src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing panel tests with mocked Homework services and permissions**

Test observable behavior:

- reviewed submissions disable score, feedback, note, final mark, answer-save, bulk-save, and final-review controls;
- invalid answer score/feedback or a prospective rollup above assignment total marks shows field feedback and never calls `reviewHomeworkSubmissionAnswer`;
- question-based total is the answer rollup and is read-only;
- final review is disabled until required answers have `reviewedAt` and while any answer draft is dirty;
- final review does not require note/mark dirtiness and sends no assignment-level mark for question-based work;
- body-only graded work can send a valid manual mark;
- body-only ungraded work omits the mark;
- successful final review immediately locks the returned reviewed submission;
- a bulk answer save of more than 100 dirty answers is split into stable batches and reloads answers if a later batch fails;
- per-submission sync requires both `homework.assignments.manage` and `grades.items.manage`, reviewed status, a present valid score, and a confirmed linked assessment whenever status is observable.

- [ ] **Step 2: Run the red component test**

```bash
npx vitest run src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx
```

- [ ] **Step 3: Integrate the pure review workflow**

Change the panel's marks prop to `number | null` and also pass the assignment's `isGraded` and status values. Derive answer editability and final-review eligibility through the Task 3 predicates. A reviewed submission locks every mutating control; cancelled/archived assignments are also read-only, and answer edits additionally require a published or closed assignment.

Validate each answer before individual or bulk save, including the prospective rollup after applying the affected draft scores. Track unsaved answer changes separately from final note/mark dirtiness. For question-based work, render `calculateAnswerScoreRollup(answers)` as read-only and let the backend calculate the final awarded mark. Send bulk reviews in stable batches of at most 100, matching the backend DTO limit; if a later batch fails, reload answers before reporting that some reviews may already have been applied.

For body-only ungraded work, omit `awardedMarks` from the request. For any blank note, omit `reviewNote`. Allow final review with `{}` when the backend contract allows it.

- [ ] **Step 4: Gate per-submission sync using observable server state**

Fetch grade-sync status only when the user has both status-view permissions. Never add those view permissions to the sync action gate: the backend sync controller requires only the two manage permissions. When status is observable, also require its linked flag before enabling sync:

```ts
const canSyncSubmission =
  hasPermission("homework.assignments.manage") &&
  hasPermission("grades.items.manage") &&
  submission.status.toLowerCase() === "reviewed" &&
  (canViewGradeSyncStatus ? gradeSyncStatus?.linked === true : true);
```

The Homework assignment response does not expose `gradeAssessmentId`, so a user with sync permissions but without the two status-view permissions cannot preflight the linked condition or assessment maximum. In that permission combination, keep the action gated by the backend's exact manage pair, reviewed status, and a present non-negative awarded mark, and let the backend return its authoritative not-linked or score-limit error. When status is observable, also disable sync if the awarded mark exceeds the linked assessment maximum or the Homework total marks. The submission response does not expose the target status, so the backend remains authoritative for its additional `target.status === REVIEWED` invariant. This avoids silently imposing extra permissions or inventing response state. Keep backend errors authoritative if state changes between render and click.

- [ ] **Step 5: Add localized review validation and read-only messages**

Add precise English/Arabic messages for score range/precision, feedback/note limits, required answer reviews, unsaved answer changes, and reviewed read-only state.

- [ ] **Step 6: Run component, utility, and type tests**

```bash
npx vitest run src/features/academics/homework/utils/homeworkReview.test.ts src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx
npm run typecheck
```

- [ ] **Step 7: Review and commit Task 4 hunks**

```bash
git diff --check
git add src/features/academics/homework/components/HomeworkSubmissionReviewPanel.tsx src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx
git add -p src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx
git add -p src/messages/en.json
git add -p src/messages/ar.json
git commit -m "fix: align homework submission review behavior"
```

### Task 5: Discover only backend-compatible grade assessments

**Files:**
- Create: `src/features/academics/homework/services/homeworkGradeSyncCandidates.ts`
- Create: `src/features/academics/homework/services/__tests__/homeworkGradeSyncCandidates.test.ts`
- Modify: `src/features/academics/homework/components/HomeworkGradeSyncPanel.tsx`
- Create: `src/features/academics/homework/components/__tests__/HomeworkGradeSyncPanel.test.tsx`
- Modify: `src/features/academics/homework/services/homeworkApi.types.ts`
- Modify: `src/features/academics/homework/services/homeworkApiAdapter.ts`
- Modify: `src/features/grades/gradebook/types/api.types.ts`
- Modify: `src/features/grades/shared/types.ts`
- Modify: `src/features/grades/gradebook/utils/gradebookMappers.ts`
- Modify: `src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Write failing scope-resolution and candidate tests**

Given a structure tree with `classroom -> section -> grade -> stage`, assert generation of unique `school`, `stage`, `grade`, `section`, and `classroom` scope queries. Assert that every `fetchAssessments` query supplies the same academic year, term, and subject and sets `includeDrafts: true` so the service does not force `PUBLISHED`.

Candidate tests must include draft and published assessments, reject non-`ASSIGNMENT`, locked, wrong-term, wrong-subject, and wrong-placement assessments, and deduplicate repeated IDs from multiple queries.

First add mapper assertions that the existing backend assessment response fields `academicYearId`, `scopeKey`, `stageId`, and `gradeId` survive into the shared `Assessment` model. The backend supplies these values but the current frontend mapper drops them.

- [ ] **Step 2: Run the red service test**

```bash
npx vitest run src/features/academics/homework/services/__tests__/homeworkGradeSyncCandidates.test.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts
```

- [ ] **Step 3: Implement hierarchy resolution and discovery**

Use the existing APIs exactly:

```ts
const tree = await fetchStructureTree(homework.academicYearId, homework.termId);
const results = await Promise.all(
  scopes.map(({ scopeType, scopeId }) =>
    fetchAssessments(homework.academicYearId, homework.termId, {
      scopeType,
      scopeId,
      subjectId: homework.subjectId,
      includeDrafts: true,
    }),
  ),
);
```

Extend `BackendAssessmentResponse` and `Assessment` to retain `academicYearId`, `scopeKey`, `stageId`, and `gradeId`, and map those fields in `mapBackendAssessmentToAssessment`. Resolve the stage through `classroomSectionId` / `classroomGradeId` and the existing `StructureTree`. Filter against the assignment's academic year, term, subject, supported hierarchy placement, `type === "ASSIGNMENT"`, and `!isLocked`; do not filter by approval status. Dedupe by assessment ID while preserving a stable display order.

- [ ] **Step 4: Write failing panel lifecycle and label tests**

Assert:

- link controls are hidden or disabled for cancelled/archived homework;
- an already linked assessment is displayed read-only and cannot be replaced;
- status, discovery, linking, and sync render independently rather than a single status-view early return;
- sync-all uses the exact manage permission pair and does not implicitly require either view permission;
- assessment discovery requires `grades.assessments.view`, matching `GET /grades/assessments`, while the actual link action retains the Homework controller's exact manage pair;
- pending count uses the pending label and never says skipped;
- the linked option remains visible even if no longer present in selectable candidates.

- [ ] **Step 5: Integrate discovery and lifecycle gates**

Replace the single classroom query with the candidate service. Keep status loading gated by the exact status-view pair, candidate discovery gated by `grades.assessments.view`, link mutation gated by the exact assignment/assessment manage pair, and sync mutation gated by the exact assignment/item manage pair. Remove the current whole-panel `AccessDenied` return: each surface must render according to its own endpoint permissions. If a user can link but cannot discover assessments, show a localized explanation instead of issuing a list request the backend will reject.

Derive:

```ts
const canCreateLink =
  canLink &&
  !status?.linked &&
  !["cancelled", "archived"].includes(homework.status.toLowerCase());
```

Do not offer unlink or replacement. Rename the UI model and render path from `skipped` to `pending`, mapping `pendingSyncSubmissions` without changing its meaning.

As with per-submission sync, duplicate-link prevention can be preflighted only when grade-sync status is observable. If the user has the exact link-manage permissions but lacks status-view permissions, keep the link mutation available and let the backend return its authoritative duplicate-link error rather than adding undocumented view permissions to the action.

- [ ] **Step 6: Run focused tests and typecheck**

```bash
npx vitest run src/features/academics/homework/services/__tests__/homeworkGradeSyncCandidates.test.ts src/features/academics/homework/components/__tests__/HomeworkGradeSyncPanel.test.tsx src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts
npm run typecheck
```

- [ ] **Step 7: Review and commit Task 5 hunks**

```bash
git diff --check
git add src/features/academics/homework/services/homeworkGradeSyncCandidates.ts src/features/academics/homework/services/__tests__/homeworkGradeSyncCandidates.test.ts src/features/academics/homework/components/HomeworkGradeSyncPanel.tsx src/features/academics/homework/components/__tests__/HomeworkGradeSyncPanel.test.tsx src/features/academics/homework/services/homeworkApi.types.ts src/features/grades/gradebook/types/api.types.ts src/features/grades/shared/types.ts src/features/grades/gradebook/utils/gradebookMappers.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts
git add -p src/features/academics/homework/services/homeworkApiAdapter.ts
git add -p src/messages/en.json
git add -p src/messages/ar.json
git commit -m "fix: align homework grade sync workflow"
```

### Task 6: Lock down child-list errors and partial-mutation recovery

**Files:**
- Modify: `src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts`
- Modify: `src/features/academics/homework/services/homeworkApiAdapter.ts`
- Modify: `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`
- Modify: `src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Preserve and complete adapter regression tests**

For both questions and attachments, assert successful `{ items: [] }` maps to an empty array. Assert assignment-not-found 404, access/ownership errors, invalid requests, 500 responses, and network failures reject. Do not add an optional-collection 404 exception unless the backend exposes a documented error code for that exact meaning.

- [ ] **Step 2: Run the adapter tests**

```bash
npx vitest run src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
```

Expected: current in-progress adapter changes should pass once their tests are complete; if they do not, fix only the error-propagation path.

- [ ] **Step 3: Add failing builder recovery tests**

Mock a question mutation sequence where the first backend mutation succeeds and a later option/update/reorder mutation fails. Assert a second fetch of assignment, questions, and attachments; assert server state replaces drafts and saved snapshots before the partial-save warning appears.

Add a second test where that recovery reload also fails. It must report both save and reload messages and must not claim rollback.

- [ ] **Step 4: Run the builder red tests**

```bash
npx vitest run src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx
```

- [ ] **Step 5: Complete authoritative recovery**

Factor one `reloadHomeworkBuilder()` path that reloads assignment, questions, and attachments, then resets drafts, deleted IDs, saved snapshots, selection, and dirty state from the returned server data. Call it after any failure once the first question mutation has started. Preserve the original exception for messaging; if reload fails, include both errors.

Do not reload for validation failures before a backend mutation begins.

- [ ] **Step 6: Verify focused recovery behavior**

```bash
npx vitest run src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
npm run typecheck
```

- [ ] **Step 7: Review and commit only recovery hunks**

The adapter, builder, and translations already have in-progress changes. Review their diffs and stage only Homework contract/recovery hunks.

```bash
git diff -- src/features/academics/homework/services/homeworkApiAdapter.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx src/messages/en.json src/messages/ar.json
git add -p src/features/academics/homework/services/homeworkApiAdapter.ts
git add -p src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
git add -p src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx
git add src/features/academics/homework/pages/__tests__/HomeworkAssignmentBuilderPage.test.tsx
git add -p src/messages/en.json
git add -p src/messages/ar.json
git commit -m "fix: reconcile homework partial mutations"
```

### Task 7: Run the complete quality gate and inspect the final diff

**Files:**
- Review: all files changed by Tasks 1-6
- Test: all Homework and affected shared-control tests

- [ ] **Step 1: Run the complete Homework test suite**

```bash
npx vitest run src/features/academics/homework src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts
```

Expected: all tests pass with no unhandled promise rejections or React act warnings introduced by this work.

- [ ] **Step 2: Run static validation**

```bash
npm run typecheck
npx eslint src/features/academics/homework src/features/academics/curriculum/services/curriculumService.ts src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx src/features/grades/gradebook/types/api.types.ts src/features/grades/shared/types.ts src/features/grades/gradebook/utils/gradebookMappers.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts
git diff --check
```

Expected: every command exits zero.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: Next.js production compilation and type validation complete successfully.

- [ ] **Step 4: Perform a contract-focused diff review**

```bash
git status --short
git diff --stat
git diff -- src/features/academics/homework src/features/academics/curriculum/services/curriculumService.ts src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx src/features/grades/gradebook/types/api.types.ts src/features/grades/shared/types.ts src/features/grades/gradebook/utils/gradebookMappers.ts src/features/grades/gradebook/utils/__tests__/gradebookMappers.test.ts src/messages/en.json src/messages/ar.json
```

Verify every approved design bullet is represented by production behavior and a regression test. Confirm no unrelated timetable, profile-correction, teacher, or other user changes are staged.

- [ ] **Step 5: Run placeholder and terminology scans**

```bash
rg -n "TODO|FIXME|placeholder|pendingSyncSubmissions|syncSummary\?\.skipped|allows zero total marks" src/features/academics/homework src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx
```

Expected: no new placeholders, no UI `skipped` mapping for pending submissions, and no obsolete zero-marks test. Backend DTO references to `pendingSyncSubmissions` are allowed.

- [ ] **Step 6: Commit any final test-only cleanup**

If the quality gate required legitimate cleanup, stage only those reviewed hunks and commit:

```bash
git commit -m "test: verify homework backend alignment"
```

Skip this commit when there are no remaining Homework changes.

## Plan Self-Review

- Spec coverage: assignment nullability and limits, review lifecycle and validation, required-answer semantics, body-only behavior, exact permissions, hierarchical assessment discovery, pending terminology, error propagation, and partial-save recovery all have implementation and regression-test tasks.
- Type flow: backend DTOs normalize into nullable, identifier-rich UI models; pure assignment/review/candidate functions consume those models; panels send existing backend request types only.
- Workflow safety: reviewed work is locked, finalization is independent of artificial dirtiness, question totals remain backend-authoritative, link replacement is unavailable, and partial mutations are reconciled from the server.
- Placeholder scan: all examples name real repository services and types; no invented endpoint or unresolved backend error code is required.
- Dirty-worktree safety: mixed files are explicitly staged by hunk and unrelated feature changes remain outside every commit.
