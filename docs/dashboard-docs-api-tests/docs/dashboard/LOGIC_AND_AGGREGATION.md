# Dashboard Logic and Aggregation

## Design model

Dashboard is a read model. It aggregates current state from existing modules and returns shaped response DTOs. It does not own source data and it does not persist dashboard-specific rows in the current foundation.

## Scope resolution

Every Dashboard use case starts by resolving dashboard scope from request context. A valid scope requires:

- authenticated actor;
- active membership;
- active membership with `schoolId`;
- organization id, school id, role id, actor id, and user type available for downstream logic.

If school scope is missing, Dashboard rejects the request instead of falling back to platform scope.

## Summary flow

`GET /dashboard/summary` executes the following flow:

1. Resolve dashboard scope.
2. Build date windows from current server time:
   - `todayStart`
   - `last7DaysStart`
   - `last30DaysStart`
   - `now`
3. Load school display snapshot.
4. Load active academic year and active term.
5. Load all card snapshots in parallel.
6. Shape response through the summary presenter.
7. Build compact `alertsPreview` from card counts.

## Summary aggregation sources

Summary cards read from the following source domains:

| Card | Data source concept |
| --- | --- |
| Admissions | leads, applications, placement tests, interviews. |
| Students | students, enrollments, guardians. |
| Academics | academic years, terms, stages, grades, sections, classrooms, subjects, rooms, teacher allocations, curricula, lesson plans, timetable entries, timetable publications. |
| Attendance | attendance sessions, entries, excuse requests. |
| Grades | grade assessments, grade items, grade submissions, submission answers. |
| Homework | homework assignments and submissions. |
| Behavior | behavior records. |
| Reinforcement | reinforcement tasks, assignments, submissions, XP ledger, reward redemptions. |
| Communication | announcements, messages, conversations, message reports. |

Most reads are performed through `prisma.scoped`, which allows the school-scope extension to constrain data to the active school.

## Academic context rules

Dashboard resolves:

- the latest active academic year ordered by start date, created date, then id;
- the latest active term under that active academic year when available.

Where appropriate, card queries include active academic year and active term filters. Some queries intentionally omit term or academic year depending on the source model and the signal being counted.

## Alerts flow

`GET /dashboard/alerts` executes the following flow:

1. Resolve dashboard scope.
2. Build alert date window:
   - `todayStart`
   - `last30DaysStart`
   - `next7DaysEnd`
   - `now`
3. Load alert signals from source domains.
4. Build a fixed list of alert definitions.
5. Remove zero-count alerts unless `includeZeroCount=true`.
6. Apply optional `source` filter.
7. Apply optional `severity` filter.
8. Sort by severity rank, source, then alert key.
9. Normalize and apply limit.
10. Shape response with alert summary and deferred lifecycle flags.

## Alert signal model

Alerts are not rows. Each alert is computed from a signal count, such as:

- applications waiting decision;
- missing active academic year;
- today's absent entries;
- grade submissions pending review;
- homework submissions waiting review;
- pending behavior records;
- pending communication moderation reports;
- missing login identity settings.

## Alert severity sort

Severity rank is:

1. `critical`
2. `warning`
3. `info`

If severity is equal, alerts sort by source and key to keep output deterministic.

## Activity feed flow

`GET /dashboard/activity-feed` executes the following flow:

1. Resolve dashboard scope.
2. Normalize query filters.
3. Validate event type, dates, cursor, and limit.
4. Query successful `AuditLog` records for the current school.
5. Apply allowed module/source filters.
6. Map audit records into dashboard activity items.
7. Apply in-memory compatibility filters after normalization.
8. Sort by occurrence time descending and stable activity id.
9. Return page metadata and a base64url cursor when another page is available.

## Why Activity Feed uses AuditLog

The activity feed foundation reuses existing `AuditLog` as the event source. This avoids creating a Dashboard event store or dashboard-specific activity table. It also keeps the feed aligned with source-domain actions already audited by the backend.

## Cursor model

The cursor encodes:

```json
{
  "occurredAt": "2026-06-13T10:00:00.000Z",
  "auditLogId": "audit-log-id"
}
```

It is serialized as base64url. The repository uses it to fetch records older than the cursor, or records at the same timestamp with greater id, matching the sort order.

## No side effects

Dashboard use cases do not create, update, archive, delete, acknowledge, dismiss, notify, or broadcast. All implemented endpoints are read-only.
