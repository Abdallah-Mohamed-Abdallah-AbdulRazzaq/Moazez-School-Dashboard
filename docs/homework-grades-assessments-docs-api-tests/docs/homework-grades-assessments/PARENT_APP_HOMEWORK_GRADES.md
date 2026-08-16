# Parent App Homework and Grades

Parent App exposes read-only Homework and Grades views for linked children.

It uses the authenticated parent context, guardian links, linked child records, and active enrollment boundaries.

## Parent Homework routes

Base path:

```text
/api/v1/parent/children/:studentId/homeworks
```

Implemented routes:

```http
GET /api/v1/parent/children/:studentId/homeworks
GET /api/v1/parent/children/:studentId/homeworks/:homeworkId
```

## Parent Homework logic

Parent can:

- List visible homework for a linked child.
- Read visible homework detail for a linked child.

Parent cannot:

- Submit homework.
- Create or update submissions.
- Save answers.
- Upload/update/delete submission attachments.
- Review homework.
- Sync grades.
- Read unlinked-child or cross-school homework.

The absence of parent mutation routes is intentional V1 behavior.

## Parent Grades routes

Base path:

```text
/api/v1/parent/children/:studentId/grades
```

Implemented routes:

```http
GET /api/v1/parent/children/:studentId/grades
GET /api/v1/parent/children/:studentId/grades/summary
GET /api/v1/parent/children/:studentId/grades/assessments/:assessmentId
```

## Parent Grades logic

Parent can read:

- Linked-child grade list.
- Linked-child enriched grade summary.
- Linked-child assessment grade detail.

Sprint 23C enriched the summary route with safe parent-facing data such as:

- totals and counts.
- selected academic year and term context.
- subject breakdown.
- rating.
- motivational message behavior.

Parent grade reads hide:

- draft/unpublished assessments.
- unlinked-child grades.
- cross-school grades.
- answer keys and correct answers.
- `isCorrect` and review-only fields.
- storage internals and tenant/internal IDs.

Parent App is read-only for Homework and Grades in accepted V1.
