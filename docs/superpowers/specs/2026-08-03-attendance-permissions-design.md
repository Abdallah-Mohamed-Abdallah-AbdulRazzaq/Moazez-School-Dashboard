# Attendance Permissions and Global Forbidden Fallback — Design

## Goal

Make the Attendance dashboard permission-aware using the existing backend permission catalog, and provide a dashboard-wide fallback when any shared API request receives a `403 Forbidden` response. This is a frontend-only change; backend authorization remains the security boundary.

## Existing contract

The backend at `E:\Moazzez\Moazez-Backend-main` already enforces the following Attendance permissions through `@RequiredPermissions()`:

- `attendance.policies.view`, `attendance.policies.manage`
- `attendance.sessions.view`, `attendance.sessions.manage`, `attendance.sessions.submit`
- `attendance.entries.manage`
- `attendance.absences.view`
- `attendance.excuses.view`, `attendance.excuses.manage`, `attendance.excuses.review`
- `attendance.reports.view`

The dashboard already has the read permissions and two write permissions, but is missing `attendance.policies.manage`, `attendance.sessions.manage`, and `attendance.excuses.manage`. Its Late/Early navigation entry currently requires the write permission `attendance.entries.manage`, even though its data is read under `attendance.absences.view`.

## Attendance access matrix

| Area | Page access | Enabled actions |
| --- | --- | --- |
| Policies | `attendance.policies.view` | Create, edit, delete require `attendance.policies.manage`. |
| Roll call | `attendance.sessions.view` | Resolve a session requires `attendance.sessions.manage`; recording or correcting entries requires `attendance.entries.manage`; submit and unsubmit require `attendance.sessions.submit`. |
| Absences | `attendance.absences.view` | Marking an absence excused and correcting early leave require `attendance.entries.manage`. |
| Late/Early | `attendance.absences.view` | Editing late or early-leave minutes requires `attendance.entries.manage`. |
| Excuses | `attendance.excuses.view` | Creating, editing, deleting, and attachment changes require `attendance.excuses.manage`; approval and rejection require `attendance.excuses.review`. |
| Reports | `attendance.reports.view` | The backend has no separate report-write permission. |

Users without the page-access permission see the existing `AccessDenied` banner. The attendance page must not start its page-specific data requests in that state. Users with page access see all current controls, but controls for unavailable actions are disabled. Term read-only state remains a separate, additional restriction.

## Frontend architecture

1. Add the three missing Attendance write keys to `PermissionKey` in `src/hooks/usePermissions.ts`.
2. Correct the Late/Early navigation mapping to `attendance.absences.view`.
3. Add a focused shared Attendance view guard that consumes `usePermissions()` and renders the existing `AccessDenied` component when the requested view permission is absent.
4. Use the guard in each Attendance page before page-specific request effects and pass explicit capability booleans to the relevant controls, tables, drawers, and dialogs.
5. Do not change the backend, permissions API contract, seeded roles, or endpoint contracts.

This stays scoped to Attendance rather than introducing a new application-wide action-permission component. The existing `usePermissions()` hook remains the single source of frontend permission state.

## Global `403` fallback

The shared Axios response layer will dispatch a browser event whenever an API response has status `403`. It will still reject the original request as the existing typed `ApiError`; it must not retry, redirect, or consume the error.

A client-side provider mounted in the dashboard layout will listen for that event and render the existing `AccessDenied` banner at the dashboard-shell level. The banner:

- applies to all dashboard modules that use the shared API client;
- remains visible for the current route after one or more forbidden responses;
- clears only after the pathname changes; and
- is additive to local page guards and local error handling.

The fallback is intentionally non-destructive: an unexpected forbidden response from an optional request or stale action must not replace the current page or discard user work.

## Error handling

The backend remains authoritative. Proactive guards avoid predictable unauthorized requests, while the global fallback informs the user if permissions change or a request was not modeled in the UI. Existing feature-level handlers continue to receive the same `ApiError` and may retain their current local error behavior.

## Tests

- Permission typing and navigation tests cover all Attendance permission keys and the corrected Late/Early read gate.
- Attendance page tests verify that a user without the page view permission sees `AccessDenied` and does not trigger page-specific attendance requests.
- Control tests verify each write capability is disabled independently while authorized read access stays available.
- API-client tests verify that a `403` emits the global event and preserves the rejected `ApiError`.
- Provider tests verify the dashboard-level banner appears for `403`, persists for the current route, and clears on pathname change.

## Out of scope

- Backend guard, permission-catalog, role-seed, or API-contract changes.
- Replacing existing permission handling in non-Attendance modules.
- A global permission component for every individual action.
