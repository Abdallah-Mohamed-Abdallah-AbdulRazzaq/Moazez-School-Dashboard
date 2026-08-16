# Parent Reports Discipline Summary

## Routes

```http
GET /api/v1/parent/children/:studentId/reports
GET /api/v1/parent/children/:studentId/reports/summary
```

## What changed

Parent Reports now includes an additive `discipline` object based on the derived Discipline summary.

The existing fields are preserved.

## Backward-compatible legacy field

`disciplinePercentage` and `discipline_percentage` remain attendance-derived present-rate fields.

Formula:

```text
disciplinePercentage = present / (present + absence + lateness)
```

This is not a combined Discipline score.

## New additive `discipline` object

`discipline` is raw-count based and follows the derived Discipline summary contract:

```ts
{
  totalIncidents: number;
  total_incidents: number;
  attendanceIncidentCount: number;
  attendance_incident_count: number;
  absenceCount: number;
  absence_count: number;
  lateCount: number;
  late_count: number;
  earlyLeaveCount: number;
  early_leave_count: number;
  excusedCount: number;
  excused_count: number;
  positiveCount: number;
  positive_count: number;
  negativeCount: number;
  negative_count: number;
  behaviorPoints: number;
  behavior_points: number;
  period: string;
  dateText: string;
  date_text: string;
}
```

## Parent report summary sections

The summary response includes:

```text
child
period
academic
behavior
attendance
discipline
xp
unavailable
```

## Source-of-truth rules

The Parent Reports adapter reads:

- academic progress from Parent Progress read model
- behavior progress from Parent Progress read model
- XP progress from Parent Progress read model
- discipline summary from `DisciplineDerivedReadService.getSummary()`

The `discipline` object uses the same rules as Student/Parent Discipline:

- submitted Attendance sessions only
- `ABSENT`, `LATE`, `EARLY_LEAVE`, `EXCUSED` attendance statuses only
- approved Behavior records only
- Behavior point ledger where available
- no duplicated discipline storage

## What is not implemented

Parent Reports does not implement:

- combined Discipline score
- replacement for `disciplinePercentage`
- PDF export engine
- report templates engine
- live dashboard Discipline KPI
- Discipline writes
