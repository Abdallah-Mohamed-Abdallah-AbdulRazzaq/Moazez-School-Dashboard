# Attendance / Behavior / Discipline

## Status

```text
Backend family status: V1_READY_WITH_DEFERRED_GAPS
Frontend integration status: READY_WITH_DOCUMENTED_DRIFT
Latest handoff commit: 0b840e8 docs: add attendance behavior discipline frontend handoff
```

## What this module family covers

This documentation describes the implemented V1 backend reality for three related but distinct capabilities:

1. **Attendance** — the source of truth for roll-call sessions, attendance entries, absence/lateness/early-leave/excused incidents, formal excuse requests, and attendance reports.
2. **Behavior** — the source of truth for positive/negative behavior categories, behavior records, review workflow, and behavior point ledger data.
3. **Discipline** — a derived, read-only Student/Parent layer that combines submitted Attendance incidents with approved Behavior records.

## Key architecture rule

Discipline is not a separate write model in V1.

There is no Discipline table, no Discipline mutation endpoint, and no Discipline score formula. Discipline responses are computed from:

- `AttendanceEntry` rows inside submitted `AttendanceSession` rows.
- `BehaviorRecord` rows whose status is approved.
- `BehaviorPointLedger` rows where available.

## Primary surfaces

| Surface | Route family | Purpose |
| --- | --- | --- |
| Dashboard/Admin Attendance | `/api/v1/attendance/*` | Source-of-truth attendance management and reporting. |
| Dashboard/Admin Behavior | `/api/v1/behavior/*` | Source-of-truth behavior categories, records, review, and summaries. |
| Teacher App Attendance | `/api/v1/teacher/classroom/:classId/attendance/*` | Teacher-owned classroom DAILY roll-call adapter over Core Attendance. |
| Student Behavior | `/api/v1/student/behavior/*` | Approved positive/negative behavior records for current student. |
| Parent Behavior | `/api/v1/parent/children/:studentId/behavior/*` | Approved behavior records for linked child. |
| Student Discipline | `/api/v1/student/discipline/*` | Derived read-only mixed attendance + behavior timeline/summary. |
| Parent Discipline | `/api/v1/parent/children/:studentId/discipline/*` | Derived read-only mixed timeline/summary for linked child. |
| Parent Reports | `/api/v1/parent/children/:studentId/reports/*` | Parent report summary including additive raw Discipline counts. |

## Most important frontend integration warnings

- Teacher App `classId` means `TeacherSubjectAllocation.id`, not `Classroom.id`.
- Teacher App attendance route base is singular: `/teacher/classroom/:classId/attendance`.
- Teacher App currently supports DAILY classroom attendance writes only.
- Teacher write statuses are limited to `present`, `absent`, `late`, and `excused`.
- `early_leave` and `unmarked` are Teacher read statuses only.
- Student/Parent Behavior routes are behavior-only; use Discipline routes for mixed Attendance + Behavior feeds.
- Parent Reports `disciplinePercentage` remains a legacy attendance present-rate, not a combined Discipline score.
- No Dashboard Discipline KPI is implemented in V1.
