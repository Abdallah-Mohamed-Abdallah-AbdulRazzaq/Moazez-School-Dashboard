# Reward Redemption Dashboard Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dashboard-side reward redemption request creation and align row action permissions with the backend contract.

**Architecture:** Add a focused create modal that owns lookup/loading/submission form state. Keep the redemptions page responsible for list loading, permission-gated action visibility, and refreshing after successful mutations. Reuse existing reinforcement filter-options and reward catalog services.

**Tech Stack:** Next.js client components, React state/hooks, TypeScript, existing `Button`, `Select`, `Input`, `TextArea`, `DataTable`, Vitest/Testing Library.

---

### Task 1: Permission contract

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/features/reinforcement/pages/RewardRedemptionsPage.tsx`
- Test: `src/features/reinforcement/pages/__tests__/RewardRedemptionsPage.test.tsx`

- [ ] Add `reinforcement.rewards.redemptions.request` and `reinforcement.rewards.fulfill` to the frontend `PermissionKey` union.
- [ ] Replace the single redemptions action flag with `canRequest`, `canReview`, and `canFulfill`.
- [ ] Gate row actions as: approve/reject with `canReview`, fulfill with `canFulfill`, cancel with `canRequest`.
- [ ] Add tests proving request-only users see create/cancel but not approve/reject, review-only users see approve/reject but not fulfill/cancel, and fulfill-only users see fulfill.

### Task 2: Create redemption modal

**Files:**
- Create: `src/features/reinforcement/components/RewardRedemptionCreateModal.tsx`
- Modify: `src/features/reinforcement/pages/RewardRedemptionsPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/reinforcement/pages/__tests__/RewardRedemptionsPage.test.tsx`

- [ ] Create a modal that loads students from `getReinforcementFilterOptions({ academicYearId, termId, search })`.
- [ ] Create a catalog lookup using `listRewardCatalog({ status: "published", onlyAvailable: true, limit: 100 })`.
- [ ] Validate `studentId` and `catalogItemId`, trim notes, omit empty optional fields, and submit `requestSource: "dashboard"`.
- [ ] Keep modal state intact when lookup or submit fails.
- [ ] Add localized labels, validation messages, loading labels, and success/error copy.

### Task 3: Page integration and verification

**Files:**
- Modify: `src/features/reinforcement/pages/RewardRedemptionsPage.tsx`
- Test: `src/features/reinforcement/pages/__tests__/RewardRedemptionsPage.test.tsx`

- [ ] Add the Create request button to the page header only when `canRequest` is true.
- [ ] Call `createRewardRedemption` from the page and refresh the list after success.
- [ ] Run `npm run typecheck`.
- [ ] Run focused page tests and scoped lint for touched files.
