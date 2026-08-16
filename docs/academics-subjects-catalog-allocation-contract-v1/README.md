# Academics Subjects Catalog Allocation Contract V1

## Purpose

This documentation captures the implemented backend contract for `ACADEMICS-SUBJECTS-CATALOG-ALLOCATION-CONTRACT-1A`.

The sprint corrected a misleading backend contract where `Subject` appeared to accept or return term/stage context even though the persisted model is a school-scoped catalog item. The corrected contract is:

```text
/academics/subjects = catalog only
/academics/subject-allocations = term/grade/weeklyHours assignment matrix
```

## What Changed

- `CreateSubjectDto` no longer accepts `termId`.
- `CreateSubjectDto` no longer accepts `stage`.
- `UpdateSubjectDto` inherits the corrected catalog-only shape.
- `SubjectResponseDto` no longer returns `termId` or `stage`.
- `presentSubject` no longer hardcodes `termId: null` or `stage: null`.
- Subject allocation routes now use dashboard structure permissions:
  - `academics.structure.view`
  - `academics.structure.manage`

## Main Users

- School Dashboard users with `academics.subjects.*` permissions manage the subject catalog.
- School Dashboard users with `academics.structure.*` permissions manage the subject allocation matrix.
- Platform/System Dashboard does not get a dedicated subject catalog/allocation route from this sprint.
- Teacher, Student, Parent, and Dismissal Staff apps do not receive direct access to the dashboard allocation matrix by default.
