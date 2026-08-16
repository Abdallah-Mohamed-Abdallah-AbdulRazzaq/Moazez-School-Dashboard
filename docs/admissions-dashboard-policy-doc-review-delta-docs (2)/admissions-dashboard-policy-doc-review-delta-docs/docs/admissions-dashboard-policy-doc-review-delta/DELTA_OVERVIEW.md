# Delta Overview

## Problem fixed

The previous Admissions implementation had a working underlying workflow, but the frontend did not receive enough backend-computed state to render safe actions without duplicating backend logic.

Main gaps:

- `ApplicationDocumentResponseDto` only exposed document status and file metadata, not whether the document was truly reviewable.
- `pending_review` could be ambiguous because only Applicant Portal bridged documents should be reviewed through the school-side review actions.
- Application list/detail did not provide document counters or reviewable counts.
- Decision readiness and registration readiness had to be inferred by the frontend.
- Placement test and interview requirements were hardcoded strict.
- A legacy guardian route collided with the dynamic student route in some routing paths.

## Implemented backend outcome

The backend is now the source of truth for Admissions Dashboard UI state:

- Per-document review actions use `document.canReview` and `document.reviewEligibility`.
- Application cards/detail use `documentsSummary` for document badges and counts.
- Application decision/register buttons use `dashboardState`.
- Workflow policy settings are read/written by school staff through `/admissions/workflow-policy`.
- Guardian search uses the canonical `/students-guardians/guardians` route.

## Main changed surfaces

| Area | API / Response | Change type |
|---|---|---|
| Admissions documents | `GET /admissions/applications/:applicationId/documents` and review action responses | Additive response fields |
| Admissions documents | `POST /admissions/applications/:applicationId/documents` | Validation change for staff `pending_review` |
| Admissions applications | `GET /admissions/applications`, `GET /:id`, create/update/submit responses | Additive `documentsSummary` and `dashboardState` |
| Workflow policy | `GET/PATCH /admissions/workflow-policy` | New school-side API |
| Guardians | `/students-guardians/guardians` | New canonical routes; legacy aliases preserved |
| Swagger / OpenAPI | DTO metadata | Additive schema metadata only |

## Recommended frontend rule

Do not re-implement workflow rules in the frontend. Use:

- `ApplicationDocumentResponse.canReview`
- `ApplicationDocumentResponse.reviewEligibility.reason`
- `ApplicationResponse.documentsSummary`
- `ApplicationResponse.dashboardState`
- `AdmissionWorkflowPolicyResponse`
