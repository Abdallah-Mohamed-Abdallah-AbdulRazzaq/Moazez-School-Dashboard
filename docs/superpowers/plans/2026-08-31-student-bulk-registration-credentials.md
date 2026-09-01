# Student Bulk Registration and Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver resumable bulk student registration and bulk temporary-credential workflows that use the backend at commit `39caea3220ecfec3e8b9612d73b3e3c438550fda`, expose every supported audience and password mode, and reuse the School Dashboard component system.

**Architecture:** Add separate `bulk-registration` and `credentials` feature boundaries with transport DTOs, pure request/status models, focused React compositions, and route-level pages. Share only cancellable batch polling, backend-owned attachment download, and safe error mapping. Keep backend snapshots authoritative, keep passwords in local component memory only, and route every created batch to its ID-specific detail page.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Axios through `src/lib/api.ts`, `next-intl`, Vitest, React Testing Library, Tailwind CSS, and the repository's existing UI components.

**Spec:** `docs/superpowers/specs/2026-08-31-student-bulk-registration-credentials-design.md`

## Global Constraints

- Work only on `feat/student-bulk-registration-credentials`, based on frontend commit `26c21203d94386790c1f9f6289e034d0e87bcce0`.
- Do not change the backend, merge, deploy, force-push, or add the user-owned untracked files `Must Read Before Push.txt` and `docs/Students bulk upload.txt` to Git.
- Run every project command in one PowerShell `& { ... }` block, as required by `Must Read Before Push.txt`.
- Follow red-green-refactor for every production behavior: write the named failing test, run it and observe the intended failure, implement only enough behavior, rerun it, then refactor.
- Invoke `clean-code-guard` after every production-code edit and resolve its findings before committing.
- Invoke `test-guard` after every test edit and resolve its findings before committing.
- Reuse `Button`, `Input`, `DatePicker`, `Select`, `AcademicStudentCascade`, `DragDropUploadArea`, `DataTable.serverPagination`, `FilterPanel`, `ConfirmDialog`, `EmptyState`, `AccessDenied`, `PartialLoader`, `KPICardV2`, and the existing toast system. Do not add competing primitives.
- Treat backend validation, capacity, eligibility, password policy, authorization, and batch state as authoritative. Do not optimistically increment counters or retry mutations invisibly.
- Never put a password, CSV content, preview sample, or backend error detail in a URL, persistent storage, log, telemetry event, or global store.
- Keep English and Arabic translation leaf paths identical and preserve RTL behavior.

---

## Task 1: Make the existing academic cascade reusable without its student selector

**Files:**

- Modify: `src/components/ui/academic/AcademicStudentCascade.tsx`
- Modify: `src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts`

**Interface produced:**

```ts
interface AcademicStudentCascadeProps {
  // Existing props remain unchanged.
  showStudent?: boolean; // defaults to true
}
```

- [ ] Add a rendering test that passes `showStudent={false}`, asserts stage/grade/section/classroom remain, and asserts the student select is absent.
- [ ] Add a backward-compatibility test showing that omitting `showStudent` still renders the student select.
- [ ] Run `& { npm run test:run -- src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts }` and confirm the new test fails because the prop is not implemented.
- [ ] Add `showStudent = true` to the existing props and conditionally render only the existing student-selector block; do not copy or replace any cascade selector.
- [ ] Run `& { npm run test:run -- src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts }` and confirm it passes.
- [ ] Run `test-guard` on the changed test and `clean-code-guard` on the component; apply all valid findings.
- [ ] Commit only these files with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/components/ui/academic/AcademicStudentCascade.tsx' 'src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(ui): allow academic cascade without student selector' }`.

---

## Task 2: Add shared polling and backend-owned attachment download infrastructure

**Files:**

- Create: `src/features/students-guardians/shared/hooks/useBatchPolling.ts`
- Create: `src/features/students-guardians/shared/hooks/__tests__/useBatchPolling.test.tsx`
- Create: `src/features/students-guardians/shared/utils/downloadBackendAttachment.ts`
- Create: `src/features/students-guardians/shared/utils/__tests__/downloadBackendAttachment.test.ts`

**Interfaces produced:**

```ts
export interface BatchPollingOptions<T> {
  resourceId: string;
  load: (signal: AbortSignal) => Promise<T>;
  shouldPoll: (value: T) => boolean;
  intervalMs?: number;
  maxBackoffMs?: number;
}

export interface BatchPollingState<T> {
  data: T | null;
  error: ApiError | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
}

export async function downloadBackendAttachment(
  path: string,
  fallbackFilename: string,
): Promise<void>;
```

- [ ] Write fake-timer polling tests for initial load, recursive non-overlapping requests, terminal stop, and a `shouldPoll` pause state.
- [ ] Add tests that abort the active request and clear timers on unmount and `resourceId` change.
- [ ] Add visibility tests: hidden documents schedule no new request; returning to visible triggers one immediate refresh.
- [ ] Add failure tests that expose `ApiError`, back off read-only retries, cap the delay, and let explicit `retry()` reset the backoff.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/shared/hooks/__tests__/useBatchPolling.test.tsx }` and confirm failure because the hook is missing.
- [ ] Implement a recursive `setTimeout`, one `AbortController` per read, an in-flight guard, visibility listener, consecutive-failure backoff, and cleanup. Do not use `setInterval`.
- [ ] Write attachment tests mocking `apiClient.get` to assert `responseType: 'blob'`, parse quoted and RFC-compatible `Content-Disposition` filenames safely, fall back when absent, create/revoke one object URL, and click one temporary anchor.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/shared/utils/__tests__/downloadBackendAttachment.test.ts }` and confirm failure because the helper is missing.
- [ ] Implement the helper using the existing authenticated `apiClient`; do not inspect, transform, or rebuild the blob body.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/shared/hooks/__tests__/useBatchPolling.test.tsx src/features/students-guardians/shared/utils/__tests__/downloadBackendAttachment.test.ts }` and confirm both pass.
- [ ] Run `test-guard` on both tests and `clean-code-guard` on both production files; apply all valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/shared/hooks' 'src/features/students-guardians/shared/utils/downloadBackendAttachment.ts' 'src/features/students-guardians/shared/utils/__tests__/downloadBackendAttachment.test.ts'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add batch polling and attachment download' }`.

---

## Task 3: Encode the bulk-registration HTTP contract and pure status model

**Files:**

- Create: `src/features/students-guardians/bulk-registration/api/bulkRegistrationDtos.ts`
- Create: `src/features/students-guardians/bulk-registration/api/bulkRegistrationApi.ts`
- Create: `src/features/students-guardians/bulk-registration/api/__tests__/bulkRegistrationApi.test.ts`
- Create: `src/features/students-guardians/bulk-registration/model/bulkRegistrationModel.ts`
- Create: `src/features/students-guardians/bulk-registration/model/__tests__/bulkRegistrationModel.test.ts`

**Interfaces produced:**

```ts
export interface BulkRegistrationPlacementInput {
  academicYearId: string;
  termId?: string;
  classroomId: string;
  enrollmentDate: string;
}

export type BulkRegistrationBatchStatus =
  | "UPLOADED" | "VALIDATING" | "VALIDATION_FAILED" | "READY"
  | "EXECUTING" | "EXECUTION_PARTIAL_FAILED" | "FAILED" | "COMPLETED";

export type BulkRegistrationRowStatus =
  | "PENDING" | "VALID" | "INVALID" | "PROCESSING" | "CREATED" | "FAILED";

export interface BulkRegistrationRowsQuery {
  page: number;
  limit: number;
  status?: BulkRegistrationRowStatus;
}
```

API functions must be named and typed as follows:

```ts
preflightBulkRegistration(input)
downloadBulkRegistrationTemplate()
createBulkRegistration(input, file)
getBulkRegistrationBatch(batchId, signal?)
listBulkRegistrationRows(batchId, query, signal?)
confirmBulkRegistration(batchId)
```

- [ ] Write model tests covering every uppercase batch status, all six row statuses, terminal classification, `READY` pause classification, default row filters (`INVALID` for validation failure and `FAILED` for partial execution), nullable timestamps, counters, and safe unknown error-code fallback.
- [ ] Run the model test and confirm it fails because the model does not exist.
- [ ] Implement readonly status sets and pure mapping helpers without React or translated prose.
- [ ] Write API tests that assert the exact six methods and paths from the spec, including `page`, `limit`, and optional `status` query serialization.
- [ ] Add API tests asserting the placement JSON contains only `academicYearId`, optional `termId`, `classroomId`, and `enrollmentDate`.
- [ ] Add upload tests asserting one `FormData` `file` and exactly the four placement fields, with no manually supplied multipart boundary.
- [ ] Add template tests asserting direct backend blob download with fallback filename `student-bulk-registration-v1.csv`.
- [ ] Run the API test and confirm it fails because the API module does not exist.
- [ ] Implement the DTOs and API functions with `apiGet`/`apiPost` for JSON, `apiClient.post` for multipart, and `downloadBackendAttachment` for the template.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/bulk-registration/api/__tests__/bulkRegistrationApi.test.ts src/features/students-guardians/bulk-registration/model/__tests__/bulkRegistrationModel.test.ts }` and confirm passing results.
- [ ] Run `test-guard` on the tests and `clean-code-guard` on the DTO, API, and model files; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/bulk-registration/api' 'src/features/students-guardians/bulk-registration/model'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add bulk registration contract' }`.

---

## Task 4: Build the bulk-registration start route from existing controls

**Files:**

- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationPlacementForm.tsx`
- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationPreflightSummary.tsx`
- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationUploadPanel.tsx`
- Create: `src/features/students-guardians/bulk-registration/pages/BulkRegistrationStartPage.tsx`
- Create: `src/features/students-guardians/bulk-registration/pages/__tests__/BulkRegistrationStartPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/students-guardians/bulk-registration/page.tsx`

**Interfaces consumed:** Task 1's `AcademicStudentCascade(showStudent={false})`, Task 3's preflight/template/upload API, current academic-year and structure-tree services, and existing `DatePicker`, `DragDropUploadArea`, `Button`, `KPICardV2`, `PartialLoader`, and toast components.

- [ ] Write a page test that completes year → stage → grade → section → classroom with the reused cascade, supplies optional term and enrollment date, and asserts preflight receives only the four backend placement fields.
- [ ] Add tests for `valid: false`, mapped preflight error codes, unknown-code fallback, nullable seat limits displayed as uncapped, and upload controls disabled until a fresh valid preflight exists.
- [ ] Add a template-download test that calls the backend download only after successful preflight.
- [ ] Add CSV-selection tests for one `.csv`, rejection of `.xlsx`/`.xls`, and rejection above `10 * 1024 * 1024` bytes through the configured existing drop area.
- [ ] Add an upload-success test asserting `router.replace('/{lang}/students-guardians/bulk-registration/{batchId}')`; assert no CSV contents are put in the URL.
- [ ] Run the focused test and confirm failure because the page is missing.
- [ ] Implement focused placement, preflight-summary, and upload compositions. Preserve the full selected placement locally, but serialize only the backend DTO.
- [ ] Implement the start page as a five-milestone full-page flow and use the existing components listed above. Clear a stale preflight and selected file whenever placement changes.
- [ ] Create the App Router page wrapped in `StudentsGuardiansPermissionGuard` with both `students.records.manage` and `students.enrollments.manage`.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/bulk-registration/pages/__tests__/BulkRegistrationStartPage.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` on the test and `clean-code-guard` on every production file in this task; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/bulk-registration/components' 'src/features/students-guardians/bulk-registration/pages' 'src/app/[lang]/(dashboard)/students-guardians/bulk-registration/page.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add bulk registration start flow' }`.

---

## Task 5: Build the resumable bulk-registration batch route

**Files:**

- Create: `src/features/students-guardians/bulk-registration/hooks/useBulkRegistrationBatch.ts`
- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationBatchSummary.tsx`
- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationRowsTable.tsx`
- Create: `src/features/students-guardians/bulk-registration/components/BulkRegistrationConfirmation.tsx`
- Create: `src/features/students-guardians/bulk-registration/pages/BulkRegistrationBatchPage.tsx`
- Create: `src/features/students-guardians/bulk-registration/pages/__tests__/BulkRegistrationBatchPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/students-guardians/bulk-registration/[batchId]/page.tsx`

**Behavior produced:** Refresh-safe detail loading, polling for `UPLOADED`/`VALIDATING`/`EXECUTING`, pause at `READY`, terminal stop, server-paginated rows, explicit confirmation, corrected-file replacement, and credential handoff.

- [ ] Write polling-page tests for `UPLOADED`, `VALIDATING`, and `EXECUTING`; assert `READY` pauses and all four terminal statuses stop.
- [ ] Add summary tests for total/valid/invalid/created/failed counters, optional timestamps, validation errors, and placement names when academic data resolves.
- [ ] Add table tests asserting `DataTable.serverPagination` sends page 1, limit 50, requested pages, page-size changes capped at 200, and optional status filters; assert rows are not polled independently.
- [ ] Add state tests: `VALIDATION_FAILED` defaults to `INVALID`; `EXECUTION_PARTIAL_FAILED` defaults to `FAILED`; `COMPLETED` shows the credential handoff; other terminal failures show no mutation retry.
- [ ] Add confirmation tests asserting the existing `ConfirmDialog` contains authoritative placement and valid-row count, is rendered only for a fresh `READY` snapshot, calls confirm once, and resumes polling from the returned `EXECUTING` state.
- [ ] Add stale `409` handling that refreshes detail before re-enabling any action.
- [ ] Add “Upload corrected CSV” tests asserting the old batch remains untouched and a successful new upload replaces the URL with the new batch ID.
- [ ] Run the focused test and confirm failure because the page is missing.
- [ ] Implement `useBulkRegistrationBatch` as a configuration wrapper over `useBatchPolling`; keep row pagination in the page rather than the polling hook.
- [ ] Implement summary and row compositions with `KPICardV2`, `FilterPanel`, `DataTable.serverPagination`, `EmptyState`, and `PartialLoader`; created-student IDs may be action targets but not raw-ID columns.
- [ ] Implement explicit confirmation without automatic retries, the corrected-file path using the existing `DragDropUploadArea`, and the completed handoff route `/{lang}/students-guardians/credentials?sourceRegistrationBatchId={batchId}`.
- [ ] Create the guarded App Router detail page with the two registration permissions.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/bulk-registration/pages/__tests__/BulkRegistrationBatchPage.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` and `clean-code-guard` over the task changes; resolve valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/bulk-registration/hooks' 'src/features/students-guardians/bulk-registration/components' 'src/features/students-guardians/bulk-registration/pages/BulkRegistrationBatchPage.tsx' 'src/features/students-guardians/bulk-registration/pages/__tests__/BulkRegistrationBatchPage.test.tsx' 'src/app/[lang]/(dashboard)/students-guardians/bulk-registration/[batchId]/page.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add bulk registration batch review' }`.

---

## Task 6: Encode credential audiences, modes, status, errors, and HTTP contract

**Files:**

- Create: `src/features/students-guardians/credentials/api/credentialBatchDtos.ts`
- Create: `src/features/students-guardians/credentials/api/credentialBatchApi.ts`
- Create: `src/features/students-guardians/credentials/api/__tests__/credentialBatchApi.test.ts`
- Create: `src/features/students-guardians/credentials/model/credentialAudience.ts`
- Create: `src/features/students-guardians/credentials/model/credentialBatchModel.ts`
- Create: `src/features/students-guardians/credentials/model/__tests__/credentialAudience.test.ts`
- Create: `src/features/students-guardians/credentials/model/__tests__/credentialBatchModel.test.ts`

**Discriminated audience interface produced:**

```ts
export type CredentialAudience =
  | { audienceMode: "import_batch"; sourceRegistrationBatchId: string }
  | { audienceMode: "selected_students"; studentIds: string[] }
  | { audienceMode: "academic_year"; academicYearId: string }
  | { audienceMode: "stage"; academicYearId: string; stageId: string }
  | { audienceMode: "grade"; academicYearId: string; gradeId: string }
  | { audienceMode: "section"; academicYearId: string; sectionId: string }
  | { audienceMode: "classroom"; academicYearId: string; classroomId: string }
  | { audienceMode: "missing_password" };

export type CredentialMode =
  | "unique_generated"
  | "shared_temporary"
  | "shared_admin_provided";

export type CredentialBatchStatus =
  | "pending" | "processing" | "completed" | "partial_failed" | "failed";
```

API functions must be named:

```ts
previewCredentialAudience(audience)
createCredentialBatch(audience, mode, sharedPassword?)
getCredentialBatch(batchId, signal?)
downloadCredentialBatch(batchId)
```

- [ ] Write table-driven audience tests for all eight exact payloads, clearing forbidden selectors on mode change, unique nonempty selected IDs, the 10,000-ID cap, and a stable canonical `audienceKey` used for preview freshness.
- [ ] Write request-builder tests proving `sharedPassword` is present only for `shared_admin_provided`, retains its exact characters, and never serializes confirmation.
- [ ] Write status tests for lowercase nonterminal/terminal classification, export eligibility only for `completed`/`partial_failed` with `generatedRows > 0`, and counters/timestamps.
- [ ] Write password-policy mapping tests for all seven known reasons and an unknown future reason.
- [ ] Write export-error mapping tests for the seven named export codes, including `execution_invariant_invalid` plus `details.reasonCode === 'export_placement_provenance_invalid'`.
- [ ] Run the model tests and confirm they fail because the modules do not exist.
- [ ] Implement pure builders and classifiers. Make invalid audience combinations unrepresentable at the exported boundary and deduplicate selected IDs without storing student objects.
- [ ] Write API tests for the four exact paths/methods, preview's flat sample array, create's `202` response, lowercase statuses, and direct export blob download using fallback `student-credentials-{batchId}.csv`.
- [ ] Run the API test and confirm it fails because the module does not exist.
- [ ] Implement JSON calls with existing API wrappers and export with `downloadBackendAttachment`; never inspect export contents.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/credentials/api/__tests__/credentialBatchApi.test.ts src/features/students-guardians/credentials/model/__tests__/credentialAudience.test.ts src/features/students-guardians/credentials/model/__tests__/credentialBatchModel.test.ts }` and confirm passing results.
- [ ] Run `test-guard` on all tests and `clean-code-guard` on production modules; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/credentials/api' 'src/features/students-guardians/credentials/model'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add credential batch contract' }`.

---

## Task 7: Build every credential audience selector and preview state

**Files:**

- Create: `src/features/students-guardians/credentials/components/CredentialAudienceForm.tsx`
- Create: `src/features/students-guardians/credentials/components/SelectedStudentsPicker.tsx`
- Create: `src/features/students-guardians/credentials/components/CredentialAudiencePreview.tsx`
- Create: `src/features/students-guardians/credentials/components/__tests__/CredentialAudienceForm.test.tsx`
- Create: `src/features/students-guardians/credentials/components/__tests__/SelectedStudentsPicker.test.tsx`
- Create: `src/features/students-guardians/credentials/components/__tests__/CredentialAudiencePreview.test.tsx`

**Interfaces consumed:** Task 1's cascade, Task 6's `CredentialAudience`, `fetchStudents({ search })` from the existing students API service, and existing `Select`, `Input`, `Button`, `KPICardV2`, `EmptyState`, and `PartialLoader`.

- [ ] Write table-driven rendering tests proving each audience mode displays only its permitted selectors and emits the exact discriminated payload.
- [ ] Add tests that changing mode or any selector clears forbidden fields and reports the preview as stale immediately.
- [ ] Add an `import_batch` test that accepts and validates a UUID input and can be prefilled from `sourceRegistrationBatchId` without putting any secret value in the URL.
- [ ] Add selected-student tests that configure existing `Select` with `searchMode="server"`, debounce/cancel searches through `fetchStudents`, retain IDs plus display labels, prevent duplicates, remove with existing `Button`, and enforce 10,000 selections.
- [ ] Add academic audience tests proving `AcademicStudentCascade showStudent={false}` is reused and only the IDs allowed for the chosen audience are emitted.
- [ ] Add preview tests for total/eligible/skipped counters, skipped-reason counts, up to ten flat sample records, empty eligibility, and known/unknown backend errors.
- [ ] Run all three focused tests and confirm failure because the components are missing.
- [ ] Implement the audience composition with existing `Select` and cascade controls; do not create another dropdown or academic tree.
- [ ] Implement selected-student search as server-backed incremental selection without a duplicate full-student store.
- [ ] Implement preview as an explicit action that stores only `{ audienceKey, result }`; selector changes invalidate it, and `eligible === 0` prevents progression.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/credentials/components/__tests__/CredentialAudienceForm.test.tsx src/features/students-guardians/credentials/components/__tests__/SelectedStudentsPicker.test.tsx src/features/students-guardians/credentials/components/__tests__/CredentialAudiencePreview.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` and `clean-code-guard` on the task changes; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/credentials/components'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add credential audience preview' }`.

---

## Task 8: Build secure credential-mode creation and the standalone start route

**Files:**

- Create: `src/features/students-guardians/credentials/components/CredentialModeForm.tsx`
- Create: `src/features/students-guardians/credentials/components/__tests__/CredentialModeForm.test.tsx`
- Create: `src/features/students-guardians/credentials/pages/CredentialsStartPage.tsx`
- Create: `src/features/students-guardians/credentials/pages/__tests__/CredentialsStartPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/students-guardians/credentials/page.tsx`

**Security invariant:** `sharedPassword` and confirmation exist only in `CredentialModeForm` component state and the immediate create call. They are cleared on mode change, cancel, successful `202`, and unmount, and are never included in diagnostic state.

- [ ] Write mode-form tests for all three exact modes; only `shared_admin_provided` renders password and confirmation with `autocomplete="new-password"`.
- [ ] Add password tests for immediate 12-character/upper/lower/number/symbol guidance, exact untrimmed submission, confirmation mismatch, known backend policy reasons, and safe unknown reasons.
- [ ] Add security tests proving mode change, cancel, successful creation, and unmount clear both local inputs; generated modes omit `sharedPassword`; no password appears in router calls, rendered errors, storage calls, or logger calls.
- [ ] Run the mode test and confirm failure because the component is missing.
- [ ] Implement the mode composition with existing `Select`, `Input`, and `Button`; keep the password outside page-level/global state and pass it only to a narrow async submit callback.
- [ ] Write start-page tests for preview-required progression, stale-preview disablement, zero-eligible disablement, view-vs-manage permission behavior, import-batch query prefill, and successful `router.replace('/{lang}/students-guardians/credentials/{batchId}')`.
- [ ] Run the page test and confirm failure because the page is missing.
- [ ] Implement the start page by composing Tasks 7 and 8. Preview requires `students.records.view` + `settings.users.view`; creation controls require `students.records.view` + `settings.users.manage`.
- [ ] Create the route with view permissions at the route guard and manage permission gating around creation; backend `403` remains authoritative.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/credentials/components/__tests__/CredentialModeForm.test.tsx src/features/students-guardians/credentials/pages/__tests__/CredentialsStartPage.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` and `clean-code-guard` on all task changes; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/credentials/components/CredentialModeForm.tsx' 'src/features/students-guardians/credentials/components/__tests__/CredentialModeForm.test.tsx' 'src/features/students-guardians/credentials/pages' 'src/app/[lang]/(dashboard)/students-guardians/credentials/page.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add credential batch creation flow' }`.

---

## Task 9: Build the resumable credential batch and sensitive export route

**Files:**

- Create: `src/features/students-guardians/credentials/hooks/useCredentialBatch.ts`
- Create: `src/features/students-guardians/credentials/components/CredentialBatchSummary.tsx`
- Create: `src/features/students-guardians/credentials/components/CredentialExportPanel.tsx`
- Create: `src/features/students-guardians/credentials/pages/CredentialBatchPage.tsx`
- Create: `src/features/students-guardians/credentials/pages/__tests__/CredentialBatchPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/students-guardians/credentials/[batchId]/page.tsx`

- [ ] Write detail tests that poll `pending` and `processing`, then stop for `completed`, `partial_failed`, and `failed`.
- [ ] Add summary tests for `totalRows`, `generatedRows`, `skippedRows`, `failedRows`, timestamps, retryable read errors, and the guarantee that ordinary JSON renders no passwords or secret-artifact metadata.
- [ ] Add export tests proving the action is enabled only for `completed`/`partial_failed` with `generatedRows > 0` and only with `students.records.view` + `settings.users.manage`.
- [ ] Assert export is one explicit click, is never automatically retried, delegates the untouched blob to the helper, uses the server filename when available, and shows the sensitive-file/24-hour-expiry notice.
- [ ] Add one case for each explicit export error, including placement-provenance reason-code handling, with no client-side recovery promise.
- [ ] Run the focused test and confirm failure because the page is missing.
- [ ] Implement `useCredentialBatch` over the shared polling hook and render counters with `KPICardV2`, loading with `PartialLoader`, errors with safe localized presentation, and actions with `Button`.
- [ ] Implement the export panel without parsing the CSV and without storing its bytes beyond the object URL lifecycle.
- [ ] Create the route guarded by credential view permissions; keep export separately manage-gated.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/credentials/pages/__tests__/CredentialBatchPage.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` and `clean-code-guard` on all changes; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/credentials/hooks' 'src/features/students-guardians/credentials/components/CredentialBatchSummary.tsx' 'src/features/students-guardians/credentials/components/CredentialExportPanel.tsx' 'src/features/students-guardians/credentials/pages' 'src/app/[lang]/(dashboard)/students-guardians/credentials/[batchId]/page.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): add credential batch export flow' }`.

---

## Task 10: Wire permissions and Students-list entry points; retire the placeholder modal

**Files:**

- Modify: `src/features/students-guardians/shared/permissions/studentsGuardiansCapabilities.ts`
- Modify: `src/features/students-guardians/shared/permissions/__tests__/studentsGuardiansCapabilities.test.ts`
- Modify: `src/features/students-guardians/students/pages/StudentsList.tsx`
- Create: `src/features/students-guardians/students/pages/__tests__/StudentsListBulkActions.test.tsx`
- Delete: `src/features/students-guardians/students/components/modals/BulkUploadModal.tsx`

**Capabilities produced:**

```ts
canBulkRegisterStudents: ["students.records.manage", "students.enrollments.manage"]
canViewStudentCredentialBatches: ["students.records.view", "settings.users.view"]
canManageStudentCredentialBatches: ["students.records.view", "settings.users.manage"]
```

- [ ] Extend the capability table tests to cover exact all-permission semantics and denial when either permission is absent.
- [ ] Run the capability test and confirm the new expectations fail.
- [ ] Add the three central capability mappings without changing existing mappings.
- [ ] Write Students-list tests showing Bulk registration only for its combined permission and Credentials only for credential-view permission; test routes preserve the active locale.
- [ ] Add tests that click each action and assert navigation to the two start routes, with no placeholder page error and no modal rendering.
- [ ] Run the Students-list test and confirm it fails against the disabled placeholder behavior.
- [ ] Replace the disabled placeholder handler with locale-aware route navigation and add the standalone Credentials action using existing `Button` styling.
- [ ] Delete `BulkUploadModal.tsx` and run `& { rg -n 'BulkUploadModal|Bulk upload is not available yet' src; if ($LASTEXITCODE -eq 0) { throw 'Placeholder bulk-upload code remains' }; $global:LASTEXITCODE = 0 }` to prove no references remain.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/shared/permissions/__tests__/studentsGuardiansCapabilities.test.ts src/features/students-guardians/students/pages/__tests__/StudentsListBulkActions.test.tsx }` and confirm passing results.
- [ ] Run `test-guard` and `clean-code-guard`; apply valid findings.
- [ ] Commit with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/shared/permissions' 'src/features/students-guardians/students/pages/StudentsList.tsx' 'src/features/students-guardians/students/pages/__tests__/StudentsListBulkActions.test.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' rm -- 'src/features/students-guardians/students/components/modals/BulkUploadModal.tsx'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): expose bulk workflow navigation' }`.

---

## Task 11: Add bilingual messages, safe error presentation, and accessibility coverage

**Files:**

- Create: `src/features/students-guardians/shared/utils/studentBatchErrors.ts`
- Create: `src/features/students-guardians/shared/utils/__tests__/studentBatchErrors.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Create: `src/features/students-guardians/__tests__/bulkWorkflowMessages.test.ts`
- Modify: the new bulk-registration and credential components only where message keys or accessibility attributes must be connected.

- [ ] Add English and Arabic trees `students_guardians.bulk_registration` and `students_guardians.credentials` covering headings, milestones, actions, statuses, counters, known error/reason codes, secure-export guidance, unknown fallback, and trace-ID label.
- [ ] Write a recursive leaf-path parity test for the two new trees and assertions that every backend batch/row/credential status and every password/export reason has both translations.
- [ ] Write safe-error tests proving `ApiError.status`, `code`, `errors`, `details`, and `traceId` remain available, known codes map to translation keys, unknown codes use a fallback, and passwords/request bodies are never copied to presentation objects.
- [ ] Run both tests and confirm failure before the message trees/helper exist.
- [ ] Implement the pure error-to-message-key helper; keep it free of React and do not stringify arbitrary backend details.
- [ ] Wire all new UI text through `useTranslations`, localized date/number formatters, and logical start/end classes.
- [ ] Add or tighten component assertions for semantic headings, ordered milestone labels, associated errors, keyboard-operable actions, focus on the first invalid/actionable field, `aria-live="polite"` on batch status/counter summaries, and locale-derived direction.
- [ ] Run `& { npm run test:run -- src/features/students-guardians/__tests__/bulkWorkflowMessages.test.ts src/features/students-guardians/shared/utils/__tests__/studentBatchErrors.test.ts src/features/students-guardians/bulk-registration src/features/students-guardians/credentials }` and confirm passing results.
- [ ] Run `test-guard` on all test changes and `clean-code-guard` on production changes; apply valid findings.
- [ ] Use `& { git -c safe.directory='E:/Moazzez/School-Dashboard' diff --name-only }` to identify the task's message/helper/component edits, then stage each returned task file by its literal path; verify with `git -c safe.directory='E:/Moazzez/School-Dashboard' diff --cached --name-only`, and commit with `git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'feat(students): localize bulk workflows'`. Never use `git add .` or stage unrelated paths.

---

## Task 12: Add contract regression coverage and run the complete delivery gates

**Files:**

- Create: `src/features/students-guardians/__tests__/bulkWorkflowContract.test.ts`
- Modify only files implicated by verification failures; do not broaden feature scope.

- [ ] Add one focused contract suite that asserts all ten exact frontend API paths/methods, eight audience modes, three credential modes, registration uppercase statuses, credential lowercase statuses, CSV-only/10-MiB settings, and permission tuples.
- [ ] Add behavioral tests that mock the transport boundary and prove template/export actions use the backend blob unchanged, `.xlsx`/`.xls` are rejected, rows never call individual student creation, no batch-list request occurs, and passwords never reach storage or navigation.
- [ ] Add component-reuse tests by mocking the existing `AcademicStudentCascade`, `DragDropUploadArea`, `DataTable`, `ConfirmDialog`, and `AccessDenied` modules and asserting the workflows render/configure those components, including `DataTable.serverPagination`.
- [ ] Run the contract test first and correct any uncovered drift.
- [ ] Run `test-guard` on the contract test and `clean-code-guard` on any production corrections; resolve all valid findings.
- [ ] Run focused feature tests: `& { npm run test:run -- src/features/students-guardians/bulk-registration src/features/students-guardians/credentials src/features/students-guardians/__tests__/bulkWorkflowContract.test.ts src/features/students-guardians/__tests__/bulkWorkflowMessages.test.ts }`.
- [ ] Run repository lint: `& { npm run lint }`.
- [ ] Run repository type checking: `& { npm run typecheck }`.
- [ ] Run the complete unit suite: `& { npm run test:run }`.
- [ ] Run the production build: `& { npm run build }`.
- [ ] Inspect `& { git -c safe.directory='E:/Moazzez/School-Dashboard' status --short; git -c safe.directory='E:/Moazzez/School-Dashboard' diff --check; git -c safe.directory='E:/Moazzez/School-Dashboard' diff --stat }`; verify only intended feature files changed and the two user-owned untracked files remain untracked.
- [ ] Commit the regression test and any verified corrections with `& { git -c safe.directory='E:/Moazzez/School-Dashboard' add -- 'src/features/students-guardians/__tests__/bulkWorkflowContract.test.ts'; git -c safe.directory='E:/Moazzez/School-Dashboard' commit -m 'test(students): lock bulk workflow contracts' }`. Add correction files explicitly by path if needed; never use `git add .`.
- [ ] Push the feature branch normally and open a Draft Pull Request with the exact frontend/backend contract SHAs, commands and results, security invariants, known integration boundary, and no claim of deployed acceptance.

## Acceptance checklist

- [ ] All four full-page routes are refresh-safe and use batch IDs for durable state.
- [ ] Registration handles preflight, canonical template, CSV upload, validation review, READY-only confirmation, execution, partial failure, completion, and corrected-file replacement.
- [ ] Credentials handles all eight audience modes, mandatory preview freshness, all three credential modes, safe admin-provided password behavior, asynchronous execution, and protected direct export.
- [ ] Exact permission combinations are enforced in navigation, routes, creation, and export.
- [ ] Existing shared components are reused; the placeholder modal is gone and no parallel visual primitives were introduced.
- [ ] English/Arabic, RTL, accessibility, polling lifecycle, error mapping, and secret-handling tests pass.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build` pass from a clean intended diff.
- [ ] The Draft PR is pushed without merge, deploy, or backend changes.
