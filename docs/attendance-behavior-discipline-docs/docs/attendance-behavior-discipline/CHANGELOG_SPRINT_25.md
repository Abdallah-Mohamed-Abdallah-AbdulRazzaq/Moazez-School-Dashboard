# Sprint 25 Changelog

## Sprint 25A — Reality / Contract Audit

Planning and reality audit for Attendance / Behavior / Discipline. It identified backend reality, route drift, teacher attendance gaps, and the need for a derived Discipline decision.

## Sprint 25B — Attendance Core Contract Closeout

Implemented focused runtime hardening for Attendance roll-call closed-term writes.

Protected mutations:

- Bulk save roll-call entries.
- Single entry upsert through the save flow.
- Submit roll-call session.
- Unsubmit roll-call session.
- Correct submitted entry.
- Teacher App update entries via core delegation.
- Teacher App submit via core delegation.

No route aliases were added. `/attendance/context` remained deferred.

## Sprint 25C — Attendance Absence Corrections

Added Dashboard/Core Attendance convenience correction routes:

```http
PATCH /api/v1/attendance/absences/:id/excuse
PATCH /api/v1/attendance/absences/:id/early-leave
```

These routes mutate only the source `AttendanceEntry` behind a submitted session.

They do not create:

- `AttendanceExcuseRequest`
- Discipline records
- Behavior records
- Absence tables
- duplicated incident storage

## Sprint 25D — Discipline Derived Layer Decision

Selected the derived/read-only model for Discipline.

Decision:

- Do not add Discipline write models.
- Do not add Discipline tables.
- Do not mix Discipline into Behavior routes by default.
- Add dedicated Student/Parent derived Discipline read routes.

## Sprint 25E — Student/Parent Discipline Derived Timeline

Added read-only routes:

```http
GET /api/v1/student/discipline
GET /api/v1/student/discipline/summary
GET /api/v1/parent/children/:studentId/discipline
GET /api/v1/parent/children/:studentId/discipline/summary
```

Derived sources:

- Submitted attendance incidents: absent, late, early leave, excused.
- Approved behavior records: positive, negative.

## Sprint 25F — Parent Reports Discipline Alignment

Added additive raw `discipline` object to Parent Reports.

Preserved legacy fields:

- `disciplinePercentage`
- `discipline_percentage`

Important: those fields remain attendance present-rate, not combined Discipline score.

## Sprint 25H — Teacher App Attendance Mapping Read Closeout

Added read-only `today` route:

```http
GET /api/v1/teacher/classroom/:classId/attendance/today?date=YYYY-MM-DD
```

Teacher read statuses now include:

- `present`
- `absent`
- `late`
- `excused`
- `early_leave`
- `unmarked`

Teacher write statuses remain limited to:

- `present`
- `absent`
- `late`
- `excused`

## Sprint 25J — Frontend Handoff

Documentation-only handoff.

No runtime changes.

Final declared state:

```text
Attendance / Behavior / Discipline Backend: V1_READY_WITH_DEFERRED_GAPS
Frontend integration: READY_WITH_DOCUMENTED_DRIFT
```
