# Validation improvements implementation plan

> **For agentic workers:** Execute inline in this authorized session; preserve the current worktree and all existing changes. No delegation or full test suite is requested.

**Goal:** Make timetable validation easier to trust, navigate, and resolve using existing endpoints.

**Architecture:** Fetch validation, conflicts, and publication together and commit the report atomically. Keep the checked input fingerprint, issue identities, and previous report for freshness and progress. Add focused UI components for report status, conflict filtering, and subject actions while preserving the existing drawer tabs and filters.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, Tailwind, existing UI controls and MUI drawer.

**Spec:** User-approved six improvements in this conversation, limited to frontend changes.

## Global constraints

- No backend changes or new dependencies.
- Preserve Somar, teal tokens, Arabic/English and RTL/LTR.
- Use clean-code-guard for code and test-guard for tests.
- Ask before running the full test suite; run focused tests only.
- Never treat unsaved edits as part of a saved-server validation.
- Do not merge distinct resources or different overlap intervals.

## Task 1: Report freshness and progress

- [x] Add `validationReviewIssueKeys` and `groupValidationConflicts` in `services/timetableValidationReview.ts` to identify issues by affected entities and deduplicate exact overlap reports.
- [x] Add `refreshValidationReview` to `hooks/useTimetableData.ts`, fetching `validate`, `getConflicts`, and `getPublication` with `Promise.all`. Commit only after all succeed and the scope request is still current; return `{summary, conflicts, publication}` or null for a superseded request.
- [x] Track successful timestamps, input fingerprint, and previous issue keys in a dedicated review hook. Failed requests retain the previous report and never advance freshness or progress.
- [x] Wire open/recheck in `TimetableView.tsx`; maintain drawer state during rechecks. Display saved-only status while dirty.
- [x] Test partial request failure, stale input, and identity-based resolved/new counts with actual DTO fixtures at the existing API boundary.

## Task 2: Conflict triage

- [x] Add `ValidationConflictFilters.tsx` using `Input` and `Button` from the UI folder. Support resource-name search, conflict type, day, counts, clear filters, and a filtered empty state.
- [x] Render grouped exact overlap reports and preserve the union of affected entry IDs and proposed indexes for the existing inspection dialog.
- [x] Verify that distinct periods/resources remain separate and filtering cannot remove data from the underlying report.

## Task 3: Subject explanations and actions

- [x] Add localized deficit/excess messages using expected and scheduled weekly lessons; keep null requirements distinct from zero.
- [x] Add targeted timetable, teacher-allocation, and subject-matrix actions using existing route query contracts and current year/term.
- [x] Reuse the existing guarded destination callback. Scope-only timetable links select the classroom configuration or its effective fallback without changing the original tab's preference.
- [x] Test visible explanations and destination URLs, including missing requirements and teachers.

## Task 4: Review and verify

- [x] Review production/test changes with the required guards and check English/Arabic desktop/mobile rendering, keyboard focus, overflow, and reduced motion.
- [x] Run focused validation/data/link/grid tests, type checking, lint, and a production build. Do not run the full test suite.

## Verification

- 107 focused tests passed across the validation, data, scope, conflict, grid, and page suites (105 in the combined run, followed by the two additional regression cases in the affected suites).
- Type checking, full lint with no warnings, and production build passed.
- English desktop and Arabic mobile visual checks passed; no horizontal drawer overflow or browser runtime errors. Rechecking preserved the search and selected tab.
- Full test suite was not run. No backend, dependency, commit, push, or deployment changes were made.
