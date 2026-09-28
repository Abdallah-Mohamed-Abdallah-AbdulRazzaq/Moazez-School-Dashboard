# Automatic Correction Finalization Design

## Summary

Extend the existing frontend-only automatic assessment correction workflow so a submission is finalized immediately after its objective scores are saved, but only when no manual correction work remains. Apply the behavior to both the single-submission page and assessment-wide batch correction.

This change uses the existing review and finalization endpoints. It does not synchronize the finalized score to the gradebook automatically.

## Goals

- Finalize a submitted assessment automatically when automatic correction completes all required correction work.
- Apply the same rule to single-submission and batch correction.
- Leave submissions open when a manual question, missing answer record, or invalid answer key still requires teacher attention.
- Preserve successfully saved objective scores when finalization fails.
- Keep batch processing independent so one failed submission does not stop other students.

## Non-goals

- Do not finalize submissions with unresolved manual work.
- Do not auto-grade manual or retired question types.
- Do not synchronize finalized grades to the gradebook.
- Do not add or change backend endpoints, request schemas, or data models.
- Do not add a user preference or feature flag for this behavior.

## Completion Rule

Automatic correction may call the existing finalization endpoint only when all three skip counts in the correction plan are zero:

- `manualCount === 0`
- `missingAnswerCount === 0`
- `invalidKeyCount === 0`

The rule is evaluated from the same deterministic correction plan that produces the objective review payloads. A submission with any unresolved count remains in the submitted state for teacher review.

## Single-submission Flow

When the teacher runs automatic correction from a submitted student's detail page:

1. Build the correction plan from the loaded submission and assessment question definitions.
2. Save all objective review payloads through the existing bulk-review endpoint.
3. If the completion rule passes, call the existing submission finalization endpoint.
4. Reload the submission once after the sequence finishes.
5. Show success only after every required request in the sequence succeeds.

If the correction plan contains no review payloads and no unresolved work, the workflow may proceed directly to finalization. If unresolved work exists, it displays the existing manual-correction summary without attempting finalization.

After successful finalization, the page reflects the corrected state and continues to expose the existing explicit gradebook synchronization action.

## Batch Flow

Each batch worker processes one submitted student independently:

1. Fetch the submission detail.
2. Build its correction plan.
3. Save objective review payloads when present.
4. Finalize the submission when the completion rule passes.
5. Return the student's result without blocking other workers.

A student is reported as successfully corrected only when both score saving and required finalization succeed. Students with unresolved work remain classified as requiring manual correction. Existing concurrency limits and retry scope remain unchanged.

## Error Handling and Retry

- If saving objective scores fails, do not attempt finalization.
- If score saving succeeds but finalization fails, keep the saved scores and report that student's operation as failed.
- On the detail page, surface the existing mapped API error and reload the current server state.
- In a batch, retain the failed submission ID so **Retry failed students** targets it again.
- A retry recalculates and resaves objective scores before retrying finalization. This is safe because automatic correction intentionally overwrites objective scores on every run.
- Never attempt to roll back saved scores after a finalization failure.

## User Experience

- Keep the existing automatic-correction actions and scope selector.
- Update success feedback so it communicates that complete submissions were finalized.
- Keep the manual-correction warning for submissions that were not finalized.
- Do not add a second confirmation dialog; clicking automatic correction already authorizes the correction-and-finalization sequence.
- Keep gradebook synchronization as a separate teacher action after finalization.

## Testing Strategy

### Single submission

- Saves objective scores and then finalizes when no unresolved work remains.
- Finalizes a complete submission even when there are no new review payloads.
- Does not finalize when manual, missing-answer, or invalid-key counts are nonzero.
- Does not finalize when score saving fails.
- Preserves saved scores, reports an error, and reloads state when finalization fails.

### Batch correction

- Saves and finalizes each complete submission in order within its worker.
- Leaves submissions with unresolved work unfinalized.
- Continues processing other students when one finalization fails.
- Includes finalization failures in the retryable failed-submission set.
- Re-runs scoring and finalization for failed submissions on retry.

### Verification policy

Run focused affected tests, lint, and typecheck during implementation. Ask the owner before running the full test suite. Apply clean-code-guard to production-code changes and test-guard to test changes.

## Acceptance Criteria

- Automatic correction finalizes a single submission when all correction work is objective and valid.
- Batch correction finalizes every independently complete submission.
- No submission with unresolved manual work is finalized automatically.
- A finalization failure does not discard already saved objective scores.
- Failed finalizations are visible and retryable.
- Automatic correction never synchronizes the gradebook.
- The implementation remains frontend-only and uses existing endpoints.
