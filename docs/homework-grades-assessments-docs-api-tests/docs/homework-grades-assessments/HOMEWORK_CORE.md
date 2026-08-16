# School Dashboard Homework Core

School Dashboard Homework Core is the administrative homework surface under `/api/v1/homework/...`.

It supports assignment authoring, targeting, questions/options, attachments, submission reads, answer review, submission attachments, and Homework-to-Grades sync.

## Assignment lifecycle

Implemented routes:

```http
GET   /api/v1/homework/assignments
POST  /api/v1/homework/assignments
GET   /api/v1/homework/assignments/:homeworkId
PATCH /api/v1/homework/assignments/:homeworkId
POST  /api/v1/homework/assignments/:homeworkId/publish
POST  /api/v1/homework/assignments/:homeworkId/close
POST  /api/v1/homework/assignments/:homeworkId/cancel
```

Lifecycle:

- Assignments are created as drafts.
- Draft assignments can be edited.
- Publishing makes assignments visible according to target and app-facing visibility rules.
- Published assignments can be closed.
- Draft or published assignments can be canceled.
- Unsafe or non-draft edits are blocked by lifecycle rules.

## Targets

Implemented routes:

```http
GET  /api/v1/homework/assignments/:homeworkId/targets
POST /api/v1/homework/assignments/:homeworkId/targets/resolve
```

Targets determine the students/classes that can see and submit the homework.

Target resolution is dashboard-managed and tenant-scoped.

## Questions and options

Implemented routes:

```http
GET    /api/v1/homework/assignments/:homeworkId/questions
POST   /api/v1/homework/assignments/:homeworkId/questions
GET    /api/v1/homework/assignments/:homeworkId/questions/:questionId
PATCH  /api/v1/homework/assignments/:homeworkId/questions/:questionId
PATCH  /api/v1/homework/assignments/:homeworkId/questions/:questionId/reorder
DELETE /api/v1/homework/assignments/:homeworkId/questions/:questionId

POST   /api/v1/homework/assignments/:homeworkId/questions/:questionId/options
PATCH  /api/v1/homework/assignments/:homeworkId/questions/:questionId/options/:optionId
PATCH  /api/v1/homework/assignments/:homeworkId/questions/:questionId/options/:optionId/reorder
DELETE /api/v1/homework/assignments/:homeworkId/questions/:questionId/options/:optionId
```

Question and option deletion is soft-delete oriented.

Dashboard and teacher review surfaces can see review-safe information. Student and parent surfaces hide answer keys, correct answers, and correctness flags as required.

## Assignment attachments

Implemented routes:

```http
GET    /api/v1/homework/assignments/:homeworkId/attachments
POST   /api/v1/homework/assignments/:homeworkId/attachments
PATCH  /api/v1/homework/assignments/:homeworkId/attachments/:attachmentId
PATCH  /api/v1/homework/assignments/:homeworkId/attachments/:attachmentId/reorder
DELETE /api/v1/homework/assignments/:homeworkId/attachments/:attachmentId
```

Attachments link existing uploaded files to homework assignments. Responses expose safe file metadata, not storage internals.

## Submission answer and attachment reads/review

Implemented routes:

```http
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId
PATCH /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/:answerId/review
PUT   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/answers/review
GET   /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/attachments
```

These are dashboard review/read surfaces. Review requires assignment management authority.

## Homework-to-Grades sync

Implemented routes:

```http
GET  /api/v1/homework/assignments/:homeworkId/grade-sync
POST /api/v1/homework/assignments/:homeworkId/grade-sync/link
POST /api/v1/homework/assignments/:homeworkId/grade-sync
POST /api/v1/homework/assignments/:homeworkId/submissions/:submissionId/grade-sync
```

Purpose:

- Inspect sync status.
- Link a homework assignment to a grade assessment.
- Sync all reviewed homework submissions to Grades.
- Sync one reviewed homework submission to Grades.

Protection rules include:

- GradeAssessment compatibility.
- Locked assessment protection.
- Closed/inactive term protection.
- Active enrollment checks.
- Score bounds.
- School tenancy.
