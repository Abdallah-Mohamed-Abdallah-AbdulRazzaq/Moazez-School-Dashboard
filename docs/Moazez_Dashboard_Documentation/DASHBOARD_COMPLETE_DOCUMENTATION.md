# Moazez Backend Dashboard - Complete Technical Documentation

This master document consolidates the complete code-based Dashboard feature review. The split source documents remain in the same package for easier ownership and maintenance.

---

# Dashboard Feature Overview and Architecture

## 1. Purpose

The Dashboard is the School Dashboard operational aggregation layer. It provides safe, bounded, frontend-oriented snapshots and compositions over the platform's core domains.

It answers questions such as:

- What requires immediate school attention?
- What are the current operational counts?
- What changed recently?
- What should appear in fixed Dashboard widgets?
- What is the selected day's planner view?
- What aggregate analytics can be computed truthfully from current persistence?

It is not a replacement for source modules and it does not redefine their business rules.

## 2. Architectural classification

The feature is an app-facing composition/read-model module inside the modular monolith.

```text
HTTP Controller
  -> Application use case/service
    -> Dashboard repository/read adapter
      -> Scoped Prisma or approved source-domain repository
    -> Pure domain computation/catalog logic
  -> Presenter
  -> Frontend-safe DTO
```

### Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| Controllers | Thin HTTP routing, DTO binding, permissions, management-only restriction. |
| Application | Resolve Dashboard scope and time context; orchestrate bounded reads; select the correct computation. |
| Domain | Fixed registries, chart catalog, range/window rules, civil-date helpers, bucket calculations, pure aggregate formulas. |
| Infrastructure | Scoped data access, group/count aggregation, AuditLog safe querying, Todo persistence, planner source adapters. |
| Presenters | Convert internal snapshots into explicit frontend contracts; remove raw rows and restricted identifiers. |
| DTOs | Input validation and response contract definitions. |

## 3. Source-of-truth boundaries

The Dashboard reads from these source domains:

- Admissions
- Students and Guardians
- Academics
- Attendance
- Grades
- Homework
- Behavior
- Reinforcement and Rewards
- Communication and Announcements
- Settings and IAM readiness
- Academic Calendar
- AuditLog

The source modules remain authoritative for all mutations. For example:

- Dashboard can count pending attendance sessions but cannot submit a session.
- Dashboard can count grade reviews but cannot approve or lock an assessment.
- Dashboard can show a homework review queue count but cannot review a submission.
- Dashboard can expose communication moderation risk but cannot perform moderation.

The single intentional exception is `DashboardTodo`, which is Dashboard-owned user data.

## 4. Module wiring

`DashboardModule` wires:

- `DashboardController`
- `DashboardTodosController`
- all Dashboard use cases and composition services
- all Dashboard repositories and read adapters
- Attendance reporting integration required by attendance analytics
- authentication dependencies required by application-level scope resolution

Global guards are registered at application level. Dashboard controllers add route-specific `@RequiredPermissions(...)`; Todo routes also add `@SchoolManagementOnly()`.

## 5. Request context and scope

Every execution begins with `requireDashboardScope()`.

Required runtime context:

- authenticated actor
- actor user type
- active membership
- organization ID
- school ID
- role ID

Failure behavior:

- no authenticated actor: authentication failure
- no active school membership or school context: scope failure

Dashboard does not accept `schoolId`, `ownerUserId`, or organization scope from a client request.

## 6. Shared time context

Dashboard compositions use a normalized `DashboardTimeContext` containing:

- one `generatedAt` timestamp for the request
- resolved timezone
- school civil date
- UTC-safe logical date
- `todayStart`
- `todayEndExclusive`
- last 7-day and last 30-day boundaries
- next 7-day boundary

Timezone precedence:

1. valid explicit timezone when supported by the endpoint
2. school profile timezone
3. UTC fallback

Civil-date helpers are used instead of fixed 24-hour arithmetic, protecting selected-day behavior around DST and negative/positive offsets.

## 7. Major capability map

| Capability | Ownership | Data behavior |
| --- | --- | --- |
| Summary | Dashboard read model | Request-time multi-domain counts. |
| Alerts | Dashboard computation | Fixed read-time signals; no persistence/lifecycle. |
| Activity Feed | Dashboard AuditLog read adapter | Successful, approved, school-filtered audit events. |
| Command Center | Dashboard composition | Summary, alerts, activity, three analytics previews, Todo preview. |
| Widgets | Fixed Dashboard registry | Selective loading based on source/type/key. |
| Module Pages | Fixed Dashboard registry | Summary/alerts + assigned widgets + chart definitions. |
| Analytics | Fixed catalog and computation packs | Bounded aggregate queries; no arbitrary query builder. |
| Light Mode Dropdown | Dashboard composition | School location, unavailable Weather contract, selected-day planner, owner Todos. |
| Todos | Dashboard persistence | Personal CRUD with school and owner boundaries. |
| Planner | Dashboard read adapters | Selected-day Academic Calendar and five cross-module sources. |

## 8. Selective loading and fanout control

Widget list filters are applied before data loading. A request-local composition plan deduplicates:

- summary dependency
- alert dependency
- activity dependency
- Todo dependency
- Calendar dependency
- cross-module planner dependency
- fixed analytics chart keys

Unknown widget/module/chart detail keys fail before unnecessary downstream loading.

The Command Center intentionally composes only:

- `students.enrollment_growth`
- `attendance.daily_trend`
- `communication.message_volume`
- `todos.today`

It does not load `calendar.today`, so it does not call Calendar or cross-module planner repositories.

## 9. Data exposure philosophy

The public contracts expose aggregate values and safe labels, not source rows. Commonly excluded data includes:

- school and organization identifiers
- membership and role identifiers
- owner identifiers
- raw Prisma records
- source-domain private descriptions or notes
- applicant/student/teacher/interviewer PII
- AuditLog metadata payloads

Activity Feed is a controlled exception: it exposes approved activity, actor, and subject identifiers/labels, but never raw AuditLog rows or tenant identifiers.

---

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

---

# Dashboard Data Logic and Analytics

## 1. Summary card calculations

### Admissions

| Field | Calculation |
| --- | --- |
| `totalLeads` | Count all scoped leads. |
| `openApplications` | Applications in SUBMITTED, DOCUMENTS_PENDING, UNDER_REVIEW, or WAITLISTED. |
| `submittedApplications` | Applications currently SUBMITTED. |
| `acceptedApplications` | Applications currently ACCEPTED. |
| `pendingTests` | Placement tests in SCHEDULED. |
| `pendingInterviews` | Interviews in SCHEDULED. |
| `recentDecisions` | ACCEPTED, REJECTED, or WAITLISTED applications updated within last 30 days. |

### Students

| Field | Calculation |
| --- | --- |
| `activeStudents` | ACTIVE student records. |
| `activeEnrollments` | ACTIVE enrollments in resolved academic context. |
| `guardians` | Scoped guardian count. |
| `newEnrollmentsLast30Days` | Enrollments whose `enrolledAt` is within last 30 days. |
| `withdrawnEnrollments` | WITHDRAWN enrollments in resolved academic-year context. |

### Academics

- active academic years
- existence of current academic year
- terms
- stages
- grades
- sections
- classrooms
- subjects
- rooms
- teacher-subject allocations
- ACTIVE curricula
- ACTIVE lesson plans
- ACTIVE timetable entries
- PUBLISHED timetable publications

### Attendance

For the current school civil date:

- all attendance sessions
- submitted sessions
- draft/pending sessions
- absent entries
- late entries
- pending excuse requests

### Grades

- all assessments in resolved context
- DRAFT assessments
- PUBLISHED assessments
- APPROVED assessments
- locked assessments (`lockedAt` not null)
- grade items
- SUBMITTED grade submissions awaiting review
- submission answers whose correction status is PENDING

### Homework

- DRAFT assignments
- PUBLISHED assignments
- CLOSED assignments
- SUBMITTED or LATE submissions awaiting review
- REVIEWED submissions
- assignments linked to a grade assessment
- graded assignments with no grade-assessment link

### Behavior

- all records from last 30 days
- SUBMITTED records pending review
- POSITIVE records from last 30 days
- NEGATIVE records from last 30 days

### Reinforcement

- active tasks in NOT_COMPLETED, IN_PROGRESS, or UNDER_REVIEW
- SUBMITTED reinforcement submissions pending review
- COMPLETED assignments
- XP ledger entries from last 30 days
- REQUESTED reward redemptions

### Communication

- PUBLISHED non-expired announcements
- SENT messages from last 7 days
- ACTIVE conversations
- OPEN or IN_REVIEW moderation reports

## 2. Alert logic

Alerts are rebuilt on every request. They are not stored and have no user state.

Fixed keys:

1. `admissions.applications_waiting_decision`
2. `admissions.tests_pending`
3. `admissions.interviews_pending`
4. `academics.active_academic_year_missing`
5. `academics.active_term_missing`
6. `academics.timetable_draft_items`
7. `academics.lesson_plans_pending_activation`
8. `attendance.sessions_pending_submission`
9. `attendance.absent_entries_today`
10. `attendance.late_entries_today`
11. `attendance.excuses_pending`
12. `grades.assessments_in_draft`
13. `grades.assessments_pending_approval`
14. `grades.submissions_pending_review`
15. `grades.answers_pending_correction`
16. `homework.submissions_waiting_review`
17. `homework.grade_sync_link_missing`
18. `homework.missing_submissions_past_due`
19. `behavior.records_pending_review`
20. `behavior.negative_records_recent`
21. `reinforcement.submissions_pending_review`
22. `reinforcement.active_tasks_overdue`
23. `communication.moderation_reports_pending`
24. `communication.announcements_expiring_soon`
25. `settings.login_identity_missing`
26. `settings.email_connection_missing`

Notable definitions:

- past-due missing homework counts MISSING targets whose PUBLISHED assignment due date is before request time.
- overdue reinforcement counts active task statuses whose due date is before request time.
- expiring announcements are PUBLISHED announcements expiring within the next seven days.
- login readiness requires ACTIVE SchoolLoginSettings.
- email readiness requires ACTIVE or VERIFIED SchoolEmailConnection.

## 3. Activity Feed logic

Source is `AuditLog`, not a new Dashboard event table.

Repository eligibility:

- exact active `schoolId`
- outcome SUCCESS
- module in approved source mapping
- optional date, event, actor, and cursor filters

Source mapping:

- IAM and auth audit modules are normalized to `settings`.
- platform/applicant/dismissal modules are not part of the Dashboard activity-source registry.

Ordering:

1. `createdAt` descending
2. `id` ascending for equal timestamps

Cursor:

- Base64URL JSON containing `occurredAt` and `auditLogId`
- next page selects older timestamps, or greater IDs at the same timestamp according to the established ordering

Actor normalization:

- platform, organization, and school users -> `admin`
- teacher -> `teacher`
- student -> `student`
- parent -> `parent`
- service account or actor-less event -> `system`
- applicant, pickup delegate, or unresolved actor -> `unknown`

The use case contains explicit human text for important events and a safe humanized fallback for other approved, valid event paths.

## 4. Widget registry

Fixed order and keys:

1. `students.active`
2. `admissions.open_applications`
3. `attendance.pending_today`
4. `attendance.absences_today`
5. `homework.waiting_review`
6. `grades.pending_review`
7. `behavior.pending_review`
8. `reinforcement.pending_reviews`
9. `communication.moderation_queue`
10. `settings.email_connection`
11. `settings.login_identity`
12. `activity.recent`
13. `students.enrollment_growth`
14. `attendance.daily_trend`
15. `communication.message_volume`
16. `academics.teacher_allocation_coverage`
17. `grades.gradebook_completion`
18. `todos.today`
19. `calendar.today`

Dependency families:

- Summary: operational stat/action/risk widgets.
- Alerts: settings readiness widgets.
- Activity: recent activity timeline.
- Analytics: five fixed chart-backed widgets.
- Todos: today's personal Todo preview.
- Calendar: Academic Calendar + planner + Todo preview.

`grades.gradebook_completion` needs active academic year and term. If either is absent, the widget returns a neutral unavailable/not-configured state, not zero.

## 5. Module registry

Fixed module keys:

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

Each definition owns:

- display metadata
- frontend module route
- source workspace route
- assigned widget keys
- assigned chart keys
- primary action
- section definitions
- capability metadata

Module detail uses Summary and Alerts plus assigned widgets. It does not fan out to every historical/category analytics repository. `availableData` is limited to the operational-snapshot data that can be composed from the already loaded Summary/Alert signals.

## 6. Analytics query model

### Ranges

- `7d`
- `30d`
- `90d`
- `term`
- `academic_year`
- `custom`

### Granularity

- day
- week
- month

### Hierarchy

- academic year
- term
- grade
- section
- classroom

The query-context service resolves references inside the active school and validates parent/child relationships. Mismatched hierarchy is intentionally indistinguishable from not-found.

### Time semantics

- fixed ranges derive school-timezone civil windows
- custom range requires explicit bounds
- term and academic-year ranges use persisted start/end dates
- period end dates become exclusive next-day boundaries
- bucket coordinates preserve date/category/snapshot/funnel semantics explicitly

## 7. Analytics catalog final state

### Total

- 37 chart definitions
- 33 computed
- 4 definition-only

### Operational snapshot pack

- `attendance.pending_sessions`
- `grades.pending_submission_reviews`
- `grades.pending_answer_reviews`
- `communication.moderation_queue`
- `settings.email_connection_readiness`
- `settings.login_identity_readiness`

### Attendance pack

- `attendance.daily_trend`
- `attendance.status_distribution`
- `attendance.absence_rate`
- `attendance.late_rate`
- `attendance.excuse_status`

Rate denominator:

`PRESENT + ABSENT + LATE + EXCUSED + EARLY_LEAVE`

The percentage is zero when denominator is zero and otherwise rounded to two decimals.

### Admissions and Students pack

- `admissions.applications_by_status`
- `admissions.applications_over_time`
- `students.enrollment_growth`
- `students.withdrawal_trend`
- `students.guardian_coverage`

Key semantics:

- application status is a current category distribution.
- application over time counts submitted and accepted lifecycle events.
- enrollment growth is active-enrollment stock at completed bucket close or current request instant for a partial bucket.
- guardian coverage divides active students into covered and missing.

### Academics pack

- `academics.teacher_allocation_coverage`
- `academics.timetable_publication_status`
- `academics.curriculum_activation`
- `academics.lesson_plan_activation`

These are current-category snapshots, not historical series.

### Grades and Homework pack

- `grades.assessment_status_distribution`
- `grades.gradebook_completion`
- `homework.assignment_status_distribution`
- `homework.submission_review_trend`
- `homework.grade_sync_coverage`

Gradebook completion categories are complete versus missing expected gradebook cells. Homework review trend counts submitted and reviewed events by bucket.

### Behavior and Reinforcement pack

- `behavior.positive_negative_trend`
- `behavior.pending_review`
- `behavior.records_by_category`
- `reinforcement.xp_activity_trend`
- `reinforcement.task_completion`
- `reinforcement.reward_redemption_status`

Only approved behavior records feed approved trend/category analytics. XP is net XP activity. Redemption status is represented as requested -> approved -> fulfilled funnel stages.

### Communication and Settings pack

- `communication.message_volume`
- `communication.announcement_status`

Message volume counts SENT messages. Announcement distribution includes draft, scheduled, published, archived, and cancelled.

## 8. Definition-only charts

| Chart | Why no computed data |
| --- | --- |
| `admissions.funnel` | No authoritative conversion cohort or immutable stage-history model. |
| `academics.structure_readiness` | No approved numerator, denominator, weighting, threshold, or empty-school rule. |
| `academics.subject_allocation_coverage` | No authoritative model of required-but-missing grade/subject pairs. |
| `settings.notification_readiness` | No approved school-level channel denominator/readiness policy. |

The data endpoint truthfully returns a definition-only/not-implemented state.

## 9. Light Mode and planner composition

### Planner sources

1. `academic_calendar`
2. `attendance_session`
3. `placement_test`
4. `interview`
5. `homework_due`
6. `grade_assessment`
7. `todo`

### Date behavior

Timed sources:

- placement tests
- interviews
- homework due dates
- timed Calendar events

Logical-date sources:

- attendance sessions
- grade assessments
- all-day Calendar events
- Todos

The selected-day interval uses an exclusive upper bound. Civil-date helpers are used for DST safety.

### IDs and no-leak rules

- Calendar event IDs remain their approved event IDs in full Light Mode.
- cross-module event IDs are source-prefixed.
- Todo IDs are present only in full planner/standalone Todo contracts.
- `calendar.today` widget strips event/source/Todo IDs and notes.

Maximum `calendar.today` widget preview:

- 5 Calendar events
- 5 cross-module events
- 5 Todos
- 15 total items

---

# Dashboard Security, Tenancy, and Permissions

## 1. Security posture

The Dashboard uses the standard Moazez chain:

1. authenticate actor
2. resolve active membership and school context
3. enforce route permission
4. apply management-only restriction where required
5. apply resource ownership for personal Todo records
6. query only the trusted school scope
7. present allowlisted aggregate fields

This is application-level tenancy enforcement through guards, request context, and Prisma scoping. It is not PostgreSQL RLS.

## 2. Dashboard permissions

Exactly ten permission codes are seeded:

1. `dashboard.command_center.view`
2. `dashboard.light_mode_dropdown.view`
3. `dashboard.todos.view`
4. `dashboard.todos.manage`
5. `dashboard.analytics.view`
6. `dashboard.modules.view`
7. `dashboard.widgets.view`
8. `dashboard.summary.view`
9. `dashboard.alerts.view`
10. `dashboard.activity_feed.view`

## 3. Default role posture

| System role | Dashboard posture |
| --- | --- |
| platform_super_admin | Inherits all permission codes, but Dashboard still requires active school scope; Todo routes also reject platform-only management posture. |
| organization_admin | Inherits non-platform permissions, including Dashboard permissions; must operate in active school scope. |
| school_admin | Inherits school-level permissions, including Dashboard permissions. |
| teacher | No `dashboard.*` permissions in the system-role allowlist. |
| parent | No `dashboard.*` permissions. |
| student | No `dashboard.*` permissions. |
| dismissal_staff | No `dashboard.*` permissions. |

Custom roles may receive individual Dashboard permissions according to normal Settings/IAM governance, but the active school boundary remains mandatory.

## 4. Tenant boundaries by surface

| Surface | Boundary |
| --- | --- |
| Summary | `prisma.scoped` active school, aggregate-only response. |
| Alerts | `prisma.scoped` active school, aggregate-only response. |
| Widgets | Selected dependencies all run in active school scope. |
| Module Pages | Summary/alerts in active school scope. |
| Analytics | Trusted active school + same-school hierarchy validation. |
| Light Mode | Active school for location/Calendar/planner; actor owner for Todos. |
| Todo CRUD | Active school + authenticated owner + soft-delete exclusion. |
| Activity Feed | Explicit trusted `schoolId` on AuditLog because AuditLog is intentionally scope-exempt. |

## 5. AuditLog exception

`AuditLog` is append-only and not automatically injected by the general school-scope extension. The Dashboard Activity Feed repository therefore explicitly requires:

- `schoolId` from trusted `DashboardScope`
- successful outcome
- approved module set

The repository does not accept a client school ID.

## 6. Todo ownership

Todo access requires both:

- active school scope
- `ownerUserId = current actor ID`

Client-controlled fields cannot override either value.

Safe not-found behavior applies to:

- unknown Todo ID
- another actor's Todo in the same school
- another school's Todo
- soft-deleted Todo

This avoids revealing whether a record exists outside the caller's boundary.

## 7. Analytics hierarchy isolation

Before any aggregate repository executes, the query context resolves requested academic entities through school-scoped repositories.

Validation includes:

- UUID syntax
- record existence in active school
- term belongs to academic year
- section belongs to grade
- classroom belongs to section and grade

A foreign-school or mismatched ID returns safe not-found rather than cross-tenant detail.

## 8. Field-level no-leak behavior

The Dashboard contracts avoid exposing:

- school ID
- organization ID
- role ID
- membership ID
- Todo owner ID
- raw source entity rows
- source-domain PII
- AuditLog metadata blobs
- internal notes/descriptions not approved for a preview

Approved identifier exceptions:

- Activity Feed safe actor and subject IDs
- full Light Mode Calendar/cross-module event IDs
- full Todo CRUD and Light Mode planner Todo IDs

Preview widgets deliberately strip these IDs where they are not required.

## 9. Permission isolation from source routes

A Dashboard permission authorizes only the fixed Dashboard composition. It does not grant permission to the underlying source endpoint.

Examples:

- `dashboard.widgets.view` can expose an attendance count but does not authorize `/attendance/...` routes.
- `dashboard.light_mode_dropdown.view` can expose a safe Calendar event but does not grant `academics.calendar.view`.
- `dashboard.command_center.view` can display a homework risk but does not grant homework management.

## 10. Security-sensitive findings

- No Dashboard route accepts tenant selection from the client.
- No arbitrary analytics query builder exists.
- No raw SQL surface or dynamic model selection is exposed.
- Widget and module actions are fixed frontend routes.
- Weather provider credentials do not exist in the Dashboard contract because the provider is deferred.
- No realtime Dashboard subscription exists, avoiding an unapproved cross-tenant subscription surface.

---

# Dashboard Persistence, Migrations, and Side Effects

## 1. Persistence ownership

Most Dashboard data is derived at request time and is not persisted by the Dashboard.

Dashboard-owned persistence is limited to:

- `DashboardTodo`

Source-domain persistence remains owned by the corresponding core module.

## 2. DashboardTodo model

Mapped table: `dashboard_todos`

Fields:

- UUID primary key
- `schoolId`
- `ownerUserId`
- logical `date`
- `title`
- optional `notes`
- status: PENDING or COMPLETED
- priority: LOW, NORMAL, HIGH
- `sortOrder`
- optional `completedAt`
- `createdAt`
- `updatedAt`
- optional `deletedAt`

Repository reads select an explicit allowlist and do not return tenant/owner fields to presenters.

## 3. Active migrations relevant to Dashboard

The repository closeout records two active migrations at the accepted V1 baseline:

1. `20260710135222_baseline_v1`
2. `20260711162248_dashboard_todos`

The second migration introduced Dashboard Todo persistence. Summary, Alerts, Activity, Widgets, Module Pages, and Analytics use existing source models and did not require new Dashboard-specific aggregate tables.

## 4. Seed changes

Permission seed contains the ten Dashboard permissions.

System-role behavior:

- platform super admin: all permissions
- organization admin: non-platform permission set
- school admin: school-level permission set
- teacher/parent/student/dismissal staff: no Dashboard permission in default allowlists

No Dashboard demo-data seed is required for computed surfaces. Their results depend on source-domain seed/data.

## 5. Mutation side effects

### Todo create

- inserts one `dashboard_todos` row
- server supplies active school ID and current actor ID
- default priority: NORMAL
- default sort order: 0

### Todo update

- owner-safe lookup
- updates only supplied fields
- setting status completed sets `completedAt` if it was not already set
- setting status pending clears `completedAt`

### Todo delete

- owner-safe lookup
- soft delete by setting `deletedAt`

### Other Dashboard routes

- read only
- no mutation of source modules
- no email/SMS/push dispatch
- no BullMQ job
- no Socket.io publication
- no external Weather request
- no Dashboard cache write

## 6. Idempotency posture

| Operation | Current posture |
| --- | --- |
| GET routes | Naturally read-only; result can vary with source data and request time. |
| POST Todo | No idempotency-key contract; retries can create additional Todos. |
| PATCH Todo | No ETag/version precondition; repeated identical state is operationally stable, but concurrency control is last-write behavior. |
| DELETE Todo | Soft-delete mutation after owner lookup; a later retry normally sees safe not-found. |

No idempotency claim should be made beyond the above behavior.

## 7. Audit/observability posture

Activity Feed consumes AuditLog events generated by source modules. It does not create a second activity persistence system.

The accepted Dashboard contract does not define:

- a persisted alert lifecycle
- a Dashboard-specific event outbox
- a Dashboard realtime event stream
- Dashboard aggregate cache invalidation

## 8. Data freshness

Responses carry explicit freshness metadata. Current behavior is request-time computation over persisted data, except:

- Todos: persisted user data
- Weather: not available
- planner events: persisted school/source-domain data

No production cache freshness or SLO is claimed.

---

# Dashboard Testing Guide and Evidence

## 1. Evidence disclaimer

This documentation review did not execute tests locally. The counts below are the fresh results recorded by the repository's final Dashboard V1 closeout on `2026-07-15` at accepted runtime baseline `d72b0f5e9f786e3f39a6526a469ff9bf0fd287b7`.

## 2. Repository-recorded closeout results

| Validation | Recorded result |
| --- | --- |
| Migration governance | 39 checks passed |
| Migration structure check | passed |
| Prisma validate | passed |
| Prisma generate | passed, Prisma Client 6.19.3 |
| TypeScript build no-emit | passed |
| Nest build | passed |
| Dashboard unit discovery | 57 suites, 463 tests passed |
| Dashboard E2E discovery | 10 files, 89 tests passed |
| Dashboard security discovery | 10 files, 50 tests passed |

## 3. E2E suites recorded by closeout

1. `test/e2e/dashboard-activity-feed-foundation.e2e-spec.ts`
2. `test/e2e/dashboard-alerts-foundation.e2e-spec.ts`
3. `test/e2e/dashboard-analytics-catalog-foundation.e2e-spec.ts`
4. `test/e2e/dashboard-analytics-data-pack-foundation.e2e-spec.ts`
5. `test/e2e/dashboard-command-center-foundation.e2e-spec.ts`
6. `test/e2e/dashboard-light-mode-dropdown-foundation.e2e-spec.ts`
7. `test/e2e/dashboard-module-pages-foundation.e2e-spec.ts`
8. `test/e2e/dashboard-summary-foundation.e2e-spec.ts`
9. `test/e2e/dashboard-todos-crud.e2e-spec.ts`
10. `test/e2e/dashboard-widgets-foundation.e2e-spec.ts`

## 4. Security suite areas

The ten `test/security/tenancy.dashboard*.spec.ts` suites cover the main surfaces, including:

- Summary school isolation
- Alerts school isolation
- Activity Feed explicit AuditLog school filtering
- Command Center composed-source isolation
- Widget source isolation
- Module Page isolation
- Analytics hierarchy and school isolation
- Light Mode planner isolation
- Todo school and owner isolation
- fixed permission isolation from source endpoints

## 5. Important behaviors to regression-test

### Authentication and authorization

- no token -> 401
- wrong permission -> 403
- teacher/parent/student default role -> 403
- Dashboard permission does not grant source route access
- Todo route rejects non-management actor posture

### Tenancy

- School A cannot read School B Summary/Alerts/Analytics data
- foreign hierarchy UUID returns 404
- Activity Feed never returns foreign-school AuditLog rows
- Todo cross-school and same-school cross-owner attempts return 404

### Summary and alerts

- active academic context selection
- today boundaries in school timezone
- last-7/last-30 windows
- zero-count alert exclusion and inclusion
- severity/source sorting

### Activity Feed

- approved modules only
- SUCCESS outcomes only
- IAM/auth normalization to settings
- stable cursor order
- malformed cursor rejection
- no raw AuditLog metadata

### Analytics

- each chart's supported filters
- custom date bounds required and validated
- period-range resolution
- hierarchy parent-child mismatch
- zero denominator behavior
- bucket boundaries for day/week/month
- DST transitions and negative-offset timezones
- definition-only chart safe empty state

### Widgets and composition

- filters happen before repository loading
- dependency deduplication
- unknown key fails early
- gradebook widget unavailable without academic context
- calendar widget strips IDs and notes
- maximum per-source planner preview limits

### Todos

- server-controlled school/owner
- title and notes limits
- status/completedAt transition
- sort order validation
- soft-delete exclusion
- cross-owner not-found

## 6. Suggested local verification commands

Run from a clean repository with approved environment configuration:

```bash
npm run test:migration-governance
npm run db:migrations:check
npx prisma validate
npx prisma generate
npx tsc -p tsconfig.build.json --noEmit
npm run build
npx jest dashboard --runInBand
```

For Dashboard E2E/security, use the repository's current Jest configuration and current file discovery. The closeout notes that filenames end in `.e2e-spec.ts`, so a stale `dashboard*.spec.ts` glob discovers zero E2E files.

## 7. HTTP smoke-test workflow

Use `dashboard-api-tests.http` in this package.

Recommended order:

1. set `baseUrl` and `accessToken`
2. call Summary
3. call Alerts with zero-count inclusion
4. call Command Center
5. list Widgets and Module Pages
6. inspect Analytics catalog
7. call representative computed charts
8. call each definition-only chart and verify safe not-implemented behavior
9. call Light Mode
10. create, update, list, and delete a Todo
11. run negative permission, validation, and unknown-key tests

---

# Dashboard Deferred Work, Non-Goals, and Review Findings

## 1. Final V1 status

The repository classifies the accepted Dashboard V1 contract as complete and closed. The limitations below are explicit extensions or non-goals, not hidden blockers.

## 2. Accepted limitations

### Definition-only analytics

- `admissions.funnel`
- `academics.structure_readiness`
- `academics.subject_allocation_coverage`
- `settings.notification_readiness`

No formula is fabricated. Each remains discoverable in the catalog and safely reports not implemented.

### Weather provider

The Light Mode contract exposes a stable unavailable state. There is:

- no external provider call
- no provider secret
- no cache
- no forecast data

Planner/Todo data remains available independently.

### Alerts lifecycle

Alerts are request-time signals. There is no:

- acknowledge
- dismiss
- snooze
- persisted alert identity
- per-user alert state

### Realtime

There is no Dashboard Socket.io subscription or invalidation/replay contract. All data is request-time.

### Performance and cache

The code uses bounded queries and selective composition, but no production latency SLO, query-plan proof, load test, or cache benefit claim exists.

## 3. Out of scope for V1

- custom Dashboard layouts
- saved dashboards
- user widget preferences
- advanced analytics/query builder
- platform-wide multi-school Dashboard
- database RLS migration
- arbitrary Dashboard-to-source action dispatch

## 4. Planner extensions not implemented

- standalone planner endpoint
- date-range planner browsing/export
- recurrence
- reminders
- ICS export
- meeting requests
- scheduled announcements as planner items
- timetable-derived recurring schedule instances
- automatic attendance-session generation
- heuristic deduplication across independent source facts

## 5. Confirmed absent API routes

- alert acknowledge/dismiss/snooze
- activity read/pin/comment
- custom layout/saved dashboard
- analytics builder
- standalone/date-range planner
- Weather provider management/mutation

## 6. Important implementation observations

### 6.1 Module Page analytics is intentionally narrower than standalone analytics

Module detail returns chart definitions for the module but its inline `availableData` is limited to already composable operational snapshots. The standalone chart data endpoint is the authoritative surface for the full 33-chart computed capability.

This is a bounded-fanout decision, not evidence that those charts are missing.

### 6.2 Activity text has controlled fallback behavior

Important known audit event paths have explicit titles/descriptions. Other valid events from an approved source module can be presented through a generic humanized fallback. This makes the feed forward-compatible while preserving source allowlisting.

### 6.3 Todo POST has no retry key

Clients should not automatically retry Todo creation without understanding that duplicate records can be created. There is no `Idempotency-Key` contract.

### 6.4 Dashboard is school-operational, not platform-operational

Even when a platform super admin has the permission code, the feature requires active school context. A separate platform-wide Dashboard would need a different contract and authorization model.

### 6.5 No direct app-facing impact

Teacher, Student, Parent, Applicant, and Dismissal Staff applications do not consume these Dashboard routes by default and their system roles receive no Dashboard permissions. Their source-domain actions can affect aggregate values, but no app contract is redefined.

## 7. Future triggers

A future phase should begin only after an explicit decision for the relevant source of truth:

- analytics formula/model decision for the four definition-only charts
- provider-neutral Weather contract and privacy/cache rules
- alert ownership and lifecycle semantics
- realtime subscription, authorization, replay, and invalidation rules
- measured production performance need
- planner range/recurrence/reminder identity model

---

# Dashboard Source File Inventory

## 1. Review scope

The review covered the Dashboard module itself and the cross-module repositories/models required to explain its actual logic. Historical closeout documents were used as supporting evidence only after current code inspection.

## 2. Module and controllers

- `src/modules/dashboard/dashboard.module.ts`
- `src/modules/dashboard/controller/dashboard.controller.ts`
- `src/modules/dashboard/controller/dashboard-todos.controller.ts`
- `src/modules/dashboard/dashboard-context.ts`

## 3. Application layer

- `application/get-dashboard-summary.use-case.ts`
- `application/list-dashboard-alerts.use-case.ts`
- `application/list-dashboard-activity-feed.use-case.ts`
- `application/get-dashboard-command-center.use-case.ts`
- `application/get-dashboard-light-mode-dropdown.use-case.ts`
- `application/list-dashboard-todos.use-case.ts`
- `application/create-dashboard-todo.use-case.ts`
- `application/update-dashboard-todo.use-case.ts`
- `application/delete-dashboard-todo.use-case.ts`
- `application/dashboard-todo.helpers.ts`
- `application/list-dashboard-modules.use-case.ts`
- `application/get-dashboard-module-page.use-case.ts`
- `application/list-dashboard-widgets.use-case.ts`
- `application/get-dashboard-widget.use-case.ts`
- `application/get-dashboard-analytics-catalog.use-case.ts`
- `application/list-dashboard-analytics-charts.use-case.ts`
- `application/get-dashboard-analytics-chart.use-case.ts`
- `application/get-dashboard-analytics-chart-data.use-case.ts`
- `application/dashboard-analytics-query-context.service.ts`
- `application/dashboard-time-context.service.ts`
- `application/dashboard-widget-composition.service.ts`

## 4. Domain layer

- `domain/dashboard-time-context.ts`
- `domain/dashboard-widget-registry.ts`
- `domain/dashboard-widget-composition.ts`
- `domain/dashboard-module-pages.ts`
- `domain/dashboard-analytics-catalog.ts`
- `domain/dashboard-analytics-data-pack.ts`
- `domain/dashboard-analytics-query.ts`
- `domain/dashboard-analytics-coordinate.ts`
- `domain/dashboard-analytics-buckets.ts`
- `domain/dashboard-attendance-analytics-buckets.ts`
- `domain/dashboard-attendance-analytics.ts`
- `domain/dashboard-admissions-students-analytics.ts`
- `domain/dashboard-academics-analytics.ts`
- `domain/dashboard-grades-homework-analytics.ts`
- `domain/dashboard-behavior-reinforcement-analytics.ts`
- `domain/dashboard-communication-settings-analytics.ts`

## 5. Infrastructure/read repositories

- `infrastructure/dashboard-summary.repository.ts`
- `infrastructure/dashboard-alerts.repository.ts`
- `infrastructure/dashboard-activity-feed.repository.ts`
- `infrastructure/dashboard-time-context.repository.ts`
- `infrastructure/dashboard-light-mode-dropdown.repository.ts`
- `infrastructure/dashboard-todos.repository.ts`
- `infrastructure/dashboard-planner-calendar.repository.ts`
- `infrastructure/dashboard-planner-items.repository.ts`
- `infrastructure/dashboard-analytics-hierarchy.repository.ts`
- `infrastructure/dashboard-analytics-snapshot.repository.ts`
- `infrastructure/dashboard-admissions-analytics.repository.ts`
- `infrastructure/dashboard-students-analytics.repository.ts`
- `infrastructure/dashboard-academics-analytics.repository.ts`
- `infrastructure/dashboard-grades-analytics.repository.ts`
- `infrastructure/dashboard-homework-analytics.repository.ts`
- `infrastructure/dashboard-behavior-analytics.repository.ts`
- `infrastructure/dashboard-reinforcement-analytics.repository.ts`
- `infrastructure/dashboard-communication-analytics.repository.ts`
- `src/modules/attendance/reports/infrastructure/attendance-dashboard-analytics.repository.ts`

## 6. Presenters

- `presenters/dashboard-summary.presenter.ts`
- `presenters/dashboard-alerts.presenter.ts`
- `presenters/dashboard-activity-feed.presenter.ts`
- `presenters/dashboard-command-center.presenter.ts`
- `presenters/dashboard-light-mode-dropdown.presenter.ts`
- `presenters/dashboard-todos.presenter.ts`
- `presenters/dashboard-modules.presenter.ts`
- `presenters/dashboard-widgets.presenter.ts`
- `presenters/dashboard-analytics.presenter.ts`
- `presenters/dashboard-analytics-data.presenter.ts`
- `presenters/dashboard-metadata.presenter.ts`

## 7. DTOs

- `dto/dashboard-summary.dto.ts`
- `dto/dashboard-alerts.dto.ts`
- `dto/dashboard-activity-feed.dto.ts`
- `dto/dashboard-command-center.dto.ts`
- `dto/dashboard-light-mode-dropdown.dto.ts`
- `dto/dashboard-todos.dto.ts`
- `dto/dashboard-modules.dto.ts`
- `dto/dashboard-widgets.dto.ts`
- `dto/dashboard-analytics.dto.ts`
- `dto/dashboard-analytics-data.dto.ts`
- `dto/dashboard-metadata.dto.ts`

## 8. Persistence and authorization

- `prisma/schema.prisma`
- `prisma/migrations/20260710135222_baseline_v1/migration.sql`
- `prisma/migrations/20260711162248_dashboard_todos/migration.sql`
- `prisma/seeds/01-permissions.seed.ts`
- `prisma/seeds/02-system-roles.seed.ts`
- `src/infrastructure/database/school-scope.extension.ts`
- `src/common/guards/permissions.guard.ts`
- request-context and standard authentication/scope guards

## 9. E2E tests

- `test/e2e/dashboard-activity-feed-foundation.e2e-spec.ts`
- `test/e2e/dashboard-alerts-foundation.e2e-spec.ts`
- `test/e2e/dashboard-analytics-catalog-foundation.e2e-spec.ts`
- `test/e2e/dashboard-analytics-data-pack-foundation.e2e-spec.ts`
- `test/e2e/dashboard-command-center-foundation.e2e-spec.ts`
- `test/e2e/dashboard-light-mode-dropdown-foundation.e2e-spec.ts`
- `test/e2e/dashboard-module-pages-foundation.e2e-spec.ts`
- `test/e2e/dashboard-summary-foundation.e2e-spec.ts`
- `test/e2e/dashboard-todos-crud.e2e-spec.ts`
- `test/e2e/dashboard-widgets-foundation.e2e-spec.ts`

## 10. Security tests

The final closeout dynamically discovered ten current files matching `test/security/tenancy.dashboard*.spec.ts`. Named evidence includes:

- `test/security/tenancy.dashboard.spec.ts`
- `test/security/tenancy.dashboard-alerts.spec.ts`
- `test/security/tenancy.dashboard-activity-feed.spec.ts`
- `test/security/tenancy.dashboard-command-center.spec.ts`
- `test/security/tenancy.dashboard-widgets.spec.ts`
- `test/security/tenancy.dashboard-modules.spec.ts`
- Dashboard Analytics tenancy suites
- `test/security/tenancy.dashboard-light-mode-dropdown.spec.ts`
- `test/security/tenancy.dashboard-todos.spec.ts`

## 11. Unit-test families

Current Dashboard unit discovery includes tests for:

- time context and civil-date/DST helpers
- Summary repository/presenter/use case
- alert computation/repository/presenter
- activity mapping/filter/cursor/repository
- widget registry/presenter/composition plan
- module registry/presenter/use case
- Todo helpers/use cases/presenter/repository behavior
- analytics catalog/query validation/hierarchy
- coordinate and bucket contracts
- each analytics computation pack
- each aggregate repository
- Light Mode and planner adapters/presenters
- no-leak and fixed-route metadata

## 12. Supporting repository documentation inspected

- `docs/sprint-dashboard-v1-final-closeout-audit.md`
- Dashboard phase closeouts for Summary, Alerts, Activity, Command Center, Light Mode, Todos, Analytics packs, Widget composition, and Planner Calendar
- root architecture, security, Prisma, migration, testing, and API governance files

Current code and tests take precedence over historical phase statements.
