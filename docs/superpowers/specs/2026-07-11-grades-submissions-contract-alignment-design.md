# Grades Submissions Contract Alignment Design

## Goal

Align the dashboard grades-submissions integration with the backend contract at `Moazez-Backend` commit `37a6fd9`. The change must correct runtime status behavior, response types, and client-side request validation without changing backend routes.

## Contract source

The authoritative backend files are:

- `src/modules/grades/assessments/controller/grades-submissions.controller.ts`
- `src/modules/grades/assessments/controller/grades-submission-review.controller.ts`
- `src/modules/grades/assessments/dto/grade-submission.dto.ts`
- `src/modules/grades/assessments/dto/grade-submission-review.dto.ts`
- `src/modules/grades/assessments/presenters/grade-submission.presenter.ts`

The backend presents submission statuses in lowercase: `in_progress`, `submitted`, and `corrected`. Query status values remain compatible because the backend normalizes query values to uppercase before enum validation.

## Design

### Response models

Replace the broad assessment and question reuse in `src/features/grades/gradebook/types/api.types.ts` with submission-specific response interfaces.

- The submission assessment summary allows `null` and contains only `id`, `titleEn`, `titleAr`, `deliveryMode`, `approvalStatus`, and nullable `maxScore`.
- Embedded submission questions contain only `id`, `type`, `prompt`, `promptAr`, `points`, `sortOrder`, `required`, and nullable `answer`.
- Submission detail `maxScore` is nullable.
- Submission status fields use a shared lowercase union matching the presenter output.
- Fields always returned by the backend are required; nullable backend fields are represented explicitly rather than as optional values.

The assessment-question endpoint remains the source for choice option definitions. The submission page will continue fetching those definitions separately because embedded submission questions do not contain options.

### Status behavior

The submissions list filter and action gates will use lowercase status values. Translation lookups will map the lowercase runtime status to the existing uppercase message keys, avoiding duplicate translations and keeping the backend contract visible in application state.

The following gates will be corrected:

- Answer editing and submission: `in_progress`
- Answer review and finalization: `submitted`
- Grade-item synchronization: `corrected`

### Request validation

The service boundary will reject payloads that cannot pass backend DTO validation. Shared constants and small validation functions will cover:

- Answer text length: at most 10,000 characters
- Selected option IDs: at most 100 entries
- Bulk answer requests: 1 to 200 entries
- Reviewer comments in either language: at most 2,000 characters
- Bulk review requests: 1 to 200 entries
- Awarded points: finite and greater than or equal to zero
- Submission, assessment, question, answer, enrollment, student, and option identifiers sent through submission services: UUID format

Validation failures will throw a dedicated client error before an HTTP request is made. Existing backend error mapping remains responsible for server responses. UI controls will also expose relevant text limits and disable actions whose current drafts exceed them.

### Tests

Implementation will follow red-green-refactor.

- Contract tests will demonstrate lowercase response status behavior and the corrected nullable/dedicated response shapes at compile time where practical.
- Service tests will verify that valid payloads reach the existing HTTP routes.
- Boundary tests will verify empty, maximum, and over-maximum collections and text values, invalid UUIDs, and invalid awarded points.
- Page-level tests will verify action availability for lowercase statuses and translation-key mapping if existing page test infrastructure supports this without duplicating framework behavior.

The relevant Vitest tests, TypeScript typecheck, and ESLint checks for changed files must pass before completion.

## Non-goals

- Changing backend DTOs, presenters, routes, or permissions
- Adding response normalization to uppercase statuses
- Embedding assessment options in the submission response
- Refactoring unrelated grades or gradebook behavior

