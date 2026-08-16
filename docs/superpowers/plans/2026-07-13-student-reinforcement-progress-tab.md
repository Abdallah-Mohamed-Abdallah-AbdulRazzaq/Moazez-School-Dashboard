# Student Reinforcement Progress Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a localized Student Profile tab backed by `GET /reinforcement/students/{studentId}/progress`.

**Architecture:** Create a profile wrapper around the existing reinforcement service and `StudentProgressCard`, then register it in both Student Profile navigation implementations and the App Router. Preserve the active academic year and term.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Vitest, React Testing Library.

## Global Constraints

- Reuse `getStudentReinforcementProgress` and `StudentProgressCard`.
- Gate reads with `reinforcement.overview.view`.
- Do not duplicate the standalone page header or academic/student filter.
- Localize the tab label in English and Arabic.
- Follow TDD and preserve unrelated worktree changes.

---

### Task 1: Build the profile tab wrapper

**Files:**
- Create: `src/features/students-guardians/students/components/tabs/ReinforcementProgressTab.tsx`
- Create: `src/features/students-guardians/students/components/tabs/__tests__/ReinforcementProgressTab.test.tsx`

**Interfaces:**
- Consumes: `getStudentReinforcementProgress(studentId, { academicYearId, termId })`
- Produces: `ReinforcementProgressTab({ studentId, academicYearId, termId })`

- [x] Write a failing component test for query forwarding, populated rendering, permission denial, retry, and empty state.
- [x] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/ReinforcementProgressTab.test.tsx`; expect failure because the component does not exist.
- [x] Implement the minimal wrapper using existing components and messages.
- [x] Re-run the focused test; expect pass.

### Task 2: Register the tab in both profile surfaces

**Files:**
- Modify: `src/features/students-guardians/students/components/StudentTabLoader.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/index.ts`
- Modify: `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
- Modify: `src/app/[lang]/(dashboard)/students-guardians/students/[studentId]/layout.tsx`
- Create: `src/app/[lang]/(dashboard)/students-guardians/students/[studentId]/reinforcement/page.tsx`
- Modify: `src/features/students-guardians/students/components/__tests__/StudentTabLoader.test.tsx`

**Interfaces:**
- Adds router tab key `reinforcement` and legacy tab key `reinforcementProgress`.
- Both render the same `ReinforcementProgressTab` with active year and term.

- [x] Write a failing loader test that renders `tab="reinforcement"`.
- [x] Run the loader test; expect failure because the tab key is unsupported.
- [x] Register the wrapper, route segment, and both navigation entries.
- [x] Re-run the loader test; expect pass.

### Task 3: Add translations and verify

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Adds `students_guardians.profile.tabs.reinforcement_progress`.

- [x] Add English `Reinforcement Progress` and Arabic `تقدم التعزيز` labels.
- [x] Validate both JSON files and assert both message paths resolve.
- [x] Run focused tab and loader tests.
- [x] Run ESLint on changed production and test files.
- [x] Run `npx tsc --noEmit --pretty false`; expect exit code 0.

## Plan Self-Review

- The endpoint, active context, permission, all screen states, both navigation systems, localization, and verification are covered.
- No new endpoint adapter or duplicate progress presentation is introduced.
- All identifiers match existing service and component exports.
