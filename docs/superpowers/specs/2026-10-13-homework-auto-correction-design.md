# Homework Auto-correction Design

## Approved scope

Add teacher-triggered auto-correction to homework, for one student and for a bulk selection. Bulk scope is either all eligible submissions for the homework or all eligible submissions matching the current filters, across pagination. When all correction is complete, finish the submission review and synchronize its grade when synchronization is available.

This is a School Dashboard frontend change using the existing homework APIs. It does not introduce backend grading, correction on student submission, AI grading, new question types, or gradebook linking without teacher action.

## Existing implementation

Assessment correction currently calculates objective scores in the frontend, overwrites existing objective scores on repeat runs, and finalizes and syncs submissions without remaining manual correction. Its older design document contains contradictory preservation requirements; the current implementation is the reference for repeat-run behavior.

Homework exposes question definitions, submission details, answer records, bulk answer review, final submission review, and per-submission grade synchronization through `src/features/academics/homework/services/homeworkService.ts`. The adapter writes answer scores as `awardedPoints`; answer review requires an existing answer ID. The current bulk review helper chunks writes at 100 answers.

The homework review panel uses `homework.submissions.view` and `homework.assignments.manage`. Grade-sync status additionally requires `homework.assignments.view` and `grades.items.view`; synchronization requires assignment management and `grades.items.manage`.

## Grading rules

- Single choice: full question points only for exactly one selected option matching the single correct option; otherwise zero.
- Multiple choice: divide question points equally among all correct options. Award the share for each selected correct option, without deducting for selected incorrect options. Score = question points × selected correct count / total correct count, rounded once to two decimal places. Selecting no correct options earns zero; selecting all correct options earns full points even with additional incorrect options. Order does not matter. Duplicate or unknown option IDs and malformed definitions remain unresolved.
- True/false: full points for a selected option matching the configured boolean key; otherwise zero. Use the homework question representation and validate its answer key.
- An existing objective answer record with no selection receives zero.
- A question without an answer record remains unresolved. No answer record is created and no zero score is guessed because review requires an answer ID.
- Short answer, essay, and any other unsupported types receive no automatic score. Existing valid manual reviews remain usable; unreviewed manual questions remain unresolved.
- Missing question definitions, invalid keys, invalid point values, and ambiguous answer-to-question associations remain unresolved and appear in the result summary.
- Repeat runs recalculate existing objective scores, including teacher-entered objective scores. Preserve feedback and submission review notes.
- Homework without questions is skipped by auto-correction; its existing manual submission review remains available.

## Eligibility and completion

Use the existing homework reviewability rules: answer correction is available for published or closed homework with submitted or late submissions. Draft, reviewed, cancelled, archived, and other ineligible states are excluded from new correction. Students who have not submitted homework are skipped without assigning a grade.

Finish the submission review only after fresh API answers confirm that every assigned question is resolved, including optional questions. A missing answer record or an invalid objective key blocks automatic completion even if the existing manual final-review control has less strict required-question rules. A supported question is resolved by its successful automatic review; a manual question is resolved by an existing valid manual review.

After answer writes, reload server state and use the existing submission review request builder and score validation before finishing review. Do not finish review after a partial answer-write failure, inconsistent refreshed state, or score validation failure.

For graded homework, synchronize the completed review when the homework has an available gradebook link, the target is unlocked, and the user has the required permissions. For ungraded homework, finish review without attempting sync. When a link or permission is unavailable, retain the completed review and show why the grade was not synced. Never silently create a gradebook link.

## Implementation boundaries

Keep the pure grading calculation separate from network orchestration and UI state. Share objective scoring logic with assessments only where their representations and rules align; preserve existing assessment behavior. Avoid unrelated refactoring of the homework review panel.

Single-student execution loads current submission data and answer definitions, builds the correction plan, saves eligible answer scores through the existing chunked bulk-review operation, refreshes answers, finishes review when safe, and attempts grade sync. Each stage records its result separately.

Bulk execution loads definitions once, gathers eligible submission IDs across all matching pages, deduplicates IDs, and processes students with a small bounded queue. Recheck eligibility from each current submission before writes. A student failure does not stop others. Keep successful writes when later stages fail; this workflow is not transactional.

Retry only failed students and resume from their unfinished stage. A reviewed submission whose sync failed retries sync without rewriting answers or attempting review completion again. For failed answer writes, reload server state before recalculating. Retry authorization and eligibility are checked again.

## User experience

Add a single-student Auto-correct action to the existing homework submission review surface and a bulk action with all-homework/current-filters scope selection. Confirm scope and eligible student count before writes. Explain supported types, overwrite behavior, automatic review completion, and conditional grade synchronization.

Resolve unsaved answer or submission review edits before starting correction. Use the existing save/discard interaction where suitable. Lock conflicting local actions while correction runs and prevent duplicate execution.

Show accessible processed/total progress. Keep the page open during execution; provide a navigation warning while work is active. Show distinct counts for corrected answers, completed reviews, synchronized grades, unresolved manual questions, missing answer records, invalid definitions, skipped students, unavailable synchronization, and failures. Do not label a completed but unsynced review as synced.

After writes, refresh the selected student's answers and submission, the submissions list, and relevant sync status. Offer retry for failed operations, including a sync-only retry after review completion. A missing link uses the existing grade-linking flow before a later sync attempt.

Reuse components in `src/components/ui`. Add Arabic and English copy and preserve keyboard access, focus management, disabled/loading states, and live progress announcements.

## Failure handling

Use existing homework error mapping. Fail closed when question definitions or submission answers cannot be loaded. Check current status before writes and respect server errors for concurrent review, locks, authorization, and validation. Refresh state after uncertain or partial writes before allowing a retry.

When grade synchronization fails after review completion, retain the completed review, report sync failure explicitly, and offer a sync-only retry. Never report a failed write as successful or erase teacher comments during correction.

## Verification and delivery

Focused unit checks cover objective scoring, blank records, absent records, invalid keys, mixed manual/objective questions, already reviewed manual answers, objective overwrite behavior, and completion eligibility.

Focused service checks cover chunked answer writes, refreshed-state validation before final review, partial writes, successful completion and sync, missing links, unavailable permissions, ungraded homework, sync-only retry, pagination, status changes, deduplication, and continuing after individual failures.

Focused UI checks cover permission gating, scope confirmation, unsaved edits, action locking, progress/results, manual warnings, retries, and refreshed state. Review every production-code change using clean-code-guard and every test change using test-guard. Run focused tests, lint, typecheck, and build; ask the owner before running the full test suite.

Follow `Must Read Before Push.txt`: one task branch from current main, normal commits and push, one Draft PR, no main push, no merge, no deployment, and no backend changes. Report any backend dependency before expanding scope.

## Acceptance criteria

1. An authorized teacher can auto-correct a submitted or late student and use either bulk scope across all matching pages.
2. Multiple-choice answers receive proportional credit without deductions, rounded to two decimal places; single choice and true/false retain full-or-zero scoring. Repeat runs recalculate scores without erasing feedback.
3. Blank existing objective records receive zero; absent answer records remain unresolved. Non-submitting students receive no grade.
4. Unresolved manual work or invalid data blocks automatic review completion; valid existing manual reviews can permit completion.
5. A fully resolved submission is reviewed and its grade synced when available. Missing links, permissions, and sync failures have distinct visible outcomes.
6. Failures preserve successful work, and retries resume unfinished stages, including sync after a completed review.
7. The feature uses existing homework APIs and UI components, with Arabic and English translations.
