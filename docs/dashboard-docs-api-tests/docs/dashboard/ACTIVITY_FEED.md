# Dashboard Activity Feed

## Endpoint

```http
GET /api/v1/dashboard/activity-feed
```

Required permission:

```text
dashboard.activity_feed.view
```

## Purpose

Dashboard Activity Feed exposes recent operational activity for the active school by reading successful audit records and mapping them into frontend-friendly feed items.

## Source of truth

The feed is backed by existing `AuditLog` records. It does not introduce a Dashboard event table, feed table, event store, or Prisma migration.

## Base audit filters

The repository always applies:

```text
schoolId = active dashboard school
outcome = SUCCESS
module in allowed dashboard modules
```

## Allowed sources

```text
admissions
students
academics
attendance
grades
homework
behavior
reinforcement
communication
settings
```

Source-to-audit module mapping:

| Source | Audit modules |
| --- | --- |
| admissions | `admissions` |
| students | `students` |
| academics | `academics` |
| attendance | `attendance` |
| grades | `grades` |
| homework | `homework` |
| behavior | `behavior` |
| reinforcement | `reinforcement` |
| communication | `communication` |
| settings | `settings`, `iam`, `auth` |

## Query parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | enum | none | Filter by dashboard source. |
| `eventType` | dotted string | none | Filter by normalized dashboard event type. |
| `actorType` | enum | none | Filter by normalized actor type. |
| `dateFrom` | ISO date string | none | Inclusive lower time bound. |
| `dateTo` | ISO date string | none | Inclusive upper time bound. |
| `limit` | integer | 20 | Page size; min 1, max 100. |
| `cursor` | string | none | Base64url cursor from previous response. |

## Actor types

| Actor type | Source user types |
| --- | --- |
| `admin` | platform, organization, and school users. |
| `teacher` | teacher users. |
| `student` | student users. |
| `parent` | parent users. |
| `system` | service account users or system records with no actor. |
| `unknown` | unsupported or unclassified actor records. |

## Event type normalization

Audit actions are normalized into dotted dashboard event types. For example:

| Audit/source concept | Dashboard event type |
| --- | --- |
| admissions application create | `admissions.application.create` |
| students enrollment create | `students.enrollment.create` |
| attendance session submit | `attendance.session.submit` |
| homework assignment publish | `homework.assignment.publish` |
| communication announcement publish | `communication.announcement.publish` |
| auth or IAM setting activity | mapped under `settings.*` |

Event type values must match a dotted lowercase pattern such as:

```text
attendance.session.submit
homework.submission.review
settings.user.create
```

## Implemented known event text

The use case includes stable titles and descriptions for known events including:

- `admissions.lead.create`
- `admissions.application.create`
- `admissions.application.decision`
- `students.enrollment.create`
- `students.enrollment.transfer`
- `students.enrollment.withdraw`
- `students.enrollment.promote`
- `academics.curriculum.activate`
- `academics.lesson_plan.activate`
- `academics.lesson_plan.archive`
- `attendance.session.submit`
- `attendance.excuse.approve`
- `attendance.excuse.reject`
- `grades.assessment.publish`
- `grades.assessment.lock`
- `grades.submission.review.finalize`
- `homework.assignment.publish`
- `homework.submission.submit`
- `homework.submission.review`
- `homework.grade_sync.submission_sync`
- `behavior.record.create`
- `behavior.record.approve`
- `behavior.record.reject`
- `reinforcement.task.create`
- `reinforcement.review.approve`
- `reinforcement.review.reject`
- `reinforcement.reward.redemption.approve`
- `reinforcement.reward.redemption.reject`
- `communication.announcement.publish`
- `communication.message_report.update`
- `communication.moderation_action.create`
- `settings.user.create`
- `settings.role.permissions.change`
- `settings.login_identity.change`
- `settings.email.connection.update`

Unknown but valid mapped event types receive fallback humanized text.

## Response item shape

```json
{
  "activityId": "audit:audit-log-id",
  "source": "attendance",
  "eventType": "attendance.session.submit",
  "title": "Attendance session submitted",
  "description": "A roll-call attendance session was submitted.",
  "actor": {
    "id": "actor-id",
    "displayName": "School Admin",
    "type": "admin"
  },
  "subject": {
    "type": "attendance_session",
    "id": "resource-id",
    "label": "Attendance Session"
  },
  "occurredAt": "2026-06-13T10:00:00.000Z"
}
```

## Pagination

The endpoint returns:

```json
{
  "pageInfo": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false
  }
}
```

When `hasMore=true`, pass `nextCursor` back as the `cursor` query parameter.

The cursor encodes the last item's timestamp and audit log id. Clients must treat the cursor as opaque.

## Sorting

Items are sorted by:

1. `occurredAt` descending;
2. stable `activityId` ascending when timestamps are equal.

## Deferred features

```json
{
  "readState": "deferred",
  "pinning": "deferred",
  "realtime": "deferred",
  "analyticsBuilder": "deferred"
}
```

No current support exists for read state, pinning, comments, realtime feed updates, notifications, or dashboard analytics builder.
