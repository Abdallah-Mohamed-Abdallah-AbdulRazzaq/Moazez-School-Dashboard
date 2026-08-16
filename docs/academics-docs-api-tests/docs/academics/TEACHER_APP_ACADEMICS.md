# Teacher App Academics

## Purpose

Teacher App Academics is an app-facing read and preparation surface for the currently authenticated teacher.

It is not a dashboard permission surface. It is constrained by teacher identity and teacher-owned teaching allocations.

## Access boundary

Teacher App uses `TeacherAppAccessService` to build the teacher context from the request context.

The important rule is:

```text
A teacher can only access allocations and lesson-preparation items owned by that teacher.
```

Teacher-owned visibility is enforced through `TeacherSubjectAllocation` records and teacher-specific read adapters.

## Implemented APIs

### Teacher schedule

```http
GET /api/v1/teacher/schedule?date=YYYY-MM-DD
GET /api/v1/teacher/schedule/week?date=YYYY-MM-DD
```

Behavior:

- Returns the current teacher's daily/weekly schedule.
- Uses published timetable context where available.
- Uses date input in `YYYY-MM-DD` format.
- Does not expose dashboard mutation behavior.

### Teacher calendar

```http
GET /api/v1/teacher/calendar/events
GET /api/v1/teacher/calendar/events/:eventId
```

Behavior:

- Returns teacher-visible academic calendar events.
- Uses app-facing calendar DTOs.
- Keeps calendar reads separate from schedule reads.

### Teacher lesson preparation

```http
GET   /api/v1/teacher/lesson-preparation/today?date=YYYY-MM-DD
GET   /api/v1/teacher/lesson-preparation/week?date=YYYY-MM-DD
GET   /api/v1/teacher/lesson-preparation/:lessonPlanItemId
PATCH /api/v1/teacher/lesson-preparation/:lessonPlanItemId/status
```

Behavior:

- `today` lists teacher-owned lesson-preparation items for a date.
- `week` lists teacher-owned lesson-preparation items grouped by week days.
- Detail returns one teacher-owned lesson-preparation item.
- Status update updates a teacher-owned lesson-plan item only if writable.

## Teacher lesson-preparation visibility

A teacher lesson-preparation item must match:

- Current school.
- Current teacher user id.
- A teacher-owned `TeacherSubjectAllocation` id.
- Non-deleted lesson-plan item.
- Non-deleted lesson plan.
- Non-deleted term.
- Active/non-deleted subject.
- Non-deleted classroom hierarchy.
- Non-archived plan/curriculum for normal reads.

## Response shape

Teacher lesson-preparation item responses include:

- `lessonPlanItemId`
- `lessonPlanId`
- `teacherSubjectAllocationId`
- `timetableEntryId`
- `plannedDate`
- `dayOfWeek`
- `status`
- `title`
- `notes`
- `subject`
- `classroom`
- `period`
- `curriculum`
- `unit`
- `lesson`
- `content[]`

Teacher responses may expose teacher-facing `notes` because they are part of lesson preparation. Student and Parent responses intentionally omit teacher-only notes.

## Status update rules

Teacher App accepts these API statuses for updates:

```text
planned
in_progress
done
skipped
```

Presented statuses may also include historical/read-only values such as:

```text
rescheduled
cancelled
```

But the update endpoint only maps and accepts:

```text
planned -> PLANNED
in_progress -> IN_PROGRESS
done -> DONE
skipped -> SKIPPED
```

There is no `prepared` status in V1.

## Allowed status transitions

```text
PLANNED     -> IN_PROGRESS | DONE | SKIPPED
IN_PROGRESS -> DONE | SKIPPED
DONE        -> no transition
SKIPPED     -> no transition
RESCHEDULED -> no transition
CANCELLED   -> no transition
```

Changing to the same status is allowed as a no-op-like transition.

## Closed-term protection

Teacher App status update is blocked when the parent lesson plan's term is closed:

```text
lessonPlan.term.isActive === false
```

## Read-only protections

Teacher App status update is blocked or hidden when:

- Lesson plan is archived.
- Curriculum is archived.
- Lesson plan is soft-deleted.
- Curriculum is soft-deleted.
- Unit or lesson is soft-deleted.

## Non-goals

Teacher App Academics does not implement:

- Dashboard-level curriculum editing.
- Timetable editing.
- Student or parent lesson completion.
- Signed file downloads.
- A `prepared` status.
- Notification/reminder side effects.
