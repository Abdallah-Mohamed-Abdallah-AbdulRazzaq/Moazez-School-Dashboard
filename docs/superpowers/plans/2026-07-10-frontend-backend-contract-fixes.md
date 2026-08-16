# Frontend Backend Contract Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove confirmed frontend/backend contract mismatches found during the Moazez Backend audit.

**Architecture:** Keep the existing Axios/API adapter architecture. Fix the file download boundary at the shared route helper, make Reinforcement response types reflect backend nullability, and make mock-backed modules opt-in instead of silently defaulting to fixtures where a real adapter exists.

**Tech Stack:** Next.js, React, TypeScript, Axios, Vitest.

## Global Constraints

- Do not modify unrelated user changes already present in the worktree.
- Do not change backend routes or invent aliases.
- Preserve existing API prefixes and response unwrap behavior.
- Add regression tests before production edits for each behavior change.

---

### Task 1: Fix authorized proof-file downloads

**Files:**
- Modify: `src/features/reinforcement/components/ReinforcementReviewDetailsDrawer.tsx`
- Modify: `src/features/reinforcement/pages/ReinforcementReviewDetailPage.tsx`
- Test: existing reinforcement frontend hardening test or a focused regression test beside the affected feature

- [x] Add assertions that proof links end in `/api/files/<id>/download`.
- [x] Run the focused test and verify the current links fail.
- [x] Update both links to use the existing authorized Next download route.
- [x] Run the focused test and verify it passes.

### Task 2: Align Reinforcement types with nullable backend responses

**Files:**
- Modify: `src/features/reinforcement/types.ts`
- Modify: `src/features/reinforcement/services/reinforcementApiUtils.ts` only if runtime normalization needs null handling
- Test: `src/features/reinforcement/__tests__/reinforcementServices.test.ts`

- [x] Add a fixture with null localized template/reward fields and assert it can be normalized without unsafe assumptions.
- [x] Run the focused test and verify the type/normalization expectation fails.
- [x] Change response-only fields to accept `null` while keeping create payload fields strict.
- [x] Run typecheck and focused tests.

### Task 3: Preserve safe adapter selection until sync API methods exist

**Files:**
- Modify: `src/features/students-guardians/students/services/studentsService.ts`
- Modify: `src/features/students-guardians/students/services/enrollmentService.ts`
- Modify: `src/features/students-guardians/documents/services/documentsService.ts`
- Modify: `src/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService.ts`
- Modify: `.env.example`
- Test: corresponding adapter/service tests or new focused tests under each feature

- [x] Inspect adapter interfaces and confirm synchronous methods throw `*_api_sync_not_supported`.
- [x] Keep the existing API opt-in flags to avoid breaking synchronous consumers.
- [x] Document the four API flags in `.env.example`.
- [x] Record completion of the API-first migration as a follow-up once adapters expose synchronous-compatible reads.

### Task 4: Replace Admissions dashboard fixture analytics with backend-backed data

**Files:**
- Modify: `src/features/admissions/dashboard/container/AdmissionsDashboardContainer.tsx`
- Modify: `src/features/admissions/dashboard/services/admissionsAnalytics.ts`
- Modify: `src/features/admissions/dashboard/views/AdmissionsDashboardView.tsx` only if loading/error state is required
- Test: `src/features/admissions/dashboard/**/__tests__/*` or a new focused container/service test

- [x] Remove direct `mockApplications`/`mockLeadsApi` usage from production dashboard calculations.
- [x] Keep the active dashboard's existing async API loading path and loading/error handling.
- [x] Preserve the existing KPI shape while deriving enrolled counts from registration state.
- [x] Run typecheck.

### Task 5: Verify all changes

- [x] Run `npm run typecheck`.
- [x] Run focused Reinforcement, Students/Guardians, Admissions, and Auth contract tests.
- [x] Run lint on changed files.
- [x] Report the remaining backend-only CORS change separately with the exact backend file and required configuration.
