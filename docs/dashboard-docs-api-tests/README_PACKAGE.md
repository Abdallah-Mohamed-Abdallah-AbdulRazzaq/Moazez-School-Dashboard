# Dashboard Documentation Package

This package contains proposed documentation and REST Client API tests for the Moazez Backend Dashboard module.

It is generated as standalone files for review and local use. It does not modify the GitHub repository and does not claim that any test command was executed while creating this package.

## Included files

- `docs/dashboard/README.md`
- `docs/dashboard/API_REFERENCE.md`
- `docs/dashboard/LOGIC_AND_AGGREGATION.md`
- `docs/dashboard/SECURITY_AND_TENANCY.md`
- `docs/dashboard/SUMMARY.md`
- `docs/dashboard/ALERTS.md`
- `docs/dashboard/ACTIVITY_FEED.md`
- `docs/dashboard/DEFERRED_AND_NON_GOALS.md`
- `docs/dashboard/TESTING_GUIDE.md`
- `docs/dashboard/API_TESTS.http`
- `MANIFEST.md`

## How to use

1. Review the markdown files.
2. Copy `docs/dashboard` into the repository if the content is approved.
3. Open `API_TESTS.http` in a REST Client compatible editor.
4. Replace placeholder tokens and values.
5. Run the requests against a locally running backend.

## Important runtime assumptions

- The backend runs under the global prefix `/api/v1`.
- Dashboard endpoints require a valid Bearer token.
- The token must belong to a user with an active school membership.
- Each endpoint also requires its specific dashboard permission.
