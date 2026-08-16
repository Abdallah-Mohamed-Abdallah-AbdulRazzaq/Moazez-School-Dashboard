# Workflows and Lifecycles

## Grades assessment lifecycle

Implemented dashboard lifecycle:

```text
Create draft assessment
  -> publish
  -> approve
  -> lock
```

Additional behavior:

- Draft assessments can be edited and deleted according to rules.
- Published assessments can be used by grade entry or question-based submission workflows.
- Approved/locked assessments are readable in gradebook/analytics/overview contexts.
- Locked assessments block protected mutations.

## Score-only assessment workflow

```text
Create assessment
  -> publish/approve/lock as applicable
  -> dashboard enters GradeItems
  -> gradebook/analytics/student/parent reads expose safe grade data
```

Direct score-only GradeItem entry is dashboard-only in V1:

```http
PUT /api/v1/grades/assessments/:assessmentId/items/:studentId
PUT /api/v1/grades/assessments/:assessmentId/items
```

Teacher App direct score-only GradeItem writes are intentionally not implemented.

## Question-based assessment workflow

```text
Create question-based assessment
  -> create questions/options
  -> publish
  -> resolve student submission
  -> save answers
  -> submit
  -> review answers
  -> finalize review
  -> sync to GradeItem
```

Implemented route families:

- `/grades/assessments/:assessmentId/questions`
- `/grades/assessments/:assessmentId/submissions`
- `/grades/submissions/:submissionId/answers`
- `/grades/submissions/:submissionId/review/finalize`
- `/grades/submissions/:submissionId/sync-grade-item`

## Homework assignment lifecycle

```text
DRAFT
  -> PUBLISHED
  -> CLOSED

DRAFT/PUBLISHED
  -> CANCELLED
```

Dashboard and Teacher App owned-allocation flows support assignment creation, update, publish, close, cancel, target resolution, questions, options, attachments, submission review, and sync.

## Student homework submission lifecycle

```text
Student sees assigned visible homework
  -> save submission draft
  -> save answers and attachments
  -> submit homework
  -> teacher/dashboard reviews
  -> optional sync to Grades if linked/configured
```

Students can mutate only their own submission data and only according to homework lifecycle rules.

## Homework answer review workflow

```text
Student submits answers
  -> dashboard or owning teacher reads submission
  -> reviewer reviews single or bulk answers
  -> submission can be reviewed/finalized according to implemented review surface
```

Review surfaces exist in both dashboard Homework Core and Teacher App owned homework routes.

## Homework-to-Grades sync workflow

```text
Homework assignment exists
  -> link to compatible GradeAssessment
  -> students submit homework
  -> answers/submission reviewed
  -> sync reviewed submissions to GradeItems
```

Available sync operations:

- Get sync status.
- Link homework to grade assessment.
- Sync all reviewed submissions.
- Sync one reviewed submission.

Protections:

- Locked assessments block sync.
- Closed/inactive terms block sync.
- Score bounds are enforced.
- Active enrollment and school tenancy are enforced.
- Cross-school homework/assessment links are denied.

## Student grades workflow

```text
Assessment and GradeItems exist
  -> student reads own grade list
  -> student reads own summary
  -> student reads own assessment grade detail
```

Student reads hide draft/unpublished assessments, other students' grades, cross-school records, answer keys, correct answers, and internal fields.

## Parent grades workflow

```text
Parent has linked child
  -> parent reads child grade list
  -> parent reads child summary
  -> parent reads child assessment grade detail
```

Parent reads are linked-child scoped and read-only.
