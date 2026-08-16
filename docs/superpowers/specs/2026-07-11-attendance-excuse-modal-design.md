# Attendance Excuse Modal Contract and UX Design

## Goal

Align the create and edit excuse-request modal with the Moazez backend contract, eliminate avoidable requests, and improve form clarity, accessibility, and error recovery without changing unrelated attendance behavior.

## Backend Contract

Create uses `POST /attendance/excuse-requests` with:

- `academicYearId`, `termId`, and `studentId`
- `type`, `dateFrom`, and `dateTo`
- `selectedPeriodKeys` for late and early-leave requests
- `lateMinutes` or `earlyLeaveMinutes` when required by the selected type
- nullable, trimmed `reasonAr` and `reasonEn`

Update uses `PATCH /attendance/excuse-requests/:id`. It does not accept academic context or `studentId`, so the student is immutable in edit mode. Scope fields are not part of either mutation contract.

Attachments are linked separately through `POST /attendance/excuse-requests/:id/attachments` with file IDs. Edit mode must link only newly uploaded files rather than reposting existing attachments.

The backend requires positive whole minutes for `LATE` and `EARLY_LEAVE`, at least one stable period key for those types, ordered dates within the active term, and a writable term.

## Scope and Student Selection

Scope is transient UI context, not excuse-request data.

In create mode, the user explicitly selects an attendance hierarchy scope. Once the required hierarchy IDs are complete, the modal queries `GET /attendance/roll-call/roster` to locate the student. The selected scope may also be used to resolve the applicable policy and timetable configuration. The modal does not automatically treat its initial state as an intentional school-wide selection, preventing an immediate full-school roster request.

In edit mode, the backend response does not provide the student's enrollment hierarchy and the update contract does not permit changing the student. The modal therefore shows a read-only student summary and makes no roster request. It must not fabricate a `SCHOOL` scope for returned excuse requests.

If an edit changes to a type that requires timetable periods and the required hierarchy cannot be derived, the UI asks for attendance context specifically for policy/timetable resolution. That context does not make the student editable. If roster verification is necessary, it occurs only after explicit context selection and confirms that the existing student belongs to the chosen scope.

### Hierarchy Cascade

The selected target scope type remains stable while its hierarchy is completed. For example, choosing `CLASSROOM` and then selecting a stage must not change the target type to `STAGE` or hide the remaining grade, section, and classroom controls.

The cascade follows these rules:

- Changing scope type clears every hierarchy ID and the selected student.
- Changing stage clears grade, section, classroom, and student.
- Changing grade preserves stage and clears section, classroom, and student.
- Changing section preserves stage and grade and clears classroom and student.
- Changing classroom preserves all ancestors and clears the previous student.
- Grade options are restricted to the selected stage.
- Section options are restricted to the selected grade.
- Classroom options are restricted to the selected section.
- No roster, policy-resolution, or timetable request runs until every ID required by the selected target scope type is present.

The final request context includes the selected target scope type plus the complete ancestor chain. Readiness is determined by that target type, not inferred from whichever partial ID was selected most recently.

### Timetable Hierarchy Resolution

The backend timetable-config endpoint performs an exact scope lookup; it does not automatically inherit from parent scopes. The modal therefore resolves timetable configuration from the most specific applicable scope to the term default and stops after the first successful configuration:

- `CLASSROOM`: classroom, then section, then grade, then term
- `SECTION`: section, then grade, then term
- `GRADE`: grade, then term

`STAGE` and `SCHOOL` are not valid timetable-selection contexts. They may contain grades, sections, or classrooms with different overrides, so falling directly to the term configuration could show incorrect periods.

Request type drives context requirements:

- `ABSENCE` allows school, stage, grade, section, or classroom because it does not require period selection.
- `LATE` and `EARLY_LEAVE` require grade, section, or classroom context before the roster or timetable is loaded.
- The request type is presented before attendance context so users see only valid scope choices.
- Switching an in-progress create request from absence at school/stage scope to late/early leave preserves reason, dates, and attachments but clears the incompatible scope and student, focuses the context section, and explains why a grade-or-deeper selection is needed.
- Switching back to absence retains an already valid grade-or-deeper scope and student.

Every candidate includes `academicYearId` and `termId`. Section candidates include both `gradeId` and `sectionId`; classroom candidates include `gradeId`, `sectionId`, and `classroomId`. Although the backend can derive ancestors, sending the selected ancestor IDs lets it reject an inconsistent hierarchy instead of silently accepting a mismatched descendant.

Candidate requests are sequential and stop at the first match, avoiding parent requests when a specific configuration exists. Each exact candidate is cached independently. A backend `404` means “try the next parent”; other errors stop resolution and are shown to the user.

In edit mode, an existing late/early request retains its saved period keys and does not require hierarchy selection merely to edit reasons, dates, minutes, or attachments. Attendance context is requested only when the user changes the incident type to one requiring periods or explicitly changes period selection. That context must be grade-or-deeper and must verify that the immutable student belongs to its roster.

## Request Lifecycle

Academic policies are loaded once per academic year and term while the modal is open. Effective-policy selection and reason, attachment, date-range, and scope validation are derived locally from that cached policy set. Typing a reason or changing attachments must not trigger network requests.

The roster loads only in create mode, only after explicit complete scope selection, and only when academic context, date, or effective scope changes. Obsolete responses are ignored.

Timetable configuration loads only for `LATE` and `EARLY_LEAVE`. Results are cached by academic context and effective timetable scope. `ABSENCE` does not request timetable configuration. Obsolete responses are ignored.

Submitting performs local contract and policy validation, then calls the mutation endpoint once. The parent page must not repeat policy reads already completed by the modal. After a successful mutation, the existing list refresh remains the single source of refreshed table data.

## Form Behavior

Create and edit share one validation model and field layout. Differences are explicit:

- Create allows scope and student selection.
- Edit presents the student as immutable.
- Existing attachments remain visible in edit mode; only new files are linked.
- Changing request type clears fields that are invalid for the new type.
- `ABSENCE` uses the selected date range and no period keys or minute value.
- `LATE` and `EARLY_LEAVE` use one date, at least one stable period key, and the matching positive minute value.

Mutation payload builders send canonical backend names only. Compatibility aliases may remain response-only where needed, but create and update must not send duplicate `selectedPeriodIds` and `selectedPeriodKeys` fields.

## UI and Accessibility

The modal presents a clear sequence: attendance context, student, incident details, reason, then evidence. Create and edit use the same labels and validation placement.

Loading is localized to the affected control. Roster, policy, and timetable failures show actionable inline messages with retry behavior where a request can be repeated. The save action is disabled only for an active submission, unresolved required dependency, or blocking validation state.

Inputs retain visible labels, required status, error association, keyboard focus visibility, and suitable touch targets. Attachment removal buttons have accessible names. Responsive layout avoids horizontal scrolling and keeps the action area reachable on narrow screens. Motion remains subtle and respects reduced-motion preferences.

## Error Handling

Client validation prevents requests that the backend will reject. Backend validation and domain errors remain authoritative and are surfaced without replacing useful field-level errors. Request cancellation or stale-response guards prevent earlier roster, policy, or timetable responses from overwriting the latest selection.

Attachment linking is a second backend operation by contract. If creation succeeds but linking fails, the UI reports the partial outcome accurately and retains enough state for retry instead of claiming the complete operation failed.

## Verification

Focused tests will cover:

- Canonical create and update payloads against the backend DTO
- Positive whole-minute, date, period-key, and reason normalization rules
- No policy requests while typing or modifying attachments
- No roster request before explicit complete create scope selection
- No roster request in edit mode
- Stable target scope type throughout stage, grade, section, and classroom selection
- Correct descendant clearing and parent-based option filtering at every hierarchy level
- No dependent request from an incomplete hierarchy
- No timetable request for absence requests
- Correct most-specific-to-term timetable fallback for every supported attendance scope
- No stage-to-term or school-to-term shortcut for period-based requests
- Grade-or-deeper guidance for create-time late and early-leave requests
- No forced context reselection for an edit that can preserve saved period keys
- Complete ancestor IDs in section and classroom timetable queries
- No parent timetable request after a more specific configuration succeeds
- Timetable caching and stale-response handling
- Differential attachment linking in edit mode
- Create/edit rendering, validation, loading, error, keyboard, and accessible-name behavior

Relevant attendance tests, TypeScript checking, and linting for changed files will be run before completion.

## Non-Goals

This work does not change backend DTOs, attendance policy semantics, review/approval behavior, global academic context, or unrelated attendance and reinforcement pages.
