# Security and Tenancy Boundaries

## New fields no-leak rule

The new response fields must expose only safe dashboard state:

- booleans
- counts
- reason codes
- safe state strings
- safe blocker messages
- policy booleans and policy source
- linked applicant document id/status only for school-side diagnostic use

They must not expose:

- `schoolId`
- `organizationId`
- `applicantUserId`
- applicant request id
- required document id
- membership id
- role id
- actor id
- password or credential fields
- audit internals
- storage bucket/object/provider internals
- signed URLs
- raw Prisma enum names

## Applicant boundary

Applicant Portal remains separated from school-side Admissions Dashboard APIs.

Applicant users cannot access:

- school-side application list/detail
- school-side document list/review routes
- workflow policy routes
- guardians management routes

Applicant Portal responses do not receive `documentsSummary`, `dashboardState`, or school-side document review diagnostics.

## School tenancy

All school-side Admissions routes are school-scoped through existing auth/scope/permission guards and Prisma school-scope behavior.

New policy rows are school-scoped and must not cross schools. A policy override in School A must not affect School B application readiness.

## Permissions

Admissions application routes:

- view: `admissions.applications.view`
- manage: `admissions.applications.manage`

Admissions document routes:

- view: `admissions.documents.view`
- manage/review: `admissions.documents.manage`

Workflow policy:

- GET: `admissions.applications.view`
- PATCH: `admissions.applications.manage`

Guardians:

- view: `students.guardians.view`
- manage/account link: `students.guardians.manage`

## Audit boundaries

Workflow policy PATCH writes an audit log with safe before/after policy fields only. The public policy response does not expose audit internals.
