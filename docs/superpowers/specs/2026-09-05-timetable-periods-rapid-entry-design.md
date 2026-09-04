# Timetable periods rapid-entry design

## Goal

Make the **Timetable periods** dialog fast and unambiguous for adding multiple periods in one session, without changing the existing period API, validation rules, or timetable scope behavior.

## User flow

1. The dialog opens in periods mode and shows a concise progress count, such as `2 periods added`.
2. A visually distinct **New period** card is the first actionable area.
3. The user enters a period label, start time, end time, period type, and whether it is instructional.
4. The primary action reads **Add next period**. It is the only prominent action in the editor.
5. On a successful add, the dialog remains open, the label is cleared, the next sequence number is prefilled, and the user can immediately add another period.
6. The saved-period list stays below the editor, ordered by sequence. Each row communicates sequence, label, time range, and type at a glance. Edit is secondary; deletion remains destructive and uses the existing confirmation/guard behavior.

## Layout and hierarchy

- Use the existing `Modal`, `Button`, and `Select` UI components.
- Keep labels visible; do not depend on placeholders for field meaning.
- At desktop widths, use a compact responsive grid ordered for Arabic RTL scanning: sequence, label, start time, end time, type.
- At smaller widths, fields stack without horizontal scrolling.
- Group the instructional checkbox with type because both define how the time slot behaves.
- Separate the entry card from the saved-period list with clear headings and neutral borders.
- Avoid a second form-level save action in periods mode. Adding a period is already the persisted operation.

## States and feedback

- Disable the primary add action while a request is saving and preserve the existing validation errors.
- Show a short localized success acknowledgement after an add without interrupting the next entry.
- When editing, replace the primary label with **Update period** and show a visible **Cancel edit** action that restores the ready-to-add state.
- If no configuration exists, retain the existing message that the timetable configuration must be saved before periods can be added.
- Read-only users can review the list but cannot access entry or destructive controls.

## Accessibility

- Every input retains an associated visible label.
- The primary action has a clear accessible name and exposes its loading state through the existing button behavior.
- Success feedback uses a polite live region.
- Keyboard focus remains in the entry card after a successful add so the user can continue typing.

## Scope boundaries

- No backend, API-contract, or data-model changes.
- No bulk import, drag-and-drop, or multi-row spreadsheet editing.
- Existing validation, scope resolution, and period-in-use protections remain authoritative.

## Verification

- Add or extend component tests for the rapid-entry success reset, success feedback, edit/cancel behavior, and read-only state.
- Run focused period-dialog tests, lint, and typecheck. Ask before running the full suite.
