# Manual Homework Multiple Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task after explicit implementation authorization. Inline execution is the user's existing preference. Steps use checkbox syntax for tracking. Do not dispatch agents or start implementation as part of this planning request.

**Goal:** Let users author homework questions locally and create separate class drafts using the existing six scopes, while keeping the familiar single-class flow as the default.

**Architecture:** Add an opt-in Create-page authoring panel using the current question editor. Make batch inputs independent of worksheet provenance, and reuse the existing planner and sequential save helper. Keep Excel validation/diagnostics as an adapter and preserve old public helper exports, wire payloads, permission checks and recovery behavior.

**Tech Stack:** Existing Next.js/React/TypeScript, next-intl, shared UI controls, curriculum question editor, current homework API services, Vitest/Testing Library; no new runtime dependency is required by this plan.

**Spec:** `docs/superpowers/specs/2026-10-14-manual-homework-multiple-target-design.md`

## Global constraints

- Frontend-only and assignments-only. No backend, assessment, automatic-correction or deployment changes.
- Planning-only delivery; none of the application/test changes below have been implemented or executed.
- Baseline `3993d13e90b4046a21800738b3b71f2a393134d1`, branch `feat/manual-homework-multi-class-plan`, managed worktree attached to this chat.
- Keep existing first-view fields/defaults, Excel actions, and the single-class **Create draft** path. Add secondary authoring and a visible, unchecked **Assign to multiple classes** choice; no mandatory wizard/tour or default batching.
- Opting into batching before questions exist reveals prerequisites, adds no automatic question and sends no POST. Do not silently fall back to single creation while batch mode is selected.
- One active source: none/manual/Excel. No merging sources or fabricated spreadsheet rows for manual questions. Confirm replacement of pending questions; preserve current metadata until accepted.
- Reuse existing shared UI components and editor defaults for other consumers. New local prompts/choice text start blank. Up to 500 new pre-creation questions; existing saved-editor limits/defaults remain.
- Preserve all six scopes, one subject, teacher ownership/exclusions, final context refresh/signature, freeze/locks, ordered saves, mixed outcomes and recovery links. No automatic retries/rollback or tab-focus requests.
- Clean Code Guard on production changes; Test Guard on test changes; Docs Guard on records. Full tests require new permission; the user chose focused checks only.
- On later authorized implementation, verify the branch/base and any newer merged behavior before proceeding. Read `Must Read Before Push.txt`; use one `& { ... }` PowerShell block per command call. No main edits, history rewrites, merge or deployment.

## File and interface map

New files below are proposed implementation files, not existing APIs:

| File | Responsibility |
| --- | --- |
| `src/features/academics/homework/utils/homeworkQuestionDraft.types.ts` | Source-neutral metadata/question draft, validation context, domain issue/result types. |
| `src/features/academics/homework/utils/homeworkQuestionDraftValidation.ts` | Pure pre-creation model validation, common bounds, order normalization and marks warnings. |
| `src/features/academics/homework/hooks/useHomeworkCreateQuestions.ts` | One active question source, local add/edit/move/delete/selection, disclosure and pending replacement state. |
| `src/features/academics/homework/components/HomeworkQuestionAuthoringPanel.tsx` | Responsive local outline/editor and validation; no server Save button. |
| `src/features/academics/homework/components/HomeworkDraftIssues.tsx` | Render metadata/question issues without worksheet labels. |
| `src/features/academics/homework/utils/__tests__/homeworkQuestionDraftValidation.test.ts` | Real domain boundary/normalization tests. |
| `src/features/academics/homework/components/__tests__/HomeworkQuestionAuthoringPanel.test.tsx` | Real editor typing/selection/reordering and disabled-state behavior. |
| `src/features/academics/homework/pages/__tests__/CreateHomeworkManualQuestions.test.tsx` | Legacy default, manual single/batch, source replacement, guard and recovery integration. |

Modify only the required seams: current Create page, batch hook/panel/types/save service, Excel adapter/model validation seam, shared ordered-save helper, English/Arabic messages, and their existing regression tests. Keep the saved homework builder and shared QuestionEditor/QuestionsOutline behavior intact; compose them without mounting the full saved-assignment layouts/settings/attachments screen on Create.

## Task 1 Source-neutral validation and question preparation

**Files:** create the draft types/validation/test files listed above; modify `src/features/academics/homework/utils/homeworkExcelImport.ts` and the assignment-bound portions of `src/features/academics/shared/excel-import/workbookValidation.ts` only when necessary to share constraints. Preserve assessment rules and spreadsheet conversion behavior.

**Interfaces produced:**

```ts
// homeworkQuestionDraft.types.ts
type HomeworkDraftMetadata = Pick<CreateHomeworkAssignmentRequest,
  "title" | "description" | "mode" | "dueAt" | "isGraded" |
  "totalMarks" | "estimatedMinutes">;
interface HomeworkQuestionDraft {
  metadata: HomeworkDraftMetadata;
  questions: AssignmentQuestion[];
}
interface HomeworkDraftValidationContext {
  now: Date;
  termStart: string;
  termEnd: string;
  publishAt?: string | null;
}
type HomeworkDraftIssue =
  | { scope: "metadata"; field: string; messageKey: string;
      values?: Record<string, string | number> }
  | { scope: "question"; questionId: string; field: string;
      messageKey: string; values?: Record<string, string | number> };
type HomeworkDraftValidation =
  | { kind: "valid"; warnings: HomeworkDraftIssue[] }
  | { kind: "invalid"; issues: HomeworkDraftIssue[] };

// homeworkQuestionDraftValidation.ts
function validateHomeworkQuestionDraft(
  draft: HomeworkQuestionDraft,
  context: HomeworkDraftValidationContext
): HomeworkDraftValidation;
function prepareHomeworkDraftQuestions(
  questions: AssignmentQuestion[]
): AssignmentQuestion[];
```

Required imports: `AssignmentQuestion` from the existing curriculum service; `CreateHomeworkAssignmentRequest` from `homeworkApi.types.ts`. Domain code does not import workbook reader/row constructors. `termStart`/`termEnd` carry existing context for the Excel adapter; do not invent a new assignment due-date-in-term restriction from these fields. Preserve the current metadata defaults at callers: manual form defaults stay as they are, and Excel still normalizes its own defaults.

- [ ] **Step 1 Write boundary regressions using real question models.** Construct questions from current editor defaults with deterministic local IDs, clear/override placeholder fields, and use existing `batchMetadata`/`fixtureContext` for valid metadata/time. The first tests should fail because the proposed validator/preparer do not yet exist.

```ts
it("retains false answers and local order without workbook provenance", () => {
  const question: AssignmentQuestion = {
    ...DEFAULT_NEW_QUESTION, id: "local-7", assignmentId: "local-draft",
    createdAt: "", order: 9, questionType: "TRUE_FALSE", points: 1,
    questionTextAr: "", questionTextEn: "Is 3 even?",
    correctAnswer: false, isRequired: false, options: [],
  };
  const draft = { metadata: batchMetadata, questions: [question] };
  expect(validateHomeworkQuestionDraft(draft, fixtureContext).kind)
    .toBe("valid");
  expect(prepareHomeworkDraftQuestions(draft.questions)[0])
    .toMatchObject({ order: 1, correctAnswer: false, isRequired: false });
  expect(question.order).toBe(9);
});
```

Add parameterized cases: 0/1/500/501 questions; 0/positive/negative/nonfinite/>99999.99/>two-decimal points; prompt/instruction/expected-answer/option text lengths; undefined true/false answer; single choice with 0/1/2 correct options; multi with none/one/many correct; >50 options; unsupported types; text-type choices; forbidden answer fields; dueAt now/past/future and before publishAt; metadata marks/minutes bounds. Marks mismatch must return a warning. The saved editor's validator remains unchanged unless a separately verified shared constraint is behavior-compatible.

- [ ] **Step 2 Run only the new validator test file.** Expected initial failure: missing proposed exports, followed by assertion failures until implemented.

```powershell
& { npx vitest run src/features/academics/homework/utils/__tests__/homeworkQuestionDraftValidation.test.ts; exit $LASTEXITCODE }
```

- [ ] **Step 3 Implement model checks without a workbook.** Reuse `validateHomeworkAssignmentContract` and `validateHomeworkQuestion`; add only the pre-creation constraints they do not enforce. Preserve caller-appropriate metadata field names when converting error dictionaries. Define any shared assignment bounds once and have model/parser consumers use those constants rather than diverging copies. Keep scalar spreadsheet parsing/defaults and physical-row diagnostics in the Excel layer.

```ts
const prepared = questions.map((question, index) => ({
  ...question,
  order: index + 1,
  options: question.options?.map((option, optionIndex) => ({
    ...option, order: optionIndex + 1,
  })),
}));
// The existing API mapper still emits TRUE_FALSE options at orders 0/1.
```

Normalization is immutable; stable local IDs survive editing/reordering but are not API payload fields. Do not silently repair invalid options/answers or clamp points. Compute marks warnings in integer cents with the same policy as Excel. In the Excel adapter, retain raw-input parsing/row validation and delegate common normalized-model checks to this domain boundary. Map resulting question issues back through original question IDs/row numbers, retaining the existing `ImportIssue` sheet/row/field and message/values semantics. Preserve old issue presentation without adding duplicate checks for the same normalized constraint. Keep the current assessment adapter unchanged.

- [ ] **Step 4 Verify new model tests and existing Excel adapter regressions.** Run `homeworkQuestionDraftValidation.test.ts`, `homeworkExcelImport.test.ts`, and the shared workbook validation tests identified by `rg --files src/features/academics/shared/excel-import/__tests__`. Review changed production/tests with their guards, then commit this tested boundary normally.

## Task 2 Generalize the batch input while preserving Excel recovery

**Files:** modify `services/homeworkExcelImportSave.ts`, `services/homeworkImportBatchSave.ts`, `utils/homeworkImportBatch.types.ts`, `hooks/useHomeworkImportBatch.ts`, `components/HomeworkImportBatchPanel.tsx`, existing service/panel tests; create `HomeworkDraftIssues.tsx`.

**Interfaces consumed/produced:** Task 1's draft/context types; add the following batch validation contract in `homeworkImportBatch.types.ts`. It preserves provenance only for error presentation, not planning/saving.

```ts
type HomeworkBatchDraftValidation =
  | { kind: "valid" }
  | { kind: "invalid"; origin: "manual"; issues: HomeworkDraftIssue[] }
  | { kind: "invalid"; origin: "excel"; issues: ImportIssue[] };

interface HomeworkImportBatchPanelProps {
  questionDraft: HomeworkQuestionDraft;
  origin: "none" | "manual" | "excel";
  validateDraft: (draft: HomeworkQuestionDraft,
    context: HomeworkDraftValidationContext) => HomeworkBatchDraftValidation;
  publishAt?: string | null;
  academicYearId: string;
  termId: string;
  termStart: string;
  termEnd: string;
  writable: boolean;
  initialSubjectId?: string;
  initialClassroomId?: string;
  onStateChange: (state: HomeworkBatchPageState) => void;
  onReset: () => void;
}
```

Import `HomeworkBatchPageState` from the existing batch types and `ImportIssue` from the current Excel types; the other produced/consumed types come from Task 1. All current batch callers must be updated in the same tested task so no transitional prop API is left broken.

- [ ] **Step 1 Extend existing batch/service tests for a manual draft with no source property.** Construct it from `batchMetadata` and real questions, use fixture HTTP at `@/lib/api`, and assert one parent per eligible class with distinct accepted allocation IDs. Use the existing mixed-success/partial fixture scenario with manual validation. Assert exact question order, retained known parent ID, continuation, completion and duplicate-tap behavior. Do not mock planner/save helpers.

```ts
const draft: HomeworkQuestionDraft = {
  metadata: batchMetadata, questions: [question],
};
await saveHomeworkImportBatch({
  plan, draft,
  onResult: result => outcomes.push(result),
});
expect(parentCalls.map(([, payload]) => payload.teacherSubjectAllocationId))
  .toEqual([batchIds.allocationA, batchIds.allocationB]);
```

In this example `question` is the real fixture question produced by the test's workbook adapter or Task 1's deterministic model; `plan`, `outcomes` and `parentCalls` come from the existing service test's real planner/API mock setup. Add an empty-question manual case with an eligible target and assert the Create button is disabled and no API writes occur.

- [ ] **Step 2 Run the affected batch service/panel tests and confirm new cases fail before changing the prop/save boundary.** Existing Excel cases should remain baseline regressions throughout.

- [ ] **Step 3 Reuse the existing ordered-save implementation.** Its current request already contains only parent payload plus `AssignmentQuestion[]`. Add source-neutral named exports while keeping original exports/constructor/error name/message/cause/parent-ID/index behavior intact; avoid a second save implementation or unnecessary file renames.

```ts
// Existing helper remains the implementation and compatibility surface.
export { createHomeworkFromImport as createHomeworkWithQuestions };
export { HomeworkImportQuestionSaveError as HomeworkQuestionSaveError };
```

Change `BatchSaveRequest.draft` to `HomeworkQuestionDraft`; use the generic export in the coordinator. Parent payloads remain built by `homeworkBatchPayload`. No new request fields/endpoints, retries or parallel writes. Catch the same error constructor; the alias is the same runtime type.

- [ ] **Step 4 Change batch validation to a concrete caller callback.** Before context refresh, clone `questionDraft`, invoke `validateDraft` with current time/context and stop on invalid. Store the discriminated failure; render `ImportIssues` for Excel or `HomeworkDraftIssues` for manual. Keep source-specific copy appropriate, including empty prerequisites. Preserve `refreshedPlan`, signature comparison, latest permission/context guard, frozen plan, result updates, new-tab attempts, and current lock/finally behavior.

```tsx
<Button disabled={batch.loading || !writable || !batch.eligibleCount
  || questionDraft.questions.length === 0 || batch.notice === "loadError"}
  onClick={() => void batch.start()}>
  {t("create", { count: batch.eligibleCount })}
</Button>
```

Manual validation uses Task 1's result and returns only invalid issue items when needed. The Excel callback validates `{ ...pendingImport, metadata: draft.metadata, questions: draft.questions }` through the existing adapter, retaining its real `source`. No worksheet source is manufactured for manual/none drafts. A callback's valid result does not rewrite questions; normalize the cloned question order through `prepareHomeworkDraftQuestions` before saving.

- [ ] **Step 5 Rerun existing ordered-save, batch-save, planner, panel, Create batch and Excel/assessment import tests.** Run typecheck because the batch props are changing. Review guards and commit once both input sources pass.

## Task 3 Local authoring state and editor composition

**Files:** create `useHomeworkCreateQuestions.ts`, `HomeworkQuestionAuthoringPanel.tsx`, and its component tests. Reuse `QuestionEditor`, `QuestionOutlineItem`/`QuestionsOutline`, Button, Input, ConfirmDialog and current theme; do not alter their global defaults or mount saved-assignment full layouts.

**Interfaces produced:**

```ts
type HomeworkQuestionContent =
  | { kind: "none" }
  | { kind: "manual"; questions: AssignmentQuestion[];
      selectedQuestionId: string | null }
  | { kind: "excel"; imported: HomeworkImport };

// Hook owns content and disclosure/replacement state; page owns metadata.
declare function useHomeworkCreateQuestions(request: {
  locked: boolean;
  onExcelAccepted: (imported: HomeworkImport) => void;
}): {
  content: HomeworkQuestionContent;
  editorOpen: boolean;
  pendingReplacement: HomeworkImport | "manual" | null;
  requestManualAuthoring(): void;
  setEditorOpen(open: boolean): void;
  requestExcelImport(imported: HomeworkImport): void;
  acceptReplacement(): void;
  cancelReplacement(): void;
  addQuestion(): void;
  selectQuestion(id: string): void;
  updateQuestion(id: string, updates: Partial<AssignmentQuestion>): void;
  deleteQuestion(id: string): void;
  moveQuestion(id: string, direction: "up" | "down"): void;
  reset(): void;
};
```

`onExcelAccepted` lets the page apply imported metadata only after the hook has accepted Excel content. With no existing questions, `requestExcelImport` accepts immediately; with pending questions, it only stages replacement until `acceptReplacement`. A cancelled replacement never invokes that callback. Manual replacement preserves page metadata. These commands perform no network I/O and have no output arguments. Lock guards prevent updates during submission/frozen batch.

- [ ] **Step 1 Add behavior tests against the actual editor.** Render a small test host owning state with this hook and panel. Type a prompt/choices, choose TRUE_FALSE false and `isRequired=false`, move/delete/select questions, and assert changes persist after collapse/reopen. Verify adding produces empty authored text (not valid example text), the 500th/501st boundary, no hidden server save action, and locked controls. Use real state and existing components; mock only navigation/browser boundaries if required.

- [ ] **Step 2 Run the new panel test file to confirm missing hook/component or absent behaviors.** Do not change global vitest setup to mock editor/i18n behavior; use the real NextIntlClientProvider and messages as existing import tests do.

- [ ] **Step 3 Implement a single content owner and synchronous changes.** Use a stable local sequence for question/option IDs, clone type/points/options structure from `DEFAULT_NEW_QUESTION`, blank prompt and option text for the new Create-only collection, and set `isRequired=true`. Add does not POST. Closing the editor retains content. Switching question keeps current edits because updates already reached the collection.

```tsx
<QuestionEditor
  key={selectedQuestion.id}
  question={selectedQuestion}
  isReadOnly={locked}
  onChange={updates => updateQuestion(selectedQuestion.id, updates)}
  allowedQuestionTypes={["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE",
    "SHORT_ANSWER", "ESSAY"]}
  requireBothLocalizedTexts={false}
  showHomeworkFields
  detailsInputMode="single"
  validationErrors={selectedQuestionErrors}
/>
```

Use the existing editor's actual callback behavior, not a debounce/Save step that can lose the last edit. Outline move/delete handlers operate on current array order; normalize order at the validation/save boundary. An empty panel presents Add question; opening it adds no question automatically. Use full available card width, a fitting outline/editor grid on desktop and stacked/single-selection views on narrow screens; avoid the saved layout's full viewport height and attachments/settings panels.

- [ ] **Step 4 Implement replacement state without early metadata mutation.** Opening a preview/template is not replacement. Stage an accepted Excel Apply intent while manual questions exist, show ConfirmDialog, and apply source plus imported metadata only on acceptance. Cancel preserves both. Manual replacement of Excel also confirms before discarding. Lock/reset behaviors share the same content owner.

- [ ] **Step 5 Rerun component tests and review production/test diffs with their guards.** Commit local-authoring support before wiring the page.

## Task 4 Familiar Create page and visible multi-class choice

**Files:** modify `pages/CreateHomeworkPage.tsx`, English/Arabic messages, existing `CreateHomeworkPage.test.tsx`/Excel/batch tests; create `CreateHomeworkManualQuestions.test.tsx`.

**Interfaces consumed:** Tasks 1-3's content hook/panel, draft validation/preparation, generic ordered save, and batch prop contract. Page metadata stays in the current draft/effectiveDraft state; content comes from the one source owner.

- [ ] **Step 1 Test the non-surprising default and legacy wire request.** Keep current auth/context/network test boundaries and real page/editor. Assert visible unchecked multi-class choice, visible secondary manual action, closed/absent manual editor, existing fields and Create draft. Fill the current valid single-class inputs, click Create without questions and assert the existing normalized parent-only request, zero question POSTs and unchanged editor route.

```ts
expect(screen.getByRole("checkbox", {
  name: "Assign to multiple classes",
})).not.toBeChecked();
expect(screen.getByRole("button", {
  name: "Write questions before creation",
})).toBeVisible();
expect(screen.queryByText("Questions are saved when you create the homework."))
  .not.toBeInTheDocument();
// Reuse existing valid boundary inputs and assert the same parent payload.
```

Add a multi-first case: check the checkbox before any questions, assert optional empty authoring/target prerequisites, no automatic question, disabled batch Create and zero POSTs. Add questions or accept an Excel import and verify multi-class intent remains on. Turning mode off retains local questions/metadata and restores the single-class targeting controls. Missing view/manage permission keeps the choice discoverable but disabled with a reason; don't relax current permission/context rules.

- [ ] **Step 2 Run only the affected Create files and confirm new manual/discovery cases fail before integration.** Preserve the existing Excel and zero-question baseline assertions; do not rewrite them into mocks of internal saves.

- [ ] **Step 3 Add optional controls and derive the active draft.** Render the multi-class Checkbox independently of `pendingImport`, initially unchecked. On opt-in with no source, open the empty manual area; do not automatically add a question or silently create one class. On opt-out, retain content. Place the new secondary entry adjacent to current import actions and reveal its authoring card only on request. Do not rename existing fields/primary legacy actions or require new steps for old users.

```ts
const questions = content.kind === "excel" ? content.imported.questions
  : content.kind === "manual" ? content.questions : [];
const questionDraft: HomeworkQuestionDraft = {
  metadata: effectiveDraft,
  questions,
};
```

Only pass allowed metadata fields rather than accidentally treating all form target/timetable fields as generic draft metadata. `effectiveDraft` here is structurally compatible; the final parent request still follows the current explicit mapper/whitelist. For no content + multiple mode, render prerequisite help and the disabled batch action. For single mode + no questions, use exactly the old parent-only route.

- [ ] **Step 4 Wire validation and source replacement before saving.** Single manual questions use model validation/preparation and `createHomeworkWithQuestions`; retain selected-student/timetable payload rules and known-parent recovery. Excel single and batch retain spreadsheet validation plus original coordinates/language previews. Multiple mode uses source-neutral batch props and the existing planner. Selecting/previewing a workbook does not clear manual questions; accepted replacement preserves multiple-mode intent.

```ts
if (batchEnabled) return; // the batch coordinator owns writes
// After the source-specific validation described in this step succeeds:
const created = questions.length > 0
  ? await createHomeworkWithQuestions({
      assignment: payload,
      questions: prepareHomeworkDraftQuestions(questions),
    })
  : await createHomeworkAssignment(payload);
```

`payload` is the current validated/normalized single-class parent request, including its existing selected-student/timetable rules. Keep the current navigation and recovery branches around this save selection; do not invent a question source to reach the old no-question path. Source changes and metadata updates occur only after confirmation when content is replaced. Wire `onExcelAccepted` to the current metadata-apply logic without forcing `batchEnabled=false`; the visible checkbox owns that intent.

- [ ] **Step 5 Protect local content and lock the full operation.** Dirty tracking includes manual questions, not just Excel pending count. Preserve existing providers and guarded Cancel/back navigation. Freeze actual cloned questions/metadata at submit; prevent source/questions/targets edits and repeat Create. Surface manual field errors without worksheet labels, selecting the first affected question. Known-parent partial recovery disables repeat parent creation and links to the existing draft. Clear dirty state after complete saves while retaining incomplete-outcome guidance. Use the frozen year/term for editor URLs.

- [ ] **Step 6 Add localized copy without a tour or forced mode change.** Add concise keys under homework Create/manual strings: entry action, optional helper, local-save explanation, zero-question batch prerequisite, question count, replacement confirmation, and manual error/recovery wording. Keep existing Excel copy and preview-language selections intact; batch content summary is manual/generic for manual questions and retains import wording for Excel. Primary legacy Create draft remains unchanged.

- [ ] **Step 7 Rerun the manual Create tests plus existing single/Excel/batch/assessment regressions and typecheck.** Review clean-code/test guard results and commit the integrated feature normally.

## Task 5 Workflow and contract regressions

**Files:** extend the concrete tests from Tasks 1-4 plus existing `HomeworkImportBatchPanel.test.tsx`, `homeworkImportBatchTargets.test.ts`, `homeworkImportBatchSave.test.ts`, `homeworkExcelImportSave.test.ts`, and saved builder regression files only when their affected seam needs coverage.

- [ ] **Step 1 Test all scopes with manual source using real planner/context fixtures.** Parameterize selected classes, section, grade, stage, school and teacher; assert unique eligible class/allocation IDs, skipped reasons and exact parent payload whitelist. Teacher same-name/different-ID, reassignment, exclusions and new-allocation snapshot tests must remain. Do not duplicate planning logic inside test expected values; reuse scenario-specific IDs from fixtures.

- [ ] **Step 2 Test fresh preflight, failures and locks through actual user actions.** Add explicit scenarios: no POST when signature changes; lookup failure then read-only retry with manual content retained; partial first parent followed by successful second; uncertain parent with no automatic recreation; metadata/year/term/permission changes during awaited operations; repeated taps; popup null/exception still keeps created results; unchanged original page and manual recovery links.

- [ ] **Step 3 Test content preservation and final edits.** Cover accepted/declined manual-to-Excel and Excel-to-manual replacement, cancelled workbook preview, manual collapse/reopen, type change, last edit immediately followed by Create, reorder/delete order, optional `isRequired=false`, false answer options at 0/1, and selected-student single creation. Full question sets must survive UI pagination/selection and validation display.

- [ ] **Step 4 Verify recent and old consumers.** Run actual Excel dialog and assignment/assessment import tests, preview-language tests discovered with `rg`, and `HomeworkAssignmentBuilderPage.test.tsx` so saved-editor and other-module behavior remain. Add no test that asserts a whole React snapshot or styling class list instead of observable behavior. Prefer real components with file/HTTP/router/window boundaries mocked.

- [ ] **Step 5 Review and commit necessary regressions.** Apply Test Guard; remove duplicate cases already proved at a lower appropriate layer. Apply Clean Code Guard to any production fixes discovered by these scenarios; do not broaden into unrelated automatic-correction or layout work.

## Task 6 Verification documentation and review delivery

- [ ] **Step 1 Run only the relevant focused tests and project checks after implementation.** Do not run a full suite. Resolve exact additional existing test filenames with `rg --files` rather than inventing them; the targeted command below names the new and verified existing core files.

```powershell
& {
  npx vitest run src/features/academics/homework/utils/__tests__/homeworkQuestionDraftValidation.test.ts src/features/academics/homework/components/__tests__/HomeworkQuestionAuthoringPanel.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkManualQuestions.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkExcelImport.test.tsx src/features/academics/homework/pages/__tests__/CreateHomeworkBatchImport.test.tsx src/features/academics/homework/components/__tests__/HomeworkImportBatchPanel.test.tsx src/features/academics/shared/excel-import/__tests__/ExcelImportDialog.test.tsx src/features/grades/assessments/pages/__tests__/CreateAssessmentExcelImport.test.tsx;
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm run lint;
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm run typecheck;
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm run build;
  exit $LASTEXITCODE
}
```

Run planner/save/saved-builder/preview-language files from Task 5 as focused checks as well. Keep dependency install/setup outside this command and honor any setup instructions before execution. All new test paths exist only after their implementation tasks.

- [ ] **Step 2 Inspect actual-page layouts at 375/768/1024/1440 in English/Arabic.** Verify the default page has a visible unchecked choice, secondary optional manual action and unchanged legacy fields. Explicitly expand manual authoring, create/validate/edit questions, opt into all target scopes, replace/cancel source, review results, and reopen partial/created drafts. Verify keyboard/touch usability, no overflow, readable error focus, and no default tour/wizard. Use fixture boundaries for safe browser QA and report live-backend limits honestly.

- [ ] **Step 3 Update records against actual code and measured results.** Record test filenames/counts/check status, authoring/source replacement behavior and low-surprise UI. Recheck all referenced imports/APIs and distinguish live from synthetic saves. Update this spec/status only when implemented; retain any verified limitations.

- [ ] **Step 4 Deliver through the working agreement.** Inspect `git status`/`git diff --check`, make normal commits and push only the feature branch. Create/update one draft PR against main, attach it to the task, and provide the requested SHA/file-manifest/check-results handoff. Leave merge/deployment to the owner. The present planning delivery includes only these documents, not an implementation claim.

## Review of this plan

The six tasks cover the approved spec and the owner's additional visibility request: a visible but off-by-default multi-class choice, no forced migration for old users, local questions without worksheet fabrication, core constraints, all scopes, source replacement, unchanged Excel/saved-editor behavior, preflight/frozen saves, recovery and focused verification. Proposed interfaces are declared before use; existing sources were inspected in the planning worktree. No application code or tests were changed or run during planning.

The plan is ready for later inline execution using executing-plans after the user explicitly requests implementation. This plan does not authorize starting application work merely because its spec was approved.
