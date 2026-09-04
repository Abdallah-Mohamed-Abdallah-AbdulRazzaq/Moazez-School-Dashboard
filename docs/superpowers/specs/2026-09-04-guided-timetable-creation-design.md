# Guided Timetable Creation Design

## Goal

Replace an open-ended timetable-creation experience with one intelligent, single-page workspace. For the currently selected academic year, term, and timetable scope, the page must make the next required action unambiguous and prevent publishing an incomplete or invalid timetable.

This guidance is state-based, not visit-based: it is shown whenever the selected scope has no timetable or has an unfinished draft, including after the user returns to the page later.

## Scope

The experience covers these ordered stages:

1. timetable settings;
2. periods;
3. timetable construction;
4. validation;
5. publishing.

It includes explicit saves, an unsaved-changes leave confirmation, and multiple selectable default-period templates. It does not introduce automatic saving, change the timetable API contract, or redesign unrelated dashboard surfaces.

## Page Model

The page is a single workspace with a persistent progress rail at the top and a primary action card immediately below it.

The rail shows all five stages in their fixed order. Every stage has one of four text-and-icon states:

- **Required:** it is the next action preventing progress.
- **In progress:** it has saved information but is not complete.
- **Complete:** its completion rule is met.
- **Blocked:** an earlier requirement or a validation error prevents access.

The primary action card always speaks to the selected scope's actual state. Examples:

- “No timetable exists for this class. Start with timetable settings.”
- “Add periods before building the timetable.”
- “Resolve 3 conflicts before publishing.”

It contains exactly one primary call to action: the next required action. Secondary links may open already completed stages for review or editing, but must never compete visually with the primary action.

Stages remain visible even when blocked. A blocked stage explains its prerequisite in plain language and is not navigable as a working surface until that prerequisite is saved.

## Stage Details

### 1. Timetable Settings

The user saves the timetable's identity, week start day, active days, and selected scope settings. On success, the next action becomes period setup. A state that has unsaved setting edits remains in progress, not complete.

### 2. Periods and Templates

The empty state leads with “Use a period template” and offers “Add manually” as a secondary action.

Templates are displayed as selectable cards containing a name, period count, break count, and a compact time-range preview. The product supports more than one template; the exact available templates can vary by school configuration. Selecting a template opens a review view before any data is applied. The review shows every period and break, allows editing before save, and requires a clear “Apply and save” action.

Applying a template when saved periods already exist never merges periods automatically. The user must explicitly confirm that the template will replace the current periods, or cancel and keep them unchanged.

Saving a template creates editable periods. The user can then add, edit, remove, or reorder periods. At least one instructional period is required before timetable construction becomes available.

### 3. Timetable Construction

This stage opens only after settings and the required instructional periods are saved. It offers two ways to create the timetable:

- **Build manually** is the primary action. It opens the editable timetable grid.
- **Create automatically** is a secondary action. It fills only empty slots and never changes an assignment made manually by the user. Before it is available, required curriculum data must be complete for every subject in scope: its weekly lesson count and its assigned teacher. If any required data is missing, automatic creation is blocked and the page lists each missing item with a direct route to complete it; it does not produce a partial automatic timetable.

Automatic creation applies its suggestions immediately. It shows an always-visible “Undo last automatic creation” action that reverses the entire most recent automatic-creation batch, including after an explicit save during the current open session. The undo history expires if the user leaves or reloads the page; a concise hint communicates this before the user navigates away.

A timetable does not need every instructional slot filled to reach validation or publishing; validation determines whether its current contents contain blocking issues. The progress rail still summarizes assignment coverage as a count of assigned versus available instructional slots, but does not present partial coverage as an error by itself.

### 4. Validation

The validation stage becomes actionable once a timetable draft exists. It groups results by severity and links each result to its precise grid location or relevant setting. A validation failure keeps publishing blocked. A clean validation result marks this stage complete.

### 5. Publishing

Publishing is unavailable until all preceding stages are complete and validation has no blocking errors. The publish area shows a concise final checklist before the confirmation action. A successful publish changes the workspace to a published state and makes subsequent edits clearly draft changes that require validation again before a later publish.

Changing saved settings or periods after timetable construction warns the user when it affects existing timetable slots. The affected timetable remains a draft that requires validation again; a destructive change cannot silently remove or invalidate slots.

## Saving and Navigation

There is no autosave. Each editable stage has a visible, explicit save action and clear saved/saving/error feedback.

If a user attempts to leave the page, change the selected scope, or open another main navigation destination while any editable stage has unsaved changes, show a confirmation dialog:

- **Title:** “You have unsaved changes.”
- **Body:** identify the affected stage when known and say that those edits will be discarded.
- **Primary safe action:** “Continue editing.”
- **Destructive action:** “Leave without saving.”

The dialog must be keyboard accessible, keep focus inside while open, and restore focus to the action that launched it when dismissed.

## States and Error Handling

- Loading: show the selected scope and a compact loading state; do not display a false “missing timetable” message before data resolves.
- No timetable: show the state-based starting card and settings as the sole primary action.
- Partial draft: derive the next action from saved data, not from a local session flag. There is exactly one draft per academic year, term, and timetable scope; reopening that scope resumes its existing draft rather than creating a competing one.
- Save failure: retain the user's unsaved entries, expose the failure near the relevant save action, and keep the stage incomplete.
- Validation failure: show error count, severity, plain-language explanation, and a direct repair route.
- Permission-limited user: show the stage state and reason, but disable mutation and publishing actions with an explanation.

## Accessibility and Localization

The page supports Arabic RTL and English LTR. Progress status must be conveyed through text and iconography in addition to color. All fields have labels; errors are associated with their inputs; focus is visible; all rail actions and dialogs are operable with a keyboard. Transitions should be subtle and respect reduced-motion preferences.

## Component Boundaries

Use the project's existing UI primitives for buttons, modal dialogs, inputs, and selects. The feature-specific interface should be split into focused components:

- `TimetableCreationGuidance`: derives and presents the current next action.
- `TimetableProgressRail`: renders the five stage states and prerequisite explanations.
- `PeriodTemplatePicker`: lists templates and opens a preview.
- `PeriodTemplatePreview`: permits pre-save review and edits before applying a template.
- `UnsavedTimetableChangesDialog`: handles all leave/change-scope confirmations.
- `PublishReadinessPanel`: presents validation status and publish eligibility.

The page owns data fetching and navigation decisions. A single derived creation-state model supplies the guidance card, progress rail, and publish readiness panel so that those surfaces cannot disagree about the next step.

## Acceptance Criteria

1. A missing timetable always guides the user to saved settings first for the active scope.
2. The user sees all five stages and a single, clear next action at every state.
3. A stage that depends on unfinished work is visibly blocked and explains why.
4. The user can select, preview, edit, and explicitly save one of multiple period templates.
5. Leaving, changing scope, or navigating away with unsaved edits requires a choice to continue or discard edits.
6. No user can publish while settings or periods are incomplete, or while validation reports blocking errors; unfilled instructional slots alone do not prevent publishing.
7. Every validation issue navigates the user to a precise place to repair it.
8. The flow works in Arabic RTL and English LTR and is keyboard accessible.
9. Applying a template over existing periods requires confirmation and replaces them only after explicit approval.
10. A setting or period change that affects existing slots warns the user and returns the timetable to a draft that must be validated again.
11. Reopening a scope with a draft resumes its single existing draft.
12. Manual building is the primary construction action; automatic creation fills only empty slots and preserves manual assignments.
13. The user can undo the most recent automatic-creation batch after saving while the page remains open, and receives a clear notice that the option expires on leaving or reloading the page.

## Verification Plan

Add focused tests for creation-state derivation, stage gating, publish eligibility, unsaved-change navigation protection, automatic creation's empty-slot-only behavior, automatic-creation prerequisites, and session-scoped undo. Add component tests for the guidance card, progress rail, template preview, leave dialog, missing-data guidance, and automatic-creation undo hint. Manually verify the responsive layout at mobile, tablet, and desktop sizes and verify keyboard navigation, focus restoration, RTL ordering, and reduced-motion behavior.
