# Assignment Multiple-Target Excel Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user chose inline execution in this chat; use the installed executing-plans skill and do not dispatch subagents.

**Goal:** Reuse one assignment workbook across selected classes or a section/grade/stage/school, create one draft per eligible class, and open fully saved drafts in separate tabs.

**Architecture:** Homework-specific target planning, context loading, sequential save orchestration, and a controlled batch panel extend the existing Create page. Existing workbook validation and parent/question services retain responsibility for contract adaptation. Browser effects occur after recorded save results and cannot change a successful save into a failure.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript, next-intl, current UI components, ExcelJS 4.4.0, Vitest, and Testing Library. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-12-assignment-multiple-target-excel-import-design.md`.

## Global constraints

- Assignments/homework only; assessment behavior is outside this extension.
- One workbook, one selected subject, separate whole-class drafts using each class's current-term teacher allocation.
- Targets: selected classes, section, grade, stage, or school. Show skipped classes and reasons; proceed with eligible classes.
- Frontend only. Existing backend main audited at `fe6b4b1b99478628c106b60f65370d08c10c3ceb`.
- Existing workbook columns/validation remain unchanged: `.xlsx`, 5 MiB, 500 questions, 25,000 choices, maximum 50 choices per question.
- Batch mode requires `homework.assignments.manage` and `homework.assignments.view`; existing manual/single-import gating remains intact. Read failures block a trustworthy preview rather than impersonating empty data.
- Batch payloads explicitly use allowed metadata, frozen year/term, per-class allocation ID, and `targetMode: "classroom"`. Omit student IDs, timetable entry, schedule date, UI scope fields, and workbook source rows.
- Continue after individual failures. No automatic parent retry, rollback, Retry all, or duplicate submission.
- Successful saves open new editor tabs when the browser permits; always provide new-tab links. Null `window.open` returns with `noopener` do not prove failure.
- Keep content/results in page memory. Preserve known partial IDs and existing dirty-navigation behavior.
- Use existing UI components/theme, English/Arabic messages, keyboard labels, text statuses, and responsive contained layouts.
- Clean Code Guard for production changes; Test Guard for test changes; Docs Guard for records.
- Continue on `feat/assignment-assessment-excel-import` and existing draft PR #85 as a follow-up to the same feature. No main push, merge, deployment, history rewrite, or force push.
- PowerShell uses one `& { ... }` block. Work in the existing checkout as explicitly selected by the user.
- Focused checks only under the user's current instruction. Do not run the full suite without new permission.

## File map and interfaces

Create under the homework feature:

- `utils/homeworkImportBatch.types.ts`: selection, context, preview row/plan, run state, and result types.
- `utils/homeworkImportBatchTargets.ts`: structure traversal, eligibility, plan comparison, and explicit parent payload construction.
- `services/homeworkImportBatchContext.ts`: read current structure/subjects/allocations/enrollments through existing services.
- `services/homeworkImportBatchSave.ts`: sequential per-class saving with isolated outcomes/progress.
- `hooks/useHomeworkImportBatch.ts`: context loading, selection, refreshed-plan review, current contract validation, run lock, and browser integration.
- `components/HomeworkImportBatchPanel.tsx`: mode's subject/target controls, class selection, preview, progress, and reset action.
- `components/HomeworkImportBatchResults.tsx`: localized preview/result rows and editor/list links.
- Unit/service/component/page tests in each area's existing `__tests__` convention.

Modify only:

- `services/homeworkExcelImportSave.ts` and its existing service test to retain the already-returned server assignment details on complete success.
- `pages/CreateHomeworkPage.tsx`: batch mode controls and controlled page locking/dirty integration; retain the normal submit branch.
- `src/messages/en.json` and `src/messages/ar.json`: homework-specific batch messages.
- Spec/plan execution records. Existing shared import and assessment tests are regression targets.

Define the shared batch types before their consumers:

```ts
type HomeworkBatchSelection =
  | { type: "classes"; classroomIds: string[] }
  | { type: "section" | "grade" | "stage"; id: string }
  | { type: "school" };
type HomeworkBatchSkip = "missingClass" | "missingAllocation" | "missingTeacher"
  | "ambiguousAllocation" | "noStudents" | "invalidStructure";
interface HomeworkBatchRowBase {
  classroomId: string; classroomName: string; hierarchy: string;
  studentCount: number;
}
type HomeworkBatchRow = HomeworkBatchRowBase & (
  | { eligible: true; allocationId: string; teacherUserId: string; teacherName: string }
  | { eligible: false; skipReason: HomeworkBatchSkip; teacherName?: string }
);
type HomeworkBatchEligibleRow = Extract<HomeworkBatchRow, { eligible: true }>;
interface HomeworkBatchContext {
  structure: StructureTree; subjects: Subject[];
  allocations: TeacherAllocation[];
  enrollments: Array<StudentEnrollment & { id: string }>;
}
interface HomeworkBatchPlan {
  academicYearId: string; termId: string; subjectId: string;
  rows: HomeworkBatchRow[]; signature: string;
}
type HomeworkBatchResult = { target: HomeworkBatchRow } & (
  | { status: "queued" | "creating" | "skipped" }
  | { status: "created"; assignment: HomeworkAssignmentUiModel }
  | { status: "partial"; homeworkId: string; failedQuestionIndex: number; error: unknown }
  | { status: "failed" | "unconfirmed"; error: unknown }
);
interface HomeworkBatchPageState {
  hasStarted: boolean; isSaving: boolean; allCreated: boolean;
}
```

Use type-only imports from the verified current model files. Display rows may use localized fallback labels, but raw identifiers are not reader-facing labels. The server assignment's teacherName/classroomName overrides preview labels for a Created result when available.

### Task 1: Contract-safe target planning and context reads

**Files:** new batch types, target utility, context reader, `utils/__tests__/homeworkImportBatchTargets.test.ts`.

**Consumes:** `StructureTree`, `TeacherAllocation`, `Subject`, current-year `StudentEnrollment`, and `HomeworkImportMetadata`.

**Produces:**

```ts
loadHomeworkBatchContext(request: { academicYearId: string; termId: string }): Promise<HomeworkBatchContext>
homeworkBatchPlan(request: {
  academicYearId: string; termId: string; subjectId: string;
  selection: HomeworkBatchSelection; context: HomeworkBatchContext; locale: string;
}): HomeworkBatchPlan
homeworkBatchPayload(request: {
  plan: HomeworkBatchPlan; target: HomeworkBatchEligibleRow;
  metadata: HomeworkImportMetadata; publishAt?: string | null;
}): CreateHomeworkAssignmentRequest
```

- [ ] **Step 1: Write meaningful plan/payload tests.** Construct real typed structure and allocation objects. Parameterize classes/section/grade/stage/school traversal; include multiple sections/grades and duplicate classroom names. Test a subject allocated to two teachers in two different classes, a missing allocation, duplicate API records with the same ID, multiple distinct allocation IDs for one class, another term, an empty roster, and stale selection IDs. Ensure search/display labels do not affect membership. Assert no accidental inclusion outside the selected group.

```ts
expect(homeworkBatchPlan({ ...request, selection: { type: "grade", id: gradeId } })
  .rows.map(row => row.classroomId)).toEqual([classAId, classBId]);
const payload = homeworkBatchPayload({ plan, target: eligibleClassA, metadata });
expect(payload).toMatchObject({ teacherSubjectAllocationId: allocationAId, targetMode: "classroom" });
const forbidden = ["classroomId", "subjectId", "teacherUserId", "studentIds", "timetableEntryId", "scheduleDate", "source"];
expect(Object.keys(payload).filter(key => forbidden.includes(key))).toEqual([]);
```

The test fixtures define request/context/metadata and full required structure fields in the test file; reuse builders across variants. HTTP is the boundary for any context-read test; do not mock target utilities.

- [ ] **Step 2: Run the new target test red.** `& { npx vitest run src/features/academics/homework/utils/__tests__/homeworkImportBatchTargets.test.ts }`.
- [ ] **Step 3: Implement target expansion and eligibility.** For selected classes, deduplicate IDs; for group types, follow classroom.sectionId → section.gradeId → grade.stageId. Invalid group/subject/context yields no runnable plan and an inline prerequisite message. For each class, match allocation termId/classroomId/subjectId, deduplicate allocation IDs, and require one assigned teacher. Count distinct active current-year student IDs for that classroom. Build sorted rows and a deterministic signature from year/term/subject, class ID, eligible/skip state, allocation ID, teacher ID, and student count. Changing labels or object identity alone must not force a re-review.

```ts
const candidates = [...new Map(context.allocations
  .filter(allocation => allocation.termId === termId && allocation.subjectId === subjectId
    && allocation.classroomId === classroom.id)
  .map(allocation => [allocation.id, allocation])).values()];
const studentIds = new Set(context.enrollments.filter(enrollment =>
  enrollment.academicYearId === academicYearId && enrollment.status === "active"
  && enrollment.classroomId === classroom.id).map(enrollment => enrollment.studentId));
```

Use small named helpers for hierarchy selection and per-class eligibility. No sorting or mutation of source arrays. Missing labels do not turn a valid teacher allocation into a missing teacher.

- [ ] **Step 4: Implement read context and payload whitelist.** Load `fetchStructureTree(year, term)`, `fetchSubjects()`, `fetchTeacherAllocations(term)`, and `fetchEnrollments({academicYearId, status:"active"})` in parallel. Reject if a required read fails. Teacher names already exist on allocation records, so batch reads do not introduce a mandatory staff-directory permission. Use explicit allowed request properties:

```ts
return {
  academicYearId: plan.academicYearId, termId: plan.termId,
  teacherSubjectAllocationId: target.allocationId, targetMode: "classroom",
  title: metadata.title.trim(), dueAt: metadata.dueAt,
  description: metadata.description?.trim() || undefined, mode: metadata.mode,
  publishAt, estimatedMinutes: metadata.estimatedMinutes,
  totalMarks: metadata.totalMarks, isGraded: metadata.isGraded,
};
```

- [ ] **Step 5: Run target tests and typecheck, apply guards, then commit.** `& { npx vitest run src/features/academics/homework/utils/__tests__/homeworkImportBatchTargets.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run typecheck }`. Commit: `feat(homework): plan assignment imports across class targets`.

### Task 2: Sequential saving and isolated per-class outcomes

**Files:** `homeworkImportBatchSave.ts`, `homeworkExcelImportSave.ts`, both service test files.

**Consumes:** frozen plan, imported metadata/questions, explicit payload builder, `createHomeworkFromImport`, existing `HomeworkImportQuestionSaveError`, and `uncertainImportCreation`.

**Produces:**

```ts
createHomeworkFromImport(request: { assignment: CreateHomeworkAssignmentRequest;
  questions: AssignmentQuestion[] }): Promise<HomeworkAssignmentUiModel>
saveHomeworkImportBatch(request: {
  plan: HomeworkBatchPlan; draft: HomeworkImport; publishAt?: string | null;
  onResult: (result: HomeworkBatchResult) => void;
}): Promise<HomeworkBatchResult[]>
```

- [ ] **Step 1: Write HTTP-boundary scenarios.** Use actual services/mappers and real question objects. A four-class scenario completes class A, fails B's second question, rejects C's parent with a definite API error, and loses D's parent response; a later E must still complete. Assert one parent request per eligible class, no skipped-class request, known partial ID/index, no remaining B question writes, and no retry. Add actual server teacher/classroom fields to success responses and verify they are retained. Parent IDs and allocation IDs must differ by class so crossed results are detectable.

```ts
expect(results.map(result => result.status)).toEqual(["created", "partial", "failed", "unconfirmed", "created"]);
expect(results[1]).toMatchObject({ homeworkId: partialParentId, failedQuestionIndex: 1 });
expect(parentPosts).toHaveLength(5);
expect(questionPostsForPartialParent).toHaveLength(2);
```

- [ ] **Step 2: Run the two service test files red.** `& { npx vitest run src/features/academics/homework/services/__tests__/homeworkImportBatchSave.test.ts src/features/academics/homework/services/__tests__/homeworkExcelImportSave.test.ts }`.
- [ ] **Step 3: Retain the server parent response after complete save.** Return `createdAssignment` from the existing helper rather than reducing it to `{id}`. Existing page callers still use `.id`. Update the existing success test to assert the returned ID and server ownership fields; preserve its wire/options assertions and existing failure tests.
- [ ] **Step 4: Implement the sequential coordinator.** Emit skipped/queued initial results in the UI or initialize them in the hook. For each eligible target, emit Creating, call the real save helper in a narrow API try/catch, classify its outcome, then emit the result outside that catch. Complete results carry the returned assignment; partial results retain the known ID/index/cause; parent rejections use `uncertainImportCreation` for ambiguity. Do not include tab callbacks inside the API catch.

```ts
let outcome: HomeworkBatchResult;
try {
  const assignment = await createHomeworkFromImport({ assignment: homeworkBatchPayload({
    plan, target, metadata: draft.metadata, publishAt,
  }), questions: draft.questions });
  outcome = { target, status: "created", assignment };
} catch (error) {
  outcome = error instanceof HomeworkImportQuestionSaveError
    ? { target, status: "partial", homeworkId: error.homeworkId,
        failedQuestionIndex: error.failedQuestionIndex, error }
    : { target, status: uncertainImportCreation(error) ? "unconfirmed" : "failed", error };
}
request.onResult(outcome);
```

- [ ] **Step 5: Run tests/typecheck, guard-review, commit.** Same two test paths; then `npm run typecheck`. Commit: `feat(homework): save assignment batches with per-class recovery`.

### Task 3: Reviewable and accessible batch panel

**Files:** batch hook, panel, results component, new component test; localized `academics.homework.importBatch` messages.

**Consumes:** pending `HomeworkImport`, current form metadata/publishAt, current year/term/open state, view/manage permission flags, target/context/plan utilities, coordinator, existing UI Input/Select/Checkbox/Button/DataTable, and error translators.

**Produces:**

```ts
interface HomeworkImportBatchPanelProps {
  importedDraft: HomeworkImport; metadata: HomeworkImportMetadata;
  publishAt?: string | null; academicYearId: string; termId: string;
  termStart: string; termEnd: string; writable: boolean;
  initialSubjectId?: string; initialClassroomId?: string;
  onStateChange: (state: HomeworkBatchPageState) => void;
  onReset: () => void;
}
```

- [ ] **Step 1: Write real panel integration tests at HTTP/window boundaries.** Build the import via existing real workbook fixtures/adapters. Load two eligible classes and one excluded class through mocked HTTP responses. Choose group/class targets, search the class chooser without clearing selections, and verify the complete eligible count on Create. Apply data/target selection must send no POST. Simulate refreshed allocation mapping: first Create updates preview with no POST; second reviewed click proceeds. Simulate lookup rejection: show one load error, disabled creation, then Retry loading succeeds. Mock `window.open` only as the browser boundary and return null on success; Created must remain Created and have an editor link.

```tsx
expect(screen.getByRole("button", { name: "Create 2 drafts" })).toBeEnabled();
expect(apiPost).not.toHaveBeenCalled();
fireEvent.click(screen.getByRole("button", { name: "Create 2 drafts" }));
await screen.findByText("2 assignments created");
expect(openWindow).toHaveBeenCalledTimes(2);
expect(screen.getAllByRole("link", { name: /Open assignment/ })).toHaveLength(2);
```

- [ ] **Step 2: Run the panel test red.** `& { npx vitest run src/features/academics/homework/components/__tests__/HomeworkImportBatchPanel.test.tsx }`.
- [ ] **Step 3: Implement controlled context/selection/preview state.** The hook loads on year/term changes with a request token so stale reads cannot replace current preview. Default Selected classes; reuse supplied initial class/subject only when present in loaded context. Keep search separate from selected classroom IDs. Track data loading/error independently from empty eligibility. At Start, take a submission ref lock before awaiting refresh, validate current metadata/questions with `validateHomeworkImportDraft` and now/publishAt, reload context, compare plan signatures, and return to review if changed. Take the frozen plan/draft/context only after that comparison passes.
- [ ] **Step 4: Implement results and browser effects.** Initialize one result per preview row, replace results by classroom ID, run the real coordinator, and attempt `window.open(editorUrl, "_blank", "noopener,noreferrer")` once for each Created outcome. Isolate a browser exception from result recording; no null-return failure inference. Always render semantic new-tab links with `rel="noopener noreferrer"`, frozen year/term, and localized labels identifying the class. Partial results use the existing ID; unconfirmed results link to the assignment list with frozen year/term. Keep the current page and show final counts. No per-class toast flood.
- [ ] **Step 5: Build the localized UI.** Three clear areas: content summary, target selection, and review/results. Use searchable Select for subject/groups and Input/Checkbox for class multi-selection; Select remains single-value. Preview/results use DataTable, local pagination/search, combined class/hierarchy text, teacher, student count, status/reason, and actions. Keep skipped counts visible; add a Needs attention results filter. Use contained overflow or stacked summaries at narrow widths. Add loading/empty/error prerequisite text, polite progress announcements, and new-tab guidance before Create. Parent-state callback reports hasStarted/isSaving/allCreated; onReset clears the batch/import explicitly after results are finished, with an inline explanation that saved drafts remain.
- [ ] **Step 6: Run panel/service/target checks and typecheck; guard-review and commit.** Commit: `feat(homework): add assignment batch preview and results UI`.

### Task 4: Integrate without changing existing creation flows

**Files:** CreateHomeworkPage.tsx, new `pages/__tests__/CreateHomeworkBatchImport.test.tsx`; existing page/import tests as regressions.

**Consumes:** the controlled batch panel and `HomeworkBatchPageState`. The new hook/panel owns batch orchestration; the page keeps existing single/manual submission logic.

- [ ] **Step 1: Write actual page-level workflow tests.** Supply real framework/auth context and HTTP fixtures. Import an assignment workbook, enable Assign to multiple classes, pick a grade, inspect eligible/skipped rows, then create. Verify distinct allocation IDs in parent POSTs, question writes beneath the corresponding parents, two new-tab calls with the original context, and no redirect of the original page. Test manage-without-view: batch toggle disabled with an explanation, while existing single-import creation remains available. Test a second-question failure in one class while a later class succeeds and opens only its own tab. Test repeat submission, source replacement/removal, mode switching, and metadata edits are locked once running/started.
- [ ] **Step 2: Run new page tests red.** `& { npx vitest run src/features/academics/homework/pages/__tests__/CreateHomeworkBatchImport.test.tsx }`.
- [ ] **Step 3: Add controlled batch mode and page lock integration.** Use a UI Checkbox only while pendingImport exists, with default off. The new mode requires manage/view, selected writable term, and stable context. Initialize the panel from the selected allocation when valid. While batch mode is enabled, hide single-allocation/selected-student/timetable controls and the existing single Create button; leave imported metadata editable until Start. Use isSubmitting || batchState.isSaving for Cancel and field locks, and batchState.hasStarted to lock import actions/mode. The panel supplies its count-specific Create action and results.

```tsx
const [batchEnabled, setBatchEnabled] = useState(false);
const [batchState, setBatchState] = useState<HomeworkBatchPageState>({
  hasStarted: false, isSaving: false, allCreated: false,
});
const importIsDirty = Boolean(pendingImport && !(batchEnabled && batchState.allCreated));
useImportNavigation({ key: "homework-excel-import", questionCount:
  importIsDirty ? pendingImport?.questions.length ?? 0 : 0 });
```

Integrate with the existing hook invocation, not an additional call with the same key. Preserve guarded Cancel. Reset clears pendingImport/importIssues and the controlled batch state; partial/unconfirmed/failed results keep the existing dirty key until explicit reset/acknowledged leave. Do not let a year/term update unmount/reset an active panel's frozen results.

- [ ] **Step 4: Preserve the single/manual routes.** Their permission gate, targeting and timetable controls, success navigation, and known-partial recovery remain unchanged when batchEnabled=false. Updating the save helper's return retains `.id` for those consumers.
- [ ] **Step 5: Run new and existing page tests plus the original save tests and typecheck.** Include CreateHomeworkPage.test.tsx, CreateHomeworkExcelImport.test.tsx, CreateHomeworkBatchImport.test.tsx, and homeworkExcelImportSave.test.ts. Guard-review and commit: `feat(homework): integrate multi-class Excel assignment creation`.

### Task 5: Complete verification and update the existing draft PR

- [ ] **Step 1: Guard-review source, tests, and documents.** Check payload whitelist, hierarchy/context IDs, student count sources, temporary question mappings, preserved false answers, outcome ownership, lock timing before refresh, callback/browser isolation, and stale-response handling. No new speculative abstraction, package, unused export, or fake success fallback. Update spec/plan records with actual outcomes.
- [ ] **Step 2: Run the full feature-focused set and mechanical checks.** Use `npx vitest run` with the new target/service/panel/page files, all existing shared excel-import tests, both homework adapters/save/page regression files, and existing assessment import/service tests from the original feature. Then `npm run lint`, `npm run typecheck`, and `npm run build`, each gated on prior exit code. This is focused verification, not `npm run test:run` or an end-to-end suite.
- [ ] **Step 3: Check UI where available.** Verify English/Arabic, 375/768/1024/1440 layouts, keyboard labels/focus, eligible/skip preview, localized counts/reasons, mixed results, original page retained, new-tab links, and popup restrictions using synthetic data or test HTTP boundaries. Do not create real school assignments merely for QA. Record blocked authenticated routes/extension file access or unrun checks without marking them PASS.
- [ ] **Step 4: Commit records and normally push the same feature branch.** Verify git diff --check/status and changed-file scope. Update draft PR #85 around the final original Excel import plus assignment-only batch extension; describe actual checks and limits, and attach its URL to this chat. No second PR for this follow-up, force push, main merge, or deployment.
- [ ] **Step 5: Deliver the working-agreement handoff.** Include actual base/head SHAs, branch, PR identity/state, files, focused tests/lint/typecheck/build, clean status, normal push, no force/main merge, warnings and browser/full-suite limitations, and owner-review status. Do not invent checks.

## Plan self-review

- Spec coverage maps targets/preflight/payloads to Task 1, per-class persistence/recovery to Task 2, responsive accessible preview/results and tabs to Task 3, legacy-flow and dirty integration to Task 4, and guards/verification/delivery to Task 5.
- Public types/signatures are defined before consumers. Retaining the server-created assignment response supports truthful result labels without a new endpoint; existing consumers retain `.id`.
- Approval and execution context are carried forward: the user approved target/save sections, requested contract/workflow/UX verification, and then explicitly said continue; execution remains inline.
- No full suite, additional backend change, assessment batching, or new workbook targeting contract is implied.

## Execution record — 2026-10-12

- Tasks 1–4 are implemented inline. Target planning and persistence were tested before implementation; panel/page HTTP-boundary scenarios were added after the initial UI implementation and refined during integration. No delegation or scope expansion occurred.
- The target planner expands all five scopes, lists exclusions, and builds a deterministic review signature. The context reader rejects required lookup failures; the payload builder copies only accepted assignment fields.
- The ordered save helper retains the server assignment response. The coordinator continues after partial/definite/unconfirmed errors and preserves each known parent ID without retrying parent creation.
- The panel refreshes preflight before any POST and requires re-review after allocation/eligibility changes. It keeps source metadata, allocations, year/term, and recovery URLs frozen after Start. Browser open failures leave successful outcomes intact with manual links.
- Page integration defaults batching off, requires manage plus view for the new mode, preserves single/manual flows, locks source/mode/metadata during saving, and preserves active results during layout initialization. The final complete-state callback clears the dirty key before Cancel becomes available; partial results retain the navigation warning.
- Final focused regression set: **97 tests passed in 15 files**, including shared workbook tests, both original modules’ import tests, existing assignment Create tests, assessment service tests, and the four new batch test files. Edited metadata is revalidated before writing.
- Full-project lint, typecheck, production build, scoped final lint, and `git diff --check`: **PASS**. No full unit/component or end-to-end suite was run, following the user’s focused-only preference.
- Synthetic Chrome checks exercised the actual batch panel/components and real service mappers with HTTP/router/window boundaries replaced by fixtures: English and Arabic at 375, 768, 1024, and 1440 pixels; no page overflow or runtime errors; two successful editor links at every size. Preview/results screenshots were visually inspected. This does not claim authenticated live backend saves or native Excel QA.
- Clean Code Guard and Test Guard passes completed: explicit request whitelist, separate persistence/browser effects, stable submission lock before refresh, retained server ownership labels, stale read protection, complete per-class outcomes, and no internal service mocks in new tests. Documentation references were checked against final source.
- Delivery continues on the same feature branch and draft PR #85. The final handoff records the pushed SHA and file manifest; no merge or deployment is authorized.

## UI refinement after owner feedback — 2026-10-12

- The assignment Create page now uses a wider workspace, clearer import controls, and separate details/target cards. Saved metadata collapses into a labelled accordion after batch creation starts; its fields remain locked. The completed-page navigation label is Back to assignments, using the same guarded navigation action.
- Batch previews/results use compact count cards, text-labelled status badges, progress/completion feedback, and shared UI ButtonLink actions with class-specific accessible new-tab labels. Desktop rows become labelled two-column cards on small screens through the existing DataTable; skipped rows omit empty action labels. No duplicate mobile/desktop link tree or viewport JavaScript was added.
- Persistence, permissions, target planning, payloads, and recovery logic are unchanged. The assessment UI and shared Excel actions component were not modified. No new dependency was added.
- Latest UI-focused verification: **15 tests passed in four files**, full-project lint, typecheck, production build, and diff whitespace checks passed. Existing tests retain wire, ownership, recovery, permission, locking, and navigation assertions; the async completion callback assertion waits for its actual effect. The batch HTTP fixture now uses the real timetable dashboard response shape.
- A synthetic Chrome harness imported the actual five-question XLSX through the actual Create page, selected whole-school targets, and completed the two eligible drafts. English/Arabic previews and results at 375/768/1024/1440 pixels produced no page overflow or runtime errors and retained two editor links at every size. Desktop and mobile screenshots were visually inspected. HTTP/auth/context/router/window boundaries used fixtures; no real school assignments were created.
- Clean Code Guard, Test Guard, UI/UX, and documentation guard passes completed. Full tests remain unrun by user preference. This is follow-up review work on the same branch and PR #85.

### Detail-input sizing follow-up

- Scoped the details grid's child widths and input border-box sizing to prevent number fields from expanding into neighbouring columns. Important sizing utilities protect this form against unlayered content-box overrides; the shared Input component and save behavior are unchanged.
- Ten existing assignment Create/import workflow tests passed across three files. Typecheck, scoped lint, production build, and diff checks passed. Browser geometry checks found no overlap in editable or reopened saved details in English/Arabic at 375/768/1024/1440 pixels, including a simulated unlayered content-box stylesheet. Full tests remain unrun.

### Dropdown sizing follow-up

- Extended the scoped width protections to shared Select triggers in assignment details and batch targeting. Grid children can shrink without long labels expanding their columns. Portal menus and selection/save behavior remain unchanged; no shared UI component was modified.
- Fifteen existing tests passed across the four affected assignment Create/import and batch-panel test files. Scoped lint, typecheck, production build, and diff checks passed. The synthetic Chrome harness verified all visible manual and batch dropdown triggers stayed within their containers in English/Arabic at 375/768/1024/1440 pixels, including an unlayered content-box override. Allocation and target selections, two draft saves, and editor links remained functional; no page overflow or runtime errors were observed. Clean Code Guard and documentation checks completed. Full tests remain unrun by user preference.
