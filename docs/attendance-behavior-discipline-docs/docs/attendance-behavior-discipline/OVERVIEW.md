# Overview

## Executive summary

The Attendance / Behavior / Discipline family is ready for V1 integration with documented deferred gaps.

The current implementation separates source-of-truth modules from derived app-facing read models:

```text
Attendance Core  -> owns attendance sessions, entries, absences, excuses, reports
Behavior Core    -> owns behavior categories, records, review, points
Discipline Layer -> reads from Attendance + Behavior; owns no persisted source data
Teacher App      -> adapter over Core Attendance
Student App      -> reads own Behavior + derived Discipline
Parent App       -> reads linked-child Behavior + derived Discipline + Reports
```

## Why this separation matters

Attendance, Behavior, and Discipline look related in frontend screens, but they are not the same backend owner.

- Attendance is operational daily school state.
- Behavior is manually created and reviewed behavioral events.
- Discipline is a user-facing interpretation layer for incidents and behavior records.

Keeping Discipline derived prevents duplicated state and avoids creating conflicting write paths for absence, lateness, early leave, excused status, or behavior points.

## Implemented state by sprint

| Sprint | Result | Runtime meaning |
| --- | --- | --- |
| 25B | PASS | Closed-term write protection added to Attendance roll-call mutations. |
| 25C | PASS | Dashboard/Core absence correction convenience endpoints added. |
| 25E | PASS | Student/Parent read-only Discipline timeline and summary routes added. |
| 25F | PASS | Parent Reports aligned with derived Discipline summary counts. |
| 25H | PASS | Teacher App attendance read mapping adds explicit `today`, `unmarked`, `early_leave` read support. |
| 25J | PASS | Frontend handoff added; no runtime changes. |

## Runtime vs handoff

Sprint 25J is documentation-only. It does not add code. The runtime capabilities documented here come from the earlier 25B/25C/25E/25F/25H implementation sprints and the existing Attendance/Behavior/Teacher/Student/Parent modules.

## Current status phrase

`V1_READY_WITH_DEFERRED_GAPS` means:

- Safe backend-native routes exist for the accepted V1 scope.
- The frontend can integrate using documented routes and field mappings.
- Some ADR expectations are intentionally not implemented.
- Deferred items require product decisions before backend work.
