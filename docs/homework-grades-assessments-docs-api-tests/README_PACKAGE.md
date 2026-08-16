# Homework / Grades / Assessments Docs + API Tests Package

This package is a proposed documentation drop for the Moazez Backend `Homework / Grades / Assessments` V1 feature family.

It is intended to be copied into the repository under:

```text
docs/homework-grades-assessments/
```

The documentation reflects the implemented backend-native routes and accepted V1 decisions visible in the repository, including Sprint 23H final closeout.

## Scope

The package covers:

- School Dashboard Grades / Assessments.
- School Dashboard Homework Core.
- Teacher App Homework.
- Teacher App Classroom Grades and question-based review/sync reads.
- Student App Homework and Grades.
- Parent App Homework and Grades.
- Homework-to-Grades sync.
- Permissions, tenancy, ownership boundaries, closed-term and locked-assessment protections.
- Safe response behavior and accepted non-goals.
- Manual `.http` smoke tests.

## How to use

1. Review the docs locally.
2. Copy `docs/homework-grades-assessments/` into the repo if accepted.
3. Run the verification commands listed in `TESTING_GUIDE.md`.
4. Use `API_TESTS.http` with a REST client after replacing placeholders.

## Non-goals

This package does not add source code, migrations, seeds, tests, or runtime behavior.
