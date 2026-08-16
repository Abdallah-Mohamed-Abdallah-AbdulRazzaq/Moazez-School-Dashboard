# Question-Based Assessment Contract Repair

## What Is Now First-Class

`QUESTION_BASED` assessments are now visible and manageable through the shared assessment record contract where it makes sense:

- List
- Detail
- Patch metadata while draft/unlocked/writable
- Delete draft parent when dependency checks pass
- Lock approved assessments

## What Remains Dedicated To Question-Based Routes

The following remain question-workflow concerns and are not moved into the generic detail/list endpoints:

- Questions
- Options
- Answer keys
- Correct answers
- Student submissions
- Review internals
- Submission answer content
- Question scoring internals

## Creation Contract

### Score-Only Creation Route

```http
POST /api/v1/grades/assessments
```

Still creates score-only assessments only.

Allowed:

- Omitting `deliveryMode`
- Providing `SCORE_ONLY` / `score_only`

Rejected:

- Providing `QUESTION_BASED` / `question_based`

Expected error message:

```text
Use the question-based assessment creation endpoint for question-based assessments
```

Expected error details include:

```json
{
  "field": "deliveryMode",
  "deliveryMode": "QUESTION_BASED",
  "expectedEndpoint": "/api/v1/grades/assessments/question-based"
}
```

### Question-Based Creation Route

```http
POST /api/v1/grades/assessments/question-based
```

Remains the only valid creation endpoint for question-based assessments.

## Direct Grade Item Entry Contract

Direct grade item entry remains score-only only:

```http
PUT /api/v1/grades/assessments/:assessmentId/items/:studentId
PUT /api/v1/grades/assessments/:assessmentId/items
```

For question-based assessments, direct item writes reject with:

```text
Direct grade item entry is only supported for score-only assessments
```

Expected details:

```json
{
  "deliveryMode": "QUESTION_BASED",
  "reason": "question_based_uses_submissions_review_sync"
}
```

## Why This Boundary Matters

Question-based grades should be produced through the submissions/review/sync workflow, not by direct dashboard item entry. This keeps grading state consistent with submitted answers and teacher/admin review state.
