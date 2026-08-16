# Teacher App Homework and Classroom Grades

Teacher App exposes owned-allocation workflows for homework creation/review/sync and classroom grade read models.

It is not a dashboard permission surface. It relies on Teacher App access and teacher-owned allocations.

## Teacher Homework routes

Base path:

```text
/api/v1/teacher/homeworks
```

Implemented assignment routes:

```http
GET  /api/v1/teacher/homeworks/dashboard
GET  /api/v1/teacher/homeworks/classes/:classId/assignments
POST /api/v1/teacher/homeworks/classes/:classId/assignments
GET  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId
PATCH /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/publish
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/close
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/cancel
GET  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/targets
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/targets/resolve
```

Implemented grade sync routes:

```http
GET  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/grade-sync
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/grade-sync
POST /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/grade-sync
```

Implemented question and option routes:

```http
GET    /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions
POST   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions
GET    /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId/reorder
DELETE /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId

POST   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId/options
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId/options/:optionId
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId/options/:optionId/reorder
DELETE /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/questions/:questionId/options/:optionId
```

Implemented attachment routes:

```http
GET    /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/attachments
POST   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/attachments
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/attachments/:attachmentId
PATCH  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/attachments/:attachmentId/reorder
DELETE /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/attachments/:attachmentId
```

Implemented submission review routes:

```http
GET   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions
GET   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId
GET   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/answers
PATCH /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
PUT   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/answers/review
GET   /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/attachments
POST  /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/review
PATCH /api/v1/teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/review
```

## Teacher Classroom Grades routes

Base paths:

```text
/api/v1/teacher/classroom/:classId/grades
/api/v1/teacher/classroom/:classId/assignments
```

Implemented grades read model routes:

```http
GET /api/v1/teacher/classroom/:classId/grades/assessments
GET /api/v1/teacher/classroom/:classId/grades/assessments/:assessmentId
GET /api/v1/teacher/classroom/:classId/grades/gradebook
```

Implemented assignment/submission read model routes:

```http
GET /api/v1/teacher/classroom/:classId/assignments
GET /api/v1/teacher/classroom/:classId/assignments/:assignmentId
GET /api/v1/teacher/classroom/:classId/assignments/:assignmentId/submissions
GET /api/v1/teacher/classroom/:classId/assignments/:assignmentId/submissions/:submissionId
```

## Teacher App grade write decision

Accepted V1 decision:

- Teacher App does not expose direct score-only GradeItem writes.
- The following routes intentionally remain absent:

```http
PUT /api/v1/teacher/classroom/:classId/grades/assessments/:assessmentId/items/:studentId
PUT /api/v1/teacher/classroom/:classId/grades/assessments/:assessmentId/items
```

Teacher-side grade-affecting behavior remains through:

- Homework review.
- Homework-to-Grades sync.
- Question-based assessment review/sync where implemented.

## Ownership boundary

Teacher App routes are constrained to teacher-owned classroom/subject/term allocations.

Same-school unowned class access and cross-school access are denied safely.

Teacher App responses avoid tenant IDs, answer keys, correct answers, storage internals, and soft-delete fields.
