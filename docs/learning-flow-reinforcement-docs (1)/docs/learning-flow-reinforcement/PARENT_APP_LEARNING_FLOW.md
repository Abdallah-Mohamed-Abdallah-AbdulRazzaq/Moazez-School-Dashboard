# Parent App Learning Flow

Parent App Learning Flow is child-scoped and read-only except existing communication read-state/message mutations outside the Reinforcement domain.

Every child route validates:

- current actor is a parent
- active school membership
- active guardian relationship
- linked child ownership
- active child/student/enrollment as required
- current school scope

Same-school unlinked children and cross-school children are hidden with safe not-found behavior.

## Parent task/reinforcement routes

Base prefix: `/api/v1/parent/children/:studentId/tasks`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Linked child task list. |
| `GET` | `/summary` | Linked child task summary. |
| `GET` | `/:taskId` | Linked child task detail. |
| `GET` | `/:taskId/submissions` | Linked child task submissions. |
| `GET` | `/:taskId/submissions/:submissionId` | Linked child submission detail. |

Parent task reads include stage/submission progress, review status, proof text, and safe proof file metadata.

Parent task reads do not expose internal assignment/enrollment ids and do not include proof download links. Parent proof download is deferred.

## Parent Hero routes

Base prefix: `/api/v1/parent/children/:studentId/hero`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Child Hero overview. |
| `GET` | `/progress` | Child Hero progress. |
| `GET` | `/badges` | Child badges. |
| `GET` | `/missions` | Child missions. |
| `GET` | `/missions/:missionId` | Child mission detail. |

No Parent Hero mutations exist.

## Parent XP route

Parent XP remains under the existing progress route:

```http
GET /api/v1/parent/children/:studentId/progress/xp
```

There is no `/parent/children/:studentId/xp` alias.

## Parent Rewards routes

Base prefix: `/api/v1/parent/children/:studentId/rewards`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Child-visible reward catalog. |
| `GET` | `/:rewardId` | Reward detail. |
| `GET` | `/redemptions` | Child redemptions. |
| `GET` | `/redemptions/:redemptionId` | Child redemption detail. |

Parent Rewards is read-only. Parent cannot redeem rewards in V1.

## Forbidden Parent learning mutations

The backend intentionally does not expose:

- parent task create/submit/review/approve/reject/cancel/complete
- parent homework save/submit
- parent grade/exam mutations
- parent attendance mutation
- parent behavior mutation
- parent discipline mutation
- parent report generation mutation
- parent Hero start/complete/objective-complete
- parent reward redeem/cancel/approve/reject/fulfill
- parent XP grant
- wallet/finance/marketplace/payment behavior

## Safe ids

Intentionally app-safe ids may include route child `studentId`, `taskId`, `stageId`, `submissionId`, `rewardId`, `redemptionId`, `missionId`, `badgeId`, and safe `fileId` where returned as metadata only.
