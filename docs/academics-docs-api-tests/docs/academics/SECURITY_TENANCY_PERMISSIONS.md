# Academics V1 Security, Tenancy, and Permissions

## Security goals

Academics V1 enforces:

- Dashboard permission checks.
- School-level tenancy isolation.
- Role-specific app-facing boundaries.
- Safe not-found behavior for sensitive cross-school details.
- Safe app-facing response fields.
- No storage internals in app-facing lesson content.

## Dashboard permission model

Dashboard routes use `RequiredPermissions`.

Permission families:

```text
academics.overview.view
academics.structure.view
academics.structure.manage
academics.subjects.view
academics.subjects.manage
academics.calendar.view
academics.calendar.manage
academics.curriculum.view
academics.curriculum.manage
academics.lesson_plans.view
academics.lesson_plans.manage
```

Dashboard users must have active school membership and the route's required permission.

## App-facing access model

App-facing routes do not use dashboard permissions as their main authorization mechanism.

### Teacher App

Boundary:

```text
current teacher user + teacher-owned TeacherSubjectAllocation records
```

A teacher cannot read another teacher's lesson-preparation items.

### Student App

Boundary:

```text
current student user + linked student + active enrollment + classroom/year/term scope
```

A student cannot read another student's lessons.

### Parent App

Boundary:

```text
current parent user + guardian records + linked children + active child enrollments
```

A parent cannot read an unlinked child's schedule, calendar, or lessons.

## School tenancy

School-scoped Academics models are registered in the Prisma school-scope extension.

This means normal scoped reads and mutations are constrained by the active membership `schoolId`.

Key school-scoped Academics models include:

- `AcademicYear`
- `Term`
- `Stage`
- `Grade`
- `Section`
- `Classroom`
- `Subject`
- `SubjectAllocation`
- `TeacherSubjectAllocation`
- `Room`
- `AcademicCalendarEvent`
- `Curriculum`
- `CurriculumUnit`
- `CurriculumLesson`
- `LessonContentItem`
- `LessonPlan`
- `LessonPlanItem`
- `TimetableConfig`
- `TimetablePeriod`
- `TimetableEntry`
- `TimetablePublication`
- `TimetableConflict`

## Cross-school protections

The final security sweep verifies representative cross-school filtering for:

- Subjects.
- Calendar events.
- Curriculum.
- Lesson plans.
- App-facing lesson content.

Sensitive dashboard detail routes use safe not-found behavior so cross-school IDs are not echoed back in error details.

## Role isolation

Representative denied access behavior:

- Unauthenticated users cannot call dashboard Academics routes.
- Teacher/Student/Parent app users cannot call dashboard Academics routes without required permissions.
- School users without permissions cannot call protected dashboard routes.
- Admin/dashboard users cannot call Teacher App lesson-preparation as if they were teachers.
- Teacher users cannot call Student App or Parent App academic routes.
- Student users cannot call Teacher App or Parent App academic routes.
- Parent users cannot call Teacher App or Student App academic routes.

## Safe response boundaries

App-facing responses do not expose:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `passwordHash`
- `deletedAt`
- `objectKey`
- `bucket`
- `uploaderId`
- `createdByUserId`
- `updatedByUserId`
- raw Prisma internals
- teacher-only notes in Student/Parent lesson responses

Teacher App may expose teacher-facing lesson-preparation `notes`; Student and Parent app presenters intentionally omit them.

## File exposure

Lesson content file exposure is metadata-only:

```text
fileId
filename
mimeType
sizeBytes
```

No signed URLs, download URLs, storage buckets, object keys, provider internals, or uploader identifiers are exposed by Teacher, Student, or Parent lesson presenters.

## Audit/security notes

The final security sweep found and fixed a prior issue where sensitive dashboard not-found errors echoed scoped IDs. The accepted behavior now preserves error code/status/message while removing unsafe hidden cross-school IDs from serialized details.
