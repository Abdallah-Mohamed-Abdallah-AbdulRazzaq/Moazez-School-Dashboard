# Timetable Stage and Effective Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stage-scoped timetable configuration and correctly distinguish an exact editable config from the backend-selected inherited published timetable.

**Architecture:** Pure scope helpers construct exact backend requests, while a workspace-state resolver keeps exact and effective configs separate. The timetable hook fetches exact config data for editing and `/all` data for inherited classroom display; presentational components receive a normalized mode instead of inferring inheritance.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-academics-timetable-backend-gap-closure-design.md`

## Global Constraints

- Frontend only; do not change backend endpoints, schemas, deployment, authentication, or permissions.
- Use existing components from `src/components/ui` and Lucide icons.
- Backend `effectiveConfig` is authoritative; do not recompute the published winner.
- An inherited timetable is read-only until an exact override is created.
- Preserve bilingual, RTL, keyboard, focus, and responsive behavior at 375, 768, 1024, and 1440 pixels.
- Apply `clean-code-guard` after every production-code change and `test-guard` after every test-code change.
- Run focused tests, lint, typecheck, and build. Ask the owner before running the complete `npm run test:run` suite.
- Start from the latest merged `origin/main`; use a normal feature branch and do not merge the PR.

---

## File structure

- Create `src/features/academics/timetable/services/timetableScope.ts` — exact scope construction and identity.
- Create `src/features/academics/timetable/services/__tests__/timetableScope.test.ts` — scope behavior.
- Create `src/features/academics/timetable/services/timetableWorkspaceState.ts` — exact/inherited/unconfigured state resolver.
- Create `src/features/academics/timetable/services/__tests__/timetableWorkspaceState.test.ts` — state tests.
- Create `src/features/academics/timetable/components/TimetableSourceBanner.tsx` — inherited/exact source UI.
- Create `src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx` — banner tests.
- Modify `src/features/academics/timetable/services/timetableApiTypes.ts` — `STAGE`, `stageId`, and effective summary types.
- Modify `src/features/academics/timetable/types/timetableConfig.ts` — stage-aware config model.
- Modify `src/features/academics/timetable/services/timetableApiAdapter.ts` — stage config params.
- Modify `src/features/academics/timetable/services/timetableConfigService.ts` — stage request and mapping.
- Modify `src/features/academics/timetable/services/timetableConfigSource.ts` — stage display name.
- Modify `src/features/academics/timetable/hooks/useTimetableData.ts` — exact/effective loading.
- Modify `src/features/academics/timetable/components/TimetableConfigDialog.tsx` — stage payload.
- Modify `src/features/academics/timetable/components/TimetableView.tsx` — mode and override interaction.
- Modify `src/features/academics/lesson-plans/services/lessonPlanTimetable.ts` — stage candidate support.
- Modify `src/features/attendance/roll-call/utils/policyTimetableConfig.ts` and its test — map attendance stage scope to timetable stage scope.
- Modify `src/features/attendance/excuses/utils/excuseTimetableScope.ts` and its test — include stage in fallback candidates.
- Modify `src/features/attendance/excuses/utils/applyExcuseToAttendance.ts` — include stage config when resolving periods.
- Modify `src/messages/en.json` and `src/messages/ar.json` — source and override copy.

### Task 1: Define stage-aware scope contracts

**Files:**
- Create: `src/features/academics/timetable/services/timetableScope.ts`
- Test: `src/features/academics/timetable/services/__tests__/timetableScope.test.ts`
- Modify: `src/features/academics/timetable/services/timetableApiTypes.ts`
- Modify: `src/features/academics/timetable/types/timetableConfig.ts`

**Interfaces:**
- Produces `TimetableScopeType = "TERM" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM"`.
- Produces `resolveTimetableScopeSelection(input): TimetableScopeSelection` and `timetableConfigScopeId(config): string | undefined`.

- [ ] **Step 1: Write failing scope tests**

```ts
expect(resolveTimetableScopeSelection({ stageId: "s1", gradeId: "", sectionId: "", classroomId: "" }))
  .toEqual({ scopeType: "STAGE", stageId: "s1" });
expect(timetableConfigScopeId({ scopeType: "stage", stageId: "s1", gradeId: null, sectionId: null, classroomId: null }))
  .toBe("s1");
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableScope.test.ts`

Expected: FAIL because `timetableScope.ts` and `STAGE` do not exist.

- [ ] **Step 3: Add the minimal scope implementation**

```ts
export interface TimetableScopeSelection {
  scopeType: TimetableScopeType;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export function resolveTimetableScopeSelection(input: ScopeIds): TimetableScopeSelection {
  if (input.classroomId) return { scopeType: "CLASSROOM", classroomId: input.classroomId };
  if (input.sectionId) return { scopeType: "SECTION", sectionId: input.sectionId };
  if (input.gradeId) return { scopeType: "GRADE", gradeId: input.gradeId };
  if (input.stageId) return { scopeType: "STAGE", stageId: input.stageId };
  return { scopeType: "TERM" };
}
```

Add `stageId: string | null` to `BackendTimetableConfigDto`, `stageId?: string` to config request types, and use stage ID before grade ID in scope identity.

- [ ] **Step 4: Run focused tests and quality guards**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableScope.test.ts`

Expected: PASS. Run `test-guard`, then `clean-code-guard`.

- [ ] **Step 5: Commit**

```powershell
git add src/features/academics/timetable/services/timetableScope.ts src/features/academics/timetable/services/__tests__/timetableScope.test.ts src/features/academics/timetable/services/timetableApiTypes.ts src/features/academics/timetable/types/timetableConfig.ts
git commit -m "feat(timetable): add stage scope contracts"
```

### Task 2: Send and map stage-scoped configs

**Files:**
- Modify: `src/features/academics/timetable/services/timetableApiAdapter.ts`
- Modify: `src/features/academics/timetable/services/timetableConfigService.ts`
- Modify: `src/features/academics/timetable/services/timetableConfigSource.ts`
- Modify: `src/features/academics/timetable/components/TimetableConfigDialog.tsx`
- Test: `src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts`.
- Test: `src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts`.
- Test: `src/features/academics/timetable/services/__tests__/timetableConfigSource.test.ts`.
- Test: `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`.

**Interfaces:**
- Consumes `TimetableScopeSelection` from Task 1.
- Produces exact `/config` requests containing `scopeType: "STAGE"` and `stageId`.

- [ ] **Step 1: Add failing adapter, service, source-name, and dialog tests**

```ts
expect(apiGet).toHaveBeenCalledWith("/academics/timetable/config", {
  params: { academicYearId: "y1", termId: "t1", scopeType: "STAGE", stageId: "s1" },
});
expect(buildConfigRequest(stageConfig)).toMatchObject({ scopeType: "STAGE", stageId: "s1" });
expect(getTimetableConfigSourceName({ scope: "STAGE", id: "s1" }, tree, "en")).toBe("Primary");
```

- [ ] **Step 2: Run the affected tests and verify failures**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts src/features/academics/timetable/services/__tests__/timetableConfigService.test.ts src/features/academics/timetable/services/__tests__/timetableConfigSource.test.ts src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`

- [ ] **Step 3: Thread `stageId` through adapters, mapping, and dialog payloads**

Use `resolveTimetableScopeSelection` instead of duplicate default-scope conditionals. Map stage source names from `academicTree.stages`. Keep backend response scope strings lowercase-compatible by normalizing once.

- [ ] **Step 4: Run focused tests and quality guards**

Expected: all listed tests PASS. Run `test-guard`, then `clean-code-guard`.

- [ ] **Step 5: Commit**

```powershell
git add src/features/academics/timetable/services src/features/academics/timetable/components/TimetableConfigDialog.tsx src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx
git commit -m "feat(timetable): support stage config requests"
```

### Task 3: Separate exact and inherited workspace state

**Files:**
- Create: `src/features/academics/timetable/services/timetableWorkspaceState.ts`
- Test: `src/features/academics/timetable/services/__tests__/timetableWorkspaceState.test.ts`
- Modify: `src/features/academics/timetable/hooks/useTimetableData.ts`
- Test: `src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx`

**Interfaces:**
- Produces `TimetableWorkspaceState` with `mode`, `exactConfig`, `effectiveConfig`, `displayConfigId`, and `isInherited`.

- [ ] **Step 1: Write failing resolver and hook tests**

```ts
expect(resolveTimetableWorkspaceState({ exactConfig: null, effectiveConfig })).toMatchObject({
  mode: "inherited",
  displayConfigId: effectiveConfig.id,
  isInherited: true,
});
```

Cover exact config winning for editing, inherited effective display, and unconfigured state. In the hook test, mock exact `/config` as not found and `/all` with a stage effective config and entries.

- [ ] **Step 2: Run focused tests and verify failures**

Run: `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableWorkspaceState.test.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx`

- [ ] **Step 3: Implement exact/effective loading**

Fetch the exact config for every normalized scope. Fetch `/all` only when a classroom is selected and use its backend-selected `effectiveConfig`. Load periods and entries for the chosen display config, but expose `config` as the exact editable config and `workspaceState` separately. Inherited state must return `canEdit: false` regardless of manage permission.

- [ ] **Step 4: Run focused tests and quality guards**

Expected: PASS with stale-request protection retained. Run `test-guard`, then `clean-code-guard`.

- [ ] **Step 5: Commit**

```powershell
git add src/features/academics/timetable/services/timetableWorkspaceState.ts src/features/academics/timetable/services/__tests__/timetableWorkspaceState.test.ts src/features/academics/timetable/hooks/useTimetableData.ts src/features/academics/timetable/hooks/__tests__/useTimetableData.test.tsx
git commit -m "feat(timetable): load effective inherited schedules"
```

### Task 4: Present inherited source and create override

**Files:**
- Create: `src/features/academics/timetable/components/TimetableSourceBanner.tsx`
- Test: `src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx`
- Modify: `src/features/academics/timetable/components/TimetableView.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes `TimetableWorkspaceState`, localized source name, permission state, and `onCreateOverride`.

- [ ] **Step 1: Write failing banner and view tests**

Verify inherited source text, lock icon accessible name, disabled override without permission, and exact-config editing behavior.

- [ ] **Step 2: Run focused tests and verify failures**

Run: `npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableSourceBanner.test.tsx src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx`

- [ ] **Step 3: Build the banner with existing UI primitives**

Use `Button` and Lucide `LockKeyhole`. The override action opens `TimetableConfigDialog` with the current selected scope; it never edits the inherited config ID.

- [ ] **Step 4: Run tests and quality guards**

Expected: PASS in English and Arabic assertions. Run `test-guard`, then `clean-code-guard`.

- [ ] **Step 5: Commit**

```powershell
git add src/features/academics/timetable/components src/features/academics/timetable/pages/__tests__/TimetablePageContent.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat(timetable): show inherited timetable source"
```

### Task 5: Make downstream consumers stage-aware

**Files:**
- Modify: `src/features/academics/lesson-plans/services/lessonPlanTimetable.ts`
- Modify: `src/features/academics/lesson-plans/components/TimetableSlotSelect.tsx`
- Modify: `src/features/attendance/excuses/utils/applyExcuseToAttendance.ts`
- Modify: `src/features/attendance/roll-call/utils/policyTimetableConfig.ts`.
- Test: `src/features/attendance/roll-call/utils/__tests__/policyTimetableConfig.test.ts`.
- Modify: `src/features/attendance/excuses/utils/excuseTimetableScope.ts`.
- Test: `src/features/attendance/excuses/utils/excuseTimetableScope.test.ts`.
- Modify: `src/features/attendance/excuses/utils/applyExcuseToAttendance.ts`.

**Interfaces:**
- Consumes grade-to-stage identity from loaded structure data or an explicit `stageId` in scope.
- Produces candidate order `CLASSROOM, SECTION, GRADE, STAGE, TERM` only for exact config consumers; published schedule consumers use `/all` effective config.

- [ ] **Step 1: Add failing stage inheritance regression tests**

Cover a classroom whose backend effective config is stage-scoped and an attendance period lookup whose exact child configs are absent.

- [ ] **Step 2: Run focused tests and verify failures**

Run: `npm run test:run -- src/features/academics/lesson-plans/services/__tests__/lessonPlanTimetable.test.ts src/features/academics/lesson-plans/components/__tests__/TimetableSlotSelect.test.tsx src/features/attendance/roll-call/utils/__tests__/policyTimetableConfig.test.ts src/features/attendance/excuses/utils/excuseTimetableScope.test.ts`

- [ ] **Step 3: Implement stage-aware consumer requests**

Do not manually select a published winner when `/all` supplies `effectiveConfig`. Add stage only to exact fallback utilities that genuinely require config periods.

- [ ] **Step 4: Run focused tests, lint, typecheck, and build**

Run: `npm run lint`, `npm run typecheck`, and `npm run build`. Ask the owner before the full suite.

- [ ] **Step 5: Run guards and commit**

Run `test-guard`, then `clean-code-guard`.

```powershell
git add src/features/academics/lesson-plans src/features/attendance
git commit -m "fix(academics): honor stage timetable inheritance"
```
