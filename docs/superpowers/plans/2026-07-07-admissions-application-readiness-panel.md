# Admissions Application Readiness Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the `GET /api/v1/admissions/applications/:id` readiness fields as a clear UI/UX panel on the application details page.

**Architecture:** The API mapper already carries `documentsSummary`, `dashboardState`, and `registrationState` into `Application`. Add presentation-only logic to `DetailsTab` so the UI trusts backend-provided decision, registration, workflow, document, and blocker signals without recreating admissions policy in the frontend.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Tailwind CSS, Lucide icons, Vitest, Testing Library.

---

### Task 1: Cover Readiness Panel Behavior

**Files:**
- Create: `src/features/admissions/applications/components/tabs/__tests__/DetailsTab.test.tsx`
- Modify: `src/features/admissions/applications/components/tabs/DetailsTab.tsx`

- [ ] **Step 1: Write the failing test**

Create `DetailsTab.test.tsx` with a submitted application that includes `documentsSummary`, `dashboardState.workflowReadiness`, and two blockers. Assert that the rendered details tab shows the panel title, disabled decision and registration states, document totals, placement test readiness, interview readiness, and blocker messages.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/features/admissions/applications/components/tabs/__tests__/DetailsTab.test.tsx`

Expected: FAIL because `DetailsTab` does not render the readiness panel yet.

- [ ] **Step 3: Implement the panel**

Update `DetailsTab.tsx` to render a top `Application readiness` panel when `application.dashboardState` exists. Use backend booleans and counts directly, keep actions disabled when `canProceedToDecision` or `canRegister` are false, and display `dashboardState.blockers` verbatim.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/features/admissions/applications/components/tabs/__tests__/DetailsTab.test.tsx`

Expected: PASS.

### Task 2: Add Localized Labels

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add detail-page readiness translation keys**

Add labels under `admissions.application360.details` for readiness title, actions, document summary, workflow checklist, and generic enabled/blocked/satisfied/not satisfied states.

- [ ] **Step 2: Run focused tests**

Run: `npm run test:run -- src/features/admissions/applications/components/tabs/__tests__/DetailsTab.test.tsx`

Expected: PASS.

### Task 3: Verify Integration

**Files:**
- No production edits unless verification exposes a defect.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 2: Run admissions application tests**

Run: `npm run test:run -- src/features/admissions/applications`

Expected: PASS.
