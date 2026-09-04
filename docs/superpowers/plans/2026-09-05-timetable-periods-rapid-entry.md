# Timetable Periods Rapid-Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the timetable-periods dialog quick and clear for entering several periods consecutively, while preserving its existing API contracts, validation, scope behavior, and protections.

**Architecture:** Keep the behavior within `TimetableConfigDialog`.  The existing period form becomes a visually distinct rapid-entry card; successful creates derive the next draft from the API response, refresh the parent data, and keep focus in the card.  The dialog retains the existing service calls and renders the same sorted period data in a separate saved-periods list.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Tailwind CSS, Vitest, React Testing Library, existing Moazzez UI primitives.

**Spec:** `docs/superpowers/specs/2026-09-05-timetable-periods-rapid-entry-design.md`

## Global Constraints

- Use existing `Modal`, `Button`, and `Select` components from `src/components/ui`; do not introduce a new UI-kit dependency.
- Do not change the timetable period API, data model, scope resolution, validation rules, or the existing delete/period-in-use behavior.
- Keep all visible copy localized in both `src/messages/en.json` and `src/messages/ar.json`.
- Preserve the read-only view and the current requirement that a timetable configuration must exist before periods can be created.
- Do not run the full test suite unless the user explicitly approves it. Focused tests, lint, and typecheck are in scope.
- Before presenting implementation as ready, run the clean-code guard on the changed production files and the test guard on the added/changed test file.

## File Structure

| File | Role | Planned change |
| --- | --- | --- |
| `src/features/academics/timetable/components/TimetableConfigDialog.tsx` | Modal for timetable configuration and period management | Add rapid-entry state/focus behavior and restructure only the periods-mode UI into entry and saved-list sections. |
| `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx` | Component behavior coverage | Add focused coverage for create-and-continue, editing cancellation, and read-only restrictions. |
| `src/messages/en.json` | English timetable UI copy | Add count, entry-card, saved-list, add-next, and success-status translations. |
| `src/messages/ar.json` | Arabic timetable UI copy | Add Arabic equivalents for the same keys. |

## Tasks

### Task 1: Add the rapid-entry translations

**Files:**
- Modify: `src/messages/en.json` under `academics.timetable.config`
- Modify: `src/messages/ar.json` under `academics.timetable.config`

- [ ] Add exact paired keys for the entry card heading, saved-periods heading, count of periods added, the add-next-period action, and the polite success acknowledgement.
- [ ] Keep `addPeriod` and `updatePeriod` intact for compatibility with existing code paths until the component is switched to the new copy.
- [ ] Verify the edited JSON files parse successfully with `node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" src/messages/en.json` and the matching Arabic command.
- [ ] Commit only these localization changes with `feat(timetable): add rapid period entry copy`.

### Task 2: Write failing focused dialog tests for the approved flow

**Files:**
- Create: `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`

- [ ] Mock `next-intl` so translation keys remain visible and mock `timetablePeriodsService` with controllable `createTimetablePeriodDto`, `updateTimetablePeriodDto`, and `deleteTimetablePeriod` spies.
- [ ] Render the dialog in `mode="periods"` with an existing config, an `onSaved` spy, and a minimal valid period array; use the same representative DTO shapes consumed by `TimetableConfigDialog`.
- [ ] Add a failing test that fills the label, clicks the rapid primary action, resolves `createTimetablePeriodDto` with the saved DTO, and asserts: the create request uses the form payload, `onSaved` runs, a success status is exposed with `role="status"`, the label is blank, the index advances from the returned period index, and focus returns to the label input.
- [ ] Add a failing test that starts editing a saved period, then chooses Cancel edit, and asserts the draft returns to add mode with the next available sequence and no selected period retained.
- [ ] Add a failing test that renders `readOnly`, asserts the rapid-entry controls and edit/delete buttons are absent, and asserts saved period data remains visible.
- [ ] Run `npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx` and confirm the tests fail only because the rapid-entry behavior is not implemented yet.
- [ ] Commit the test-only red state with `test(timetable): cover rapid period entry flow`.

### Task 3: Implement rapid create-and-continue behavior

**Files:**
- Modify: `src/features/academics/timetable/components/TimetableConfigDialog.tsx`

- [ ] Add a label-input ref and a localized, polite status state for the periods form. Reset both when the dialog opens for a different period-management session and clear stale status when the user begins editing or cancels edit.
- [ ] In `savePeriod`, retain current validation and loading/error behavior. Capture the DTO returned by `createTimetablePeriodDto` for create mode; after `onSaved` succeeds, replace the draft with a next-period draft derived from that saved DTO: its `index + 1`, an empty `label`, and the just-selected time/type/instructional values for quick continuation.
- [ ] Focus the label input after a successful create without moving focus outside the dialog. Do not apply this reset to an update; an update must continue to use `resetPeriodForm` so it exits edit mode.
- [ ] Use the new status copy in an element with `role="status"` and `aria-live="polite"`; keep validation errors on their current error channel.
- [ ] Ensure all submit controls remain disabled through the existing `Button` loading behavior while saving.
- [ ] Run the new focused test file and make it pass.
- [ ] Commit the behavior change with `feat(timetable): continue period entry after save`.

### Task 4: Restructure periods mode around clear entry and saved-list sections

**Files:**
- Modify: `src/features/academics/timetable/components/TimetableConfigDialog.tsx`

- [ ] Replace the current undifferentiated periods-mode form block with a neutral bordered entry card headed by the new-period translation. Show the localized saved count in the section header when a configuration exists.
- [ ] Keep visible labels and the existing desktop RTL field order: sequence, label, start, end, type. Use a responsive grid that stacks fields at narrow widths without horizontal scrolling.
- [ ] Place type and instructional semantics together in the entry card, retain their current change behavior, and make **Add next period** the sole primary action while not editing. In edit mode, use the existing update label and a visible secondary Cancel edit action.
- [ ] Add a distinct saved-periods heading above the existing sorted list. Preserve the no-period message, order, time-range formatting, type indicator, edit action, disabled in-use delete action, confirmation, and read-only rendering.
- [ ] Do not add a modal-footer save action for periods mode, bulk entry, import, drag-and-drop, or any API call beyond the existing create/update/delete operations.
- [ ] Run the focused dialog test file again and confirm all assertions pass.
- [ ] Commit the UI hierarchy change with `feat(timetable): clarify rapid period entry layout`.

### Task 5: Verify quality and review the final diff

**Files:**
- Review: `src/features/academics/timetable/components/TimetableConfigDialog.tsx`
- Review: `src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`
- Review: `src/messages/en.json`
- Review: `src/messages/ar.json`

- [ ] Run `npm run test:run -- src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx`.
- [ ] Run `npm run lint -- --ignore-pattern '.backend-contract-review-20260904/**'` and record any pre-existing warnings separately from the feature results.
- [ ] Run `npm run typecheck`.
- [ ] Apply the `clean-code-guard` skill to the changed production files and resolve any actionable findings.
- [ ] Apply the `test-guard` skill to the new dialog test file and resolve any actionable findings.
- [ ] Inspect `git diff --check`, `git diff -- src/features/academics/timetable/components/TimetableConfigDialog.tsx src/features/academics/timetable/components/__tests__/TimetableConfigDialog.test.tsx src/messages/en.json src/messages/ar.json`, and `git status --short`; do not stage or modify unrelated user work.
- [ ] Only ask for renewed permission before running the entire suite; do not present that suite as run unless it actually completes.
- [ ] Commit any final correction separately with a narrowly scoped message, then report the exact verification results and commits.

## Completion Criteria

- The periods dialog plainly distinguishes creating the next period from reviewing saved periods.
- After a successful create, the dialog stays open, presents localized success feedback, clears the label, advances the sequence, preserves the relevant draft choices, and focuses the label field.
- Edit/cancel, validation, read-only access, scope behavior, and existing period-in-use deletion protection work exactly as before.
- English and Arabic translation catalogs contain every new key.
- Focused tests, lint, and typecheck pass, with any unrelated warnings explicitly identified.
