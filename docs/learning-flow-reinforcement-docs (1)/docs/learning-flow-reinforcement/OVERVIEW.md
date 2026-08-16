# Overview

The current Learning Flow implementation is a composed backend feature family built from several source-of-truth modules and app-facing adapters.

The important architectural rule is that app modules do not own the Reinforcement state machine. They adapt and compose backend-native source data for Teacher, Student, and Parent surfaces.

## Main source-of-truth modules

| Domain | Source of truth | Notes |
| --- | --- | --- |
| Reinforcement tasks | Core Reinforcement | Owns tasks, assignments, stages, submissions, reviews, and templates. |
| XP | `XpLedger` | Only XP source. Behavior points are not XP. |
| Rewards | Reinforcement Rewards core | Owns catalog, redemptions, review, cancellation, and fulfillment. |
| Hero Journey | Reinforcement Hero Journey core | Owns missions, objectives, progress, and badges. |
| Files/proofs | Files module + Reinforcement submission links | Proof responses expose safe metadata only. |
| Teacher App | Adapter layer | Teacher-owned allocation/task/review/XP views and selected mutations. |
| Student App | Adapter layer | Current-student tasks, submissions, hero actions, rewards, and progress. |
| Parent App | Adapter layer | Linked-child read-only learning flow. |

## Current implementation posture

Learning Flow is frontend-contract ready with deferred items. The implemented backend is safe for frontend integration if frontend respects the stable `/api/v1` routes, role-specific route boundaries, and documented deferred items.

## What changed after the Reinforcement contract lock

The starting point `d46b19e2` locked the target contract and source-of-truth rules. After that point, the backend moved through targeted closeout sprints:

- Core policy hardening for reward normalization, manual XP idempotency, and proof no-leak verification.
- Teacher Reinforcement completion for teacher tasks, review queue, reward selector, and XP reads.
- Student task-stage submission.
- Student Hero start/complete/objective-complete actions.
- Student rewards catalog, redemption reads, and self-redemption mutation.
- Parent Hero/XP/Rewards read models.
- Parent task/reinforcement read hardening.
- Parent Learning Flow final closeout.
- Learning Flow frontend contract handoff and deferred decision lock.

## Not a wallet/economy platform

Rewards are school reward workflows only. No wallet, finance, payment, marketplace, cash accounting, or XP spend/debit behavior is implemented in V1.
