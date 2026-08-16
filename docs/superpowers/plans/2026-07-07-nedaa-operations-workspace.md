# Nedaa Operations Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend-native Nedaa Operations workspace for active dismissal requests, waiting students, and request history.

**Architecture:** Add one `/[lang]/nedaa/operations` route backed by a focused `NedaaOperationsPage` client component. Keep the UI dense and operational by reusing existing `DataTable`, `FilterPanel`, `Modal`, `Button`, `Input`, `Select`, and toast patterns. Use the existing `dismissalApiService` contract methods for all network operations.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Vitest, Testing Library, existing local UI components, lucide-react icons.

## Global Constraints

- Do not restore the deleted mock `NedaaRequestsPage`, `NedaaHistoryPage`, or `nedaaService`.
- Keep operations in one sidebar item and one workspace with three tabs: Active Requests, Waiting Students, History.
- Respect permissions: `dismissal.requests.view`, `dismissal.requests.manage`, `dismissal.requests.deliver`, `dismissal.requests.escalate`, `dismissal.requests.history.view`.
- Use accessible labelled controls and `aria-live="polite"` for action/load feedback.
- Use TDD: write failing page/navigation tests before production code.
- Do not overwrite unrelated dirty worktree changes.

---

### Task 1: Route And Navigation Contract

**Files:**
- Create: `src/app/[lang]/(dashboard)/nedaa/operations/page.tsx`
- Modify: `src/config/navigation.ts`
- Test: `src/app/[lang]/(dashboard)/nedaa/operations/__tests__/page.test.tsx`
- Test: `src/config/__tests__/navigation.test.ts`

**Interfaces:**
- Consumes: `NedaaOperationsPage` default export from `@/features/nedaa/pages/NedaaOperationsPage`.
- Produces: route `/[lang]/nedaa/operations`; navigation item key `nedaa-operations`.

- [ ] **Step 1: Write the failing route/navigation tests**

Assert the route renders `NedaaOperationsPage` and the sidebar includes `Operations`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:run -- src/app/[lang]/\\(dashboard\\)/nedaa/operations/__tests__/page.test.tsx src/config/__tests__/navigation.test.ts`
Expected: FAIL because the route and navigation item do not exist yet.

- [ ] **Step 3: Implement route and navigation**

Create the operations page route and add a `nedaa-operations` child under `nedaa` using a Lucide operational icon.

- [ ] **Step 4: Run tests to verify pass**

Run the same test command.
Expected: PASS.

### Task 2: Active Requests Tab

**Files:**
- Create: `src/features/nedaa/pages/NedaaOperationsPage.tsx`
- Test: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

**Interfaces:**
- Consumes service methods: `listActiveDismissalRequests`, `fetchDismissalRequest`, `updateDismissalRequestStatus`, `listDismissalPickupRecipients`, `deliverDismissalRequest`, `escalateDismissalRequest`.
- Produces visible tab `Active Requests`, summary counters, filter controls, table rows, status/deliver/escalate actions.

- [ ] **Step 1: Write failing active-request tests**

Assert initial load calls `listActiveDismissalRequests`, renders a student row, and the status action calls `updateDismissalRequestStatus`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`
Expected: FAIL because `NedaaOperationsPage` does not exist.

- [ ] **Step 3: Implement minimal active tab**

Build the page header, tabs, active filters, active summary, data table, detail drawer/modal, status modal, deliver modal, and escalation modal.

- [ ] **Step 4: Run tests to verify pass**

Run the same test command.
Expected: PASS.

### Task 3: Waiting Students Tab

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`
- Test: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

**Interfaces:**
- Consumes service methods: `listDismissalWaitingStudents`, `confirmDismissalStudentArrival`.
- Produces visible tab `Waiting Students`, waiting summary, waiting table, arrival confirmation modal.

- [ ] **Step 1: Write failing waiting-students test**

Assert switching to `Waiting Students` calls `listDismissalWaitingStudents` and confirming arrival calls `confirmDismissalStudentArrival`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`
Expected: FAIL because the tab is not implemented yet.

- [ ] **Step 3: Implement waiting tab**

Add the tab, filters shared with active requests, summary counters, data table, and arrival note modal.

- [ ] **Step 4: Run tests to verify pass**

Run the same test command.
Expected: PASS.

### Task 4: History Tab

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`
- Test: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

**Interfaces:**
- Consumes service methods: `listDismissalRequestHistory`, `fetchDismissalRequestHistoryItem`.
- Produces visible tab `History`, read-only history filters, table, detail modal.

- [ ] **Step 1: Write failing history test**

Assert switching to `History` calls `listDismissalRequestHistory` and renders a read-only history row.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`
Expected: FAIL because the history tab is not implemented yet.

- [ ] **Step 3: Implement history tab**

Add the tab, history-specific filters, summary counters, read-only table, and timeline/detail modal.

- [ ] **Step 4: Run tests to verify pass**

Run the same test command.
Expected: PASS.

### Task 5: Translations And Verification

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/messages/__tests__/nedaaTranslations.test.ts`

**Interfaces:**
- Consumes translation namespace `nedaa`.
- Produces all labels used by the operations workspace in English and Arabic.

- [ ] **Step 1: Add translation coverage test if needed**

Ensure `nedaaTranslations.test.ts` fails if new operations keys are missing from either locale.

- [ ] **Step 2: Add translations**

Add `operations`, `operations_tabs`, `operations_actions`, `operations_filters`, and status/reason labels under `nedaa`.

- [ ] **Step 3: Run focused tests**

Run: `npm run test:run -- src/features/nedaa src/app/[lang]/\\(dashboard\\)/nedaa src/messages/__tests__/nedaaTranslations.test.ts src/config/__tests__/navigation.test.ts`
Expected: PASS.

- [ ] **Step 4: Run full static verification**

Run: `npm run typecheck`
Expected: PASS.

