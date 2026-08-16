# Attendance excuse approval: eligibility contract handoff

## Observed issue

An attendance excuse request can remain `PENDING` even when its matching roster entry is already `EXCUSED`.

Observed example on 2026-07-19:

- Excuse request `40d9a749-121f-4cd3-999e-84dafa507385`
  - student: `82596d00-447d-4034-9ac9-c0147a852a0c`
  - type: `ABSENCE`
  - status: `PENDING`
  - date range: `2026-07-19` to `2026-07-19`
- Matching daily school roster session `0d3decf9-5c4e-427e-83ab-5674cb8c7d29`
  - status: `SUBMITTED`
  - entry status for the same student: `EXCUSED`

When the user approves the request, the API returns:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "No matching submitted attendance entry exists for this excuse"
  }
}
```

## Current backend behavior

`ApproveAttendanceExcuseRequestUseCase` maps an excuse type to the required current entry status:

| Excuse type | Required entry status before approval |
|---|---|
| `ABSENCE` | `ABSENT` |
| `LATE` | `LATE` |
| `EARLY_LEAVE` | `EARLY_LEAVE` |

The approval query considers only sessions that are `SUBMITTED`, are in the request's academic year and term, fall within the request date range, and match selected periods when present. It then looks for the student's entries with the required status. If no such entry exists, approval returns `validation.failed`.

Therefore, the observed response is technically correct: an `EXCUSED` entry is not an `ABSENT` entry and cannot be converted to `EXCUSED` again. However, the response does not explain that the record is already excused.

## Why the existing response is not enough for the frontend

The excuse request payload does not include matching sessions or entry statuses. The roster payload has `currentStatus`, but it does not identify which excuse request, if any, caused an `EXCUSED` status. The frontend cannot safely reproduce the backend's matching rules for multi-date, multi-session, or period-based requests.

Do not rely on the frontend to infer approval eligibility from roster data alone. The backend must remain the authority for the decision.

## Required backend changes

### 1. Provide an eligibility preview

Add a server-computed endpoint, for example:

```http
GET /attendance/excuse-requests/:excuseRequestId/eligibility
```

The endpoint must reuse the same matching logic used by approval. A proposed response shape is:

```json
{
  "state": "ALREADY_EXCUSED",
  "eligibleEntryCount": 0,
  "alreadyExcusedEntryCount": 1,
  "entries": [
    {
      "entryId": "a5887e58-fb0d-40af-9773-18c218d1c05d",
      "sessionId": "0d3decf9-5c4e-427e-83ab-5674cb8c7d29",
      "date": "2026-07-19",
      "periodKey": "daily",
      "status": "EXCUSED"
    }
  ]
}
```

Recommended `state` values:

- `READY_TO_APPROVE`: one or more matching entries have the required status.
- `ALREADY_EXCUSED`: matching submitted entries exist but are already `EXCUSED`.
- `NO_SUBMITTED_ATTENDANCE`: no matching submitted session or student entry exists.
- `STATUS_DOES_NOT_MATCH`: matching submitted entries exist, but their statuses do not match the excuse type.

The response may include other counts, but must not claim that an `EXCUSED` entry was produced by this request unless a persisted request-to-entry relationship proves it.

### 2. Return stable domain errors from approval

Keep the approval endpoint authoritative and race-safe. When an approval cannot proceed, return a specific code rather than generic `validation.failed`:

| Situation | Proposed code | HTTP status |
|---|---|---|
| Matching entry is already `EXCUSED` | `attendance.excuse.already_excused` | `409` |
| No submitted matching session or entry | `attendance.excuse.no_submitted_entry` | `422` |
| Submitted entry has a different status | `attendance.excuse.status_mismatch` | `422` |

Include the same eligibility summary in `error.details` so the frontend can recover correctly if the state changes after preview.

### 3. Decide how duplicate pending requests are resolved

For a pending request whose matching entry is already excused, do not automatically approve it unless there is proof that this request caused the excusal. The staff workflow should be to review and reject/close the duplicate request, or to correct attendance first if the entry was excused in error.

## Frontend behavior after the contract is available

On the request details page, fetch eligibility before enabling approval:

| Eligibility state | UI behavior |
|---|---|
| `READY_TO_APPROVE` | Enable Approve and show the number of entries that will change. |
| `ALREADY_EXCUSED` | Disable Approve; show “Attendance is already excused. Review or reject this duplicate request.” |
| `NO_SUBMITTED_ATTENDANCE` | Disable Approve; direct staff to Roll Call to submit attendance. |
| `STATUS_DOES_NOT_MATCH` | Disable Approve; show the current attendance status and direct staff to Roll Call. |

Until this endpoint and stable error codes exist, the frontend can only provide a best-effort fallback after the approval request fails.
