# Academics Timetable Backend Gap Closure Design

**Date:** 2026-09-09

**Repository:** Moazez School Dashboard

**Frontend baseline:** `ff0a408c255fc273005f8c853fff3c3198bcab6e`

**Backend contract baseline:** `a5085660c2069d76be632aaff8b73d3a9c8c0584`

## Goal

Align the School Dashboard frontend with the existing academics curriculum, timetable, conflict, room-scheduling, publication, and generation contracts already merged into the backend. The backend remains unchanged and authoritative for effective timetable selection, generation, conflict detection, room eligibility enforcement, validation, and publication readiness.

## Scope

This design covers frontend changes only. Delivery is split into five sequential, independently reviewable pull requests. Each pull request starts from the latest merged `origin/main`; no feature branch is based on another unmerged feature branch.

The work covers:

- Stage-scoped timetable configuration.
- Effective published timetable display and inherited timetable UX.
- Authoritative backend timetable generation.
- Interval-based conflict presentation.
- Room scheduling eligibility and dependency errors.
- Curriculum dependency errors.
- Complete publication-blocker presentation.
- Affected timetable consumers in lesson plans, homework, and attendance.

The work does not change backend endpoints, database schema, deployment configuration, authentication, permissions, or the general visual design system.

## Product Decisions

1. The backend is the source of truth for all scheduling decisions.
2. An inherited published timetable is read-only in the selected child scope.
3. The inherited state includes an explicit action to create a custom override for the selected scope.
4. Automatic generation operates on the complete scope of the current timetable config, not only the currently selected classroom.
5. Invalid rooms remain visible as disabled options with a textual reason.
6. Curriculum dependency failures preserve unsaved matrix edits and display the affected curriculum pair and dependency counts.
7. Publication diagnostics display every blocking reason. Toasts provide summaries only.
8. Existing components under `src/components/ui` are used for dialogs, alerts, buttons, inputs, badges, and loading states.

## Delivery Structure

### PR 1: Stage Scope and Effective Timetable Resolution

Suggested branch: `feat/timetable-stage-effective-resolution`

Add `STAGE` and `stageId` throughout timetable request, response, domain, and display types. Replace frontend-authored inheritance decisions with the backend `effectiveConfig` result for published timetable display.

The timetable workspace distinguishes three states:

- **Exact config:** The selected scope has its own config. It can be edited when status, term state, and permissions allow.
- **Inherited effective config:** No exact config exists, but the selected classroom has an effective published config. The timetable is displayed read-only with its source scope and an action to create an override.
- **Unconfigured:** Neither an exact config nor an effective config exists. The existing setup empty state is shown.

Creating an override sends the selected target scope explicitly. Selecting only a stage creates a `STAGE` config and sends `stageId`; it never falls back to `TERM`.

Effective published reads use `GET /academics/timetable/all` with the narrowest available backend query, normally `termId` and `classroomId`. Exact draft editing continues to use `GET /academics/timetable/config`. The two concepts are not merged into one ambiguous config object.

The effective precedence displayed by the frontend is:

`CLASSROOM > SECTION > GRADE > STAGE > TERM`

This order is descriptive only. The frontend consumes the backend-selected `effectiveConfig` and does not recompute the winner.

Affected lesson-plan and attendance utilities gain stage-aware config types. Any consumer that must display a published classroom schedule uses the effective dashboard result. A consumer that explicitly edits a config continues to request that exact scope.

### PR 2: Authoritative Timetable Generation

Suggested branch: `feat/timetable-authoritative-generation`

Add a typed adapter for:

```text
POST /academics/timetable/generate
{ timetableConfigId }
```

The generation dialog shows:

- Config name and scope.
- The number of classrooms in that scope when it can be derived from loaded structure data.
- A clear statement that generated entries are saved immediately by the backend.
- A confirmation action with loading, success, partial, and failure states.

The frontend does not create temporary entries, select teachers, assign rooms, run local generation, or perform a follow-up bulk save. After generation succeeds, it reloads config, periods, entries, publication readiness, validation, and conflicts from the backend.

The result view includes:

- `createdCount` and `existingCount`.
- `remainingDemandCount` and `complete`.
- Unresolved items grouped by classroom and subject.
- Human-readable handling for `missing_teacher_allocation`, `no_feasible_slot`, `existing_over_scheduled`, and `search_budget_exhausted`.
- A link or action that opens the timetable validation panel.

When `searchBudgetExhausted` is true, the UI does not claim that partial entries were generated. The local heuristic may remain temporarily as an isolated utility until deletion is safe, but no production UI invokes it.

### PR 3: Interval Conflict UX

Suggested branch: `fix/timetable-interval-conflict-ux`

Treat `GET /academics/timetable/conflicts` and `POST /academics/timetable/conflicts/check` as authoritative. Local conflict detection may provide immediate advisory feedback but must not label the timetable conflict-free or enable a protected operation by itself.

Create one conflict-normalization boundary that accepts persisted and proposed backend conflict DTOs. It resolves `periodId` against the loaded period map and produces display data containing:

- Conflict type and code.
- Day.
- Period ID.
- Period label when available.
- Start and end time when available.
- Affected entry IDs and proposed indexes.
- Classroom, teacher, or room resource ID.
- Backend message and severity.

If a period cannot be resolved, the UI shows the backend message without inventing `periodIndex: 0`. Grid highlighting uses entry IDs, proposed indexes, and resolved period IDs as available.

Conflict checks run before save and publish as they do today. Generation uses the backend generator and therefore does not need a separate client-side conflict check.

After a successful bulk save, the frontend reloads authoritative scope and term data instead of assuming that the bulk response contains every entry needed for later cross-config checks.

### PR 4: Room Scheduling Integrity UX

Suggested branch: `fix/timetable-room-integrity-ux`

Add a reusable room eligibility function using only data already available in the frontend:

- A room is disabled when `isActive` is false.
- A room is disabled when both capacities are known and room capacity is lower than classroom capacity.
- A room remains eligible when either capacity is unknown, matching backend policy.

Room choices are ordered with eligible recommendations first, then disabled rooms. Disabled choices include a textual reason such as “Inactive room” or “Capacity 20; classroom requires 30.” Color is supplementary and never the only status signal.

Automatic room suggestions only choose eligible rooms. The frontend does not claim to load default-room assignments because the current room adapter has no backend contract for them. The always-empty default-assignment path is removed from production recommendation behavior or explicitly isolated as unsupported compatibility code.

Add typed UI handling for:

- `academics.timetable.room_inactive`
- `academics.timetable.room_capacity_insufficient`
- `academics.rooms.scheduling_dependency`

Room update, deactivation, and deletion failures display the backend dependency operation and counts when present. Dialog input remains intact after a rejected save, and delete confirmation remains open after a rejected deletion.

### PR 5: Curriculum and Publication Diagnostics

Suggested branch: `fix/academics-integrity-diagnostics`

Add typed handling for:

- `academics.subject_allocation.subject_not_taught`
- `academics.subject_allocation.dependency_conflict`

On dependency conflict, preserve the unsaved allocation matrix and open a details dialog containing:

- Grade and subject identity, resolved to names when loaded data permits.
- Mutation type.
- Previous and proposed weekly hours.
- Teacher-allocation count.
- Draft timetable-entry count.
- Published timetable-entry count.
- Published timetable-config count.
- Trace ID when provided.

The dialog explains that dependencies must be removed or the relevant timetable must be unpublished before retrying. It does not offer backend mutations outside the current allocation task.

Publication diagnostics use `GET /academics/timetable/publication` as the source of truth for `canPublish` and `blockingReasons`. `GET /validate` and `GET /conflicts` provide detailed supporting records.

All publication reasons are normalized and grouped into:

- Configuration and academic context.
- Curriculum requirements.
- Teacher allocations.
- Weekly-hour completeness.
- Timetable conflicts.
- Room integrity.

Validation issues `room_not_found`, `room_inactive`, and `room_capacity_insufficient` are retained even when `summary.roomConflicts` is zero. The summary counter represents room time overlaps and must not be used as a proxy for all room validity failures.

The publish confirmation can open only when the latest publication response has `canPublish: true`, the authoritative conflict response is empty, and there are no frontend-unsaved changes. The backend publish request remains the final race-safe gate. After publishing, the frontend reloads authoritative state instead of locally forcing a config status.

## Component and Interaction Design

### Timetable Source Banner

Add a compact banner above the grid using existing alert, badge, button, and icon primitives. It communicates:

- Exact or inherited state.
- Source scope and localized source name.
- Published/read-only state.
- Override action when applicable.

The inherited state uses a Lucide lock icon and text; it does not rely on color. The override action is unavailable when permissions or term status forbid it, with the existing disabled-state explanation pattern.

### Generation Dialog

The dialog has a confirmation state and a result state. The confirmation state describes scope and persistence behavior. The result state uses a concise summary followed by grouped unresolved records. It does not expose implementation details such as search-node counts unless useful for an exhausted-budget diagnostic.

### Conflict Panel

Conflict rows show a semantic icon, conflict type, localized resource label, day, period label, and time range. On supported screen sizes, selecting a row focuses or highlights the corresponding grid cells. On mobile, conflicts use stacked cards rather than forcing the full grid into the viewport.

### Room Selector

The selector uses the existing input/select family. Disabled options include their reason in the option label and accessible description. Eligible recommendations may carry a “Recommended” badge but remain ordinary selectable rooms.

### Dependency Details Dialog

Curriculum and room dependency errors use focused dialogs with a summary, structured key-value details, trace ID, and a single close action. They do not discard form state or imply that the failed operation succeeded.

## Data Boundaries

Introduce focused modules rather than adding more responsibilities to the existing large timetable hook:

- Scope request construction and exact/effective state selection.
- Generation API contract and result presentation mapping.
- Conflict response normalization and period resolution.
- Room scheduling eligibility.
- Publication reason classification.
- Curriculum dependency-error normalization.

UI components consume normalized view models and do not parse raw API error shapes. API adapters expose backend DTOs and perform envelope normalization only. Hooks coordinate requests and state transitions. Pure functions own classification and mapping so they can be tested without rendering components.

## Error and State Handling

- Preserve backend `code`, `message`, `details`, and `traceId` through normalization.
- Use backend messages as safe fallbacks when a localized code is unavailable.
- Keep unsaved edits after rejected curriculum and room operations.
- Reload authoritative data after generation, bulk save, publish, unpublish, or any partially completed delete/save sequence.
- Ignore stale async responses by retaining the request-ID protection already used by timetable loading.
- Never convert an unknown conflict period into period zero.
- Never mark an inherited timetable editable without first creating an exact override config.

## Accessibility and Responsive Requirements

- Use the existing bilingual and RTL-aware component patterns.
- Ensure all dialog controls and conflict rows are keyboard accessible.
- Keep visible focus indicators.
- Use text and icons in addition to color for inherited, blocked, warning, and success states.
- Maintain at least 4.5:1 text contrast in light mode.
- Avoid hover transforms that shift layout.
- Verify layouts at 375, 768, 1024, and 1440 pixels.
- Use stacked cards or controlled horizontal scrolling for wide data on mobile.
- Respect reduced-motion preferences for any new status transition.

## Test Strategy

### PR 1

- Adapter tests for `STAGE` and `stageId` query/body parameters.
- Type and mapper tests for stage config source identity.
- Hook tests for exact, inherited, and unconfigured states.
- Component tests for read-only inherited display and override action.
- Regression tests for lesson-plan and attendance stage-aware resolution.

### PR 2

- Adapter test for `POST /academics/timetable/generate`.
- Hook tests for success, partial completion, missing teacher, no feasible slot, and search-budget exhaustion.
- Tests proving that generation does not create local temporary entries or invoke bulk save.
- Dialog tests for scope confirmation and grouped unresolved results.
- Reload-state test after successful generation.

### PR 3

- Pure mapper tests for persisted and proposed conflict DTOs.
- Tests for period-ID-to-label/time resolution.
- Regression test proving unresolved periods do not display as period zero.
- Grid and panel tests for conflict highlighting.
- Save-flow test proving backend conflict results remain authoritative.

### PR 4

- Pure eligibility tests for active state and nullable capacity combinations.
- Selector tests for enabled, disabled, ordered, and explained room options.
- Recommendation tests proving ineligible rooms are never selected.
- Error-normalization tests for timetable room and room dependency codes.
- Dialog-state tests proving rejected mutations preserve user input.

### PR 5

- Curriculum dependency-error normalization tests.
- Allocation workflow tests proving edits survive rejection.
- Publication-reason classification tests covering every known category and unknown-code fallback.
- Validation-summary tests for room-integrity issues when room conflict count is zero.
- Publication panel tests proving all blockers are shown.
- Publish-flow tests proving backend readiness and unsaved-state gates are enforced.

Each PR runs its affected test files during development. Before handoff, run lint, typecheck, and build. Ask the owner before running the complete `npm run test:run` suite. Apply `clean-code-guard` to every production-code change and `test-guard` to every test change during implementation.

## Acceptance Criteria

- A stage timetable config can be created, loaded, identified, and displayed.
- A classroom with no exact config displays its backend-selected effective published timetable.
- An inherited timetable cannot be edited until an exact override is created.
- Automatic generation invokes the backend endpoint for the entire config scope and reloads saved results.
- Every generation unresolved code has an actionable UI state.
- Backend interval conflicts show the correct period label/time or omit unavailable period metadata without inventing a value.
- Inactive and undersized rooms are visible but unselectable, with reasons.
- Room scheduling dependency errors preserve context and explain the rejection.
- Curriculum dependency errors preserve matrix edits and show dependency counts.
- Every publication blocking reason is visible and categorized.
- Room validity issues remain visible independently of room overlap-conflict counts.
- Lesson-plan, homework, and attendance timetable consumers remain compatible with effective stage-scoped schedules.
- No backend, deployment, permission, or unrelated architecture changes are included.

## Delivery Constraints

- One task equals one branch and one pull request.
- Do not work directly on `main`.
- Start each PR from the latest merged `origin/main`.
- Use normal commits and pushes only.
- Do not merge pull requests.
- Use existing components from `src/components/ui` for UI changes.
- Do not run the full test suite without owner approval.
