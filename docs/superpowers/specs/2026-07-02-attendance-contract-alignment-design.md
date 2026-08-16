# Attendance Contract Alignment Design

## Goal

Align the existing admin attendance frontend with `docs/moazez_attendance_frontend_contract.md` while preserving the current attendance pages and workflows. This pass focuses on service contracts, request payloads, response mapping, error handling, and focused verification.

## Scope

The admin attendance module covers:

- Roll call
- Absences and derived incidents
- Late and early-leave management
- Formal excuse requests
- Reports
- Policies

This pass does not introduce the shared attendance workspace shell, standardize page headers and filters, redesign mobile actions, or implement Teacher App classroom attendance screens. Those UI/UX changes are intentionally deferred to a follow-up design so contract risk can be handled first.

## Architecture

Each attendance service remains the boundary between component-facing models and backend DTOs. Components may continue using existing UI models such as `yearId`, local filter types, and normalized display fields. Services are responsible for converting those models into documented backend query parameters and request bodies.

Outbound serializers must produce DTO-clean objects. They omit unknown fields, remove `undefined` values, preserve meaningful explicit values such as `false` and `0`, and prefer `academicYearId` over `yearId`. Response mappers normalize documented compatibility aliases such as `academicYearId/yearId`, `lateMinutes/minutesLate`, `earlyLeaveMinutes/minutesEarlyLeave`, and wrapped `{ items }` responses.

Malformed responses that omit required identifiers or context are treated as contract failures in service code and tests. Optional fields may receive UI defaults only where the current frontend model already defines a safe default.

## Roll Call

Roll call uses the core `/attendance/roll-call` endpoints with uppercase Prisma enum values, including attendance status, mode, and scope type.

The roster screen first calls `GET /attendance/roll-call/roster` to preview students and current state without creating a session. `POST /attendance/roll-call/session/resolve` is called only when the user intentionally starts or opens attendance for editing. `PERIOD` sessions must include a `periodKey`; `DAILY` sessions use the backend daily key behavior and do not invent period fields.

Draft saves use:

- `PUT /attendance/roll-call/sessions/:id/entries`
- `PUT /attendance/roll-call/sessions/:id/entries/:studentId`

Submitted edits use:

- `POST /attendance/roll-call/sessions/:sessionId/entries/:studentId/correct`

Correction requests include the required `status` and `correctionReason` fields. A late-minute correction sends a full correction payload, for example:

```json
{
  "status": "LATE",
  "lateMinutes": 10,
  "correctionReason": "Corrected after review"
}
```

Submit and reopen continue through the documented submit and unsubmit endpoints. The list and detail session endpoints do not send unsupported pagination fields.

## Absences And Late/Early

Absence and incident screens use derived backend incident views instead of local incident synthesis as the source of truth.

Absences use:

- `GET /attendance/absences`
- `GET /attendance/absences/summary`
- `PATCH /attendance/absences/:id/excuse`
- `PATCH /attendance/absences/:id/early-leave`

Late and early-leave views continue filtering the same derived incident list for `LATE` and `EARLY_LEAVE`. Early-leave minute edits use the documented early-leave correction endpoint. Late minute corrections use the roll-call correction endpoint when the backend incident contract requires entry correction through the source session and student, and they must send `status: "LATE"` along with `lateMinutes` and `correctionReason`.

Service filters send only documented query fields. Client-only filters, such as text matching or UI-only violation toggles, remain client-side after the backend result is mapped.

## Formal Excuses

Formal excuse requests use `/attendance/excuse-requests`.

Create and update serializers include only documented fields:

- `academicYearId`
- `termId`
- `studentId`
- `type`
- `dateFrom`
- `dateTo`
- `selectedPeriodKeys`
- `selectedPeriodIds`
- `lateMinutes`
- `earlyLeaveMinutes`
- `reasonAr`
- `reasonEn`

Attachments are linked with `POST /attendance/excuse-requests/:id/attachments` using `{ fileIds }`. The UI must not treat this route as multipart upload. Approve and reject calls send only `{ decisionNote }`. Delete expects the documented `{ ok: true }` response shape but does not require components to consume it directly.

Policy-based validation in the modal remains a frontend guard, but the mutation payloads must stay aligned with the formal excuse DTO.

## Reports

Reports use the documented aggregate endpoints:

- `GET /attendance/reports/summary`
- `GET /attendance/reports/daily-trend`
- `GET /attendance/reports/scope-breakdown`
- `GET /attendance/reports/derived-daily-absences`

Report query builders send only documented shared fields and the required `groupBy` field for scope breakdown. Unlike Prisma-backed attendance enums, report `groupBy` uses lowercase values: `stage`, `grade`, `section`, and `classroom`. Rates from the backend are stored as `0..1` decimal values in mapped report models. Percentage formatting belongs in the presentation layer and must not feed `0..100` values back into service models.

## Policies

The existing policy page and wizard remain in place. The policy service keeps explicit list, effective, validate-name, create, patch, and delete contracts.

Create serializers generate the complete supported DTO shape. Patch serializers send only explicitly supplied fields. Name validation uses the backend `validate-name` endpoint and continues to include `excludeId` for edit flows. Policy conflict handling remains scoped to the documented `attendance.policy.conflict` code.

Compatibility aliases in policy responses are normalized at the service boundary. Components should not branch on backend envelope variants.

## Error Handling

Backend error envelopes are handled through the existing API error path. The normalized backend shape is:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "...",
    "details": {},
    "traceId": "..."
  }
}
```

Service-level contract failures should surface as ordinary failures to page code rather than silently manufacturing usable data.

Expected behavior:

- Validation and conflict errors preserve user-entered form state.
- Submitted-session conflicts do not overwrite local edits.
- Correction failures leave incident or entry rows unchanged.
- Report failures show the current page-level error or empty-state pattern.
- DTO-clean serializers prevent avoidable `validation.failed` responses from unknown fields.

## Deferred UI/UX Work

The following UI/UX items are explicitly out of this first pass:

- Shared `AttendanceWorkspaceShell`
- Standardized attendance page headers
- Unified desktop filter bands
- Unified mobile filter drawers and action bars
- Cross-page empty, loading, and error-state redesign
- Broader spacing, table, and card visual cleanup

Those changes should be designed after contract tests are passing so the UI migration can reuse stable services.

## Verification

Focused service tests cover:

- Exact endpoints, methods, params, and bodies for each attendance service.
- Use of `academicYearId` in outbound core attendance requests.
- Uppercase Prisma enum values for core `/attendance/*` calls, while preserving lowercase report `groupBy` values.
- No unsupported core pagination fields where the backend DTO omits them.
- `PERIOD` roll-call payloads including `periodKey`.
- Correction calls including required `status` and `correctionReason` fields.
- Formal excuse attachment linking with `fileIds`.
- Approve and reject bodies containing only `decisionNote`.
- Report rates preserved as `0..1`.
- Response mapper behavior for documented wrappers and aliases.
- Contract failures for malformed required response data.

Verification finishes with the focused attendance service tests, the relevant component tests already covering policy conflict/name-validation behavior, TypeScript checking, and linting of changed files.
