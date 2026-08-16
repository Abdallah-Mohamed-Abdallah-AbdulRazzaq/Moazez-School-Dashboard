# Guarded Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the sidebar loader from starting until guarded navigation is permitted.

**Architecture:** Preserve `GuardedLink` as the navigation boundary. Move its navigation-start notification into the existing guarded action so sidebar state and router execution share the same lifecycle.

**Tech Stack:** React 19, Next.js 16 navigation, TypeScript, Vitest, Testing Library

---

### Task 1: Correct guarded navigation lifecycle

**Files:**
- Modify: `src/components/navigation/GuardedLink.tsx:117-129`
- Test: `src/components/navigation/__tests__/GuardedLink.test.tsx`

- [x] **Step 1: Write the failing regression test**

Add a test that captures the function passed to `guardedNavigate`, clicks a link with `onNavigationStart`, and asserts the callback and router remain untouched until the captured action runs.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:run -- src/components/navigation/__tests__/GuardedLink.test.tsx`

Expected: FAIL because `onNavigationStart` currently fires on click before the guarded action runs.

- [x] **Step 3: Implement the minimal fix**

Move:

```tsx
onNavigationStart?.();
```

from before `guardedNavigate` to the first line of its callback.

- [x] **Step 4: Verify the focused suite and static checks**

Run:

```text
npm run test:run -- src/components/navigation/__tests__/GuardedLink.test.tsx
npm run typecheck
npx eslint src/components/navigation/GuardedLink.tsx src/components/navigation/__tests__/GuardedLink.test.tsx
```

Expected: all commands exit successfully.

### Task 2: Prevent duplicate expired-session redirects

**Files:**
- Modify: `src/features/auth/context/AuthProvider.tsx`
- Test: `src/features/auth/context/__tests__/AuthProvider.test.tsx`

- [x] **Step 1: Add a failing test that dispatches two session-expired events and expects one login redirect**
- [x] **Step 2: Verify the test fails with three router transitions**
- [x] **Step 3: Remove redirect ownership from the session event handler**
- [x] **Step 4: Verify route protection performs one login redirect**
