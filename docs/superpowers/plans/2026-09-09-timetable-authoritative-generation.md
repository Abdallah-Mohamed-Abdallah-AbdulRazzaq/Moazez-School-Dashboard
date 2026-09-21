# Authoritative Timetable Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace production use of the local timetable heuristic with the backend’s atomic, scope-wide generation endpoint and actionable result reporting.

**Architecture:** A typed API function sends only the config ID. A pure presenter maps backend generation results into grouped UI data, while a focused hook owns request state and invokes one authoritative reload callback after success.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-academics-timetable-backend-gap-closure-design.md`

## Global Constraints

- Implement after the stage/effective-resolution PR is merged and start from the new `origin/main`.
- Frontend only; use `POST /academics/timetable/generate` unchanged.
- Generation operates on the complete current config scope and persists immediately.
- Do not generate temporary entries, choose rooms, or bulk-save generated output locally.
- Use existing UI components and bilingual copy.
- Apply `clean-code-guard` to production code and `test-guard` to tests.
- Run focused tests, lint, typecheck, and build; ask before the full test suite.

---

## File structure

- Create `src/features/academics/timetable/services/timetableGenerationPresentation.ts`.
- Create `src/features/academics/timetable/services/__tests__/timetableGenerationPresentation.test.ts`.
- Modify `src/features/academics/timetable/services/timetableApiTypes.ts`.
- Modify `src/features/academics/timetable/services/timetableApiAdapter.ts` and its tests.
- Rewrite `src/features/academics/timetable/hooks/useTimetableGeneration.ts` and add hook tests.
- Modify `src/features/academics/timetable/components/GenerateDialog.tsx` and add component tests.
- Modify `src/features/academics/timetable/components/TimetableView.tsx`.
- Remove `src/features/academics/timetable/utils/generator.ts` and its test after proving no production references remain.
- Modify `src/messages/en.json` and `src/messages/ar.json`.

### Task 1: Add the backend generation adapter

**Interfaces:**
- Produces `generateTimetableConfig(timetableConfigId: string): Promise<TimetableGenerationResponse>`.

- [ ] Write a failing adapter test asserting `apiPost("/academics/timetable/generate", { timetableConfigId: "c1" })`.
- [ ] Run `npm run test:run -- src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts`; expect FAIL.
- [ ] Add `GenerateTimetableRequest`, verify the existing response DTO matches backend nullability, implement `generateTimetableConfig`, and export it from `timetableApiAdapter`.
- [ ] Re-run the adapter test; expect PASS. Run `test-guard` and `clean-code-guard`.
- [ ] Commit:

```powershell
git add src/features/academics/timetable/services/timetableApiTypes.ts src/features/academics/timetable/services/timetableApiAdapter.ts src/features/academics/timetable/services/__tests__/timetableApiAdapter.test.ts
git commit -m "feat(timetable): add authoritative generation API"
```

### Task 2: Normalize generation results

**Interfaces:**
- Produces `presentTimetableGeneration(response, context): TimetableGenerationViewModel` with grouped unresolved items and summary status.

- [ ] Write failing pure tests for complete, partial, missing teacher, no feasible slot, existing over-scheduled, and search-budget exhaustion.
- [ ] Run the new test file; expect missing-module failure.
- [ ] Implement a view model with `status: "complete" | "partial" | "budget_exhausted"`, counts, and `groups: Array<{ classroomId; classroomName; items }>`.
- [ ] Re-run tests; expect PASS. Run guards.
- [ ] Commit the presenter and test with `feat(timetable): present generation outcomes`.

### Task 3: Replace the local generation hook

**Interfaces:**
- Consumes `configId`, `enabled`, `generate`, and `reloadAuthoritativeState`.
- Produces `generateCurrentConfig(): Promise<TimetableGenerationResponse | null>`, `isGenerating`, `result`, and `error`.

- [ ] Create failing hook tests proving one API call, one reload after success, no reload after failure, and stale response protection.
- [ ] Run the hook test; expect failures against the local heuristic implementation.
- [ ] Rewrite `useTimetableGeneration.ts` so it has no subjects, allocations, rooms, local entries, or generation-option dependencies.
- [ ] Re-run the hook tests; expect PASS. Run guards.
- [ ] Commit with `refactor(timetable): use authoritative generation hook`.

### Task 4: Redesign the generation dialog around persisted scope-wide work

**Interfaces:**
- Consumes config identity, localized scope label, affected-classroom count, hook state, and validation-panel callback.

- [ ] Add failing component tests for confirmation copy, immediate-persistence warning, loading lock, complete result, grouped unresolved result, and validation action.
- [ ] Run `npm run test:run -- src/features/academics/timetable/components/__tests__/GenerateDialog.test.tsx`; expect FAIL.
- [ ] Update `GenerateDialog.tsx` to remove strict/distribute/consecutive options because the backend contract does not accept them. Use existing `Modal`, `Button`, and status patterns.
- [ ] Integrate the new hook in `TimetableView.tsx`; disable generation for inherited/read-only configs and derive affected classroom count from current config scope plus loaded structure.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(timetable): show authoritative generation results`.

### Task 5: Remove the production local generator and verify

- [ ] Run `rg -n "utils/generator|generateTimetable\(" src` and verify only the obsolete utility and its test remain.
- [ ] Delete `src/features/academics/timetable/utils/generator.ts` and `src/features/academics/timetable/utils/__tests__/generator.test.ts`; remove unused imports and local-generation copy.
- [ ] Run all changed timetable test files, then `npm run lint`, `npm run typecheck`, and `npm run build`.
- [ ] Ask the owner before running `npm run test:run` without file arguments.
- [ ] Run guards and commit:

```powershell
git add -A src/features/academics/timetable src/messages/en.json src/messages/ar.json
git commit -m "refactor(timetable): remove local generation path"
```

