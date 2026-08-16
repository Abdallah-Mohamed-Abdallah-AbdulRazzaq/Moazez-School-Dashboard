# Reinforcement Module - Frontend Implementation Status

## Summary

| Category | Backend Endpoints | Frontend Implemented | Status |
|----------|:-:|:-:|--------|
| Overview | 3 | 3 | ✅ Complete |
| Tasks | 6 | 6 | ✅ Complete |
| Templates | 2 | 2 | ✅ Complete |
| Reviews | 5 | 0 | ❌ Not started |
| XP | 8 | 7 | ⚠️ Missing 1 |
| Rewards (Catalog + Dashboard + Redemptions) | 16 | 0 | ❌ Not started |
| Hero Journey | 25 | 0 (mock only) | ⚠️ UI exists, no real API |
| **TOTAL** | **65** | **18** | **28% coverage** |

---

## ✅ IMPLEMENTED (18 endpoints with real API calls)

### Overview Module (3/3)
| # | Endpoint | Service Function | Page |
|---|----------|-----------------|------|
| 1 | `GET /reinforcement/overview` | `getReinforcementOverview()` | ReinforcementOverviewPage |
| 2 | `GET /reinforcement/students/:studentId/progress` | `getStudentReinforcementProgress()` | StudentReinforcementProgressPage |
| 3 | `GET /reinforcement/classrooms/:classroomId/summary` | `getClassroomReinforcementSummary()` | ClassroomReinforcementSummaryPage |

### Tasks Module (6/6)
| # | Endpoint | Service Function | Page |
|---|----------|-----------------|------|
| 4 | `GET /reinforcement/filter-options` | `getReinforcementFilterOptions()` | Used in task filters |
| 5 | `GET /reinforcement/tasks` | `listReinforcementTasks()` | ReinforcementTasksPage |
| 6 | `POST /reinforcement/tasks` | `createReinforcementTask()` | ReinforcementTaskCreatePage |
| 7 | `GET /reinforcement/tasks/:taskId` | `getReinforcementTask()` | ReinforcementTaskDetailPage |
| 8 | `POST /reinforcement/tasks/:taskId/duplicate` | `duplicateReinforcementTask()` | Task detail actions |
| 9 | `POST /reinforcement/tasks/:taskId/cancel` | `cancelReinforcementTask()` | Task detail actions |

### Templates Module (2/2)
| # | Endpoint | Service Function | Page |
|---|----------|-----------------|------|
| 10 | `GET /reinforcement/templates` | `listReinforcementTemplates()` | ReinforcementTemplatesPage |
| 11 | `POST /reinforcement/templates` | `createReinforcementTemplate()` | Template create form |

### XP Module (7/8)
| # | Endpoint | Service Function | Page |
|---|----------|-----------------|------|
| 12 | `GET /reinforcement/xp/policies` | `listXpPolicies()` | ReinforcementXpPoliciesPage |
| 13 | `GET /reinforcement/xp/policies/effective` | `getEffectiveXpPolicy()` | Policy detail |
| 14 | `POST /reinforcement/xp/policies` | `createXpPolicy()` | Policy create form |
| 15 | `PATCH /reinforcement/xp/policies/:policyId` | `patchXpPolicy()` | Policy edit |
| 16 | `POST /reinforcement/xp/grants/manual` | `grantManualXp()` | Manual XP grant form |
| 17 | `GET /reinforcement/xp/ledger` | `listXpLedger()` | ReinforcementXpLedgerPage |
| 18 | `GET /reinforcement/xp/summary` | `getXpSummary()` | XP summary widget |

---

## ⚠️ PARTIALLY IMPLEMENTED

### XP Module - Missing 1 endpoint
| # | Endpoint | Status | Notes |
|---|----------|--------|-------|
| 23 | `POST /reinforcement/xp/grants/reinforcement-review/:submissionId` | ❌ | Grant XP after review approval - depends on Reviews module |

### Hero Journey - UI exists but uses MOCK data only
The hero journey has a full UI implementation at `src/features/hero-journey/` with:
- 3 pages: Overview, Missions, Students Progress
- Routes: `/hero-journey`, `/hero-journey/missions`, `/hero-journey/students-progress`
- Components: Charts, detail panels, status pills, pagination
- **BUT**: The service (`heroJourneyService.ts`) uses in-memory mock data, NOT real API calls

| # | Backend Endpoint | Frontend Status |
|---|-----------------|----------------|
| 41 | `GET /reinforcement/hero/badges` | Mock: `getHeroJourneyBadgeCatalog()` |
| 46 | `GET /reinforcement/hero/missions` | Mock: `getHeroJourneyMissions()` |
| 53 | `GET /reinforcement/hero/students/:studentId/progress` | Mock: `getHeroJourneyStudentProgress()` |
| 61 | `GET /reinforcement/hero/overview` | Mock: `getHeroJourneyOverview()` |
| All others | Hero CRUD, progress, rewards, dashboard | ❌ No mock or real implementation |

---

## ❌ NOT IMPLEMENTED (47 endpoints)

### Reviews Module (5 endpoints) - No frontend at all
| # | Endpoint | Notes |
|---|----------|-------|
| 12 | `POST /reinforcement/assignments/:assignmentId/stages/:stageId/submit` | Student submits proof |
| 13 | `GET /reinforcement/review-queue` | Teacher review queue list |
| 14 | `GET /reinforcement/review-queue/:submissionId` | Review item detail |
| 15 | `POST /reinforcement/review-queue/:submissionId/approve` | Approve submission |
| 16 | `POST /reinforcement/review-queue/:submissionId/reject` | Reject submission |

### Rewards - Catalog (6 endpoints) - No frontend at all
| # | Endpoint | Notes |
|---|----------|-------|
| 25 | `GET /reinforcement/rewards/catalog` | List reward items |
| 26 | `GET /reinforcement/rewards/catalog/:rewardId` | Get single reward |
| 27 | `POST /reinforcement/rewards/catalog` | Create reward item |
| 28 | `PATCH /reinforcement/rewards/catalog/:rewardId` | Update reward item |
| 29 | `POST /reinforcement/rewards/catalog/:rewardId/publish` | Publish reward |
| 30 | `POST /reinforcement/rewards/catalog/:rewardId/archive` | Archive reward |

### Rewards - Dashboard (3 endpoints) - No frontend at all
| # | Endpoint | Notes |
|---|----------|-------|
| 31 | `GET /reinforcement/rewards/overview` | Rewards overview stats |
| 32 | `GET /reinforcement/rewards/students/:studentId/summary` | Student rewards summary |
| 33 | `GET /reinforcement/rewards/catalog-summary` | Catalog summary stats |

### Rewards - Redemptions (7 endpoints) - No frontend at all
| # | Endpoint | Notes |
|---|----------|-------|
| 34 | `GET /reinforcement/rewards/redemptions` | List redemption requests |
| 35 | `GET /reinforcement/rewards/redemptions/:redemptionId` | Get redemption detail |
| 36 | `POST /reinforcement/rewards/redemptions` | Create redemption request |
| 37 | `POST /reinforcement/rewards/redemptions/:redemptionId/cancel` | Cancel redemption |
| 38 | `POST /reinforcement/rewards/redemptions/:redemptionId/approve` | Approve redemption |
| 39 | `POST /reinforcement/rewards/redemptions/:redemptionId/reject` | Reject redemption |
| 40 | `POST /reinforcement/rewards/redemptions/:redemptionId/fulfill` | Fulfill redemption |

### Hero Journey - Badges CRUD (5 endpoints) - No real API
| # | Endpoint | Notes |
|---|----------|-------|
| 41 | `GET /reinforcement/hero/badges` | List badges |
| 42 | `GET /reinforcement/hero/badges/:badgeId` | Get badge detail |
| 43 | `POST /reinforcement/hero/badges` | Create badge |
| 44 | `PATCH /reinforcement/hero/badges/:badgeId` | Update badge |
| 45 | `DELETE /reinforcement/hero/badges/:badgeId` | Delete badge |

### Hero Journey - Missions CRUD (7 endpoints) - No real API
| # | Endpoint | Notes |
|---|----------|-------|
| 46 | `GET /reinforcement/hero/missions` | List missions |
| 47 | `GET /reinforcement/hero/missions/:missionId` | Get mission detail |
| 48 | `POST /reinforcement/hero/missions` | Create mission |
| 49 | `PATCH /reinforcement/hero/missions/:missionId` | Update mission |
| 50 | `POST /reinforcement/hero/missions/:missionId/publish` | Publish mission |
| 51 | `POST /reinforcement/hero/missions/:missionId/archive` | Archive mission |
| 52 | `DELETE /reinforcement/hero/missions/:missionId` | Delete mission |

### Hero Journey - Progress (5 endpoints) - No real API
| # | Endpoint | Notes |
|---|----------|-------|
| 53 | `GET /reinforcement/hero/students/:studentId/progress` | Student progress list |
| 54 | `GET /reinforcement/hero/progress/:progressId` | Progress detail |
| 55 | `POST /reinforcement/hero/students/:studentId/missions/:missionId/start` | Start mission |
| 56 | `POST /reinforcement/hero/progress/:progressId/objectives/:objectiveId/complete` | Complete objective |
| 57 | `POST /reinforcement/hero/progress/:progressId/complete` | Complete mission |

### Hero Journey - Rewards (3 endpoints) - No real API
| # | Endpoint | Notes |
|---|----------|-------|
| 58 | `POST /reinforcement/hero/progress/:progressId/grant-xp` | Grant XP for mission |
| 59 | `POST /reinforcement/hero/progress/:progressId/award-badge` | Award badge |
| 60 | `GET /reinforcement/hero/students/:studentId/rewards` | Student hero rewards |

### Hero Journey - Dashboard (5 endpoints) - No real API
| # | Endpoint | Notes |
|---|----------|-------|
| 61 | `GET /reinforcement/hero/overview` | Hero overview dashboard |
| 62 | `GET /reinforcement/hero/map` | Hero map visualization |
| 63 | `GET /reinforcement/hero/stages/:stageId/summary` | Stage summary |
| 64 | `GET /reinforcement/hero/classrooms/:classroomId/summary` | Classroom summary |
| 65 | `GET /reinforcement/hero/badge-summary` | Badge summary stats |

---

## Frontend Routes & Navigation

### Existing Routes (with real API)
| Route | Page | Status |
|-------|------|--------|
| `/reinforcement` | Overview dashboard | ✅ Real API |
| `/reinforcement/templates` | Templates list + create | ✅ Real API |
| `/reinforcement/tasks` | Tasks list | ✅ Real API |
| `/reinforcement/tasks/new` | Create task | ✅ Real API |
| `/reinforcement/tasks/[taskId]` | Task detail | ✅ Real API |
| `/reinforcement/xp/policies` | XP policies list + CRUD | ✅ Real API |
| `/reinforcement/xp/ledger` | XP ledger list | ✅ Real API |
| `/reinforcement/students/[studentId]/progress` | Student progress | ✅ Real API |
| `/reinforcement/classrooms/[classroomId]/summary` | Classroom summary | ✅ Real API |

### Existing Routes (mock data only)
| Route | Page | Status |
|-------|------|--------|
| `/hero-journey` | Hero overview | ⚠️ Mock data |
| `/hero-journey/missions` | Missions list | ⚠️ Mock data |
| `/hero-journey/students-progress` | Students progress | ⚠️ Mock data |

### Missing Routes (no frontend pages)
| Route Needed | For Module |
|-------------|-----------|
| `/reinforcement/reviews` | Review queue list |
| `/reinforcement/reviews/[submissionId]` | Review item detail |
| `/reinforcement/rewards` | Rewards overview |
| `/reinforcement/rewards/catalog` | Reward catalog CRUD |
| `/reinforcement/rewards/redemptions` | Redemption requests |
| `/reinforcement/rewards/redemptions/[redemptionId]` | Redemption detail |

### Missing Sidebar Navigation Items
Currently the sidebar has: Overview, Templates, Tasks, XP Policies, XP Ledger.

**Missing:**
- Reviews (review queue)
- Rewards (catalog + redemptions)
- Hero Journey link (exists as separate top-level nav but uses mocks)

---

## Priority Recommendations

### High Priority (core teacher workflow)
1. **Reviews Module** - Teachers need to review student submissions
2. **XP Grant for Review** - Auto-grant XP when approving submissions

### Medium Priority (reward system)
3. **Rewards Catalog** - CRUD for reward items
4. **Rewards Redemptions** - Student redemption workflow
5. **Rewards Dashboard** - Overview stats

### Lower Priority (hero journey real API integration)
6. **Hero Journey API Integration** - Replace mock service with real API calls
   - The UI already exists, just needs service layer swap
