# Academic Content Contract Completion Spec

## Contract baseline

- Backend repository: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Audited backend revision: `f0521cb452b27e22313986408ed79957d76850e6`
- Frontend feature root: `src/features/academic-content/`
- Content types: `TEACHER_PREPARATION`, `WEEKLY_PLAN`, `GUARDIAN_WEEKLY_NOTE`, `SUBJECT_RESOURCE`, `ONLINE_SESSION`, and `GENERAL_RESOURCE`.

## Goal

Complete frontend coverage of the existing academic-content backend contract without changing backend endpoints, request shapes, response shapes, or business rules.

## Required behavior

1. All six specialized list pages expose applicable backend list filters while continuing to issue one main paginated list request instead of a detail request per row.
2. Every list page supports `sectionId` between grade and classroom. Stage changes clear grade, section, and classroom; grade changes clear section and classroom; section changes clear classroom.
3. `tag` is available on Teacher Preparations, Weekly Plans, Guardian Notes, Subject Resources, and Online Sessions. General Resources already supports it.
4. `teacherUserId` is available on Weekly Plans and Guardian Notes. The other applicable pages already support it.
5. Weekly Plans supports the backend `weeklyDateFrom` and `weeklyDateTo` filters as ordinary date inputs inside the existing filter panel. The values use `YYYY-MM-DD`, persist in the URL with the backend field names, and may be supplied independently. When both are supplied, From must not be after To. The backend overlap semantics remain authoritative: a plan matches when its week ends on or after From and starts on or before To.
6. Audience choices come from `allowedAudiences(type)`, not the global audience enum. Teacher Preparations and Guardian Notes remain fixed to their only valid audience.
7. Online Sessions keeps one paginated request. Because the backend filters only on `startAt`, the existing `today` preset is presented as “Starts today”; it does not promise to include sessions that started before the current day.
8. The frontend implements the notification-policy GET/PATCH contract, including all booleans and online-session reminder offsets.
9. Reminder offsets accept zero to five unique integer minute values, each from 5 through 10080, submitted in ascending order. Disabling reminders preserves saved offsets.
10. Notification settings are discoverable from an academic-content settings landing page alongside file policy and workflow policy.
11. Optional `blockingReasons[].details` are displayed safely when present. Primitive values and arrays of primitives render as key/value rows; unsupported nested values are omitted rather than dumped as raw JSON.
12. Existing type-specific detail forms, targets, files, links, tags, readiness, publications, revisions, lifecycle actions, and teacher-preparation approval workflow remain unchanged.

## UI constraints

- Use controls and layout components from `src/components/ui/`.
- Preserve English/Arabic translation parity and RTL behavior.
- Do not display raw internal IDs when a localized entity name is available.
- Do not invent global statistics from one results page.
- Keep active filters in the URL and reset pagination to page 1 when filters change.
- Preserve loading, empty, read-only, validation, success, and recoverable error states.

## Verification constraints

- Add focused model, component, service, hook, page, route, and translation tests.
- Use clean-code-guard after every production-code change.
- Use test-guard after every test-code change.
- Focused tests may run during implementation. Ask the owner before running the full test suite.
- Preserve unrelated dirty-worktree changes and stage only files belonging to the current task.
