# Remove Grades Rules Management Design

## Goal

Remove the grade-rules management UI while preserving effective-rule consumption used by the gradebook and Grades overview.

## Removed Surface

- Remove the navigation entry for `/grades/rules`.
- Remove `/grades/rules`, `/grades/rules/new`, and `/grades/rules/:ruleId` by deleting their App Router pages.
- Remove the legacy `/academics/grades/rules` redirect.
- Remove `src/features/grades/rules`, including its list, editor, inspector, services, utilities, types, and tests.
- Remove the superseded grade-rules management design and implementation documents.

Deleted routes will use the application's normal not-found behavior. No replacement redirect is introduced.

## Preserved Behavior

The Grades overview and gradebook continue consuming `GET /grades/rules/effective` through their existing shared types, mapper, and overview service. Backend/API reference documentation remains because the API and its non-management consumers are not being removed.

## Verification

- Search production source for references to the deleted management feature and routes.
- Run type checking and relevant navigation/configuration tests.
- Run Grades overview and gradebook tests that cover effective-rule consumption.
- Confirm unrelated working-tree changes remain untouched.
