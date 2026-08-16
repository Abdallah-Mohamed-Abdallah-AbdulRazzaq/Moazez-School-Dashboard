# Data Model and Source of Truth

## Source-of-truth ownership

| Concept | Source-of-truth model/module | Notes |
| --- | --- | --- |
| Roll-call session | Attendance Core / `AttendanceSession` | Created/resolved through Attendance roll-call workflows. |
| Attendance entry | Attendance Core / `AttendanceEntry` | Source for present/absent/late/excused/early_leave/unmarked state. |
| Absence/lateness/early leave incident | Derived from `AttendanceEntry` | No separate Absence table. |
| Formal excuse request | Attendance Core / `AttendanceExcuseRequest` | Separate lifecycle from direct absence correction. |
| Behavior category | Behavior Core | Positive/negative category metadata. |
| Behavior record | Behavior Core | Manual behavior source event. |
| Behavior point delta | Behavior Core / point ledger | Used by Discipline where available. |
| Discipline timeline | Derived Discipline repository | Read-only composition from Attendance + Behavior. |
| Parent Reports discipline object | Parent Reports + Discipline read service | Additive raw counts, no formula score. |
| Teacher App attendance | Teacher adapter over Attendance Core | No Teacher-specific attendance storage. |

## Attendance-derived Discipline data

Discipline includes Attendance entries only when:

```text
AttendanceEntry.studentId = current student
AttendanceEntry.enrollmentId = current enrollment
AttendanceEntry.status in [ABSENT, LATE, EARLY_LEAVE, EXCUSED]
AttendanceEntry.session.status = SUBMITTED
AttendanceEntry.session.deletedAt = null
AttendanceEntry.session.academicYearId = current academic year
AttendanceEntry.session.termId = current term when available
```

## Behavior-derived Discipline data

Discipline includes Behavior records only when:

```text
BehaviorRecord.studentId = current student
BehaviorRecord.enrollmentId = current enrollment
BehaviorRecord.academicYearId = current academic year
BehaviorRecord.status = APPROVED
BehaviorRecord.deletedAt = null
BehaviorRecord.type in [POSITIVE, NEGATIVE]
BehaviorRecord.termId = current term or null when term scoped
```

## No duplicate data

The implementation intentionally does not introduce:

- Discipline table
- Discipline enum
- Discipline migration
- Discipline writes
- Attendance-to-Discipline copy job
- Behavior-to-Discipline copy job

The derived read layer queries source data at read time.

## Why this matters

This design prevents contradictory states such as:

- Attendance says absent, Discipline says excused.
- Behavior record is rejected, Discipline still shows it.
- Teacher modifies an entry while Discipline stores stale copy.

## App-facing response shaping

Core modules may contain internal school-scoped rows and workflow metadata. App-facing modules return presenter-shaped contracts with safe fields and aliases required by existing frontend conventions.
