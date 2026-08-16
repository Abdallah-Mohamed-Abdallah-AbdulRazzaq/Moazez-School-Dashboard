# App Impact Analysis

## Summary

The direct runtime changes are in the core/dashboard Grades Assessment module. No Parent App, Student App, or Teacher App route controller was changed by this commit.

However, app-facing test suites were rerun to confirm the broader grades and app contracts did not regress.

## Dashboard / School Control Panel

Impact: **Directly affected**

Dashboard or admin frontend screens that list or open assessments are affected positively:

- Assessment lists can now show both score-only and question-based assessments by default.
- Dashboard can filter by `deliveryMode`.
- Dashboard can open question-based assessment detail using the generic detail route.
- Dashboard can patch draft question-based assessment metadata where mutable.
- Dashboard can delete draft question-based assessment parents when no submissions/grade items exist.
- Dashboard can lock approved question-based assessments.

Required frontend adjustment:

- Do not assume `/grades/assessments` only returns score-only records.
- Use `deliveryMode` to decide which actions are enabled.
- Hide or disable direct item-entry controls for `QUESTION_BASED` assessments.
- Use `/grades/assessments/question-based` for question-based creation.

## Teacher App

Impact: **No direct route change; compatibility verified**

The commit did not add or change Teacher App controllers. Teacher App grade/classroom surfaces should not need endpoint rewrites from this delta alone.

Potential UI consideration:

- If a Teacher App screen consumes shared assessment cards or relies on generic assessment metadata, it should tolerate `deliveryMode=QUESTION_BASED`.
- If a teacher grading UI performs direct GradeItem entry, it must continue to treat question-based assessments as submission/review/sync based, not direct-entry based.

Verification included Teacher App tests.

## Student App

Impact: **No direct route change; compatibility verified**

Student App routes are not directly changed. Existing student grade/exam/detail contracts should continue to work.

Potential UI consideration:

- Student-facing views may see assessment metadata tied to question-based assessments through existing app-grade/exam paths, but this commit does not create new student routes.
- No answer keys or correct answers are exposed through the repaired dashboard detail path.

Verification included Student App tests.

## Parent App

Impact: **No direct route change; compatibility verified**

Parent App routes are not directly changed. Existing parent child-grade/assessment details should continue to work.

Potential UI consideration:

- Parent-facing assessment summaries should remain read-only and safe.
- This fix does not add parent mutation routes or answer visibility.

Verification included Parent App tests.

## API Consumers / Frontend Integrators

Impact: **Contract correction**

Any client that previously assumed default dashboard assessment lists were score-only must update that assumption.

Safe new assumption:

```text
GET /api/v1/grades/assessments returns assessment records across supported delivery modes unless deliveryMode is explicitly supplied.
```

Do not infer question content from assessment detail. Use dedicated question routes when needed.
