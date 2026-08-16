# Admissions Frontend Contract Repair Design

## Status

Design sections approved on 2026-07-25; written specification pending final user review.

## Goal

Align the existing Admissions frontend with the implemented backend contract while preserving its current feature structure. Remove the lead chat entirely, make backend data authoritative, correct pagination and permission behavior, and remove the misleading module-wide academic year and term scope.

This is a frontend-only change. It must not require backend, database, permission-seed, or API-contract changes.

## Context

The Admissions frontend and the backend contract already agree on the core application, document, workflow-policy, decision, and registration flows. The repair is limited to the gaps found during the contract audit:

- lead chat creates a communication conversation whose only real participant is the staff creator, while the lead is only stored as metadata;
- application creation and the Documents tab use a local in-memory required-document source instead of the school-scoped backend configuration used by Settings;
- tests, interviews, and decisions expose paginated backend collections but their frontend services and screens treat the first response page as the complete collection;
- decision list parameters are accepted by the frontend service but discarded;
- several pages and actions use application permissions or the global read-only flag instead of their resource-specific permissions;
- application creation can succeed before an initial document upload fails, but the current flow can hide that partial result and still convert the lead;
- a global Admissions year/term selector implies filtering and closed-term enforcement that the Admissions backend does not provide;
- document action eligibility can fall back to a locally inferred status rather than the backend-authored capability.

The backend Admissions frontend contract and implemented controllers remain authoritative:

- `docs/admissions-frontend-contract.md` in `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`;
- Admissions applications, documents, leads, tests, interviews, decisions, and workflow-policy controllers in that repository.

## Selected Approach

Use a targeted contract repair.

Keep the existing feature folders, routes, models, and page composition where they remain useful. Change only the adapters, orchestration, guards, and UI behaviors needed to match the backend. Do not rewrite the Admissions data layer or reduce the module to a smaller replacement UI.

This approach minimizes regression risk and keeps the already working application, document review, workflow policy, decision, and registration paths intact.

## Scope

This design includes:

- complete removal of lead chat UI, routing, adapters, exports, translations, and tests;
- one backend-backed source of truth for school-required admission documents;
- typed pagination for placement tests, interviews, and decisions;
- server-backed list filters and pagination;
- exhaustive related-resource loading for application detail tabs;
- exact route, tab, and action permission gates;
- removal of global Admissions academic context and read-only behavior;
- local academic selection only in workflows that genuinely require it;
- backend-authored workflow and action eligibility;
- recoverable handling of partially successful application creation;
- focused regression tests and verification.

## Non-goals

- Backend or database changes.
- New Admissions endpoints or query parameters.
- Restoring lead communication through another channel.
- Changing lead CRUD or lead-to-application conversion beyond its partial-success behavior.
- Reworking the visual design of the Admissions module.
- Broadly restructuring working Admissions features.
- Adding client-side closed-term enforcement where the backend has no equivalent rule.
- Making application creation and file upload transactional; the frontend cannot provide backend atomicity.

## Architecture and Ownership

The current feature-oriented structure remains:

```text
src/features/admissions/
  applications/
  dashboard/
  decisions/
  enrollment/
  interviews/
  leads/
  shared/
  tests/
  types/
```

Each resource service owns its wire contract. Pages own list query state. Application detail orchestration may use a shared pagination helper, but tests, interviews, and decisions retain their resource-specific normalizers.

The Settings Admissions document service remains the owner of school-required document configuration. Admissions consumers call its school-scoped backend function instead of maintaining a second local configuration source.

## Lead Chat Removal

Remove the lead chat because it is not a valid lead communication path under the backend contract.

The removal includes:

- `LeadChatPanel`;
- the `/[lang]/admissions/leads/[id]/chat` route;
- the chat tab in `LeadDetails`;
- `communicationApiService` when no non-chat consumer remains;
- lead-chat exports, message types, state, loading, and error handling;
- chat-specific English and Arabic translations;
- chat mocks, fixtures, and tests.

Lead list, lead details, editing, deletion, notes already supported by the lead resource, and lead-to-application conversion remain. No placeholder, disabled tab, or replacement conversation control is shown.

Any shared communication code outside Admissions is out of scope and must not be removed.

## Required Document Configuration

### Source of truth

Application creation and the application Documents tab call:

```ts
fetchAdmissionRequiredDocumentsForSchool(schoolId)
```

They obtain `schoolId` from the active authenticated school scope. The local `fetchAdmissionsDocumentRequirements` path is removed once all consumers migrate.

The backend response defines which document types are required. The Admissions UI must not silently replace a failed response with local defaults or stale in-memory requirements.

### Loading and failure states

- Do not request requirements until a non-empty active school ID exists.
- While loading, disable requirement-dependent controls and show their loading state.
- When school scope is unavailable, show a scoped configuration error.
- When the request fails, show a retry action and preserve any form input or already loaded application documents.
- Existing linked documents may still be displayed from the application document endpoint.
- Creating or linking a new document through a requirement-dependent control remains blocked until canonical requirements load.

Settings continues to use the same school-scoped service, so Settings, application creation, and document management render one configuration.

## Paginated Collections

### Service contract

Placement tests, interviews, and decisions return a typed paginated result:

```ts
interface PaginatedAdmissionsResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

The adapter must map the actual backend envelope without inventing totals. The UI derives `totalPages` as `Math.ceil(total / limit)` when it needs that value. If shared response utilities are extended, existing non-paginated consumers must retain their behavior.

Each resource service serializes only parameters supported by its backend DTO. In particular, `fetchDecisions` must stop discarding its supplied parameters. Undefined and empty optional values are omitted.

### Standalone list pages

The placement test, interview, and decision list pages own:

- current page;
- page size;
- active server-supported filters;
- loading, error, and retry state;
- pagination metadata from the latest response.

Changing any filter resets the current page to `1`. Changing pages sends a new request. The UI does not apply a second client-only filter that makes the displayed total disagree with the backend total.

Requests are guarded by the resource's view permission. A user without that permission sees access denied before any collection request is made.

Stale responses from an older filter or page must not replace the current result.

### Application detail tabs

The application detail endpoint does not provide nested tests, interviews, or decisions. The corresponding collection endpoints also do not provide a documented application filter. Therefore, each permitted detail-tab loader:

1. requests page `1` with a limit of `100`;
2. reads the returned `page`, `limit`, and `total`;
3. derives the final page and requests every remaining page;
4. combines the normalized items;
5. filters the complete collection by `applicationId`.

This exhaustive loading is isolated in a reusable helper so all three resources share cancellation, error, and termination behavior. It must:

- stop when the reported final page is loaded;
- avoid duplicate page requests;
- tolerate an empty first page;
- reject malformed pagination rather than loop indefinitely;
- ignore stale results after application navigation or unmount.

This is an intentional frontend bridge until the backend supports an application-scoped collection filter. It favors correctness over assuming that the relevant record is among the backend's default first 20 results.

## Permission Model

Permission checks occur before requests and at the action that mutates each resource.

| Resource or action | Required permission |
|---|---|
| View leads and lead details | `admissions.leads.view` |
| Create, edit, delete, or convert a lead | `admissions.leads.manage` |
| View applications and application details | `admissions.applications.view` |
| Create, edit, or submit an application | `admissions.applications.manage` |
| View placement tests or their tab | `admissions.tests.view` |
| Schedule, update, or complete a placement test | `admissions.tests.manage` |
| View interviews or their tab | `admissions.interviews.view` |
| Schedule, update, or complete an interview | `admissions.interviews.manage` |
| View decisions | `admissions.decisions.view` |
| Create a decision | `admissions.decisions.manage` |
| View application documents | `admissions.documents.view` |
| Link, accept, reject, replace, or delete a document | `admissions.documents.manage` |
| Upload a file before linking a document | `admissions.documents.manage` and `files.uploads.manage` |
| Register an accepted application | the existing combined application, student-record, guardian, and enrollment manage permissions |

Application manage permission must not substitute for test or interview manage permission. Tabs are visible only with their matching view permission. A hidden or denied tab must not initiate its API request.

The shared `PermissionKey` union must be extended with the backend-defined lead, test, and interview permission keys before consumers use them. Permission strings must remain typed rather than being cast at call sites.

Backend `403` responses remain authoritative and are surfaced even after frontend gating, because permissions can change during a session.

## Academic Context

Remove the Admissions-wide `AdmissionsYearTermProvider`, context bar, read-only banner, and closed-term action disabling from the module shell and consumers.

Admissions applications, leads, tests, interviews, decisions, and dashboard endpoints are school-scoped, not globally year/term-scoped. Their UI must not imply that a selected year or term filters records when those values are not sent to or enforced by the backend.

Academic selection remains local to workflows that genuinely need academic structure:

- Application creation selects an academic year and term to load valid grade options. The application payload sends only the backend-supported `requestedAcademicYearId` and `requestedGradeId`; it does not send a requested term.
- The registration wizard owns academic year, term, grade, section, and classroom selection. Registration handoff values prefill the local wizard where available.
- Enrollment screens and forms own their required academic context locally.
- A scheduling control that needs academic data solely to populate a supported field, such as a subject, loads that context inside the control. It does not inherit a hidden module-wide filter or send undocumented fields.

Closed-term messaging and disabling are removed unless the specific workflow's backend contract or academic option service directly rejects or marks the selected value unavailable.

The Admissions dashboard stops mixing partially date-filtered applications with unfiltered lead counts under a global academic label. It presents the school-scoped data returned by its source services without claiming year/term scoping.

## Workflow Authority

The backend remains the source of truth for lifecycle readiness:

```text
documents_pending
  -> submitted
  -> required placement tests/interviews
  -> decision
  -> accepted
  -> registration
```

The exact path depends on the backend workflow policy. The frontend does not infer that every school requires both tests and interviews.

Application actions use backend-authored values:

- `dashboardState` for workflow readiness and blockers;
- registration handoff and `registrationState` for registration;
- document `canReview` for document review eligibility;
- workflow-policy responses for school requirements.

Remove the document fallback equivalent to:

```ts
document.canReview ?? document.status === "pending_review"
```

If `canReview` is false or absent, review controls are not enabled by guessing from status. Displayed status remains useful context but is not action authorization.

Frontend permission checks determine whether the user may attempt an action; backend state determines whether the resource is currently eligible. Mutations still handle conflicts caused by state changes after render.

## Application Creation and Partial Success

Application creation followed by initial file uploads is a multi-request workflow and cannot be atomic on the frontend.

The required sequence is:

1. create the application;
2. upload and link each selected initial document;
3. convert the source lead only after every required frontend step succeeds;
4. refresh or navigate to the completed application.

If application creation succeeds but a document upload or link fails:

- retain the created application's ID and returned data;
- stop processing the conversion success path;
- do not mark the source lead as converted;
- do not retry application creation;
- report which documents failed without exposing file contents;
- show that the application itself was created;
- provide a direct link to that application's Documents tab;
- allow the operator to finish documents there.

The lead remains unconverted because the requested conversion workflow did not complete. Once the application exists, the current creation dialog closes or switches to the recovery result and must not offer an action that resubmits application creation. The application link is the durable handoff for completing documents.

If lead conversion itself fails after all documents succeed, preserve the created application, report the conversion failure separately, and provide the same application link. Never present the entire operation as rolled back.

## Error Handling

Resource errors retain the existing shared API error model and translations. UI behavior distinguishes:

- `400`: field or query validation, including unsupported filter values;
- `403`: permission or school-scope denial;
- `404`: missing application or related resource;
- `409`: stale or conflicting workflow state;
- `422`: unmet Admissions workflow prerequisites;
- unexpected failure: bounded generic message with retry.

Errors do not erase successfully returned resources or user-entered form state. Partial creation feedback is persistent enough to copy or follow the application link, rather than toast-only.

Logging may include endpoint, status, error code, and trace ID. It must not include applicant personal data, document content, file blobs, or registration payloads.

## Localization and Accessibility

Remove chat translations carefully from both locale files without disturbing unrelated user changes. Add or update English and Arabic strings for:

- required-document loading, configuration failure, and retry;
- paginated empty/error states;
- permission-specific access denial where existing generic copy is insufficient;
- partial application creation and recovery;
- workflow conflict messages.

Controls retain visible focus, accessible names, loading announcements, and status text that does not rely on color. Pagination remains keyboard accessible and directionally correct in English and Arabic.

## Testing

### Service and utility tests

- Tests, interviews, and decisions preserve backend pagination metadata.
- Supported filters, page, and limit are serialized; undefined values are omitted.
- Decision parameters are no longer discarded.
- The exhaustive page loader requests all pages once, combines items, filters by application ID, handles an empty result, rejects malformed metadata, and stops stale work.
- Required-document consumers call the school-scoped backend service with the active school ID.
- No Admissions consumer calls the removed local requirement source.

### Permission tests

- Standalone pages do not fetch without their exact view permission.
- Application tabs are hidden and do not fetch without their exact view permission.
- Test and interview schedule/update actions require their resource manage permission, not application manage.
- Decision creation requires decision manage.
- Document review requires document manage.
- Document file upload requires both document manage and file-upload manage.
- Registration retains its existing combined permission gate.

### Workflow tests

- Document review controls use `canReview` and never fall back to document status.
- Application action readiness uses backend `dashboardState` and workflow policy.
- Application detail related-resource tabs find records beyond page one.
- Filters reset list pagination to page one and stale responses are ignored.
- Closed-term state no longer disables school-scoped Admissions actions.
- Application creation sends only supported academic identifiers.
- Registration and enrollment retain local academic selection and handoff prefill.

### Partial-success tests

- A failed initial document upload preserves the created application.
- The lead is not marked converted after document failure.
- The operator sees failed-document feedback and a Documents-tab recovery link.
- Application creation is not retried as part of document recovery.
- A lead-conversion failure is reported separately after application and document success.

### Removal tests

- Lead details contain no chat tab or panel.
- The lead chat route, adapter, exports, translations, mocks, and chat-specific tests no longer exist.
- No Admissions module import references the removed chat code.
- Lead CRUD and conversion regression tests continue to pass.

## Verification

The implementation delivery gate is:

1. run TypeScript type checking;
2. run focused Admissions and Admissions-document Settings Vitest suites;
3. run ESLint on affected source and test files;
4. run `git diff --check`;
5. search for removed chat and global-context references;
6. manually exercise list pagination, application detail tabs, permission combinations, document-configuration failure, and the partial-creation recovery path.

Existing unrelated worktree changes must be preserved. In particular, locale-file edits must be narrowly patched rather than replaced wholesale.

## Expected File Areas

Likely affected areas include:

- `src/features/admissions/leads/components`, services, pages, and tests;
- `src/app/[lang]/(dashboard)/admissions/leads/[id]/chat`;
- `src/features/admissions/applications/components`, hooks, pages, services, and tests;
- `src/features/admissions/tests`, `interviews`, and `decisions`;
- `src/features/admissions/shared` pagination and academic-context code;
- `src/app/[lang]/(dashboard)/admissions/layout.tsx`;
- standalone Admissions route guards;
- `src/features/settings/services/settingsService.ts`;
- `src/messages/en.json` and `src/messages/ar.json`.

This list guides implementation but is not permission to refactor unrelated code.

## Acceptance Criteria

- Lead chat is completely absent from the Admissions frontend, with no dead route or adapter.
- Application creation and document management use the active school's backend-required document configuration with explicit loading and retry states.
- Placement tests, interviews, and decisions expose real backend pagination; list filters and page controls request matching server data.
- Application detail tabs load every relevant collection page before filtering by application ID.
- Route, tab, and action guards use the exact resource permissions and prevent unauthorized requests.
- File upload requires both document-management and file-upload permission.
- The Admissions shell has no global academic year/term selector or artificial closed-term read-only behavior.
- Academic context remains available locally for application creation, registration, enrollment, and supported option loading.
- Workflow actions rely on backend-authored readiness and capability fields, with no document-status fallback.
- Partial application creation is recoverable, visible, and never falsely reported as rolled back or fully converted.
- Existing core Admissions workflows, bilingual behavior, type checking, and focused tests remain green.
