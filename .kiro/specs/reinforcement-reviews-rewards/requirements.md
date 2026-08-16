# Requirements: Reinforcement Reviews & Rewards Modules

## Overview
Implement the missing Reviews module (5 endpoints) and Rewards module (16 endpoints) for the reinforcement feature, plus the missing XP grant-for-review endpoint. This excludes Hero Journey (deferred).

## References
- #[[file:docs/reinforcement-backend-endpoints.md]]
- #[[file:docs/reinforcement-implementation-status.md]]
- #[[file:src/features/reinforcement/types.ts]]
- #[[file:src/features/reinforcement/services/reinforcementApiUtils.ts]]

---

## Requirement 1: Reviews - Service Layer
**Description:** Create a service file that consumes all 5 review endpoints.
**Endpoints:**
- `POST /reinforcement/assignments/:assignmentId/stages/:stageId/submit`
- `GET /reinforcement/review-queue`
- `GET /reinforcement/review-queue/:submissionId`
- `POST /reinforcement/review-queue/:submissionId/approve`
- `POST /reinforcement/review-queue/:submissionId/reject`

**Acceptance Criteria:**
- Service file at `src/features/reinforcement/services/reinforcementReviewsService.ts`
- Uses existing `apiGet`, `apiPost` from `@/lib/api`
- Uses existing `buildReinforcementQueryString`, `unwrapReinforcementItemResponse`, `unwrapReinforcementListResponse` utils
- All functions are typed with proper request params and response types

---

## Requirement 2: Reviews - Types
**Description:** Add TypeScript types for the reviews module.
**Acceptance Criteria:**
- Types added to `src/features/reinforcement/types.ts`
- Includes: `ReinforcementReviewStatus`, `SubmitReinforcementStagePayload`, `ListReinforcementReviewQueueParams`, `ReviewReinforcementSubmissionPayload`, `ReinforcementReviewItem`, `ReinforcementReviewQueueResponse`
- Types match the backend DTO shapes from the endpoint documentation

---

## Requirement 3: Reviews - Review Queue Page
**Description:** Create a page listing submissions pending teacher review with filters and approve/reject actions.
**Acceptance Criteria:**
- Page at `src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx`
- Route at `src/app/[lang]/(dashboard)/reinforcement/reviews/page.tsx`
- Displays a table of review queue items with: student name, task title, stage, status, submitted date
- Filters: academic context (year/term), status, search
- Permission-gated: `reinforcement.reviews.view`
- Follows existing page patterns (useLocale, useTranslations, useAuth, usePermissions)
- RTL support via `dir` attribute

---

## Requirement 4: Reviews - Review Detail & Actions
**Description:** Create a detail view for a single review item with approve/reject actions.
**Acceptance Criteria:**
- Page at `src/features/reinforcement/pages/ReinforcementReviewDetailPage.tsx`
- Route at `src/app/[lang]/(dashboard)/reinforcement/reviews/[submissionId]/page.tsx`
- Shows full submission details: task info, stage info, student info, proof (text/file), review history
- Approve button triggers `POST /review-queue/:submissionId/approve` with optional note
- Reject button triggers `POST /review-queue/:submissionId/reject` with optional note
- After approve, optionally triggers XP grant via `POST /reinforcement/xp/grants/reinforcement-review/:submissionId`
- Permission-gated: `reinforcement.reviews.view` for viewing, `reinforcement.reviews.manage` for actions
- Success/error toast notifications

---

## Requirement 5: Rewards - Service Layer (Catalog)
**Description:** Create a service file for the reward catalog CRUD endpoints.
**Endpoints:**
- `GET /reinforcement/rewards/catalog`
- `GET /reinforcement/rewards/catalog/:rewardId`
- `POST /reinforcement/rewards/catalog`
- `PATCH /reinforcement/rewards/catalog/:rewardId`
- `POST /reinforcement/rewards/catalog/:rewardId/publish`
- `POST /reinforcement/rewards/catalog/:rewardId/archive`

**Acceptance Criteria:**
- Service file at `src/features/reinforcement/services/rewardCatalogService.ts`
- Uses existing API utilities and patterns
- All functions properly typed

---

## Requirement 6: Rewards - Service Layer (Redemptions)
**Description:** Create a service file for the reward redemption lifecycle endpoints.
**Endpoints:**
- `GET /reinforcement/rewards/redemptions`
- `GET /reinforcement/rewards/redemptions/:redemptionId`
- `POST /reinforcement/rewards/redemptions`
- `POST /reinforcement/rewards/redemptions/:redemptionId/cancel`
- `POST /reinforcement/rewards/redemptions/:redemptionId/approve`
- `POST /reinforcement/rewards/redemptions/:redemptionId/reject`
- `POST /reinforcement/rewards/redemptions/:redemptionId/fulfill`

**Acceptance Criteria:**
- Service file at `src/features/reinforcement/services/rewardRedemptionsService.ts`
- Uses existing API utilities and patterns
- All functions properly typed

---

## Requirement 7: Rewards - Service Layer (Dashboard)
**Description:** Create a service file for the rewards dashboard/overview endpoints.
**Endpoints:**
- `GET /reinforcement/rewards/overview`
- `GET /reinforcement/rewards/students/:studentId/summary`
- `GET /reinforcement/rewards/catalog-summary`

**Acceptance Criteria:**
- Service file at `src/features/reinforcement/services/rewardDashboardService.ts`
- Uses existing API utilities and patterns
- All functions properly typed

---

## Requirement 8: Rewards - Types
**Description:** Add TypeScript types for the entire rewards module (catalog, redemptions, dashboard).
**Acceptance Criteria:**
- Types added to `src/features/reinforcement/types.ts`
- Catalog types: `RewardCatalogStatus`, `RewardType`, `RewardCatalogItem`, `CreateRewardCatalogItemPayload`, `UpdateRewardCatalogItemPayload`, `ListRewardCatalogParams`
- Redemption types: `RedemptionStatus`, `RedemptionRequestSource`, `RewardRedemption`, `CreateRewardRedemptionPayload`, `ListRewardRedemptionsParams`, action DTOs
- Dashboard types: `RewardsOverviewParams`, `StudentRewardsSummaryParams`, `RewardCatalogSummaryParams`
- Types match the backend DTO shapes

---

## Requirement 9: Rewards - Catalog Page
**Description:** Create a page for managing the reward catalog (list, create, publish, archive).
**Acceptance Criteria:**
- Page at `src/features/reinforcement/pages/RewardCatalogPage.tsx`
- Route at `src/app/[lang]/(dashboard)/reinforcement/rewards/catalog/page.tsx`
- Table listing reward items with: title, type, XP cost, stock, status
- Filters: status (draft/published/archived), type, search
- Create button opens a form/modal for new reward items
- Row actions: edit, publish, archive
- Permission-gated: `reinforcement.rewards.view` / `reinforcement.rewards.manage`

---

## Requirement 10: Rewards - Redemptions Page
**Description:** Create a page for managing reward redemption requests.
**Acceptance Criteria:**
- Page at `src/features/reinforcement/pages/RewardRedemptionsPage.tsx`
- Route at `src/app/[lang]/(dashboard)/reinforcement/rewards/redemptions/page.tsx`
- Table listing redemptions with: student, reward item, status, requested date, request source
- Filters: status, student, date range, search
- Row actions: approve, reject, fulfill, cancel (based on current status)
- Permission-gated: `reinforcement.rewards.redemptions.view` / `reinforcement.rewards.redemptions.review`

---

## Requirement 11: Rewards - Overview Page
**Description:** Create a rewards overview/dashboard page with summary stats.
**Acceptance Criteria:**
- Page at `src/features/reinforcement/pages/RewardsOverviewPage.tsx`
- Route at `src/app/[lang]/(dashboard)/reinforcement/rewards/page.tsx`
- Shows KPI cards: total redemptions, pending, approved, fulfilled
- Catalog summary section
- Links to catalog and redemptions sub-pages
- Permission-gated: `reinforcement.rewards.view`

---

## Requirement 12: Navigation & Routing Updates
**Description:** Add Reviews and Rewards to the sidebar navigation and tab configuration.
**Acceptance Criteria:**
- Sidebar navigation in `src/config/navigation.ts` updated with:
  - "Reviews" child item → `/reinforcement/reviews`
  - "Rewards" child item → `/reinforcement/rewards`
- Tab config in `src/features/reinforcement/config/reinforcementTabs.ts` updated with reviews and rewards tabs
- All new routes created under `src/app/[lang]/(dashboard)/reinforcement/`

---

## Requirement 13: XP Grant for Review Integration
**Description:** Add the missing XP grant-for-review endpoint to the XP service and integrate it into the review approval flow.
**Acceptance Criteria:**
- New function `grantXpForReinforcementReview(submissionId, payload)` in `reinforcementXpService.ts`
- Called from the review detail page after successful approval
- Payload includes optional amount, reason, reasonAr
- Proper error handling (XP grant failure should not block approval success)

---

## Requirement 14: Internationalization
**Description:** Add Arabic and English translation keys for all new UI elements.
**Acceptance Criteria:**
- Translation keys added under `reinforcement.reviews.*` and `reinforcement.rewards.*` namespaces
- Covers: page titles, table headers, filter labels, action buttons, status labels, empty states, error messages, success toasts
- Both English and Arabic translations provided
