# Timetable Drag-and-Drop Scheduling Specification

## Objective

Let timetable editors schedule and adjust lessons directly from the timetable workspace without opening the slot dialog for routine assignments.

## Product behavior

- Add a collapsible scheduling library beside the timetable on large screens and a bottom drawer on smaller screens.
- The library has three views: Lessons, Teachers, and Rooms.
- Direct library placement is enabled after selecting one classroom; broader scope views keep their existing viewing and dialog-editing behavior.
- Lessons are the primary draggable resource. A lesson represents a subject plus the allocated teacher and recommended room for the active classroom.
- Dropping a lesson on an instructional slot assigns all available lesson fields in one operation.
- Dropping a teacher or room on a filled lesson changes only that field.
- A teacher or room cannot be placed in an empty slot; the UI explains that a subject must be added first.
- Existing timetable lessons can be moved between editable instructional slots.
- Dropping on an occupied slot replaces the target locally and presents an accessible Undo action.
- The existing slot dialog remains available by clicking a slot when no library item is selected.
- Changes remain local and mark the timetable dirty until the existing Save action succeeds.

## Resource scoping

- Subjects come from positive weekly-hour allocations for the target grade.
- Teacher choices come from teacher allocations matching the target section, classroom, and subject.
- Room recommendations reuse the existing room eligibility and recommendation rules.
- Lesson cards show the subject, resolved teacher, recommended room, and remaining weekly periods for the active classroom.
- The default ordering places lessons with the greatest remaining weekly need first.
- Search matches localized subject, teacher, or room names.
- An Unscheduled only filter hides lessons whose allocated weekly requirement has already been met.

## Drop validation and feedback

- Read-only, published, closed-term, holiday, break, and non-instructional slots do not accept drops.
- A teacher or room drop onto an empty slot is rejected.
- A teacher whose allocation does not match the subject already in a slot is rejected.
- Inactive or capacity-ineligible rooms are rejected.
- Known teacher and room collisions at the same day and period are rejected before local state changes.
- The backend save, validation, and conflict endpoints remain authoritative.
- Compatible targets receive a positive drop highlight, warned targets receive an amber highlight, and rejected targets receive a red/disabled treatment with a localized explanation.
- Successful drops, rejected drops, and undo operations are announced to assistive technology.

## Input methods

- Pointer users can drag library resources and existing lessons.
- Keyboard and touch users can select a library item, then activate a destination slot.
- Escape cancels the selected item or current drag.
- Slot activation retains focus after placement or rejection; undo returns focus to the timetable workspace.

## Responsive behavior

- At large breakpoints, the library is a collapsible 300–320px panel on the logical inline-start side.
- Below the large breakpoint, the library opens in a bottom drawer and uses select-then-place interaction as the primary path.
- The timetable keeps its existing horizontal scrolling behavior.
- Print output excludes the scheduling library, drag overlays, drop indicators, and undo controls.

## Constraints

- Reuse `@dnd-kit/core`, which is already installed.
- Reuse primitives exported from `src/components/ui` for buttons and inputs.
- Preserve English and Arabic localization and logical RTL/LTR placement.
- Do not change backend contracts or deployment configuration.
- Do not remove the existing edit dialog.
- Do not run the full test suite without asking the owner first.
- Apply the clean-code guard to every production-code change and the test guard to every test change.

## Acceptance criteria

1. An editor can place a lesson bundle into an empty instructional slot without opening the dialog.
2. The placed lesson contains the allocated subject and teacher and the recommended room when one is available.
3. An editor can override the teacher or room of a filled lesson by direct placement.
4. Invalid destinations never mutate timetable state and provide a localized reason.
5. Replacing or moving a lesson can be undone before the next drop operation.
6. Pointer, keyboard, and touch/select-then-place workflows produce the same timetable state.
7. Existing slot-dialog editing, dirty-state protection, saving, validation, publishing, mobile day expansion, conflict focusing, and printing continue to work.
8. English and Arabic contain matching translation keys for all new UI and announcements.

