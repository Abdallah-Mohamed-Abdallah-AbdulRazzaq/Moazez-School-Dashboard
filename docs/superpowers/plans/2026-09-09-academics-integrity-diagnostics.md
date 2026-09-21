# Academics Integrity Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve actionable curriculum dependency details and display every authoritative timetable publication blocker, including room validity issues not represented by overlap counters.

**Architecture:** Pure error and publication classifiers convert backend details into stable view models. Subject allocation and timetable components render those models with existing dialogs and panels, while publication state is always reloaded after mutation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-09-academics-timetable-backend-gap-closure-design.md`

## Global Constraints

- Implement after the room-integrity PR is merged and start from the latest `origin/main`.
- Preserve unsaved curriculum edits after backend rejection.
- `publication.canPublish` and `blockingReasons` are authoritative.
- Show all blockers; toast only a concise summary.
- Do not offer backend mutations outside the current user action.
- Use existing UI components and bilingual accessible layouts.
- Apply code/test guards and ask before the full suite.

---

## File structure

- Modify `src/features/academics/subjects/services/subjectAllocationErrors.ts` and tests.
- Create `src/features/academics/subjects/components/CurriculumDependencyDialog.tsx` and tests.
- Modify subject allocation container/view/matrix tests.
- Create `src/features/academics/timetable/services/timetablePublicationReasons.ts` and tests.
- Modify `timetableValidationSummary.ts`, `ValidationPanel.tsx`, `useTimetableData.ts`, `TimetableView.tsx`, and tests.
- Modify bilingual messages.

### Task 1: Preserve curriculum dependency details

**Interfaces:**
- Extends `SubjectAllocationUiError` with an optional typed `dependency`.

```ts
export interface CurriculumDependencyDetails {
  termId?: string;
  gradeId?: string;
  subjectId?: string;
  mutation?: "DEACTIVATE" | "POSITIVE_REQUIREMENT_CHANGE";
  previousWeeklyHours?: number;
  proposedWeeklyHours?: number;
  teacherAllocationCount: number;
  draftTimetableEntryCount: number;
  publishedTimetableEntryCount: number;
  publishedTimetableConfigCount: number;
}
```

- [ ] Write failing error-mapper tests for `subject_not_taught`, `dependency_conflict`, incomplete details, and unknown fallback.
- [ ] Run `npm run test:run -- src/features/academics/subjects/services/__tests__/subjectAllocationErrors.test.ts`; expect FAIL.
- [ ] Add both backend codes and bounded detail parsing; never flatten numeric details into meaningless message strings.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(curriculum): preserve dependency diagnostics`.

### Task 2: Display dependency rejection without discarding edits

- [ ] Add failing dialog and container tests proving names resolve from loaded data, counts render, trace ID renders, and matrix state remains dirty after rejection.
- [ ] Run the focused subject component/container tests; expect FAIL.
- [ ] Build `CurriculumDependencyDialog` with existing `Modal` and `Button`; store the normalized error separately from the editable allocation state.
- [ ] Open the dialog from `handleSaveError` only for dependency conflicts; retain the standard error banner for other failures.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(curriculum): explain blocked allocation changes`.

### Task 3: Classify every publication reason

**Interfaces:**
- Produces `classifyPublicationReasons(reasons): PublicationReasonGroup[]`.

```ts
export type PublicationReasonCategory =
  | "configuration" | "curriculum" | "teachers" | "weekly_hours" | "conflicts" | "rooms";
```

- [ ] Write failing tests covering known backend codes: `not_draft`, `no_instructional_periods`, `no_entries`, `conflicts`, `invalid_academic_context`, `term_closed`, invalid references, allocation mismatch, subject allocation issues, teacher/hour issues, and room issues.
- [ ] Include an unknown code test that retains the backend message under `configuration` rather than dropping it.
- [ ] Run the new test; expect missing-module failure.
- [ ] Implement deterministic category and reason ordering while preserving `details`.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(timetable): classify publication blockers`.

### Task 4: Retain room validity issues in validation summaries

- [ ] Add failing `timetableValidationSummary` tests with `roomConflicts: 0` and item issues `room_inactive`, `room_not_found`, and `room_capacity_insufficient`.
- [ ] Run the focused test; confirm the current buckets omit the issues.
- [ ] Add `roomIntegrityIssues` to `TimetableValidationSummary`; bucket by issue code independently of overlap counters and include it in `hasBlockingValidation`.
- [ ] Re-run tests; expect PASS. Run guards and commit with `fix(timetable): retain room validation blockers`.

### Task 5: Present all publication blockers

- [ ] Add failing `ValidationPanel` and `TimetableView` tests proving every grouped blocker renders, room validity is separate from room overlaps, and toast shows only a summary.
- [ ] Run focused tests; expect FAIL.
- [ ] Pass classified `publication.blockingReasons` into `ValidationPanel`; render category sections with text and icons and preserve backend detail context useful for locating affected records.
- [ ] Keep publish confirmation closed unless latest publication readiness is true, conflicts are empty, validation has no blockers, and `isDirty` is false.
- [ ] Re-run tests; expect PASS. Run guards and commit with `feat(timetable): show complete publish diagnostics`.

### Task 6: Reload authoritative status after publish and verify

- [ ] Add a failing hook test proving successful publish reloads timetable, publication, validation, and conflicts instead of applying `withConfigStatus` locally.
- [ ] Run the hook test; expect FAIL against the current local status mutation.
- [ ] Remove `withConfigStatus` from publish success and invoke the shared authoritative reload path. Apply the same rule after unpublish where current behavior assumes draft status.
- [ ] Run all changed subject and timetable tests by explicit path.
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run build`; ask before `npm run test:run` without paths.
- [ ] Run guards and commit:

```powershell
git add src/features/academics/subjects src/features/academics/timetable src/messages/en.json src/messages/ar.json
git commit -m "fix(academics): reload authoritative integrity state"
```

