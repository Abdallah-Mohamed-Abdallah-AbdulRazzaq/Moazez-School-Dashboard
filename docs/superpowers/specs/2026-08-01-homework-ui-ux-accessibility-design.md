# Homework UI/UX and Accessibility Design

## Goal

Improve the Homework experience without changing its backend contract, endpoint
permissions, or lifecycle behavior.

## Approved scope

1. Replace date-only homework deadlines with a localized date-time picker in
   both create and assignment-edit settings. The selected ISO timestamp remains
   the value validated and sent by the existing contract layer.
2. Make disabled review and grade-sync actions understandable. The UI shows the
   current blocking reason rather than relying on an unexplained disabled button.
3. Make the mobile submissions drawer a keyboard-accessible dialog: semantic
   dialog attributes, an accessible close control, Escape dismissal, focus on
   open, and focus restoration on close.
4. Replace undeclared gray utility classes with declared palette values so text,
   borders, and hover states render consistently.
5. Split homework creation into clearly labelled Assignment, Schedule, Grading,
   and Recipients sections. Keep the existing fields and backend request shape.
6. Surface workflow progress and grade-sync freshness: required-answer review
   progress, an unsaved-change summary with save/discard actions, and the
   backend-provided last-sync timestamp.

## Interaction rules

- Readiness guidance is informational and never bypasses backend authority.
- Save/discard controls reuse existing review save and discard behavior.
- Sync freshness is shown only when status-view permission reveals the data.
- The drawer continues to close on backdrop click; keyboard users also receive
  Escape support and a labelled close button.
- All new copy is localized in Arabic and English.

## Testing

Add or extend component tests for date-time controls, readiness guidance,
unsaved-review actions, grade-sync freshness, and mobile-dialog semantics.
Run the Homework suite, typecheck, touched-file lint, and production build.
