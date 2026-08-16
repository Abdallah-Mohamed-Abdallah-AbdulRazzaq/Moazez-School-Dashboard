# Sprint 26 Changelog: Reinforcement to Learning Flow

This file summarizes the implementation sequence from the Reinforcement contract lock to the current Learning Flow handoff baseline.

## 26A - Reinforcement Completion Decision & Contract Lock

Commit: `d46b19e2fe249197b68402a5789b376ebdfadb25`

Status: `PASS`.

Runtime changes: none.

Locked decisions:

- Target final status: `V1_READY_FULL_APP_CONTRACT`.
- Reinforcement core remains source of truth for tasks, assignments, stages, submissions, reviews, and templates.
- `XpLedger` is the only XP source.
- Behavior points are not XP.
- Hero Journey core owns missions/objectives/progress/badges.
- Rewards core owns reward catalog and redemption workflow.
- Teacher/Student/Parent modules are app-facing adapters, not new persistence owners.
- Proof responses must expose safe file metadata only.

## 26B - Reinforcement Core Policy Hardening

Status: `PASS`.

Runtime changes:

- Reward input normalization hardened so explicit `none` means no reward.
- Manual XP bonus grant requires a stable `sourceId` or `dedupeKey` for idempotency.
- Proof file response safety was verified.

Key result:

- Core family status became `CORE_HARDENED`.

## 26C - Teacher Tasks / Reviews / XP Completion

Status: `PASS`.

Runtime changes:

- Teacher task reward selector exposes approved reward options: `none`, `moral`, `financial`, `points`, `xp`.
- Teacher task creation remains core-delegated and teacher-owned.
- Review queue is `submissionId`-based.
- Teacher XP center remains read-only and `XpLedger`-backed.

Deferred:

- Teacher manual XP bonus route remains deferred pending explicit product/permission decision.

## 26D - Student Task Submission

Status: `PASS`.

Runtime changes:

- Added `POST /api/v1/student/tasks/:taskId/stages/:stageId/submit`.
- Student App resolves current student assignment server-side from `taskId` and current student context.
- Supports `proofText` and/or `proofFileId` within validation boundaries.
- Delegates to core `SubmitReinforcementStageUseCase`.

No side effects:

- Does not grant XP.
- Does not create reward redemptions.
- Does not mutate Hero Journey progress.
- Does not touch Behavior points.

## 26E - Student Hero Actions

Status: `PASS`.

Runtime changes:

- Added Student Hero start mission route.
- Added Student Hero complete mission route.
- Added Student Hero complete objective route.
- All actions validate current student visibility/ownership and delegate to Hero Journey core.

No side effects in current path:

- Start/objective/complete do not create `RewardRedemption`.
- They do not write Behavior points.
- They do not directly grant XP in the Student App adapter.

## 26F - Student Rewards / Redemptions

Status: `PASS`.

Runtime changes:

- Added Student reward catalog routes.
- Added Student redemption read routes.
- Added Student self-redemption mutation.
- Redemption delegates to Rewards core.

Important policy:

- Redemption does not spend XP in V1.
- `minTotalXp` is an eligibility threshold.
- Affordability is calculated from positive `XpLedger` amount only.
- Duplicate open redemption returns a core conflict.

## 26G - Parent Hero / XP / Rewards Reads

Status: `PASS`.

Runtime changes:

- Added Parent child Hero read routes.
- Added Parent child Rewards and Redemption read routes.
- Existing Parent XP route remains under `/parent/children/:studentId/progress/xp`.

Important policy:

- Parent routes are read-only.
- Parent cannot start hero missions, complete objectives, redeem rewards, or grant XP.
- Parent can only read linked-child data.

## 26H - Parent Task / Reinforcement Reads

Status: `PASS`.

Runtime changes:

- Hardened existing Parent task read responses.
- Removed internal enrollment/assignment ids from Parent task reinforcement responses.
- Added explicit stage/submission progress fields.
- Proof file metadata remains safe and does not include download URLs.

Deferred:

- Parent proof download until a parent-authorized file download contract is approved.
- Parent task mutations.

## 26I - Parent Learning Flow Final Closeout

Status: `PASS`.

Runtime changes:

- Minimal hardening: Parent profile guardian summaries no longer select/expose `guardianId`.
- Parent learning route inventory, no-leak checks, and forbidden mutation coverage were finalized.

Result:

- Parent Learning Flow status: `PARENT_LEARNING_FLOW_BACKEND_READY`.

## 26J - Learning Flow Frontend Contract Handoff

Status: `PASS`.

Runtime changes: none.

Result:

- Handoff status: `LEARNING_FLOW_FRONTEND_CONTRACT_READY_WITH_DEFERRED_ITEMS`.
- Frontend integration can proceed if it follows documented route boundaries, app roles, safe response rules, and deferred item list.
