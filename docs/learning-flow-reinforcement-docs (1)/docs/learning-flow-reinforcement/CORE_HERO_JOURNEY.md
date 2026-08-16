# Core Hero Journey

Hero Journey core owns badges, missions, objectives, mission progress, and lifecycle.

## Dashboard/Core Hero routes

Base prefix: `/api/v1/reinforcement/hero`.

### Badge catalog

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/badges` | List badges. | `reinforcement.hero.badges.view` |
| `GET` | `/badges/:badgeId` | Get badge. | `reinforcement.hero.badges.view` |
| `POST` | `/badges` | Create badge. | `reinforcement.hero.badges.manage` |
| `PATCH` | `/badges/:badgeId` | Update badge. | `reinforcement.hero.badges.manage` |
| `DELETE` | `/badges/:badgeId` | Delete badge. | `reinforcement.hero.badges.manage` |

### Missions

| Method | Route | Purpose | Permission |
| --- | --- | --- | --- |
| `GET` | `/missions` | List missions. | `reinforcement.hero.view` |
| `GET` | `/missions/:missionId` | Get mission. | `reinforcement.hero.view` |
| `POST` | `/missions` | Create mission. | `reinforcement.hero.manage` |
| `PATCH` | `/missions/:missionId` | Update mission. | `reinforcement.hero.manage` |
| `POST` | `/missions/:missionId/publish` | Publish mission. | `reinforcement.hero.manage` |
| `POST` | `/missions/:missionId/archive` | Archive mission. | `reinforcement.hero.manage` |
| `DELETE` | `/missions/:missionId` | Delete mission. | `reinforcement.hero.manage` |

Additional core Hero controllers also exist for dashboard/progress/rewards as part of Hero Journey core.

## Student Hero actions

Student App exposes current-student mutation adapters:

- `POST /api/v1/student/hero/missions/:missionId/start`
- `POST /api/v1/student/hero/missions/:missionId/complete`
- `POST /api/v1/student/hero/missions/:missionId/objectives/:objectiveId/complete`

These adapters validate current-student context and visible mission/progress ownership, then delegate to Hero Journey core.

## Side-effect policy

Current Student Hero app action path does not directly:

- grant XP
- award badge
- create reward redemption
- mutate wallet/payment state
- create Behavior points

If future core Hero use-cases add XP/badge/reward side effects, those side effects must remain core-owned, audited, and idempotent.

## Parent Hero

Parent Hero is read-only:

- Parent can read linked child Hero overview, progress, missions, mission detail, and badges.
- Parent cannot start missions, complete missions, or complete objectives.
