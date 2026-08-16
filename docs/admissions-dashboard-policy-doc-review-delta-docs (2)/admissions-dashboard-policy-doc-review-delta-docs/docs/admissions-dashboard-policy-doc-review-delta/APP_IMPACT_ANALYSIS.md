# App Impact Analysis

## Dashboard / School Control Panel

Impact: directly affected.

Required frontend updates:

1. Application list/detail screens should render `documentsSummary` counters.
2. Decision/register action buttons should use `dashboardState`.
3. Document review buttons should use `document.canReview` and `document.reviewEligibility`.
4. Workflow settings screens can use `GET/PATCH /admissions/workflow-policy`.
5. Guardian search/select UIs should move to `GET /students-guardians/guardians?search=...`.
6. Staff upload forms must not send `status: pending_review`.

Compatibility:

- Existing application fields are preserved.
- New application fields are additive.
- Existing document fields are preserved.
- New document review fields are additive.
- Legacy guardians routes are still available.

Potential breaking behavior:

- Staff-created Admissions documents with `status: pending_review` now fail validation. This is intended because `pending_review` is reserved for Applicant Portal bridged documents.

## Applicant Portal

Impact: not directly affected.

No Applicant Portal production response DTOs changed in this range.

Applicant users still:

- remain `UserType.APPLICANT`
- remain membershipless before acceptance
- do not gain school-side Admissions routes
- are not converted into Parent or Student accounts
- do not create Student/Guardian/Enrollment records through this dashboard policy work

Applicant Portal document bridging continues to feed school-side `ApplicationDocument` rows used by document review.

## Parent App

Impact: no direct API contract change.

Parent App does not consume `documentsSummary`, `dashboardState`, or workflow policy routes. Parent visibility remains based on the existing operational Parent/Guardian/Student/Enrollment chain, not Admissions status.

## Student App

Impact: no direct API contract change.

Student App does not consume the new Admissions Dashboard fields or workflow policy routes. Student visibility remains based on the existing operational Student user + active enrollment chain.

## Teacher App

Impact: none expected.

Teacher App does not use these Admissions Dashboard APIs.

## Backend / Admin / QA

Impact: directly affected for testing.

QA should test:

- reviewable Applicant Portal bridged document
- staff-uploaded non-reviewable document
- rejected staff `pending_review`
- application list/detail document counters
- workflow default strict policy
- workflow optional override
- decision readiness under both policies
- registration readiness under accepted application conditions
- canonical and legacy guardians routes
- cross-school isolation
