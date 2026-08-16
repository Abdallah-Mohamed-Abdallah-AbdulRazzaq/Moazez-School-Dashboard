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
