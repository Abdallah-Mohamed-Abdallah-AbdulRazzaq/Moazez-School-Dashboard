# Dashboard API Integration Contracts

## 1. Common requirements

- Base prefix: `/api/v1`
- Authentication: Bearer access token
- Scope: active school membership required
- Response dates: ISO 8601 strings
- Logical dates: `YYYY-MM-DD`
- IDs: UUID unless explicitly source-prefixed in planner/activity contracts
- Errors: canonical Moazez error envelope through the global exception filter

Example error envelope:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "Request validation failed.",
    "details": {},
    "traceId": "optional-correlation-id"
  }
}
```

## 2. Complete route inventory

| Method | Route | Permission | Extra restriction |
| --- | --- | --- | --- |
| GET | `/dashboard/command-center` | `dashboard.command_center.view` | none beyond auth/scope |
| GET | `/dashboard/light-mode-dropdown` | `dashboard.light_mode_dropdown.view` | none beyond auth/scope |
| GET | `/dashboard/analytics/catalog` | `dashboard.analytics.view` | none beyond auth/scope |
| GET | `/dashboard/analytics/charts` | `dashboard.analytics.view` | none beyond auth/scope |
| GET | `/dashboard/analytics/charts/:chartKey` | `dashboard.analytics.view` | none beyond auth/scope |
| GET | `/dashboard/analytics/charts/:chartKey/data` | `dashboard.analytics.view` | none beyond auth/scope |
| GET | `/dashboard/modules` | `dashboard.modules.view` | none beyond auth/scope |
| GET | `/dashboard/modules/:moduleKey` | `dashboard.modules.view` | none beyond auth/scope |
| GET | `/dashboard/widgets` | `dashboard.widgets.view` | none beyond auth/scope |
| GET | `/dashboard/widgets/:widgetKey` | `dashboard.widgets.view` | none beyond auth/scope |
| GET | `/dashboard/summary` | `dashboard.summary.view` | none beyond auth/scope |
| GET | `/dashboard/alerts` | `dashboard.alerts.view` | none beyond auth/scope |
| GET | `/dashboard/activity-feed` | `dashboard.activity_feed.view` | none beyond auth/scope |
| GET | `/dashboard/light-mode-dropdown/todos` | `dashboard.todos.view` | `SchoolManagementOnly` |
| POST | `/dashboard/light-mode-dropdown/todos` | `dashboard.todos.manage` | `SchoolManagementOnly` |
| PATCH | `/dashboard/light-mode-dropdown/todos/:todoId` | `dashboard.todos.manage` | `SchoolManagementOnly` |
| DELETE | `/dashboard/light-mode-dropdown/todos/:todoId` | `dashboard.todos.manage` | `SchoolManagementOnly` |

All table paths are relative to `/api/v1`.

## 3. Summary

### GET `/api/v1/dashboard/summary`

Returns one request-time school snapshot.

Top-level response:

```json
{
  "generatedAt": "2026-07-15T09:00:00.000Z",
  "scope": { "type": "school" },
  "academicContext": {
    "academicYear": { "id": "uuid", "name": "2026/2027" },
    "term": { "id": "uuid", "academicYearId": "uuid", "name": "Term 1" }
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
  "deferred": {},
  "meta": {}
}
```

The exact card fields are documented in `03_DATA_LOGIC_AND_ANALYTICS.md`.

## 4. Alerts

### GET `/api/v1/dashboard/alerts`

Query parameters:

| Field | Type | Allowed/default |
| --- | --- | --- |
| `source` | enum | admissions, academics, attendance, grades, homework, behavior, reinforcement, communication, settings |
| `severity` | enum | info, warning, critical |
| `limit` | integer | 1..100, default 20 |
| `includeZeroCount` | boolean | default false; accepts true/false, 1/0, yes/no |

Response:

```json
{
  "generatedAt": "...",
  "alerts": [
    {
      "key": "attendance.absent_entries_today",
      "source": "attendance",
      "severity": "critical",
      "title": "Absences marked today",
      "description": "There are 3 absent attendance entries for today.",
      "count": 3,
      "action": { "label": "Review absences", "target": "/attendance/absences" }
    }
  ],
  "summary": {
    "total": 1,
    "critical": 1,
    "warning": 0,
    "info": 0,
    "bySource": { "attendance": 1 }
  },
  "deferred": {
    "persistence": "deferred",
    "acknowledge": "deferred",
    "dismiss": "deferred",
    "activityFeed": "available"
  },
  "meta": {}
}
```

Ordering: critical, warning, info; then source; then key. Zero-count alerts are excluded unless explicitly requested.

## 5. Activity Feed

### GET `/api/v1/dashboard/activity-feed`

Query parameters:

| Field | Type | Rules |
| --- | --- | --- |
| `source` | enum | admissions, students, academics, attendance, grades, homework, behavior, reinforcement, communication, settings |
| `eventType` | string | dotted lower-case identifier such as `attendance.session.submit` |
| `actorType` | enum | system, admin, teacher, student, parent, unknown |
| `dateFrom` | ISO date/time | optional |
| `dateTo` | ISO date/time | optional; must not be before dateFrom |
| `limit` | integer | 1..100, default 20 |
| `cursor` | string | opaque Base64URL cursor returned by the API |

Response item:

```json
{
  "activityId": "audit:<audit-log-id>",
  "source": "attendance",
  "eventType": "attendance.session.submit",
  "title": "Attendance session submitted",
  "description": "A roll-call attendance session was submitted.",
  "actor": {
    "id": "user-uuid-or-null",
    "displayName": "Actor Name",
    "type": "admin"
  },
  "subject": {
    "type": "attendance_session",
    "id": "resource-uuid-or-null",
    "label": "Attendance Session"
  },
  "occurredAt": "2026-07-15T09:00:00.000Z"
}
```

Pagination:

```json
{
  "pageInfo": {
    "limit": 20,
    "nextCursor": "opaque-or-null",
    "hasMore": true
  }
}
```

Only successful AuditLog events from approved modules are eligible.

## 6. Command Center

### GET `/api/v1/dashboard/command-center`

This is the primary Dashboard composition endpoint. It returns:

- normalized time context
- operator user type
- summary overview
- sorted non-zero operational alerts
- latest six safe activity items
- fixed preview widgets for:
  - enrollment growth
  - attendance daily trend
  - communication message volume
  - today's Todos
- explicit deferred metadata

This endpoint does not load Calendar/planner sources.

## 7. Widgets

### GET `/api/v1/dashboard/widgets`

Query parameters:

| Field | Type | Rules |
| --- | --- | --- |
| `source` | enum | admissions, students, academics, attendance, grades, homework, behavior, reinforcement, communication, settings, activity, todos, calendar |
| `type` | enum | stat-card, progress-card, risk-card, action-card, timeline-card, mini-chart-card, calendar-card, todo-card |
| `limit` | integer | 1..50, default 20 |

Filters are applied before composition.

### GET `/api/v1/dashboard/widgets/:widgetKey`

Returns one fixed registry widget. Unknown keys return safe 404.

Common widget shape:

```json
{
  "widgetKey": "students.active",
  "type": "stat-card",
  "source": "students",
  "title": "Active students",
  "subtitle": "Currently active student profiles",
  "iconKey": "users",
  "tone": "info",
  "data": {},
  "action": {
    "label": "Open students",
    "target": "/students",
    "kind": "frontend-route"
  },
  "emptyState": null,
  "meta": {
    "freshness": "live",
    "freshnessDetails": {},
    "analytics": null
  }
}
```

Actions are fixed frontend routes; clients cannot supply an action target.

## 8. Module Pages

### GET `/api/v1/dashboard/modules`

Supported query filters:

- `status`: available, planned, deferred
- `source`: one of the ten module keys
- `limit`: bounded, default 20, maximum 50

### GET `/api/v1/dashboard/modules/:moduleKey`

Allowed keys:

- admissions
- students
- academics
- attendance
- grades
- homework
- behavior
- reinforcement
- communication
- settings

Response includes:

- module identity and routes
- overview quick stats
- module-scoped risks
- next actions
- assigned widgets
- chart definitions
- `availableData` for computed operational snapshot charts only
- planned chart definitions
- capability and deferred metadata

Unknown keys return safe 404.

## 9. Analytics catalog and chart definitions

### GET `/api/v1/dashboard/analytics/catalog`

Returns the full fixed V1 catalog:

- sources
- supported chart types
- supported ranges
- supported granularities
- filter definitions
- metric definitions
- KPI definitions
- 37 chart definitions

### GET `/api/v1/dashboard/analytics/charts`

Supports catalog filtering by source, type, status, and bounded limit.

### GET `/api/v1/dashboard/analytics/charts/:chartKey`

Returns one chart definition. Unknown keys return 404.

## 10. Analytics chart data

### GET `/api/v1/dashboard/analytics/charts/:chartKey/data`

Supported query keys are chart-specific subsets of:

- `range`: 7d, 30d, 90d, term, academic_year, custom
- `granularity`: day, week, month
- `dateFrom`
- `dateTo`
- `academicYearId`
- `termId`
- `gradeId`
- `sectionId`
- `classroomId`

Default range and granularity are `30d` and `day` when applicable.

Important validation:

- `dateFrom` and `dateTo` are allowed only for `range=custom`.
- hierarchy IDs must be UUIDs.
- hierarchy records must exist in the active school.
- term must belong to academic year.
- section/classroom must belong to the supplied grade/section hierarchy.
- granularity must be supported for the resolved window.
- chart-specific unsupported filters are rejected, not silently ignored.

Common response shape:

```json
{
  "generatedAt": "...",
  "chart": {
    "chartKey": "attendance.absence_rate",
    "source": "attendance",
    "title": "Absence rate",
    "type": "line"
  },
  "query": {
    "range": "30d",
    "granularity": "day",
    "timezone": "Africa/Cairo",
    "window": {
      "startInclusive": "...",
      "endExclusive": "...",
      "startCivilDate": "2026-06-16",
      "endCivilDate": "2026-07-15"
    },
    "hierarchy": {}
  },
  "series": [],
  "totals": {},
  "summary": { "value": 0, "label": "Overall absence rate" },
  "emptyState": null,
  "meta": {
    "dataAvailability": "computed_series",
    "pack": "attendance_v1",
    "computation": "..."
  }
}
```

Definition-only charts return a safe `not_implemented` empty-state envelope instead of fabricated data.

## 11. Light Mode Dropdown

### GET `/api/v1/dashboard/light-mode-dropdown`

Query parameters:

| Field | Allowed/default |
| --- | --- |
| `locale` | en or ar; default en |
| `timezone` | valid IANA timezone; optional |
| `units` | metric or imperial; default metric |
| `date` | YYYY-MM-DD; defaults to current school civil date |

Response areas:

- `location`: label, city, country, resolved timezone, source
- `weather`: explicit unavailable/provider-not-configured contract
- `hints`
- `highlights`
- `cities`: currently empty/provider-dependent contract
- `forecast`: currently empty/provider-dependent contract
- `planner.events`: selected-day Academic Calendar and cross-module events
- `planner.todos`: full owner-scoped Todo DTOs
- `meta`: component freshness and deferred provider/realtime state

Weather does not block planner data.

## 12. Todo CRUD

### GET `/api/v1/dashboard/light-mode-dropdown/todos`

Query:

| Field | Rules |
| --- | --- |
| `date` | optional YYYY-MM-DD; selected timezone/civil date semantics |
| `status` | pending, completed, all |
| `limit` | 1..100 |
| `timezone` | optional valid IANA timezone |

Response includes `todos`, total/pending/completed summary, applied filters, owner scope metadata.

### POST `/api/v1/dashboard/light-mode-dropdown/todos`

```json
{
  "date": "2026-07-15",
  "title": "Review pending attendance excuses",
  "notes": "Optional notes up to 1000 characters",
  "priority": "high",
  "sortOrder": 10
}
```

Rules:

- date required, YYYY-MM-DD
- title required, trimmed/non-empty, maximum 160
- notes optional, maximum 1000
- priority optional: low/normal/high; default normal
- sortOrder optional integer; default 0

The server injects school and owner.

### PATCH `/api/v1/dashboard/light-mode-dropdown/todos/:todoId`

Any subset of:

```json
{
  "date": "2026-07-16",
  "title": "Updated title",
  "notes": null,
  "status": "completed",
  "priority": "normal",
  "sortOrder": 20
}
```

At least one field is required. Completing sets `completedAt` when absent; moving back to pending clears it.

### DELETE `/api/v1/dashboard/light-mode-dropdown/todos/:todoId`

Soft deletes the owner Todo.

```json
{
  "generatedAt": "...",
  "deleted": true,
  "todoId": "uuid"
}
```

Cross-school, cross-owner, deleted, and unknown IDs produce the same safe not-found behavior.

## 13. Common HTTP failure matrix

| Condition | Expected class |
| --- | --- |
| Missing/invalid token | 401 |
| Missing active school scope | 403 |
| Missing Dashboard permission | 403 |
| Teacher/parent/student attempts Dashboard routes with system role | 403 |
| Unknown widget/module/chart | 404 |
| Cross-school analytics hierarchy ID | 404 |
| Cross-owner or cross-school Todo ID | 404 |
| Invalid query, malformed UUID, invalid range/cursor | 400/validation envelope |
| Empty Todo PATCH body | 400 |
| Invalid Todo DTO | 400 |
