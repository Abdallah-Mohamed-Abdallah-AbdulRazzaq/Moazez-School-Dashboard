# API Reference

All paths below assume global prefix `/api/v1`.

## Core Reinforcement

| Method | Path |
| --- | --- |
| `GET` | `/reinforcement/filter-options` |
| `GET` | `/reinforcement/tasks` |
| `POST` | `/reinforcement/tasks` |
| `GET` | `/reinforcement/tasks/:taskId` |
| `POST` | `/reinforcement/tasks/:taskId/duplicate` |
| `POST` | `/reinforcement/tasks/:taskId/cancel` |
| `POST` | `/reinforcement/assignments/:assignmentId/stages/:stageId/submit` |
| `GET` | `/reinforcement/review-queue` |
| `GET` | `/reinforcement/review-queue/:submissionId` |
| `POST` | `/reinforcement/review-queue/:submissionId/approve` |
| `POST` | `/reinforcement/review-queue/:submissionId/reject` |

## Core XP

| Method | Path |
| --- | --- |
| `GET` | `/reinforcement/xp/policies` |
| `GET` | `/reinforcement/xp/policies/effective` |
| `POST` | `/reinforcement/xp/policies` |
| `PATCH` | `/reinforcement/xp/policies/:policyId` |
| `GET` | `/reinforcement/xp/ledger` |
| `GET` | `/reinforcement/xp/summary` |
| `POST` | `/reinforcement/xp/grants/reinforcement-review/:submissionId` |
| `POST` | `/reinforcement/xp/grants/manual` |

## Core Rewards

| Method | Path |
| --- | --- |
| `GET` | `/reinforcement/rewards/catalog` |
| `GET` | `/reinforcement/rewards/catalog/:rewardId` |
| `POST` | `/reinforcement/rewards/catalog` |
| `PATCH` | `/reinforcement/rewards/catalog/:rewardId` |
| `POST` | `/reinforcement/rewards/catalog/:rewardId/publish` |
| `POST` | `/reinforcement/rewards/catalog/:rewardId/archive` |
| `GET` | `/reinforcement/rewards/redemptions` |
| `GET` | `/reinforcement/rewards/redemptions/:redemptionId` |
| `POST` | `/reinforcement/rewards/redemptions` |
| `POST` | `/reinforcement/rewards/redemptions/:redemptionId/cancel` |
| `POST` | `/reinforcement/rewards/redemptions/:redemptionId/approve` |
| `POST` | `/reinforcement/rewards/redemptions/:redemptionId/reject` |
| `POST` | `/reinforcement/rewards/redemptions/:redemptionId/fulfill` |

## Core Hero Journey

| Method | Path |
| --- | --- |
| `GET` | `/reinforcement/hero/badges` |
| `GET` | `/reinforcement/hero/badges/:badgeId` |
| `POST` | `/reinforcement/hero/badges` |
| `PATCH` | `/reinforcement/hero/badges/:badgeId` |
| `DELETE` | `/reinforcement/hero/badges/:badgeId` |
| `GET` | `/reinforcement/hero/missions` |
| `GET` | `/reinforcement/hero/missions/:missionId` |
| `POST` | `/reinforcement/hero/missions` |
| `PATCH` | `/reinforcement/hero/missions/:missionId` |
| `POST` | `/reinforcement/hero/missions/:missionId/publish` |
| `POST` | `/reinforcement/hero/missions/:missionId/archive` |
| `DELETE` | `/reinforcement/hero/missions/:missionId` |

## Teacher App Reinforcement

| Method | Path |
| --- | --- |
| `GET` | `/teacher/tasks/dashboard` |
| `GET` | `/teacher/tasks` |
| `GET` | `/teacher/tasks/selectors` |
| `POST` | `/teacher/tasks` |
| `GET` | `/teacher/tasks/:taskId` |
| `GET` | `/teacher/tasks/review-queue` |
| `GET` | `/teacher/tasks/review-queue/:submissionId` |
| `POST` | `/teacher/tasks/review-queue/:submissionId/approve` |
| `POST` | `/teacher/tasks/review-queue/:submissionId/reject` |
| `GET` | `/teacher/xp/dashboard` |
| `GET` | `/teacher/xp/classes/:classId` |
| `GET` | `/teacher/xp/students/:studentId` |
| `GET` | `/teacher/xp/students/:studentId/history` |

## Student App Reinforcement

| Method | Path |
| --- | --- |
| `GET` | `/student/tasks` |
| `GET` | `/student/tasks/summary` |
| `GET` | `/student/tasks/:taskId` |
| `GET` | `/student/tasks/:taskId/submissions` |
| `GET` | `/student/tasks/:taskId/submissions/:submissionId` |
| `POST` | `/student/tasks/:taskId/stages/:stageId/submit` |
| `GET` | `/student/hero` |
| `GET` | `/student/hero/progress` |
| `GET` | `/student/hero/badges` |
| `GET` | `/student/hero/missions` |
| `GET` | `/student/hero/missions/:missionId` |
| `POST` | `/student/hero/missions/:missionId/start` |
| `POST` | `/student/hero/missions/:missionId/complete` |
| `POST` | `/student/hero/missions/:missionId/objectives/:objectiveId/complete` |
| `GET` | `/student/rewards` |
| `GET` | `/student/rewards/:rewardId` |
| `GET` | `/student/rewards/redemptions` |
| `GET` | `/student/rewards/redemptions/:redemptionId` |
| `POST` | `/student/rewards/:rewardId/redeem` |

## Parent App Learning Flow / Reinforcement

| Method | Path |
| --- | --- |
| `GET` | `/parent/children/:studentId/tasks` |
| `GET` | `/parent/children/:studentId/tasks/summary` |
| `GET` | `/parent/children/:studentId/tasks/:taskId` |
| `GET` | `/parent/children/:studentId/tasks/:taskId/submissions` |
| `GET` | `/parent/children/:studentId/tasks/:taskId/submissions/:submissionId` |
| `GET` | `/parent/children/:studentId/progress/xp` |
| `GET` | `/parent/children/:studentId/hero` |
| `GET` | `/parent/children/:studentId/hero/progress` |
| `GET` | `/parent/children/:studentId/hero/badges` |
| `GET` | `/parent/children/:studentId/hero/missions` |
| `GET` | `/parent/children/:studentId/hero/missions/:missionId` |
| `GET` | `/parent/children/:studentId/rewards` |
| `GET` | `/parent/children/:studentId/rewards/:rewardId` |
| `GET` | `/parent/children/:studentId/rewards/redemptions` |
| `GET` | `/parent/children/:studentId/rewards/redemptions/:redemptionId` |
