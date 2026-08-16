# Errors, Accepted Decisions, and Non-Goals

## Common response expectations

The feature family follows the project-wide error envelope and security conventions.

Typical HTTP behavior:

- `401 Unauthorized` for unauthenticated requests.
- `403 Forbidden` for authenticated actors without permission or app-role authority.
- `404 Not Found` for resources hidden by school scope, ownership, or app-facing safe-not-found rules.
- `409 Conflict` for lifecycle conflicts such as locked assessment, closed term, invalid assignment/submission state, or unsafe mutation attempts.
- `422 Unprocessable Entity` for validation/domain input errors where applicable.

Exact error codes are implementation-specific and should be read from the corresponding domain exception files and tests before documenting a public client contract.

## Accepted backend decisions

The following are intentional and should not be treated as defects:

- Direct score-only `GradeItem` write remains Dashboard-only for V1.
- Teacher App grade writes remain homework/review/sync based, not direct score-only item writes.
- Teacher App full assessment authoring is not accepted V1 scope.
- Parent App homework remains read-only.
- Parent App homework submit is not implemented.
- Backend-native route naming is accepted; no ADR-only aliases are required.
- Sprint 23E was skipped by accepted Sprint 23D decision.
- Sprint 23G optional integrations are deferred.

## Explicit non-goals

Not implemented in accepted V1:

- Teacher App direct score-only grade item entry.
- Teacher App full assessment authoring.
- Parent homework submit.
- Homework/Grades notifications.
- Homework/Grades XP side effects.
- Homework/Grades reward side effects.
- Grade exports.
- Advanced analytics builder.
- New mobile grade write surfaces.
- Route renames solely to match ADR phrasing.
- ADR-only aliases.
- New schema/migration changes for Sprint 23H.

## Future-scope trigger notes

If product reopens any deferred scope, create a new decision audit and security plan covering:

- teacher ownership.
- parent authority.
- student ownership.
- cross-school isolation.
- closed-term protections.
- locked-assessment protections.
- notification visibility side effects.
- audit logging.
- no-leak requirements.
