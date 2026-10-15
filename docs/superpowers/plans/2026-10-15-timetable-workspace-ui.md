# Timetable workspace UI implementation plan

**Goal:** Implement the approved first improvements: toolbar hierarchy, persistent context, and grid readability.

**Scope:** Frontend only. Preserve permissions, existing handlers and confirmation dialogs, unsaved-edit guards, generation, publication, drag/drop, validation, printing, and Arabic/English behavior. Use current UI primitives and styling; no dependencies or full test suite.

## Tasks

- [x] Add `TimetableWorkspaceToolbar.tsx` with a compact context header, Save/Validate/Generate/Publish actions, settings and secondary-action menus, and desktop grid density controls.
- [x] Replace the duplicate toolbar layouts in `TimetableView.tsx`, preserving all disabled/loading conditions and callbacks. Keep the selected classroom or wider selection, academic context, configuration name/scope, publication/editability state, and unsaved state visible.
- [x] Update the existing UI `DropdownMenu` with menu keyboard navigation, focus restoration, viewport positioning, and an optional destructive tone. Preserve existing item selection callbacks and portals.
- [x] Update `TimetableGrid.tsx` with compact/comfortable desktop density, logical sticky offsets for RTL/LTR, subject accent borders, stronger text hierarchy, and focus/hover access to full lesson details. Preserve conflict, holiday, print, mobile and placement behavior.
- [x] Review code using clean-code-guard and tests using test-guard. Test toolbar permissions/actions, keyboard menus, full details, and existing grid/drag/drop behavior; check English/Arabic at desktop/mobile sizes.
- [x] Run focused suites, typecheck, lint, and production build. Ask before a full test suite; do not run it for this work.

## Verification

- 69 focused tests passed across toolbar, dropdown, grid, conflict inspection, resource library, scheduling, generation, validation, and workspace-panel suites.
- Type checking, full lint with no warnings, and production build passed.
- English and Arabic desktop/mobile checks found no page overflow or runtime errors. Grid density reduced row heights, headers and the period column stayed visible during two-axis scrolling, and action menus stayed inside the viewport.
- Keyboard checks covered disabled actions, arrows/Home/End, Tab/Shift+Tab, Escape, focus restoration, and read-only full lesson details. Read-only keyboard activation did not invoke editing.
- Print media checks confirmed screen minimum widths and sticky positioning are removed.
- Full test suite was not run. No backend changes, dependencies, commits, pushes, or deployments were made.

## Requested toolbar rollback

Restored direct buttons for settings and secondary actions instead of menus. Kept persistent context, density controls, lesson details, and RTL/grid improvements. Existing action callbacks and availability conditions are preserved.

## Timetable navigation enhancements

- [x] Add searchable classroom switching and adjacent-classroom actions within the current stage/grade/section filters, using existing unsaved-change protection.
- [x] Find subject, teacher, or room names in Arabic or English across rendered lessons; highlight matches without hiding other lessons, and jump between results across section tabs and mobile days.
- [x] Add mobile day shortcuts, previous/next day actions, and a horizontally scrolling direct-action toolbar.
- [x] Add focus mode with a full-window timetable, hidden scope/progress panels, keyboard focus containment, Escape handling, and restored page scrolling on exit.
- [x] Reviewed with clean-code-guard and test-guard. All 27 focused tests, typecheck, full lint (no warnings), and final production build passed. English/Arabic desktop and phone checks passed without page overflow or runtime errors. The full test suite was not run.
