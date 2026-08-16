# Curriculum Confirmation Modals Design

## Scope

Replace every native `window.confirm` call in the curriculum feature with the existing `ConfirmDialog` component. This covers:

- deleting a unit or lesson in `CurriculumEditor`;
- deleting lesson content in `LearningContentPanel`;
- discarding unsaved curriculum edits when the academic year or term changes in `CurriculumPageContent`.

Curriculum archive and delete already use `ConfirmDialog` and retain their current behavior.

## Component-owned deletion confirmation

`CurriculumEditor` and `LearningContentPanel` will each own their pending deletion state and render `ConfirmDialog` next to the UI that initiates deletion. Clicking delete records the target and opens the dialog without calling the backend. Cancel clears the target. Confirm performs the existing deletion, refresh, selection reset, and error handling.

The dialog uses danger severity. While deletion is running, its buttons remain disabled through the existing `loading` property. A successful deletion closes the dialog; a backend failure keeps the surrounding form available and renders the existing form-level backend error.

## Asynchronous unsaved-change confirmation

`useGuardedAcademicContextChange` currently accepts a synchronous `confirmDiscard: () => boolean` callback solely to call `window.confirm`. Its contract will change to `confirmDiscard: () => Promise<boolean>`.

`CurriculumPageContent` will implement that callback by opening `ConfirmDialog` and returning a promise for the user's choice. Confirm resolves `true`; cancel or closing the dialog resolves `false`. The hook awaits the result before discarding local state and applying the requested academic-year or term change.

Only one discard request may be pending. The resolver is cleared immediately when settled and on component cleanup, preventing a stale decision from affecting a later navigation request.

## Error and state behavior

Cancel never calls a deletion or navigation service. Confirm executes the pending action once. Existing curriculum backend-error mapping remains unchanged. Changing selection or closing a content panel clears obsolete pending deletion state.

The dialogs use existing curriculum translations where suitable. Any missing title, confirmation, or cancel text will be added to the current curriculum translation namespace rather than hardcoded in components.

## Testing

Tests will define behavior before implementation:

- editor and lesson-content component tests verify that delete opens a modal, cancel does nothing, confirm calls deletion once, and loading prevents duplicate confirmation;
- hook tests verify that academic-year and term changes await the asynchronous decision, cancel blocks the change, and confirm discards then continues;
- page tests verify that the unsaved-change dialog resolves the pending decision correctly;
- a repository search verifies no native `confirm(` calls remain under the curriculum feature.

