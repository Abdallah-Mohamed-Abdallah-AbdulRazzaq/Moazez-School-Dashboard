# Discipline Derived Layer

## Definition

Discipline is a derived read-only layer for Student App and Parent App.

It combines:

1. Attendance incidents from submitted sessions.
2. Approved Behavior records.

It does not own persistence.

## Routes

### Student App

```http
GET /api/v1/student/discipline
GET /api/v1/student/discipline/summary
```

### Parent App

```http
GET /api/v1/parent/children/:studentId/discipline
GET /api/v1/parent/children/:studentId/discipline/summary
```

## Data sources

### Attendance source

Included rows:

- `AttendanceEntry.status = ABSENT`
- `AttendanceEntry.status = LATE`
- `AttendanceEntry.status = EARLY_LEAVE`
- `AttendanceEntry.status = EXCUSED`
- parent `AttendanceSession.status = SUBMITTED`
- session not deleted
- current student/enrollment/academic year/term scope

Excluded rows:

- `PRESENT`
- `UNMARKED`
- draft sessions
- unsubmitted sessions
- deleted sessions

### Behavior source

Included rows:

- `BehaviorRecord.status = APPROVED`
- `deletedAt = null`
- current student/enrollment/academic year/term scope
- positive and negative types

Excluded rows:

- `DRAFT`
- `SUBMITTED`
- `REJECTED`
- `CANCELLED`
- deleted behavior records

Behavior point deltas are read from `BehaviorPointLedger` when available and fall back to approved `BehaviorRecord.points` when ledger rows are absent.

## Supported query filters

```text
sourceType = attendance | behavior
itemType   = absence | lateness | early_leave | excused | positive | negative
type       = alias of itemType
fromDate
toDate
page
limit
```

## Timeline item shape

```ts
{
  id: string;
  sourceType: 'attendance' | 'behavior';
  source_type: 'attendance' | 'behavior';
  itemType: 'absence' | 'lateness' | 'early_leave' | 'excused' | 'positive' | 'negative';
  item_type: 'absence' | 'lateness' | 'early_leave' | 'excused' | 'positive' | 'negative';
  occurredAt: string;
  occurred_at: string;
  date: string;
  title: string;
  description: string | null;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical' | null;
  pointsDelta: number;
  points_delta: number;
  status: 'submitted' | 'excused' | 'approved';
  category: DisciplineTimelineCategoryDto | null;
  attendance: DisciplineTimelineAttendanceDto | null;
}
```

## Attendance mapping

| Attendance status | Timeline item type | Timeline status | Severity | Points delta |
| --- | --- | --- | --- | --- |
| `ABSENT` | `absence` | `submitted` | `medium` | 0 |
| `LATE` | `lateness` | `submitted` | `low` | 0 |
| `EARLY_LEAVE` | `early_leave` | `submitted` | `low` | 0 |
| `EXCUSED` | `excused` | `excused` | `info` | 0 |

## Behavior mapping

| Behavior type | Timeline item type | Timeline status | Severity | Points delta |
| --- | --- | --- | --- | --- |
| `POSITIVE` | `positive` | `approved` | lowercase `BehaviorSeverity` | ledger delta or record points |
| `NEGATIVE` | `negative` | `approved` | lowercase `BehaviorSeverity` | ledger delta or record points |

## Summary shape

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

## Formulas

```text
attendanceIncidentCount = absenceCount + lateCount + earlyLeaveCount + excusedCount
totalIncidents = attendanceIncidentCount + positiveCount + negativeCount
behaviorPoints = sum of approved behavior ledger deltas, fallback to approved record points
```

No `disciplineScore`, `combinedDisciplineScore`, `disciplinePercentage`, or combined percentage formula exists in this layer.
