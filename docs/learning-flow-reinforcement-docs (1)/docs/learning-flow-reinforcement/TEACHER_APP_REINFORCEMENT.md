# Teacher App Reinforcement

Teacher App Reinforcement is teacher-allocation scoped. In teacher task and XP contexts, `classId` means `TeacherSubjectAllocation.id` where the route contract uses allocation context.

## Teacher task routes

Base prefix: `/api/v1/teacher/tasks`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/dashboard` | Teacher task dashboard. |
| `GET` | `/` | List Teacher App reinforcement tasks. |
| `GET` | `/selectors` | Owned class/student selector data. |
| `POST` | `/` | Create teacher reinforcement task. |
| `GET` | `/:taskId` | Get teacher-visible task detail. |

## Teacher review queue routes

Base prefix: `/api/v1/teacher/tasks/review-queue`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | List visible submissions for review. |
| `GET` | `/:submissionId` | Get one review submission. |
| `POST` | `/:submissionId/approve` | Approve owned visible submission. |
| `POST` | `/:submissionId/reject` | Reject owned visible submission. |

Important: review queue identity is `submissionId`, not `taskId + stageId`.

## Teacher XP routes

Base prefix: `/api/v1/teacher/xp`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/dashboard` | Teacher-owned XP dashboard. |
| `GET` | `/classes/:classId` | XP list for owned class/allocation. |
| `GET` | `/students/:studentId` | Owned student XP summary. |
| `GET` | `/students/:studentId/history` | Owned student XP history. |

## Ownership rules

Teacher App validates:

- current actor is a teacher
- active school membership
- owned `TeacherSubjectAllocation`
- selected students belong to owned allocations
- same-school but unowned resources are not available
- cross-school resources are hidden

## Teacher task create behavior

Teacher task creation:

- validates owned class allocation ids
- validates selected student ids against owned classes
- derives academic year, term, subject, classroom, and hierarchy server-side
- treats `subjectName` as display-only
- delegates to core `CreateReinforcementTaskUseCase`
- does not add Teacher-owned task persistence

## Reward selector contract

Teacher task reward options:

- `none`
- `moral`
- `financial`
- `points`
- `xp`

`financial` is display-only; no finance/wallet/marketplace behavior. `xp` is task metadata; no XP ledger grant occurs from task creation.

## Deferred

Teacher manual XP bonus route remains deferred. Do not call or render:

```http
POST /api/v1/teacher/xp/students/:studentId/grants/manual
```

A future implementation requires explicit product/permission policy, ownership checks, caps/cooldowns, audit, and idempotency through core `GrantManualXpUseCase`.
