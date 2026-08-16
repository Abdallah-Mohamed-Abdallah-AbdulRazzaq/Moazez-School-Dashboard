# Moazez Backend Changes Report

**Repository:** `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`  
**Commit range:** `240552a4` → `5fe6fb6`  
**Generated:** 2026-07-05  
**Scope reviewed:** GitHub compare page, commit pages, and the closeout/contract docs introduced in this range.

> Note: GitHub reported that the full compare diff was too large/slow to render in the browser, so this report is based on the commit metadata, changed-file lists, sprint closeout files, and the final `docs/admissions-frontend-contract.md` that were added/updated in the range.

---

## 1. High-Level Summary

This commit range mainly turns Admissions and Guardians APIs into a more frontend-ready, dashboard-friendly contract.

The work adds:

1. **Canonical Guardians routes**
   - Moves Guardians lookup/CRUD routes to a cleaner canonical path.
   - Keeps legacy routes working through a compatibility shim.
   - Fixes a route collision where `/students/guardians` was incorrectly treated as a dynamic `studentId`.

2. **Admissions document summary counters**
   - Adds `documentsSummary` to school-side Admissions application responses.
   - Lets the frontend show document counters/badges without fetching every document or duplicating reviewability logic.

3. **Admissions workflow policy**
   - Adds a school-scoped workflow policy model and API.
   - Allows schools to configure whether placement tests/interviews are required and whether direct acceptance is allowed.
   - Wires the policy into decision validation and registration/enrollment handoff validation.

4. **Admissions dashboard action state**
   - Adds `dashboardState` to application responses.
   - Backend now computes whether decision/register actions are available and why they may be blocked.

5. **Frontend contract + Swagger/OpenAPI audit**
   - Adds a dedicated frontend handoff doc.
   - Adds Swagger decorators/metadata for response DTOs.
   - Adds E2E tests to confirm generated schemas expose the intended additive fields.

---

## 2. Commit Overview

| Commit | Title | Main Area | Files Changed | Change Type |
|---|---|---:|---:|---|
| `7ab0b70` | `feat: add canonical guardians routes` | Students / Guardians | 4 | API routing + compatibility |
| `9b6ea2d` | `feat: add admissions document summary counters` | Admissions applications | 5 | Additive response contract |
| `2fcf738` | `feat: add admissions workflow policy` | Admissions workflow | 26 | DB + API + validation |
| `73ebe9d` | `feat: add admissions dashboard action state` | Admissions dashboard | 16 | Additive response contract + logic |
| `5fe6fb6` | `docs: add admissions frontend contract audit` | Docs / Swagger / E2E | 7 | Contract documentation + OpenAPI metadata |

GitHub compare reports the whole range as:

- **5 commits**
- **51 files changed**
- **1 contributor**

---

## 3. Guardians Route Changes

### Problem fixed

Before this range, the legacy route:

```http
GET /api/v1/students-guardians/students/guardians?search=fda
```

could collide with:

```http
GET /api/v1/students-guardians/students/:studentId
```

The string `guardians` could be treated as `studentId`, causing UUID validation errors instead of returning a Guardians list.

### New canonical routes

The main Guardians controller is now exposed under:

```http
GET   /api/v1/students-guardians/guardians
POST  /api/v1/students-guardians/guardians
GET   /api/v1/students-guardians/guardians/:guardianId
PATCH /api/v1/students-guardians/guardians/:guardianId
GET   /api/v1/students-guardians/guardians/:guardianId/students
POST  /api/v1/students-guardians/guardians/:guardianId/account
```

### Legacy routes preserved

The legacy path remains available for backward compatibility:

```http
GET   /api/v1/students-guardians/students/guardians
POST  /api/v1/students-guardians/students/guardians
GET   /api/v1/students-guardians/students/guardians/:guardianId
PATCH /api/v1/students-guardians/students/guardians/:guardianId
GET   /api/v1/students-guardians/students/guardians/:guardianId/students
```

A narrowly scoped middleware rewrites the legacy guardians prefix to the canonical prefix before controller matching.

### Permissions

No permission names were added, removed, or renamed.

| Action | Permission |
|---|---|
| List guardians | `students.guardians.view` |
| Get guardian | `students.guardians.view` |
| Get guardian students | `students.guardians.view` |
| Create guardian | `students.guardians.manage` |
| Update guardian | `students.guardians.manage` |
| Create/link guardian account | `students.guardians.manage` |

### Frontend impact

New frontend code should use:

```http
GET /api/v1/students-guardians/guardians?search=...
```

The legacy route should only remain for old clients until migration is complete.

---

## 4. Admissions Document Summary Counters

### Problem fixed

Admissions application list/detail responses did not include aggregate document counters. The frontend either had to:

- fetch documents separately for each application, or
- duplicate backend reviewability logic.

### New `documentsSummary` field

School-side `ApplicationResponseDto` now includes:

```ts
documentsSummary: {
  totalCount: number;
  completeCount: number;
  missingCount: number;
  pendingReviewCount: number;
  reviewableCount: number;
  applicantPortalCount: number;
  staffUploadCount: number;
  needsReplacementCount: number;
  hasPendingReview: boolean;
  hasReviewableDocuments: boolean;
  hasMissingDocuments: boolean;
}
```

### Returned by

```http
GET /api/v1/admissions/applications
GET /api/v1/admissions/applications/:id
```

Because create/update/submit responses use the same presenter, they also include the additive field.

### Counter logic

| Field | Meaning |
|---|---|
| `totalCount` | Count of school-side `ApplicationDocument` rows |
| `completeCount` | Documents with `ApplicationDocument.status = COMPLETE` |
| `missingCount` | Documents with `ApplicationDocument.status = MISSING` |
| `pendingReviewCount` | Documents with `ApplicationDocument.status = PENDING_REVIEW` |
| `applicantPortalCount` | Documents linked to at least one non-deleted Applicant Portal document |
| `staffUploadCount` | `totalCount - applicantPortalCount` |
| `needsReplacementCount` | Non-deleted linked applicant document rows with status `NEEDS_REPLACEMENT` |
| `hasPendingReview` | `pendingReviewCount > 0` |
| `hasReviewableDocuments` | `reviewableCount > 0` |
| `hasMissingDocuments` | `missingCount > 0 || needsReplacementCount > 0` |

### `reviewableCount` gates

A document counts as reviewable only when:

- application status is `SUBMITTED`, `DOCUMENTS_PENDING`, or `UNDER_REVIEW`
- school-side document status is `PENDING_REVIEW`
- a non-deleted linked Applicant Portal document exists
- linked applicant document status is `UPLOADED`

Staff-uploaded documents are never counted as reviewable.

### Repository/query strategy

The application repository selection was expanded with minimal document summary data so list responses avoid a per-application query loop. The presenter computes the public summary, while raw selected document/link fields stay internal.

---

## 5. Admissions Workflow Policy

### New purpose

The Admissions workflow was previously strict and hardcoded. Decisions and accepted-application handoff required:

- at least one placement test
- all placement tests completed
- at least one interview
- all interviews completed

This range adds a school-scoped policy so each school can decide whether placement tests/interviews are required and whether direct acceptance is allowed.

### New API routes

```http
GET   /api/v1/admissions/workflow-policy
PATCH /api/v1/admissions/workflow-policy
```

### Response shape

```ts
type AdmissionWorkflowPolicyResponse = {
  requiresPlacementTest: boolean;
  requiresInterview: boolean;
  allowDirectAcceptance: boolean;
  source: 'default' | 'school_override';
  updatedAt: string | null;
};
```

### Default policy

When no school override exists:

```json
{
  "requiresPlacementTest": true,
  "requiresInterview": true,
  "allowDirectAcceptance": false,
  "source": "default",
  "updatedAt": null
}
```

### PATCH body

`PATCH /api/v1/admissions/workflow-policy` accepts at least one boolean field:

```ts
{
  requiresPlacementTest?: boolean;
  requiresInterview?: boolean;
  allowDirectAcceptance?: boolean;
}
```

An empty body is rejected with `validation.failed`.

### Database changes

Added:

- Prisma model: `AdmissionWorkflowPolicy`
- Table mapping: `admission_workflow_policies`
- Migration: `20260703120000_0050_admission_workflow_policy`
- Unique school constraint: one policy row per school

No rows are backfilled. Missing row means the default strict policy.

### Validation changes

`DecisionWorkflowValidator` now resolves the effective school policy and validates:

- existing decision still blocks new decisions
- application status must still be `SUBMITTED` or `UNDER_REVIEW`
- required placement/interview workflow steps must exist and be complete according to policy
- direct `ACCEPT` without tests/interviews is allowed only when both steps are optional and `allowDirectAcceptance = true`

`ApplicationEnrollmentHandoffValidator` now enforces accepted status and `ACCEPT` decision first, then validates required workflow steps using the same policy.

### Permissions

| Route | Permission |
|---|---|
| `GET /api/v1/admissions/workflow-policy` | `admissions.applications.view` |
| `PATCH /api/v1/admissions/workflow-policy` | `admissions.applications.manage` |

No role seed or permission name changes were introduced.

### Audit logging

PATCH writes `admissions.workflow_policy.update` audit records with safe before/after policy fields. API responses do not expose audit internals.

---

## 6. Admissions Dashboard Action State

### Problem fixed

Application responses already had `documentsSummary` and registration state, and workflow policy validation existed inside backend validators. But the frontend still had no backend-computed state for:

- decision readiness
- registration readiness
- workflow readiness
- document warning signals
- blocked-action reasons

### New `dashboardState` field

School-side `ApplicationResponseDto` now includes:

```ts
dashboardState: {
  canProceedToDecision: boolean;
  canRegister: boolean;
  registrationState:
    | 'not_applicable'
    | 'not_accepted'
    | 'decision_not_accept'
    | 'blocked_workflow_policy'
    | 'ready_to_register'
    | 'registered';

  decisionState: {
    canCreateDecision: boolean;
    canAccept: boolean;
    canWaitlist: boolean;
    canReject: boolean;
    reason:
      | 'ready'
      | 'already_decided'
      | 'application_status_not_decidable'
      | 'workflow_policy_not_satisfied'
      | 'direct_acceptance_not_allowed';
  };

  workflowReadiness: {
    policy: {
      requiresPlacementTest: boolean;
      requiresInterview: boolean;
      allowDirectAcceptance: boolean;
      source: 'default' | 'school_override';
    };
    placementTests: {
      required: boolean;
      total: number;
      completed: number;
      satisfied: boolean;
    };
    interviews: {
      required: boolean;
      total: number;
      completed: number;
      satisfied: boolean;
    };
  };

  documentSignals: {
    hasPendingReview: boolean;
    hasReviewableDocuments: boolean;
    hasMissingDocuments: boolean;
    pendingReviewCount: number;
    reviewableCount: number;
    missingCount: number;
    needsReplacementCount: number;
  };

  blockers: Array<{
    code: string;
    message: string;
  }>;
}
```

### Returned by

```http
GET /api/v1/admissions/applications
GET /api/v1/admissions/applications/:id
```

It is also returned by create/update/submit application responses because they share `ApplicationResponseDto`.

### Decision readiness rules

`canProceedToDecision` equals `decisionState.canCreateDecision`.

Decision actions are computed per decision type:

- existing decision blocks all decision actions
- only `SUBMITTED` and `UNDER_REVIEW` applications are decidable
- workflow policy requirements are evaluated through the workflow policy evaluator
- missing required placement/interview workflow blocks `ACCEPT`, `WAITLIST`, and `REJECT`
- `allowDirectAcceptance = false` blocks only no-test/no-interview `ACCEPT` when both workflow steps are optional
- `WAITLIST` and `REJECT` remain allowed in that direct-acceptance case

Reason precedence:

1. `already_decided`
2. `application_status_not_decidable`
3. `direct_acceptance_not_allowed`
4. `workflow_policy_not_satisfied`
5. `ready`

### Registration state rules

Registration state is read-only and follows this precedence:

1. `registered` when the application already has a same-school linked student
2. `not_accepted` when `Application.status` is not `ACCEPTED`
3. `decision_not_accept` when accepted status exists but the decision is missing or not `ACCEPT`
4. `blocked_workflow_policy` when accepted + accept decision exists but required workflow is not satisfied
5. `ready_to_register` when accepted + accept decision + policy satisfied + not already registered
6. `not_applicable` fallback

`canRegister` is true only for `ready_to_register`.

### Query strategy

The repository selects only minimal extra data:

- decision type
- placement test statuses
- interview statuses

The list path resolves policy once and maps all applications with that policy, avoiding per-application policy/test/interview queries.

---

## 7. Admissions Document Review Contract

The final frontend contract confirms school-side document responses expose:

```ts
type ApplicationDocumentResponse = {
  id: string;
  applicationId: string;
  fileId: string;
  documentType: string;
  status: 'complete' | 'missing' | 'pending_review';
  source: 'staff_upload' | 'applicant_portal';
  canReview: boolean;
  reviewEligibility: {
    canAccept: boolean;
    canReject: boolean;
    canRequestReplacement: boolean;
    reason:
      | 'reviewable'
      | 'application_status_not_reviewable'
      | 'document_not_pending_review'
      | 'not_applicant_portal_document'
      | 'applicant_document_not_uploaded';
  };
  linkedApplicantDocument: {
    id: string;
    status:
      | 'uploaded'
      | 'accepted'
      | 'rejected'
      | 'needs_replacement'
      | 'superseded';
  } | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: string;
    visibility: string;
  };
};
```

### Review action routes

```http
POST /api/v1/admissions/applications/:applicationId/documents/:documentId/accept
POST /api/v1/admissions/applications/:applicationId/documents/:documentId/reject
POST /api/v1/admissions/applications/:applicationId/documents/:documentId/request-replacement
```

### Review eligibility precedence

1. `application_status_not_reviewable`
2. `document_not_pending_review`
3. `not_applicant_portal_document`
4. `applicant_document_not_uploaded`
5. `reviewable`

`canAccept`, `canReject`, and `canRequestReplacement` currently equal `canReview`.

### Staff-upload restriction

Staff-created Admissions documents may use:

- `complete`
- `missing`
- omitted `status`, which defaults to `complete`

Staff-created documents must not set:

```ts
status: 'pending_review'
```

The backend returns:

```json
{
  "field": "status",
  "reason": "pending_review_reserved_for_applicant_portal"
}
```

---

## 8. Frontend Contract / Handoff Document

A new frontend handoff document was added:

```text
docs/admissions-frontend-contract.md
```

It documents:

- required frontend route changes
- application list/detail response shape
- `documentsSummary`
- `dashboardState`
- document review response shape
- workflow policy routes and response shape
- Guardians canonical route
- frontend usage recommendations
- permission expectations
- no-leak guarantees
- compatibility notes
- future deprecation notes

### Key frontend instructions

Application cards/lists should use:

- `documentsSummary` for document count badges
- `dashboardState.canProceedToDecision` and `dashboardState.decisionState` for decision buttons
- `dashboardState.canRegister` and `dashboardState.registrationState` for registration actions
- `dashboardState.documentSignals` for compact warning badges

Application details should:

- use `documentsSummary` for summary panels
- fetch documents only for document table/review drawer
- use `document.canReview` for Accept/Reject/Request replacement visibility
- display `reviewEligibility.reason` when an action is unavailable

Workflow settings should:

- use `GET /admissions/workflow-policy`
- use `PATCH /admissions/workflow-policy`
- refetch application list/detail after policy updates

Guardians search should use:

```http
GET /students-guardians/guardians?search=...
```

---

## 9. Swagger / OpenAPI Changes

The final audit found that runtime Swagger generation initially produced empty schemas for the audited response DTOs:

- `ApplicationResponseDto`
- `ApplicationDocumentResponseDto`
- `AdmissionWorkflowPolicyResponseDto`

This range adds Swagger decorators/metadata to:

- `src/modules/admissions/applications/dto/application.dto.ts`
- `src/modules/admissions/applications/dto/application-dashboard-state.dto.ts`
- `src/modules/admissions/documents/dto/application-document.dto.ts`
- `src/modules/admissions/workflow-policy/dto/admission-workflow-policy.dto.ts`

The focused E2E now asserts generated Swagger schemas include:

- `ApplicationResponseDto.documentsSummary`
- `ApplicationResponseDto.dashboardState`
- `ApplicationDocumentResponseDto.source`
- `ApplicationDocumentResponseDto.canReview`
- `ApplicationDocumentResponseDto.reviewEligibility`
- `ApplicationDocumentResponseDto.linkedApplicantDocument`
- `AdmissionWorkflowPolicyResponseDto` policy fields

No business logic was changed in the final contract-audit commit; DTO changes are Swagger/OpenAPI metadata only.

---

## 10. Security, Tenancy, and No-Leak Notes

### Guardians

Guardian responses continue to avoid internal fields such as:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `deletedAt`
- `passwordHash`
- `userId`
- `applicationId`
- storage bucket/object/provider/signed URL fields
- audit actor fields

Canonical cross-school guardian access remains hidden with `404 not_found`.

### `documentsSummary`

`documentsSummary` exposes only aggregate numbers and booleans. It does not expose:

- document IDs
- applicant document IDs
- request IDs
- tenant IDs
- file IDs
- storage keys
- signed URLs
- raw Prisma enum names
- audit internals

Application responses also do not expose a `documents` array.

### `dashboardState`

`dashboardState` exposes only:

- safe booleans
- aggregate counts
- safe states/reasons
- policy booleans/source
- blocker codes/messages

It does not expose:

- internal relation objects
- decision IDs
- policy IDs
- tenant IDs
- membership/role/actor/user IDs
- applicant IDs
- student/guardian/registration IDs
- placement test/interview/document/file IDs
- storage fields
- signed URLs
- audit internals
- raw Prisma enum names
- internal timestamps for workflow rows

### Workflow policy

Policy responses expose only approved fields. School A and School B policy rows remain independent, and policy routes reject applicant/parent/student actors.

### Applicant Portal boundary

The closeout docs state that Applicant Portal production responses were not changed. Applicant accounts remain separate from Parent/Student operational identities, and no automatic applicant-to-parent conversion or Student/Guardian/Enrollment creation side effect was introduced by these commits.

---

## 11. Reported Validation / Test Coverage

This section lists what the repository closeout docs report as executed. I did not run these tests locally.

### Guardians routes

Reported:

```bash
npx prisma validate
npm run build
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/students-guardians-guardians-routes.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.students.spec.ts
```

### Document summary

Reported:

```bash
npm run build
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-application-document-summary.e2e-spec.ts
npx prisma validate
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/applicant-portal-document-review.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.applicant-portal-document-review.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.admissions.spec.ts
```

### Workflow policy

Reported:

```bash
npx prisma validate
npm run db:migrate
npx prisma generate
npm run build
npx jest --runInBand src/modules/admissions/decisions/tests/admission-decisions.use-case.spec.ts
npx jest --runInBand src/modules/admissions/applications/tests/application-registration-handoff.use-case.spec.ts src/modules/admissions/applications/tests/register-accepted-application.use-case.spec.ts src/modules/admissions/applications/tests/enroll-application-handoff.use-case.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-workflow-policy.e2e-spec.ts
```

### Dashboard state

Reported:

```bash
npm run build
npx jest --runInBand src/modules/admissions/applications/tests/application-dashboard-state.presenter.spec.ts src/modules/admissions/applications/tests/application.presenter.spec.ts src/modules/admissions/applications/tests/applications.use-case.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-dashboard-state.e2e-spec.ts
npx jest --runInBand src/modules/admissions/applications/tests
npx prisma validate
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.admissions.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-workflow-policy.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-application-document-summary.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/applicant-portal-document-review.e2e-spec.ts
```

### Frontend contract audit

Reported regressions passed for:

- document review
- document summary
- dashboard state
- workflow policy
- admissions tenancy
- applicant document review security

---

## 12. Compatibility Notes

The changes are mostly additive from the frontend/client perspective.

### Additive fields

- `ApplicationResponseDto.documentsSummary`
- `ApplicationResponseDto.dashboardState`
- `ApplicationDocumentResponseDto.source`
- `ApplicationDocumentResponseDto.canReview`
- `ApplicationDocumentResponseDto.reviewEligibility`
- `ApplicationDocumentResponseDto.linkedApplicantDocument`
- `AdmissionWorkflowPolicyResponseDto` fields

### Existing behavior preserved

- Legacy Guardians route remains available.
- Student dynamic UUID validation remains unchanged.
- Existing Guardians response public shape remains unchanged.
- Applicant Portal response shapes remain unchanged.
- Staff upload `pending_review` is rejected to preserve the Applicant Portal review boundary.
- Workflow policy defaults to strict behavior when no school override exists.

---

## 13. Recommended Frontend Work

1. Replace Guardians lookup calls:

```diff
- GET /api/v1/students-guardians/students/guardians?search=...
+ GET /api/v1/students-guardians/guardians?search=...
```

2. Use `documentsSummary` for application cards and list badges.

3. Use `dashboardState` for:
   - decision buttons
   - register button
   - disabled states
   - blocker messages
   - warning badges

4. Use `document.canReview` and `document.reviewEligibility.reason` instead of checking only `document.status`.

5. Add/adjust workflow settings UI around:

```http
GET /api/v1/admissions/workflow-policy
PATCH /api/v1/admissions/workflow-policy
```

6. After workflow policy updates, refetch application list/detail data because policy affects `dashboardState.workflowReadiness`, `decisionState`, and registration readiness.

---

## 14. Main Risks / Things to Watch

1. **Frontend migration timing**
   - The legacy Guardians route still works, but new code should move to the canonical route to avoid future deprecation work.

2. **Dashboard logic duplication**
   - The frontend should not recreate policy or document review logic. It should trust `dashboardState`, `documentsSummary`, `canReview`, and `reviewEligibility`.

3. **Policy update side effects**
   - Changing workflow policy can immediately affect which applications can be decided or registered.

4. **Direct acceptance behavior**
   - `allowDirectAcceptance` only fully enables direct accept when both placement test and interview steps are optional.

5. **Swagger clients**
   - If frontend or integrations generate clients from OpenAPI, regenerate them after the DTO metadata updates.

---

## 15. Source Links

- Compare page: `https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/compare/240552a4...5fe6fb6`
- Commit `7ab0b70`: `feat: add canonical guardians routes`
- Commit `9b6ea2d`: `feat: add admissions document summary counters`
- Commit `2fcf738`: `feat: add admissions workflow policy`
- Commit `73ebe9d`: `feat: add admissions dashboard action state`
- Commit `5fe6fb6`: `docs: add admissions frontend contract audit`
- Final frontend contract: `docs/admissions-frontend-contract.md`
