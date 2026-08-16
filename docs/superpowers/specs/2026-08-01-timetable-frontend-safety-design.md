# Timetable Frontend Safety Design

**Backend authority:** `Moazez-Backend` commit `d86b8a13a752da66528a90e72563e8e464819f8e`

## Goal

Make the `sis-dashboard` timetable workflow safe and contract-accurate without
changing the backend. The frontend must avoid requests that the current API
cannot safely scope or represent, prevent silent data loss, and display backend
validation results accurately.

## Scope

This is a frontend-only change. It covers the timetable hook, API contracts and
normalizers, timetable configuration dialogs, feedback, and focused tests.

It does not alter backend publication enforcement or make the non-transactional
delete-plus-bulk-save API atomic. The UI instead prevents avoidable unsafe
requests and retains backend refresh/reconciliation after mutations.

## Workflow Safety

### Scope-aware unpublish

The backend unpublish DTO accepts a term with optional grade and classroom IDs;
it has no `sectionId`. A section config is stored under its parent grade, so an
unpublish request from a section scope could unpublish the grade.

The frontend will disable Unpublish when the resolved timetable scope is
`SECTION`. Its explanation states that the current API cannot unpublish only a
section. Term, grade, and classroom scopes retain their existing unpublish
workflow.

### Draft mapping, conflicts, and save

Before save or publish, draft entries are converted to backend entries. If any
entry lacks a resolvable classroom, instructional period, or teacher, the
operation stops before it sends a mutation. The error identifies the invalid
slots. The operation must never submit only the valid subset and report a
successful partial save.

The proposed-conflict endpoint receives only a term and proposed items. It has
no delete or replacement IDs, so it still sees persisted entries pending
deletion. The frontend constructs the final proposed set before its preflight
request, but does not assume that omitting an entry from that set removes it
from backend conflict calculation.

The response is ignored only when it identifies every contributing persisted
entry and all of those IDs are pending deletion. A conflict involving a
surviving entry or duplicate proposed slots remains blocking. If the verified
response DTO does not provide the complete contributing-entry IDs, the frontend
does not suppress the conflict: the user must complete the deletion and
authoritative refresh before saving its replacement.

Deletes happen only after the preflight passes. Once any delete succeeds, the
frontend refreshes authoritative state in both the success and failure paths,
never restores deleted entries optimistically, and reports that part of the
change may already have been applied if a later mutation fails.

### Publish preflight

`GET /validate` is term/grade/classroom scoped, not timetable-config scoped.
It is advisory input for allocation and expected-hours data; it is never treated
as authoritative validation of the selected config. The frontend obtains the
complete, unfiltered entry list for the exact `timetableConfigId`, excludes
cancelled entries, and calculates scheduled hours only from those entries.
For section configs it also restricts relevant validation rows to classrooms in
the selected section. Entries owned by another config in the same term cannot
make the selected config publishable or invalid.

The confirmation is bound to an immutable draft fingerprint containing the
config ID, selected scope, active days, instructional periods, mapped entries,
and pending deletion IDs. Any change closes or invalidates the confirmation.
One validation request per confirmation is valid only while that fingerprint is
unchanged. Publication readiness remains fetched from the backend immediately
before publishing, and the post-mutation refresh remains a resilience fallback.

## Contract Fidelity and Feedback

The frontend models validation, conflict, publication, and mutation responses
to their actual backend DTOs. It uses source-aware pure normalizers for
completeness validation, proposed conflict checks, persisted/computed conflicts,
and publication readiness before mapping them to shared UI buckets. This
preserves teacher, classroom, room, duplicate, allocation, and weekly-hours
categories; unknown codes remain visible as unknown rather than being silently
mislabelled as teacher conflicts.

The API adapter returns typed publish and unpublish responses. UI feedback uses
those results where available and retains existing refetches to reconcile
server state.

The bulk-save and proposed-conflict DTOs accept between 1 and 1,000 mapped
items. The frontend checks the final mapped payload for both operations, not the
raw grid-cell count. A payload over 1,000 is rejected with an actionable error.
When all entries are intentionally deleted, the frontend performs the explicit
deletions, skips bulk save and conflict check with an empty `items` array, and
refreshes authoritative state.

Errors are distinguished as:

- invalid or unmappable draft data;
- client-detected conflict;
- backend validation or publication-readiness failure; and
- unsupported section-level unpublish.

## Configuration Safety

Immediately before a config or period mutation, the frontend loads all entries
for the exact `timetableConfigId` with no classroom, teacher, subject, room,
day, or status filter. It merges those persisted entries with unsaved drafts and
pending deletions and ignores cancelled entries. It must not use the visible
grid, a classroom-filtered dashboard response, or only local edits as the
complete dataset.

Changing active days is blocked if that complete dataset contains entries on a
day being removed. Users must move or delete those entries first, preventing
them from being hidden from the timetable grid and later rejected by publication
checks.

Changing a period to non-instructional is blocked while timetable entries use
that period. This prevents a formerly valid entry from being omitted by the
instructional-period save mapper.

These checks are focused on the timetable entries governed by the relevant
configuration. No unrelated configuration refactor is included.

## Architecture

Existing boundaries remain in place:

1. API types mirror backend DTOs and retain each response source's
   discriminator.
2. The API adapter owns HTTP paths, parameters, and typed responses.
3. Source-aware pure normalizers map backend validation, proposed conflicts,
   persisted conflicts, and publication readiness to UI buckets.
4. `useTimetableData` owns scope-aware action guards, draft conversion,
   client-conflict checking, mutations, and reconciliation.
5. Timetable configuration dialogs own pre-mutation safety checks and explain
   blocked changes.
6. View components own the publish-confirmation fingerprint lifecycle and render
   action availability and feedback; they do not invent business rules.

## Testing and Verification

Regression tests cover:

- disabled Unpublish for section scope (term, grade, and classroom scopes
  retain the existing workflow);
- no save or publish request when any draft entry cannot map to API data;
- a conflict caused exclusively by known pending deletions is ignored only when
  every contributing persisted entry ID is present; mixed and duplicate-proposed
  conflicts remain blocking;
- exact-config entries are required for publish completeness; entries from
  another config cannot make it publishable;
- confirmation is invalidated after its draft fingerprint changes;
- source-specific conflict and validation responses normalize to correct UI
  categories;
- blocked removal of active days and conversion of used periods to
  non-instructional, including entries in a non-visible classroom;
- blocked mapped save and conflict-check payloads outside the 1..1,000 range;
- deletion-only save skips the empty bulk request; and
- first deletion success followed by bulk-save failure refreshes authoritative
  state and reports a partial mutation.

Verification runs the timetable test suite, TypeScript checking, lint for
touched files, and the production build.

## Non-goals

- Changing `Moazez-Backend` contracts or adding endpoints.
- Claiming client-side atomicity for backend mutations.
- Enabling section unpublish through a grade-wide destructive action.
- Refactoring unrelated lesson-plan, navigation, teacher, or profile-correction
  features.
