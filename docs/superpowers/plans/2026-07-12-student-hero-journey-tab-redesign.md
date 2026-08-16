# Student Hero Journey Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw Hero Journey API rendering with an accessible progress dashboard and permission-gated XP and badge actions.

**Architecture:** `HeroJourneyTab` remains the data owner, loading progress and rewards in parallel and refreshing both after a mutation. A typed normalization boundary keeps untyped API data out of presentational mission, activity, and modal components.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind, next-intl, Lucide, Vitest, React Testing Library.

## Global Constraints

- Preserve active academic year and term query parameters.
- Only render Grant XP with `reinforcement.xp.manage`; only render Award badge with `reinforcement.rewards.manage`.
- Do not render disabled or explanatory controls for missing permissions.
- Keep API authorization authoritative; preserve form values after a failed mutation.
- Use project UI components, Lucide, English/Arabic messages, color-independent labels, and responsive layouts.

---

## File Structure

- Modify `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx`: data orchestration, layout, permission checks.
- Create `src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts`: normalized endpoint types.
- Create `src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts`: record-safe normalizers and display helpers.
- Create `src/features/students-guardians/students/components/tabs/HeroJourneyMissionCard.tsx`: mission progress card.
- Create `src/features/students-guardians/students/components/tabs/HeroJourneyActivityFeed.tsx`: event feed.
- Create `src/features/students-guardians/students/components/tabs/HeroJourneyRewardActionsModal.tsx`: action forms.
- Modify `messages/en.json` and `messages/ar.json`: `students_guardians.profile.hero_journey` copy.
- Create `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx` and `heroJourneyTabPresentation.test.ts`.

### Task 1: Create typed API normalization

**Files:**
- Create: `src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts`
- Create: `src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts`
- Test: `src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts`

**Interfaces:** Produces `normalizeHeroJourneyProgress`, `normalizeHeroJourneyRewards`, `getMissionTitle`, and `isAwaitingMissionCompletion` for the tab and all presentation components.

- [ ] Write a failing normalization test.

```ts
const progress = normalizeHeroJourneyProgress({ missions: [{ missionId: "m-2", status: "in_progress", progressPercent: 100, titleEn: "Test mission", objectives: { required: 2, completedRequired: 2 } }] });
expect(isAwaitingMissionCompletion(progress.missions[0])).toBe(true);
expect(getMissionTitle(progress.missions[0], "en")).toBe("Test mission");
```

- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts`; expect FAIL because the module is absent.
- [ ] Implement safe `asRecord`, `asArray`, `asNumber`, and `asString` helpers; normalize missing values to zero/empty defaults; sort cloned mission and event arrays by descending valid timestamp.

```ts
export const isAwaitingMissionCompletion = (mission: HeroJourneyMission) => mission.status === "in_progress" && mission.requiredObjectives > 0 && mission.completedRequiredObjectives >= mission.requiredObjectives;
```

- [ ] Run the same test; expect PASS.
- [ ] Commit: `git add src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts && git commit -m "feat: normalize hero journey profile data"`.

### Task 2: Build localized mission and activity presentation

**Files:**
- Create: `src/features/students-guardians/students/components/tabs/HeroJourneyMissionCard.tsx`
- Create: `src/features/students-guardians/students/components/tabs/HeroJourneyActivityFeed.tsx`
- Modify: `messages/en.json`, `messages/ar.json`
- Test: `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`

**Interfaces:** Each component consumes only normalized types from Task 1. The feed accepts a mission-title map and never renders raw IDs as primary copy.

- [ ] Write failing screen tests for the `in_progress`/all-required-objectives callout, mission-title-resolved activity, and progressbar ARIA attributes.
- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`; expect FAIL.
- [ ] Implement a card with localized title fallback, status text/pill, `completedRequired / required` text, XP/badge reward, and accessible bounded progress:

```tsx
<div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mission.progressPercent} className="h-2 overflow-hidden rounded-full bg-gray-100">
  <div className="h-full rounded-full bg-teal-600 transition-[width] duration-200" style={{ width: `${Math.min(Math.max(mission.progressPercent, 0), 100)}%` }} />
</div>
```

Use `Activity`, `ClipboardCheck`, `CheckCircle2`, `Sparkles`, `Award`, and `Circle` fallback for events. Add matching English and Arabic copy for summary, statuses, objectives, rewards, activity, empty/error/retry, and finalization callout.
- [ ] Re-run test; expect PASS.
- [ ] Commit: `git add src/features/students-guardians/students/components/tabs/HeroJourneyMissionCard.tsx src/features/students-guardians/students/components/tabs/HeroJourneyActivityFeed.tsx messages/en.json messages/ar.json src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx && git commit -m "feat: present hero journey mission progress"`.

### Task 3: Add hidden permission-gated reward actions

**Files:**
- Create: `src/features/students-guardians/students/components/tabs/HeroJourneyRewardActionsModal.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx`
- Test: `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`

**Interfaces:** Modal receives `progressId`, `canGrantXp`, `canAwardBadge`, and `onSuccess(): Promise<void>`. Parent owns `load()`.

- [ ] Write failing tests: neither action exists with permissions false; XP action exists only with `reinforcement.xp.manage`; submit `{ amount: 25, reason: undefined }` refreshes both endpoints; rejected mutation leaves fields populated and displays `role="alert"`.
- [ ] Run focused tab test; expect FAIL.
- [ ] Use the existing hook and keys exactly:

```ts
const { hasPermission, isPermissionsReady } = usePermissions();
const canGrantXp = isPermissionsReady && hasPermission("reinforcement.xp.manage");
const canAwardBadge = isPermissionsReady && hasPermission("reinforcement.rewards.manage");
```

Render no action container until either value is true. Use shared `Modal`; validate a finite amount greater than zero; on resolved mutation, await `onSuccess()` then close the modal.
- [ ] Re-run focused tab test; expect PASS.
- [ ] Commit: `git add src/features/students-guardians/students/components/tabs/HeroJourneyRewardActionsModal.tsx src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx && git commit -m "feat: gate hero journey reward actions"`.

### Task 4: Compose and verify the responsive dashboard

**Files:**
- Modify: `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`

**Interfaces:** Composes Tasks 1–3 into the final tab; only this module calls service functions.

- [ ] Write failing tests for an initial layout skeleton, error-card Retry reload, and no-missions academic-context empty state.
- [ ] Run focused tab test; expect FAIL.
- [ ] Render a summary card with completion rate, total mission count, four labeled status counts and segmented bar; mission cards and activity feed in `xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]`; and rewards snapshot below. Use a single alert with a Retry button for load errors and one empty state when `missions.length === 0`.
- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts && npm run lint -- --file src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx --file src/features/students-guardians/students/components/tabs/HeroJourneyMissionCard.tsx --file src/features/students-guardians/students/components/tabs/HeroJourneyActivityFeed.tsx --file src/features/students-guardians/students/components/tabs/HeroJourneyRewardActionsModal.tsx && npm run typecheck`; expect all PASS.
- [ ] Commit: `git add src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx && git commit -m "feat: redesign student hero journey tab"`.

## Plan Self-Review

- Tasks 1–4 cover response mapping, summary, missions, activities, rewards, hidden permission gating, Arabic/English copy, responsive UI, and all required states.
- All permission keys are canonical keys from `usePermissions.ts`; no new authorization system is introduced.
- Later tasks only consume normalized types and functions defined in Task 1; no placeholders remain.
