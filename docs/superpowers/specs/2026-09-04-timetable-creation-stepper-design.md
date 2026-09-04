# Timetable creation stepper design

## Goal

Make the full timetable-creation journey clear for the currently selected academic scope, without replacing the existing timetable workspace or duplicating its validation and actions.

## Chosen approach

Add an inline, scope-aware creation stepper above the existing timetable workspace. It is an interactive navigator: enabled steps take the user to the existing selector, configuration dialog, periods dialog, grid, validation, or publication controls.

This is intentionally not a modal wizard. Experienced users retain direct access to the existing controls, while users new to the workflow can always see the next required action.

## Scope and state model

The stepper always represents the saved state for the current selection. Changing the grade, section, or classroom immediately resets the displayed progress to the newly selected scope's actual persisted state; no client-side progress is carried over between scopes.

The resolver consumes existing page data only: selected scope, resolved timetable configuration, periods, timetable entries, validation result, and publication state. It does not persist new workflow state or create a second source of truth.

## Steps

1. **Select scope** — complete when a classroom is selected. Activating the step focuses the existing scope selectors.
2. **Configure timetable** — complete when the selected scope has a valid timetable configuration with active days. Activating the step opens the existing configuration dialog.
3. **Add periods** — complete when the configuration has at least one valid instructional period. Activating the step opens the existing periods dialog.
4. **Build schedule** — complete when the selected classroom has timetable entries. Activating the step focuses the grid and its existing generation and editing controls.
5. **Review & publish** — complete when the schedule passes the existing validation and is published. Activating the step focuses the validation and publication controls.

Steps have one of four display states:

- **Complete:** primary-colored connector and check icon; remains selectable so earlier data can be revised.
- **Current:** the first incomplete actionable step; visually emphasized and selectable.
- **Blocked:** a future step whose prerequisite is incomplete; muted and exposes the prerequisite message on hover and keyboard focus.
- **Published:** the final completed state after a successful publication, respecting the existing read-only behavior.

## Interaction and responsive behavior

On desktop, display an inline horizontal bar with numbered/checkpoint circles, labels, connecting progress track, and an accessible current-step description. Do not rely on color alone: icon, text, and `aria-current="step"` identify status.

On narrow screens, preserve the same ordering in a horizontally scrollable labelled bar rather than squeezing or truncating labels. The selected/current step must remain visible when the view updates. Interactive steps are keyboard reachable; blocked steps are not interactive but explain what is required.

Use the existing UI components and Lucide icon set, existing primary color tokens, visible focus styles, 150–300 ms color transitions, and reduced-motion-safe styling.

## Component boundaries

- `timetableCreationProgress` resolver: a pure module that maps current timetable data to typed step statuses, labels, prerequisite text, and action identifiers.
- `TimetableCreationStepper`: presentational and accessible component that renders the resolved steps and emits the selected action identifier.
- `TimetableView`: owns action routing to existing UI controls and passes current state into the resolver/component.

No API or backend contract changes are required.

## Errors and edge cases

- Missing academic context or scope leaves only **Select scope** actionable.
- Missing configuration, active days, or instructional periods blocks dependent steps with a specific message.
- Validation errors keep **Review & publish** incomplete and route the user to the existing validation surface.
- A closed term or insufficient permission preserves current read-only behavior; the stepper communicates state but does not expose mutating action targets.
- Empty or partially completed scopes are valid states, not errors.

## Verification strategy

Add focused resolver tests for each status transition and scope reset. Add component tests for accessible status semantics, blocked-step behavior, and action callbacks. Run the relevant timetable tests, lint, and typecheck; ask the owner before running the full test suite, as required by project policy.
