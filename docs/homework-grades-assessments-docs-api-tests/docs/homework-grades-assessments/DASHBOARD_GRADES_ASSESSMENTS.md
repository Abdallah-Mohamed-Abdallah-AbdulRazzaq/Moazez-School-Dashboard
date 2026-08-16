# School Dashboard Grades / Assessments

School Dashboard Grades / Assessments is the administrative surface for assessment authoring, grade item entry, question-based assessment workflows, gradebook reads, analytics, grading rules, bootstrap filters, and overview metrics.

Routes are under `/api/v1/grades` and require dashboard permissions.

## Bootstrap and overview

Sprint 23B added non-breaking dashboard read models:

```http
GET /api/v1/grades/bootstrap
GET /api/v1/grades/overview
```

`GET /grades/bootstrap` requires `grades.gradebook.view`.

It provides current-school filter data such as academic years, terms, stages, grades, sections, classrooms, subjects, and relevant assessment context.

`GET /grades/overview` requires `grades.analytics.view`.

It provides safe aggregate dashboard metrics for assessments, students, subjects, grade items, visible published/approved/locked data, and review state.

Both responses are current-school scoped and exclude internal tenant/storage fields.

## Assessment CRUD and lifecycle

Implemented routes:

```http
GET    /api/v1/grades/assessments
GET    /api/v1/grades/assessments/:assessmentId
POST   /api/v1/grades/assessments
POST   /api/v1/grades/assessments/question-based
PATCH  /api/v1/grades/assessments/:assessmentId
DELETE /api/v1/grades/assessments/:assessmentId
POST   /api/v1/grades/assessments/:assessmentId/publish
POST   /api/v1/grades/assessments/:assessmentId/approve
POST   /api/v1/grades/assessments/:assessmentId/lock
```

Lifecycle purpose:

- Draft assessments can be created and edited.
- Published assessments become available for grade entry / submissions according to workflow.
- Approved assessments represent reviewed/finalized assessment state.
- Locked assessments remain readable but block protected mutations.
- Deletion is soft-delete oriented.

## Score-only grade item entry

Implemented dashboard-only direct grade entry routes:

```http
GET /api/v1/grades/assessments/:assessmentId/items
PUT /api/v1/grades/assessments/:assessmentId/items/:studentId
PUT /api/v1/grades/assessments/:assessmentId/items
```

These routes remain the V1 direct score-only GradeItem entry surface.

Teacher App direct score-only GradeItem write routes are intentionally absent.

## Question-based assessment workflows

Question routes:

```http
GET    /api/v1/grades/assessments/:assessmentId/questions
POST   /api/v1/grades/assessments/:assessmentId/questions
POST   /api/v1/grades/assessments/:assessmentId/questions/reorder
POST   /api/v1/grades/assessments/:assessmentId/questions/points/bulk
PATCH  /api/v1/grades/questions/:questionId
DELETE /api/v1/grades/questions/:questionId
```

Question-based submissions:

```http
GET  /api/v1/grades/assessments/:assessmentId/submissions
POST /api/v1/grades/assessments/:assessmentId/submissions/resolve
GET  /api/v1/grades/submissions/:submissionId
PUT  /api/v1/grades/submissions/:submissionId/answers/:questionId
PUT  /api/v1/grades/submissions/:submissionId/answers
POST /api/v1/grades/submissions/:submissionId/submit
```

Review and sync:

```http
PATCH /api/v1/grades/submissions/:submissionId/answers/:answerId/review
PUT   /api/v1/grades/submissions/:submissionId/answers/review
POST  /api/v1/grades/submissions/:submissionId/review/finalize
POST  /api/v1/grades/submissions/:submissionId/sync-grade-item
```

This workflow supports:

- Submission resolution.
- Saving single or bulk answers.
- Student/actor submission.
- Answer review.
- Bulk answer review.
- Review finalization.
- Syncing reviewed results to GradeItem.

## Gradebook and student snapshots

Implemented routes:

```http
GET /api/v1/grades/gradebook
GET /api/v1/grades/students/:studentId/snapshot
```

These are read models for dashboard users. They are tenant-scoped and permission-protected.

## Analytics and distribution

Implemented routes:

```http
GET /api/v1/grades/analytics/summary
GET /api/v1/grades/analytics/distribution
```

These provide dashboard aggregate analytics and distribution data.

## Rules and effective rules

Implemented routes:

```http
GET   /api/v1/grades/rules
GET   /api/v1/grades/rules/effective
POST  /api/v1/grades/rules
PATCH /api/v1/grades/rules/:ruleId
```

Rules support dashboard grading configuration and effective rule resolution.

## Protection summary

Dashboard Grades / Assessments enforces:

- Permissions per route family.
- Current-school tenancy via school-scoped Prisma models.
- Closed/inactive term protections on protected writes.
- Locked assessment protections on GradeItem writes, question mutation, submission review/finalization, and sync.
- Score bounds and score-only vs question-based assessment invariants.
- No answer-key/correct-answer leaks in safe aggregate read models.
