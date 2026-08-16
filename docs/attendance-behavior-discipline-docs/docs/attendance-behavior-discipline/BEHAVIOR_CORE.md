# Behavior Core

## Source-of-truth responsibility

Behavior Core owns:

- Behavior categories.
- Behavior records.
- Behavior review queue.
- Behavior record approval/rejection.
- Behavior point ledger reads and summaries.
- Dashboard/admin behavior overview and student/classroom summaries.

Behavior is not Discipline. Behavior records can appear in the derived Discipline timeline only after they are approved.

## Category routes

```http
GET    /api/v1/behavior/categories
GET    /api/v1/behavior/categories/:categoryId
POST   /api/v1/behavior/categories
PATCH  /api/v1/behavior/categories/:categoryId
DELETE /api/v1/behavior/categories/:categoryId
```

Permissions:

| Action | Permission |
| --- | --- |
| List/get categories | `behavior.categories.view` |
| Create/update/delete categories | `behavior.categories.manage` |

## Record routes

```http
GET   /api/v1/behavior/records
GET   /api/v1/behavior/records/:recordId
POST  /api/v1/behavior/records
PATCH /api/v1/behavior/records/:recordId
POST  /api/v1/behavior/records/:recordId/submit
POST  /api/v1/behavior/records/:recordId/cancel
POST  /api/v1/behavior/records/:recordId/approve
POST  /api/v1/behavior/records/:recordId/reject
```

Permissions:

| Action | Permission |
| --- | --- |
| List/get records | `behavior.records.view` |
| Create/submit records | `behavior.records.create` |
| Update/cancel records | `behavior.records.manage` |
| Approve/reject records | `behavior.records.review` |

## Review queue routes

```http
GET /api/v1/behavior/review-queue
GET /api/v1/behavior/review-queue/:recordId
```

Both use:

```text
behavior.records.view
```

## Dashboard summary routes

```http
GET /api/v1/behavior/overview
GET /api/v1/behavior/students/:studentId/summary
GET /api/v1/behavior/classrooms/:classroomId/summary
```

Permissions:

| Route | Permission |
| --- | --- |
| `/behavior/overview` | `behavior.overview.view` |
| `/behavior/students/:studentId/summary` | `behavior.records.view` |
| `/behavior/classrooms/:classroomId/summary` | `behavior.overview.view` |

## App-facing Behavior routes

Student and Parent Behavior routes exist separately in app modules:

```http
GET /api/v1/student/behavior
GET /api/v1/student/behavior/summary
GET /api/v1/student/behavior/:recordId

GET /api/v1/parent/children/:studentId/behavior
GET /api/v1/parent/children/:studentId/behavior/summary
GET /api/v1/parent/children/:studentId/behavior/:recordId
```

These routes remain Behavior-only. They should expose approved positive/negative behavior records only and must not be treated as mixed Attendance + Behavior Discipline feeds.

## Relationship with Discipline

Discipline reads approved Behavior records and behavior point deltas, but Behavior Core remains the source of truth.

Discipline does not create, update, approve, reject, or cancel Behavior records.

## No-leak posture

App-facing Behavior and Discipline surfaces must not expose internal tenant or workflow fields such as:

- school/internal scope fields
- raw reviewer ids
- deleted records
- password/session data
- internal audit metadata
