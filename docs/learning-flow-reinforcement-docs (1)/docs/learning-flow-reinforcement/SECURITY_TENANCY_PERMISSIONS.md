# Security, Tenancy, and Permissions

## Dashboard/Core permissions

Core Reinforcement routes are permission-gated by seeded permission codes:

| Permission | Purpose |
| --- | --- |
| `reinforcement.overview.view` | View reinforcement overview metrics. |
| `reinforcement.tasks.view` | View reinforcement tasks. |
| `reinforcement.tasks.manage` | Create/update/cancel/duplicate reinforcement tasks. |
| `reinforcement.templates.view` | View task templates. |
| `reinforcement.templates.manage` | Manage task templates. |
| `reinforcement.reviews.view` | View review queue/history. |
| `reinforcement.reviews.manage` | Approve/reject submissions. |
| `reinforcement.xp.view` | View XP policy/ledger/summary. |
| `reinforcement.xp.manage` | Manage XP policies and grants. |
| `reinforcement.hero.view` | View Hero Journey mission/overview data. |
| `reinforcement.hero.manage` | Manage Hero Journey missions. |
| `reinforcement.hero.progress.view` | View Hero Journey progress. |
| `reinforcement.hero.progress.manage` | Manage Hero Journey progress. |
| `reinforcement.hero.badges.view` | View badge catalog. |
| `reinforcement.hero.badges.manage` | Manage badge catalog. |
| `reinforcement.rewards.view` | View reward catalog. |
| `reinforcement.rewards.manage` | Manage reward catalog. |
| `reinforcement.rewards.redemptions.view` | View redemptions. |
| `reinforcement.rewards.redemptions.request` | Create/cancel redemption requests. |
| `reinforcement.rewards.redemptions.review` | Approve/reject redemptions. |
| `reinforcement.rewards.fulfill` | Fulfill approved redemptions. |

## App-facing boundaries

### Teacher App

Teacher routes rely on teacher actor + ownership checks, not broad dashboard permissions. Teacher visibility is based on teacher-owned allocations and owned students.

### Student App

Student routes use the authenticated current student context. Student App routes must resolve `studentId`, enrollment, academic year, and term server-side. Clients must not provide identity overrides.

### Parent App

Parent routes use linked-child validation. Parent must pass route `:studentId`, then backend validates ownership through Guardian/StudentGuardian/enrollment context.

## Tenancy protections

The implementation relies on school-scoped Prisma access and ownership-specific adapters. Safety expectations:

- Cross-school ids are hidden or rejected safely.
- Same-school non-owner ids are hidden/rejected depending on route semantics.
- Wrong actor roles receive 403 where the role boundary is safe to disclose.
- Parent unlinked child data returns safe not-found behavior.
- Student cannot submit another student's task or redeem another student's reward.
- Teacher cannot access unowned class allocation/student reinforcement data.

## No-leak response rule

App-facing responses must not expose:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `guardianId`
- `parentId`
- `studentGuardianId`
- internal `enrollmentId` except where explicitly app-safe in legacy/current wrappers
- internal `assignmentId` except where explicitly app-safe on existing Student routes
- `createdById`, `updatedById`, `submittedById`, `reviewedById`, `approvedById`, `rejectedById`, `awardedById`, `requestedById`, `fulfilledById`, `cancelledById`
- `deletedAt`
- `passwordHash`
- XP ledger internals
- reward redemption internals
- raw metadata
- storage internals

## Idempotency and duplicate protection

- Manual XP grants require stable idempotency via `sourceId` or `dedupeKey`.
- Review XP grants use submission/student/source semantics to prevent duplicates.
- Student Hero start is idempotent/safe.
- Duplicate completed Hero action returns core conflict/safe state error.
- Duplicate open Student reward redemption returns conflict.
