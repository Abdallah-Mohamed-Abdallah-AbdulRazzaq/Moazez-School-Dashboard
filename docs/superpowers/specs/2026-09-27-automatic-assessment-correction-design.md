# Automatic Assessment Correction Design

## Summary

Add teacher-triggered, frontend-calculated correction for deterministic assessment questions. The dashboard will calculate scores for supported objective answers, save those scores through the existing submission review endpoints, and leave finalization and grade synchronization under teacher control.

The same change retires Matching, Fill-in-the-blank, and Media question types from new assessment authoring while preserving historical questions and submissions as read-only records.

## Goals

- Let an authorized teacher auto-correct one submitted student or a selected group of submitted students.
- Auto-grade only Single choice, Multiple choice, and True/false questions.
- Preserve all answers that have already been reviewed.
- Warn teachers when manual correction remains on both the submissions list and submission detail page.
- Require an explicit teacher action to finalize a corrected submission.
- Remove Matching, Fill-in-the-blank, and Media from new assessment authoring without deleting historical data.
- Reuse the existing question-read and submission-review API contracts.

## Non-goals

- No AI grading or similarity-based text grading.
- No automatic correction on student submission.
- No automatic finalization or grade-item synchronization.
- No backend endpoint or data-model change.
- No automatic grading of Short answer, Essay, Matching, Fill-in-the-blank, or Media questions.
- No deletion or migration of legacy questions.

## Existing Constraints

The submission detail response does not include answer keys. The dashboard must fetch assessment question definitions through the existing questions endpoint before calculating scores.

The existing review endpoints update answers by `answerId`. An unanswered question may have no answer record. Because this design remains strictly frontend-only, an objective question without an answer record cannot be assigned zero automatically. It remains pending and is reported as requiring manual correction.

The current response identifies whether an answer has been reviewed but does not reliably distinguish an automatic review from a manual override. Auto-correction will therefore preserve every previously reviewed answer.

## Supported Grading Rules

### Single choice

Award the full question points only when the student's selected option set contains exactly one option and that option is the single correct option. Otherwise award zero.

### Multiple choice

Use all-or-nothing scoring. Compare option IDs as sets, independent of order. Award the full question points only when the selected set exactly equals the complete set of correct options. Any missing correct option or extra incorrect option produces zero.

### True/false

Award the full question points only when the submitted boolean value equals the configured answer key. Otherwise award zero.

### Blank objective answers

If an answer record exists but contains no selection/value, award zero. If no answer record exists, skip it because the existing review endpoint has no `answerId`; keep it pending for manual handling.

### Manual and retired types

Short answer, Essay, Matching, Fill-in-the-blank, and Media are never auto-graded. They remain pending until a teacher reviews them.

### Invalid definitions

Do not guess when an answer key is missing, contradictory, or structurally invalid. Skip the answer, keep it pending, and include it in the result summary.

## Architecture

### Pure grading engine

Add a focused utility within the grades submissions feature. It accepts assessment question definitions and a submission detail record, and returns:

- review payloads for eligible unreviewed objective answers;
- counts for corrected answers, manual answers, preserved reviews, missing answer records, invalid definitions, and skipped answers;
- stable reason codes that the UI can translate.

The utility performs no network requests and contains no UI state. Question-type predicates and set comparison helpers remain small and independently testable.

### Single-submission orchestration

The submission detail page loads the submission and question definitions through the existing services. When the teacher selects **Auto-correct objective questions**, it runs the grading engine and sends one existing bulk-review request for that submission. It then reloads the submission from the API before presenting the result.

The action is available only when:

- the submission status is `submitted`;
- the assessment is not locked under existing workflow rules;
- the user has both `grades.submissions.review` and `grades.questions.view`;
- no other submission action is running.

### Assessment-wide orchestration

The submissions page exposes **Auto-correct** and asks the teacher to choose one scope for each run:

1. all eligible submitted students in the assessment; or
2. eligible submitted students matching the current filters.

The page fetches assessment question definitions once, resolves the target submission rows, then processes submission details through a small concurrency-limited queue. Each student produces at most one existing bulk-review request. A failure for one student does not stop the remaining students.

The operation remains in the active page. Navigation is discouraged while it runs, and the dialog explains that the page must remain open until completion.

### Permissions

Auto-correction requires both `grades.submissions.review` and `grades.questions.view`. Without either permission, the correction controls are not actionable. Existing viewing behavior remains unchanged.

## Manual Override Preservation

Any answer with an existing review state or review timestamp is excluded from generated review payloads. This rule preserves manual corrections and also makes repeat runs safe. Due to the existing contract, repeat Auto-correct cannot intentionally recalculate an already auto-corrected answer; it is preserved like any other reviewed answer.

## User Experience

### Submissions list

- Place an **Auto-correct** action near the page heading using the existing UI button.
- Open an existing UI-folder dialog that offers **All assessment** and **Current filters** scopes.
- Show the eligible student count before confirmation.
- Explain which statuses are excluded and that previous reviews are preserved.
- During correction, disable conflicting actions and announce processed/total progress accessibly.
- After completion, show counts for students processed, objective answers corrected, manual answers remaining, reviews preserved, missing answer records, invalid keys, skipped submissions, and failures.
- Offer **Retry failed students** when failures occur. The retry targets only the failed submission IDs.
- Show a **Needs manual correction** warning badge for submitted rows when the assessment has manual question types and pending corrections remain.

Filters affect the correction scope only when the teacher explicitly selects **Current filters**. Selecting **All assessment** ignores the table filters.

### Submission detail

- Place **Auto-correct objective questions** alongside the existing review controls.
- Show a warning banner above the answer list whenever manual correction remains.
- Include the reliable manual-pending count when it can be derived from current question and answer data.
- Reload API state after a successful review request.
- Present successful objective correction with a warning when manual questions remain; do not describe the submission as complete.
- Keep the existing Finalize action disabled until `pendingCorrectionCount` is zero.
- Never invoke finalization or grade synchronization from Auto-correct.

### UI implementation constraints

Reuse components from `src/components/ui` for buttons, dialogs, alerts, progress, tables, and feedback. Add Arabic and English translations. All loading, disabled, focus, keyboard, and live-status behavior must remain accessible.

## Retiring Unsupported Question Types

Matching, Fill-in-the-blank, and Media are removed from every new-question selector and creation path in the assessments module.

For existing assessments:

- continue rendering the question and submitted answer;
- mark the question **Legacy question — read only**;
- prohibit editing, duplication, reordering, and recreation through the dashboard;
- retain the question in historical totals and ordering;
- treat it as requiring manual correction;
- keep shared types and renderers needed to consume historical API data.

Frontend validation must reject attempts to create or update a retired type, including attempts originating from stale component state or direct navigation. No stored record is deleted or hidden from historical review.

## Error Handling and Recovery

- Validate all grading inputs before creating review payloads.
- Treat missing/invalid keys and missing answer records as skips, not guessed scores.
- Limit concurrent detail and review requests to a small fixed number.
- Continue after individual student failures and retain per-student failure details.
- Do not roll back students already corrected when a later student fails.
- Map locked, finalized, stale, permission, and validation failures through the existing grades error handling.
- Reload server state after successful writes and after stale-state failures where current behavior already does so.
- Prevent duplicate local execution with the existing action-lock pattern.
- Retry only failed submissions; never resend successful submissions as part of the retry action.

## Testing Strategy

### Unit tests

- Single-choice correct, incorrect, empty, and malformed-key cases.
- Multiple-choice exact set equality, order independence, missing option, and extra option cases.
- True/false correct, incorrect, and empty cases.
- Objective blank with an answer record scores zero.
- Objective question without an answer record is skipped and remains pending.
- Manual and retired types never create review payloads.
- Previously reviewed answers are preserved.
- Mixed submissions produce correct summary counts.

### Component and page tests

- Correction actions require both permissions and a submitted state.
- Detail action sends only eligible reviews and reloads server state.
- Bulk scope choice distinguishes all-assessment from current-filter targets.
- Progress, completion summaries, partial failures, and retry behavior render correctly.
- Manual-warning badges and banners appear and clear based on refreshed state.
- Finalize and sync are never called by Auto-correct.
- Retired types are absent from creation selectors but historical types remain visible and read-only.
- Arabic and English translation keys are complete.

### Verification policy

Run focused affected tests, lint, and typecheck during implementation. Ask the owner before running the full test suite. Review every production-code change with the clean-code-guard skill and every test-code change with the test-guard skill.

## Delivery Scope

This design is one School Dashboard task, branch, and pull request. It makes no Backend repository changes. Implementation must begin from the latest `origin/main` in an isolated feature branch and must not include unrelated work from the existing dirty checkout.

## Acceptance Criteria

- A permitted teacher can auto-correct one submitted student without finalizing or syncing the submission.
- A permitted teacher can choose all-assessment or current-filter scope for a bulk run.
- Supported objective answers receive deterministic full-or-zero scores according to this specification.
- Existing reviews are never overwritten.
- Unsupported/manual answers and objective questions lacking answer records remain pending with visible warnings.
- Partial bulk failures do not erase successful corrections and can be retried by failed submission.
- Matching, Fill-in-the-blank, and Media cannot be newly authored or edited, while historical content remains visible read-only.
- Finalization remains an explicit teacher action and is blocked while pending correction exists.
- The feature uses only existing question-read and submission-review endpoints.
