# Executive Summary

## Problem Fixed

Before this contract cleanup, the Subject API shape could mislead frontend clients into treating `Subject` as a term/stage-specific academic entity. The backend did not persist `termId` or `stage` on `Subject`, and presenter behavior previously returned hardcoded nulls for those concepts.

This sprint makes the contract explicit:

- `Subject` is a school-scoped catalog record.
- `SubjectAllocation` is the term/grade/weekly-hours assignment record.

## Correct Integration Model

Frontend and integration clients should follow this sequence:

1. Create or update a catalog subject with `/api/v1/academics/subjects`.
2. Allocate that subject to term/grade rows with `/api/v1/academics/subject-allocations/bulk`.
3. Read the allocation matrix from `/api/v1/academics/subject-allocations?termId=...&gradeId=...`.

## Important Contract Rules

- Do not send `termId` or `stage` to `POST /api/v1/academics/subjects`.
- Do not send `termId` or `stage` to `PATCH /api/v1/academics/subjects/:id`.
- Do not expect `termId` or `stage` in a Subject response.
- Do not treat `GET /api/v1/academics/subjects?termId=...` as a term allocation endpoint.
- Use `gradeId`, not `stage`, as the allocation key.
- If the UI offers stage-level allocation, expand the stage into grades client-side or through an academic structure read flow, then submit one bulk item per `gradeId`.

## Current Product Meaning

The backend now cleanly separates catalog definition from academic placement:

| Concept | API | Meaning |
| --- | --- | --- |
| Subject catalog | `/api/v1/academics/subjects` | Names, code, color, active flag. |
| Subject allocation | `/api/v1/academics/subject-allocations` | Term + grade + subject + weekly hours. |
