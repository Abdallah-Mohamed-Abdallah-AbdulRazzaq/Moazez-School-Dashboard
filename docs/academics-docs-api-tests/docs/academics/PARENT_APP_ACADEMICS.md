# Parent App Academics

## Purpose

Parent App Academics is a read-only app-facing surface for a parent/guardian to view the Academics information of an owned/linked child.

It exposes child schedule, child calendar, and child lesson content.

## Access boundary

Parent App uses `ParentAppAccessService`.

The parent context is built from:

1. Current parent user.
2. Guardian records in the current school.
3. Student-guardian links.
4. Active enrollments for linked students.

The important rule is:

```text
A parent can only access students linked to their guardian records and active enrollments.
```

## Implemented APIs

### Child schedule

```http
GET /api/v1/parent/children/:studentId/schedule/today
GET /api/v1/parent/children/:studentId/schedule/weekly
```

Behavior:

- Returns an owned child's daily or weekly schedule.
- Requires `studentId` to be accessible to the current parent.
- Uses active enrollment/classroom visibility.

### Child calendar

```http
GET /api/v1/parent/children/:studentId/calendar/events
GET /api/v1/parent/children/:studentId/calendar/events/:eventId
```

Behavior:

- Lists academic calendar events visible for an owned child.
- Requires guardian-linked child access.
- Uses app-facing calendar DTOs.

### Child lessons

```http
GET /api/v1/parent/children/:studentId/lessons/today?date=YYYY-MM-DD
GET /api/v1/parent/children/:studentId/lessons/week?date=YYYY-MM-DD
GET /api/v1/parent/children/:studentId/lessons/:lessonPlanItemId
```

Behavior:

- Returns visible lesson-plan items for an owned child.
- Uses the linked child's active enrollment, classroom, academic year, and term scope.
- Read-only: no create/update/status routes exist.

## Lesson visibility rules

Parent child lesson visibility follows the linked child's scope:

- School.
- Student id.
- Active enrollment.
- Classroom.
- Academic year.
- Term.
- Active lesson plan.
- Active curriculum.
- Active subject.
- Non-deleted curriculum/unit/lesson/content.

## Response shape

Parent child lesson item responses include:

- `studentId` at response level for lists.
- `lessonPlanItemId`
- `lessonPlanId`
- `timetableEntryId`
- `plannedDate`
- `dayOfWeek`
- `status`
- `title`
- `subject`
- `classroom`
- `period`
- `curriculum`
- `unit`
- `lesson`
- `content[]`

File exposure is metadata-only:

```text
fileId
filename
mimeType
sizeBytes
```

## Safe response rules

Parent App lesson responses do not expose:

- teacher-only notes
- tenant internals
- storage bucket/object keys
- signed URLs
- deleted rows
- raw Prisma internals

## Non-goals

Parent App Academics does not implement:

- Parent lesson status mutation.
- Parent lesson completion/progress tracking.
- Direct file downloads.
- Signed file URLs.
- Parent notes/comments on lessons.
- Notification/reminder side effects.
