# Student Module Frontend Gap Design

Date: 2026-07-01

## Context

The reviewed gap analysis in `docs/student_module_frontend_gap_analysis.docx` shows that the Students & Guardians frontend has visible screens, but several workflows are incomplete, mocked, disabled, or not aligned with confirmed backend contracts.

This design defines the approved frontend direction for closing those gaps without inventing unsupported backend behavior.

## Architecture Direction

Create a new Registration feature under `students-guardians/registration`. This feature will implement a multi-step wizard: Student Information, Guardian, Enrollment, and Review. It will use the backend composite registration endpoint for the create-new-guardian path, support the approved multi-call flow for existing-guardian selection, and become the primary Add Student workflow.

Keep API integration in focused feature services. Each service will call one backend area and normalize backend DTOs at the boundary before data reaches UI components.

Add Profile Correction Requests as a dedicated Students & Guardians feature. It will provide a staff queue, detail comparison view, approve flow, and reject flow.

Define centralized Students & Guardians domain capabilities that map directly to backend permissions. UI actions will be gated by these capabilities rather than scattered permission strings.

Reuse the existing Student Profile tabs and extend them where backend contracts already exist: enrollment management, complete medical profile fields, note editing, guardian-link editing, and real document upload/view/download/import operations.

Keep the Documents Center outside production scope until global student-document list and stats endpoints exist in the backend. Do not rely on mock global document data or sample PDF URLs.

Keep Attendance and Grades tabs unchanged as explicit future scope. They remain visible as Coming Soon sections until contracts are confirmed from the Attendance and Academics modules.

## Implementation Scope

### Phase 1: Foundation

- Add centralized Students & Guardians capabilities mapped directly to backend permissions.
- Replace scattered or incorrect UI permission checks with capability helpers.
- Keep route visibility, menu visibility, and action buttons gated through named capabilities.

### Phase 2: Composite Registration Wizard

- Create `students-guardians/registration`.
- Add the app route at `src/app/[lang]/(dashboard)/students-guardians/registration/page.tsx`.
- Add a multi-step wizard:
  1. Student Information
  2. Guardian
  3. Enrollment
  4. Review
- Submit through the composite registration backend endpoint.
- Use the approved multi-call orchestration when the wizard selects an existing guardian, because the composite registration DTO does not directly accept `guardianId`.
- Make this the primary Add Student action from the Students list.
- Do not expose a new standalone Create Student modal in the main Students list.

### Phase 3: Student Profile Tab Completion

- Enrollment History:
  - add enrollment management actions where supported by confirmed backend enrollment endpoints.
- Medical:
  - support full medical profile fields, not notes-only.
- Notes:
  - enable note editing.
  - keep delete hidden because backend supports list/create/update only, not delete.
- Guardians:
  - enable guardian-link editing.
  - support unlink where confirmed, with confirmation and `students.guardians.manage` capability gating.
  - keep destructive guardian-record deletion hidden unless a backend endpoint is confirmed.
- Documents:
  - use real upload/view/download/import flows where backend/file endpoints are confirmed.
  - student-document delete is backend-supported via `DELETE /students-guardians/documents/:documentId`, but the delete UI is included only if product approves it.
  - if included, delete requires confirmation, `canManageDocuments` gating, and no fake fallback behavior.

### Phase 4: Profile Correction Requests

- Create a dedicated feature under `students-guardians/profile-correction-requests`.
- Add app routes:
  - `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/page.tsx`
  - `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/[requestId]/page.tsx`
- Add the navigation item `Students & Guardians > Profile Correction Requests`.
- Provide a staff queue workflow:
  - list pending requests by default or equivalent staff-focused view.
  - status and student filters backed by API.
  - date filtering must be client-side only or future backend scope unless date query fields are added.
  - open request detail.
  - compare current value vs requested value.
  - approve or reject.
  - show reviewer note.

### Phase 5: Future Scope Preservation

- Documents Center remains out of production scope until backend adds global document list and stats endpoints.
- Attendance tab remains Coming Soon.
- Grades tab remains Coming Soon.

## API and Data Boundary Design

Each Students & Guardians feature owns a focused service layer. UI components must not consume raw backend DTOs directly.

### `registrationApiService`

- Submits the composite registration payload.
- Normalizes wizard form state into the backend registration DTO.
- Returns the created student/enrollment result in a frontend-friendly shape.

### `studentsApiService`

- Owns student list/detail/update flows.
- Does not absorb enrollment, guardian, document, medical, account-linking, or correction-request logic.

### `guardiansApiService`

- Owns guardian list/detail/create/update flows.
- Owns student guardian link/unlink/update-link flows.
- Normalizes guardian DTOs and guardian-student relationship data.
- Does not mix guardian operations into `studentsApiService`.

Backend rationale: there are standalone guardian endpoints and student-specific guardian-link endpoints.

### `accountLinkingService`

- Owns student and guardian account-linking calls.
- Uses `studentsGuardiansCapabilities` for UI gating.
- Does not rely on `settings.users.manage` unless backend permissions change to require it.

Backend rationale: student account linking is under student records permissions, and guardian account linking is under guardian permissions.

### `enrollmentsApiService`

- Owns validate/create/upsert/current/history/list enrollment calls.
- Normalizes enrollment status, academic year, grade/classroom labels, and date fields.

### `studentDocumentsApiService`

- Owns student-scoped document list, missing documents, upload/create, view/download through confirmed file endpoints, and import-from-application.
- Does not provide a global Documents Center API until backend supports global list/stats.
- Owns student-document delete through `DELETE /students-guardians/documents/:documentId` only if product approves exposing the delete UI.
- Maps import-from-application response states: `imported[]`, `skipped[]`, and `warnings[]`.

### `medicalProfileApiService`

- Owns full medical profile read/update.
- Maps backend fields into editable UI state: blood type, allergies, conditions, medications, and notes.

### `studentNotesApiService`

- Owns note list/create/update.
- Keeps delete unsupported because the confirmed backend supports list/create/update only.

### `profileCorrectionRequestsApiService`

- Owns queue list/detail/approve/reject.
- Normalizes comparison data for the detail screen so the UI can render current vs requested values consistently.
- Sends only supported query fields. Backend currently supports `status` and `studentId`.

### `studentsGuardiansCapabilities`

- Central map from backend permissions to frontend capabilities.
- UI uses named capabilities, not raw permission strings scattered across components.

This keeps API drift contained: when backend contracts change, the fix should usually be in one service mapper, not across pages/components.

## UI and Component Design

The UI is organized around staff workflows, not backend endpoint categories.

### Registration Wizard

Location:

- `src/features/students-guardians/registration`
- `src/app/[lang]/(dashboard)/students-guardians/registration/page.tsx`

Primary entry:

- Students list Add Student button opens or navigates to the Registration Wizard.
- The old disabled Add Student state is removed.
- No new standalone Create Student modal is exposed in the main Students list.

Wizard steps:

1. Student Information
   - core identity fields.
   - contact/address fields where supported.
   - validation before moving forward.
2. Guardian
   - create guardian profile as the primary registration flow.
   - support selecting/linking an existing guardian through the approved multi-call orchestration because the composite registration DTO does not directly accept an existing `guardianId`.
   - relationship step supports `is_primary` only.
   - `can_pickup` and `can_receive_notifications` belong to the guardian profile, not the student-guardian relationship, unless backend changes the link DTO.
3. Enrollment
   - validate enrollment inputs before submission where endpoint exists.
   - capture academic year, grade, section, classroom, term, enrollment date, and placement IDs based on the confirmed registration DTO.
4. Review
   - summarize student, guardian, relationship, and enrollment details.
   - submit through `registrationApiService`; create-new-guardian uses composite registration, while existing-guardian selection uses the approved multi-call orchestration.
   - show success result and link to the created student profile.

### Student Profile Tabs

Reuse the existing profile shell and tabs.

- Enrollment History:
  - show current + history.
  - add management actions where supported by confirmed backend enrollment endpoints.
- Guardians:
  - support guardian-link editing.
  - support unlink where confirmed, with confirmation and `students.guardians.manage` capability gating.
  - keep destructive guardian-record deletion hidden unless a backend endpoint is confirmed.
- Medical:
  - expand from notes-only to full medical profile fields.
- Notes:
  - enable editing.
  - keep delete hidden because backend supports list/create/update only, not delete.
- Documents:
  - replace mock/sample URLs with confirmed file-backed flows.
  - support list, missing documents, upload/create, view/download, and import-from-application where endpoints are confirmed.
  - student-document delete is backend-supported via `DELETE /students-guardians/documents/:documentId`, but the delete UI is included only if product approves it.
  - if included, delete requires confirmation, `canManageDocuments` gating, and no fake fallback behavior.
- Attendance and Grades:
  - remain visible as Coming Soon.
  - no mock implementation.

### Profile Correction Requests

Location:

- `src/features/students-guardians/profile-correction-requests`
- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/page.tsx`
- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/[requestId]/page.tsx`

Navigation:

- `Students & Guardians > Profile Correction Requests`

Screens:

- Queue list:
  - status and student filters backed by API.
  - date filter may be client-side only or future backend scope unless date query fields are added.
  - default focus on pending requests.
  - clear status badges.
- Detail/review screen:
  - request metadata.
  - current value vs requested value comparison.
  - reviewer note.
  - approve flow.
  - reject flow.

### Documents Center

Keep the route/page only if already present, but production behavior is constrained:

- no mock global document list.
- no mock stats.
- no sample PDF URLs.
- show Coming Soon / backend contract required state until global endpoints exist.

## Permissions, Error Handling, and Empty States

### Permissions

Use `studentsGuardiansCapabilities` as the only UI-facing permission API for this module.

Named capabilities:

- `canViewStudents` -> `students.records.view`
- `canManageStudents` -> `students.records.manage`
- `canLinkStudentAccount` -> `students.records.manage`
- `canViewGuardians` -> `students.guardians.view`
- `canManageGuardians` -> `students.guardians.manage`
- `canLinkGuardianAccount` -> `students.guardians.manage`
- `canLinkGuardianToStudent` -> `students.guardians.manage`
- `canUpdateStudentGuardianLink` -> `students.guardians.manage`
- `canUnlinkGuardianFromStudent` -> `students.guardians.manage`
- `canViewEnrollments` -> `students.enrollments.view`
- `canManageEnrollments` -> `students.enrollments.manage`
- `canViewDocuments` -> `students.documents.view`
- `canManageDocuments` -> `students.documents.manage`
- `canImportAdmissionsDocuments` -> `students.documents.manage` + `admissions.documents.view`
- `canViewMedical` -> `students.medical.view`
- `canManageMedical` -> `students.medical.manage`
- `canViewNotes` -> `students.notes.view`
- `canManageNotes` -> `students.notes.manage`
- `canViewProfileCorrectionRequests` -> `students.records.view`
- `canReviewProfileCorrectionRequests` -> `students.records.manage`

Rules:

- Pages guard route access.
- Menus guard navigation visibility.
- Buttons/actions guard capability access.
- Services do not silently decide permissions; they return API errors normally.
- Remove unrelated gates like `settings.users.manage` from student/guardian actions unless backend explicitly requires them.

### Error Handling

Feature-level API services normalize backend errors into predictable UI messages.

Registration Wizard:

- Show step-level validation before submission.
- Preserve entered wizard data when an API call fails.
- Show backend validation errors near matching fields where possible.
- If composite registration partially fails server-side, show the backend error and do not fake success.

Documents:

- If file view/download endpoint is unavailable or file metadata lacks `fileId`, show an unavailable state.
- Do not fall back to sample PDF URLs.
- Import-from-application maps `imported[]`, `skipped[]`, and `warnings[]`.
- Skipped documents show already-imported state where applicable.
- Warnings are surfaced without treating the whole operation as failed.

Profile Correction Requests:

- Approve/reject requires confirmation.
- Reject requires a reviewer note only if product requires it.
- Backend currently accepts `reviewerNote` as optional.
- After approve/reject, refresh queue/detail state from backend.
- Date filtering must not be sent to the backend unless backend query DTO adds date fields.

### Empty and Future Scope States

- Documents Center:
  - show Coming Soon / backend contract required instead of mock list/stats.
- Attendance:
  - remain Coming Soon until Attendance module contract is confirmed.
- Grades:
  - remain Coming Soon until Academics module contract is confirmed.
- Notes:
  - empty state invites adding a note only when `canManageNotes` is true.
- Documents:
  - missing documents are driven by the backend missing-document endpoint, not hardcoded frontend assumptions.

## Testing and Verification Design

Testing focuses on API-bound behavior and preventing mock-data regressions.

### Unit-Level Coverage

Add or update tests where project test patterns already exist.

Registration payload mapping:

- Wizard state maps to the composite registration DTO.
- Guardian profile fields and relationship fields stay separated.
- Relationship sends only `is_primary`.
- Enrollment sends confirmed DTO fields only.

Capability helpers:

- Each named capability maps to the expected backend permission.
- `canImportAdmissionsDocuments` requires both `students.documents.manage` and `admissions.documents.view`.
- Account-linking helpers do not require `settings.users.manage`.
- Profile correction view/review helpers map to `students.records.view` and `students.records.manage`.

Student documents service:

- List/missing/upload/import responses normalize consistently.
- No sample PDF or fake URL fallback exists.
- Import-from-application maps `imported[]`, `skipped[]`, and `warnings[]`.
- Skipped documents show already-imported state where applicable.
- Warnings are surfaced without treating the whole operation as failed.

Profile correction request mapper:

- List item status and detail comparison data normalize predictably.
- Approve/reject payloads include reviewer note only when provided.
- Date filtering must not be sent to the backend unless backend query DTO adds date fields.

### UI and Integration Checks

Students list:

- Add Student opens or navigates to Registration Wizard.
- Button visibility follows `canManageStudents`.

Route/menu visibility:

- Students & Guardians routes use centralized capabilities.
- Profile Correction Requests menu item appears only for users with `canViewProfileCorrectionRequests`.
- Review actions appear only for users with `canReviewProfileCorrectionRequests`.
- Action buttons remain hidden or disabled based on named capabilities, not raw permission strings.

Registration Wizard:

- Step validation blocks incomplete data.
- Submit calls the composite registration endpoint once.
- Success links to the created student profile.
- API validation errors preserve form state.

Student Profile:

- Medical tab edits full medical profile fields.
- Notes tab supports update.
- Notes delete action is hidden because backend supports list/create/update only, not delete.
- Guardians tab supports confirmed link/update-link/unlink actions.
- Documents tab uses real service calls and never sample URLs.
- Documents delete action is included only if product approves it, despite backend support via `DELETE /students-guardians/documents/:documentId`.
- Attendance/Grades remain Coming Soon.

Profile Correction Requests:

- Queue defaults to pending or equivalent staff-focused view.
- Status/student filters call supported API query fields.
- Date filtering is client-side only or hidden unless backend query support exists.
- Date filtering is not sent to the backend unless backend query DTO adds date fields.
- Approve/reject refreshes state after completion.

Documents Center:

- No global mock list/stats.
- Shows backend-contract-required Coming Soon state.

### Manual Verification

Before handoff:

- Run available frontend typecheck, lint, and tests.
- Inspect permission-gated actions with at least two permission states:
  - viewer-only.
  - manager/admin.
- Verify no remaining hardcoded sample document URLs in Students & Guardians production paths.
- Verify no raw permission strings remain scattered in module components where a capability helper should be used.
- Verify UI components consume frontend models/form state only, not raw backend DTO shapes.
- Verify frontend does not send unsupported query parameters to backend endpoints.

## Implementation Order and Risk Control

### Recommended Order

1. Foundation first:
   - Add centralized Students & Guardians capabilities.
   - Update route/menu/action gates.
   - Add or adjust focused service boundaries.
   - This prevents new screens from copying old incorrect permission patterns.
2. Composite Registration Wizard:
   - Add `students-guardians/registration`.
   - Wire Students list Add Student to the wizard.
   - Use the composite registration endpoint for create-new-guardian registration.
   - Use the approved multi-call orchestration for existing-guardian selection.
   - Keep existing direct student-create endpoint available only if already used elsewhere, but not as the primary Add Student workflow.
   - Do not expose a new standalone Create Student modal in the main Students list.
3. Existing Student Profile tab completion:
   - Medical full fields.
   - Notes editing.
   - Guardian link/update-link/unlink.
   - Enrollment management through confirmed enrollment endpoints.
   - Documents real list/missing/upload/view/download/import flows where confirmed.
4. Profile Correction Requests:
   - Queue.
   - Detail comparison.
   - Approve/reject.
   - Route/menu integration.
5. Future-scope cleanup:
   - Documents Center uses Coming Soon/backend-contract-required state.
   - Attendance and Grades remain Coming Soon.
   - Remove mock/sample document URLs from production paths.

### Main Risks

- Composite registration DTO mismatch:
  - reduce by mapping in `registrationApiService` and testing payload shape.
- Permission drift:
  - reduce by using named centralized capabilities only.
- File/document endpoint uncertainty:
  - reduce by only enabling view/download/import where confirmed and never using sample URLs.
- Existing UI components may be tightly coupled to backend DTOs:
  - reduce by normalizing at service boundaries and converting tabs gradually.
- Date filter mismatch in correction queue:
  - reduce by sending only supported API query fields.

## Definition of Done

- Add Student is a working composite registration wizard.
- Student Profile backend-backed tabs use confirmed real APIs.
- Profile Correction Requests exists as a staff queue workflow.
- Documents Center, Attendance, and Grades do not pretend to be complete.
- Permissions are centralized under Students & Guardians capabilities.
- No sample PDF/mock document URLs remain in production Students & Guardians paths.
- Frontend does not send unsupported query parameters to backend endpoints.
- UI components consume frontend models/form state only, not raw backend DTO shapes.
- Typecheck, lint, and relevant tests pass, or failures are documented as unrelated/pre-existing.
