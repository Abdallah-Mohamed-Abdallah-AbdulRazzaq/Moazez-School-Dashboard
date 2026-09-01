# Student Bulk Registration and Credentials Design

## Goal

Add two connected School Dashboard workflows:

1. Bulk student registration from the backend-provided CSV template.
2. Bulk temporary credential provisioning for all backend-supported student audiences.

The frontend is an orchestration and presentation layer. The backend remains authoritative for placement, capacity, validation, eligibility, password policy, batch execution, tenant scope, and secret handling.

Backend contract reference: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend` commit `39caea3220ecfec3e8b9612d73b3e3c438550fda`.

Frontend baseline: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-School-Dashboard` commit `26c21203d94386790c1f9f6289e034d0e87bcce0`.

## Scope

The Students page gains two actions:

- Bulk student registration.
- Bulk credentials.

Bulk registration covers placement preflight, backend template download, CSV upload, asynchronous validation, paginated row review, READY-only confirmation, asynchronous provisioning, final counters, and a handoff into credential provisioning.

Bulk credentials is also available as a standalone workflow. It supports every backend audience and all three public credential modes. A completed registration batch opens credentials with the import batch preselected.

The current `BulkUploadModal` is retired. It must not remain reachable because it creates a noncanonical template in the browser, accepts spreadsheet files that are not part of this contract, and treats upload as synchronous completion.

The existing single-student registration flow remains unchanged. The existing Settings credentials status and general bulk-credential workflows use different routes and response shapes; they may contribute UI conventions but are not transport contracts for this feature.

## Navigation and resumability

Use dedicated full-page routes:

- `/{lang}/students-guardians/bulk-registration`
- `/{lang}/students-guardians/bulk-registration/{batchId}`
- `/{lang}/students-guardians/credentials`
- `/{lang}/students-guardians/credentials/{batchId}`

The start routes collect inputs and create a backend batch. After a successful upload or credential-batch creation, replace the start route with the returned batch route. Batch routes load authoritative state by ID and therefore survive refreshes.

Only durable, non-secret identifiers may appear in paths or query parameters. `sharedPassword`, password confirmation, CSV contents, preview samples, and backend error details must never appear in a URL.

The backend exposes detail-by-ID routes but no registration-batch or credential-batch history endpoint. This design does not invent a frontend history list. An `import_batch` audience is prefilled when launched from a completed import; direct standalone use accepts a validated source registration batch UUID.

## Frontend architecture

Create two focused feature boundaries under `src/features/students-guardians`:

```text
bulk-registration/
  api/
  components/
  hooks/
  model/
  pages/

credentials/
  api/
  components/
  hooks/
  model/
  pages/
```

Each feature owns its transport DTOs, API functions, request construction, status classification, view-model mapping, page orchestration, and focused components. Share only narrow infrastructure where the contracts are genuinely identical:

- Cancellable asynchronous-batch polling behavior.
- Backend attachment download behavior.
- Structured `ApiError` presentation helpers.
- Existing academic-structure services and selector presentation.

The pages must not become monolithic state machines. API functions contain no presentation text. Mappers contain no React behavior. Components receive explicit view models and callbacks rather than reading transport objects throughout the tree.

The existing `apiClient` remains the authenticated HTTP client. JSON endpoints use the established `apiGet` and `apiPost` wrappers where they preserve the required response metadata. Multipart upload must allow the browser to set its boundary. File downloads must request the backend body as a blob while retaining `Content-Disposition` when available.

## Permissions

The frontend mirrors the exact backend requirements while treating backend authorization as final.

| Operation | Required permissions |
|---|---|
| Registration preflight, template, upload, detail, rows, and confirm | `students.records.manage` and `students.enrollments.manage` |
| Credential preview and detail | `students.records.view` and `settings.users.view` |
| Credential creation and export | `students.records.view` and `settings.users.manage` |

Bulk-registration navigation and controls are available only when both registration permissions are present. The credential workflow may show preview and detail to users with both view permissions, but creation and export controls are unavailable without `settings.users.manage`. Existing access-denied behavior still handles backend `403` responses.

## Bulk-registration contract

All endpoint paths below are relative to the configured `/api/v1` base.

| Method | Path | Frontend use |
|---|---|---|
| POST | `/students-guardians/bulk-registrations/preflight` | Validate placement and obtain resolved readiness. |
| GET | `/students-guardians/bulk-registrations/template` | Download the canonical template. |
| POST | `/students-guardians/bulk-registrations` | Upload one CSV and create a batch. |
| GET | `/students-guardians/bulk-registrations/:batchId` | Read batch status, counters, timestamps, and batch errors. |
| GET | `/students-guardians/bulk-registrations/:batchId/rows` | Page and filter row results. |
| POST | `/students-guardians/bulk-registrations/:batchId/confirm` | Confirm a READY batch and enqueue execution. |

### Placement and preflight

The placement request contains:

- Required `academicYearId`.
- Optional `termId`.
- Required `classroomId`.
- Required ISO date `enrollmentDate`.

The academic selector displays the full year → stage → grade → section → classroom cascade using the existing academic-year, term, and structure-tree services. Stage, grade, and section help the administrator select a classroom, but the preflight request sends only the backend DTO fields.

On a valid preflight, show the backend-resolved academic year, optional term, stage, grade, section, classroom, classroom capacity, enrollment date, and school-seat `limit`, `used`, and `remaining`. A `null` limit or remaining value is displayed as unlimited/not capped, not converted to zero.

When preflight returns `valid: false`, do not enable the template/upload phase. Localize every returned error code and retain an unknown-code fallback.

### Template and upload

The template must be downloaded from the backend. The frontend must not construct, parse, alter, or re-export it. The authoritative filename is `student-bulk-registration-v1.csv`.

The upload UI accepts `.csv` files only. The backend accepts the browser MIME values `text/csv` and `application/vnd.ms-excel` for CSV uploads and enforces a 10 MiB maximum. The frontend may reject a clearly invalid extension or oversized file early for usability, but backend validation remains authoritative. XLS and XLSX extensions are unsupported.

Create a multipart request containing exactly one `file` plus `academicYearId`, optional `termId`, `classroomId`, and `enrollmentDate`. A successful `201` response creates a durable batch and returns `UPLOADED`; it does not mean validation or registration is complete.

### Batch and row states

Registration batch states are:

- Nonterminal: `UPLOADED`, `VALIDATING`, `READY`, `EXECUTING`.
- Terminal: `VALIDATION_FAILED`, `EXECUTION_PARTIAL_FAILED`, `FAILED`, `COMPLETED`.

`READY` is nonterminal from a polling perspective but does not require continued polling. It is an administrator decision point. The Confirm action is enabled only from a fresh authoritative `READY` response. It is never enabled from local step state alone.

Registration row states are `PENDING`, `VALID`, `INVALID`, `PROCESSING`, `CREATED`, and `FAILED`.

The batch detail view presents:

- Total, valid, invalid, created, and failed row counters.
- Created, updated, validated, started, and completed timestamps when present.
- Batch-level `validationErrors`.
- Placement IDs resolved to localized names where current academic data is available.

The row endpoint uses server pagination with `page` starting at 1, default `limit` 50, maximum `limit` 200, and an optional row-status filter. Row tables request pages on demand and never poll rows individually. A row displays its original row number, state, normalized student fields, error code, optional field, optional reason, and created student identity only as an action target rather than a raw-ID column.

### Registration interaction flow

Present five visible milestones while representing all required backend phases:

1. Placement and preflight.
2. Template and CSV upload.
3. Validation and error review.
4. Confirmation and provisioning.
5. Final result and credential handoff.

`VALIDATING` and `EXECUTING` are live system states within their corresponding milestone, not empty administrator-driven steps.

For `VALIDATION_FAILED`, default the row table to `status=INVALID`. Provide “Upload corrected CSV,” which uses the failed batch's placement to upload a new file and create a new batch. The old batch is not changed, confirmed, or reused.

Before confirmation, display the current placement and valid-row count in an explicit confirmation panel. The POST is user initiated and is not retried invisibly. After a successful `202`, show `EXECUTING` and resume batch polling.

For `EXECUTION_PARTIAL_FAILED`, show both created and failed counts and default the row table to failed rows. Do not provide a frontend force-import or automatic mutation retry. For `COMPLETED`, refresh the Students list when returning and offer “Create credentials for imported students,” carrying the source registration batch ID into the credentials start route.

## Credential-batch contract

| Method | Path | Frontend use |
|---|---|---|
| POST | `/students-guardians/credential-batches/preview` | Resolve and summarize a credential audience. |
| POST | `/students-guardians/credential-batches` | Create and enqueue a credential batch. |
| GET | `/students-guardians/credential-batches/:batchId` | Read safe batch metadata and counters. |
| GET | `/students-guardians/credential-batches/:batchId/export` | Download the protected credential CSV. |

### Audience modes

Expose all backend audience values and send only the selectors permitted for that value.

| Audience | Required request fields |
|---|---|
| `import_batch` | `audienceMode`, `sourceRegistrationBatchId` |
| `selected_students` | `audienceMode`, nonempty unique `studentIds` array |
| `academic_year` | `audienceMode`, `academicYearId` |
| `stage` | `audienceMode`, `academicYearId`, `stageId` |
| `grade` | `audienceMode`, `academicYearId`, `gradeId` |
| `section` | `audienceMode`, `academicYearId`, `sectionId` |
| `classroom` | `audienceMode`, `academicYearId`, `classroomId` |
| `missing_password` | `audienceMode` only |

Changing audience mode clears fields that are not allowed by the new mode. Request construction uses a discriminated union so an invalid selector combination cannot be serialized accidentally.

The `selected_students` picker uses server-backed search through the established Students service and retains only selected student IDs and display labels. It does not duplicate full student collections in multiple stores. The backend accepts at most 10,000 unique student IDs.

Every audience must be previewed before credential creation. Preview returns `totalMatched`, `eligible`, `skipped`, a `skippedReasons` count map, and up to ten eligible sample records. The preview sample shape is a flat array of student credential summaries; it must not reuse the different Settings bulk-preview DTO.

Store a stable audience payload key with a successful preview. Any selector change immediately makes the preview stale and disables creation until preview succeeds again. Creation is also disabled when `eligible` is zero.

### Credential modes and secret handling

The public credential modes are exactly:

- `unique_generated`: the backend generates a different temporary password per eligible student.
- `shared_temporary`: the backend generates one shared temporary password.
- `shared_admin_provided`: the administrator supplies one shared temporary password.

Only `shared_admin_provided` renders password and confirmation inputs or serializes `sharedPassword`. Generated-mode requests must omit that property entirely. Password confirmation is frontend-only and is never sent.

The frontend displays immediate guidance for the authoritative policy: at least 12 characters with uppercase, lowercase, number, and symbol; common passwords are rejected. This guidance does not replace backend validation. The frontend must map `iam.credentials.password_policy_failed` and its `details.reasons`, including unknown future reasons.

The password value is preserved exactly as entered for submission. It must not be trimmed or normalized. It remains only in local component memory and is cleared when the mode changes, the form is cancelled, the component unmounts, or batch creation returns `202`. It must never enter local storage, session storage, URLs, a global store, analytics, telemetry, logs, error metadata, preview data, or normal JSON result presentation. Both inputs use `autocomplete="new-password"`.

### Credential execution and export

Credential responses use lowercase statuses:

- Nonterminal: `pending`, `processing`.
- Terminal: `completed`, `partial_failed`, `failed`.

The detail page displays total, generated, skipped, and failed counters with timestamps. Ordinary JSON never contains temporary passwords or secret-artifact metadata.

Export is enabled only for `completed` or `partial_failed` when `generatedRows > 0`. It is an explicit administrator action. Download the backend response body directly using the server-provided filename when available; do not parse and rebuild the CSV. Display that the file is sensitive, contains temporary passwords, must be stored and distributed securely, and expires after 24 hours.

The frontend handles these export codes explicitly:

- `students.credentials.export_not_ready`.
- `students.credentials.export_empty`.
- `students.credentials.export_too_large`.
- `students.credentials.secret_artifact_unavailable`.
- `students.credentials.secret_artifact_expired`.
- `students.credentials.secret_artifact_invalid`.
- `students.credentials.execution_invariant_invalid` with `details.reasonCode` equal to `export_placement_provenance_invalid`.

There is no client-side recovery path for an expired or invalid secret artifact and no promise that a temporary password can be recovered later.

## Polling behavior

Use a shared polling primitive configured per batch contract. It performs one request at a time through a cancellable recursive timeout.

- Poll only batch detail endpoints.
- Stop when the status is terminal.
- Pause registration polling at `READY` until the administrator confirms.
- Cancel the active request and timer on unmount or batch-ID change.
- Pause scheduled polling while the document is hidden and refresh immediately when it becomes visible.
- Back off read-only polling after consecutive network failures and expose a retry state.
- Never retry upload, confirmation, credential creation, or export invisibly.

Polling responses replace the previous authoritative batch snapshot. Counters are not incremented optimistically in the browser.

## Error handling

Transport code preserves `ApiError.status`, `code`, `errors`, `details`, and `traceId`. Presentation maps known safe codes and reason codes to English and Arabic messages. Unknown safe codes remain visible through a localized fallback; a trace ID is shown as technical context when present.

Handle at least:

- Invalid or inactive academic placement.
- Classroom or school-seat capacity conflict.
- Invalid CSV MIME, size, header, shape, or empty dataset.
- Batch validation failure and row errors.
- Confirmation conflict caused by stale state.
- Registration partial failure or terminal failure.
- Invalid credential audience or selector combination.
- No eligible credential students.
- Password-policy rejection.
- Credential partial failure or failure.
- Export not ready, empty, expired, unavailable, invalid, or too large.
- Tenant, permission, not-found, network, and unexpected server errors.

Mutation errors keep safe form inputs available for correction, except that a password must not be copied into diagnostic state. A stale-state conflict refreshes batch detail before offering another user action.

## Component design

### Existing-component reuse requirement

Implementation must compose the existing shared component system. It must not introduce alternate buttons, inputs, selects, tables, upload areas, confirmation dialogs, loading indicators, access-denied screens, empty states, KPI cards, or toast systems.

Use these existing components and capabilities:

| Need | Existing component |
|---|---|
| Actions and download triggers | `Button` from `src/components/ui/button` |
| Text, UUID, date, and password fields | `Input` and `DatePicker` from `src/components/ui/input` |
| Year, term, audience, status, and academic selectors | `Select` from `src/components/ui/input` |
| Stage → grade → section → classroom cascade | `AcademicStudentCascade` from `src/components/ui/academic/AcademicStudentCascade.tsx` |
| CSV selection | `DragDropUploadArea` from `src/components/ui/drag-drop-upload/DragDropUploadArea.tsx` |
| Row results | `DataTable` from `src/components/ui/data-table`, using its `serverPagination` contract |
| Row-status filtering | `FilterPanel` from `src/components/ui/filter-panel` |
| READY confirmation | `ConfirmDialog` from `src/components/ui/confirm-dialog` |
| Empty audience and row states | `EmptyState` from `src/components/ui/empty-state` |
| Route-level permission failure | `AccessDenied` from `src/components/ui/access-denied` |
| Inline loading | `PartialLoader` from `src/components/ui/loaders/PartialLoader.tsx` |
| Batch counters | `KPICardV2` from `src/components/ui/kpi-card/KPICardV2.tsx` |
| Transient success/failure notices | The existing toast system in `src/components/ui/toast/Toast.tsx` |

`AcademicStudentCascade` currently always renders its student selector. Extend it with one backward-compatible optional visibility prop, defaulting to the current behavior, so bulk placement and academic credential audiences can reuse the first four selectors without rendering a student field. Do not build a second stage/grade/section/classroom cascade.

For `selected_students`, reuse `Select` with its server-search callbacks to find one student at a time, then render the retained selection as a lightweight list using existing buttons for removal. Do not create a second dropdown implementation. Configure `DragDropUploadArea` for a single file with the CSV accept list and 10 MiB bound; do not create another drop zone. Use `DataTable.serverPagination` for backend row pages rather than implementing a separate paginator.

New components are limited to feature-specific compositions that have no existing equivalent, such as batch status/counters, preflight readiness, row-error presentation, audience preview, credential-mode selection, and the sensitive export notice. These components must be assembled from the shared primitives above and must not establish a new visual system.

### Feature-specific composition

Bulk registration composes the existing components into focused feature sections for:

- Academic placement.
- Preflight readiness.
- Backend template download.
- CSV selection and upload.
- Batch status and counters.
- Paginated row results.
- READY confirmation.
- Final result and credential handoff.

Credentials composes the existing components into focused feature sections for:

- Audience mode and mode-specific selectors.
- Searchable selected-student selection.
- Audience preview and skipped reasons.
- Credential-mode selection.
- Admin-provided password entry and policy guidance.
- Batch status and counters.
- Sensitive export.

The page layout follows existing School Dashboard page headers, cards, spacing, and status colors. It is full-page and responsive rather than modal-based. All user-facing text belongs to matching `next-intl` trees in `src/messages/en.json` and `src/messages/ar.json`.

## Accessibility and localization

- Set page direction from the active locale and use logical start/end layout utilities.
- Keep English and Arabic translation leaf paths in parity.
- Use semantic headings, ordered workflow progress, labels, descriptions, and error associations.
- Move focus to the first actionable field or error summary when a step fails.
- Announce asynchronous status and counter changes without repeatedly interrupting screen-reader users.
- Keep all controls keyboard operable with visible focus.
- Do not rely on color alone for status or validation meaning.
- Localize dates, counts, statuses, backend reason labels, and empty/loading text while preserving backend enum values in requests.

## Testing

### Contract and model tests

- Assert every method and exact endpoint path.
- Assert the four placement fields and multipart `file` field.
- Assert template and export blob handling and filenames.
- Assert registration DTO mapping, uppercase states, counters, nullable timestamps, normalized rows, and row errors.
- Assert all eight discriminated audience payloads and reject extraneous selectors.
- Assert credential DTO mapping, lowercase states, counters, preview samples, and skipped reasons.
- Assert all three credential modes.
- Assert `sharedPassword` is present only for `shared_admin_provided` and confirmation is never serialized.
- Assert password-policy reason mapping and safe unknown fallbacks.

### Polling tests

- Start for each nonterminal state.
- Pause at registration `READY`.
- Stop for every terminal state.
- Prevent overlapping requests.
- Cancel on unmount and batch-ID change.
- Pause while hidden and refresh on visibility return.
- Back off after read failures without retrying mutations.

### Component and workflow tests

- Placement cascade and preflight success/rejection.
- Template download before upload.
- CSV extension and size feedback.
- Upload-to-batch navigation.
- Validation-failed row pagination and corrected-file re-upload.
- READY-only confirmation.
- Executing, completed, partial-failure, and failed results.
- Permission combinations for import, preview, creation, and export.
- All audience selectors and preview invalidation.
- All credential modes and password confirmation.
- Password clearing on mode change, cancellation, success, and unmount.
- Absence of secret persistence, URL serialization, and normal result rendering.
- Credential execution states and secure export errors.
- Reuse of `AcademicStudentCascade`, `DragDropUploadArea`, `DataTable.serverPagination`, `ConfirmDialog`, and `AccessDenied` instead of feature-local replacements.
- English, Arabic, RTL, keyboard focus, and status announcements.

### Required verification

Run focused Vitest suites during implementation, then the repository gates before handoff:

```text
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Run the repository-required clean-code guard on every production-code change and test guard on every test change. Integrated staging acceptance remains separate from source completion and must exercise the real browser workflow after frontend and backend artifacts are deployed.

## Non-goals

- Backend, schema, queue, worker, storage, IAM, or deployment changes.
- A frontend-generated registration template or credential export.
- XLS/XLSX import.
- Guardian creation or guardian fields in the CSV.
- Password generation, hashing, storage, or recovery in the frontend.
- Individual student-create requests for CSV rows.
- Client-side capacity or eligibility authority.
- Importing invalid rows or forcing failed rows.
- Batch-history pages without backend list endpoints.
- Changing the single-student registration workflow.
- Replacing the existing Settings credential-management contracts.
- Production deployment or automatic merge.

## Delivery boundary

Implementation starts from the verified frontend baseline on `feat/student-bulk-registration-credentials`, remains limited to the School Dashboard, and ends with focused and full verification, normal commits, a normal branch push, and a Draft Pull Request. It must not force-push, merge, deploy, or modify backend source.
