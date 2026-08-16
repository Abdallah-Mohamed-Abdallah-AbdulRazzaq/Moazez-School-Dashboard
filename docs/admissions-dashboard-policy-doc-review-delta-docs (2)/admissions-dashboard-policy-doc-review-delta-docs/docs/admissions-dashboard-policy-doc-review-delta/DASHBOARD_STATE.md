# ADM-DASH-STATE-1A — Admissions Dashboard Action State

## Goal

Expose backend-computed action readiness for Admissions dashboard cards/details.

## Returned by

```http
GET /api/v1/admissions/applications
GET /api/v1/admissions/applications/:id
POST /api/v1/admissions/applications
PATCH /api/v1/admissions/applications/:id
POST /api/v1/admissions/applications/:id/submit
```

## Field

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
    placementTests: { required: boolean; total: number; completed: number; satisfied: boolean };
    interviews: { required: boolean; total: number; completed: number; satisfied: boolean };
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
  blockers: Array<{ code: string; message: string }>;
}
```

## Decision readiness rules

- Existing decision blocks all decision actions.
- Only `SUBMITTED` and `UNDER_REVIEW` are decidable.
- Workflow policy is evaluated per requested decision type.
- Missing required placement/interview workflow blocks `ACCEPT`, `WAITLIST`, and `REJECT`.
- `allowDirectAcceptance=false` blocks direct no-test/no-interview `ACCEPT` when both steps are optional.
- In that direct-acceptance case, `WAITLIST` and `REJECT` remain allowed.

## Decision reason precedence

1. `already_decided`
2. `application_status_not_decidable`
3. `direct_acceptance_not_allowed`
4. `workflow_policy_not_satisfied`
5. `ready`

## Registration state precedence

1. `registered` when same-school linked Student exists via `Student.applicationId`.
2. `not_accepted` when `Application.status` is not `ACCEPTED`.
3. `decision_not_accept` when accepted but decision is missing or not `ACCEPT`.
4. `blocked_workflow_policy` when accepted + ACCEPT decision exists but workflow policy is not satisfied.
5. `ready_to_register` when accepted + ACCEPT decision + policy-satisfied + not registered.
6. `not_applicable` fallback, not expected for normal V1 states.

`canRegister` is true only for `ready_to_register`.

## Document signals

`dashboardState.documentSignals` mirrors selected values from `documentsSummary`. No additional document query is required.

## Frontend usage

Use `dashboardState` instead of duplicating backend logic for:

- decision buttons
- accepted-application register button
- disabled-action reasons
- workflow readiness chips
- document warning badges
