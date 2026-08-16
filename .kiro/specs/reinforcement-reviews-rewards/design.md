# Design: Reinforcement Reviews & Rewards Modules

## Architecture Overview

The implementation follows the established patterns in `src/features/reinforcement/`:
- **Services** → thin wrappers around `apiGet`/`apiPost`/`apiPatch` using shared utils
- **Types** → centralized in `types.ts` at feature root
- **Pages** → "use client" components with permission checks, filters, tables, modals
- **Routes** → Next.js App Router under `src/app/[lang]/(dashboard)/reinforcement/`

---

## File Structure

```
src/features/reinforcement/
├── services/
│   ├── reinforcementReviewsService.ts    (NEW)
│   ├── rewardCatalogService.ts           (NEW)
│   ├── rewardRedemptionsService.ts       (NEW)
│   └── rewardDashboardService.ts         (NEW)
├── pages/
│   ├── ReinforcementReviewQueuePage.tsx  (NEW)
│   ├── ReinforcementReviewDetailPage.tsx (NEW)
│   ├── RewardsOverviewPage.tsx           (NEW)
│   ├── RewardCatalogPage.tsx             (NEW)
│   └── RewardRedemptionsPage.tsx         (NEW)
├── components/
│   ├── ReinforcementReviewTable.tsx      (NEW)
│   ├── ReinforcementReviewDetailCard.tsx (NEW)
│   ├── ReinforcementReviewActionModal.tsx(NEW)
│   ├── RewardCatalogTable.tsx            (NEW)
│   ├── RewardCatalogFormModal.tsx        (NEW)
│   ├── RewardRedemptionTable.tsx         (NEW)
│   ├── RewardRedemptionActionModal.tsx   (NEW)
│   └── RewardsKpiCards.tsx               (NEW)
├── types.ts                              (MODIFIED - add review & reward types)
└── config/
    └── reinforcementTabs.ts              (MODIFIED - add tabs)

src/app/[lang]/(dashboard)/reinforcement/
├── reviews/
│   ├── page.tsx                          (NEW)
│   └── [submissionId]/
│       └── page.tsx                      (NEW)
└── rewards/
    ├── page.tsx                          (NEW)
    ├── catalog/
    │   └── page.tsx                      (NEW)
    └── redemptions/
        └── page.tsx                      (NEW)

src/config/navigation.ts                  (MODIFIED - add nav items)
```

---

## Service Layer Design

### Pattern (same as existing services)
```typescript
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { buildReinforcementQueryString, unwrapReinforcementItemResponse, unwrapReinforcementListResponse } from "./reinforcementApiUtils";

const ENDPOINT = "/reinforcement/...";

export async function listItems(params?: ListParams): Promise<ListResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${ENDPOINT}${query}`);
  return unwrapReinforcementListResponse<ItemType>(response);
}
```

### Reviews Service Functions
| Function | Method | Endpoint |
|----------|--------|----------|
| `submitReinforcementStage(assignmentId, stageId, payload)` | POST | `/reinforcement/assignments/:assignmentId/stages/:stageId/submit` |
| `listReinforcementReviewQueue(params)` | GET | `/reinforcement/review-queue` |
| `getReinforcementReviewItem(submissionId)` | GET | `/reinforcement/review-queue/:submissionId` |
| `approveReinforcementSubmission(submissionId, payload)` | POST | `/reinforcement/review-queue/:submissionId/approve` |
| `rejectReinforcementSubmission(submissionId, payload)` | POST | `/reinforcement/review-queue/:submissionId/reject` |

### Reward Catalog Service Functions
| Function | Method | Endpoint |
|----------|--------|----------|
| `listRewardCatalog(params)` | GET | `/reinforcement/rewards/catalog` |
| `getRewardCatalogItem(rewardId)` | GET | `/reinforcement/rewards/catalog/:rewardId` |
| `createRewardCatalogItem(payload)` | POST | `/reinforcement/rewards/catalog` |
| `updateRewardCatalogItem(rewardId, payload)` | PATCH | `/reinforcement/rewards/catalog/:rewardId` |
| `publishRewardCatalogItem(rewardId)` | POST | `/reinforcement/rewards/catalog/:rewardId/publish` |
| `archiveRewardCatalogItem(rewardId, payload)` | POST | `/reinforcement/rewards/catalog/:rewardId/archive` |

### Reward Redemptions Service Functions
| Function | Method | Endpoint |
|----------|--------|----------|
| `listRewardRedemptions(params)` | GET | `/reinforcement/rewards/redemptions` |
| `getRewardRedemption(redemptionId)` | GET | `/reinforcement/rewards/redemptions/:redemptionId` |
| `createRewardRedemption(payload)` | POST | `/reinforcement/rewards/redemptions` |
| `cancelRewardRedemption(redemptionId, payload)` | POST | `/reinforcement/rewards/redemptions/:redemptionId/cancel` |
| `approveRewardRedemption(redemptionId, payload)` | POST | `/reinforcement/rewards/redemptions/:redemptionId/approve` |
| `rejectRewardRedemption(redemptionId, payload)` | POST | `/reinforcement/rewards/redemptions/:redemptionId/reject` |
| `fulfillRewardRedemption(redemptionId, payload)` | POST | `/reinforcement/rewards/redemptions/:redemptionId/fulfill` |

### Reward Dashboard Service Functions
| Function | Method | Endpoint |
|----------|--------|----------|
| `getRewardsOverview(params)` | GET | `/reinforcement/rewards/overview` |
| `getStudentRewardsSummary(studentId, params)` | GET | `/reinforcement/rewards/students/:studentId/summary` |
| `getRewardCatalogSummary(params)` | GET | `/reinforcement/rewards/catalog-summary` |

---

## Type Definitions Design

### Review Types
```typescript
export type ReinforcementReviewStatus = "submitted" | "approved" | "rejected";

export interface SubmitReinforcementStagePayload {
  proofText?: string;
  proofFileId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListReinforcementReviewQueueParams {
  academicYearId?: string;
  termId?: string;
  status?: string;
  source?: string;
  taskId?: string;
  studentId?: string;
  classroomId?: string;
  search?: string;
  submittedFrom?: string;
  submittedTo?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ReviewReinforcementSubmissionPayload {
  note?: string;
  noteAr?: string;
}

export interface ReinforcementReviewItem {
  id: string;
  assignmentId: string;
  taskId: string;
  stageId: string;
  studentId: string;
  enrollmentId: string;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
  task: Record<string, unknown>;
  stage: Record<string, unknown>;
  student: Record<string, unknown>;
  assignment: Record<string, unknown>;
  proof: Record<string, unknown>;
  currentReview?: Record<string, unknown>;
  reviewHistory?: Array<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
}

export type ReinforcementReviewQueueResponse = ReinforcementListResponse<ReinforcementReviewItem>;
```

### Reward Types
```typescript
export type RewardCatalogStatus = "draft" | "published" | "archived";
export type RewardItemType = "physical" | "digital" | "privilege" | "certificate" | "other";
export type RedemptionStatus = "requested" | "approved" | "rejected" | "fulfilled" | "cancelled";
export type RedemptionRequestSource = "dashboard" | "teacher" | "student_app" | "parent_app" | "system";

export interface RewardCatalogItem {
  id: string;
  academicYearId?: string;
  termId?: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: RewardItemType;
  status?: RewardCatalogStatus;
  minTotalXp?: number;
  stockQuantity?: number;
  stockRemaining?: number;
  isUnlimited?: boolean;
  imageFileId?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RewardRedemption {
  id: string;
  catalogItemId: string;
  studentId: string;
  enrollmentId?: string;
  academicYearId?: string;
  termId?: string;
  status: RedemptionStatus;
  requestSource?: RedemptionRequestSource;
  requestNoteEn?: string;
  requestNoteAr?: string;
  reviewNoteEn?: string;
  reviewNoteAr?: string;
  fulfillmentNoteEn?: string;
  fulfillmentNoteAr?: string;
  requestedAt?: string;
  reviewedAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  catalogItem?: RewardCatalogItem;
  student?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Page Design

### Review Queue Page
- **Layout:** Header → Academic context filter → Status filter → Table → Pagination
- **Table columns:** Student | Task | Stage | Status | Submitted | Actions
- **Actions per row:** View detail (link), Quick approve, Quick reject (if manage permission)
- **Empty state:** "No submissions pending review" with icon

### Review Detail Page
- **Layout:** Back link → Header with status badge → Two-column layout
- **Left column:** Task info card, Stage info card, Proof display (text or file link)
- **Right column:** Student info card, Review history timeline
- **Bottom:** Action bar with Approve/Reject buttons + note textarea
- **After approve:** Optional XP grant dialog

### Rewards Overview Page
- **Layout:** Header → KPI cards row → Two-column (catalog summary + recent redemptions)
- **KPI cards:** Total catalog items, Active items, Pending redemptions, Fulfilled this month
- **Quick links:** "Manage Catalog" button, "View Redemptions" button

### Reward Catalog Page
- **Layout:** Header with "Add Reward" button → Filters → Table
- **Table columns:** Title | Type | XP Cost | Stock | Status | Actions
- **Actions:** Edit (modal), Publish, Archive
- **Create/Edit:** Modal form with fields matching `CreateRewardCatalogItemDto`

### Reward Redemptions Page
- **Layout:** Header → Filters → Table
- **Table columns:** Student | Reward | Status | Source | Requested | Actions
- **Actions vary by status:**
  - `requested` → Approve, Reject
  - `approved` → Fulfill, Cancel
  - Other → View only
- **Action modals:** Confirm dialog with optional note field

---

## Navigation Updates

### Sidebar (navigation.ts)
Add after "XP Ledger":
```typescript
{
  key: "reinforcement-reviews",
  label_en: "Reviews",
  label_ar: "المراجعات",
  href_en: "/en/reinforcement/reviews",
  href_ar: "/ar/reinforcement/reviews",
  icon: CheckSquare,
},
{
  key: "reinforcement-rewards",
  label_en: "Rewards",
  label_ar: "المكافآت",
  href_en: "/en/reinforcement/rewards",
  href_ar: "/ar/reinforcement/rewards",
  icon: Gift,
},
```

### Tab Config (reinforcementTabs.ts)
```typescript
export const reinforcementTabs = [
  { key: "overview", href: "/reinforcement" },
  { key: "templates", href: "/reinforcement/templates" },
  { key: "tasks", href: "/reinforcement/tasks" },
  { key: "reviews", href: "/reinforcement/reviews" },
  { key: "rewards", href: "/reinforcement/rewards" },
  { key: "xpPolicies", href: "/reinforcement/xp/policies" },
  { key: "xpLedger", href: "/reinforcement/xp/ledger" },
] as const;
```

---

## Permission Model

| Page | View Permission | Manage Permission |
|------|----------------|-------------------|
| Review Queue | `reinforcement.reviews.view` | `reinforcement.reviews.manage` |
| Reward Catalog | `reinforcement.rewards.view` | `reinforcement.rewards.manage` |
| Reward Redemptions | `reinforcement.rewards.redemptions.view` | `reinforcement.rewards.redemptions.review` |
| Rewards Overview | `reinforcement.rewards.view` | — |
| Redemption Create | — | `reinforcement.rewards.redemptions.request` |
| Redemption Fulfill | — | `reinforcement.rewards.fulfill` |
