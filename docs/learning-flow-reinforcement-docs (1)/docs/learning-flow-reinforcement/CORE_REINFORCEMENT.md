# Core Reinforcement

Core Reinforcement is the dashboard/admin source of truth for tasks, templates, reviews, and submissions.

## Route groups

Base prefix: `/api/v1`.

### Core task routes

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/reinforcement/filter-options` | Dashboard filter options. | `reinforcement.tasks.view` |
| `GET` | `/reinforcement/tasks` | List reinforcement tasks. | `reinforcement.tasks.view` |
| `POST` | `/reinforcement/tasks` | Create a reinforcement task. | `reinforcement.tasks.manage` |
| `GET` | `/reinforcement/tasks/:taskId` | Get task detail. | `reinforcement.tasks.view` |
| `POST` | `/reinforcement/tasks/:taskId/duplicate` | Duplicate task metadata/assignment graph. | `reinforcement.tasks.manage` |
| `POST` | `/reinforcement/tasks/:taskId/cancel` | Cancel task. | `reinforcement.tasks.manage` |

### Core review/submission routes

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `POST` | `/reinforcement/assignments/:assignmentId/stages/:stageId/submit` | Submit a stage for an assignment through core. | `reinforcement.tasks.manage` |
| `GET` | `/reinforcement/review-queue` | List review queue. | `reinforcement.reviews.view` |
| `GET` | `/reinforcement/review-queue/:submissionId` | Get review item. | `reinforcement.reviews.view` |
| `POST` | `/reinforcement/review-queue/:submissionId/approve` | Approve submission. | `reinforcement.reviews.manage` |
| `POST` | `/reinforcement/review-queue/:submissionId/reject` | Reject submission. | `reinforcement.reviews.manage` |

## Task reward metadata

Supported teacher/app-facing reward semantics:

| Reward type | Meaning |
| --- | --- |
| `none` | No reward. |
| `moral` | Display reward. |
| `points` | Display/moral points unless product changes policy. |
| `financial` | Display-only; not finance or wallet. |
| `xp` | Task metadata only unless an explicit XP grant flow runs. |

## Core hardening from Sprint 26B

- Explicit `none` maps to no reward.
- Manual XP grants require `sourceId` or `dedupeKey`.
- Task duplication does not duplicate runtime state such as submissions, reviews, XP ledger entries, redemptions, or audit history.
- Cancelled tasks are excluded by default unless explicitly requested.
- Proof file responses remain safe metadata only.

## Important non-side-effects

Core task creation or app task creation does not automatically:

- create `XpLedger` rows
- create `RewardRedemption` rows
- mutate Hero Journey state
- convert Behavior points to XP
- create wallet/finance/payment state
