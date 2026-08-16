# What Changed

## Before

Question-based assessments could be created through:

```http
POST /api/v1/grades/assessments/question-based
```

The question-based workflow already supported authoring, publish validation, submission, review, approval, and sync.

But the Dashboard Assessment list/detail/CRUD contract still had score-only assumptions:

- Detail rejected `QUESTION_BASED` assessments.
- List always filtered to `SCORE_ONLY`.
- Patch/delete/lock helpers blocked question-based assessments too early.
- Some score-only guards returned stale Sprint 4B deferral messaging.

## After

The dashboard contract is now mixed-delivery-mode aware:

- Default list includes both `SCORE_ONLY` and `QUESTION_BASED` assessments.
- Optional `deliveryMode` filter can narrow the list.
- Detail returns both delivery modes with the same safe assessment presenter shape.
- Patch/delete/lock work for both delivery modes when the status, lock, term, and dependency rules allow the operation.
- Direct grade-item entry is explicitly score-only and now returns a current error contract.
- General create route remains score-only and points clients to the question-based creation endpoint when needed.

## Important Business Meaning

Question-based assessments are not a separate hidden feature anymore. They are first-class assessment records in the dashboard assessment list/detail contract, while their question/answer/submission internals remain handled by the dedicated question/submission/review routes.
