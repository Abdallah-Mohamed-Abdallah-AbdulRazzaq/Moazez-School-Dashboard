# Student App Homework and Grades

Student App exposes the student's own visible homework and grades.

It uses the current authenticated student context and active enrollment boundaries.

## Student Homework routes

Base path:

```text
/api/v1/student/homeworks
```

Implemented routes:

```http
GET    /api/v1/student/homeworks
GET    /api/v1/student/homeworks/:homeworkId
GET    /api/v1/student/homeworks/:homeworkId/submission
PUT    /api/v1/student/homeworks/:homeworkId/submission
POST   /api/v1/student/homeworks/:homeworkId/submission/draft
GET    /api/v1/student/homeworks/:homeworkId/submission/answers
PUT    /api/v1/student/homeworks/:homeworkId/submission/answers
PATCH  /api/v1/student/homeworks/:homeworkId/submission/answers/:questionId
GET    /api/v1/student/homeworks/:homeworkId/submission/attachments
POST   /api/v1/student/homeworks/:homeworkId/submission/attachments
PATCH  /api/v1/student/homeworks/:homeworkId/submission/attachments/:attachmentId
PATCH  /api/v1/student/homeworks/:homeworkId/submission/attachments/:attachmentId/reorder
DELETE /api/v1/student/homeworks/:homeworkId/submission/attachments/:attachmentId
POST   /api/v1/student/homeworks/:homeworkId/submit
POST   /api/v1/student/homeworks/:homeworkId/submission/submit
```

## Student Homework logic

Student can:

- List assigned visible homework.
- Read assigned homework detail.
- Create/update their own draft submission.
- Save single answer or bulk answers.
- Manage their own submission attachments.
- Submit homework through either accepted submit route.

Student cannot:

- See unassigned homework.
- Submit hidden, unsafe, or invalid lifecycle assignments.
- Mutate another student's submission.
- Review answers.
- Sync grades.
- Access dashboard homework routes.

## Student Grades routes

Base path:

```text
/api/v1/student/grades
```

Implemented routes:

```http
GET /api/v1/student/grades
GET /api/v1/student/grades/summary
GET /api/v1/student/grades/assessments/:assessmentId
```

## Student Grades logic

Student can read:

- Own grade list.
- Own enriched grade summary.
- Own assessment grade detail.

Sprint 23C enriched the existing summary route with safe app-facing fields such as:

- totals and counts.
- selected academic year and term context.
- subject breakdown.
- rating / summary interpretation.
- empty-state data.

Student grade reads hide:

- draft/unpublished assessments.
- other-student grades.
- other-classroom assessments.
- cross-school assessments.
- answer keys and correct answers.
- `isCorrect` and review-only fields.
- storage internals and tenant/internal IDs.
