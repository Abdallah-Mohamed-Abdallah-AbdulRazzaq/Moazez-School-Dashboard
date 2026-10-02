# Academic Content Wave 3 Review, Approval, and Preparation Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with review checkpoints.

**Goal:** Add backend-aligned Academic Content review/approval workflows and reusable Teacher Preparation templates, ending at `APPROVED` without publication or notifications.

**Architecture:** Extend the existing `src/features/academic-content` vertical slice. Keep backend DTOs explicit in `contracts.ts`, HTTP calls in `academicContentApi.ts`, orchestration in focused hooks, and rendering in feature components composed from `src/components/ui`. Treat immutable submitted revisions as review truth and templates as client-side presets, not live content relations.

**Tech Stack:** Next.js App Router, React 19, TypeScript, TanStack Query, Axios, React Hook Form/Zod where already used, Vitest, Testing Library, MSW.

**Spec:** `C:/Users/Ahmed Mostafa/Downloads/message (10).txt`

## Global Constraints

- Backend authority is `Moazez-Backend` `origin/main@f86380fffc9f54baccc5253f5e90531b560300fc`.
- Begin implementation only from a clean frontend branch based on the latest `origin/main` that contains Wave 1/2. The audited Wave 1/2 worktree is currently ahead 12 and behind 4; do not silently rebase, reset, cherry-pick, or delete its untracked preview artifacts.
- Approval is available only for `TEACHER_PREPARATION` when the school workflow policy is enabled.
- Content is mutable only in `DRAFT` and `CHANGES_REQUESTED`; every other status is read-only.
- Review decisions operate on the immutable submitted revision. Compare the decision response `revisionId` with the revision displayed by the review page and surface a stale-review error on mismatch.
- Use permissions from the backend (`academics.academic_content.view`, `.manage`, `.approve`, `.settings.manage`), never inferred role names.
- A preparation template is a copy-on-apply preset. Do not persist a `templateId` on Preparation content, invent an apply endpoint/live relation, or add a department field.
- Do not add publication or notification UI/API behavior in this wave.
- Reuse components from `src/components/ui` for all UI work.
- Run `clean-code-guard` after every production-code change and `test-guard` after every test change.
- Ask the user before running the full test suite (`npm run test:run`). Targeted tests, lint, typecheck, and build remain allowed.
- Do not commit runtime artifacts, `.next*`, linked/backed-up `node_modules`, logs, screenshots, or local environment files.

## Source Audit

| Area | Verified backend behavior |
| --- | --- |
| Workflow policy | `GET /academics/academic-content/settings/workflow-policy` requires `.view`; `PATCH` requires `.settings.manage`; absent row reads as disabled. |
| Submission | `POST /academics/academic-content/:contentId/submit` requires `.manage`, accepts an empty body only, supports mutable Teacher Preparation content, requires policy enabled and readiness passing. |
| Review queue | `GET /academics/academic-content/review-queue` requires `.approve`, returns pending Teacher Preparation submissions ordered oldest first and points to the submitted immutable revision. |
| Revision | `GET /academics/academic-content/:contentId/revisions/:revisionId` requires `.view`. |
| Decisions | `POST .../:contentId/approve` accepts an empty body; `POST .../:contentId/request-changes` accepts only a trimmed `note` of 1-4000 characters; both require `.approve`. |
| History | `GET /academics/academic-content/:contentId/approvals` requires `.view` and returns newest round first. |
| Transition result | Returns `contentId`, `contentStatus`, `approvalId`, `approvalStatus`, `revisionId`, `roundNumber`, `submittedAt`, and `decidedAt`. |
| Templates | Read requires `.view`; create/update/soft-delete require `.settings.manage`; list defaults to page 1/limit 50, max 100; search max 120. Active names are unique. |
| Template scope | Stage and subject are independently validated against the same school. No department field exists. Delete returns `{ ok: true }`. |
| Out of scope | No publication endpoint and no notification endpoint exist for this workflow. |

## Frontend Baseline and Gaps

- Wave 1/2 already supplies contracts, API infrastructure, editor/readiness/revisions, shell navigation, library views, forms, and file policy.
- `useAcademicContentEditor.ts` currently marks only `ARCHIVED` read-only; replace this with the backend status policy.
- `LifecycleActions.tsx` currently models only draft/archive behavior; add archive support for `CHANGES_REQUESTED` while keeping delete restricted to `DRAFT`.
- `RevisionDetailModal.tsx` already validates the returned revision id; extract a reusable snapshot renderer for the review screen.
- `TeacherPreparationForm.tsx` owns editable form state; template application belongs there so it can copy fields locally, preserve curriculum/lesson/timetable references, mark the editor dirty, and avoid auto-save.
- `AcademicContentShell.tsx` currently exposes Library, Drafts, Archived, and Settings; add permission-aware Review Queue and Preparation Templates destinations.

## Planned File Map

```text
src/features/academic-content/
├── services/academicContentApi.ts
├── components/
│   ├── workflow/{AcademicContentWorkflowPanel,ApprovalHistoryPanel,WorkflowPolicyCard}.tsx
│   ├── review/{ReviewQueueFilters,ReviewQueueTable,ReviewDecisionActions}.tsx
│   ├── templates/{PreparationTemplateFilters,PreparationTemplateTable,PreparationTemplateForm,PreparationTemplatePicker}.tsx
│   └── editor/{RevisionDetailModal,RevisionSnapshotView}.tsx
├── hooks/{useAcademicContentWorkflow,useAcademicContentReviewQueue,usePreparationTemplates}.ts
├── model/{academicContentPolicy,preparationTemplatePolicy}.ts
├── pages/{AcademicContentReviewQueuePage,AcademicContentReviewPage,PreparationTemplatesPage,WorkflowPolicyPage}.tsx
└── types/contracts.ts
```

## Task 1: Add Exact Workflow and Template Contracts

**Files:**
- Modify: `src/features/academic-content/types/contracts.ts`
- Modify: `src/features/academic-content/services/academicContentApi.ts`
- Test: `src/features/academic-content/services/__tests__/academicContentApi.test.ts`

**Interfaces:**
- Add `AcademicContentApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED"`.
- Add workflow policy, transition response, review queue query/item/page, approval history item/page, preparation-template DTO/input/query/page types using backend field names exactly. The review query includes `academicYearId`, `termId`, `stageId`, `gradeId`, `sectionId`, `classroomId`, `subjectId`, `teacherUserId`, `search`, `page`, and `limit`.
- Add API functions for policy get/update, submit, queue, revision-backed history, approve, request changes, and template CRUD.

**Steps:**

1. Add failing API tests proving exact paths, query serialization, and request bodies:

```ts
expect(request.body).toEqual({});
expect(request.url).toContain("/academics/academic-content/review-queue");
expect(requestChangesBody).toEqual({ note: "Clarify assessment criteria" });
```

2. Run `npm run test:run -- src/features/academic-content/services/__tests__/academicContentApi.test.ts`; expect missing exports/failures.
3. Implement DTOs without widening enums or inventing optional fields.
4. Implement client methods; send `{}` for empty-body transitions and only `{ note: note.trim() }` for request changes.
5. Re-run the targeted test; expect pass.
6. Run `test-guard` on the test diff and `clean-code-guard` on production changes; address all applicable findings.
7. Commit:

```bash
git add src/features/academic-content/types/contracts.ts src/features/academic-content/services/academicContentApi.ts src/features/academic-content/services/__tests__/academicContentApi.test.ts
git commit -m "feat(academic-content): add review and template API contracts"
```

## Task 2: Centralize Mutable-Status and Lifecycle Policy

**Files:**
- Modify: `src/features/academic-content/model/academicContentPolicy.ts`
- Test: `src/features/academic-content/model/__tests__/academicContentPolicy.test.ts`
- Modify: `src/features/academic-content/hooks/useAcademicContentEditor.ts`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentEditor.test.tsx`
- Modify: `src/features/academic-content/components/editor/LifecycleActions.tsx`
- Test: `src/features/academic-content/components/editor/__tests__/LifecycleActions.test.tsx`

**Interfaces:**

```ts
export const isAcademicContentMutableStatus = (
  status: AcademicContentStatus,
): status is "DRAFT" | "CHANGES_REQUESTED";
```

**Steps:**

1. Add failing table-driven policy tests covering every backend status.
2. Add editor tests proving `CHANGES_REQUESTED` is editable and `SUBMITTED`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`, and `CANCELLED` are read-only.
3. Add lifecycle tests proving archive is offered for `DRAFT` and `CHANGES_REQUESTED`, delete only for `DRAFT`, and restore only for `ARCHIVED`.
4. Run:

```bash
npm run test:run -- src/features/academic-content/model/__tests__/academicContentPolicy.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentEditor.test.tsx src/features/academic-content/components/editor/__tests__/LifecycleActions.test.tsx
```

   Expect failures under the current `ARCHIVED`-only rule.
5. Implement the single policy helper and consume it from the editor and lifecycle UI; do not duplicate status arrays.
6. Re-run the targeted tests; expect pass.
7. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/model/academicContentPolicy.ts src/features/academic-content/model/__tests__/academicContentPolicy.test.ts src/features/academic-content/hooks/useAcademicContentEditor.ts src/features/academic-content/hooks/__tests__/useAcademicContentEditor.test.tsx src/features/academic-content/components/editor/LifecycleActions.tsx src/features/academic-content/components/editor/__tests__/LifecycleActions.test.tsx
git commit -m "fix(academic-content): align editing with workflow statuses"
```

## Task 3: Add Workflow Policy Settings

**Files:**
- Create: `src/features/academic-content/components/workflow/WorkflowPolicyCard.tsx`
- Create: `src/features/academic-content/components/workflow/__tests__/WorkflowPolicyCard.test.tsx`
- Create: `src/features/academic-content/pages/WorkflowPolicyPage.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/settings/workflow/page.tsx`
- Modify: `src/features/academic-content/components/AcademicContentShell.tsx`
- Modify: `src/features/academic-content/index.ts`

**Steps:**

1. Write a failing component test for loading, disabled-by-default display, permission-gated toggle, save success, server validation error, and rollback after mutation failure.
2. Run `npm run test:run -- src/features/academic-content/components/workflow/__tests__/WorkflowPolicyCard.test.tsx`; expect missing component failure.
3. Implement with existing `Button`, loading, error, and form controls from `src/components/ui`. Read access uses `.view`; mutation controls require `.settings.manage`.
4. Add the page/route and settings navigation entry. Keep query invalidation scoped to the workflow-policy key.
5. Re-run the targeted test; expect pass.
6. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/components/workflow src/features/academic-content/pages/WorkflowPolicyPage.tsx "src/app/[lang]/(dashboard)/academic-content-hub/settings/workflow/page.tsx" src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/index.ts
git commit -m "feat(academic-content): add approval workflow settings"
```

## Task 4: Add Submit, Resubmit, and Approval History to the Editor

**Files:**
- Create: `src/features/academic-content/hooks/useAcademicContentWorkflow.ts`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentWorkflow.test.tsx`
- Create: `src/features/academic-content/components/workflow/ApprovalHistoryPanel.tsx`
- Create: `src/features/academic-content/components/workflow/AcademicContentWorkflowPanel.tsx`
- Test: `src/features/academic-content/components/workflow/__tests__/AcademicContentWorkflowPanel.test.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Behavior:**
- Show current content status, whether approval is enabled, current round/note, and paginated newest-first approval history. Each round can open its immutable `revisionId` through the existing revision-detail experience.
- Show Submit/Resubmit only with `.manage`, Teacher Preparation, enabled policy, mutable status, passing readiness, and no unsaved edits.
- On success, replace status from the transition response and invalidate content, readiness, approvals, revisions, and review queue keys.
- Never fabricate a pending history item client-side.

**Steps:**

1. Add failing hook tests for submit success, disabled policy, server readiness rejection, invalidation, and no optimistic approval record.
2. Add failing panel/page tests for permissions, readiness blockers, unsaved-change blocker, round history, submit in `DRAFT`, resubmit in `CHANGES_REQUESTED`, and read-only `APPROVED`.
3. Run:

```bash
npm run test:run -- src/features/academic-content/hooks/__tests__/useAcademicContentWorkflow.test.tsx src/features/academic-content/components/workflow/__tests__/AcademicContentWorkflowPanel.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
```

   Expect failures until the workflow hook and panel exist.
4. Implement one orchestration hook around policy/history/submit queries and mutations.
5. Compose the workflow panel into the existing editor; preserve existing save/readiness behavior.
6. Re-run targeted tests; expect pass.
7. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/hooks/useAcademicContentWorkflow.ts src/features/academic-content/hooks/__tests__/useAcademicContentWorkflow.test.tsx src/features/academic-content/components/workflow src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
git commit -m "feat(academic-content): add submission and approval history"
```

## Task 5: Build the Permission-Gated Review Queue

**Files:**
- Create: `src/features/academic-content/hooks/useAcademicContentReviewQueue.ts`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentReviewQueue.test.tsx`
- Create: `src/features/academic-content/components/review/ReviewQueueFilters.tsx`
- Create: `src/features/academic-content/components/review/ReviewQueueTable.tsx`
- Test: `src/features/academic-content/components/review/__tests__/ReviewQueueTable.test.tsx`
- Create: `src/features/academic-content/pages/AcademicContentReviewQueuePage.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/review/page.tsx`
- Modify: `src/features/academic-content/components/AcademicContentShell.tsx`
- Modify: `src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx`

**Steps:**

1. Add failing hook tests for default pagination, filter serialization, stable query keys, and keeping previous data during page/filter transitions.
2. Add failing UI tests for oldest-first rendering, empty/loading/error states, pagination, search, and every backend filter: academic year, term, stage, grade, section, classroom, subject, and teacher. Assert the review link carries both `contentId` and `submittedRevisionId`.
3. Add shell tests proving Review Queue is visible only with `academics.academic_content.approve`.
4. Run the three targeted test files plus the shell test; expect missing implementation failures.
5. Implement filters using existing selector hooks/components and render results with `DataTable`, `FilterPanel`, `Select`, and `EmptyState`.
6. Do not re-sort the backend result unless a documented product sort is added; the server already returns oldest pending submissions first.
7. Re-run targeted tests; expect pass.
8. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/hooks/useAcademicContentReviewQueue.ts src/features/academic-content/hooks/__tests__/useAcademicContentReviewQueue.test.tsx src/features/academic-content/components/review src/features/academic-content/pages/AcademicContentReviewQueuePage.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewQueuePage.test.tsx "src/app/[lang]/(dashboard)/academic-content-hub/review/page.tsx" src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/components/__tests__/AcademicContentShell.test.tsx
git commit -m "feat(academic-content): add review queue"
```

## Task 6: Review the Immutable Revision and Record Decisions

**Files:**
- Create: `src/features/academic-content/components/editor/RevisionSnapshotView.tsx`
- Modify: `src/features/academic-content/components/editor/RevisionDetailModal.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/RevisionDetailModal.test.tsx`
- Create: `src/features/academic-content/components/review/ReviewDecisionActions.tsx`
- Test: `src/features/academic-content/components/review/__tests__/ReviewDecisionActions.test.tsx`
- Create: `src/features/academic-content/pages/AcademicContentReviewPage.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentReviewPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/review/[contentId]/[revisionId]/page.tsx`

**Interfaces:**

```ts
type ReviewDecisionActionsProps = {
  contentId: string;
  reviewedRevisionId: string;
  onDecisionComplete: (result: AcademicContentTransitionResponse) => void;
};
```

**Steps:**

1. Add a failing revision modal test that still renders the extracted snapshot component and rejects mismatched response ids.
2. Add failing decision tests for approve `{}`, trimmed request-change note, empty/over-4000 validation, double-submit prevention, API errors, and permission denial.
3. Add a failing page test that loads the URL revision, never substitutes the live content body, and rejects a successful transition whose `revisionId` differs from `reviewedRevisionId`.
4. Run:

```bash
npm run test:run -- src/features/academic-content/components/editor/__tests__/RevisionDetailModal.test.tsx src/features/academic-content/components/review/__tests__/ReviewDecisionActions.test.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewPage.test.tsx
```

   Expect failures until snapshot extraction and decision handling exist.
5. Extract `RevisionSnapshotView` without changing the existing modal contract.
6. Implement approve and request-changes actions behind `.approve`. Validate the note before mutation and refetch queue/history/content only after the server accepts the decision.
7. Compare transition `revisionId` to the displayed revision before showing success/navigation. On mismatch, show a stale-review error and keep the page recoverable.
8. Re-run targeted tests; expect pass.
9. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/components/editor/RevisionSnapshotView.tsx src/features/academic-content/components/editor/RevisionDetailModal.tsx src/features/academic-content/components/editor/__tests__/RevisionDetailModal.test.tsx src/features/academic-content/components/review src/features/academic-content/pages/AcademicContentReviewPage.tsx src/features/academic-content/pages/__tests__/AcademicContentReviewPage.test.tsx "src/app/[lang]/(dashboard)/academic-content-hub/review"
git commit -m "feat(academic-content): add immutable revision review decisions"
```

## Task 7: Add the Preparation Template Library

**Files:**
- Create: `src/features/academic-content/hooks/usePreparationTemplates.ts`
- Test: `src/features/academic-content/hooks/__tests__/usePreparationTemplates.test.tsx`
- Create: `src/features/academic-content/components/templates/PreparationTemplateFilters.tsx`
- Create: `src/features/academic-content/components/templates/PreparationTemplateTable.tsx`
- Test: `src/features/academic-content/components/templates/__tests__/PreparationTemplateTable.test.tsx`
- Create: `src/features/academic-content/pages/PreparationTemplatesPage.tsx`
- Test: `src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/templates/page.tsx`
- Modify: `src/features/academic-content/components/AcademicContentShell.tsx`
- Modify: `src/features/academic-content/index.ts`

**Steps:**

1. Add failing hook tests for page 1/limit 50 defaults, max limit handling, search/stage/subject filters, stable keys, and soft-delete invalidation. Do not add an `active` filter; soft-deleted templates are excluded server-side.
2. Add failing table/page tests for loading/error/empty/list/pagination states, edit links, soft-delete confirmation, and read-only presentation for users without `.settings.manage`.
3. Run the targeted hook/table/page tests; expect missing implementation failures.
4. Implement with existing `DataTable`, `FilterPanel`, `ConfirmDialog`, and selector components. Keep read access at `.view` and create/edit/delete controls at `.settings.manage`.
5. Add the shell navigation destination without exposing mutation controls to read-only users.
6. Re-run targeted tests; expect pass.
7. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/hooks/usePreparationTemplates.ts src/features/academic-content/hooks/__tests__/usePreparationTemplates.test.tsx src/features/academic-content/components/templates src/features/academic-content/pages/PreparationTemplatesPage.tsx src/features/academic-content/pages/__tests__/PreparationTemplatesPage.test.tsx "src/app/[lang]/(dashboard)/academic-content-hub/templates/page.tsx" src/features/academic-content/components/AcademicContentShell.tsx src/features/academic-content/index.ts
git commit -m "feat(academic-content): add preparation template library"
```

## Task 8: Add Preparation Template Create and Edit Forms

**Files:**
- Create: `src/features/academic-content/components/templates/PreparationTemplateForm.tsx`
- Test: `src/features/academic-content/components/templates/__tests__/PreparationTemplateForm.test.tsx`
- Create: `src/features/academic-content/pages/PreparationTemplateEditorPage.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/templates/new/page.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/templates/[templateId]/edit/page.tsx`
- Modify: `src/features/academic-content/hooks/usePreparationTemplates.ts`

**Backend validation to mirror:**
- `name`: required string, max 180; `description`: nullable, max 1000.
- `stageId` and `subjectId`: nullable UUIDs, independently selected and validated by the backend against the school.
- `topic`: nullable, max 500.
- `objectives`, `learningOutcomes`, `teachingStrategies`, `activities`: at most 50 strings each, each string max 500.
- `resourceNotes`, `assessmentNotes`, `teacherNotes`: nullable, max 4000.
- Do not add `departmentId`. Surface duplicate active-name conflicts from the backend instead of pre-claiming uniqueness.

**Steps:**

1. Add failing form tests for create/edit initialization, trimming nullable strings, all boundary limits, independent stage/subject selectors, list item validation, duplicate-name server errors, submit disabling, and cancel navigation.
2. Run `npm run test:run -- src/features/academic-content/components/templates/__tests__/PreparationTemplateForm.test.tsx`; expect missing component failure.
3. Implement the form from existing `Input`, `TextArea`, `Select`, `OrderedTextList`, `Button`, and shared selector services/components.
4. Add create/update mutations and detail loading to the template hook. Do not optimistically replace server-normalized names or timestamps.
5. Add new/edit pages guarded by `academics.academic_content.settings.manage`.
6. Re-run targeted tests; expect pass.
7. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/components/templates src/features/academic-content/pages/PreparationTemplateEditorPage.tsx "src/app/[lang]/(dashboard)/academic-content-hub/templates" src/features/academic-content/hooks/usePreparationTemplates.ts
git commit -m "feat(academic-content): add preparation template management"
```

## Task 9: Apply a Template as a Local Form Preset

**Files:**
- Create: `src/features/academic-content/model/preparationTemplatePolicy.ts`
- Test: `src/features/academic-content/model/__tests__/preparationTemplatePolicy.test.ts`
- Create: `src/features/academic-content/components/templates/PreparationTemplatePicker.tsx`
- Test: `src/features/academic-content/components/templates/__tests__/PreparationTemplatePicker.test.tsx`
- Modify: `src/features/academic-content/components/editor/details/TeacherPreparationForm.tsx`
- Modify: `src/features/academic-content/components/editor/details/__tests__/TeacherPreparationForm.test.tsx`

**Pure mapping:**

```ts
export function applyPreparationTemplate(
  current: AcademicContentPreparationDetail,
  template: AcademicContentPreparationTemplateDetail,
): AcademicContentPreparationDetail {
  return {
    ...current,
    topic: template.topic,
    objectives: [...template.objectives],
    learningOutcomes: [...template.learningOutcomes],
    teachingStrategies: [...template.teachingStrategies],
    activities: [...template.activities],
    resourceNotes: template.resourceNotes,
    assessmentNotes: template.assessmentNotes,
    teacherNotes: template.teacherNotes,
  };
}
```

**Steps:**

1. Add failing pure tests proving copied arrays do not alias the template and that `curriculumId`, `curriculumUnitId`, `curriculumLessonId`, `lessonPlanId`, `lessonPlanItemId`, and `timetableEntryId` remain unchanged.
2. Add failing picker/form tests for search/select/cancel, stage/subject metadata display, disabled/read-only hiding, local field replacement, dirty callback exactly once, no `onSave` call, and no hidden `templateId` in the save request.
3. Run:

```bash
npm run test:run -- src/features/academic-content/model/__tests__/preparationTemplatePolicy.test.ts src/features/academic-content/components/templates/__tests__/PreparationTemplatePicker.test.tsx src/features/academic-content/components/editor/details/__tests__/TeacherPreparationForm.test.tsx
```

   Expect failures until mapping and picker integration exist.
4. Implement the pure mapper and a picker that reads template detail before application.
5. Apply the mapped values to the form's local state, clear local validation errors, call `onDirty` once, and never auto-save.
6. Re-run targeted tests; expect pass.
7. Run `test-guard` and `clean-code-guard`, then commit:

```bash
git add src/features/academic-content/model/preparationTemplatePolicy.ts src/features/academic-content/model/__tests__/preparationTemplatePolicy.test.ts src/features/academic-content/components/templates/PreparationTemplatePicker.tsx src/features/academic-content/components/templates/__tests__/PreparationTemplatePicker.test.tsx src/features/academic-content/components/editor/details/TeacherPreparationForm.tsx src/features/academic-content/components/editor/details/__tests__/TeacherPreparationForm.test.tsx
git commit -m "feat(academic-content): apply preparation templates locally"
```

## Task 10: Add Bilingual Copy and Workflow Acceptance Coverage

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx`
- Modify: `src/features/academic-content/components/__tests__/AcademicContentAccessGuard.test.tsx`

**Acceptance scenario:**

```text
Teacher edits ready preparation → submits round 1
Reviewer opens submitted immutable revision → requests changes with a note
Teacher sees note/history → edits CHANGES_REQUESTED content → resubmits round 2
Reviewer opens round 2 revision → approves
Teacher sees APPROVED content read-only with both history rounds
```

**Steps:**

1. Add a failing translation parity test covering every new workflow, review, template, validation, loading, empty, error, confirmation, and stale-revision key in both languages.
2. Extend the feature workflow test with the two-round scenario above. Mock backend endpoints at the HTTP boundary and assert the second submitted revision differs from the first.
3. Extend access-guard coverage for `.approve` and `.settings.manage` surfaces, including direct-route denial—not only hidden navigation.
4. Assert that no publish or notification action appears anywhere in the acceptance flow.
5. Run:

```bash
npm run test:run -- src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/features/academic-content/components/__tests__/AcademicContentAccessGuard.test.tsx
```

   Expect initial missing-key/workflow failures, then pass after implementation.
6. Run `test-guard` on all acceptance/translation test changes and `clean-code-guard` on any supporting production changes.
7. Commit:

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx src/features/academic-content/components/__tests__/AcademicContentAccessGuard.test.tsx
git commit -m "test(academic-content): cover review approval workflow"
```

## Task 11: Final Quality Gate and Handoff

**Files:**
- Review every file changed by Tasks 1-10.
- Do not add generated artifacts.

**Steps:**

1. Confirm scope and hygiene:

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

2. Verify there are no new publication/notification calls, role-name checks, apply endpoints, or department fields:

```bash
rg -n "publish|notification|roleName|role ===|apply-template|departmentId" src/features/academic-content "src/app/[lang]/(dashboard)/academic-content-hub"
```

   Inspect every hit; allowed hits must be pre-existing or unrelated. Separately confirm that `templateId` appears only in template routing/API selection and is never included in a Preparation save payload.
3. Run `test-guard` over the complete test diff and `clean-code-guard` over the complete production diff. Resolve all applicable findings and repeat the relevant targeted tests.
4. Run all Wave 3 targeted test files from Tasks 1-10. This is not the repository-wide suite.
5. Run static verification:

```bash
npm run lint -- src/features/academic-content "src/app/[lang]/(dashboard)/academic-content-hub" src/messages/__tests__/academicContentWorkflowTranslations.test.ts
npm run typecheck
npm run build
```

6. Stop and ask the user before `npm run test:run`. Run it only after explicit approval and record the result separately from targeted tests.
7. Manually verify in both English/LTR and Arabic/RTL:
   - policy disabled/enabled;
   - submit and resubmit eligibility;
   - review queue filters and oldest-first order;
   - immutable revision display and both decisions;
   - two-round history and approved read-only state;
   - template CRUD, soft delete, and local apply without auto-save.
8. Report exact commands/results, known environment limitations, and any remaining risks. Do not merge or push unless separately requested.
9. Commit any final reviewed corrections only:

```bash
git add src/features/academic-content "src/app/[lang]/(dashboard)/academic-content-hub" src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
git commit -m "chore(academic-content): finalize review workflow"
```

## Plan Self-Review

- Backend endpoints, DTO boundaries, permissions, lifecycle rules, and response fields were verified directly at `origin/main@f86380fffc9f54baccc5253f5e90531b560300fc`.
- Existing frontend file locations and Wave 1/2 seams were inspected before assigning modifications.
- Every implementation task has a red/green targeted-test loop, a required test/code guard review, and a scoped commit.
- Permission checks cover both navigation visibility and direct-route access.
- The plan preserves immutable revision review, avoids optimistic server history, and handles stale decision responses explicitly.
- Template application copies only supported preparation fields, clones arrays, preserves reference ids, marks dirty once, and never auto-saves.
- Publication, notifications, role-name authorization, template relations, and department scoping remain out of scope.
- Full-suite execution is explicitly gated on user approval.

## Implementation Start Gate

Before Task 1, resolve the frontend base explicitly. The audited `feat/academic-content-center-wave-1-2` worktree contains the required Wave 1/2 implementation but is ahead 12/behind 4 relative to current `origin/main` and contains untracked preview artifacts (`.next.broken-preview/` and `node_modules.link-backup/`). Preserve those artifacts and ask the owner whether to update that branch or start a clean branch after Wave 1/2 is merged. Do not infer the integration strategy.
