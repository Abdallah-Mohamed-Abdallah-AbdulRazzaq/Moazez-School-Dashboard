# Homework UI/UX and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Homework deadline, review, grade-sync, creation, and mobile navigation workflows clearer and accessible without changing backend behavior.

**Architecture:** Reuse the shared date-time picker and existing Homework action handlers. Keep guidance derived from existing workflow predicates, expose it as localized presentation state, and add only DOM-level accessibility behavior to the drawer.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, MUI X date pickers, Vitest, Testing Library.

## Global Constraints

- Preserve Homework API payloads, permissions, and lifecycle predicates.
- Add Arabic and English copy for every new user-visible label.
- Do not touch the user's unrelated working-tree changes.
- Use test-first red/green cycles for each production behavior.

---

### Task 1: Deadline time selection

**Files:**
- Modify: `src/features/academics/homework/pages/CreateHomeworkPage.tsx`
- Modify: `src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx`
- Test: `src/features/academics/homework/pages/__tests__/CreateHomeworkPage.test.tsx`
- Test: `src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx`

- [ ] Write failing tests that expose a `dueAt` date-time control and submit its ISO value.
- [ ] Run the focused tests and confirm the date-only implementation cannot satisfy the expectation.
- [ ] Replace the two due-date controls with `DateTimePicker`, retaining the existing ISO update behavior and validation errors.
- [ ] Run focused tests and commit the passing implementation.

### Task 2: Review workflow guidance and accessible drawer

**Files:**
- Modify: `src/features/academics/homework/components/HomeworkSubmissionReviewPanel.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/academics/homework/components/__tests__/HomeworkSubmissionReviewPanel.test.tsx`

- [ ] Write failing tests for required-answer progress, unsaved save/discard controls, disabled-action guidance, and mobile dialog semantics.
- [ ] Run the component test and confirm the guidance and dialog elements are absent.
- [ ] Add small derived presentation helpers, a visible readiness message, a save/discard bar, and keyboard/focus behavior for the drawer.
- [ ] Replace undeclared gray utilities with the declared Tailwind scale and run the focused test.
- [ ] Commit the passing behavior and copy.

### Task 3: Grade-sync freshness and action guidance

**Files:**
- Modify: `src/features/academics/homework/components/HomeworkGradeSyncPanel.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/academics/homework/components/__tests__/HomeworkGradeSyncPanel.test.tsx`

- [ ] Write failing tests for `lastSyncedAt` display and an explanatory message when linking or syncing is unavailable.
- [ ] Run the focused test and confirm it fails because those elements do not exist.
- [ ] Render localized freshness and action-readiness text from existing status and permission state without altering authorization gates.
- [ ] Run focused tests and commit the passing behavior and copy.

### Task 4: Final guard

**Files:**
- Review: all Task 1-3 files

- [ ] Review the changed production diff for duplicate workflow rules, swallowed errors, unsupported APIs, and inaccessible controls.
- [ ] Review changed tests for behavior-focused coverage and boundary-only mocks.
- [ ] Run `npx vitest run src/features/academics/homework src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx`.
- [ ] Run `npm run typecheck`, touched-file ESLint, `git diff --check`, and `npm run build`.
- [ ] Commit any final guard corrections.
