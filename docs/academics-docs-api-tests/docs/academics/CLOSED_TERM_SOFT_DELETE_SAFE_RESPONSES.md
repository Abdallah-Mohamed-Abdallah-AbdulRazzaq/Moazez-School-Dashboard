# Closed-Term, Soft-Delete, and Safe Response Rules

## Closed-term policy

Academics V1 uses the accepted convention:

```text
Term.isActive === false => closed/read-only term for mutations
```

No separate `TermStatus` enum was introduced for V1.

## Closed-term protected areas

Closed-term protections apply to representative mutation paths including:

- Subject allocation bulk writes.
- Teacher allocation create/delete/bulk/apply/clear flows.
- Timetable writes.
- Timetable publish/unpublish where writes are involved.
- Lesson-plan auto-plan.
- Lesson-plan item move/reschedule.
- Lesson-plan status actions.
- Teacher App lesson-preparation status updates.

## Example closed-term error

Subject allocation bulk save against a closed term returns conflict behavior with code similar to:

```text
academics.subject_allocation.closed_term
```

## Soft-delete filtering

Soft-deletable models use `deletedAt`.

Normal read operations automatically exclude soft-deleted rows through the Prisma school-scope extension unless an explicit bypass is used.

Relevant Academics soft-deletable models include:

- `AcademicYear`
- `Term`
- `Stage`
- `Grade`
- `Section`
- `Classroom`
- `Subject`
- `SubjectAllocation`
- `Room`
- `AcademicCalendarEvent`
- `Curriculum`
- `CurriculumUnit`
- `CurriculumLesson`
- `LessonContentItem`
- `LessonPlan`
- `LessonPlanItem`

## Soft-delete behavior by area

### Dashboard lists

Dashboard lists exclude soft-deleted records such as:

- Soft-deleted subjects.
- Soft-deleted calendar events.
- Soft-deleted curricula.
- Soft-deleted lesson plans.

### App-facing lessons

Teacher/Student/Parent lesson read models exclude or hide records when relevant dependencies are soft-deleted:

- Lesson-plan item.
- Lesson plan.
- Curriculum.
- Curriculum unit.
- Curriculum lesson.
- Lesson content item.
- Attached file.
- Subject.
- Classroom hierarchy.

## Safe not-found behavior

Sensitive cross-school dashboard detail reads should return safe 404 behavior without serializing hidden cross-school IDs in error details.

This protects:

- Calendar event detail.
- Curriculum detail.
- Curriculum unit/lesson detail where applicable.
- Lesson plan detail.
- Lesson-plan item detail where applicable.

## Safe response policy

### App-facing responses must not expose

```text
schoolId
organizationId
membershipId
roleId
passwordHash
deletedAt
objectKey
bucket
uploaderId
createdByUserId
updatedByUserId
raw Prisma internals
teacher-only notes in Student/Parent lesson responses
```

### Lesson file metadata only

Allowed file metadata:

```text
fileId
filename
mimeType
sizeBytes
```

Disallowed:

```text
signedUrl
downloadUrl
bucket
objectKey
storage provider internals
uploader id
raw file path
```

## Teacher notes rule

Teacher App lesson-preparation may include teacher-facing notes.

Student App and Parent App lesson responses must omit those notes.

## Student/Parent read-only rule

Student and Parent lesson APIs are read-only.

There are no Student/Parent lesson mutation or status update APIs in V1.
