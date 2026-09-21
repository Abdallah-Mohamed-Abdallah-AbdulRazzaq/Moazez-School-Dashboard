# Timetable Interval Conflict UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present backend interval conflicts accurately, resolve period IDs into useful labels and times, and stop showing invented period-zero metadata.

**Architecture:** One pure normalizer converts persisted and proposed conflict DTOs into a shared display model using a period lookup. Save, publish, validation, and grid components consume that model; local index-based detection remains advisory only.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-academics-timetable-backend-gap-closure-design.md`

## Global Constraints

- Implement after authoritative generation is merged and start from the latest `origin/main`.
- Backend conflict endpoints are authoritative.
- Never synthesize `periodIndex: 0` for unresolved backend data.
- Use existing UI components, bilingual copy, and accessible focus/highlight behavior.
- Apply code/test guards and ask before running the full suite.

---

## File structure

- Create `src/features/academics/timetable/services/timetableConflictNormalization.ts`.
- Create `src/features/academics/timetable/services/__tests__/timetableConflictNormalization.test.ts`.
- Modify `timetableApiTypes.ts`, `timetableValidationSummary.ts`, `timetableErrorHandling.ts`, and tests.
- Modify `useTimetableData.ts`, `ValidationPanel.tsx`, `TimetableGrid.tsx`, and component tests.
- Modify bilingual messages.

### Task 1: Define a truthful conflict display model

**Interfaces:**
- Produces `normalizeTimetableConflicts(response, source, periods): TimetableConflictDisplay[]`.

```ts
export interface TimetableConflictDisplay {
  type: "CLASSROOM" | "TEACHER" | "ROOM" | "DUPLICATE" | "UNKNOWN";
  code?: string;
  message: string;
  severity: string;
  dayOfWeek: number | null;
  dayKey?: string;
  periodId?: string;
  periodIndex?: number;
  periodLabel?: string;
  startTime?: string;
  endTime?: string;
  entryIds: string[];
  proposedIndexes: number[];
  resourceId?: string;
}
```

- [ ] Write failing tests for persisted conflicts, proposed conflicts, known period resolution, and unknown period omission.
- [ ] Run the new focused test; expect missing-module failure.
- [ ] Implement normalization with `Map(period.id, period)` and no numeric fallback.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(timetable): normalize backend interval conflicts`.

### Task 2: Route every backend conflict through the normalizer

- [ ] Add failing tests to `timetableValidationSummary.test.ts` and `timetableErrorHandling.test.ts` proving API conflicts preserve period ID and omit unknown index.
- [ ] Run both focused test files; expect failures from current `?? 0` behavior.
- [ ] Replace duplicate normalization in `timetableValidationSummary.ts`; update `conflictFromTimetableError` to accept a period lookup or return unresolved metadata safely.
- [ ] Re-run tests; expect PASS. Run guards and commit with `refactor(timetable): centralize conflict mapping`.

### Task 3: Reload authoritative data after bulk save

- [ ] Add a failing `useTimetableData` test where bulk response contains only saved target entries but reload returns cross-config term entries.
- [ ] Run the hook test; verify current code incorrectly sets `allTermEntries` from the bulk response.
- [ ] After successful bulk save, invoke the established authoritative reload path; do not assign the bulk result to `allTermEntries` as if complete.
- [ ] Re-run the hook test; expect PASS. Run guards and commit with `fix(timetable): reload entries after bulk save`.

### Task 4: Display and highlight interval conflicts

- [ ] Add failing `ValidationPanel` and `TimetableGrid` tests for period label/time, unknown-period fallback, entry-ID highlight, and proposed-index highlight.
- [ ] Run the focused component tests; expect FAIL.
- [ ] Render day, period label, and formatted time when available; otherwise render only backend message and affected resource. Add `aria-current` or an equivalent accessible selected indication when focusing a conflict.
- [ ] Wire conflict-row selection to grid focus without introducing global document queries.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(timetable): highlight interval conflicts`.

### Task 5: Verify PR 3

- [ ] Run every changed conflict, hook, panel, and grid test by explicit file path.
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- [ ] Ask before the full suite.
- [ ] Confirm with `rg -n "periodIndex.*\?\?.*0|Period 0" src/features/academics/timetable` that no backend conflict path invents period zero.
- [ ] Commit any verification-only corrections normally; do not amend or force-push.

