# Testing Guide

## Local focused verification commands reported in the closeouts

The range reported successful execution of focused and regression tests including:

```bash
npx prisma validate
npm run build
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-frontend-contract.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-dashboard-state.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-workflow-policy.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/admissions-application-document-summary.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/applicant-portal-document-review.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/e2e/students-guardians-guardians-routes.e2e-spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.admissions.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.applicant-portal-document-review.spec.ts
npx jest --config ./test/jest-e2e.json --runInBand test/security/tenancy.spec.ts
```

## Manual API test focus

Use the included `.http` files to verify:

1. Auth and permissions are required.
2. Application list/detail include `documentsSummary` and `dashboardState`.
3. Workflow policy GET returns default strict when no override exists.
4. Workflow policy PATCH creates/updates school override.
5. Decision readiness changes after policy update.
6. Document list returns `source`, `canReview`, `reviewEligibility`, and `linkedApplicantDocument`.
7. Staff upload rejects `pending_review`.
8. Review actions return updated eligibility fields.
9. Canonical guardians route works.
10. Legacy guardians route still works.

## Suggested QA scenarios

### Scenario A — strict default policy

- Application is `SUBMITTED` with no tests/interviews.
- Expected: `dashboardState.canProceedToDecision=false`.
- Expected reason: `workflow_policy_not_satisfied`.

### Scenario B — completed strict workflow

- Application is `SUBMITTED`.
- One placement test exists and is completed.
- One interview exists and is completed.
- Expected: `dashboardState.canProceedToDecision=true`.

### Scenario C — direct acceptance allowed

- PATCH workflow policy to optional tests/interviews and `allowDirectAcceptance=true`.
- Application has no tests/interviews.
- Expected: `canAccept=true` when status is decidable and no decision exists.

### Scenario D — direct acceptance not allowed

- PATCH workflow policy to optional tests/interviews and `allowDirectAcceptance=false`.
- Application has no tests/interviews.
- Expected: `canAccept=false`, `canWaitlist=true`, `canReject=true`.

### Scenario E — Applicant Portal bridged document

- Applicant uploads document and request is submitted.
- School-side document is `pending_review`, source `applicant_portal`, linked document `uploaded`.
- Expected: `canReview=true`, reason `reviewable`.

### Scenario F — staff-uploaded document

- Staff creates document with omitted status.
- Expected: status `complete`, source `staff_upload`, `canReview=false`.

### Scenario G — legacy guardians route compatibility

- Call `GET /students-guardians/students/guardians?search=...`.
- Expected: guardian list, not UUID validation error.
