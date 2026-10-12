# Weekly Plan Term Weeks Implementation Plan

> **For agentic workers:** Implement task-by-task in this session using the existing feature branch and project verification workflow.

**Goal:** Replace weekly-plan filter and authoring date inputs with a single numbered term-week selector.

**Architecture:** Generate inclusive seven-day ranges in UTC from the selected term's first day, clipping the last range to its last day. Reuse one selector built on `components/ui/input/Select`; continue sending dates through the existing API fields. Preserve existing custom periods until the user chooses a generated week.

**Tech Stack:** React, TypeScript, next-intl, Vitest, Testing Library.

**Spec:** User requirements confirmed on 2026-10-12: both filters and create/edit; consecutive seven-day weeks starting on the term's first day; labels such as `Week 3 · Oct 15–21`.

## Global Constraints

- Reuse UI folder components; no new dependencies or backend changes.
- Review production changes with clean-code-guard and test changes with test-guard.
- Run targeted tests only, per user preference; do not run the full suite.
- Retain custom saved date ranges and URL filter ranges; disable week selection if term dates are unavailable.

### Task 1: Week generation and reusable selector

**Files:** `model/termWeeks.ts`, `model/__tests__/termWeeks.test.ts`, `components/weekly-plans/TermWeekSelect.tsx`, `components/weekly-plans/__tests__/TermWeekSelect.test.tsx`, `src/messages/{en,ar}.json`.

**Interfaces:** `calculateTermWeeks(bounds): TermWeek[]`, where each week has `number`, `startDate`, `endDate`. The selector consumes term bounds and the selected start/end dates and emits `{startDate, endDate}`.

- [x] Test contiguous ranges including leap days, a one-day term, a partial final week, and invalid term bounds. Example: Sep 1–10 produces Sep 1–7 and Sep 8–10.
- [x] Generate each range using `start + index * 7 * 86400000`, with end `Math.min(start + 6 * 86400000, termEnd)`.
- [x] Localize labels with `Intl.DateTimeFormat` in UTC and `Week {number}` translations. Test selecting a final partial week and preserving a custom saved period.

### Task 2: Filter and authoring integration

**Files:** `WeeklyPlanFilters.tsx`, `pages/WeeklyPlansPage.tsx`, `editor/details/WeeklyPlanForm.tsx`, `weekly-plan-detail/WeeklyPlanDetailsPanel.tsx`, related tests.

- [x] Pass the selected term's dates to the list filter. Map dropdown selection to `{weeklyDateFrom: startDate, weeklyDateTo: endDate}` and clear both for All weeks.
- [x] Replace both authoring date inputs with the reusable selector. Map selection to `weekStartDate` and `weekEndDate`; retain complete-detail save behavior.
- [x] Verify selection updates saved payloads and filter queries, then run affected tests, lint, typecheck and build.
- [x] Review, commit, push normally, and create a draft PR against main.
