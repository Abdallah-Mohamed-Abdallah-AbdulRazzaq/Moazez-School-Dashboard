# Frontend Handoff

## Integration readiness

Learning Flow frontend contract status is `LEARNING_FLOW_FRONTEND_CONTRACT_READY_WITH_DEFERRED_ITEMS`.

Frontend can integrate safely if it follows the implemented route boundaries and does not invent deferred behavior.

## Global rules

- Always use `/api/v1`.
- Use bearer auth for the current actor.
- Keep role tokens separated: Student tokens call `/student`, Parent tokens call `/parent`, Teacher tokens call `/teacher`.
- Do not reuse one actor's token against another app surface.
- Treat backend status fields as source of truth.
- Treat backend errors as state machine authority.
- Do not duplicate task/review/hero/reward/XP logic client-side.
- Handle 404 as hidden/not available where resource existence must not leak.
- Handle 409 as duplicate/conflict/state transition failure.

## Student UI guidance

Student can:

- read tasks
- submit task stage proof
- start Hero missions
- complete Hero objectives/missions
- read rewards
- request reward redemption
- read XP/progress

Student cannot:

- approve/reject tasks
- grant XP
- redeem for another student
- mutate parent/teacher/dashboard routes
- spend XP as currency

## Teacher UI guidance

Teacher can:

- create owned reinforcement tasks
- list/select owned classes/students
- view task dashboard/list/detail
- review visible submissions by `submissionId`
- approve/reject visible submissions
- read XP dashboard/class/student/history

Teacher cannot currently:

- manually grant XP bonus through Teacher App
- use `taskId + stageId` for review actions
- treat `classId` as raw `Classroom.id` in teacher reinforcement/XP routes when allocation id is expected

## Parent UI guidance

Parent can:

- select a linked child
- read child tasks/submissions
- read child Hero data
- read child XP progress
- read child rewards/redemptions
- read child grades/homework/discipline/reports

Parent cannot:

- submit tasks
- approve/reject tasks
- upload proof
- download proof yet
- start/complete Hero missions
- redeem rewards
- grant XP
- mutate grades/homeworks/attendance/behavior/discipline/reports

## Reward wording guidance

Use school reward wording. Avoid:

- wallet
- cash
- payment
- marketplace
- balance spend
- XP debit

## Deferred item UX

Do not render controls for deferred features unless the backend route exists and product approves the behavior.
