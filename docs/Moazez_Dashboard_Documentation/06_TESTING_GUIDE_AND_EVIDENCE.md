# Dashboard Testing Guide and Evidence

## 1. Evidence disclaimer

This documentation review did not execute tests locally. The counts below are the fresh results recorded by the repository's final Dashboard V1 closeout on `2026-07-15` at accepted runtime baseline `d72b0f5e9f786e3f39a6526a469ff9bf0fd287b7`.

## 2. Repository-recorded closeout results

| Validation | Recorded result |
| --- | --- |
| Migration governance | 39 checks passed |
| Migration structure check | passed |
| Prisma validate | passed |
| Prisma generate | passed, Prisma Client 6.19.3 |
| TypeScript build no-emit | passed |
| Nest build | passed |
| Dashboard unit discovery | 57 suites, 463 tests passed |
| Dashboard E2E discovery | 10 files, 89 tests passed |
| Dashboard security discovery | 10 files, 50 tests passed |

## 3. E2E suites recorded by closeout

1. `test/e2e/dashboard-activity-feed-foundation.e2e-spec.ts`
2. `test/e2e/dashboard-alerts-foundation.e2e-spec.ts`
3. `test/e2e/dashboard-analytics-catalog-foundation.e2e-spec.ts`
4. `test/e2e/dashboard-analytics-data-pack-foundation.e2e-spec.ts`
5. `test/e2e/dashboard-command-center-foundation.e2e-spec.ts`
6. `test/e2e/dashboard-light-mode-dropdown-foundation.e2e-spec.ts`
7. `test/e2e/dashboard-module-pages-foundation.e2e-spec.ts`
8. `test/e2e/dashboard-summary-foundation.e2e-spec.ts`
9. `test/e2e/dashboard-todos-crud.e2e-spec.ts`
10. `test/e2e/dashboard-widgets-foundation.e2e-spec.ts`

## 4. Security suite areas

The ten `test/security/tenancy.dashboard*.spec.ts` suites cover the main surfaces, including:

- Summary school isolation
- Alerts school isolation
- Activity Feed explicit AuditLog school filtering
- Command Center composed-source isolation
- Widget source isolation
- Module Page isolation
- Analytics hierarchy and school isolation
- Light Mode planner isolation
- Todo school and owner isolation
- fixed permission isolation from source endpoints

## 5. Important behaviors to regression-test

### Authentication and authorization

- no token -> 401
- wrong permission -> 403
- teacher/parent/student default role -> 403
- Dashboard permission does not grant source route access
- Todo route rejects non-management actor posture

### Tenancy

- School A cannot read School B Summary/Alerts/Analytics data
- foreign hierarchy UUID returns 404
- Activity Feed never returns foreign-school AuditLog rows
- Todo cross-school and same-school cross-owner attempts return 404

### Summary and alerts

- active academic context selection
- today boundaries in school timezone
- last-7/last-30 windows
- zero-count alert exclusion and inclusion
- severity/source sorting

### Activity Feed

- approved modules only
- SUCCESS outcomes only
- IAM/auth normalization to settings
- stable cursor order
- malformed cursor rejection
- no raw AuditLog metadata

### Analytics

- each chart's supported filters
- custom date bounds required and validated
- period-range resolution
- hierarchy parent-child mismatch
- zero denominator behavior
- bucket boundaries for day/week/month
- DST transitions and negative-offset timezones
- definition-only chart safe empty state

### Widgets and composition

- filters happen before repository loading
- dependency deduplication
- unknown key fails early
- gradebook widget unavailable without academic context
- calendar widget strips IDs and notes
- maximum per-source planner preview limits

### Todos

- server-controlled school/owner
- title and notes limits
- status/completedAt transition
- sort order validation
- soft-delete exclusion
- cross-owner not-found

## 6. Suggested local verification commands

Run from a clean repository with approved environment configuration:

```bash
npm run test:migration-governance
npm run db:migrations:check
npx prisma validate
npx prisma generate
npx tsc -p tsconfig.build.json --noEmit
npm run build
npx jest dashboard --runInBand
```

For Dashboard E2E/security, use the repository's current Jest configuration and current file discovery. The closeout notes that filenames end in `.e2e-spec.ts`, so a stale `dashboard*.spec.ts` glob discovers zero E2E files.

## 7. HTTP smoke-test workflow

Use `dashboard-api-tests.http` in this package.

Recommended order:

1. set `baseUrl` and `accessToken`
2. call Summary
3. call Alerts with zero-count inclusion
4. call Command Center
5. list Widgets and Module Pages
6. inspect Analytics catalog
7. call representative computed charts
8. call each definition-only chart and verify safe not-implemented behavior
9. call Light Mode
10. create, update, list, and delete a Todo
11. run negative permission, validation, and unknown-key tests
