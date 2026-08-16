# Hero Journey Mission Wizard Design

## Goal

Turn the Hero Journey mission create/edit modal into a focused four-step wizard and protect users from accidentally losing unsaved work.

## User flow

The modal uses the existing `WizardStepper` component and one shared form state:

1. **Basics** — academic year and term (read-only), stage, grade, mission titles, and briefs.
2. **Links & rewards** — subject, grade-dependent mission lesson dropdown, linked assessment, level, XP, badge, map coordinates, and mission sort order.
3. **Objectives** — add/remove objectives and edit type, titles, subtitles, lesson reference, assessment, order, and required state.
4. **Review** — read-only summary of the complete request, including all objectives.

The final Save action is available only on Review. Next validates the active step; Back returns to the previous step without discarding state. Published missions retain their existing read-only restrictions while following the same wizard flow.

## Unsaved changes

The modal has one close handler for the cancel button, modal close button, Escape, and backdrop dismissal. If no fields have changed, it closes immediately. If the form is dirty, it opens the shared `ConfirmDialog` with Stay and Discard actions. Stay closes only the confirmation prompt. Discard clears the session dirty state and closes the mission modal. A successful save clears dirty state before closing, so no confirmation appears after saving.

## Component boundaries

- `HeroJourneyMissionFormModal` owns form state, step state, validation, submit orchestration, and the unsaved-changes guard.
- Step content remains local to the modal unless extracting a panel materially improves readability.
- `WizardStepper` supplies the visual progress treatment and remains non-destructive when the user moves between steps.
- `ConfirmDialog` supplies the discard confirmation and localized actions.

## Validation and payload

Existing DTO validation and payload normalization remain unchanged. Step validation is scoped to the active step, while the final Save revalidates the complete form before invoking `onSubmit`. Review is display-only and must not mutate the request.

## Accessibility and responsive behavior

All existing labels, RTL support, keyboard controls, disabled states, and focus-visible styles remain. Step content stays responsive inside the existing large modal. Review values are rendered as text rather than disabled inputs so they are clearly non-editable.

## Verification

Tests cover:

- four-step rendering and Next/Back navigation;
- step-scoped validation;
- read-only Review and final-save-only behavior;
- close paths with clean and dirty state;
- Stay and Discard confirmation actions;
- successful save clearing the dirty guard.
