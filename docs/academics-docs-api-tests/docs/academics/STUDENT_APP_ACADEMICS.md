# Student App Academics

## Purpose

Student App Academics is a read-only app-facing surface for the currently authenticated student.

It exposes the student's schedule, subjects, calendar, and lesson content through the current linked student and active enrollment context.

## Access boundary

Student App uses `StudentAppAccessService.getCurrentStudentWithEnrollment()`.

The student context requires:

- A user of student app type/context.
- A linked student record.
- An active enrollment for that linked student.
- Current classroom, academic year, and term visibility.

## Implemented APIs

### Student schedule

```http
GET /api/v1/student/schedule?date=YYYY-MM-DD
GET /api/v1/student/schedule/week?date=YYYY-MM-DD
```

Behavior:

- Returns the current student's daily/weekly schedule.
- Uses active enrollment/classroom visibility.
- Uses the published timetable week-start convention where available.

### Student subjects

```http
GET /api/v1/student/subjects
GET /api/v1/student/subjects/:subjectId
```

Behavior:

- Lists subjects visible to the current student.
- Detail is constrained to visible subject scope.

### Student calendar

```http
GET /api/v1/student/calendar/events
GET /api/v1/student/calendar/events/:eventId
```

Behavior:

- Lists student-visible academic calendar events.
- Uses app-facing calendar DTOs.
- Does not expose dashboard calendar mutation fields.

### Student lessons

```http
GET /api/v1/student/lessons/today?date=YYYY-MM-DD
GET /api/v1/student/lessons/week?date=YYYY-MM-DD
GET /api/v1/student/lessons/:lessonPlanItemId
```

Behavior:

- Returns visible lesson-plan items for the current student.
- Uses active enrollment/classroom/academic-year/term scope.
- Requires active lesson plan and active curriculum.
- Returns lesson content safely.
- Read-only: no create/update/status endpoints exist.

## Lesson visibility rules

A Student App lesson item must match:

- Current school.
- Current student's active enrollment classroom.
- Current academic year.
- Current term.
- Non-deleted lesson-plan item.
- Active and non-deleted lesson plan.
- Active and non-deleted curriculum.
- Active and non-deleted subject.
- Non-deleted classroom hierarchy.
- Non-deleted unit and lesson.
- Non-deleted content items.
- Non-deleted file where a file is attached.

If the current student has no term context, lesson reads safely return no items rather than exposing unrelated data.

## Response shape

Student lesson item responses include:

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

Lesson content items may include:

- `contentItemId`
- `type`
- `title`
- `bodyText`
- `url`
- `sortOrder`
- `isRequired`
- `estimatedMinutes`
- `file` metadata

File metadata is limited to:

```text
fileId
filename
mimeType
sizeBytes
```

## Safe response rules

Student App lesson responses do not expose:

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
- teacher-only notes
- raw Prisma internals

## Non-goals

Student App Academics does not implement:

- Student lesson status mutation.
- Student lesson completion/progress tracking.
- Direct file downloads.
- Signed file URLs.
- Student-side lesson comments/submissions in this Academics surface.
