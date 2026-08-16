# Homework Lifecycle UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Core homework UI actions and editability to the backend lifecycle while adding confirmed list quick actions and full draft reset.

**Architecture:** A pure lifecycle policy maps normalized statuses to editability and valid actions. Builder and list consume that policy, while existing service lifecycle functions remain the only mutation path.

**Tech Stack:** React, TypeScript, Next.js, next-intl, Vitest, Testing Library.

---

### Task 1: Lifecycle Policy

**Files:**
- Create: `src/features/academics/homework/utils/homeworkLifecycle.ts`
- Create: `src/features/academics/homework/utils/homeworkLifecycle.test.ts`
- Modify: `src/features/academics/homework/services/homeworkApi.types.ts`
- Modify: `src/features/academics/homework/services/homeworkMappers.ts`

- [ ] Write parameterized tests asserting `draft -> publish,cancel`, `published -> close,cancel`, and no actions for `closed`, `cancelled`, or `archived`.
- [ ] Run the test and verify failure because the policy is missing.
- [ ] Implement `homeworkLifecycle(status)` returning `isEditable` and `actions`.
- [ ] Normalize backend `ARCHIVED` to frontend `archived` instead of falling back to draft.
- [ ] Run policy and mapper tests.

### Task 2: Builder Lifecycle And Reset

**Files:**
- Modify: `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] Make every non-draft status read-only by consuming lifecycle policy.
- [ ] Render only valid current-status lifecycle commands.
- [ ] Disable draft Publish while any assignment/question/order change is dirty and show save-first guidance.
- [ ] Add a confirmed Reset command that restores assignment and questions from last saved snapshots, removes temporary questions, restores deleted/reordered questions, clears validation errors, and restores selection.
- [ ] Keep Publish, Close, Cancel, and Reset confirmation copy translated.

### Task 3: List Quick Actions

**Files:**
- Create: `src/features/academics/homework/components/HomeworkLifecycleMenu.tsx`
- Modify: `src/features/academics/homework/pages/HomeworkListPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] Add an actions column with a three-dot menu for manageable, open-term assignments having valid actions.
- [ ] Stop menu click propagation so row navigation remains independent.
- [ ] Confirm each action, disable the pending row menu, call the existing lifecycle service, and replace the returned row in state.
- [ ] Never include an archive item or archive API call.

### Task 4: Verification

**Files:**
- Modify only when a verification failure identifies a defect.

- [ ] Run all homework tests and the focused lifecycle tests.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run ESLint on touched production and test files.
- [ ] Parse English and Arabic translation JSON.
