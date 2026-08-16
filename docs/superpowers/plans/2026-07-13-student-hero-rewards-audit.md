# Student Hero Rewards Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Student Profile Hero Journey rewards area into a staff-first audit workspace backed by the real rewards DTO.

**Architecture:** Extend the existing rewards normalizer with the endpoint’s summary, completed-mission reconciliation, ledger, badges, and optional event fields. Keep `HeroJourneyTab` as the data owner, but extract the audit presentation into focused components so permissions, coverage math, and row mapping can be tested independently.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind CSS, next-intl, Lucide, Vitest, React Testing Library.

## Global Constraints

- Request `includeEvents=true` when loading staff audit data.
- Use `reinforcement.hero.progress.view` for view gating and `reinforcement.hero.progress.manage` for mutations; update the frontend permission union before using them.
- Do not show disabled or explanatory mutation controls to unauthorized users.
- Preserve the active academic year and term query parameters.
- Keep API authorization authoritative; retain action form values after mutation failure.
- Use existing UI primitives, color-independent status labels, responsive table-to-card behavior, and English/Arabic messages.

---

## File Structure

- Modify `src/hooks/usePermissions.ts`: add canonical Hero Journey permission keys.
- Modify `src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts`: model rewards summary, ledger, earned badge, completed-mission reward state, and optional event records.
- Modify `src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts`: normalize all rewards DTO fields, calculate coverage, resolve mission labels, and merge/sort audit entries.
- Create `src/features/students-guardians/students/components/tabs/HeroJourneyRewardsAudit.tsx`: summary, reconciliation, and audit presentation.
- Modify `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx`: request event data, use the canonical permissions, and compose the audit component.
- Modify `messages/en.json` and `messages/ar.json`: rewards-audit labels, statuses, and state text.
- Modify `src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts` and `HeroJourneyTab.test.tsx`: DTO and UI coverage.

### Task 1: Align permissions and normalize the rewards DTO

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts`
- Modify: `src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts`
- Test: `src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts`

**Interfaces:** `normalizeHeroJourneyRewards(raw)` returns `summary`, `xpLedger`, `badges`, `missions`, and `events`; `getRewardCoverage(summary)` returns display-safe coverage percentages.

- [ ] Write failing normalization tests using a DTO fixture containing one XP grant, one earned badge, one mission with a configured-but-unawarded badge, and one `badge_awarded` event.

```ts
expect(rewards.summary.completedMissions).toBe(2);
expect(rewards.missions[1].badgeAwarded).toBe(false);
expect(getRewardCoverage(rewards.summary)).toEqual({ xp: 50, badges: 50 });
```

- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts`; expect FAIL because the normalizer drops DTO fields.
- [ ] Add `reinforcement.hero.progress.view` and `reinforcement.hero.progress.manage` to `PermissionKey`; normalize exact presenter fields including `reasonAr`, `actorUserId`, `completedAt`, `earnedAt`, `xpGranted`, and `badgeAwarded`.
- [ ] Re-run the presentation test; expect PASS.
- [ ] Commit with `git add src/hooks/usePermissions.ts src/features/students-guardians/students/components/tabs/heroJourneyTabTypes.ts src/features/students-guardians/students/components/tabs/heroJourneyTabPresentation.ts src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts && git commit -m "feat: model hero rewards audit data"`.

### Task 2: Build the reconciliation and audit UI

**Files:**
- Create: `src/features/students-guardians/students/components/tabs/HeroJourneyRewardsAudit.tsx`
- Modify: `messages/en.json`
- Modify: `messages/ar.json`
- Test: `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`

**Interfaces:** Component accepts normalized `HeroJourneyRewards`, a mission-title map, and locale. It performs no network calls or mutations.

- [ ] Write a failing test asserting that a configured-but-unawarded reward is shown as “Pending award,” while a null reward configuration is shown as “Not configured.”
- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`; expect FAIL because no reconciliation view exists.
- [ ] Implement a five-metric summary, mission reconciliation table/card list, and newest-first unified audit entries. Each audit row must expose reward type, amount or badge name, mission title, localized reason, actor, and timestamp.
- [ ] Add English and Arabic translation keys under `students_guardians.profile.hero_journey.rewards_audit`.
- [ ] Re-run the tab test; expect PASS.
- [ ] Commit with `git add src/features/students-guardians/students/components/tabs/HeroJourneyRewardsAudit.tsx messages/en.json messages/ar.json src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx && git commit -m "feat: add hero rewards audit workspace"`.

### Task 3: Integrate audit data, actions, and screen states

**Files:**
- Modify: `src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx`

**Interfaces:** The tab calls `getStudentHeroJourneyRewards(studentId, { academicYearId, termId, includeEvents: true })`, renders the audit component, and only renders mutations when `hasPermission("reinforcement.hero.progress.manage")`.

- [ ] Write failing tests that verify `includeEvents: true`, hidden actions without manage permission, a retryable load error, and mutation refresh of both progress and rewards.
- [ ] Run the focused tab test; expect FAIL because the current query omits events and uses noncanonical permission keys.
- [ ] Replace action permission checks with the canonical manage permission, use the canonical view permission to gate the audit, and load events with the rewards request. Keep grant-XP inputs after failed mutations.
- [ ] Render separate empty states for no completed missions and no audit history; keep the existing loading skeleton and Retry error card.
- [ ] Run `npm run test:run -- src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx src/features/students-guardians/students/components/tabs/__tests__/heroJourneyTabPresentation.test.ts && npm run lint -- src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx src/features/students-guardians/students/components/tabs/HeroJourneyRewardsAudit.tsx`; expect PASS.
- [ ] Commit with `git add src/features/students-guardians/students/components/tabs/HeroJourneyTab.tsx src/features/students-guardians/students/components/tabs/__tests__/HeroJourneyTab.test.tsx && git commit -m "feat: integrate hero rewards audit"`.

## Plan Self-Review

- Task 1 covers backend DTO fidelity and canonical permissions.
- Task 2 covers staff-facing summary, reward-gap reconciliation, audit chronology, translation, and responsive semantics.
- Task 3 covers endpoint query behavior, permission-hidden actions, loading/error/empty states, refresh behavior, and final verification.
- All field names and permission keys are taken directly from the backend controller, query DTO, and presenter.
