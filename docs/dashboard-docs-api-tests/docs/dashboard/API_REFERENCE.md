# Dashboard API Reference

## Base URL

All routes are served under the global API prefix:

```text
/api/v1
```

Full local base URL example:

```text
http://localhost:3000/api/v1
```

## Authentication

All Dashboard endpoints require Bearer authentication:

```http
Authorization: Bearer <accessToken>
```

The token must belong to a user with an active school membership. A platform user without active school membership is not sufficient for the school Dashboard module.

## Permissions

| Endpoint | Permission |
| --- | --- |
| `GET /dashboard/summary` | `dashboard.summary.view` |
| `GET /dashboard/alerts` | `dashboard.alerts.view` |
| `GET /dashboard/activity-feed` | `dashboard.activity_feed.view` |

---

## GET `/dashboard/summary`

Returns the current school's Dashboard Summary.

### Request

```http
GET /api/v1/dashboard/summary
Authorization: Bearer <accessToken>
```

### Query parameters

None.

### Response shape

```json
{
  "generatedAt": "2026-06-13T10:00:00.000Z",
  "school": {
    "name": "Example School",
    "timezone": "Africa/Cairo",
    "locale": null
  },
  "academicContext": {
    "academicYear": {
      "id": "academic-year-id",
      "name": "2025/2026"
    },
    "term": {
      "id": "term-id",
      "name": "Term 1"
    }
  },
  "cards": {
    "admissions": {},
    "students": {},
    "academics": {},
    "attendance": {},
    "grades": {},
    "homework": {},
    "behavior": {},
    "reinforcement": {},
    "communication": {}
  },
  "alertsPreview": [],
  "deferred": {
    "activityFeed": "deferred",
    "alertsEngine": "deferred",
    "analyticsBuilder": "out_of_scope_v1"
  }
}
```

### Notes

- `cards` contain numeric operational KPIs.
- `alertsPreview` is computed from summary card counts.
- `alertsPreview` is not a persisted alert lifecycle system.
- The response does not include `schoolId` or `organizationId`.

---

## GET `/dashboard/alerts`

Returns computed operational alerts for the current school.

### Request

```http
GET /api/v1/dashboard/alerts
Authorization: Bearer <accessToken>
```

### Query parameters

| Name | Type | Required | Allowed values | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `source` | string | No | `admissions`, `academics`, `attendance`, `grades`, `homework`, `behavior`, `reinforcement`, `communication`, `settings` | none | Filters alerts by source. |
| `severity` | string | No | `info`, `warning`, `critical` | none | Filters alerts by severity. |
| `limit` | integer | No | 1 to 100 | 20 | Maximum number of alert definitions returned. |
| `includeZeroCount` | boolean | No | `true`, `false`, `1`, `0`, `yes`, `no` | false | Include alerts even when their count is zero. |

### Response shape

```json
{
  "generatedAt": "2026-06-13T10:00:00.000Z",
  "alerts": [
    {
      "key": "attendance.absent_entries_today",
      "source": "attendance",
      "severity": "critical",
      "title": "Absences marked today",
      "description": "There are 3 absent attendance entries for today.",
      "count": 3,
      "action": {
        "label": "Review absences",
        "target": "/attendance/absences"
      }
    }
  ],
  "summary": {
    "total": 3,
    "critical": 3,
    "warning": 0,
    "info": 0,
    "bySource": {
      "attendance": 3
    }
  },
  "deferred": {
    "persistence": "deferred",
    "acknowledge": "deferred",
    "dismiss": "deferred",
    "activityFeed": "deferred"
  }
}
```

### Notes

- Alerts are computed at read time from source-domain records.
- No alert rows are written by this endpoint.
- `summary.total` is the sum of alert counts, not necessarily the number of alert objects.
- Sorting is deterministic: critical first, then warning, then info; then by source; then by alert key.

---

## GET `/dashboard/activity-feed`

Returns an audit-backed operational activity feed for the current school.

### Request

```http
GET /api/v1/dashboard/activity-feed
Authorization: Bearer <accessToken>
```

### Query parameters

| Name | Type | Required | Allowed values / format | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `source` | string | No | `admissions`, `students`, `academics`, `attendance`, `grades`, `homework`, `behavior`, `reinforcement`, `communication`, `settings` | none | Filters by dashboard source. |
| `eventType` | string | No | dotted event type, e.g. `attendance.session.submit` | none | Filters by normalized dashboard event type. |
| `actorType` | string | No | `system`, `admin`, `teacher`, `student`, `parent`, `unknown` | none | Filters by normalized actor type. |
| `dateFrom` | ISO date string | No | ISO-8601 | none | Inclusive lower bound on activity time. |
| `dateTo` | ISO date string | No | ISO-8601 | none | Inclusive upper bound on activity time. |
| `limit` | integer | No | 1 to 100 | 20 | Page size. |
| `cursor` | string | No | base64url cursor returned by prior page | none | Cursor pagination. |

### Response shape

```json
{
  "generatedAt": "2026-06-13T10:00:00.000Z",
  "items": [
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
  ],
  "pageInfo": {
    "limit": 20,
    "nextCursor": null,
    "hasMore": false
  },
  "filters": {
    "source": null,
    "eventType": null,
    "actorType": null,
    "dateFrom": null,
    "dateTo": null
  },
  "deferred": {
    "readState": "deferred",
    "pinning": "deferred",
    "realtime": "deferred",
    "analyticsBuilder": "deferred"
  }
}
```

### Notes

- Activity feed items are derived from successful `AuditLog` records.
- The repository explicitly filters `AuditLog.schoolId` by the active school.
- The response does not expose raw audit `before` or `after` payloads.
- There is no read, unread, pin, unpin, comment, realtime, or notification lifecycle in the current foundation.

---

## Common error behavior

The exact global error envelope is controlled by project-wide exception filters. Dashboard-specific behavior generally follows these categories:

| Scenario | Expected category |
| --- | --- |
| Missing or invalid token | Authentication error. |
| Authenticated user has no active school membership | Scope missing error. |
| User lacks required Dashboard permission | Permission/scope error. |
| Invalid query enum or malformed date | Validation error. |
| Invalid activity cursor | Validation domain error. |
| `dateFrom` after `dateTo` | Validation domain error. |

## Route non-inventory

The following are intentionally absent:

```text
POST /api/v1/dashboard/alerts/:alertId/read
POST /api/v1/dashboard/alerts/:alertId/dismiss
POST /api/v1/dashboard/activity-feed/:activityId/read
POST /api/v1/dashboard/activity-feed/:activityId/pin
POST /api/v1/dashboard/activity-feed/:activityId/unpin
GET  /api/v1/dashboard/analytics-builder
```
