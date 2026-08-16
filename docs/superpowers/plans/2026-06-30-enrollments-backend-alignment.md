# Enrollments Backend Alignment Implementation Plan

Design: `docs/superpowers/specs/2026-06-30-enrollments-backend-alignment-design.md`

## 1. Define exact enrollment contracts

Create:

- `src/features/admissions/enrollment/api/enrollmentDtos.ts`
- `src/features/admissions/enrollment/api/enrollmentApi.ts`
- `src/features/admissions/enrollment/api/__tests__/enrollmentApi.test.ts`

Implement typed calls for list, detail, current, history, academic years, validate, create, upsert, transfer, withdraw, and promote. Use the existing authenticated `apiGet`/`apiPost` helpers and query serialization conventions. Encode UUIDs in path segments.

Contract tests must assert every endpoint, HTTP method, query, and payload, including `actionType: "withdrawn"`.

## 2. Add domain models and mapping

Create:

- `src/features/admissions/enrollment/model/enrollment.ts`
- `src/features/admissions/enrollment/model/enrollmentMappers.ts`
- `src/features/admissions/enrollment/model/__tests__/enrollmentMappers.test.ts`

Map backend DTO names such as `enrollmentId` into an Enrollment view model. Preserve status, academic structure labels/IDs, and enrollment date. Add a separate student summary type; never use IDs as display-name fallbacks.

Remove dependence on the legacy Admissions `Enrollment` shape where it requires `applicationId`.

## 3. Add student-detail resolution

Reuse or extend the existing Students API service for:

- `GET /students-guardians/students/:studentId`

Create:

- `src/features/admissions/enrollment/hooks/useEnrollmentStudents.ts`
- `src/features/admissions/enrollment/hooks/__tests__/useEnrollmentStudents.test.ts`

Resolve visible-row student IDs with bounded parallel requests and cache successful and failed lookups for the page lifetime. Expose localized display names and “Student unavailable” for failures without exposing IDs.

## 4. Build list and details state hooks

Create:

- `src/features/admissions/enrollment/hooks/useEnrollments.ts`
- `src/features/admissions/enrollment/hooks/useEnrollmentDetails.ts`
- focused hook tests under `hooks/__tests__/`

`useEnrollments` owns backend filters, list loading/error/retry, academic years, mutation refresh, and client-side filters unsupported by the server.

`useEnrollmentDetails` loads detail, current enrollment, history, and student summary in parallel. Protect against stale updates when selection changes or the drawer closes.

## 5. Implement details drawer

Create:

- `src/features/admissions/enrollment/components/EnrollmentDetailsDrawer.tsx`
- `src/features/admissions/enrollment/components/__tests__/EnrollmentDetailsDrawer.test.tsx`

Render Overview, Current Enrollment, and History. Add permission-gated Edit Placement, Transfer, Withdraw, and Promote actions. Support RTL/LTR placement, focus management, Escape/backdrop closing, independent loading/error states, and retry.

Internal IDs may be used for requests but must not render.

## 6. Implement placement create/upsert workflow

Replace or refactor:

- `src/features/admissions/enrollment/components/EnrollmentForm.tsx`

Create a single `EnrollmentPlacementDialog` that supports create and edit modes. Use user-facing student and academic structure selectors. Submit `POST /validate` first; stop on `{ valid: false }`; then call create or upsert. Add field/summary errors, duplicate-submit protection, and permission/read-only handling.

Add focused tests proving validation precedes mutation and invalid placement blocks mutation.

## 7. Implement lifecycle dialogs

Create:

- `src/features/admissions/enrollment/components/EnrollmentLifecycleDialog.tsx`
- focused component tests

Support three variants:

- Transfer: section, classroom, effective date, reason, optional notes.
- Withdraw: effective date, reason, optional notes, fixed `actionType: "withdrawn"`.
- Promote: target academic-year name, effective date, optional notes.

After success, close safely and refresh list/detail/current/history.

## 8. Redesign the Enrollment list page

Update:

- `src/features/admissions/enrollment/pages/EnrollmentList.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`

Replace all mock sources with the new hooks. Show student name, status, academic year, grade, section, classroom, and enrollment date. Add backend status/year filters and client-side search/grade/date filters. Row click opens the drawer.

Replace fabricated KPIs with totals derived from loaded data. Remove bulk assignment, bulk promotion, application-ID behavior, raw ID columns, and the legacy application enrollment modal.

Keep export restricted to visible user-facing columns.

## 9. Align permissions and navigation

Update:

- `src/hooks/usePermissions.ts`

Add exact keys:

- `students.enrollments.view`
- `students.enrollments.manage`
- `students.lifecycle.manage`
- `students.records.view`

Map the Admissions Enrollment navigation entry to `students.enrollments.view`. Add access-denied handling and hide mutation actions by capability.

## 10. Remove unsupported adapter behavior

Update:

- `src/features/students-guardians/students/services/enrollmentApiAdapter.ts`
- `src/features/students-guardians/students/services/enrollmentService.ts`
- related adapter/service tests

Remove unsupported PATCH, bulk assignment, and bulk promotion API calls and the `NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_ENROLLMENT_API` switch. Route supported async behavior through the new contract-backed API layer or a thin shared adapter.

Preserve mock-only utilities only when another screen still imports them; do not let the production Enrollment page use them.

## 11. Integration and regression tests

Add or update tests to cover:

- All endpoint contracts and DTO mapping.
- List loading, filters, empty/error/retry, export, and no raw IDs.
- Student detail cache and partial lookup failure.
- Drawer detail/current/history requests and stale-response protection.
- Placement validation, create, and upsert.
- Transfer, withdraw, and promote.
- Permission combinations and read-only academic context.
- Absence of mock Enrollment page imports and unsupported endpoint strings.

## 12. Verification

Run:

```text
npm run test:run -- src/features/admissions/enrollment src/features/students-guardians/students/services
npm run typecheck
npm run lint -- src/features/admissions/enrollment src/features/students-guardians/students/services src/hooks/usePermissions.ts
git diff --check
```

Apply `clean-code-guard` to production changes, `test-guard` to test changes, and `docs-guard` to any changed documentation. Preserve unrelated worktree changes and do not commit implementation unless requested.

## 13. Localize Enrollment UI

Update `src/messages/en.json` and `src/messages/ar.json` with matching keys under `admissions.enrollment` for list states, statuses, details, placement, lifecycle workflows, common actions, and errors.

Update Enrollment components and mappers so every user-facing label, action, empty state, loading message, fallback, and error uses `next-intl`. Translate status labels only at rendering boundaries; preserve backend enum values. Add a focused key-parity test and scan Enrollment TSX files for remaining English UI literals.
