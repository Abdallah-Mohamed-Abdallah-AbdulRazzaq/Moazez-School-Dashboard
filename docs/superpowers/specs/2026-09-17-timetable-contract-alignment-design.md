# Timetable Contract Alignment Design

## Objective

Align the School Dashboard timetable feature with the current backend `main`
contract without changing the backend. The work covers every mismatch found in
the September 17, 2026 contract audit while preserving existing timetable and
attendance behavior.

Frontend baseline: `7ad6efd7ac791db59d95923841c6a461617110c8`.

Backend contract baseline: `1432f477b48c8740facc94207337447a1925696a`.

## Scope

The implementation will:

- Normalize inherited dashboard timetable data to the backend-selected
  effective configuration.
- Resolve inherited scope identities from the backend `scopeKey` contract.
- Align timetable navigation permission checks with the current dashboard API.
- Add handling for every current backend timetable error code.
- Make timetable config request types require `academicYearId`.
- Make delete adapter return types match the backend `{ ok: boolean }` response.
- Add focused regression coverage for each correction.

The implementation will not:

- Modify the backend repository or API contract.
- Redesign timetable UI components.
- Change exact-scope editing, publication, generation, or attendance semantics.
- Add a new runtime schema-validation library.
- Refactor unrelated timetable or permissions code.

## Architecture

Add a focused timetable contract-normalization service at the frontend API
boundary. It accepts a `TimetableDashboardItemDto` and produces the effective
inherited timetable view used by the page.

The service has two responsibilities:

1. Select only periods and entries whose `timetableConfigId` equals the
   dashboard item's `effectiveConfig.id`.
2. Resolve the effective config's scope ID from an explicit response field when
   one exists, otherwise from the backend `scopeKey` format.

The normalized result remains a query value with no UI state or side effects.
`useTimetableData` continues to own loading and React state, but it consumes the
normalized result instead of interpreting raw multi-config dashboard arrays.

The attendance resolver keeps its existing filter. Sharing the new helper with
attendance is optional only if it reduces code without altering attendance's
multi-classroom rules.

## Data Flow

For an inherited timetable load:

1. Request the exact config and classroom dashboard concurrently.
2. Resolve workspace mode using the existing exact/effective precedence.
3. When the mode is inherited, pass the selected dashboard item through the
   normalization service.
4. Store only normalized periods and entries in timetable state.
5. Build the resolved config and source banner from the normalized effective
   config identity.

Exact config mode continues to load periods and entries from the config-specific
endpoints and is unchanged.

## Scope Identity Contract

The backend returns `scopeKey` values in these forms:

- `term:<termId>`
- `stage:<stageId>`
- `grade:<gradeId>`
- `section:<sectionId>`
- `classroom:<classroomId>`

The frontend resolver will verify that the prefix agrees with `scopeType` and
return the identifier after the first colon. An explicit matching scope field
may be used first when present. A malformed or inconsistent key returns no
scope ID; timetable loading still succeeds and the source banner shows the
scope type without a scope name.

## Permissions

Use `academics.structure.view` for the timetable navigation item, matching the
page guard, timetable component, and current backend dashboard endpoints.
Mutation controls continue to require `academics.structure.manage`.

This design does not introduce or remove permission catalog entries. It only
aligns School Dashboard access decisions with the current backend controller.

## Error Handling

Add the two backend timetable errors currently missing from the frontend error
union and message map:

- `academics.timetable.room_inactive`
- `academics.timetable.room_capacity_insufficient`

They follow the existing localized timetable error path. Backend error details
remain available to conflict and validation presentation code.

No broad catch or silent fallback will be added. API failures continue to
propagate through the existing `ApiError` handling.

## Type Alignment

`academicYearId` becomes required in `FetchTimetableConfigParams` and
`FetchTimetableConfigsParams`. Any legacy overload that can produce a request
without it will be removed or narrowed so invalid requests cannot compile.

Timetable delete responses will use a small `{ ok: boolean }` contract type.
Existing callers may ignore the returned value because non-successful deletes
are represented by rejected requests, but adapter declarations will no longer
claim that the backend returns `void`.

Dashboard config summary types will stop implying that grade, section, and
classroom IDs are supplied directly when the backend provides them only through
`scopeKey`.

## Boundary Behavior

- No effective config: preserve the current unconfigured state.
- Effective config present: show only its periods and entries.
- Other matching draft or published configs: exclude their records.
- Empty filtered records: show a valid empty inherited timetable.
- Malformed scope identity: omit only the source name; do not fail the page.
- Exact scope config: preserve current editable behavior.

## Testing

Add focused tests for:

- Effective-config normalization with mixed configuration records.
- Exclusion of unrelated draft and published periods and entries.
- Scope ID resolution for term, stage, grade, section, and classroom keys.
- Malformed and mismatched scope keys.
- Inherited `useTimetableData` state using only normalized data.
- Timetable navigation visibility with `academics.structure.view`.
- Localized handling of both room errors.
- Delete adapters returning `{ ok: true }`.
- Config service requests requiring and sending `academicYearId`.

The implementation will run affected timetable, attendance, permissions, and
navigation tests first, followed by lint, typecheck, and production build. The
full test suite requires explicit owner approval before execution.

## Acceptance Criteria

- An inherited grid cannot display periods or entries from a non-effective
  timetable config.
- Grade and section inherited-source banners can resolve their display names
  from the current backend response.
- Timetable navigation, page guards, and backend dashboard APIs use compatible
  permission requirements.
- Every backend timetable domain error code has a frontend mapping.
- Frontend request and delete response types match the backend DTOs.
- Focused tests, lint, typecheck, and build pass.
- No backend files or unrelated frontend files are changed.
