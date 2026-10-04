# Timetable term setup flow design

## Objective

Give each school a clear first-run setup before entering the timetable workspace. A school administrator configures the current term's active days and periods once, then builds schedules for all classrooms inside that same term-level draft configuration.

The flow must stop treating stage, grade, section, and classroom filters as implicit requests for separate timetable configurations. Those selections filter the timetable workspace; they do not change the configuration being edited unless the user explicitly enters an advanced override workflow.

## Current behavior and problem

The backend supports timetable configurations at `TERM`, `STAGE`, `GRADE`, `SECTION`, and `CLASSROOM` scopes. Its effective-timetable resolver applies the most specific active, published configuration to a classroom. Draft configurations are not inherited through that resolver.

The current frontend derives the requested configuration scope from the selected stage, grade, section, or classroom. Therefore, selecting a stage after creating a `TERM` draft makes the frontend request an exact `STAGE` configuration. When none exists, the user sees "No timetable configuration exists for this scope," even though the intended working configuration is the term draft.

This is contract-compatible behavior, but it conflates two different concepts:

- The scope that owns the timetable configuration.
- The filters used to navigate and edit classroom schedules.

## Product decision

The primary school-management workflow uses one default timetable configuration per school, academic year, and term.

- The initial configuration has `scopeType: TERM` and remains `DRAFT` while schedules are built.
- The term configuration provides the default days and periods for all classrooms in that term.
- Stage, grade, section, and classroom selections in the primary workspace are filters only.
- More-specific configurations remain supported as explicit advanced overrides for schools that operate different shifts or bell schedules.
- Overrides are not created merely by changing a filter.

"Configure once" means once per school and term, not once for the entire multi-tenant platform.

## User flow

### First visit for a term

1. The user opens the timetable route.
2. The application checks the exact `TERM` configuration for the current academic year and term.
3. If no term configuration exists, a management user is redirected to `/academics/timetable/setup` at the active-days step.
4. If the configuration exists but has no valid instructional period, the user is redirected to the periods step.
5. When the term configuration and at least one valid instructional period exist, the user enters the timetable workspace.

The configuration does not need to be published to pass the setup gate. A `DRAFT` term configuration is the expected state while the timetable is being built.

### Later visits

- A ready term opens the timetable workspace directly.
- A visible **Timetable settings** action opens the setup route for review or editing.
- Opening the setup route directly never redirects a ready user away; it opens the existing settings in editable or read-only mode as appropriate.
- Switching the selected academic year or term re-evaluates setup for the newly selected context.

### Read-only users

- A closed term is displayed read-only and never redirects to an editable setup flow.
- A user without `academics.structure.manage` who encounters incomplete setup sees a blocking explanation directing them to a school administrator.
- Read permissions must not expose controls that imply the user can complete setup.

## Setup state model

Add a pure setup-status resolver with these states:

- `missing_config`: no exact term configuration exists.
- `missing_periods`: the term configuration exists but has no valid instructional period.
- `ready`: the term configuration and at least one valid instructional period exist.
- `read_only`: the context can be viewed but cannot be changed because of term status or permissions.
- `error`: setup status could not be established reliably.

The status is derived from backend data. Do not add a client-side or backend `setupCompleted` flag.

Network and authorization failures must resolve to `error` or `read_only`, never to `missing_config`. This prevents accidental setup creation after a failed read.

## Setup page

The dedicated setup page is a focused, responsive three-step flow. It uses components from `src/components/ui` and reuses timetable components where their current responsibility matches the new flow.

### Step 1: Study days

- Show the current academic year and term as read-only context.
- Generate a friendly configuration name automatically, such as the localized equivalent of "First term timetable." Do not require the administrator to invent a technical name.
- Let the user choose the week start day.
- Let the user select the active study days.
- **Save and continue** creates or updates the exact `TERM DRAFT` configuration.

At least one active day is required. Backend validation remains authoritative, with matching client validation used for immediate feedback.

### Step 2: Period times

- Capture the period label, start time, end time, type, sequence, and instructional status.
- Use the existing rapid-entry behavior: after a successful add, keep the page open and prepare the next period.
- Show saved periods in sequence below the entry form.
- Permit editing and deletion through existing timetable period operations and safeguards.
- Require at least one valid instructional period before continuing.
- Detect invalid ranges, overlaps, and inconsistent sequence ordering before continuing while preserving backend error details.

Periods are persisted individually. Leaving the flow after this step must not discard successfully saved periods.

### Step 3: Review and start

- Summarize active days.
- Show the number of periods and the first and last period times.
- Explain that the configuration is the default for all stages, grades, sections, and classrooms in the selected term.
- If published explicit overrides already exist, explain that they take precedence only in their customized scopes.
- The primary action is **Start building the timetable**.

Finishing setup navigates to the timetable workspace. It does not publish the timetable.

## Timetable workspace behavior

The default workspace always loads the exact `TERM` configuration for editing.

- Stage, grade, section, and classroom selectors filter the academic structure and entries shown in the grid.
- Changing a filter does not call the config endpoint with a different scope.
- A persistent source banner states that the user is editing the term-wide default and that it applies to all classrooms except explicit overrides.
- Saving entries associates them with the term configuration while retaining each entry's classroom identity.
- Validation, conflict detection, generation, publication, and existing draft protections remain authoritative.

The existing backend effective-resolution path continues to serve published timetable consumers. The setup and draft-editing flow uses the exact term configuration directly and does not depend on published inheritance.

## Advanced overrides

The backend's scope precedence remains:

`TERM -> STAGE -> GRADE -> SECTION -> CLASSROOM`

This task must not delete or rewrite existing override configurations. However, filter selection is no longer an implicit override editor. A separate, explicit **Customize a specific scope** action is the entry point for override management.

The existing override editor remains available behind that explicit action. Redesigning the complete override-management experience is outside this task. The default setup and timetable flow must clearly distinguish the term configuration from an override.

## Architecture and component boundaries

### `TimetableSetupStatus`

A pure resolver that converts exact term configuration data, periods, permissions, and term status into the setup state. It contains no routing or rendering logic.

### `useTimetableSetupStatus`

A query hook that loads the exact term configuration and, when present, its periods. It handles stale-request protection when the academic context changes and exposes explicit loading, retry, and error states.

### `TimetableSetupGate`

Used before mounting the editable timetable workspace. It renders a loading skeleton while status is unknown, redirects management users for incomplete setup, renders a permission-safe blocker when setup is incomplete for read-only users, and allows ready contexts through.

Redirects use history replacement to prevent the browser Back action from bouncing between the setup and timetable routes.

### `TimetableSetupPage`

Owns step navigation and composes the existing form, period-entry, button, panel, toast, and confirmation primitives. Persisted backend data determines the first incomplete step.

### `TimetableView`

Continues to own timetable editing. Its primary mode receives the term config independently from the academic filters, so filter changes cannot alter the configuration scope.

## API contract

No backend change is required for the default flow. Use the existing endpoints:

- `GET /academics/timetable/config` with `academicYearId`, `termId`, and `scopeType: TERM`.
- `PUT /academics/timetable/config` to create or update the term draft.
- `GET /academics/timetable/periods` with `timetableConfigId`.
- Existing period create, update, and delete endpoints.
- Existing entry, validation, conflict, generation, publication, and unpublication endpoints.

School and tenant identity continue to come from authenticated backend context. No school identifier is accepted from an untrusted setup form.

## Error handling and recovery

- A missing exact term configuration is a valid first-run state.
- A missing or empty period list resumes at the period step.
- A failed config or period request displays a localized retry state and does not redirect.
- Mutation buttons are disabled while their request is pending to prevent duplicate operations.
- Backend validation messages remain the source of truth for rejected config and period mutations.
- Deleting an in-use period remains blocked by the current backend safeguard.
- A published or otherwise immutable configuration is displayed read-only until the existing unpublish workflow makes it editable.
- Stale responses from a previously selected year or term must not overwrite the current setup state.

## Accessibility and responsive behavior

- Use the existing `WizardStepper` pattern with text and semantic state, not color alone.
- Preserve visible labels for every field.
- Move focus to the active step heading after step navigation.
- Announce successful period additions and request failures through the existing toast or live-region behavior.
- Support keyboard operation, visible focus styles, Arabic RTL, English LTR, and narrow screens without horizontal form scrolling.
- Reuse `src/components/ui` primitives; do not introduce a parallel component system.

## Verification strategy

Add focused coverage for:

- Every setup-status transition.
- Exact term lookup independent of selected stage, grade, section, or classroom.
- Redirect, history replacement, loading, retry, and read-only gate behavior.
- Resuming at the first incomplete setup step.
- Active-day persistence and localized validation.
- Period rapid entry, editing, deletion protection, overlap handling, and continuation requirements.
- Direct access to a completed setup page.
- Stage and grade filter changes retaining the same term configuration ID.
- Existing overrides remaining untouched.
- Closed-term and permission behavior.
- Stale academic-context requests not updating the active view.

Run the focused timetable tests first, then lint, typecheck, and production build. The full test suite requires explicit owner approval before it is run.

## Acceptance criteria

- A management user with no current-term setup is routed to a dedicated setup page.
- The user configures active days and periods once for the term.
- A valid `TERM DRAFT` is sufficient to enter and use the timetable workspace.
- Selecting a stage no longer produces a missing-config message when the term configuration is ready.
- Academic scope selectors filter the grid without changing the editable configuration scope.
- The term configuration can contain entries for all classrooms in its term scope.
- Existing explicit overrides and their data are preserved.
- Incomplete setup is recoverable from the first missing step.
- Errors cannot be mistaken for first-run state.
- Arabic, English, RTL, responsive layout, permissions, and closed terms behave correctly.

## Non-goals

- Copying setup from a previous term.
- Removing backend scope inheritance or override support.
- Automatically creating an override from a selected filter.
- Publishing the timetable as part of setup.
- Redesigning the timetable grid, generator, validation rules, or publication model.
- Adding a backend setup-completion flag or a new endpoint solely for this flow.
