# Hero Journey Admin Contract Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire every school-management Hero Journey endpoint into tested SIS admin workflows without synthetic progress data.

**Architecture:** Split the current service by catalog, dashboard, progress, and rewards responsibilities. Retain Overview and Missions, add operations routes for real student progress/rewards, and use direct backend summary endpoints.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, existing API client.

## Global Constraints

- Do not alter backend contracts, backend permissions, or global visual theme.
- Use `/reinforcement/hero`, existing response unwrappers, and only backend DTO-supported query fields.
- Never derive student progress from `/overview`; do not send `gradeId` to overview.
- Mutations wait for server success and refetch affected progress, rewards, overview, and active summary data.
- Maintain accessible labels, visible focus, non-color state indicators, and responsive layouts.

---

## File Structure

- Create `services/heroJourneyBackendTypes.ts`, `heroJourneyDashboardService.ts`, `heroJourneyProgressService.ts`, and `heroJourneyRewardsService.ts` under `src/features/hero-journey`.
- Modify `src/features/hero-journey/services/heroJourneyService.ts` into catalog-only compatibility exports; delete its synthetic progress mapper.
- Create operations/reward/detail components under `src/features/hero-journey/components` and routes under `src/app/[lang]/(dashboard)/hero-journey/operations`; use the existing student directory/enrollment source for selection only.
- Modify `HeroJourneyOverviewPage.tsx`, `types/index.ts`, and `src/config/navigation.ts`.
- Create service/component tests beside the above modules and delete obsolete synthetic-progress tests.

### Task 1: Implement direct dashboard contracts and the overview filter fix

**Files:** Create `services/heroJourneyBackendTypes.ts`, `services/heroJourneyDashboardService.ts`, `services/__tests__/heroJourneyDashboardService.test.ts`; modify `services/heroJourneyService.ts` and `components/HeroJourneyOverviewPage.tsx`.

**Interfaces:** `getHeroJourneyOverview(params)`, `getHeroJourneyMap(params)`, `getHeroJourneyStageSummary(stageId, params)`, `getHeroJourneyClassroomSummary(classroomId, params)`, and `getHeroJourneyBadgeSummary(params)`. The overview parameter type excludes `gradeId`.

- [ ] Write failing tests asserting exact paths for overview, map, stage summary, classroom summary, and badge summary; assert a selected grade never appears in an overview URL.
- [ ] Run `npm run test:run -- src/features/hero-journey/services/__tests__/heroJourneyDashboardService.test.ts`; expect failure because this service is absent.
- [ ] Implement functions with `buildReinforcementQueryString` and `unwrapReinforcementItemResponse`; map response fields only when present in backend data.
- [ ] Replace existing overview/map imports, remove `gradeId` from `HeroJourneyOverviewParams`, and keep grade selection client-only until a supported downstream scope is selected.
- [ ] Re-run the focused suite; expect PASS. Commit: `feat: add hero journey dashboard contracts`.

### Task 2: Implement direct progress contracts

**Files:** Create `services/heroJourneyProgressService.ts`, `services/__tests__/heroJourneyProgressService.test.ts`; modify `types/index.ts` and `services/heroJourneyService.ts`.

**Interfaces:** `getStudentHeroJourneyProgress(studentId, query)`, `getHeroJourneyProgress(progressId)`, `startHeroJourneyMission(studentId, missionId, payload)`, `completeHeroJourneyObjective(progressId, objectiveId, payload)`, `completeHeroJourneyMission(progressId, payload)`.

- [ ] Write failing tests for exact GET/POST paths: `/students/:studentId/progress`, `/progress/:progressId`, `/students/:studentId/missions/:missionId/start`, `/progress/:progressId/objectives/:objectiveId/complete`, and `/progress/:progressId/complete`.
- [ ] Run `npm run test:run -- src/features/hero-journey/services/__tests__/heroJourneyProgressService.test.ts`; expect failure because the functions are absent.
- [ ] Add backend DTO/view-model types that represent only returned fields; remove the old overview-based `getHeroJourneyStudentProgress` and its fake level, streak, badge, mission, and objective values.
- [ ] Re-run the focused suite; expect PASS. Commit: `feat: add hero journey progress contracts`.

### Task 3: Implement rewards contracts and accessible confirmation actions

**Files:** Create `services/heroJourneyRewardsService.ts`, `services/__tests__/heroJourneyRewardsService.test.ts`, `components/HeroJourneyRewardActionModal.tsx`, `components/__tests__/HeroJourneyRewardActionModal.test.tsx`.

**Interfaces:** `getStudentHeroJourneyRewards(studentId, query)`, `grantHeroJourneyXp(progressId, payload)`, `awardHeroJourneyBadge(progressId, payload)`; modal props are `mode`, `isOpen`, `onClose`, `onSubmit`, and `badges`.

- [ ] Write failing tests for exact rewards, XP grant, and badge award paths and request bodies.
- [ ] Implement API functions with response unwrapping and no client-side ledger mutation.
- [ ] Write component tests for required XP amount/badge, disabled submit while pending, and a visible `aria-live` server error.
- [ ] Implement labelled fields, confirmation copy, pending lock, and error persistence. Run both focused suites; expect PASS. Commit: `feat: add hero journey reward actions`.

### Task 4: Create the operations workspace and detail workflow

**Files:** Create `components/HeroJourneyOperationsPage.tsx`, `components/HeroJourneyProgressDetail.tsx`, `components/__tests__/HeroJourneyOperationsPage.test.tsx`, `app/[lang]/(dashboard)/hero-journey/operations/page.tsx`, `app/[lang]/(dashboard)/hero-journey/operations/[studentId]/page.tsx`; modify `src/config/navigation.ts`.

**Interfaces:** Operations consumes the existing student directory/enrollment source for search/selection and Task 2/3 services for Hero data. Detail receives a real progress record and rewards response; selected row route is `/${locale}/hero-journey/operations/${studentId}`.

- [ ] Write failing page tests for loading, empty, direct-progress rendering, successful action refresh, and retained detail/error after rejected action.
- [ ] Implement student search/selection from existing directory/enrollment data without showing derived Hero values in the list; add route-backed selection, responsive detail drawer/page, and state-valid start/complete/XP/badge controls.
- [ ] After each successful mutation, refetch progress, rewards, overview, and any opened summary. Add Operations navigation. Run page tests; expect PASS. Commit: `feat: add hero journey operations workspace`.

### Task 5: Integrate direct summary drill-downs and complete verification

**Files:** Create `components/HeroJourneySummaryDetailPanel.tsx`, `components/__tests__/HeroJourneyOverviewPage.test.tsx`; modify `components/HeroJourneyOverviewPage.tsx`, `components/HeroJourneyStudentDetailContent.tsx`, `types/index.ts`, and `__tests__/heroJourneyService.test.ts`.

**Interfaces:** Summary panel receives `kind: "stage" | "classroom" | "badge"`, optional resource id, accepted date-range params, and `onClose`.

- [ ] Write failing tests proving every summary trigger uses the matching Task 1 endpoint and that overview with a chosen grade sends no `gradeId`.
- [ ] Implement keyboard-dismissible summary panel with loading, empty, retry, and non-color status states; delete overview-derived student detail rendering.
- [ ] Assert every one of the 25 backend Hero Journey paths in exactly one service test.
- [ ] Run `npm run test:run -- src/features/hero-journey`, `npm run lint`, and `npm run build`; expect all PASS.
- [ ] Manually verify 375px, 768px, 1024px, and 1440px for overview filters, operations navigation, actions, rejection states, and summary panels. Commit: `test: cover hero journey admin contract wiring`.

## Self-Review

- Tasks 1-3 wire all eleven missing endpoints; Tasks 4-5 expose them in admin workflows and validate all 25 endpoints.
- The plan has no deferred markers and preserves the approved scope: no backend work, no permissions change, and no global redesign.
- Service functions produced in Tasks 1-3 are the only data dependencies introduced in Tasks 4-5.
