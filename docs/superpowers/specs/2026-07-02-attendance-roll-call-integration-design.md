# Attendance Roll-Call Integration Design

## Goal

Integrate the roll-call page fully with the aligned attendance services and adopt the shared attendance workspace language without weakening the fast, write-heavy workflow. The result must support scope and session selection on mobile, preserve deliberate bulk saving, surface recoverable failures in context, and keep submitted sessions read-only.

## Scope

This pass covers:

- `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`
- `src/features/attendance/roll-call/components/RollCallHeaderBar.tsx`
- `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`
- the shared attendance workspace components required to compose the roll-call rail and mobile actions
- focused roll-call page or component tests where the repository's current test setup supports stable behavior tests

The aligned service endpoints and DTO serializers remain the contract boundary. This pass consumes those services; it does not redesign their API.

## Interaction Model

Roll call retains an explicit Save/Submit workflow.

- Roster edits update local draft state immediately.
- `Save` sends the complete draft through `saveSession()`.
- `Submit` saves the current draft first and submits only after that save succeeds.
- `Unsubmit` changes the session back to draft before editing is enabled.
- Submitted sessions are read-only.
- `upsertEntry()` is not used for normal roll-call marking. It remains available for focused entry updates and formal corrections elsewhere.

This model minimizes network traffic during high-volume marking and gives the user a clear commit point. Per-student autosave is out of scope because it introduces partial-failure and ordering behavior that the current UI does not communicate.

## Workspace Composition

The page will use `AttendanceWorkspaceShell` for its outer layout and state placement. Roll call needs a rail composition rather than the read-heavy table/details split.

Add `AttendanceWorkspaceRail` to `AttendanceWorkspaceShell.tsx`:

- accepts `rail` and `main` content
- renders a stable desktop rail of approximately `18rem` to `20rem`
- gives the main region `min-w-0`, `min-h-0`, and remaining width
- hides the rail below the desktop breakpoint
- owns layout only; it does not own roll-call state or data fetching

The desktop layout is:

1. session picker rail
2. main roll-call workspace with header, summary, roster filters, and roster table

The page remains the data container. Existing roll-call components remain presentational and receive controlled values and callbacks.

## Mobile Behavior

Mobile must provide access to every session-defining control that exists in the desktop rail.

- Add a `Session` mobile action that opens `SessionPickerPanel` inside the existing `AttendanceBottomDrawer`.
- Keep the roster filter action next to it.
- Keep Save and Submit available in a compact action area without horizontal overflow.
- Move secondary bulk-mark commands into an existing menu or compact secondary row when they do not fit.
- Do not introduce a fixed action bar that covers roster rows or conflicts with device safe areas.

`SessionPickerPanel` will accept `variant: "rail" | "drawer"`, defaulting to `"rail"`. The drawer variant removes fixed rail sizing and outer framing while preserving labels, order, validation, and controlled values. Its existing `disabled` contract must be applied consistently to session-defining controls while mutations or session resolution are in progress.

Responsive verification targets are `375px`, `768px`, `1024px`, and `1440px`. No horizontal page scrolling is acceptable.

## Header And Actions

`RollCallHeaderBar` remains responsible for session status and write actions, but its layout becomes responsive.

- Desktop shows Save and Submit/Unsubmit as the primary actions.
- Mobile uses compact icon-plus-label actions with stable dimensions.
- Save is disabled when there is no active draft session, the session is submitted, no changes exist, or a mutation is running.
- Submit is disabled when there is no active draft session or a mutation is running.
- Unsubmit is available only for submitted sessions.
- Existing Lucide icons and project button variants are retained.
- Focus states, button labels, and disabled states remain explicit; color is not the only status signal.

Bulk marking remains secondary to Save and Submit. It must not visually compete with the commit actions.

## Service Data Flow

### Initial Context

The page loads the existing academic structure, timetable context, and effective policy needed by the session picker. A complete scope, date, and mode selection is required before previewing the roster or opening attendance.

### Roster Preview And Session Resolution

When the session-defining selection changes:

1. Fetch the roster through `fetchRoster()` using the selected hierarchy, academic context, date, mode, and period key.
2. Clear any previously opened session and entries after unsaved-change protection allows the selection change.
3. Show the roster as a preview without creating or resolving a session.
4. Enable an explicit `Open attendance` action when the selection is complete and the roster is available.

When the user chooses `Open attendance`:

1. Resolve the session through `getOrCreateSession()` using the current selection.
2. Merge the returned entries with roster students for display, defaulting students without entries to `UNMARKED` locally.
3. Store an immutable baseline copy for dirty-state comparison.

`POST /attendance/roll-call/session/resolve` must not run merely because scope, date, mode, or period changed. The explicit action is required because resolving may create the attendance session.

Stale requests must not overwrite a newer selection. The existing request sequencing or cancellation mechanism must be retained or strengthened if the current page does not already guarantee this.

### Save

On Save:

1. Call `saveSession(session, entries)`.
2. Use the returned session as the current session.
3. Reconcile returned entries against the roster and use that result as the new editable state.
4. Replace the baseline with the reconciled saved state.
5. Clear the dirty state and show success feedback.

The page must not mark itself clean before the request succeeds. If a defensive compatibility fallback is needed because an older response omits `entries`, retain the submitted local entries as the saved baseline rather than replacing a populated roster with an empty array. This fallback belongs in the page reconciliation helper, not in the API serializer.

### Submit

On Submit:

1. Save the current draft and reconcile the returned data.
2. Call `submitSession()` only after Save succeeds.
3. Replace the session with the submitted session returned by the service.
4. Preserve the reconciled entries and baseline.
5. Enter read-only mode and show success feedback.

If Save fails, Submit is not attempted. If Save succeeds but Submit fails, the session remains a saved draft and the UI must say that submission failed without restoring a false dirty state.

### Unsubmit

On Unsubmit, call `unsubmitSession()` and use its returned session. Editing becomes available only after the request succeeds. Existing entries remain unchanged.

## Loading, Empty, And Error States

Use shared workspace state placement while keeping messages specific to roll call.

- Initial page loading may use the existing main loader.
- Session changes use a content-level loading state so the workspace frame does not disappear.
- Incomplete scope or period selection shows a clear select-session state.
- A valid roster preview with no opened session shows the explicit `Open attendance` action.
- A valid session with no roster shows a no-students state.
- Structure, timetable, policy, roster, and session-resolution failures render an inline retryable state in the affected workspace region.
- Mutation failures use toasts and keep the current local draft intact.

Retry must rerun the failed load using the current selection. Errors should use the normalized backend envelope already handled by the shared API layer; components should not parse transport payloads directly.

## Unsaved Change Safety

Changing scope, date, mode, period, or route context while local edits are dirty must not silently discard them. Reuse an existing confirmation pattern if one exists. Otherwise, add a focused confirmation dialog with three clear outcomes:

- stay on the current session
- discard changes and continue
- save changes and continue, only where the target transition can safely wait for Save

Browser or route-exit protection should follow existing application conventions. This pass must not introduce a bespoke global navigation framework.

## Visual Rules

- Follow the existing attendance palette, typography, spacing, and border tokens.
- Keep the interface dense and operational; no hero treatment, glass effects, decorative gradients, or oversized headings.
- Use cards only for genuinely framed tools such as the session picker and roster panel.
- Keep controls aligned to stable grid tracks so status labels and loading text do not shift the layout.
- Use row highlighting, clear focus rings, and 150-300ms color transitions without scale-based hover movement.
- Preserve readable contrast in both supported themes.

## Testing

Service contract tests remain the source of truth for endpoint paths and DTO serialization. Add focused behavior coverage for new page behavior where practical:

- mobile session action opens a drawer containing the session controls
- disabled session picker controls respect the `disabled` prop
- Save consumes the returned session/entries and clears dirty state only after success
- Submit does not run when Save fails
- successful Save followed by failed Submit leaves a clean draft
- unsaved edits are protected when changing the session-defining selection

Avoid snapshot tests and assertions on utility-class strings. Prefer accessible roles, labels, visible states, and mocked service outcomes.

Required verification:

- roll-call service tests
- any new roll-call page/component tests
- `npm run typecheck`
- scoped eslint on changed attendance files
- browser verification at `375px`, `768px`, `1024px`, and `1440px`

Full lint remains a separate signal if the known unrelated documentation-demo errors are still present.

## Out Of Scope

- per-student autosave for routine marking
- a new correction workflow for submitted entries
- policy editing or policy shell adoption
- Teacher App attendance screens
- backend endpoint or DTO changes
- generalized attendance state management across all tabs
- unrelated visual redesign outside roll call and the shared layout primitive it requires
