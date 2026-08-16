# Dashboard Academics

## Purpose

Dashboard Academics is the school-side administration and operational surface for Academics.

It is used by school users with the required permissions. It is not used directly by Teacher App, Student App, or Parent App.

## Security model

Dashboard Academics requires:

1. Authenticated user.
2. Active school membership.
3. Required dashboard permission for the specific route.
4. School-scoped Prisma access.

## Permissions

| Area | View permission | Manage permission |
| --- | --- | --- |
| Overview | `academics.overview.view` | N/A |
| Structure | `academics.structure.view` | `academics.structure.manage` |
| Rooms | `academics.structure.view` | `academics.structure.manage` |
| Subjects | `academics.subjects.view` | `academics.subjects.manage` |
| Subject allocation | `academics.subjects.view` | `academics.subjects.manage` |
| Teacher allocation | `academics.structure.view` | `academics.structure.manage` |
| Timetable | `academics.structure.view` | `academics.structure.manage` |
| Calendar | `academics.calendar.view` | `academics.calendar.manage` |
| Curriculum | `academics.curriculum.view` | `academics.curriculum.manage` |
| Lesson plans | `academics.lesson_plans.view` | `academics.lesson_plans.manage` |

## Implemented route families

### Overview

```http
GET /api/v1/academics/overview
```

Returns an Academics readiness/overview summary.

### Academic structure

```http
GET   /api/v1/academics/structure/years
POST  /api/v1/academics/structure/years
PATCH /api/v1/academics/structure/years/:id

GET   /api/v1/academics/structure/terms
POST  /api/v1/academics/structure/terms
PATCH /api/v1/academics/structure/terms/:id

GET   /api/v1/academics/structure/tree

POST   /api/v1/academics/structure/stages
PATCH  /api/v1/academics/structure/stages/:id
DELETE /api/v1/academics/structure/stages/:id
PATCH  /api/v1/academics/structure/stages/:id/reorder

POST   /api/v1/academics/structure/grades
PATCH  /api/v1/academics/structure/grades/:id
DELETE /api/v1/academics/structure/grades/:id
PATCH  /api/v1/academics/structure/grades/:id/reorder

POST   /api/v1/academics/structure/sections
PATCH  /api/v1/academics/structure/sections/:id
DELETE /api/v1/academics/structure/sections/:id
PATCH  /api/v1/academics/structure/sections/:id/reorder

POST   /api/v1/academics/structure/classrooms
PATCH  /api/v1/academics/structure/classrooms/:id
DELETE /api/v1/academics/structure/classrooms/:id
PATCH  /api/v1/academics/structure/classrooms/:id/reorder
```

Notes:

- `years` and `terms` expose list/create/update in the current controller.
- `stages`, `grades`, `sections`, and `classrooms` support create/update/delete/reorder.
- `tree` provides a dashboard-friendly hierarchical structure read model.

### Rooms

```http
GET    /api/v1/academics/rooms
POST   /api/v1/academics/rooms
PATCH  /api/v1/academics/rooms/:id
DELETE /api/v1/academics/rooms/:id
```

Rooms support timetable room assignment where applicable.

### Subjects

```http
GET    /api/v1/academics/subjects
POST   /api/v1/academics/subjects
PATCH  /api/v1/academics/subjects/:id
DELETE /api/v1/academics/subjects/:id
```

Subjects are school-scoped catalog records. Subject allocation is implemented separately as the weekly-hours source of truth.

### Subject allocation

```http
GET /api/v1/academics/subject-allocations
PUT /api/v1/academics/subject-allocations/bulk
```

Subject allocation represents:

```text
(term, grade, subject) -> weeklyHours
```

This is the weekly-hours matrix used by timetable and planning validation.

### Teacher allocation

```http
GET    /api/v1/academics/allocations
POST   /api/v1/academics/allocations
PUT    /api/v1/academics/allocations/bulk
POST   /api/v1/academics/allocations/apply-to-grade
POST   /api/v1/academics/allocations/clear-subject
GET    /api/v1/academics/allocations/validation
GET    /api/v1/academics/allocations/teacher-loads
DELETE /api/v1/academics/allocations/:id
```

Teacher allocation maps teachers to subject/classroom/term teaching responsibilities.

Implemented behavior includes:

- List allocations.
- Create allocation.
- Delete allocation.
- Bulk save allocations.
- Apply allocation to grade.
- Clear subject allocations.
- Validate allocation coverage.
- Read teacher loads.
- Reject closed-term mutations.
- Protect dependent timetable/lesson workflows from unsafe allocation changes.

### Timetable

```http
GET    /api/v1/academics/timetable/all
GET    /api/v1/academics/timetable/config
PUT    /api/v1/academics/timetable/config
GET    /api/v1/academics/timetable/periods
POST   /api/v1/academics/timetable/periods
PATCH  /api/v1/academics/timetable/periods/:periodId
DELETE /api/v1/academics/timetable/periods/:periodId
GET    /api/v1/academics/timetable/entries
PUT    /api/v1/academics/timetable/entries/bulk
GET    /api/v1/academics/timetable/entries/:entryId
POST   /api/v1/academics/timetable/entries
PATCH  /api/v1/academics/timetable/entries/:entryId
DELETE /api/v1/academics/timetable/entries/:entryId
GET    /api/v1/academics/timetable/preview
GET    /api/v1/academics/timetable/conflicts
GET    /api/v1/academics/timetable/publication
POST   /api/v1/academics/timetable/publish
POST   /api/v1/academics/timetable/unpublish
GET    /api/v1/academics/timetable/validate
POST   /api/v1/academics/timetable/conflicts/check
```

Implemented behavior includes:

- Full dashboard grid read model.
- Timetable config upsert.
- Period create/update/delete.
- Entry create/update/delete.
- Bulk grid save.
- Preview.
- Persisted/computed conflict reads.
- Proposed conflict check without saving.
- Publication state.
- Publish/unpublish.
- Validation for completeness and weekly-hour readiness.

### Academic calendar

```http
GET    /api/v1/academics/calendar/events
POST   /api/v1/academics/calendar/events
GET    /api/v1/academics/calendar/events/:eventId
PATCH  /api/v1/academics/calendar/events/:eventId
DELETE /api/v1/academics/calendar/events/:eventId
```

Dashboard calendar is full CRUD. App-facing calendar reads are exposed separately in Teacher, Student, and Parent modules.

### Curriculum and lesson content

```http
GET    /api/v1/academics/curriculum
POST   /api/v1/academics/curriculum
GET    /api/v1/academics/curriculum/:curriculumId
PATCH  /api/v1/academics/curriculum/:curriculumId
POST   /api/v1/academics/curriculum/:curriculumId/activate
POST   /api/v1/academics/curriculum/:curriculumId/archive
DELETE /api/v1/academics/curriculum/:curriculumId

POST   /api/v1/academics/curriculum/:curriculumId/units
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId/reorder
DELETE /api/v1/academics/curriculum/:curriculumId/units/:unitId

POST   /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/reorder
DELETE /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId

GET    /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content
POST   /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content
GET    /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId
PATCH  /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId/reorder
DELETE /api/v1/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId
```

Implemented behavior includes:

- Curriculum lifecycle.
- Units and lessons.
- Ordering/reordering.
- Lesson content items.
- Soft delete.
- Archive/read-only protection.
- Safe content/file metadata boundaries.

### Lesson plans

```http
GET    /api/v1/academics/lesson-plans
POST   /api/v1/academics/lesson-plans
GET    /api/v1/academics/lesson-plans/weeks
GET    /api/v1/academics/lesson-plans/summary
POST   /api/v1/academics/lesson-plans/auto-plan
PATCH  /api/v1/academics/lesson-plans/items/:itemId/move
GET    /api/v1/academics/lesson-plans/validation
GET    /api/v1/academics/lesson-plans/:lessonPlanId
PATCH  /api/v1/academics/lesson-plans/:lessonPlanId
POST   /api/v1/academics/lesson-plans/:lessonPlanId/activate
POST   /api/v1/academics/lesson-plans/:lessonPlanId/archive
DELETE /api/v1/academics/lesson-plans/:lessonPlanId
POST   /api/v1/academics/lesson-plans/:lessonPlanId/items
PATCH  /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId
PATCH  /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId/reorder
POST   /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId/start
POST   /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId/complete
POST   /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId/skip
POST   /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId/cancel
DELETE /api/v1/academics/lesson-plans/:lessonPlanId/items/:itemId
```

Implemented behavior includes:

- Lesson plan CRUD.
- Plan activate/archive.
- Plan item CRUD.
- Item reorder.
- Item status lifecycle.
- Weeks read model.
- Summary read model.
- Auto-plan workflow.
- Move/reschedule workflow.
- Validation workflow.
- Closed-term protection.
- Archive/read-only protection.
