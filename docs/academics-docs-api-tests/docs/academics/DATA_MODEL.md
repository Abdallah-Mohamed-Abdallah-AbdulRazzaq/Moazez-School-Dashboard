# Academics V1 Data Model

This document summarizes the implemented data-model concepts. It is not a full Prisma schema dump.

## Academic structure

Main models:

- `AcademicYear`
- `Term`
- `Stage`
- `Grade`
- `Section`
- `Classroom`
- `Room`

Conceptual hierarchy:

```text
AcademicYear
└── Term

Stage
└── Grade
    └── Section
        └── Classroom
```

Rooms are school-scoped and can be referenced by timetable entries where room assignment is needed.

## Subjects

Main model:

- `Subject`

Subjects are school-scoped catalog records. A subject can be active/inactive and can be soft-deleted.

## Subject allocation

Main model:

- `SubjectAllocation`

Purpose:

```text
(term, grade, subject) -> weeklyHours
```

This is the V1 source of truth for weekly subject hours. It supports timetable and lesson-plan validation.

## Teacher allocation

Main model:

- `TeacherSubjectAllocation`

Purpose:

```text
(term, classroom, subject) -> teacherUserId
```

It binds a teacher to a class/subject/term teaching responsibility.

Teacher App Academics relies heavily on this model to enforce teacher ownership.

## Timetable

Main models:

- `TimetableConfig`
- `TimetablePeriod`
- `TimetableEntry`
- `TimetablePublication`
- `TimetableConflict`

Conceptual relationships:

```text
TimetableConfig
├── TimetablePeriod[]
├── TimetableEntry[]
├── TimetablePublication
└── TimetableConflict[]
```

Timetable entries connect academic scope and schedule slots. They can include teacher allocation, subject, classroom, room, day of week, and period references depending on the workflow.

## Academic calendar

Main model:

- `AcademicCalendarEvent`

Used by:

- Dashboard calendar CRUD.
- Teacher App calendar reads.
- Student App calendar reads.
- Parent App child calendar reads.

App-facing calendar responses are safe projections, not raw dashboard records.

## Curriculum

Main models:

- `Curriculum`
- `CurriculumUnit`
- `CurriculumLesson`
- `LessonContentItem`

Conceptual relationships:

```text
Curriculum
└── CurriculumUnit[]
    └── CurriculumLesson[]
        └── LessonContentItem[]
```

Curriculum supports lifecycle behavior such as activation and archive/read-only protection.

Lesson content can include text, URLs, metadata, and file references. App-facing file exposure is metadata-only.

## Lesson plans

Main models:

- `LessonPlan`
- `LessonPlanItem`

Conceptual relationship:

```text
LessonPlan
└── LessonPlanItem[]
```

Lesson plans connect:

- Academic year.
- Term.
- Classroom.
- Subject.
- Teacher allocation.
- Curriculum.
- Planned dates.
- Timetable entries where applicable.
- Lesson content through curriculum lessons.

## App-facing read model dependencies

### Teacher App lesson-preparation

Depends on:

- `TeacherSubjectAllocation`
- `LessonPlan`
- `LessonPlanItem`
- `Curriculum`
- `CurriculumUnit`
- `CurriculumLesson`
- `LessonContentItem`
- `TimetableEntry`
- `TimetablePeriod`

### Student App lessons

Depends on:

- Linked student user.
- Active `Enrollment`.
- `LessonPlan`
- `LessonPlanItem`
- Active `Curriculum`
- Visible classroom/term/year scope.

### Parent App lessons

Depends on:

- `Guardian`
- `StudentGuardian`
- Active linked child `Enrollment`
- Same lesson dependencies as Student App.

## School-scoped models

Academics school-scoped models include:

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

## Soft-deletable Academics models

Normal reads exclude rows where `deletedAt` is not null for relevant models such as:

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

## V1 schema decision notes

- `Term.isActive` is the accepted V1 closed/open write policy.
- No `TermStatus` enum was added.
- No `PREPARED` lesson status was added.
- Teacher max-load policy is computed from allocations/weekly-hours for V1 rather than requiring a persisted max-load model.
