# Dashboard Alerts

## Endpoint

```http
GET /api/v1/dashboard/alerts
```

Required permission:

```text
dashboard.alerts.view
```

## Purpose

Dashboard Alerts returns computed operational alerts for the active school. The endpoint is read-only and computes alerts from current source-domain signals.

## Query parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | enum | none | Filter by alert source. |
| `severity` | enum | none | Filter by severity. |
| `limit` | integer | 20 | Limit alert definitions returned; min 1, max 100. |
| `includeZeroCount` | boolean | false | Include alerts with count equal to zero. |

## Sources

```text
admissions
academics
attendance
grades
homework
behavior
reinforcement
communication
settings
```

## Severities

```text
critical
warning
info
```

## Alert definitions

| Key | Source | Severity | Count source |
| --- | --- | --- | --- |
| `admissions.applications_waiting_decision` | admissions | warning | Applications in submitted, documents pending, under review, or waitlisted states. |
| `admissions.tests_pending` | admissions | warning | Placement tests with scheduled status. |
| `admissions.interviews_pending` | admissions | warning | Interviews with scheduled status. |
| `academics.active_academic_year_missing` | academics | critical | 1 when no active academic year exists, otherwise 0. |
| `academics.active_term_missing` | academics | critical | 1 when no active term exists, otherwise 0. |
| `academics.timetable_draft_items` | academics | warning | Draft timetable entries in academic context. |
| `academics.lesson_plans_pending_activation` | academics | info | Draft lesson plans in academic context. |
| `attendance.sessions_pending_submission` | attendance | warning | Today's draft attendance sessions. |
| `attendance.absent_entries_today` | attendance | critical | Today's absent attendance entries. |
| `attendance.late_entries_today` | attendance | warning | Today's late attendance entries. |
| `attendance.excuses_pending` | attendance | warning | Pending attendance excuse requests. |
| `grades.assessments_in_draft` | grades | info | Draft grade assessments. |
| `grades.assessments_pending_approval` | grades | warning | Published assessments waiting approval. |
| `grades.submissions_pending_review` | grades | warning | Submitted grade submissions. |
| `grades.answers_pending_correction` | grades | warning | Grade submission answers pending correction. |
| `homework.submissions_waiting_review` | homework | warning | Submitted or late homework submissions. |
| `homework.grade_sync_link_missing` | homework | warning | Graded homework assignments without grade assessment link. |
| `homework.missing_submissions_past_due` | homework | warning | Missing homework targets for published assignments past due. |
| `behavior.records_pending_review` | behavior | warning | Submitted behavior records. |
| `behavior.negative_records_recent` | behavior | warning | Negative behavior records from the last 30 days. |
| `reinforcement.submissions_pending_review` | reinforcement | warning | Submitted reinforcement submissions. |
| `reinforcement.active_tasks_overdue` | reinforcement | warning | Active reinforcement tasks past due date. |
| `communication.moderation_reports_pending` | communication | critical | Open or in-review message reports. |
| `communication.announcements_expiring_soon` | communication | info | Active announcements expiring in the next 7 days. |
| `settings.login_identity_missing` | settings | critical | 1 when no active login identity settings exist. |
| `settings.email_connection_missing` | settings | warning | 1 when no active or verified email connection exists. |

## Filtering behavior

The use case filters alerts in this order:

1. Remove zero-count alerts unless `includeZeroCount=true`.
2. Apply `source` filter.
3. Apply `severity` filter.
4. Sort deterministically.
5. Apply normalized `limit`.

## Sorting behavior

Sort order:

1. Severity rank: critical, warning, info.
2. Source alphabetical order.
3. Alert key alphabetical order.

## Summary object

`summary` aggregates counts from the returned alert list:

```json
{
  "total": 12,
  "critical": 3,
  "warning": 9,
  "info": 0,
  "bySource": {
    "attendance": 5,
    "homework": 7
  }
}
```

`summary.total` is a sum of alert counts, not a count of alert objects.

## Deferred lifecycle

```json
{
  "persistence": "deferred",
  "acknowledge": "deferred",
  "dismiss": "deferred",
  "activityFeed": "deferred"
}
```

There is no current support for:

- persisted alert records;
- alert read/unread state;
- acknowledgement;
- dismissal;
- snoozing;
- notification side effects;
- realtime alert pushes.

## Client guidance

Clients should treat the alert `key` as a stable semantic identifier for display and routing, but not as a persisted alert id. The same key can appear or disappear between requests depending on source-domain counts and filters.
