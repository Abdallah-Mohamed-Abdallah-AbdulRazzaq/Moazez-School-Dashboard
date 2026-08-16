# Enrollments Backend Alignment Design

## Goal

Replace the mock-based Admissions Enrollment page with a backend-backed enrollment workspace that covers every enrollment and lifecycle endpoint currently exposed by Moazez Backend. The UI must show user-facing values instead of internal IDs and must not retain workflows the backend does not support.

Backend contract reference: commit `9865e56a6e20a4b8cd12960cd7ed4825ba3dce98` of `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`.

## Scope

The existing route remains `/{lang}/admissions/enrollment`. Its page is redesigned as a list with an enrollment-details drawer and focused mutation dialogs.

Remove:

- `mockStudentEnrollments`, `mockStudents`, and `mockApplications` as Enrollment page data sources.
- The `NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_ENROLLMENT_API` production switch.
- Unsupported `PATCH /enrollments/:id`, `/bulk-assign`, and `/promote-active` calls.
- Bulk classroom assignment and bulk promotion controls.
- Fabricated KPI chart series and hard-coded academic-year KPI values.
- Enrollment, application, and student ID columns.

Keep export, URL-backed filters, academic context, RTL support, and read-only context behavior where they remain compatible with the backend.

## Backend Endpoints

All paths are relative to `/students-guardians`.

| Method | Path | UI use | Permission |
|---|---|---|---|
| GET | `/enrollments` | List enrollments | `students.enrollments.view` |
| GET | `/enrollments/:enrollmentId` | Drawer overview | `students.enrollments.view` |
| GET | `/enrollments/current` | Drawer current placement | `students.enrollments.view` |
| GET | `/enrollments/history` | Drawer enrollment history | `students.enrollments.view` |
| GET | `/enrollments/academic-years` | Academic-year filters and form options | `students.enrollments.view` |
| POST | `/enrollments/validate` | Validate create/upsert placement | `students.enrollments.manage` |
| POST | `/enrollments` | Create enrollment | `students.enrollments.manage` |
| POST | `/enrollments/upsert` | Update or create a placement | `students.enrollments.manage` |
| POST | `/enrollments/transfer` | Transfer an active student | `students.lifecycle.manage` |
| POST | `/enrollments/withdraw` | Withdraw an active student | `students.lifecycle.manage` |
| POST | `/enrollments/promote` | Promote one active student | `students.lifecycle.manage` |
| GET | `/students/:studentId` | Resolve student display details | `students.records.view` |

## Feature Architecture

Create a self-contained Enrollment feature boundary:

- `api/enrollmentApi.ts`: authenticated HTTP calls only.
- `api/enrollmentDtos.ts`: exact request and response contracts.
- `model/enrollmentMappers.ts`: DTO-to-view-model mapping and status normalization.
- `hooks/useEnrollments.ts`: list loading, filtering inputs, refresh, and student-detail cache.
- `hooks/useEnrollmentDetails.ts`: overview/current/history orchestration with stale-request protection.
- `components/EnrollmentDetailsDrawer.tsx`: read-only details and action entry points.
- `components/EnrollmentPlacementDialog.tsx`: create/upsert with server validation.
- `components/EnrollmentLifecycleDialog.tsx`: transfer, withdraw, and promote variants.
- `pages/EnrollmentList.tsx`: page composition, permissions, filters, KPIs, export, and row selection.

The existing general Students enrollment adapter must no longer invent unsupported synchronous behavior or endpoints. Shared Students screens can use the new API functions or a thin async adapter backed by the same contracts.

## List Experience

The page loads enrollments with backend-supported filters:

- `studentId`
- `academicYearId`
- `academicYear`
- `status`

Because the backend does not currently support pagination, search, grade, section, classroom, or date filters, those filters operate client-side on the returned collection.

For visible rows, fetch `GET /students/:studentId` and cache each response by student ID for the page lifetime. The table shows:

- Student name in the active locale
- Enrollment status
- Academic year
- Grade
- Section
- Classroom
- Enrollment date

If student detail loading fails, show “Student unavailable.” Never substitute a raw ID.

KPIs are derived only from loaded enrollment data: total, active, and enrolled during the current week. No synthetic chart history is displayed.

## Details Drawer

Selecting a row opens a locale-aware side drawer and loads in parallel:

- `GET /enrollments/:enrollmentId`
- `GET /enrollments/current?studentId=...`
- `GET /enrollments/history?studentId=...`
- Student details from cache or `GET /students/:studentId`

The drawer contains Overview, Current Enrollment, and History sections. IDs remain internal. Permission-allowed actions are Edit Placement, Transfer, Withdraw, and Promote.

Closing or changing selection invalidates pending detail requests so stale responses cannot populate the wrong drawer.

## Create and Upsert

“New Enrollment” selects a student through the existing user-facing student selector pattern and collects:

- Student
- Academic year
- Grade
- Section
- Classroom
- Term when available
- Enrollment date

Before mutation, call `POST /enrollments/validate` with the same placement payload. When `valid` is false, do not submit. Map recognizable error codes to fields and show remaining errors in a summary.

- New records use `POST /enrollments`.
- Existing placement changes use `POST /enrollments/upsert`.
- Status sent during placement creation is either omitted or `active`, matching the backend contract.

The UI does not call a PATCH endpoint because none exists.

## Lifecycle Workflows

Lifecycle actions are single-student operations:

- Transfer: target section ID, target classroom ID, effective date, reason, optional notes.
- Withdraw: effective date, reason, optional notes; send `actionType: "withdrawn"`.
- Promote: target academic-year name, effective date, optional notes.

Transfer and withdraw use the currently selected student. Promote operates on one student and replaces the unsupported bulk-promotion workflow.

After a successful mutation, refresh the list, drawer overview, current enrollment, history, and academic-year options where applicable.

## Permissions

- Route and list visibility require `students.enrollments.view`.
- Student-name resolution requires `students.records.view`.
- Create, validate, and upsert require `students.enrollments.manage`.
- Transfer, withdraw, and promote require `students.lifecycle.manage`.

The frontend permission union and Enrollment navigation mapping must include these exact keys. Controls are omitted when permission is absent; a backend `403` remains handled because frontend hiding is not authorization.

## Error Handling

- `400`: display validation details beside fields or in a form summary.
- `403`: explain the missing capability without exposing backend internals.
- `404`: show that the student or enrollment is no longer available and offer list refresh.
- `409`: explain the conflicting active enrollment or invalid lifecycle transition and refresh stale data.
- Network/`500`: keep the current page or drawer open and offer retry.

Mutations prevent duplicate submission. List, student-name, drawer, and mutation loading states are independent.

## Contract Gaps

No backend change is required for functional integration. Current limitations are handled explicitly:

- Enrollment list responses do not include student names, so visible rows resolve them through `GET /students/:studentId`.
- Enrollment list responses do not include `applicationId`; the redesigned page does not display or depend on it.
- No bulk assignment or bulk promotion endpoints exist; those UI workflows are removed.
- No enrollment PATCH endpoint exists; edits use upsert.
- Server-side pagination and extended list filters are unavailable; filtering remains client-side.

## Testing

- API contract tests cover every endpoint, method, query, payload, and envelope shape.
- Mapper tests cover list/detail DTOs, nullable values, and statuses.
- Hook tests cover list refresh, cached student resolution, partial student lookup failures, detail concurrency, and stale-request protection.
- Component tests cover permissions, loading, empty/error states, drawer interaction, and absence of raw IDs.
- Workflow tests prove validation occurs before create/upsert and blocks invalid mutation.
- Lifecycle tests cover transfer, withdraw, and promote payloads plus success refresh and conflict errors.
- Regression tests prove unsupported endpoints and mock enrollment sources are no longer referenced by the Enrollment page.

Run focused Enrollment tests, full TypeScript checking, targeted ESLint, and `git diff --check` before handoff.

## Localization

All user-facing Enrollment copy is stored under `admissions.enrollment` in both `src/messages/en.json` and `src/messages/ar.json`. Dedicated nested groups cover statuses, details drawer content, placement forms, lifecycle workflows, common actions, loading/empty states, and errors.

Components use `next-intl` lookups instead of English literals. Backend enum values remain unchanged in requests and state, but their displayed labels use localized status keys. Student lookup failures display a localized fallback supplied by the caller; domain mappers do not contain presentation text.

English and Arabic Enrollment translation trees must have matching leaf-key paths. Focused verification checks key parity and scans Enrollment TSX files for remaining user-facing literals.
