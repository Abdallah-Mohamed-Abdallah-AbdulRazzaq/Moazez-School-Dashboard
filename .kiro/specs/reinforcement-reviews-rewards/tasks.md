# Implementation Plan: Reinforcement Reviews & Rewards

## Overview

Implement the Reviews module (5 endpoints), Rewards module (16 endpoints), and XP grant-for-review integration for the reinforcement feature. This includes TypeScript types, service layers, UI pages/components, navigation updates, and translations. All UI components MUST reuse existing shared components from the project: `DataTable` (`@/components/ui/data-table/DataTable`), `Select` (`@/components/ui/input/Select`), `Input` (`@/components/ui/input/Input`), `TextArea` (`@/components/ui/input/TextArea`), `Modal` (`@/components/ui/modal/Modal`), `Button` (`@/components/ui/button/Button`), `KPICard` (`@/components/ui/kpi-card/KPICard`), and `ReinforcementBadge` (`../components/shared/ReinforcementBadge`).

## Tasks

- [ ] 1. Add Review & Reward TypeScript types
  - [ ] 1.1 Add review types to `src/features/reinforcement/types.ts`
    - Add `ReinforcementReviewStatus` type (`"submitted" | "approved" | "rejected"`)
    - Add `SubmitReinforcementStagePayload` interface (proofText, proofFileId, metadata)
    - Add `ListReinforcementReviewQueueParams` interface (academicYearId, termId, status, source, taskId, studentId, classroomId, search, submittedFrom, submittedTo, limit, offset)
    - Add `ReviewReinforcementSubmissionPayload` interface (note, noteAr)
    - Add `ReinforcementReviewItem` interface (id, assignmentId, taskId, stageId, studentId, enrollmentId, status, submittedAt, reviewedAt, task, stage, student, assignment, proof, currentReview, reviewHistory, createdAt, updatedAt)
    - Add `ReinforcementReviewQueueResponse` type alias using `ReinforcementListResponse<ReinforcementReviewItem>`
    - Add `GrantXpForReviewPayload` interface (amount?, reason?, reasonAr?)
    - _Requirements: 2, 13_

  - [ ] 1.2 Add reward types to `src/features/reinforcement/types.ts`
    - Add `RewardCatalogStatus` type (`"draft" | "published" | "archived"`)
    - Add `RewardItemType` type (`"physical" | "digital" | "privilege" | "certificate" | "other"`)
    - Add `RedemptionStatus` type (`"requested" | "approved" | "rejected" | "fulfilled" | "cancelled"`)
    - Add `RedemptionRequestSource` type (`"dashboard" | "teacher" | "student_app" | "parent_app" | "system"`)
    - Add `RewardCatalogItem` interface (id, academicYearId, termId, titleEn, titleAr, descriptionEn, descriptionAr, type, status, minTotalXp, stockQuantity, stockRemaining, isUnlimited, imageFileId, sortOrder, metadata, createdAt, updatedAt)
    - Add `CreateRewardCatalogItemPayload`, `UpdateRewardCatalogItemPayload`, `ArchiveRewardCatalogItemPayload` interfaces
    - Add `ListRewardCatalogParams` interface (status, type, search, onlyAvailable, limit, offset)
    - Add `RewardRedemption` interface (id, catalogItemId, studentId, enrollmentId, academicYearId, termId, status, requestSource, requestNoteEn/Ar, reviewNoteEn/Ar, fulfillmentNoteEn/Ar, cancellationReasonEn/Ar, requestedAt, reviewedAt, fulfilledAt, cancelledAt, catalogItem, student, createdAt, updatedAt)
    - Add `CreateRewardRedemptionPayload`, `CancelRewardRedemptionPayload`, `ApproveRewardRedemptionPayload`, `RejectRewardRedemptionPayload`, `FulfillRewardRedemptionPayload` interfaces
    - Add `ListRewardRedemptionsParams` interface (status, studentId, catalogItemId, search, requestedFrom, requestedTo, limit, offset)
    - Add `RewardsOverviewParams`, `StudentRewardsSummaryParams`, `RewardCatalogSummaryParams` interfaces
    - _Requirements: 8_

- [ ] 2. Create Reviews service layer
  - [ ] 2.1 Create `src/features/reinforcement/services/reinforcementReviewsService.ts`
    - Import `apiGet`, `apiPost` from `@/lib/api`
    - Import `buildReinforcementQueryString`, `unwrapReinforcementItemResponse`, `unwrapReinforcementListResponse` from `./reinforcementApiUtils`
    - Implement `submitReinforcementStage(assignmentId, stageId, payload)` → POST `/reinforcement/assignments/:assignmentId/stages/:stageId/submit`
    - Implement `listReinforcementReviewQueue(params)` → GET `/reinforcement/review-queue` with query string
    - Implement `getReinforcementReviewItem(submissionId)` → GET `/reinforcement/review-queue/:submissionId`
    - Implement `approveReinforcementSubmission(submissionId, payload)` → POST `/reinforcement/review-queue/:submissionId/approve`
    - Implement `rejectReinforcementSubmission(submissionId, payload)` → POST `/reinforcement/review-queue/:submissionId/reject`
    - _Requirements: 1_

- [ ] 3. Create Reward Catalog service layer
  - [ ] 3.1 Create `src/features/reinforcement/services/rewardCatalogService.ts`
    - Import `apiGet`, `apiPost`, `apiPatch` from `@/lib/api`
    - Import shared utils from `./reinforcementApiUtils`
    - Implement `listRewardCatalog(params)` → GET `/reinforcement/rewards/catalog`
    - Implement `getRewardCatalogItem(rewardId)` → GET `/reinforcement/rewards/catalog/:rewardId`
    - Implement `createRewardCatalogItem(payload)` → POST `/reinforcement/rewards/catalog`
    - Implement `updateRewardCatalogItem(rewardId, payload)` → PATCH `/reinforcement/rewards/catalog/:rewardId`
    - Implement `publishRewardCatalogItem(rewardId)` → POST `/reinforcement/rewards/catalog/:rewardId/publish`
    - Implement `archiveRewardCatalogItem(rewardId, payload)` → POST `/reinforcement/rewards/catalog/:rewardId/archive`
    - _Requirements: 5_

- [ ] 4. Create Reward Redemptions service layer
  - [ ] 4.1 Create `src/features/reinforcement/services/rewardRedemptionsService.ts`
    - Import `apiGet`, `apiPost` from `@/lib/api`
    - Import shared utils from `./reinforcementApiUtils`
    - Implement `listRewardRedemptions(params)` → GET `/reinforcement/rewards/redemptions`
    - Implement `getRewardRedemption(redemptionId)` → GET `/reinforcement/rewards/redemptions/:redemptionId`
    - Implement `createRewardRedemption(payload)` → POST `/reinforcement/rewards/redemptions`
    - Implement `cancelRewardRedemption(redemptionId, payload)` → POST `/reinforcement/rewards/redemptions/:redemptionId/cancel`
    - Implement `approveRewardRedemption(redemptionId, payload)` → POST `/reinforcement/rewards/redemptions/:redemptionId/approve`
    - Implement `rejectRewardRedemption(redemptionId, payload)` → POST `/reinforcement/rewards/redemptions/:redemptionId/reject`
    - Implement `fulfillRewardRedemption(redemptionId, payload)` → POST `/reinforcement/rewards/redemptions/:redemptionId/fulfill`
    - _Requirements: 6_

- [ ] 5. Create Reward Dashboard service layer
  - [ ] 5.1 Create `src/features/reinforcement/services/rewardDashboardService.ts`
    - Import `apiGet` from `@/lib/api`
    - Import shared utils from `./reinforcementApiUtils`
    - Implement `getRewardsOverview(params)` → GET `/reinforcement/rewards/overview`
    - Implement `getStudentRewardsSummary(studentId, params)` → GET `/reinforcement/rewards/students/:studentId/summary`
    - Implement `getRewardCatalogSummary(params)` → GET `/reinforcement/rewards/catalog-summary`
    - _Requirements: 7_

- [ ] 6. Add XP Grant for Review to XP service
  - [ ] 6.1 Add `grantXpForReinforcementReview(submissionId, payload)` to `src/features/reinforcement/services/reinforcementXpService.ts`
    - Calls POST `/reinforcement/xp/grants/reinforcement-review/:submissionId`
    - Payload type: `GrantXpForReviewPayload` (amount?, reason?, reasonAr?)
    - _Requirements: 13_

- [ ] 7. Update navigation and tab configuration
  - [ ] 7.1 Update `src/config/navigation.ts`
    - Add "Reviews" child item under reinforcement with `CheckSquare` icon from lucide-react, href `/reinforcement/reviews`
    - Add "Rewards" child item under reinforcement with `Gift` icon from lucide-react, href `/reinforcement/rewards`
    - _Requirements: 12_

  - [ ] 7.2 Update `src/features/reinforcement/config/reinforcementTabs.ts`
    - Add `{ key: "reviews", href: "/reinforcement/reviews" }` tab entry
    - Add `{ key: "rewards", href: "/reinforcement/rewards" }` tab entry
    - _Requirements: 12_

- [ ] 8. Add translation keys (En/Ar)
  - [ ] 8.1 Add review translation keys
    - Add keys under `reinforcement.reviews.*`: title, description, table headers (student, task, stage, status, submittedAt, actions), status values (submitted, approved, rejected), action labels (approve, reject, viewDetail), messages (approved, rejected, error), emptyState, detail keys (title, proof, history, grantXp)
    - Add Arabic translations for all above keys
    - _Requirements: 14_

  - [ ] 8.2 Add reward translation keys
    - Add keys under `reinforcement.rewards.*`: title, description, catalog (title, addReward, table headers), redemptions (title, table headers), status values (draft, published, archived, requested, approved, rejected, fulfilled, cancelled), type values (physical, digital, privilege, certificate, other), action labels (publish, archive, approve, reject, fulfill, cancel, edit, create), messages (created, updated, published, archived, approved, rejected, fulfilled, cancelled), emptyStates (catalog, redemptions)
    - Add Arabic translations for all above keys
    - _Requirements: 14_

- [ ] 9. Checkpoint - Verify types, services, navigation, and translations
  - Ensure all types compile without errors, services follow existing patterns, navigation renders correctly, and translation keys are complete. Ask the user if questions arise.

- [ ] 10. Create Review Queue page and route
  - [ ] 10.1 Create `src/app/[lang]/(dashboard)/reinforcement/reviews/page.tsx` route file
    - Import and render `ReinforcementReviewQueuePage` component
    - _Requirements: 3_

  - [ ] 10.2 Create `src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx`
    - Follow existing page pattern: "use client", useLocale, useTranslations, useAuth, usePermissions
    - Permission check: `reinforcement.reviews.view` (show AccessNotice if denied)
    - Use `ReinforcementPageHeader` for page title/description
    - Use existing `ReinforcementAcademicContextFilter` component for academic year/term filters
    - Use existing `Select` component (`@/components/ui/input/Select`) for status filter dropdown with options: all, submitted, approved, rejected
    - Use existing `Input` component (`@/components/ui/input/Input`) for search input
    - Use existing `DataTable` component (`@/components/ui/data-table/DataTable`) with `Column<ReinforcementReviewItem>[]` definition for columns: Student, Task, Stage, Status, Submitted Date, Actions
    - Use `DataTable`'s `serverPagination` prop for paginated data
    - Pass `searchQuery` prop to DataTable for search highlighting
    - In the Status column render function, use `ReinforcementBadge` component for color-coded status badges
    - In the Actions column render function, add "View" link button + conditional "Approve"/"Reject" buttons (if `reinforcement.reviews.manage` permission)
    - Handle loading state with `MainLoader`, error state with alert banner, empty state via DataTable's built-in empty handling
    - Support RTL layout via `dir={locale === "ar" ? "rtl" : "ltr"}`
    - _Requirements: 3_

- [ ] 11. Create Review Detail page and route
  - [ ] 11.1 Create `src/app/[lang]/(dashboard)/reinforcement/reviews/[submissionId]/page.tsx` route file
    - Import and render `ReinforcementReviewDetailPage` component
    - _Requirements: 4_

  - [ ] 11.2 Create `src/features/reinforcement/pages/ReinforcementReviewDetailPage.tsx`
    - Follow existing page pattern: "use client", useLocale, useTranslations, useAuth, usePermissions
    - Permission check: `reinforcement.reviews.view`
    - Fetch review item by submissionId using `getReinforcementReviewItem`
    - Display back navigation link to review queue
    - Display page header with status badge using `ReinforcementBadge`
    - Display task information section in a card layout (use standard `rounded-lg border bg-white p-4 shadow-sm` card pattern from existing pages)
    - Display stage information section
    - Display student information section
    - Display proof section (proofText and/or proofFileId link)
    - Display review history timeline
    - Action bar with Approve/Reject buttons (gated by `reinforcement.reviews.manage`)
    - Clicking Approve/Reject opens `ReinforcementReviewActionModal`
    - After successful approve, show optional XP grant prompt using `ManualXpGrantModal` pattern or inline form
    - Use `useToast` for success/error notifications
    - Handle loading and error states
    - _Requirements: 4, 13_

  - [ ] 11.3 Create `src/features/reinforcement/components/ReinforcementReviewActionModal.tsx`
    - **REUSE** existing `Modal` component from `@/components/ui/modal/Modal`
    - **REUSE** existing `TextArea` component from `@/components/ui/input/TextArea` for note fields
    - **REUSE** existing `Button` component from `@/components/ui/button/Button` for submit/cancel
    - Props: `isOpen`, `onClose`, `onSubmit`, `actionType` ("approve" | "reject"), `loading`
    - Modal title and description change based on actionType
    - Form fields: note (En) TextArea, noteAr (Ar) TextArea - both optional
    - Use `variant="danger"` on Modal when actionType is "reject"
    - Footer with Cancel and Submit buttons
    - Bilingual labels via useTranslations
    - _Requirements: 4_

- [ ] 12. Checkpoint - Verify review pages render correctly
  - Ensure review queue page loads with DataTable, filters work, detail page displays submission data, and action modal opens/closes. Ask the user if questions arise.

- [ ] 13. Create Rewards Overview page and route
  - [ ] 13.1 Create `src/app/[lang]/(dashboard)/reinforcement/rewards/page.tsx` route file
    - Import and render `RewardsOverviewPage` component
    - _Requirements: 11_

  - [ ] 13.2 Create `src/features/reinforcement/pages/RewardsOverviewPage.tsx`
    - Follow existing page pattern: "use client", useLocale, useTranslations, useAuth, usePermissions
    - Permission check: `reinforcement.rewards.view`
    - Fetch rewards overview data using `getRewardsOverview` and `getRewardCatalogSummary`
    - **REUSE** existing `KPICard` component from `@/components/ui/kpi-card/KPICard` for KPI display
    - Render 4 KPI cards in a responsive grid (`grid gap-4 md:grid-cols-2 lg:grid-cols-4`): Total Catalog Items, Active Items, Pending Redemptions, Fulfilled This Month
    - Each KPICard receives: `title` (translated), `value` (number), `icon` (lucide icon like Package, CheckCircle, Clock, Gift)
    - Display catalog summary section below KPI cards
    - Add navigation buttons: "Manage Catalog" → `/reinforcement/rewards/catalog`, "View Redemptions" → `/reinforcement/rewards/redemptions`
    - Handle loading state with `MainLoader`, error state with alert banner
    - _Requirements: 11_

- [ ] 14. Create Reward Catalog page and route
  - [ ] 14.1 Create `src/app/[lang]/(dashboard)/reinforcement/rewards/catalog/page.tsx` route file
    - Import and render `RewardCatalogPage` component
    - _Requirements: 9_

  - [ ] 14.2 Create `src/features/reinforcement/pages/RewardCatalogPage.tsx`
    - Follow existing page pattern: "use client", useLocale, useTranslations, useAuth, usePermissions
    - Permission check: `reinforcement.rewards.view`
    - Use `ReinforcementPageHeader` with "Add Reward" button (if `reinforcement.rewards.manage` permission)
    - **REUSE** existing `Select` component (`@/components/ui/input/Select`) for status filter (options: all, draft, published, archived) and type filter (options: all, physical, digital, privilege, certificate, other)
    - **REUSE** existing `Input` component (`@/components/ui/input/Input`) for search input
    - **REUSE** existing `DataTable` component (`@/components/ui/data-table/DataTable`) with `Column<RewardCatalogItem>[]`:
      - Title column: render locale-aware title (titleEn/titleAr)
      - Type column: render `ReinforcementBadge` or styled badge for item type
      - Min XP column: render `minTotalXp` value
      - Stock column: render "Unlimited" if `isUnlimited`, else "X remaining / Y total"
      - Status column: render color-coded badge (draft=gray, published=green, archived=amber)
      - Actions column: Edit button, Publish button (if draft), Archive button (if published) - gated by manage permission
    - Use `DataTable`'s `serverPagination` prop for paginated data
    - Pass `searchQuery` prop to DataTable for search highlighting
    - "Add Reward" button opens `RewardCatalogFormModal`
    - Row Edit action opens `RewardCatalogFormModal` with initialData
    - Handle loading, error, empty states
    - _Requirements: 9_

  - [ ] 14.3 Create `src/features/reinforcement/components/RewardCatalogFormModal.tsx`
    - **REUSE** existing `Modal` component from `@/components/ui/modal/Modal` (size="xl")
    - **REUSE** existing `Input` component from `@/components/ui/input/Input` for text fields (titleEn, titleAr, minTotalXp, stockQuantity, sortOrder)
    - **REUSE** existing `TextArea` component from `@/components/ui/input/TextArea` for description fields (descriptionEn, descriptionAr)
    - **REUSE** existing `Select` component from `@/components/ui/input/Select` for type dropdown (physical, digital, privilege, certificate, other)
    - **REUSE** existing `Button` component from `@/components/ui/button/Button` for footer actions
    - Props: `isOpen`, `onClose`, `onSubmit`, `initialData?` (RewardCatalogItem for edit mode), `loading`
    - Form fields: titleEn, titleAr, descriptionEn, descriptionAr, type (Select), minTotalXp (Input type="number"), stockQuantity (Input type="number"), isUnlimited (checkbox), sortOrder (Input type="number")
    - Validation: at least one title required
    - Create mode vs Edit mode (title changes, submit calls create or update service)
    - Footer: Cancel + Submit buttons
    - _Requirements: 9_

- [ ] 15. Create Reward Redemptions page and route
  - [ ] 15.1 Create `src/app/[lang]/(dashboard)/reinforcement/rewards/redemptions/page.tsx` route file
    - Import and render `RewardRedemptionsPage` component
    - _Requirements: 10_

  - [ ] 15.2 Create `src/features/reinforcement/pages/RewardRedemptionsPage.tsx`
    - Follow existing page pattern: "use client", useLocale, useTranslations, useAuth, usePermissions
    - Permission check: `reinforcement.rewards.redemptions.view`
    - Use `ReinforcementPageHeader` for page title/description
    - **REUSE** existing `Select` component (`@/components/ui/input/Select`) for status filter (options: all, requested, approved, rejected, fulfilled, cancelled)
    - **REUSE** existing `Input` component (`@/components/ui/input/Input`) for search input and date range inputs (type="date" for requestedFrom/requestedTo)
    - **REUSE** existing `DataTable` component (`@/components/ui/data-table/DataTable`) with `Column<RewardRedemption>[]`:
      - Student column: render student name from `student` object
      - Reward column: render locale-aware title from `catalogItem`
      - Status column: render color-coded badge per status (requested=blue, approved=green, rejected=red, fulfilled=emerald, cancelled=gray)
      - Source column: render `requestSource` badge
      - Requested Date column: render locale-aware date formatting using `Intl.DateTimeFormat`
      - Actions column: conditional buttons based on current status and permissions:
        - `requested` → Approve, Reject (if `reinforcement.rewards.redemptions.review`)
        - `approved` → Fulfill, Cancel (if `reinforcement.rewards.redemptions.review`)
        - Other → View only
    - Use `DataTable`'s `serverPagination` prop for paginated data
    - Action buttons open `RewardRedemptionActionModal`
    - Handle loading, error, empty states
    - _Requirements: 10_

  - [ ] 15.3 Create `src/features/reinforcement/components/RewardRedemptionActionModal.tsx`
    - **REUSE** existing `Modal` component from `@/components/ui/modal/Modal`
    - **REUSE** existing `TextArea` component from `@/components/ui/input/TextArea` for note fields
    - **REUSE** existing `Button` component from `@/components/ui/button/Button` for footer actions
    - Props: `isOpen`, `onClose`, `onSubmit`, `actionType` ("approve" | "reject" | "fulfill" | "cancel"), `loading`
    - Modal title, description, and variant change based on actionType (use `variant="danger"` for reject/cancel)
    - Form fields vary by action:
      - Approve/Reject: reviewNoteEn (TextArea), reviewNoteAr (TextArea)
      - Fulfill: fulfillmentNoteEn (TextArea), fulfillmentNoteAr (TextArea)
      - Cancel: cancellationReasonEn (TextArea), cancellationReasonAr (TextArea)
    - Confirmation text explaining the action
    - Footer: Cancel + Submit buttons
    - _Requirements: 10_

- [ ] 16. Final checkpoint - Ensure all pages, services, and components work together
  - Ensure all tests pass, all pages render correctly with DataTable, filters work, modals open/close, navigation items appear, and translations display in both En/Ar. Ask the user if questions arise.

## Notes

- All new table views MUST use the shared `DataTable` component from `@/components/ui/data-table/DataTable` with proper `Column<T>[]` definitions and `serverPagination` prop — do NOT create custom table markup
- All modals MUST use the shared `Modal` component from `@/components/ui/modal/Modal` — do NOT create custom modal/dialog components
- All form inputs MUST use `Input` from `@/components/ui/input/Input`, `TextArea` from `@/components/ui/input/TextArea`, and `Select` from `@/components/ui/input/Select` — do NOT create custom input/select components
- All KPI/stat cards MUST use `KPICard` from `@/components/ui/kpi-card/KPICard` — do NOT create custom card components
- All buttons MUST use `Button` from `@/components/ui/button/Button`
- Status badges should extend `ReinforcementBadge` from `../components/shared/ReinforcementBadge` or use the same inline badge pattern (`rounded-full px-2.5 py-1 text-xs font-semibold` with color classes)
- Services follow the existing pattern using `apiGet`, `apiPost`, `apiPatch` from `@/lib/api` with `buildReinforcementQueryString`, `unwrapReinforcementItemResponse`, `unwrapReinforcementListResponse` from `reinforcementApiUtils.ts`
- Pages follow existing patterns: "use client", useLocale, useTranslations, useAuth, usePermissions, useToast
- RTL support via `dir={locale === "ar" ? "rtl" : "ltr"}` on containers
- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1", "7.1", "7.2", "8.1", "8.2"] },
    { "id": 2, "tasks": ["10.1", "10.2", "11.1", "13.1", "14.1", "15.1"] },
    { "id": 3, "tasks": ["11.2", "11.3", "13.2", "14.2", "14.3", "15.2", "15.3"] }
  ]
}
```
