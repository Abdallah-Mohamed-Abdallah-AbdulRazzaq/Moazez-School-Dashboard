# Lesson Plans UI/UX Design

## Scope

Improve the existing Lesson Plans page without changing its backend contracts, route, data ownership, permissions, or mutation behavior. Reuse the current page, hooks, dialogs, responsive board, and components under `src/components/ui`.

The implementation covers:

- `src/features/academics/lesson-plans/pages/LessonPlansPage.tsx`
- the existing components under `src/features/academics/lesson-plans/components`
- English and Arabic messages in `src/messages/en.json` and `src/messages/ar.json`

It does not add endpoints, calculate instructional weeks, or create a second list-view workflow.

## Design Direction

Use a compact planning workspace:

- a page header and action area at the top;
- compact scope filters and selected-scope chips below the header;
- KPI and validation summaries before the board;
- a sticky lesson library beside a responsive three-column week grid on desktop;
- the existing accordion model on mobile.

The UI follows the current spacing, border, typography, color, button, input, dropdown, modal, and KPI-card conventions. It does not introduce a parallel design system.

## Page Header and Scope

The header contains:

- translated title and description;
- `Auto-plan`, `Validate / Refresh`, and `Export` actions using the existing `Button` component;
- compact chips for the selected stage, grade, section, subject, classroom, and assigned teacher.

The filter row continues to use the existing `Select` component. It becomes more compact and disables dependent fields while their scope is unresolved. Loading placeholders prevent a blank or misleading scope state.

Read-only rules remain unchanged. Closed terms and archived lesson plans do not expose mutation actions.

## Summary

`ProgressSummary.tsx` becomes a set of KPI cards using the existing KPI-card conventions. It displays backend summary values only:

- lesson plans;
- all items;
- planned items;
- completed items;
- unplanned lessons;
- coverage percentage.

Each card includes a translated label, an icon, a numeric value, and a subtle semantic accent. Coverage also retains a progress bar with an accessible text value. No coverage value is inferred locally.

## Validation

`LessonPlanValidationPanel.tsx` translates the backend summary into human-readable labels:

- plans checked;
- items checked;
- missing planned lessons;
- holiday items;
- outside-term items;
- duplicate lessons.

The panel has two presentation states:

- success when `validation.issues` is empty;
- warning when issues exist, including the issue count.

Issue details are collapsible. The default summary does not expose raw backend property names, issue codes, item IDs, lesson IDs, or debug labels. Issue severity has a translated text label in addition to its color.

## Board Controls and Week Filtering

The board provides four translated filter chips:

- all weeks;
- current and upcoming;
- planned only;
- issues only.

Filtering operates only on the `weeks` array returned by the backend and its matching plans and validation data. It never generates weeks or changes their count. The default filter is all weeks.

No Grid/List switch is added. The existing grid remains the single desktop interaction model to preserve drag-and-drop clarity and avoid a duplicate planning workflow.

## Desktop Week Grid

`WeeksBoardDesktop.tsx` renders a responsive three-column grid where space permits. The lesson library remains beside the grid and may be sticky within the viewport.

Each `WeekColumn.tsx` header shows:

- backend week number;
- backend start and end dates;
- planned item count;
- a textual and visual issue indicator when reliable validation data identifies an issue for that week.

Week states use border, background, icon, and text together:

- current week;
- week with planned items;
- week with issues;
- holiday-only week with no instructional days.

An empty valid week displays translated `No lessons planned` and `Drag a lesson here` guidance. A week without instructional days disables drop and add interactions and displays the existing translated instructional-day validation message.

If validation data cannot reliably associate an issue with a week, the UI reports it in the validation panel and does not guess a week association.

## Mobile Weeks

`WeeksBoardMobile.tsx` retains its accordion interaction. Headers become more compact and expose the same date, count, holiday, and availability signals as desktop. Add Lesson remains disabled for weeks without instructional days.

The mobile bottom actions and drawers remain the entry points for filters and the lesson library.

## Lesson Library

`LessonLibrary.tsx` keeps the existing `Input` search and `Select` unit filter. The presentation adds:

- translated helper text explaining that lessons come from the selected curriculum;
- clearer unit grouping where it does not interfere with search results;
- lesson title and unit title;
- estimated minutes when present in the existing lesson model;
- a translated planned state;
- a visible drag handle and an accessible Add action where supported by the existing flow.

The empty state distinguishes no curriculum lessons from no search matches. It does not fabricate curriculum or planning data.

## Lesson Item Cards

`LessonPlanItemCard.tsx` presents:

- lesson title;
- translated status chip;
- planned date and period label when available;
- a labeled notes indicator when notes exist;
- the existing dropdown action menu.

Status treatments are:

- planned: neutral blue;
- in progress: amber;
- done: green;
- skipped: gray;
- cancelled: red;
- unknown: neutral.

The action menu keeps supported operations only: start, complete, skip, cancel, edit notes, reorder/move where the existing supported flow applies, and delete. Every item is translated and paired with an icon. The icon-only menu trigger is a labeled button. The existing `DropdownMenu` remains the visual menu component; its custom-trigger path must be made keyboard-operable as part of this work because it currently wraps custom triggers in a clickable `div`.

## Loading and Empty States

Loading placeholders cover filters, summary, validation, library, and week grid. The board is not shown as empty while scope or data is still resolving.

After data has been checked, the page distinguishes:

- missing teacher allocation;
- missing curriculum;
- no backend weeks;
- curriculum with no lessons;
- weeks available but no lesson plans yet.

Empty states explain the next available action and respect read-only mode.

## RTL and Accessibility

All new user-facing text is added to both message files. Layout uses logical alignment and spacing where possible and relies on the existing locale-aware input components. Direction-specific flex ordering is added only where semantic order requires it.

Accessibility requirements:

- visible button labels for primary actions;
- `aria-label` on icon-only controls;
- keyboard-accessible existing dropdowns and accordions;
- status text and icons so color is never the only signal;
- progress semantics for coverage;
- disabled controls communicate why an action is unavailable.

## Data Flow and Error Handling

`useLessonPlansData` remains the source of stages, grades, sections, classrooms, subjects, teachers, units, lessons, plans, backend weeks, summary, and validation. Existing mutation hooks and service calls remain unchanged.

The Validate / Refresh action invokes the existing refresh flow. Auto-plan and Export retain their existing dialogs and handlers. Errors continue through the existing toast and lesson-plan error mapping paths.

Presentation helpers may derive selected labels, current-week state, counts, and local visibility filters. They must not derive backend weeks, coverage, validation results, permissions, or plan status.

## Testing and Verification

Tests cover:

- translated KPI labels and backend values;
- validation success and warning states without raw backend keys;
- week filters using the backend weeks array;
- current, planned, issue, and no-instructional-days presentations;
- disabled add/drop interactions for non-instructional weeks;
- lesson-card status and accessible menu labels;
- loading and checked empty states;
- English and Arabic message parity.

Verification commands:

```text
npm run typecheck
npm run lint
npm run test:run
npm run guard:i18n
```

The final audit searches the Lesson Plans feature for raw validation keys, hard-coded empty-state text, raw form elements, and unsupported endpoint strings.
