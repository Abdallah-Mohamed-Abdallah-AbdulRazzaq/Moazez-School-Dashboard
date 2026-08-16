# Source-of-Truth Boundaries

The Learning Flow must be understood as a composition of domain owners, not a monolithic module.

## Reinforcement tasks

Core Reinforcement owns:

- task creation and duplication
- task cancellation
- assignments
- stages
- submissions
- review queue
- approval/rejection
- templates
- reward metadata attached to tasks

Teacher, Student, and Parent apps consume or delegate to this core. They do not add independent task persistence.

## XP

`XpLedger` is the only source of truth for XP.

Valid XP flows include:

- core review XP grant
- manual XP grant via dashboard/core XP route with idempotency keys
- app-facing XP summaries derived from `XpLedger`

Invalid assumptions:

- Behavior points are not XP.
- Reward redemption does not spend XP in V1.
- Student task submission does not grant XP automatically.
- Student Hero actions do not directly grant XP in the current app adapter path.

## Rewards

Rewards core owns:

- reward catalog items
- publish/archive lifecycle
- redemption requests
- redemption cancellation
- redemption approval/rejection
- fulfillment

Student App can request self-redemption. Parent App can read child rewards/redemptions only. Teacher App task reward selection is display/task metadata only.

## Hero Journey

Hero Journey core owns:

- badge catalog
- missions
- objectives
- mission publish/archive/delete
- mission progress
- objective completion
- mission completion

Student App can start/complete own visible missions and complete own objectives through core adapters. Parent App can only read linked-child Hero data.

## Files and proofs

Proofs are stored/linked through core submission flows and Files ownership rules. App-facing responses expose safe metadata only:

- `fileId` / `id`
- `filename` / `originalName`
- `mimeType`
- `size` / `sizeBytes`
- `visibility`
- `createdAt`

Forbidden fields:

- `bucket`
- `objectKey`
- `storageKey`
- raw storage metadata
- signed URL
- unsafe storage URL

## App adapters

App modules are adapters:

| Surface | Adapter role |
| --- | --- |
| Teacher App | Teacher-owned tasks, review queue, XP reads. |
| Student App | Current-student tasks, submissions, hero actions, rewards. |
| Parent App | Linked-child read-only learning flow. |

App adapters may reshape responses but must not redefine domain state machines.
