# Attendance Policy Scope Conflict Design

## Goal

Handle the backend error code `attendance.policy.conflict` as an actionable policy-scope conflict instead of a generic save failure. Preserve the current wizard layout and all entered form values.

## Backend Error Contract

The API client converts the nested backend error payload into `ApiError`. The conflict is identified by:

- `code`: `attendance.policy.conflict`
- `details.academicYearId`
- `details.termId`
- `details.scopeType`
- `details.scopeKey`
- optional `traceId` retained by `ApiError`

The UI must classify the conflict by code rather than matching the English backend message.

## Shared Classifier

Add `isAttendancePolicyConflict(error)` at the attendance-policy domain boundary. It returns true only when the value is an `ApiError` whose code is `attendance.policy.conflict`.

Both save-flow consumers use this classifier:

- `AttendancePoliciesPage` suppresses the generic save-error toast for a recognized conflict, then rethrows the original error.
- `PolicyWizardDialog` catches the rethrown conflict and applies the focused recovery behavior.

Unknown errors retain the existing generic toast and wizard behavior.

## Wizard Recovery

When create or update fails with the conflict:

1. Keep the wizard open.
2. Preserve every form value.
3. Return to the Scope step.
4. Show an inline alert in the Scope step.
5. Keep the original scope selection visible so the user can understand and change it.

The English message is:

> An active policy already exists for this classroom. Edit or deactivate the existing policy before creating another active policy.

Arabic receives an equivalent localized message. The alert uses `role="alert"` and does not rely on color alone.

The conflict message clears when the user changes `scopeType`, `scopeIds`, or `isActive`. A subsequent save may then proceed normally. No automatic deactivation, deletion, or replacement of the existing policy occurs.

## Error Ownership

The page owns global toast behavior. The wizard owns form-level recovery and navigation. The shared classifier is the only place that knows the backend conflict code, preventing message matching and duplicated code checks.

The backend `details` and `traceId` remain available for diagnostics but are not rendered to end users in this change.

## Verification

Focused tests cover:

- The classifier accepts the exact conflict code and rejects unknown or non-API errors.
- The page suppresses the generic save toast for the known conflict.
- Unknown save errors still use the generic toast.
- The wizard returns to Scope after the conflict.
- Entered form values and the selected scope remain unchanged.
- The localized guidance renders as an alert.
- Changing scope or active status clears the alert.
