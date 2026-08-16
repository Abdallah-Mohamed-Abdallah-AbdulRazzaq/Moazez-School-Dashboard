# Teacher App Attendance

## Route base

```http
/api/v1/teacher/classroom/:classId/attendance
```

## Critical identity rule

Teacher App `classId` is `TeacherSubjectAllocation.id`.

It is not:

- raw `Classroom.id`
- timetable entry id
- schedule id
- schedule occurrence id

The Teacher App surface is an adapter over Core Attendance. Core Attendance remains the source of truth for sessions and entries.

## Implemented routes

```http
GET  /api/v1/teacher/classroom/:classId/attendance/roster?date=YYYY-MM-DD
GET  /api/v1/teacher/classroom/:classId/attendance/today?date=YYYY-MM-DD
POST /api/v1/teacher/classroom/:classId/attendance/session/resolve
GET  /api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId
PUT  /api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId/entries
POST /api/v1/teacher/classroom/:classId/attendance/sessions/:sessionId/submit
```

## Route behavior

| Route | Behavior |
| --- | --- |
| `GET roster` | Reads owned allocation roster for a date. No session creation. |
| `GET today` | Preferred classroom attendance screen model with `session`, `summary`, and `students`. No session creation. |
| `POST session/resolve` | Resolves or creates a DAILY classroom Attendance session when allowed. |
| `GET sessions/:sessionId` | Reads owned session detail. |
| `PUT sessions/:sessionId/entries` | Updates entries for an owned DAILY session through Core Attendance. |
| `POST sessions/:sessionId/submit` | Submits an owned DAILY session through Core Attendance. |

## Read status mapping

| Core Attendance status | Teacher App read status |
| --- | --- |
| `PRESENT` | `present` |
| `ABSENT` | `absent` |
| `LATE` | `late` |
| `EXCUSED` | `excused` |
| `EARLY_LEAVE` | `early_leave` |
| `UNMARKED` | `unmarked` |
| Missing/no entry | `unmarked` |

## Write status support

Allowed write statuses:

```text
present
absent
late
excused
```

Read-only statuses that must not be sent in Teacher writes:

```text
early_leave
unmarked
```

## `today` response model

```ts
{
  classId: string;
  date: string;
  session: {
    id: string;
    status: 'draft' | 'submitted';
    mode: 'daily';
    submittedAt: string | null;
  } | null;
  summary: {
    totalCount: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    earlyLeaveCount: number;
    unmarkedCount: number;
    markedCount: number;
  };
  students: Array<{
    id: string;
    displayName: string;
    status: 'active';
    attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'early_leave' | 'unmarked';
    arrivalTime: string | null;
    dismissalTime: string | null;
    lateMinutes: number | null;
    earlyLeaveMinutes: number | null;
    excuseReason: string | null;
    note: string | null;
  }>;
}
```

## Current write drift / deferred fields

The DTO may include `arrivalTime` and `dismissalTime`, but the current accepted frontend handoff states that arrival/dismissal persistence is deferred. The frontend should not rely on those fields being persisted.

The following are also deferred:

- Teacher `lateMinutes` persistence.
- Teacher `excuseReason` persistence.
- Teacher `early_leave` write authority.
- Teacher unsubmit wrapper.
- Teacher submitted-entry correction wrapper.
- PERIOD attendance writes.
- scheduleId attendance writes.

## Security behavior

Teacher App Attendance uses existing teacher actor and allocation ownership boundaries.

Expected protections:

- Non-teacher users are denied.
- Same-school unowned allocation access returns safe not-found behavior.
- Cross-school allocation access returns safe not-found behavior.
- Cross-school guessed session ids remain hidden.
- Closed-term reads are allowed.
- Closed-term writes are protected by Core Attendance.

## No-leak posture

Teacher App attendance responses must not expose:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `deletedAt`
- `passwordHash`
- storage internals
- raw metadata
- internal marker/submission actor ids
