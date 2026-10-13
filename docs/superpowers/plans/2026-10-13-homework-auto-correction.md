# Homework Auto-correction Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using the available executing-plans skill. Use inline execution unless the owner explicitly chooses subagent delegation. Steps use checkbox syntax for tracking.

**Goal:** Auto-correct homework for one student or a bulk scope, finish fully resolved reviews, and synchronize available grades with recoverable failures.

**Architecture:** Add a pure homework scoring utility, a submission execution service, and a bounded bulk service. A focused hook and UI components integrate them into the existing homework review panel without restructuring its manual review workflow. Use the existing homework API adapter and UI components.

**Tech Stack:** TypeScript, React 19, Next.js 16, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-13-homework-auto-correction-design.md`

## Global constraints

- Reuse components in `src/components/ui`.
- Add Arabic and English copy and preserve keyboard access, focus management, disabled/loading states, and live progress announcements.
- Review every production-code change using clean-code-guard and every test change using test-guard.
- Run focused tests, lint, typecheck, and build; ask the owner before running the full test suite.
- Follow `Must Read Before Push.txt`: one task branch from current main, normal commits and push, one Draft PR, no main push, no merge, no deployment, and no backend changes.
- Repeat runs recalculate existing objective scores, including teacher-entered objective scores. Preserve feedback and submission review notes.
- A question without an answer record remains unresolved.
- Finish the submission review only after fresh API answers confirm that every assigned question is resolved, including optional questions.
- For ungraded homework, finish review without attempting sync.
- Retry only failed students and resume from their unfinished stage.
- Run executable PowerShell commands inside one `& { ... }` block per shell call.
- Continue on `codex/homework-auto-correction`; the approved spec is committed there. Check status before changing anything.

## File responsibilities

New files under `src/features/academics/homework`:

| File | Responsibility |
| --- | --- |
| `utils/homeworkAutomaticCorrection.ts` | Pure score decisions, skips, and completion checks |
| `services/homeworkAutomaticCorrectionExecution.ts` | Fresh state, chunked review writes, review completion, grade sync, stage results |
| `services/homeworkAutomaticCorrectionBatch.ts` | Scope pagination, deduplication, bounded processing, retry routing |
| `hooks/useHomeworkAutomaticCorrection.ts` | Action lock, progress/result state, completion refresh |
| `components/HomeworkAutomaticCorrectionDialog.tsx` | Scope confirmation, eligible count, progress and results |
| `components/HomeworkAutomaticCorrectionSummary.tsx` | Shared result rendering for single and bulk operations |

Modify `components/HomeworkSubmissionReviewPanel.tsx` for integration and existing action guards. Modify `src/messages/en.json` and `src/messages/ar.json` for copy under `academics.homework.review.autoCorrection`. Create focused tests adjacent to the new utilities/services/components and extend the existing panel tests. Do not change assessment code unless a narrowly scoped shared scoring extraction is necessary; a homework-specific scorer is sufficient for this task.

## Task 1: Pure scoring and completion checks

**Files:** Create `utils/homeworkAutomaticCorrection.ts` and `utils/__tests__/homeworkAutomaticCorrection.test.ts`.

**Consumes:** `AssignmentQuestion` from curriculumService and `HomeworkSubmissionAnswerUiModel` from homeworkApi.types.

**Produces:** The following exported contracts (all new):

```ts
export type HomeworkCorrectionReason =
  | "manual_question" | "missing_answer_record" | "invalid_definition";
export interface HomeworkCorrectionPlan {
  reviews: Array<{ answerId: string; questionId: string; score: number }>;
  unresolved: Array<{ questionId: string; reason: HomeworkCorrectionReason }>;
  correctedCount: number;
}
export function buildHomeworkAutomaticCorrectionPlan(
  questions: readonly AssignmentQuestion[],
  answers: readonly HomeworkSubmissionAnswerUiModel[],
): HomeworkCorrectionPlan;
export function isHomeworkCorrectionComplete(
  questions: readonly AssignmentQuestion[],
  answers: readonly HomeworkSubmissionAnswerUiModel[],
): boolean;
```

- [x] Write a meaningful scoring test using real homework types:

```ts
const question: AssignmentQuestion = {
  id: "q1", assignmentId: "hw1", questionTextAr: "سؤال",
  questionTextEn: "Question", questionType: "MCQ_SINGLE",
  points: 2, isRequired: true, order: 0, createdAt: "2026-10-13",
  options: [
    { id: "a", textAr: "أ", textEn: "A", order: 0, isCorrect: true },
    { id: "b", textAr: "ب", textEn: "B", order: 1, isCorrect: false },
  ],
};
const answer: HomeworkSubmissionAnswerUiModel = {
  id: "answer1", questionId: "q1", prompt: "Question", answerText: "",
  selectedOptionIds: ["a"], feedback: "Keep this comment",
};
it("scores a blank record zero but leaves an absent record unresolved", () => {
  const blank = buildHomeworkAutomaticCorrectionPlan([question], [
    { ...answer, selectedOptionIds: [] },
  ]);
  expect(blank.reviews).toEqual([{ answerId: "answer1", questionId: "q1", score: 0 }]);
  expect(buildHomeworkAutomaticCorrectionPlan([question], []).unresolved)
    .toEqual([{ questionId: "q1", reason: "missing_answer_record" }]);
});
```

- [x] Run `npm run test:run -- src/features/academics/homework/utils/__tests__/homeworkAutomaticCorrection.test.ts`; expect an import failure before implementation.
- [x] Implement the exported functions. Build a question-to-answer index but reject duplicate question IDs, duplicate answer IDs, duplicate answers for one question, and unknown answer associations as invalid rather than silently selecting a record. Validate points as finite, nonnegative, at most two decimals. Validate nonempty unique option IDs, correct-key cardinality, and selected IDs. Single choice and true/false require exactly one correct key; multiple choice requires at least one. Reject duplicate or unknown selections. Use proportional credit with deductions for incorrect selections and a zero floor for multiple choice, rounded once to two decimal places; retain exact matching for single choice and true/false, with blank records scoring zero. For true/false, verify option labels/key agree with `correctAnswer` when present; a contradictory definition is unresolved, never scored from option position alone.
- [x] Preserve manually reviewed unsupported questions only when `reviewedAt` exists and their score is finite and within question points. Missing records remain unresolved regardless of optional status. `isHomeworkCorrectionComplete` returns false for zero questions, unmatched/ambiguous records, invalid objective definitions, unreviewed records, or invalid scores; inspect every assigned question, not only required ones.
- [x] Add parameterized cases for proportional multi-choice credit, order independence, deductions for extra wrong choices and a minimum score of zero, decimal rounding, wrong/extra/missing options, true and false keys, conflicting true/false keys, malformed IDs, invalid point values, already scored objective overwrite, existing valid manual review, and an absent optional answer blocking completion. Assert input records and comments are unchanged.
- [x] Read and apply clean-code-guard and test-guard before presenting or committing these changes. Run the focused test and commit only the Task 1 files.

## Task 2: Stage-aware single-student execution

**Files:** Create `services/homeworkAutomaticCorrectionExecution.ts` and `services/__tests__/homeworkAutomaticCorrectionExecution.test.ts`.

**Consumes:** Task 1 contracts; existing homeworkService methods; `chunkHomeworkAnswerReviews`, `calculateAnswerScoreRollup`, `validateProspectiveAnswerScoreRollup`, and `buildHomeworkSubmissionReviewRequest` from homeworkReview.

**Produces:**

```ts
export type HomeworkCorrectionStage = "answers" | "review" | "sync";
export interface HomeworkCorrectionContext {
  homeworkId: string;
  assignmentStatus: HomeworkAssignmentStatus;
  isGraded: boolean;
  totalMarks: number | null;
  canManage: boolean;
  canViewSyncStatus: boolean;
  canSync: boolean;
  questions: readonly AssignmentQuestion[];
}
export interface HomeworkCorrectionResult {
  submissionId: string;
  plan: HomeworkCorrectionPlan | null;
  reviewCompleted: boolean;
  gradeSynced: boolean;
  outcome: "complete" | "manual_pending" | "skipped" | "sync_unavailable" | "failed";
  syncUnavailableReason?: "ungraded" | "permission" | "unlinked" | "locked";
  failedStage?: HomeworkCorrectionStage;
  error?: unknown;
}
export function executeHomeworkAutomaticCorrection(
  context: HomeworkCorrectionContext,
  submissionId: string,
  resumeFrom?: HomeworkCorrectionStage,
): Promise<HomeworkCorrectionResult>;
```

- [x] Write a failing orchestration test with mocked homeworkService. Use `vi.mock` and `vi.mocked` as in the existing homework service tests. Arrange fetch as submitted before answer writes and reviewed after final review; refreshed answers must contain server review timestamps. Assert the write payload:

```ts
expect(bulkReviewHomeworkSubmissionAnswers).toHaveBeenCalledWith("hw1", "s1", {
  answers: [{ answerId: "answer1", score: 2 }],
});
expect(reviewHomeworkSubmission).toHaveBeenCalledWith("hw1", "s1", {
  reviewNote: "Existing note",
});
expect(syncHomeworkSubmissionGrade).toHaveBeenCalledWith("hw1", "s1");
```

- [x] Run only `services/__tests__/homeworkAutomaticCorrectionExecution.test.ts`; expect import failure before implementation.
- [x] Implement authorization and fresh submission eligibility checks using `isHomeworkAnswerReviewable`. Load current answers and build the plan. Validate prospective score rollup against totalMarks before any write. Write each chunk sequentially using the existing bulk-review service and omit feedback from auto-review payloads so comments are not overwritten; verify adapter semantics in existing API docs/tests. If omission clears comments in the confirmed contract, send each existing feedback explicitly instead.
- [x] Refresh submission and answers after successful writes. Return manual_pending when any question remains unresolved. Check refreshed score validity/completion and build final-review request with preserved note, no unsaved changes, and confirmed complete answers. A final review must be allowed by existing lifecycle rules. Finalize through `reviewHomeworkSubmission` and confirm reviewed state before sync.
- [x] Gate sync by grading mode, permissions, a fresh linked sync status, and target lock. If status loading fails, return a sync-stage failure rather than guessing no link. Check the sync response's `submissionSync.synced`; false or absent confirmation must not become a successful sync. Preserve completed-review state on every sync failure.
- [x] For resumeFrom sync, fetch the submission and require reviewed status; only load/check sync status and invoke sync. For resumeFrom review, reload answers and validate completion; do not rewrite successful scores. For answer failures, reload all current state and recalculate before retrying. Catch errors with the current stage and return structured failures for the batch service.
- [x] Test no review after partial chunk failure; no sync before confirmed reviewed state; missing/invalid answers block completion; already reviewed manual answers permit completion; ungraded/link/permission/lock outcomes; preserved comments/notes; false sync confirmation; sync failure followed by a sync-only retry that does not call answer or final review endpoints. Apply both guard skills, rerun focused tests, and commit Task 2.

## Task 3: Bulk target resolution and bounded execution

**Files:** Create `services/homeworkAutomaticCorrectionBatch.ts` and `services/__tests__/homeworkAutomaticCorrectionBatch.test.ts`.

**Consumes:** Task 2 context/result/executor and `listHomeworkSubmissions`.

**Produces:**

```ts
export type HomeworkCorrectionScope = "all" | "filtered";
export interface HomeworkCorrectionProgress { processed: number; total: number }
export function collectHomeworkCorrectionTargets(
  homeworkId: string,
  assignmentStatus: HomeworkAssignmentStatus,
  scope: HomeworkCorrectionScope,
  filters: HomeworkSubmissionListFilters,
): Promise<string[]>;
export function runHomeworkAutomaticCorrectionBatch(args: {
  context: HomeworkCorrectionContext;
  submissionIds: readonly string[];
  retryStages?: Readonly<Record<string, HomeworkCorrectionStage>>;
  onProgress?: (progress: HomeworkCorrectionProgress) => void;
}): Promise<HomeworkCorrectionResult[]>;
```

- [x] Write the paginated filtered-scope test: return two pages, repeat an ID across pages, include draft/reviewed rows, and assert only unique submitted/late IDs are returned. Assert both calls retain applied status/search filters, while all scope removes them.
- [x] Run only the new batch test; expect import failure before implementation.
- [x] Resolve targets with page=1 and limit=100 independent of the visible table's pagination. Continue according to returned pagination total/limit, stop on empty results, and fail instead of looping when pagination does not advance. Freeze status/search at confirmation time. Deduplicate IDs and filter through existing answer-review eligibility.
- [x] Implement three workers sharing an index over deduplicated IDs. Await Task 2 execution per student, collect structured results in input order, and call progress after each completed result. Pass retryStages only for failed students; do not expand retry into a fresh all/filtered target scan. Zero targets completes without requests.
- [x] Test per-student failure isolation, late eligibility, exclusion after fresh state changes, progress reaches total, no more than three student executions in flight, empty scopes, all-scope filter removal, and sync-only retry routing. Apply both guards, run focused tests, and commit Task 3.

## Task 4: Correction UI and review-panel integration

**Files:** Create the hook, dialog and summary files listed above and `components/__tests__/HomeworkAutomaticCorrectionDialog.test.tsx`. Modify `components/HomeworkSubmissionReviewPanel.tsx` and its existing test file. Modify both locale JSON files.

**Consumes:** Task 1-3 contracts. Existing panel has `hasUnsavedChanges`, `statusFilter`, `appliedSearch`, `loadSubmissions`, `loadSubmissionDetail`, and permission flags. Reuse their current behavior.

**Produces:** Single-student and bulk controls with shared results and a stage-specific retry action.

- [x] Add a panel integration test arranging one single-choice question and a submitted student. Mock server transitions after writes; click single Auto-correct and assert answer writes, final review, and sync occur. Add a separate manual-pending case asserting no final-review or sync calls. Use existing panel test helpers and real accessible button names through the test translation mock.
- [x] Run only the panel tests with the new case selected; expect failure because the action is absent.
- [x] Implement hook inputs: homework ID, assignment status, total marks, grading mode, manage/view/sync permissions, unsaved-edit state, and an async completion refresh callback. The hook owns one ref lock acquired synchronously before async work, active scope, target loading, progress, results, and failed-stage retry mapping. Fetch question definitions explicitly for correction and show loading errors; the panel's silent question-load failure must not permit scoring with empty definitions.
- [x] Add dialog using the existing Modal and Select/Button components. Disable confirmation until eligible targets load; prevent close/escape/overlay dismissal during execution. Add a progress live region and native progress element:

```tsx
<div role="status" aria-live="polite">
  {t("progress", { processed: progress.processed, total: progress.total })}
</div>
<progress value={progress.processed} max={Math.max(progress.total, 1)} />
```

- [x] Single action runs one submission with the same context/executor. Bulk action opens the scope dialog, resolves all eligible pages, and confirms the displayed count before execution. Show overwrite/completion/sync explanation before writes. Disable correction while there are unsaved edits and explain save/discard first using existing controls; do not silently discard drafts.
- [x] Add the new active-action state to every conflicting mutation/navigation control and to the callback guards, including answer save, save-all, final review, sync, student switching, filter changes and pagination. Register beforeunload only while correction is active and remove it after completion. Catch refresh failures separately so successful writes remain reported; permit reloading without recorrection.
- [x] Refresh list, selected detail if still visible, and sync status after operations. Avoid fetching state for a stale selected student or unmounted component. Render summaries with separate completed review/synced/unsynced/manual/missing/invalid/skipped/failure counts. Retry buttons resume failed stages; missing-link results point to the existing linking flow rather than creating links.
- [x] Add matching English and Arabic keys: title, singleAction, bulkAction, scopes.all, scopes.filtered, eligibleCount, explanation, unsavedEdits, progress, correctedAnswers, completedReviews, syncedGrades, manualPending, missingAnswers, invalidDefinitions, skippedStudents, syncUnavailable, syncReasons.ungraded/permission/unlinked/locked, failures, retryFailed, keepPageOpen, loadFailed, refreshFailed, confirm, cancel, and noTargets. Use translated reason labels rather than raw API errors.
- [x] Test permission absence, unsaved changes, all vs filtered confirmation, progress, failed retry, manual warnings, unsynced completed review, conflict locks, server refresh and focus behavior. Extend existing panel mocks to cover the new service calls without changing unrelated assertions. Apply both guard skills, rerun affected tests, and commit Task 4.

## Task 5: Verification, documentation and owner handoff

**Files:** Review the complete diff, update `docs/hw-b-dashboard-homework-submissions-review-surface.md` with shipped controls and limits, and complete this plan's checkboxes as work finishes.

- [ ] Run focused tests in one invocation:

```powershell
& {
  npm run test:run -- src/features/academics/homework/utils/__tests__/homeworkAutomaticCorrection.test.ts src/features/academics/homework/services/__tests__/homeworkAutomaticCorrectionExecution.test.ts src/features/academics/homework/services/__tests__/homeworkAutomaticCorrectionBatch.test.ts src/features/academics/homework/components/__tests__/HomeworkAutomaticCorrectionDialog.test.tsx src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx src/features/academics/homework/utils/homeworkReview.test.ts src/features/academics/homework/services/__tests__/homeworkApiAdapter.test.ts
}
```

- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run build` with checked exit codes. Do not run bare `npm run test:run` until the owner approves the full suite. Report existing baseline warnings separately from new failures.
- [ ] Run clean-code-guard on the final production diff and test-guard on the final test diff. Use docs-guard to verify shipped behavior in the review-surface document. Correct claims about unresolved blank records, objective overwrite and conditional sync.
- [ ] Validate locale JSON parsing and matching new key sets. Check UI manually when a local authenticated session is available; report any unavailable visual verification accurately.
- [ ] Ask the owner to authorize the full suite after the concrete implementation and focused checks are ready. If approved, run it and resolve task regressions before final handoff. If declined, record the suite as not run; do not claim full verification.
- [ ] Review `git diff --check` and `git status`, commit only task files, normally push `codex/homework-auto-correction`, and create/update its one Draft PR against main. Write PR body to a temporary file and use `--body-file`; attach the created PR with the Codex artifact tool. Do not merge or deploy.
- [ ] Provide the required handoff fields from `Must Read Before Push.txt`, actual check outcomes, known limitations, and status READY_FOR_OWNER_REVIEW only when the required checks are complete.

## Plan self-review

The five tasks cover single and bulk actions, deterministic grading, blank/missing/manual cases, overwrite behavior, automatic completion, conditional sync, permissions, pagination, partial failures, stage retries, UI state and localization, verification and delivery. Interfaces above are proposed exports to be created by their owning tasks; imports from existing modules were checked against the current source. No full-suite run is authorized by this plan. Backend contract gaps discovered during implementation must be reported rather than repaired in the backend repository.

## Execution record — October 13, 2026

Tasks 1–4 are implemented and reviewed inline. The focused checks cover 90 passing tests across seven files; lint, typecheck, production build, and matching new Arabic/English locale keys pass. Clean-code-guard and test-guard were applied to the implementation and test diffs; docs-guard checked the review-surface update. The owner declined the full test suite, so it remains unrun. No authenticated live UI or backend integration smoke test was performed. Final delivery steps are tracked through the Draft PR and developer handoff.

## Scoring revision — October 13, 2026

The owner requested proportional multiple-choice credit for assessments and homework, with a deduction of the same share for each incorrect selection and a minimum score of zero. Both engines now use `src/lib/grading/multipleChoiceScore.ts`: question points × max(0, selected correct count − selected incorrect count) / total correct count, rounded once to two decimal places. Unknown or duplicate option IDs remain invalid; single-choice and true/false scoring is unchanged. The scoring and workflow regression checks pass with 136 focused tests across 11 files. Typecheck passes. This revision remains on the same branch and PR #86; the full-suite opt-out remains in effect.
