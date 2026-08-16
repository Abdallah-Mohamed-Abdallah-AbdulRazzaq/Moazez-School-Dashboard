# Core XP

XP is implemented as a core Reinforcement subdomain backed by `XpLedger`.

## Route group

Base prefix: `/api/v1/reinforcement/xp`.

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/policies` | List XP policies. | `reinforcement.xp.view` |
| `GET` | `/policies/effective` | Resolve effective XP policy. | `reinforcement.xp.view` |
| `POST` | `/policies` | Create XP policy. | `reinforcement.xp.manage` |
| `PATCH` | `/policies/:policyId` | Update XP policy. | `reinforcement.xp.manage` |
| `GET` | `/ledger` | List XP ledger entries. | `reinforcement.xp.view` |
| `GET` | `/summary` | XP summary. | `reinforcement.xp.view` |
| `POST` | `/grants/reinforcement-review/:submissionId` | Grant XP for reviewed reinforcement submission. | `reinforcement.xp.manage` |
| `POST` | `/grants/manual` | Manual XP grant. | `reinforcement.xp.manage` |

## XP source rule

Only `XpLedger` is XP.

Not XP:

- Behavior points.
- Reward min XP thresholds.
- Task display points.
- Hero mission display rewards.
- Parent or Teacher summary fields not backed by `XpLedger`.

## Manual XP grant hardening

Sprint 26B hardened manual XP grants:

- A stable `sourceId` or `dedupeKey` is required.
- Missing idempotency key rejects before ledger creation.
- Duplicate manual grants return existing ledger entry instead of creating duplicates.

## Teacher App XP

Teacher App XP routes are read-only:

- `/api/v1/teacher/xp/dashboard`
- `/api/v1/teacher/xp/classes/:classId`
- `/api/v1/teacher/xp/students/:studentId`
- `/api/v1/teacher/xp/students/:studentId/history`

Teacher manual XP bonus grant is deferred because it needs explicit Teacher App permission/product policy.

## Student and Parent XP

Student and Parent XP summaries derive from `XpLedger` only. Parent XP remains under:

- `GET /api/v1/parent/children/:studentId/progress/xp`

No parent XP grant route exists.
