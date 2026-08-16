# Dashboard Testing Guide

## Purpose

This guide documents the recommended verification approach for the Dashboard foundation. It does not claim that these commands were run while generating this documentation package.

## Test categories

Dashboard coverage is expected across:

| Category | Purpose |
| --- | --- |
| Unit tests | Presenter, use-case, sorting, filter, and normalization behavior. |
| E2E tests | HTTP contract behavior for summary, alerts, and activity feed. |
| Security tests | Permissions, tenancy, route inventory, and role boundary protection. |
| Build checks | TypeScript and Nest compile checks. |
| Prisma checks | Prisma schema validation and generated client compatibility. |

## Relevant package scripts

Expected scripts from the Dashboard closeout lineage:

```bash
npm run test:e2e:sprint16a
npm run test:e2e:sprint16b
npm run test:e2e:sprint16c
npm run verify:sprint16a
npm run verify:sprint16b
npm run verify:sprint16c
npm run test:security
```

## Recommended local verification sequence

Use this after applying documentation or after changing Dashboard code:

```bash
npm run db:migrate
npm run seed
npm run build
npm run test -- --runInBand src/modules/dashboard/tests
npm run test:e2e:sprint16a
npm run test:e2e:sprint16b
npm run test:e2e:sprint16c
npm run test:security -- --runInBand
```

For the full Dashboard closeout-style check, prefer:

```bash
npm run verify:sprint16c
```

## Summary endpoint test expectations

Verify:

- `GET /api/v1/dashboard/summary` requires authentication.
- The caller must have active school membership.
- The caller must have `dashboard.summary.view`.
- Response contains `generatedAt`, `school`, `academicContext`, `cards`, `alertsPreview`, and `deferred`.
- Empty schools return stable zero counts and valid shape.
- Response does not leak raw tenant identifiers or raw Prisma payloads.
- Cross-school data does not appear in another school's summary.

## Alerts endpoint test expectations

Verify:

- `GET /api/v1/dashboard/alerts` requires `dashboard.alerts.view`.
- `source`, `severity`, `limit`, and `includeZeroCount` are validated.
- Zero-count alerts are omitted by default.
- `includeZeroCount=true` includes zero-count definitions.
- Sorting is deterministic by severity, source, and key.
- Summary counts are derived from returned alerts.
- No alert lifecycle routes exist.
- Cross-school alert signals do not leak.

## Activity feed endpoint test expectations

Verify:

- `GET /api/v1/dashboard/activity-feed` requires `dashboard.activity_feed.view`.
- The repository filters `AuditLog.schoolId` explicitly.
- Only successful audit records are returned.
- Unsupported modules are excluded.
- `source`, `eventType`, `actorType`, `dateFrom`, `dateTo`, `limit`, and `cursor` are validated.
- Invalid cursor returns a validation error.
- `dateFrom > dateTo` returns a validation error.
- Pagination returns `hasMore` and `nextCursor` when appropriate.
- Response does not expose raw audit payloads.
- No read/pin/realtime lifecycle routes exist.

## Security and tenancy tests

Security tests should protect:

- Missing token is rejected.
- Missing school scope is rejected.
- Missing permission is rejected.
- Teacher, parent, and student default roles do not get Dashboard permissions unless explicitly changed in a future sprint.
- School A cannot see School B summary, alerts, or activity feed records.
- Dashboard route inventory remains within the three implemented GET routes.

## Manual REST testing

Use `docs/dashboard/API_TESTS.http` with a valid school-scoped admin token.

Minimum manual smoke test:

1. Login as a school admin user.
2. Copy `accessToken` into `@accessToken`.
3. Call `GET /dashboard/summary`.
4. Call `GET /dashboard/alerts`.
5. Call `GET /dashboard/activity-feed`.
6. Verify no response exposes raw `schoolId`, `organizationId`, raw audit `before/after`, token, or password fields.

## Documentation-only changes

If only documentation files are changed, a minimum safe local check is:

```bash
git diff --check
```

For repository confidence, run the full Dashboard verification command before merging documentation into the project.
