# Attendance Core

## Source-of-truth responsibility

Attendance Core owns:

- Attendance policies.
- Roll-call sessions.
- Attendance entries.
- Derived absence/lateness/early-leave/excused incident reads.
- Direct absence correction convenience endpoints.
- Formal excuse requests and attachments.
- Attendance reports.

Teacher App Attendance, Student/Parent Discipline, and Parent Reports all consume Attendance Core data; they do not create competing attendance source data.

## Route base

All routes are under the global `/api/v1` prefix.

## Roll-call routes

```http
GET  /api/v1/attendance/roll-call/roster
POST /api/v1/attendance/roll-call/session/resolve
GET  /api/v1/attendance/roll-call/sessions
GET  /api/v1/attendance/roll-call/sessions/:id
POST /api/v1/attendance/roll-call/sessions/:id/submit
POST /api/v1/attendance/roll-call/sessions/:id/unsubmit
PUT  /api/v1/attendance/roll-call/sessions/:id/entries
PUT  /api/v1/attendance/roll-call/sessions/:id/entries/:studentId
POST /api/v1/attendance/roll-call/sessions/:sessionId/entries/:studentId/correct
```

### Permissions

| Action | Permission |
| --- | --- |
| Read roster/sessions/detail | `attendance.sessions.view` |
| Resolve/create session | `attendance.sessions.manage` |
| Submit/unsubmit session | `attendance.sessions.submit` |
| Save/update/correct entries | `attendance.entries.manage` |

## Absences and incident corrections

```http
GET   /api/v1/attendance/absences
GET   /api/v1/attendance/absences/summary
PATCH /api/v1/attendance/absences/:id/excuse
PATCH /api/v1/attendance/absences/:id/early-leave
```

Absence rows are not stored in a dedicated Absence table. They are derived from `AttendanceEntry` rows in submitted `AttendanceSession` rows.

### Direct correction rules

| Route | Accepted source statuses | Rejected source statuses | Mutation |
| --- | --- | --- | --- |
| `PATCH /attendance/absences/:id/excuse` | `ABSENT`, `LATE`, `EARLY_LEAVE` | `PRESENT`, `UNMARKED`, already `EXCUSED` | Sets source `AttendanceEntry.status` to `EXCUSED`. |
| `PATCH /attendance/absences/:id/early-leave` | `ABSENT`, `LATE`, `EARLY_LEAVE` | `PRESENT`, `UNMARKED`, `EXCUSED` | Sets source `AttendanceEntry.status` to `EARLY_LEAVE`. |

Both require a submitted session and writable/active term.

## Formal excuse requests

```http
GET    /api/v1/attendance/excuse-requests
GET    /api/v1/attendance/excuse-requests/:id
POST   /api/v1/attendance/excuse-requests
PATCH  /api/v1/attendance/excuse-requests/:id
GET    /api/v1/attendance/excuse-requests/:id/attachments
POST   /api/v1/attendance/excuse-requests/:id/attachments
DELETE /api/v1/attendance/excuse-requests/:id/attachments/:attachmentId
POST   /api/v1/attendance/excuse-requests/:id/approve
POST   /api/v1/attendance/excuse-requests/:id/reject
DELETE /api/v1/attendance/excuse-requests/:id
```

### Permissions

| Action | Permission |
| --- | --- |
| Read excuse requests and attachments | `attendance.excuses.view` |
| Create/update/delete/link attachments | `attendance.excuses.manage` |
| Approve/reject | `attendance.excuses.review` |

## Reports

```http
GET /api/v1/attendance/reports/summary
GET /api/v1/attendance/reports/daily-trend
GET /api/v1/attendance/reports/scope-breakdown
```

Requires:

```text
attendance.reports.view
```

## Closed-term protection

Attendance roll-call write mutations re-check the owning term before modifying session state or entries.

Protected writes include:

- Bulk entry save.
- Single entry upsert.
- Session submit.
- Session unsubmit.
- Submitted entry correction.
- Teacher App update entries through core delegation.
- Teacher App submit through core delegation.

Reads remain allowed for closed terms. Creating a new session in a closed term is rejected.

## No-leak posture

Attendance Core responses and derived app-facing responses must avoid exposing:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `deletedAt`
- storage internals
- raw actor ids in app-facing contracts
