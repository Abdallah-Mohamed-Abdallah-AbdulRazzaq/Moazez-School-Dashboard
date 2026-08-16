# Deferred Gaps and Non-Goals

## Current accepted state

The family is V1-ready with documented deferred gaps. The gaps below are not defects in the current accepted V1 contract.

## Deferred Teacher App Attendance capabilities

- Teacher `early_leave` write authority.
- Teacher `lateMinutes` persistence.
- Teacher `excuseReason` persistence.
- Teacher arrival time persistence.
- Teacher dismissal time persistence.
- Teacher unsubmit wrapper.
- Teacher submitted-entry correction wrapper.
- PERIOD attendance writes.
- scheduleId attendance writes.

## Deferred Discipline / Reports capabilities

- Dashboard Discipline KPI route.
- Dashboard Discipline card/formula.
- Combined Attendance + Behavior discipline score.
- Combined discipline percentage.
- Replacement of legacy `disciplinePercentage`.
- Discipline analytics builder.

## Deferred API compatibility conveniences

- `/api/v1/teacher/classrooms/*` plural aliases.
- `/api/v1/attendance/context` convenience endpoint.
- Attendance route aliases to match older ADR route examples.
- Behavior optional mixed-feed compatibility mode.

## Explicit non-goals

The current implementation does not add:

- Discipline Prisma model.
- Discipline database table.
- Discipline writes.
- Discipline migration.
- duplicated Attendance/Behavior storage.
- notification side effects.
- XP/reward side effects from Discipline.
- PDF report export engine.
- report template engine.
- frontend-specific route renames that break stable backend APIs.

## Future decision queue

| Future sprint | Product decision needed |
| --- | --- |
| Teacher App Attendance Write Decision Audit | Whether teachers may write late minutes, early leave, excuses, unsubmit, corrections, period/scheduleId attendance. |
| Dashboard Discipline KPI Decision Audit | Whether a dashboard KPI exists and what formula/source it uses. |
| Reports Combined Discipline Score Formula Decision Audit | Whether to compute a combined score and how to weight attendance vs behavior. |
| API Compatibility Alias Decision Audit | Whether to add aliases for frontend compatibility. |
| Attendance Context Convenience Decision Audit | Whether `/attendance/context` is needed. |
| Behavior Feed Compatibility Decision Audit | Whether Behavior routes should optionally include mixed Discipline items. |
