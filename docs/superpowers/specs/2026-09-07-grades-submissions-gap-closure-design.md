# Grades Submissions Gap Closure Design

## Goal

Complete the School Dashboard grades-submissions frontend coverage around the current backend contract, while replacing duplicate correction experiences with one canonical, accessible review page.

## Contract Authority

The backend is read-only for this frontend task. The authoritative contract is defined by:

- `src/modules/grades/assessments/controller/grades-submissions.controller.ts`
- `src/modules/grades/assessments/controller/grades-submission-review.controller.ts`
- `src/modules/grades/assessments/dto/grade-submission.dto.ts`
- `src/modules/grades/assessments/dto/grade-submission-review.dto.ts`
- `src/modules/grades/assessments/presenters/grade-submission.presenter.ts`

The frontend must not change backend routes, DTOs, permissions, or lifecycle rules.

## Canonical Workflow

The dedicated submission detail route is the only correction workspace:

```text
Gradebook or submissions list
          ↓
Resolve submission when needed
          ↓
/grades/submissions/{submissionId}
          ↓
Answer entry or correction based on status and permissions
          ↓
Save one / Save all
          ↓
Submit or finalize review
          ↓
Sync grade item
```

The Gradebook correction action resolves the submission and navigates to this route. The legacy correction modal is removed from the active flow so question rendering, validation, review fields, and lifecycle actions cannot drift between two interfaces.

## Submission List Filters

`AssessmentSubmissionsPage` keeps search and status filters and adds a cascading academic scope:

```text
Grade → Section → Classroom
```

- Selecting a grade limits the available sections.
- Selecting a section limits the available classrooms.
- Changing a parent clears any invalid descendants.
- Clearing a parent clears all descendants.
- The request sends only the backend-supported `gradeId`, `sectionId`, and `classroomId` values.
- Filter options come from the existing grades bootstrap source and reuse existing `src/components/ui` inputs.
- If bootstrap loading fails, search, status, and the submissions list remain usable. The page shows a translated non-blocking warning for the unavailable scope filters.

## Canonical Submission Detail Page

`GradeSubmissionPage` owns the submission lifecycle and permissions:

- `in_progress` plus `grades.submissions.submit`: answer entry and submission.
- `submitted` plus `grades.submissions.review`: individual and bulk correction.
- `corrected` plus `grades.submissions.review`: read-only correction details and grade-item synchronization.

The existing question renderer remains responsible only for the student's response across all eight question types. Correction controls move into a focused child component so answer rendering, review draft state, and API actions have separate responsibilities.

## Bilingual Correction Drafts

Each answered question exposes three review values:

- Awarded points, constrained to `0..answer.maxPoints`.
- Optional English reviewer comment, maximum 2,000 characters.
- Optional Arabic reviewer comment, maximum 2,000 characters.

The initial review draft is derived from the latest backend answer. A question is dirty only when one of these three values differs from that initial snapshot. The UI never reads, displays, or otherwise uses `reviewedById`.

Each question card displays an explicit local state: unchanged, unsaved, saving, saved, or failed. Color is not the only indicator. Arabic and English labels are translated, and the fields use existing accessible UI inputs.

## Individual and Bulk Review

The existing per-question save remains available. A sticky or consistently visible `Save all reviews` action sends only dirty, valid answers to the bulk-review endpoint.

- An empty dirty set disables bulk save.
- Invalid points or oversized comments block the request and identify the affected question.
- A successful individual or bulk save reloads the submission detail from the backend and replaces both initial and current drafts with the returned source of truth.
- Review actions are mutually disabled while a review request is active to prevent overlapping writes.
- A failed request preserves unsaved drafts and displays the mapped backend error.

Finalization is enabled only when:

- The submission is still `submitted`.
- There are no unsaved review drafts.
- The backend progress reports zero pending corrections.

The disabled finalization control explains whether unsaved changes or pending corrections are blocking it.

## Navigation and Unsaved Changes

The Gradebook correction action calls the existing resolve endpoint. On success it navigates to the canonical submission detail route with a trusted Gradebook return target. On failure it stays on the Gradebook and shows the mapped error.

The canonical page provides a visible return action. If correction drafts are dirty, browser navigation, the return action, or another in-app navigation prompts before discarding them. No prompt appears after a successful save or when no review drafts changed.

## Error and Stale-State Handling

- Raw backend messages and internal UUIDs are not shown to users.
- Existing grades error mapping remains the source for translated domain errors.
- A trace ID is shown only when supplied by the mapped error and is labeled for support.
- If the backend reports an invalid lifecycle transition or already-finalized review, the page reloads the submission before rendering the error so actions reflect the current server status.
- Scope-filter bootstrap errors do not replace a successfully loaded submissions table.

## Question Answer Contract

- MCQ single, MCQ multi, and true/false use `selectedOptionIds`.
- Matching uses the documented object-shaped `answerJson` mapping.
- Short answer, essay, fill-in-the-blank, and media responses use `answerText` in the current UI.
- The frontend does not invent additional `answerJson` schemas for text or media questions.
- Existing media questions continue to expose the assessment media link and a text response field.

## Component Boundaries

- `AssessmentSubmissionsPage`: query filters, list loading, and navigation.
- A submissions filter helper or hook: cascade derivation and request-filter construction.
- `GradeSubmissionPage`: detail loading, lifecycle actions, draft orchestration, and unsaved-change protection.
- `SubmissionQuestionAnswerField`: student answer rendering and entry only.
- `SubmissionAnswerReviewFields`: bilingual review inputs, validation presentation, and local review state.
- A review-draft utility: initial snapshot creation, dirty detection, validation, and bulk payload construction.
- Gradebook service/workspace: resolve and navigation only; no duplicate review form.

No new state-management library or UI dependency is introduced.

## Testing and Verification

Implementation follows focused red-green-refactor cycles.

Automated coverage includes:

- Cascade reset and option filtering behavior.
- Correct list request parameters.
- Bilingual review draft initialization and dirty detection.
- Bulk payload construction from dirty answers only.
- Awarded-point and comment-length boundaries.
- Finalization gates for pending corrections and unsaved drafts.
- Resolve success navigation and resolve failure behavior from Gradebook.
- Status and permission action gates.

Manual UI verification covers Arabic and English at mobile, tablet, and desktop widths, keyboard focus, readable status indicators, and the absence of horizontal scrolling.

Every production-code change receives a `clean-code-guard` pass. Every test change receives a `test-guard` pass. Focused tests, ESLint, TypeScript, and `git diff --check` run during implementation. The full test suite and production build require explicit user approval before execution.

## Non-goals

- Backend changes.
- Displaying or using `reviewedById`.
- Displaying raw answer creation/update timestamps in the primary review UI.
- Inventing new `answerJson` formats.
- Keeping two independently maintained correction forms.
- Refactoring unrelated grades, homework, timetable, or reinforcement features.
