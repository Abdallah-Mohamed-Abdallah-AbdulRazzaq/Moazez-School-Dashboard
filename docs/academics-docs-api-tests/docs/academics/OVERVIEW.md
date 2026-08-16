# Academics V1 Overview

## Completion state

Academics V1 backend is accepted as complete for the V1 backend scope.

The implementation includes:

- Dashboard Academics management routes.
- App-facing Teacher, Student, and Parent read models.
- Teacher lesson-preparation status workflow.
- Timetable dashboard workflows.
- Curriculum and lesson-content workflows.
- Lesson planning workflows.
- Final route inventory coverage.
- Final E2E/security sweep coverage.

## Implemented areas

### Dashboard Academics

The dashboard side supports:

- Academics overview.
- Academic years and terms.
- Structure tree: stages, grades, sections, classrooms.
- Rooms.
- Subjects.
- Subject allocation weekly-hours matrix.
- Teacher subject allocation workflows.
- Timetable config, periods, entries, bulk grid, conflicts, validation, publish/unpublish.
- Academic calendar event CRUD.
- Curriculum, units, lessons, lesson content items.
- Lesson plans, lesson-plan items, weeks, summary, auto-plan, item move/reorder/status workflows, validation.

### Teacher App Academics

Teacher App exposes:

- Daily schedule.
- Weekly schedule.
- Calendar events.
- Lesson-preparation today/week/detail.
- Teacher-owned lesson-preparation status updates.

Teacher App is constrained by the current teacher identity and the teacher's owned `TeacherSubjectAllocation` records.

### Student App Academics

Student App exposes:

- Daily schedule.
- Weekly schedule.
- Subjects list/detail.
- Calendar events.
- Lessons today/week/detail.

Student App lessons are read-only and are visible only through the current student's active enrollment, classroom, academic year, and term scope.

### Parent App Academics

Parent App exposes:

- Owned child daily schedule.
- Owned child weekly schedule.
- Owned child calendar events.
- Owned child lessons today/week/detail.

Parent App is constrained by guardian-to-student links and active enrollments.

## What Academics V1 does not do

Academics V1 intentionally does not implement:

- Student lesson status mutation.
- Parent lesson status mutation.
- Student/parent lesson completion tracking.
- Signed file URLs.
- Direct file downloads.
- Notifications or reminders.
- AI lesson planning.
- Advanced analytics.
- Frontend-specific app home composition enrichment.
- A `PREPARED` lesson-plan-item status.

## Important implementation decisions

### Dashboard permissions are separate from app-facing access

Dashboard routes use `RequiredPermissions`, such as:

- `academics.structure.view`
- `academics.structure.manage`
- `academics.subjects.view`
- `academics.subjects.manage`
- `academics.calendar.view`
- `academics.calendar.manage`
- `academics.curriculum.view`
- `academics.curriculum.manage`
- `academics.lesson_plans.view`
- `academics.lesson_plans.manage`

App-facing Teacher, Student, and Parent routes use role-specific access services instead of dashboard permissions.

### School tenancy is enforced at multiple layers

Tenancy is enforced by:

1. Prisma school-scope extension for school-scoped models.
2. Dashboard permissions and active membership context.
3. Teacher-owned allocation boundaries.
4. Student linked-user + active enrollment boundaries.
5. Parent guardian-linked child boundaries.
6. Explicit safe-not-found behavior for sensitive cross-school detail reads.

### Closed term means read-only for mutations

The accepted V1 convention is:

```text
Term.isActive === false => closed term
```

Closed terms block representative Academics mutations, including subject allocations, teacher allocations, timetable writes, lesson planning actions, and Teacher App lesson status changes.

### Soft delete is default-filtered

School-scoped and soft-deletable Academics models use `deletedAt`. Normal read operations exclude soft-deleted rows.

### App-facing responses are safe by design

Teacher, Student, and Parent app-facing lesson responses expose curriculum/lesson/content read models while hiding tenant internals, storage internals, and sensitive fields.
