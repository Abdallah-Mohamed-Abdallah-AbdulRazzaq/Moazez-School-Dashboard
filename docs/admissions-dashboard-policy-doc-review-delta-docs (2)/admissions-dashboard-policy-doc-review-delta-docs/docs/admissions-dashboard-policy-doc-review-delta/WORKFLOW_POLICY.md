# ADM-WORKFLOW-POLICY-1A — Admissions Workflow Policy

## Goal

Replace hardcoded strict Admissions workflow rules with a school-scoped effective policy.

## New APIs

```http
GET   /api/v1/admissions/workflow-policy
PATCH /api/v1/admissions/workflow-policy
```

## Permissions

| Route | Permission |
|---|---|
| `GET /api/v1/admissions/workflow-policy` | `admissions.applications.view` |
| `PATCH /api/v1/admissions/workflow-policy` | `admissions.applications.manage` |

No new permissions were added.

## Response

```ts
{
  requiresPlacementTest: boolean;
  requiresInterview: boolean;
  allowDirectAcceptance: boolean;
  source: 'default' | 'school_override';
  updatedAt: string | null;
}
```

## Default strict policy

If no school override row exists:

```json
{
  "requiresPlacementTest": true,
  "requiresInterview": true,
  "allowDirectAcceptance": false,
  "source": "default",
  "updatedAt": null
}
```

## PATCH body

PATCH accepts a partial update with at least one field:

```json
{
  "requiresPlacementTest": false,
  "requiresInterview": false,
  "allowDirectAcceptance": true
}
```

An empty body is rejected with `validation.failed` and reason `at_least_one_policy_field_required`.

## Persistence

Migration `20260703120000_0050_admission_workflow_policy` adds `admission_workflow_policies` with:

- `school_id`
- `organization_id`
- `requires_placement_test`
- `requires_interview`
- `allow_direct_acceptance`
- one unique row per school

Absence of a row means default strict policy.

## Decision validation behavior

Decision creation now resolves the current school's effective policy and validates:

- application has no existing decision
- application status is `SUBMITTED` or `UNDER_REVIEW`
- required placement tests exist and all are complete, if `requiresPlacementTest=true`
- required interviews exist and all are complete, if `requiresInterview=true`
- direct `ACCEPT` without tests/interviews is allowed only when both steps are optional and `allowDirectAcceptance=true`

## Registration handoff behavior

Accepted application handoff/register validation uses the same effective policy after confirming:

- application status is `ACCEPTED`
- latest decision is `ACCEPT`

Then required workflow steps are checked according to the policy.

## Audit

PATCH writes `admissions.workflow_policy.update` with safe before/after policy fields only.
