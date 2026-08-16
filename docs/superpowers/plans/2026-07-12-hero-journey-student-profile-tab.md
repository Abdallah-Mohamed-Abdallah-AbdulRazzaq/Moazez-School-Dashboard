# Hero Journey Student Profile Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone Hero Journey Operations UI with a direct-data Hero Journey tab in Student Profile.

**Architecture:** Retain the newly added Hero Journey services and mount their reads/actions through the established `StudentProfilePage` tab registry. Reuse the Student Profile's tab shell, Button, card, loader, empty, and error patterns; do not create new navigation or an operations route.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, existing Student Profile components.

## Global Constraints

- Reuse existing Student Profile tab framework and UI primitives.
- Load direct Hero progress/rewards only when the Hero Journey tab is active.
- Remove `/hero-journey/operations`, Overview's Operations link, and the standalone Operations component/test.
- Do not derive Hero progress from overview data.

### Task 1: Create the profile tab with direct reads

**Files:** Create `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx` and its test; modify `components/tabs/index.ts`, `pages/StudentProfilePage.tsx`.

- [ ] Write a failing tab test that mocks `getStudentHeroJourneyProgress` and `getStudentHeroJourneyRewards`, renders with a `Student`, and expects progress/reward content after load.
- [ ] Run the focused test; expect failure because `HeroJourneyTab` is absent.
- [ ] Implement `HeroJourneyTab({ student, academicYearId, termId })` using the same card/loader/error conventions as `GradesTab`; fetch direct progress and rewards in its effect and render only API-provided fields.
- [ ] Add `heroJourney` to `TabKey`, tabs with the existing `Award` icon, and `tabContent`; add the matching translation key in the Student Profile locale messages.
- [ ] Re-run focused tab/profile tests; expect PASS. Commit: `feat: add hero journey student profile tab`.

### Task 2: Move admin mutations into the tab

**Files:** Modify `HeroJourneyTab.tsx` and its test.

- [ ] Write failing tests for positive-only XP grant, badge award, server error visibility, and refetch after each success.
- [ ] Reuse the existing Button and confirmation/dialog patterns from Student Profile; call `grantHeroJourneyXp` and `awardHeroJourneyBadge` with the loaded progress ID and refetch both direct reads after success.
- [ ] Re-run focused tests; expect PASS. Commit: `feat: add hero journey profile actions`.

### Task 3: Remove the standalone UI and verify

**Files:** Delete `HeroJourneyOperationsPage.tsx`, its test, and `app/[lang]/(dashboard)/hero-journey/operations/page.tsx`; modify `HeroJourneyOverviewPage.tsx`.

- [ ] Write/adjust overview test to assert no Operations link is rendered.
- [ ] Delete the route/component/test and remove the Overview header link.
- [ ] Run `npm run test:run -- src/features/hero-journey src/features/students-guardians/students`; then `npm run lint` and `npm run build` without a short timeout. Commit: `refactor: move hero journey operations into student profile`.

## Self-Review

- The plan removes the rejected UI, keeps direct contract services, and places all student operations in established profile tabs.
- Every task is test-first and preserves existing component conventions.
