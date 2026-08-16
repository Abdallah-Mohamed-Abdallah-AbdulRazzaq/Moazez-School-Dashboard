# Admissions Applications Module Refactor Design

## Objective

Refactor the dashboard Applications feature around the implemented admissions backend contract, remove mock-shaped behavior, and complete the application, document-review, enrollment-readiness, and accepted-application registration workflows. Existing URLs, bilingual behavior, and surrounding admissions modules remain stable.

## Scope

This design covers:

- application list, create, read, update, and submit;
- application detail composition and related-resource loading;
- application document list, upload/link, accept, reject, replacement request, and delete;
- accepted-application enrollment handoff preview;
- accepted-application registration handoff and final registration;
- permissions, workflow-state guards, errors, loading states, and focused tests;
- migration from the current compatibility-heavy application model and mock creation path.

Placement tests, interviews, decisions, academic selectors, and file upload remain owned by their existing feature modules. Applications consumes their public services and models without absorbing those modules. Unrelated admissions pages and backend changes are out of scope.

## Backend Contract

All routes are relative to `/api/v1` and require the active school scope.

| Capability | Endpoint | Permission |
|---|---|---|
| List | `GET /admissions/applications?status=` | `admissions.applications.view` |
| Create | `POST /admissions/applications` | `admissions.applications.manage` |
| Read | `GET /admissions/applications/:id` | `admissions.applications.view` |
| Update | `PATCH /admissions/applications/:id` | `admissions.applications.manage` |
| Submit | `POST /admissions/applications/:id/submit` | `admissions.applications.manage` |
| Enrollment preview | `POST /admissions/applications/:id/enroll` | `admissions.applications.manage` |
| Registration handoff | `GET /admissions/applications/:id/registration-handoff` | `admissions.applications.manage` |
| Register | `POST /admissions/applications/:id/register` | application manage plus student records, guardians, and enrollments manage permissions |
| List documents | `GET /admissions/applications/:id/documents` | `admissions.documents.view` |
| Link document | `POST /admissions/applications/:id/documents` | `admissions.documents.manage` |
| Accept document | `POST /admissions/applications/:id/documents/:documentId/accept` | `admissions.documents.manage` |
| Reject document | `POST /admissions/applications/:id/documents/:documentId/reject` | `admissions.documents.manage` |
| Request replacement | `POST /admissions/applications/:id/documents/:documentId/request-replacement` | `admissions.documents.manage` |
| Delete document | `DELETE /admissions/applications/:id/documents/:documentId` | `admissions.documents.manage` |

The application list supports only the documented `status` filter. Search remains client-side over the fetched set until the backend contract adds a search query. The UI must not send undocumented application list parameters.

## Architecture

Refactor `src/features/admissions/applications` into explicit boundaries:

```text
applications/
  api/          backend DTOs, payloads, endpoint client
  model/        canonical domain types, mappers, workflow rules
  hooks/        list, details, documents, handoff, mutations
  components/   presentation, dialogs, wizard steps
  pages/        route-level composition
```

### API boundary

The API layer owns wire-format DTOs and endpoint calls. It does not expose raw `unknown` responses to UI code. Response envelope tolerance is centralized only where the shared API client requires it. Application, document, handoff, and registration payloads each receive explicit types.

### Model boundary

A single mapper converts backend application DTOs into one canonical UI model. The model represents backend fields directly, including `requestedAcademicYearId`, `requestedGradeId`, `submittedAt`, timestamps, and `registrationState`. It does not synthesize guardians, documents, tests, interviews, names, dates, or chart history that the application response did not provide.

Related resources remain separate models and load through their owning endpoints. Temporary compatibility selectors may support existing components during migration, but new code cannot add aliases such as both `submittedDate` and `submittedAt` or both `grade_requested` and `gradeRequested`.

Pure workflow predicates provide consistent action rules, including `canSubmitApplication`, `canReviewDocument`, `canPreviewHandoff`, and `canRegisterApplication`. They combine known resource state and permissions for presentation only; backend validation remains authoritative.

### Hook boundary

Focused hooks coordinate remote state:

- list query and URL-backed filters;
- application detail query;
- document query and review mutations;
- application create, update, and submit mutations;
- enrollment preview query-on-action;
- registration handoff query and register mutation.

Each hook exposes typed data, loading, error, retry, and mutation state. Stale requests cannot overwrite newer route/filter state. Successful mutations refresh only affected resources. Workflow transitions do not use optimistic updates.

### Page boundary

Pages compose hooks and components, own route-level empty/not-found states, and contain no DTO mapping. Existing routes under `/:lang/admissions/applications` remain unchanged.

## Application List

The list loads real applications and supports the documented status filter. Search is performed locally and clearly operates over the loaded result set. URL query state remains shareable and invalid values are normalized.

The create flow collects only supported application fields: optional lead, student name, optional requested academic year and grade, and source. The existing multi-step form may retain richer student/guardian fields only if they are explicitly removed from this API submission and presented as later registration data; it must not imply that application creation persists unsupported fields.

The list exposes submit only for an application in `documents_pending` with no `submittedAt`, to users with `admissions.applications.manage`. On success, the affected row is refreshed. Conflict responses replace stale assumptions with the server state or prompt a refresh.

KPIs use only available application fields. Unsupported synthetic weekly chart series, guessed processing dates, and mock trends are removed. Derived counts such as totals by status are allowed and labeled as counts for the current loaded scope.

## Application Details

The detail header shows application ID, student name, status, requested year/grade references, source, submission time, and registration state when available. Edit sends only documented patch fields and omits unchanged values.

Application details and each related resource load independently. A document failure, for example, produces a retry state in the Documents tab without replacing the application header with a global error. Existing details, guardians, documents, tests, interviews, and timeline routes remain addressable; tabs lacking backend data show an honest empty/unavailable state rather than mock content.

Actions are visible only when both permission and known workflow state allow them. Disabled actions include a reason where prerequisites are useful to the operator.

## Document Lifecycle

Document upload is a two-stage operation:

1. upload through the existing Files service and obtain a scoped `fileId`;
2. link it using document type, optional status, and optional notes.

Linking the same document type updates the backend record by contract. The UI communicates this replacement behavior before submission.

Pending-review documents expose accept, reject, and request-replacement actions only when the application is in `submitted`, `documents_pending`, or `under_review`. Accept permits an optional note. Reject and replacement require a trimmed note between 1 and 2,000 characters. Delete requires confirmation and refreshes the document collection after success.

Every mutation has a per-document pending state to prevent duplicate actions. A `409` conflict preserves the record, explains that its application/document state changed, and offers refresh. File metadata and download/view behavior use the returned file object and existing authenticated file route.

## Enrollment Readiness and Registration

For accepted applications, enrollment preview and registration are distinct operations:

- `POST /enroll` is a non-creating readiness preview surfaced as a prerequisite summary;
- `GET /registration-handoff` provides the source-bound draft, warnings, missing fields, document summaries, and current registered state;
- `POST /register` creates or returns the operational student registration.

The registration wizard is the primary accepted-application action. It covers student details, guardians and account modes, enrollment placement, student account mode, and final review. Academic year, term, grade, section, and classroom options come from existing academic services. The route application ID is authoritative and is never copied from editable form data.

Client validation mirrors the documented constraints: student, at least one guardian, enrollment, classroom, and enrollment date are required; account mode is `none`, `create`, or `link`; link requires `userId`; create requires a username no longer than 64 characters. The request preserves backend naming exactly.

Registration requires all four permissions: `admissions.applications.manage`, `students.records.manage`, `students.guardians.manage`, and `students.enrollments.manage`. Missing permissions produce a read-only explanation, not a doomed submit button.

The submit button is locked while pending. An idempotent `alreadyRegistered: true` response is treated as success and displays the existing student/enrollment links. The application remains `accepted`; completion is represented by `registrationState.registered`, not a fabricated application status. Backend warnings remain visible after success.

## Error Handling

The shared API error envelope is mapped once into a typed feature error. Presentation distinguishes:

- `400 validation.failed`: field or form-level validation;
- `401 auth.token.invalid`: existing authentication recovery;
- `403 auth.scope.missing`: permission/scope explanation;
- `404 not_found`: route not-found or resource-specific refresh;
- `409 conflict`: stale or invalid workflow state;
- `422 admissions.decision.requires_all_steps`: prerequisite summary;
- `429 rate_limit.exceeded`: retry guidance;
- unexpected failures: bounded generic message with retry.

Failed forms retain user input. Technical logging may include endpoint, status, error code, and trace ID, but not applicant names, contact details, uploaded document contents, or registration payloads.

## UX and Accessibility

The module follows the dashboard design system rather than introducing a separate visual theme. It remains data-dense with clear drill-down, consistent Lucide icons, stable hover states, visible keyboard focus, and status labels that do not rely on color alone. Dialogs restore focus, destructive confirmations identify the affected record, and asynchronous state is announced where appropriate.

Arabic and English content use existing `next-intl` namespaces. Layout and directional icons work in both LTR and RTL. Required and optional fields are explicit. The list, detail tabs, dialogs, and wizard are verified at 375, 768, 1024, and 1440 pixel widths, with no horizontal page overflow.

## Migration Strategy

1. Add DTOs, canonical models, mappers, workflow predicates, and contract tests alongside the current module.
2. Add endpoint coverage for handoff, registration, and all document actions.
3. Move list and detail orchestration into focused hooks while preserving routes.
4. Migrate list/create/submit UI and remove mock creation plus synthetic KPIs.
5. Migrate detail and document tabs, then remove compatibility fields no longer consumed.
6. Add enrollment preview and registration wizard.
7. Remove dead container/view duplication and obsolete mock application paths after all consumers use the new model.

The refactor is staged so typecheck and focused tests remain usable between steps. Unrelated user changes in the worktree are preserved.

## Verification

Unit tests cover DTO-to-model mapping, envelope handling, query construction, workflow predicates, registration payload mapping, and feature error mapping. API service tests assert every method, URL, HTTP verb, and body.

Hook tests cover loading, independent retries, stale-response protection, duplicate-submit prevention, successful targeted refresh, and retained form state after error.

Component tests cover permission combinations, action visibility by status, document note requirements, destructive confirmation, idempotent registration success, warnings, keyboard behavior, and RTL rendering. Existing application route tests remain regression gates.

The delivery gate runs TypeScript checking, focused Vitest suites, lint on changed files, and relevant Playwright application flows. Manual verification covers light/dark contrast, responsive breakpoints, file upload/link, all document review actions, submission, enrollment preview, registration, and already-registered behavior against a scoped backend user.

## Acceptance Criteria

- All application and application-document endpoints in the supplied Postman collection are represented by typed frontend services and reachable UI workflows where operator action is required.
- List, create, detail, update, submit, document review, readiness preview, and registration use backend data without mock fallbacks or invented values.
- Permissions and workflow states prevent invalid actions without replacing backend validation.
- Registration is idempotent in the UI and reflects `registrationState` while leaving application status `accepted`.
- Existing application URLs, bilingual behavior, and surrounding admissions modules continue to work.
- Error, loading, empty, retry, responsive, keyboard, and RTL states are covered proportionately by tests and manual verification.
