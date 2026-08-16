# Academics V1 API Reference

All endpoints assume the global API prefix:

```http
/api/v1
```

All dashboard routes require Bearer authentication and dashboard permissions. App-facing routes require Bearer authentication and role-specific app access.

## Dashboard Academics

### Overview

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/overview` | `academics.overview.view` |

### Structure

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/structure/years` | `academics.structure.view` |
| POST | `/academics/structure/years` | `academics.structure.manage` |
| PATCH | `/academics/structure/years/:id` | `academics.structure.manage` |
| GET | `/academics/structure/terms` | `academics.structure.view` |
| POST | `/academics/structure/terms` | `academics.structure.manage` |
| PATCH | `/academics/structure/terms/:id` | `academics.structure.manage` |
| GET | `/academics/structure/tree` | `academics.structure.view` |
| POST | `/academics/structure/stages` | `academics.structure.manage` |
| PATCH | `/academics/structure/stages/:id` | `academics.structure.manage` |
| DELETE | `/academics/structure/stages/:id` | `academics.structure.manage` |
| PATCH | `/academics/structure/stages/:id/reorder` | `academics.structure.manage` |
| POST | `/academics/structure/grades` | `academics.structure.manage` |
| PATCH | `/academics/structure/grades/:id` | `academics.structure.manage` |
| DELETE | `/academics/structure/grades/:id` | `academics.structure.manage` |
| PATCH | `/academics/structure/grades/:id/reorder` | `academics.structure.manage` |
| POST | `/academics/structure/sections` | `academics.structure.manage` |
| PATCH | `/academics/structure/sections/:id` | `academics.structure.manage` |
| DELETE | `/academics/structure/sections/:id` | `academics.structure.manage` |
| PATCH | `/academics/structure/sections/:id/reorder` | `academics.structure.manage` |
| POST | `/academics/structure/classrooms` | `academics.structure.manage` |
| PATCH | `/academics/structure/classrooms/:id` | `academics.structure.manage` |
| DELETE | `/academics/structure/classrooms/:id` | `academics.structure.manage` |
| PATCH | `/academics/structure/classrooms/:id/reorder` | `academics.structure.manage` |

### Rooms

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/rooms` | `academics.structure.view` |
| POST | `/academics/rooms` | `academics.structure.manage` |
| PATCH | `/academics/rooms/:id` | `academics.structure.manage` |
| DELETE | `/academics/rooms/:id` | `academics.structure.manage` |

### Subjects

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/subjects` | `academics.subjects.view` |
| POST | `/academics/subjects` | `academics.subjects.manage` |
| PATCH | `/academics/subjects/:id` | `academics.subjects.manage` |
| DELETE | `/academics/subjects/:id` | `academics.subjects.manage` |

### Subject allocations

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/subject-allocations` | `academics.subjects.view` |
| PUT | `/academics/subject-allocations/bulk` | `academics.subjects.manage` |

### Teacher allocations

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/allocations` | `academics.structure.view` |
| POST | `/academics/allocations` | `academics.structure.manage` |
| PUT | `/academics/allocations/bulk` | `academics.structure.manage` |
| POST | `/academics/allocations/apply-to-grade` | `academics.structure.manage` |
| POST | `/academics/allocations/clear-subject` | `academics.structure.manage` |
| GET | `/academics/allocations/validation` | `academics.structure.view` |
| GET | `/academics/allocations/teacher-loads` | `academics.structure.view` |
| DELETE | `/academics/allocations/:id` | `academics.structure.manage` |

### Timetable

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/timetable/all` | `academics.structure.view` |
| GET | `/academics/timetable/config` | `academics.structure.view` |
| PUT | `/academics/timetable/config` | `academics.structure.manage` |
| GET | `/academics/timetable/periods` | `academics.structure.view` |
| POST | `/academics/timetable/periods` | `academics.structure.manage` |
| PATCH | `/academics/timetable/periods/:periodId` | `academics.structure.manage` |
| DELETE | `/academics/timetable/periods/:periodId` | `academics.structure.manage` |
| GET | `/academics/timetable/entries` | `academics.structure.view` |
| PUT | `/academics/timetable/entries/bulk` | `academics.structure.manage` |
| GET | `/academics/timetable/entries/:entryId` | `academics.structure.view` |
| POST | `/academics/timetable/entries` | `academics.structure.manage` |
| PATCH | `/academics/timetable/entries/:entryId` | `academics.structure.manage` |
| DELETE | `/academics/timetable/entries/:entryId` | `academics.structure.manage` |
| GET | `/academics/timetable/preview` | `academics.structure.view` |
| GET | `/academics/timetable/conflicts` | `academics.structure.view` |
| GET | `/academics/timetable/publication` | `academics.structure.view` |
| POST | `/academics/timetable/publish` | `academics.structure.manage` |
| POST | `/academics/timetable/unpublish` | `academics.structure.manage` |
| GET | `/academics/timetable/validate` | `academics.structure.view` |
| POST | `/academics/timetable/conflicts/check` | `academics.structure.view` |

### Academic calendar

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/calendar/events` | `academics.calendar.view` |
| POST | `/academics/calendar/events` | `academics.calendar.manage` |
| GET | `/academics/calendar/events/:eventId` | `academics.calendar.view` |
| PATCH | `/academics/calendar/events/:eventId` | `academics.calendar.manage` |
| DELETE | `/academics/calendar/events/:eventId` | `academics.calendar.manage` |

### Curriculum

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/curriculum` | `academics.curriculum.view` |
| POST | `/academics/curriculum` | `academics.curriculum.manage` |
| GET | `/academics/curriculum/:curriculumId` | `academics.curriculum.view` |
| PATCH | `/academics/curriculum/:curriculumId` | `academics.curriculum.manage` |
| POST | `/academics/curriculum/:curriculumId/activate` | `academics.curriculum.manage` |
| POST | `/academics/curriculum/:curriculumId/archive` | `academics.curriculum.manage` |
| DELETE | `/academics/curriculum/:curriculumId` | `academics.curriculum.manage` |
| POST | `/academics/curriculum/:curriculumId/units` | `academics.curriculum.manage` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId` | `academics.curriculum.manage` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId/reorder` | `academics.curriculum.manage` |
| DELETE | `/academics/curriculum/:curriculumId/units/:unitId` | `academics.curriculum.manage` |
| POST | `/academics/curriculum/:curriculumId/units/:unitId/lessons` | `academics.curriculum.manage` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId` | `academics.curriculum.manage` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/reorder` | `academics.curriculum.manage` |
| DELETE | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId` | `academics.curriculum.manage` |
| GET | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content` | `academics.curriculum.view` |
| POST | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content` | `academics.curriculum.manage` |
| GET | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId` | `academics.curriculum.view` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId` | `academics.curriculum.manage` |
| PATCH | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId/reorder` | `academics.curriculum.manage` |
| DELETE | `/academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId` | `academics.curriculum.manage` |

### Lesson plans

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/academics/lesson-plans` | `academics.lesson_plans.view` |
| POST | `/academics/lesson-plans` | `academics.lesson_plans.manage` |
| GET | `/academics/lesson-plans/weeks` | `academics.lesson_plans.view` |
| GET | `/academics/lesson-plans/summary` | `academics.lesson_plans.view` |
| POST | `/academics/lesson-plans/auto-plan` | `academics.lesson_plans.manage` |
| PATCH | `/academics/lesson-plans/items/:itemId/move` | `academics.lesson_plans.manage` |
| GET | `/academics/lesson-plans/validation` | `academics.lesson_plans.view` |
| GET | `/academics/lesson-plans/:lessonPlanId` | `academics.lesson_plans.view` |
| PATCH | `/academics/lesson-plans/:lessonPlanId` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/activate` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/archive` | `academics.lesson_plans.manage` |
| DELETE | `/academics/lesson-plans/:lessonPlanId` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/items` | `academics.lesson_plans.manage` |
| PATCH | `/academics/lesson-plans/:lessonPlanId/items/:itemId` | `academics.lesson_plans.manage` |
| PATCH | `/academics/lesson-plans/:lessonPlanId/items/:itemId/reorder` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/items/:itemId/start` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/items/:itemId/complete` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/items/:itemId/skip` | `academics.lesson_plans.manage` |
| POST | `/academics/lesson-plans/:lessonPlanId/items/:itemId/cancel` | `academics.lesson_plans.manage` |
| DELETE | `/academics/lesson-plans/:lessonPlanId/items/:itemId` | `academics.lesson_plans.manage` |

## Teacher App Academics

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/teacher/schedule?date=YYYY-MM-DD` | Current teacher daily schedule. |
| GET | `/teacher/schedule/week?date=YYYY-MM-DD` | Current teacher weekly schedule. |
| GET | `/teacher/calendar/events` | Current teacher calendar events. |
| GET | `/teacher/calendar/events/:eventId` | Current teacher calendar event detail. |
| GET | `/teacher/lesson-preparation/today?date=YYYY-MM-DD` | Teacher-owned lesson preparation for date. |
| GET | `/teacher/lesson-preparation/week?date=YYYY-MM-DD` | Teacher-owned lesson preparation for week. |
| GET | `/teacher/lesson-preparation/:lessonPlanItemId` | Teacher-owned lesson detail. |
| PATCH | `/teacher/lesson-preparation/:lessonPlanItemId/status` | Teacher-owned status update. |

## Student App Academics

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/student/schedule?date=YYYY-MM-DD` | Current student daily schedule. |
| GET | `/student/schedule/week?date=YYYY-MM-DD` | Current student weekly schedule. |
| GET | `/student/subjects` | Current student visible subjects. |
| GET | `/student/subjects/:subjectId` | Current student visible subject detail. |
| GET | `/student/calendar/events` | Current student calendar events. |
| GET | `/student/calendar/events/:eventId` | Current student calendar event detail. |
| GET | `/student/lessons/today?date=YYYY-MM-DD` | Current student lessons for date. |
| GET | `/student/lessons/week?date=YYYY-MM-DD` | Current student lessons for week. |
| GET | `/student/lessons/:lessonPlanItemId` | Current student visible lesson detail. |

## Parent App Academics

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/parent/children/:studentId/schedule/today` | Owned child daily schedule. |
| GET | `/parent/children/:studentId/schedule/weekly` | Owned child weekly schedule. |
| GET | `/parent/children/:studentId/calendar/events` | Owned child calendar events. |
| GET | `/parent/children/:studentId/calendar/events/:eventId` | Owned child calendar event detail. |
| GET | `/parent/children/:studentId/lessons/today?date=YYYY-MM-DD` | Owned child lessons for date. |
| GET | `/parent/children/:studentId/lessons/week?date=YYYY-MM-DD` | Owned child lessons for week. |
| GET | `/parent/children/:studentId/lessons/:lessonPlanItemId` | Owned child visible lesson detail. |

## Routes intentionally absent

These are intentionally not implemented in V1:

```http
POST /api/v1/student/lessons
PATCH /api/v1/student/lessons/:lessonPlanItemId/status
POST /api/v1/parent/children/:studentId/lessons
PATCH /api/v1/parent/children/:studentId/lessons/:lessonPlanItemId/status
```
