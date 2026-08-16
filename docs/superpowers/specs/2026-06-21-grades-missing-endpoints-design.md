# Grades Missing Endpoint UI Design

## Scope

Complete UI coverage for the Grades backend endpoints that currently lack a user workflow:

- `GET /grades/overview`
- `GET /grades/assessments/:assessmentId/submissions`
- `PUT /grades/submissions/:submissionId/answers/:questionId`
- `PUT /grades/submissions/:submissionId/answers`
- `POST /grades/submissions/:submissionId/submit`
- `PATCH /grades/submissions/:submissionId/answers/:answerId/review`

Existing bulk review, review finalization, and grade-item synchronization remain part of the same submission workflow.

## Backend Contract

The backend repository at `E:\Moazez-Backend` is authoritative. API types preserve backend enum casing and response structure. UI models and labels are derived through explicit mappers.

The overview request uses the active year, required term, and selected subject/scope filters. Its response supplies totals, performance, completion, assessment rows, effective rule, and backend-provided empty-state information.

Submission listing supports backend filters for status, classroom, section, grade, and search. Submission entry requires `grades.submissions.submit`; review requires `grades.submissions.review`; listing and detail require `grades.submissions.view`.

## User Experience

### Overview

The existing overview screen will consume `GET /grades/overview` as its primary aggregate source. Cards and assessment summaries show only fields returned by that endpoint. The backend empty-state reason and message drive the empty state. Bootstrap remains responsible for context selectors.

### Submission Roster

Question-based assessments expose a submissions action from the assessment workspace. The roster shows student identity, class context, submission status, answered progress, pending correction count, and submission time. Search and status filters map directly to backend query parameters. Selecting a row opens the submission workspace.

### Submission Workspace

The workspace uses `GET /grades/submissions/:submissionId` and renders questions in sort order. Editable answer controls depend on question type and are enabled only while the backend submission state permits entry. Users can save one answer or save all changed answers. Submit is a distinct confirmed action and is disabled until required-answer progress is complete.

### Review Workspace

Submitted answers expose awarded points and bilingual reviewer comments. A reviewer can save one answer through the PATCH endpoint or save all changed reviews through the existing bulk endpoint. Finalize and sync remain explicit sequential actions with visible state transitions and error feedback.

## Architecture

- Add exact overview and submission DTO types under the Grades API type boundary.
- Add pure mappers for overview, submission roster, answer entry, and review presentation.
- Extend Grades services with one function per backend operation.
- Add submission roster and submission detail routes under the existing Grades assessment routes.
- Keep data fetching and mutations in page/workspace containers; keep question controls presentational.
- Reuse the existing API error mapper, design-system controls, CSS variables, and `next-intl` message structure.

## State And Errors

Loading, empty, forbidden, not-found, conflict, validation, and retry states are explicit. Mutations disable only the affected controls. Failed saves preserve local edits. No mock data or fallback service is introduced. Backend status transitions and error codes determine which actions are available.

All coded Grades domain errors and every `validation.failed` message emitted under `src/modules/grades` are classified centrally. The frontend translates them in English and Arabic and preserves backend `details.field`, `details.reason`, and `traceId` for contextual form feedback and support diagnostics. Unknown backend errors use status-based fallbacks rather than exposing backend English messages directly.

## Testing

Contract tests are written first for endpoint paths, query parameters, payloads, and enum casing. Mapper tests cover empty, partial, and populated responses. Focused component tests cover roster empty states and submission action availability. Final verification runs the focused tests, lint, typecheck, and production build.
