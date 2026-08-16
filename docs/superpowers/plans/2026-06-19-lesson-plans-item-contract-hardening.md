# Lesson Plans Item Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Lesson Plans item actions, response mapping, and rendering with the verified Moazez Backend item contract.

**Architecture:** Keep the existing adapter and board composition. Add a pure transition selector for backend-valid actions, preserve backend response metadata in the UI model, and make cards render from response data when curriculum records are absent.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Vitest, Testing Library.

---

### Task 1: Preserve backend item response metadata

**Files:**
- Modify: `src/features/academics/lesson-plans/services/lessonPlansBackendTypes.ts`
- Modify: `src/features/academics/lesson-plans/services/lessonPlansMappers.ts`
- Modify: `src/features/academics/lesson-plans/services/lessonPlansApiAdapter.ts`
- Test: `src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts`
- Test: `src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts`

- [ ] **Step 1: Write failing mapper and adapter tests**

Assert that mapped items preserve `unitTitle`, `lessonTitle`, nullable scheduling identifiers, lifecycle timestamps, and creation/update timestamps. Assert create/update/activate/archive parse detail responses with items.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlansMappers.test.ts src/features/academics/lesson-plans/services/__tests__/lessonPlansApiAdapter.test.ts`

Expected: failures for metadata fields missing from the UI item model or detail response mapping.

- [ ] **Step 3: Extend the UI item model and mapper**

Add the verified response fields to `LessonPlanItem`, mapping nullable values to optional UI values while preserving `rawStatus`. Keep `rescheduled` and any future status mapped to `UNKNOWN`.

- [ ] **Step 4: Correct plan mutation response typing**

Use `LessonPlanDetailResponseDto` and `mapLessonPlanDetailDto` for create, update, activate, and archive responses so returned items are preserved.

- [ ] **Step 5: Run the focused tests and verify success**

Run the command from Step 2. Expected: all focused tests pass.

### Task 2: Enforce the backend status transition matrix

**Files:**
- Modify: `src/features/academics/lesson-plans/components/lessonPlanBoardActions.ts`
- Modify: `src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx`
- Test: `src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`

- [ ] **Step 1: Write failing transition tests**

Test the exact action sets:

```ts
PLANNED -> ["IN_PROGRESS", "DONE", "SKIPPED", "CANCELLED"]
IN_PROGRESS -> ["DONE", "SKIPPED", "CANCELLED"]
DONE | SKIPPED | CANCELLED | UNKNOWN -> []
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/lessonPlanBoardActions.test.ts`

Expected: current menu construction exposes invalid terminal transitions.

- [ ] **Step 3: Implement a pure transition selector**

Export `lessonPlanItemTransitions(status)` from `lessonPlanBoardActions.ts` and use it to construct status menu entries. Reorder, notes, and remove actions remain available according to read-only state.

- [ ] **Step 4: Run the transition tests and verify success**

Run the command from Step 2. Expected: all transition scenarios pass.

### Task 3: Render items without requiring current curriculum records

**Files:**
- Modify: `src/features/academics/lesson-plans/components/LessonPlanItemCard.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeekColumn.tsx`
- Modify: `src/features/academics/lesson-plans/components/WeeksBoardMobile.tsx`
- Test: `src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx`

- [ ] **Step 1: Write a failing orphan-item component test**

Render an item without a curriculum `Lesson` and assert that its backend `title` or `lessonTitle`, status, and scheduling metadata remain visible.

- [ ] **Step 2: Run the component test and verify failure**

Run: `npm run test:run -- src/features/academics/lesson-plans/components/__tests__/LessonPlanItemCard.test.tsx`

Expected: failure because `lesson` is currently required.

- [ ] **Step 3: Make curriculum lesson optional**

Change the card to accept `lesson?: Lesson` and derive the label in this order: `item.title`, `item.lessonTitle`, `lesson?.title`. Render every plan item on desktop and mobile instead of dropping items with missing curriculum lookups.

- [ ] **Step 4: Run the component test and verify success**

Run the command from Step 2. Expected: test passes.

### Task 4: Verification and guard pass

**Files:**
- Review all production and test files changed by Tasks 1–3.

- [ ] **Step 1: Run feature tests**

Run: `npm run test:run -- src/features/academics/lesson-plans`

Expected: all Lesson Plans tests pass.

- [ ] **Step 2: Run static and translation checks**

Run:

```text
npm run typecheck
npm run lint
npm run guard:i18n
```

Expected: all commands exit successfully.

- [ ] **Step 3: Audit unsupported routes and statuses**

Run: `rg -n "PUT.*lesson-plans/items|items/status|items/notes|items/reorder|POST.*items/move|RESCHEDULED" src/features/academics/lesson-plans --glob '!**/__tests__/**'`

Expected: no unsupported route calls and no supported UI `RESCHEDULED` status.

- [ ] **Step 4: Run clean-code and test guard reviews**

Check production changes for dead code, duplicated transition knowledge, broad error swallowing, and unnecessary abstractions. Check tests for behavior-based assertions and avoid internal implementation mocks.
