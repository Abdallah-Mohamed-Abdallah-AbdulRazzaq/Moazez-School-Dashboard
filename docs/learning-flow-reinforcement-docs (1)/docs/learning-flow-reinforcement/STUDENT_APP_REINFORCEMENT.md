# Student App Reinforcement

Student App Reinforcement is current-student scoped. Client requests must not send `studentId`, `enrollmentId`, `schoolId`, status overrides, reviewer ids, XP amounts, or actor fields unless a route-specific DTO explicitly accepts a safe field.

## Student task routes

Base prefix: `/api/v1/student/tasks`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | List current student's reinforcement tasks. |
| `GET` | `/summary` | Task summary counts. |
| `GET` | `/:taskId` | Task detail. |
| `GET` | `/:taskId/submissions` | List own submissions for the task. |
| `GET` | `/:taskId/submissions/:submissionId` | Get one own submission. |
| `POST` | `/:taskId/stages/:stageId/submit` | Submit proof for own task stage. |

## Student task submission

Route:

```http
POST /api/v1/student/tasks/:taskId/stages/:stageId/submit
```

Body:

```json
{
  "proofText": "Optional text proof",
  "proofFileId": "optional-uploaded-file-uuid"
}
```

Implementation rules:

- Resolves current student via Student App access service.
- Resolves assignment server-side from `taskId`.
- Validates `stageId` belongs to the visible task.
- Validates proof text bounds and file id format.
- Validates proof file ownership: same organization/school, uploaded by current student user, private, and not soft-deleted.
- Delegates to core `SubmitReinforcementStageUseCase`.
- Returns refreshed Student App-safe submission presenter.

No automatic side effects:

- no XP grant
- no reward redemption
- no Hero mission completion
- no Behavior point writes

## Student Hero routes

Base prefix: `/api/v1/student/hero`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Hero overview. |
| `GET` | `/progress` | Mission progress summary. |
| `GET` | `/badges` | Earned badges. |
| `GET` | `/missions` | Visible missions. |
| `GET` | `/missions/:missionId` | Mission detail. |
| `POST` | `/missions/:missionId/start` | Start own mission. |
| `POST` | `/missions/:missionId/complete` | Complete own mission. |
| `POST` | `/missions/:missionId/objectives/:objectiveId/complete` | Complete own objective. |

Student Hero actions:

- validate current student and mission visibility
- require own progress for complete/objective actions
- validate objective belongs to mission
- delegate to Hero Journey core
- return existing Student Hero safe presenter shape

## Student Rewards routes

Base prefix: `/api/v1/student/rewards`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | List visible rewards. |
| `GET` | `/:rewardId` | Reward detail. |
| `GET` | `/redemptions` | List current student's redemptions. |
| `GET` | `/redemptions/:redemptionId` | Current student's redemption detail. |
| `POST` | `/:rewardId/redeem` | Request redemption for self. |

Redemption body:

```json
{
  "note": "Optional note"
}
```

Important V1 model:

- Redemption is request/status-based.
- XP is not deducted.
- `minTotalXp` is an eligibility threshold.
- Affordability is calculated from positive `XpLedger` amounts.
- Duplicate open redemption returns conflict.
- Behavior points are not used.

## Safe response rules

Student responses must not expose:

- tenant/internal ids
- reviewer/submitted actor ids
- XP ledger internals
- BehaviorPointLedger internals
- RewardRedemption internals
- storage internals
- wallet/finance/payment fields
