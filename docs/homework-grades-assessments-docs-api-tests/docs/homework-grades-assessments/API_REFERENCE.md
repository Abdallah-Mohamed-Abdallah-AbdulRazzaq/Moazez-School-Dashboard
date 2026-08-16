# API Reference

All paths are under the global prefix `/api/v1`.

Use `Authorization: Bearer <accessToken>` unless a test explicitly verifies unauthenticated behavior.

## School Dashboard Grades / Assessments

### Dashboard bootstrap / overview

```http
GET /grades/bootstrap
GET /grades/overview
```

### Assessments

```http
GET    /grades/assessments
GET    /grades/assessments/:assessmentId
POST   /grades/assessments
POST   /grades/assessments/question-based
PATCH  /grades/assessments/:assessmentId
DELETE /grades/assessments/:assessmentId
POST   /grades/assessments/:assessmentId/publish
POST   /grades/assessments/:assessmentId/approve
POST   /grades/assessments/:assessmentId/lock
```

### Grade items

```http
GET /grades/assessments/:assessmentId/items
PUT /grades/assessments/:assessmentId/items/:studentId
PUT /grades/assessments/:assessmentId/items
```

### Assessment questions

```http
GET    /grades/assessments/:assessmentId/questions
POST   /grades/assessments/:assessmentId/questions
POST   /grades/assessments/:assessmentId/questions/reorder
POST   /grades/assessments/:assessmentId/questions/points/bulk
PATCH  /grades/questions/:questionId
DELETE /grades/questions/:questionId
```

### Question-based submissions

```http
GET  /grades/assessments/:assessmentId/submissions
POST /grades/assessments/:assessmentId/submissions/resolve
GET  /grades/submissions/:submissionId
PUT  /grades/submissions/:submissionId/answers/:questionId
PUT  /grades/submissions/:submissionId/answers
POST /grades/submissions/:submissionId/submit
```

### Submission review and sync

```http
PATCH /grades/submissions/:submissionId/answers/:answerId/review
PUT   /grades/submissions/:submissionId/answers/review
POST  /grades/submissions/:submissionId/review/finalize
POST  /grades/submissions/:submissionId/sync-grade-item
```

### Gradebook / analytics / rules

```http
GET /grades/gradebook
GET /grades/students/:studentId/snapshot
GET /grades/analytics/summary
GET /grades/analytics/distribution
GET /grades/rules
GET /grades/rules/effective
POST /grades/rules
PATCH /grades/rules/:ruleId
```

## School Dashboard Homework Core

### Assignments and targets

```http
GET   /homework/assignments
POST  /homework/assignments
GET   /homework/assignments/:homeworkId
PATCH /homework/assignments/:homeworkId
POST  /homework/assignments/:homeworkId/publish
POST  /homework/assignments/:homeworkId/close
POST  /homework/assignments/:homeworkId/cancel
GET   /homework/assignments/:homeworkId/targets
POST  /homework/assignments/:homeworkId/targets/resolve
```

### Questions and options

```http
GET    /homework/assignments/:homeworkId/questions
POST   /homework/assignments/:homeworkId/questions
GET    /homework/assignments/:homeworkId/questions/:questionId
PATCH  /homework/assignments/:homeworkId/questions/:questionId
PATCH  /homework/assignments/:homeworkId/questions/:questionId/reorder
DELETE /homework/assignments/:homeworkId/questions/:questionId
POST   /homework/assignments/:homeworkId/questions/:questionId/options
PATCH  /homework/assignments/:homeworkId/questions/:questionId/options/:optionId
PATCH  /homework/assignments/:homeworkId/questions/:questionId/options/:optionId/reorder
DELETE /homework/assignments/:homeworkId/questions/:questionId/options/:optionId
```

### Assignment attachments

```http
GET    /homework/assignments/:homeworkId/attachments
POST   /homework/assignments/:homeworkId/attachments
PATCH  /homework/assignments/:homeworkId/attachments/:attachmentId
PATCH  /homework/assignments/:homeworkId/attachments/:attachmentId/reorder
DELETE /homework/assignments/:homeworkId/attachments/:attachmentId
```

### Submission content and review

```http
GET   /homework/assignments/:homeworkId/submissions/:submissionId/answers
GET   /homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId
PATCH /homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
PUT   /homework/assignments/:homeworkId/submissions/:submissionId/answers/review
GET   /homework/assignments/:homeworkId/submissions/:submissionId/attachments
```

### Homework-to-Grades sync

```http
GET  /homework/assignments/:homeworkId/grade-sync
POST /homework/assignments/:homeworkId/grade-sync/link
POST /homework/assignments/:homeworkId/grade-sync
POST /homework/assignments/:homeworkId/submissions/:submissionId/grade-sync
```

## Teacher App Homework

```http
GET  /teacher/homeworks/dashboard
GET  /teacher/homeworks/classes/:classId/assignments
POST /teacher/homeworks/classes/:classId/assignments
GET  /teacher/homeworks/classes/:classId/assignments/:homeworkId
PATCH /teacher/homeworks/classes/:classId/assignments/:homeworkId
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/publish
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/close
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/cancel
GET  /teacher/homeworks/classes/:classId/assignments/:homeworkId/targets
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/targets/resolve
GET  /teacher/homeworks/classes/:classId/assignments/:homeworkId/grade-sync
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/grade-sync
POST /teacher/homeworks/classes/:classId/assignments/:homeworkId/submissions/:submissionId/grade-sync
```

Teacher App also exposes owned homework question/option/attachment/submission-review route families mirroring Homework Core under the `teacher/homeworks/classes/:classId/...` prefix.

## Teacher Classroom Grades

```http
GET /teacher/classroom/:classId/grades/assessments
GET /teacher/classroom/:classId/grades/assessments/:assessmentId
GET /teacher/classroom/:classId/grades/gradebook
GET /teacher/classroom/:classId/assignments
GET /teacher/classroom/:classId/assignments/:assignmentId
GET /teacher/classroom/:classId/assignments/:assignmentId/submissions
GET /teacher/classroom/:classId/assignments/:assignmentId/submissions/:submissionId
```

## Student App

### Homework

```http
GET    /student/homeworks
GET    /student/homeworks/:homeworkId
GET    /student/homeworks/:homeworkId/submission
PUT    /student/homeworks/:homeworkId/submission
POST   /student/homeworks/:homeworkId/submission/draft
GET    /student/homeworks/:homeworkId/submission/answers
PUT    /student/homeworks/:homeworkId/submission/answers
PATCH  /student/homeworks/:homeworkId/submission/answers/:questionId
GET    /student/homeworks/:homeworkId/submission/attachments
POST   /student/homeworks/:homeworkId/submission/attachments
PATCH  /student/homeworks/:homeworkId/submission/attachments/:attachmentId
PATCH  /student/homeworks/:homeworkId/submission/attachments/:attachmentId/reorder
DELETE /student/homeworks/:homeworkId/submission/attachments/:attachmentId
POST   /student/homeworks/:homeworkId/submit
POST   /student/homeworks/:homeworkId/submission/submit
```

### Grades

```http
GET /student/grades
GET /student/grades/summary
GET /student/grades/assessments/:assessmentId
```

## Parent App

### Homework

```http
GET /parent/children/:studentId/homeworks
GET /parent/children/:studentId/homeworks/:homeworkId
```

### Grades

```http
GET /parent/children/:studentId/grades
GET /parent/children/:studentId/grades/summary
GET /parent/children/:studentId/grades/assessments/:assessmentId
```
