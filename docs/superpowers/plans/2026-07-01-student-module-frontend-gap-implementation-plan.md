# Student Module Frontend Gap Implementation Plan

Date: 2026-07-01

Source design: `docs/superpowers/specs/2026-07-01-student-module-frontend-gap-design.md`

Status: pending review and approval.

Rule: no implementation should start until this implementation plan is reviewed and approved.

## Locked Constraints

- Composite Registration Wizard is the primary Add Student flow.
- Do not expose a new standalone Create Student modal in the main Students list.
- Existing-guardian selection inside the Registration Wizard is approved through a multi-call flow because the composite registration DTO does not directly accept `guardianId`.
- Centralize Students & Guardians capabilities and use named helpers in UI code.
- Keep focused service boundaries. UI components consume frontend models/form state, not raw backend DTO shapes.
- Complete only backend-backed Student Profile tabs.
- Add Profile Correction Requests as a dedicated staff queue.
- Do not use fake document URLs, sample PDF URLs, or mock global document data in production Students & Guardians paths.
- Keep Documents Center, Attendance, and Grades as future-scope placeholders where backend contracts are missing.
- Do not send unsupported query parameters to backend endpoints.

## Phase 1: Foundation and Capabilities

Goal: establish permission and service boundaries before adding new screens.

### Files to create

- `src/features/students-guardians/shared/permissions/studentsGuardiansCapabilities.ts`
- `src/features/students-guardians/shared/permissions/__tests__/studentsGuardiansCapabilities.test.ts`

### Files to update

- `src/features/students-guardians/index.ts`
- `src/features/students-guardians/services/accountLinkingService.ts`
- `src/features/students-guardians/__tests__/accountLinkingEndpointContracts.test.ts`
- `src/features/students-guardians/students/pages/StudentsList.tsx`
- `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
- `src/features/students-guardians/guardians/pages/GuardiansList.tsx`
- `src/features/students-guardians/guardians/pages/GuardianProfilePage.tsx`

### Capability helper mapping

Implement named helpers:

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

### Implementation tasks

1. Add a small capability API that accepts the current permission-checking mechanism already used by the app.
2. Replace student/guardian account-linking gates currently using `settings.users.manage` in:
   - `src/features/students-guardians/students/pages/StudentsList.tsx`
   - `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
   - `src/features/students-guardians/guardians/pages/GuardiansList.tsx`
   - `src/features/students-guardians/guardians/pages/GuardianProfilePage.tsx`
3. Add capability definitions for Profile Correction Requests in Phase 1.
4. Do not expose the visible Profile Correction Requests navigation item until Phase 4, unless a safe temporary Coming Soon route is added.
5. Gate route/menu/action visibility through named capabilities, not raw permission strings.
6. Keep services permission-agnostic. Services should call APIs and surface API errors; components decide whether actions are visible/enabled.

### Verification

- Unit-test each capability helper mapping.
- Unit-test composite `canImportAdmissionsDocuments` requiring both permissions.
- Unit-test account-linking helpers do not require `settings.users.manage`.
- Defer visible Profile Correction Requests navigation tests to Phase 4 unless Phase 1 adds non-visible navigation metadata.

## Phase 2: Composite Registration Wizard

Goal: make Add Student use the Registration Wizard, with composite registration for create-new-guardian flow and the approved multi-call orchestration for existing-guardian flow.

### Files to create

- `src/app/[lang]/(dashboard)/students-guardians/registration/page.tsx`
- `src/features/students-guardians/registration/pages/RegistrationWizardPage.tsx`
- `src/features/students-guardians/registration/components/RegistrationWizard.tsx`
- `src/features/students-guardians/registration/components/StudentInformationStep.tsx`
- `src/features/students-guardians/registration/components/GuardianStep.tsx`
- `src/features/students-guardians/registration/components/EnrollmentStep.tsx`
- `src/features/students-guardians/registration/components/ReviewStep.tsx`
- `src/features/students-guardians/registration/services/registrationApiService.ts`
- `src/features/students-guardians/registration/types/registration.ts`
- `src/features/students-guardians/registration/utils/registrationMappers.ts`
- `src/features/students-guardians/registration/utils/registrationValidation.ts`
- `src/features/students-guardians/registration/utils/__tests__/registrationMappers.test.ts`
- `src/features/students-guardians/registration/utils/__tests__/registrationValidation.test.ts`

### Files to update

- `src/features/students-guardians/students/pages/StudentsList.tsx`
- `src/features/students-guardians/index.ts`
- `src/messages/en.json`
- `src/messages/ar.json`

### Route additions

- `src/app/[lang]/(dashboard)/students-guardians/registration/page.tsx`

### Service/API boundary changes

- Add `registrationApiService` for registration submission orchestration.
- Use the composite registration endpoint for create-new-guardian flow.
- Use confirmed student, guardian-link, and enrollment endpoints for the approved existing-guardian multi-call flow.
- Keep `studentsApiService` focused on student list/detail/update.
- Keep guardian creation data inside the registration DTO for this flow.
- Support existing-guardian selection through the approved multi-call orchestration because the composite registration DTO does not directly accept `guardianId`.
- Keep the create-new-guardian path on the composite registration endpoint.
- Keep the existing-guardian path isolated in `registrationApiService` orchestration and use confirmed student/guardian/enrollment/link endpoints only.

### UI/component tasks

1. Add wizard shell with four steps:
   - Student Information
   - Guardian
   - Enrollment
   - Review
2. Student Information step captures supported identity/contact/address fields.
3. Guardian step creates guardian profile as the primary registration flow.
4. Guardian step also supports selecting/linking an existing guardian through the approved multi-call flow.
5. Guardian relationship data sends only `is_primary`.
6. Keep `can_pickup` and `can_receive_notifications` on guardian profile fields, not relationship fields.
7. Enrollment step captures academic year, grade, section, classroom, term, enrollment date, and placement IDs based on the confirmed registration DTO.
8. Review step submits through `registrationApiService`; create-new-guardian uses the composite endpoint, while existing-guardian selection uses the approved multi-call orchestration.
9. Success state links to the created student profile.
10. Update Students list Add Student action to navigate to the localized registration route, e.g. `/{lang}/students-guardians/registration`, using the app's existing locale/navigation pattern.
11. Preserve form state on API validation errors.
12. Registration success state surfaces backend warnings where present.
13. Registration success state handles returned parent/student account summaries safely, including temporary password display only if returned by backend.

### Verification

- Mapper test: wizard state maps to the composite registration DTO.
- Mapper test: guardian profile fields and relationship fields stay separated.
- Mapper test: relationship sends only `is_primary`.
- Mapper test: enrollment sends confirmed DTO fields only.
- Service/orchestration test: existing-guardian selection uses the approved multi-call flow and does not send unsupported `guardianId` to the composite DTO.
- UI test where practical: Add Student navigates to Registration Wizard.
- UI test where practical: create-new-guardian submit calls composite registration.
- UI test where practical: existing-guardian submit follows the approved multi-call flow.
- UI test where practical: success state surfaces backend warnings.
- UI test where practical: temporary password display appears only when returned by backend.

## Phase 3: Student Profile Backend-Backed Tab Completion

Goal: reuse the existing Student Profile shell and complete only confirmed backend-backed behavior.

### Files to update

- `src/features/students-guardians/students/components/tabs/EnrollmentHistoryTab.tsx`
- `src/features/students-guardians/enrollments/services/enrollmentsApiService.ts`
- `src/features/students-guardians/students/components/tabs/MedicalTab.tsx`
- `src/features/students-guardians/medical/services/medicalProfileApiService.ts`
- `src/features/students-guardians/students/components/tabs/NotesTab.tsx`
- `src/features/students-guardians/notes/services/studentNotesApiService.ts`
- `src/features/students-guardians/students/components/tabs/GuardiansTab.tsx`
- `src/features/students-guardians/students/components/modals/AddGuardianModal.tsx`
- `src/features/students-guardians/guardians/services/guardiansApiService.ts`
- `src/features/students-guardians/students/components/tabs/DocumentsTab.tsx`
- `src/features/students-guardians/students/components/modals/UploadDocumentModal.tsx`
- `src/features/students-guardians/documents/services/studentDocumentsApiService.ts`
- `src/messages/en.json`
- `src/messages/ar.json`

### Files to create if needed

- `src/features/students-guardians/enrollments/services/__tests__/enrollmentsApiService.test.ts`
- `src/features/students-guardians/medical/services/__tests__/medicalProfileApiService.test.ts`
- `src/features/students-guardians/notes/services/__tests__/studentNotesApiService.test.ts`
- `src/features/students-guardians/guardians/services/__tests__/guardiansApiService.test.ts`
- `src/features/students-guardians/documents/services/__tests__/studentDocumentsApiService.test.ts`
- `src/features/students-guardians/students/components/tabs/__tests__/DocumentsTab.test.tsx`
- `src/features/students-guardians/students/components/tabs/__tests__/NotesTab.test.tsx`

### Service/API boundary changes

- `enrollmentsApiService` owns validate/create/upsert/current/history/list enrollment calls.
- `medicalProfileApiService` owns full medical profile read/update.
- `studentNotesApiService` owns list/create/update only.
- `guardiansApiService` owns guardian list/detail/create/update plus student guardian link/unlink/update-link.
- `studentDocumentsApiService` owns student-scoped list, missing, upload/create, view/download through confirmed file endpoints, import-from-application, and product-approved delete via `DELETE /students-guardians/documents/:documentId`.

### UI/component tasks

Enrollment History:

1. Show current enrollment and history through confirmed enrollment service calls.
2. Add management actions only where confirmed backend enrollment endpoints support them.
3. Gate management actions with `canManageEnrollments`.

Medical:

1. Expand from notes-only to full editable medical profile fields.
2. Include blood type, allergies, conditions, medications, and notes.
3. Gate edit actions with `canManageMedical`.

Notes:

1. Enable note editing through `studentNotesApiService`.
2. Keep delete hidden because backend supports list/create/update only.
3. Gate create/update actions with `canManageNotes`.

Guardians:

1. Support guardian-link editing through `guardiansApiService`.
2. Support unlink where confirmed, with confirmation and `canUnlinkGuardianFromStudent`.
3. Keep destructive guardian-record deletion hidden unless a backend endpoint is confirmed.
4. Keep relationship updates under named guardian-link capabilities.

Documents:

1. Replace mock URLs in `DocumentsTab.tsx`.
2. Remove `/documents/${doc.id}.pdf` fallback.
3. Use confirmed file-backed view/download only when file metadata includes enough data, such as `fileId`.
4. Show unavailable state instead of falling back to fake/sample URLs.
5. Support list, missing documents, upload/create, and import-from-application where confirmed.
6. Map import response states: `imported[]`, `skipped[]`, and `warnings[]`.
7. Student-document delete is backend-supported via `DELETE /students-guardians/documents/:documentId`, but include the delete UI only if product approves it.
8. If included, delete requires confirmation, `canManageDocuments` gating, and no fake fallback behavior.
9. Gate document actions with `canViewDocuments`, `canManageDocuments`, and `canImportAdmissionsDocuments`.

### Verification

- Service mapper tests for full medical profile fields.
- Notes tests confirm update exists and delete action is absent.
- Guardians tests cover link/update-link/unlink endpoint wiring and capability usage.
- Documents tests confirm no sample PDF or fake URL fallback exists.
- Documents tests cover `imported[]`, `skipped[]`, and `warnings[]`.
- Documents tests cover product-approved delete only if the delete UI is included; otherwise they confirm delete remains hidden by product decision.
- UI checks confirm Attendance and Grades tabs remain Coming Soon.

## Phase 4: Profile Correction Requests

Goal: add the staff queue workflow for reviewable student profile correction requests.

### Files to create

- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/page.tsx`
- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/[requestId]/page.tsx`
- `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestsQueuePage.tsx`
- `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestDetailPage.tsx`
- `src/features/students-guardians/profile-correction-requests/components/ProfileCorrectionRequestsTable.tsx`
- `src/features/students-guardians/profile-correction-requests/components/ProfileCorrectionRequestFilters.tsx`
- `src/features/students-guardians/profile-correction-requests/components/ProfileCorrectionComparison.tsx`
- `src/features/students-guardians/profile-correction-requests/components/ProfileCorrectionReviewActions.tsx`
- `src/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService.ts`
- `src/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests.ts`
- `src/features/students-guardians/profile-correction-requests/utils/profileCorrectionRequestMappers.ts`
- `src/features/students-guardians/profile-correction-requests/services/__tests__/profileCorrectionRequestsApiService.test.ts`
- `src/features/students-guardians/profile-correction-requests/utils/__tests__/profileCorrectionRequestMappers.test.ts`
- `src/features/students-guardians/profile-correction-requests/pages/__tests__/ProfileCorrectionRequestsQueuePage.test.tsx`

### Files to update

- `src/config/navigation.ts`
- `src/config/__tests__/navigation.test.ts`
- `src/features/students-guardians/index.ts`
- `src/messages/en.json`
- `src/messages/ar.json`

### Route additions

- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/page.tsx`
- `src/app/[lang]/(dashboard)/students-guardians/profile-correction-requests/[requestId]/page.tsx`

### Service/API boundary changes

`profileCorrectionRequestsApiService` owns:

- `GET /students-guardians/profile-correction-requests`
- `GET /students-guardians/profile-correction-requests/:requestId`
- `POST /students-guardians/profile-correction-requests/:requestId/approve`
- `POST /students-guardians/profile-correction-requests/:requestId/reject`

Query behavior:

- Send `status` and `studentId` only.
- Do not send date query parameters unless the backend query DTO adds date fields.
- If date filtering is needed in UI, keep it client-side or hide it.

### UI/component tasks

1. Add queue list with default pending or equivalent staff-focused view.
2. Add API-backed status and student filters.
3. Add detail page with request metadata.
4. Add current value vs requested value comparison.
5. Add approve flow with confirmation and `canReviewProfileCorrectionRequests`.
6. Add reject flow with confirmation and optional reviewer note.
7. Refresh queue/detail state after approve/reject.
8. Gate menu/route visibility with `canViewProfileCorrectionRequests`.

### Verification

- Mapper tests cover list item status and detail comparison normalization.
- Service tests confirm only supported query params are sent.
- Service tests confirm reject sends reviewer note only when provided.
- UI tests confirm review actions require `canReviewProfileCorrectionRequests`.
- Navigation tests confirm menu item appears only for the profile-correction view capability.

## Phase 5: Future-Scope Cleanup

Goal: prevent unsupported screens from pretending to be production-ready.

### Files to update

- `src/features/students-guardians/documents/pages/DocumentsCenter.tsx`
- `src/features/students-guardians/documents/services/documentsService.ts`
- `src/features/students-guardians/documents/services/documentsApiAdapter.ts`
- `src/features/students-guardians/documents/services/documentsAdapter.ts`
- `src/features/students-guardians/students/components/tabs/AttendanceTab.tsx`
- `src/features/students-guardians/students/components/tabs/GradesTab.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`

### UI/component tasks

Documents Center:

1. Remove mock global document list usage from production UI.
2. Remove mock stats usage from production UI.
3. Remove sample PDF URL usage.
4. Show Coming Soon / backend contract required state until global student-document list and stats endpoints exist.

Attendance:

1. Keep visible as Coming Soon.
2. Do not add frontend behavior until Attendance module contract is confirmed.

Grades:

1. Keep visible as Coming Soon.
2. Do not add frontend behavior until Academics module contract is confirmed.

### Verification

- Search production Students & Guardians paths for sample URLs and fake document fallbacks.
- Confirm `DocumentsCenter.tsx` no longer uses sample PDF URLs or mock global document/stats data.
- Confirm Attendance and Grades remain Coming Soon.

## Safe Implementation Order

1. Implement and test capability helpers.
2. Replace incorrect `settings.users.manage` gates in account-linking UI.
3. Prepare Profile Correction Requests navigation metadata if needed, but do not expose the visible menu item until the Phase 4 route pages exist.
4. Implement registration service, types, mappers, validation, and tests.
5. Implement Registration Wizard UI and route.
6. Wire Students list Add Student to Registration Wizard.
7. Complete Student Profile tabs one domain at a time:
   - Medical
   - Notes
   - Guardians
   - Enrollment
   - Documents
8. Implement Profile Correction Requests service, mappers, queue, detail, and review flows.
9. Convert Documents Center to Coming Soon/backend-contract-required state.
10. Run verification and remove any remaining unsupported query params, fake URLs, or raw permission strings in touched Students & Guardians code.

## Tests and Verification Commands

Run at minimum after implementation:

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`

Targeted checks during implementation:

- `npm run test:run -- src/features/students-guardians`
- `npm run test:run -- src/config/__tests__/navigation.test.ts`

Manual verification:

- Viewer-only permission state:
  - can view allowed pages only.
  - cannot see manager actions.
  - cannot see approve/reject actions.
- Manager/admin permission state:
  - can open Registration Wizard.
  - can manage confirmed Student Profile actions.
  - can review Profile Correction Requests.
- Documents:
  - no sample PDF URLs.
  - no fake `/documents/{id}.pdf` fallback.
  - delete action appears only if product approves it, with confirmation and `canManageDocuments` gating.
- Profile Correction Requests:
  - status/student filters are sent to backend.
  - date filters are not sent to backend.
- DTO boundary:
  - UI components consume frontend models/form state only.
  - raw backend DTO shapes stay inside service mappers.

## Explicit Out of Scope

- No standalone Create Student modal in the main Students list.
- Existing-guardian selection is in scope only through the approved multi-call Registration Wizard flow; do not send unsupported `guardianId` in the composite DTO.
- No Documents Center production implementation until global student-document list and stats endpoints exist.
- No global mock document data.
- No sample PDF URLs.
- No student-document delete action unless product approves exposing it, even though backend supports `DELETE /students-guardians/documents/:documentId`.
- No notes delete action because confirmed backend supports list/create/update only.
- No destructive guardian-record deletion without confirmed backend endpoint.
- No Attendance implementation beyond Coming Soon.
- No Grades implementation beyond Coming Soon.
- No unsupported query parameters on backend calls.

## Review Gate

This plan must be reviewed and approved before implementation starts.
