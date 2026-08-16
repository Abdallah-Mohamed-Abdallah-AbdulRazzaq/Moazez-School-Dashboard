# Overview

Homework / Grades / Assessments is a combined learning-flow feature family covering assignment authoring, homework submission, assessment creation, grade entry, question-based submissions, review, gradebooks, analytics, and app-facing summaries.

The accepted backend-native design separates four surfaces:

1. **School Dashboard Grades / Assessments** under `/api/v1/grades/...`.
2. **School Dashboard Homework Core** under `/api/v1/homework/...`.
3. **Teacher App Homework / Classroom Grades** under `/api/v1/teacher/...`.
4. **Student and Parent App Homework / Grades** under `/api/v1/student/...` and `/api/v1/parent/...`.

## Final V1 state

Sprint 23H classifies the feature family as `CLOSED_FOR_V1`.

Implemented capabilities include:

- Dashboard Grades assessment CRUD.
- Score-only assessment grade item entry.
- Question-based assessment creation, questions/options, submissions, answers, review, finalization, and sync.
- Gradebook, analytics, rules, effective rules, student snapshots.
- Grades dashboard bootstrap and overview read models.
- Dashboard Homework assignment CRUD/lifecycle.
- Homework targets, questions/options, assignment attachments.
- Student homework draft/answer/attachment/submit workflows.
- Teacher/dashboard homework review workflows.
- Homework-to-Grades link, assignment sync, and single-submission sync.
- Teacher App homework creation/review/sync for owned allocations.
- Teacher App classroom grades read models and question-based review/sync surfaces.
- Student App homework and grades read/mutation surfaces appropriate to students.
- Parent App homework and grades read-only surfaces for linked children.

## Accepted product decisions

- Direct score-only `GradeItem` writes are Dashboard-only for V1.
- Teacher App grade write behavior is homework/review/sync based, not direct score-only entry.
- Teacher App full assessment authoring is not part of accepted V1.
- Parent App homework is read-only.
- Parent homework submit is not implemented.
- Notifications, XP, rewards, exports, and advanced analytics builder are future optional scope.
- Backend-native route names are accepted; no ADR-only aliases are required.

## Main route roots

```text
/api/v1/grades
/api/v1/homework
/api/v1/teacher/homeworks
/api/v1/teacher/classroom/:classId/grades
/api/v1/teacher/classroom/:classId/assignments
/api/v1/student/homeworks
/api/v1/student/grades
/api/v1/parent/children/:studentId/homeworks
/api/v1/parent/children/:studentId/grades
```

## Security posture

Security closeout verifies:

- Authentication and dashboard permission boundaries.
- School tenancy isolation.
- Teacher owned-allocation boundaries.
- Student current-user boundaries.
- Parent linked-child boundaries.
- Locked-assessment protections.
- Closed/inactive term protections.
- Draft/unpublished visibility boundaries.
- No answer-key/correct-answer leaks to student/parent surfaces.
- No storage internals, tenant IDs, soft-delete metadata, password/session fields, or raw Prisma internals in app-facing responses.
