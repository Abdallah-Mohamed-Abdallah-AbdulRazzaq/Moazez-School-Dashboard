# Testing And Verification

## Focused Test Coverage Added Or Updated

### `grade-assessments.use-case.spec.ts`

Covers:

- Score-only create with omitted delivery mode.
- Score-only create with explicit delivery mode.
- General create rejects question-based delivery mode with current message/details.
- Default list includes both score-only and question-based assessments.
- List filters normalize `score_only` and `question_based`.
- Detail returns score-only and question-based presenter shapes.
- Missing detail returns not found.
- Draft question-based patch succeeds and preserves delivery mode.
- Published/approved/locked question-based patch fails.
- Approved question-based lock succeeds.
- Draft/published/already locked question-based lock fails.
- Draft question-based delete succeeds under the chosen child-content policy.
- Question-based delete with submissions fails.
- Published/approved/locked question-based delete fails.

### `grade-assessment-items.use-case.spec.ts`

Covers:

- Single direct GradeItem write rejects question-based assessments.
- Bulk direct GradeItem write rejects question-based assessments.
- Rejection includes current message and actionable details.

### `grade-workflow.spec.ts`

Covers:

- Shared score-only assertion fallback message no longer contains stale Sprint 4B deferral wording.

### `grades-question-based.e2e-spec.ts`

Covers:

- Dashboard detail route works for question-based assessments.
- Default dashboard list includes question-based assessments.
- `deliveryMode=question_based` includes them.
- `deliveryMode=score_only` excludes them.
- Detail response does not include question/answer-key fields.

## Verification Results Reported In Closeout

Reported passing commands:

```text
npx prisma validate
npx prisma generate
npm run build
npm run test -- grade-assessments --runInBand
npm run test -- grade-assessment-items --runInBand
npm run test -- grades --runInBand
npm run test -- student-app --runInBand
npm run test -- parent-app --runInBand
npm run test -- teacher-app --runInBand
npm run test:e2e -- --runInBand --runTestsByPath test/e2e/grades-question-based.e2e-spec.ts
npm run test:security -- --runInBand --runTestsByPath test/security/tenancy.grades.spec.ts test/security/tenancy.student-app.spec.ts test/security/tenancy.parent-app.spec.ts test/security/tenancy.teacher-app.spec.ts
npm run test:security -- --runInBand
```

## Notes

This package creation did not rerun the repository test suite. It documents the closeout-reported verification and the source changes observed in the commit.
