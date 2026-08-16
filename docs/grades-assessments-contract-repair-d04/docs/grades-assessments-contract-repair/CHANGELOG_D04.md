# Changelog - d04b871c

## Commit

```text
d04b871c10eb7c108ecb63e3a764141d9b41e500
fix: support question-based grade assessment contracts
```

## Sprint Closeout Name

```text
Sprint 23I - Grades Assessment Mixed Delivery Mode Contract Repair Closeout
```

## High-Level Change

The backend already supported question-based assessment creation, question authoring, publish validation, submissions, review, approval, and grade sync. However, parts of the dashboard CRUD/list/detail surface still behaved as if only score-only assessments were implemented.

This commit aligns the Dashboard Grades Assessment contract with the actual accepted V1 scope.

## Root Cause Fixed

- Detail use case rejected `QUESTION_BASED` assessments after loading them.
- List repository/query behavior forced `SCORE_ONLY` by default.
- Patch/delete/lock helpers had score-only assertions in places where the operation should work for both delivery modes.
- Direct grade item entry error text still implied outdated deferral language.

## Changed Files

Runtime and tests touched by the commit:

```text
src/modules/grades/assessments/application/delete-grade-assessment.use-case.ts
src/modules/grades/assessments/application/get-grade-assessment.use-case.ts
src/modules/grades/assessments/application/grade-assessment-use-case.helpers.ts
src/modules/grades/assessments/domain/grade-assessment-domain.ts
src/modules/grades/assessments/domain/grade-item-entry-domain.ts
src/modules/grades/assessments/dto/grade-assessment.dto.ts
src/modules/grades/assessments/infrastructure/grades-assessments.repository.ts
src/modules/grades/assessments/tests/grade-assessment-items.use-case.spec.ts
src/modules/grades/assessments/tests/grade-assessments.use-case.spec.ts
src/modules/grades/grades-context.ts
src/modules/grades/shared/domain/grade-workflow.ts
src/modules/grades/shared/tests/grade-workflow.spec.ts
test/e2e/grades-question-based.e2e-spec.ts
docs/sprint-23i-grades-assessment-mixed-delivery-mode-contract-repair-closeout.md
```

## No Platform-Level Churn

No schema, migration, package, lockfile, generated-code, or route-prefix changes were introduced.
