# Applicant Portal Outputs in Admissions Dashboard Design

## Scope

Harden the dashboard-side handling of applications and documents created through Applicant Portal submission. This work does not add an Applicant Portal module or applicant-facing workflows to the dashboard.

## Ownership Boundary

The dashboard reads submitted Applicant Portal output through school-scoped Admissions APIs only:

- `GET /admissions/applications`
- `GET /admissions/applications/:id`
- `GET /admissions/applications/:applicationId/documents`
- Existing Admissions document review endpoints

Dashboard production code must not call `/applicant-portal/requests/*`, including applicant document upload, replacement, or deletion endpoints.

## Applications List

Applications continue loading through the existing Admissions applications service. The list must not send a `source` query parameter because the backend list contract supports status only.

The source label behavior is:

- `in_app`: retain the existing “In app” label.
- `referral`, `walk_in`, and `other`: retain localized labels.
- Missing source: display an em dash.
- Unknown source: convert underscore-separated identifiers into readable text without failing rendering.

Applications with source `in_app` must not be excluded because Applicant Portal submissions currently use that source. The following statuses must render clearly: `submitted`, `documents_pending`, `under_review`, `accepted`, `waitlisted`, and `rejected`.

Empty states must distinguish an empty API result from a filtered result with no matches. API or authorization failures remain visible as errors rather than being represented as empty data.

## Documents Tab

The tab continues loading documents through the Admissions application documents endpoint. Every document returned by the API must render, including unfamiliar `documentType` values. The staff upload type list remains unchanged and does not control which API documents are displayed.

No school required-documents settings integration is included. The backend does not expose a stable required-document identifier in the Admissions document response, so this design avoids unreliable title matching.

Staff-facing status copy must communicate:

- `pending_review`: submitted by the applicant and waiting for school review.
- `missing`: missing and requires action.
- Accepted or complete: reviewed and complete.

## Permissions

- View and download actions require `admissions.documents.view`.
- Accept, reject, request replacement, and delete actions require `admissions.documents.manage`.
- Existing staff upload behavior stays within Admissions document workflows and its current permission boundary.
- Hidden actions must not remain invokable through rendered controls.

## Error and Loading Behavior

Applications and documents retain their existing full-page or partial loading patterns. Endpoint failures produce a visible localized error with the established retry behavior where available. A failed request must not silently become an empty success state.

## Verification

Applications coverage:

- `in_app` applications remain visible.
- Unknown and missing sources render safely.
- `documents_pending` renders correctly.
- List requests do not send `source`.

Documents coverage:

- An unfamiliar bridged `documentType` renders.
- `pending_review` and `missing` use staff-facing copy.
- View/download controls follow view permission.
- Review and delete controls follow manage permission.
- Calls use Admissions application document endpoints.

A static contract test must reject production dashboard references to `/applicant-portal/requests`. Existing tests, interviews, decisions, and enrollment workflows receive no behavioral changes and remain protected by existing tests and TypeScript validation.

## Non-goals

- Applicant account, profile, discovery, draft request, submission, or document-management UI.
- Applicant Portal routes under `/apply` or `/applicant-portal`.
- Server-side source filtering.
- A distinct `applicant_portal` source before the backend provides it.
- School required-document configuration or name-based matching.
- Refactoring unrelated Admissions workflows.
