# API Reference Delta

## List Assessments

```http
GET /api/v1/grades/assessments
Authorization: Bearer <school-user-token>
```

Permission:

```text
grades.assessments.view
```

Delta:

- No longer score-only by default.
- Optional `deliveryMode` filter added.

Query examples:

```http
GET /api/v1/grades/assessments?termId={{termId}}&subjectId={{subjectId}}
GET /api/v1/grades/assessments?deliveryMode=score_only
GET /api/v1/grades/assessments?deliveryMode=question_based
```

## Get Assessment Detail

```http
GET /api/v1/grades/assessments/{{assessmentId}}
Authorization: Bearer <school-user-token>
```

Permission:

```text
grades.assessments.view
```

Delta:

- Accepts `SCORE_ONLY` and `QUESTION_BASED` records.
- Returns safe assessment metadata only.

## Patch Assessment

```http
PATCH /api/v1/grades/assessments/{{assessmentId}}
Authorization: Bearer <school-user-token>
Content-Type: application/json
```

Permission:

```text
grades.assessments.manage
```

Allowed for:

- Draft
- Unlocked
- Writable term
- Score-only or question-based

Not allowed for:

- Published
- Approved
- Locked
- Closed/inactive term
- Delivery mode conversion

## Delete Assessment

```http
DELETE /api/v1/grades/assessments/{{assessmentId}}
Authorization: Bearer <school-user-token>
```

Permission:

```text
grades.assessments.manage
```

Delta:

- Can delete draft question-based parent when no submissions or grade items exist.
- Still blocks submissions with `reason: submissions_exist`.

## Lock Assessment

```http
POST /api/v1/grades/assessments/{{assessmentId}}/lock
Authorization: Bearer <school-user-token>
```

Permission:

```text
grades.assessments.lock
```

Delta:

- Approved question-based assessments can now be locked.

## Direct Grade Item Entry

```http
PUT /api/v1/grades/assessments/{{assessmentId}}/items/{{studentId}}
PUT /api/v1/grades/assessments/{{assessmentId}}/items
```

Permission:

```text
grades.items.manage
```

Delta:

- Explicitly rejects question-based assessments with a current contract message.
- Remains the score-only item entry surface.

## General Create

```http
POST /api/v1/grades/assessments
```

Permission:

```text
grades.assessments.manage
```

Delta:

- Explicitly rejects `deliveryMode=QUESTION_BASED` and directs callers to:

```http
POST /api/v1/grades/assessments/question-based
```
