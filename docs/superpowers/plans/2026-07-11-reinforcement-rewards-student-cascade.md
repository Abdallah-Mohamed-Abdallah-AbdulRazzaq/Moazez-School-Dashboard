# Reinforcement Rewards Student Cascade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make student selection in reinforcement rewards follow stage → grade → section → classroom → student while preserving existing reward filters and redemption payloads.

**Architecture:** Reuse the existing `getReinforcementFilterOptions({ academicYearId, termId })` request. The shared `AcademicStudentCascade` component filters hierarchy records and emits academic IDs; the redemption modal maps the selected student back to its `enrollmentId`, and the rewards overview maps the selected student to its URL filter.

**Tech Stack:** React, TypeScript, Next.js, existing `Select`, Vitest, Testing Library.

## Global Constraints

- Scope is limited to `reinforcement/rewards` consumers.
- Do not add or change backend endpoints.
- Preserve existing reward overview query keys and redemption request payload fields.
- Parent changes clear all descendant selections.

---

### Task 1: Harden the shared cascade behavior

**Files:**
- Modify: `src/components/ui/academic/AcademicStudentCascade.tsx`
- Test: `src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts`

**Interfaces:**
- Consumes: `AcademicStudentCascadeValue` and `AcademicStudentCascadeOptions`.
- Produces: `filterAcademicStudentCascadeOptions(value, options)` and the existing component callback shape.

- [ ] **Step 1: Write failing tests** for filtering students by all four selected IDs and for the exact reset values emitted when stage, grade, section, or classroom changes.
- [ ] **Step 2: Run the focused test** with `npm run test:run -- src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts`; confirm the new assertions fail for the current behavior.
- [ ] **Step 3: Implement the minimal filter/reset changes** while keeping labels, disabled states, and existing option normalization unchanged.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.

### Task 2: Verify and complete redemption modal integration

**Files:**
- Modify: `src/features/reinforcement/components/RewardRedemptionCreateModal.tsx`
- Test: `src/features/reinforcement/components/__tests__/RewardRedemptionCreateModal.test.tsx` (create if the focused modal test does not exist)

**Interfaces:**
- Consumes: cascade output `{ stageId, gradeId, sectionId, classroomId, studentId }` and filter-options student records.
- Produces: the existing redemption payload with the selected `studentId` and matching `enrollmentId`.

- [ ] **Step 1: Add a failing interaction test** that selects the hierarchy in order, verifies the student control is disabled before classroom selection, and asserts submit includes the selected enrollment ID.
- [ ] **Step 2: Run the modal test** with `npm run test:run -- src/features/reinforcement/components/__tests__/RewardRedemptionCreateModal.test.tsx`; confirm it fails before the integration is complete.
- [ ] **Step 3: Implement only the required mapping/reset behavior** and keep catalog lookup, validation, loading, and error handling intact.
- [ ] **Step 4: Run the modal test** and confirm it passes.

### Task 3: Replace the overview's global student select

**Files:**
- Modify: `src/features/reinforcement/pages/RewardsOverviewPage.tsx`
- Test: `src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx`

**Interfaces:**
- Consumes: the existing filter-options response and `useReinforcementUrlFilters` setter.
- Produces: the same `studentId` URL parameter used by `getRewardsOverview`.

- [ ] **Step 1: Add a failing page test** that confirms the student filter is not selectable before classroom selection, then selects stage/grade/section/classroom/student and asserts the overview request receives only the selected student ID.
- [ ] **Step 2: Run the focused page test** with `npm run test:run -- src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx`; confirm the new cascade assertions fail.
- [ ] **Step 3: Store the full filter-options records and render `AcademicStudentCascade`** with an overview value adapter that clears dependent URL keys while retaining existing non-academic filters.
- [ ] **Step 4: Run the focused page test** and confirm it passes without changing status/type/date filters.

### Task 4: Verify the rewards scope and code quality

**Files:**
- Review: `src/features/reinforcement/pages/RewardsOverviewPage.tsx`, `src/features/reinforcement/components/RewardRedemptionCreateModal.tsx`, `src/components/ui/academic/AcademicStudentCascade.tsx`

- [ ] **Step 1: Run all affected tests** with `npm run test:run -- src/components/ui/academic/__tests__/AcademicStudentCascade.test.ts src/features/reinforcement/components/__tests__/RewardRedemptionCreateModal.test.tsx src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx`.
- [ ] **Step 2: Run `npm run typecheck`** and fix only errors caused by this change.
- [ ] **Step 3: Run `npm run lint -- --quiet`** on the changed files or the project lint command if file targeting is unsupported.
- [ ] **Step 4: Run `git diff --check` and inspect the diff** to ensure no unrelated dirty changes are staged or overwritten.
