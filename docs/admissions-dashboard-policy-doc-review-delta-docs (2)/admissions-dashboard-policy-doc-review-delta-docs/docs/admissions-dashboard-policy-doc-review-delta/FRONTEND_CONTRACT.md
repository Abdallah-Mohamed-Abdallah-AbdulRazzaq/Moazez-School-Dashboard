# ADM-FE-CONTRACT-1A — Frontend Contract Audit

## Purpose

Lock the frontend-facing API contract for the Admissions Dashboard after the document review, workflow policy, document summary, and dashboard state changes.

## Audited routes

```http
GET   /api/v1/admissions/applications
GET   /api/v1/admissions/applications/:id
GET   /api/v1/admissions/applications/:applicationId/documents
POST  /api/v1/admissions/applications/:applicationId/documents
POST  /api/v1/admissions/applications/:applicationId/documents/:documentId/accept
POST  /api/v1/admissions/applications/:applicationId/documents/:documentId/reject
POST  /api/v1/admissions/applications/:applicationId/documents/:documentId/request-replacement
GET   /api/v1/admissions/workflow-policy
PATCH /api/v1/admissions/workflow-policy
GET   /api/v1/students-guardians/guardians?search=...
GET   /api/v1/students-guardians/students/guardians?search=...
```

## Production behavior changed in this final audit?

No. The final frontend contract audit added Swagger/OpenAPI DTO metadata and tests. The runtime business logic was already implemented by the previous commits in the range.

## Required frontend changes

1. Use `document.canReview` and `document.reviewEligibility` for document review buttons.
2. Use `documentsSummary` for application list/card counters.
3. Use `dashboardState` for action readiness.
4. Use `GET/PATCH /admissions/workflow-policy` for workflow settings.
5. Move guardian search to `/students-guardians/guardians`.
6. Keep legacy guardians route only as compatibility fallback.

## Compatibility notes

- New fields are additive on school-side Admissions responses.
- Applicant Portal response shapes are unchanged.
- Parent App and Student App response shapes are unchanged.
- Staff-created `pending_review` is now rejected.
- Legacy guardians route remains functional.

## No-leak rule

New response fields expose only safe booleans, counts, action states, reason codes, and limited diagnostic IDs/status for linked applicant documents. They must not expose tenant IDs, applicant user IDs, request IDs, storage internals, signed URLs, audit internals, membership IDs, role IDs, credentials, or raw Prisma enum names.
