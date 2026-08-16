# Settings / IAM / Health

This documentation explains the currently implemented backend logic for Settings, IAM, and Health.

It is based on the actual code structure:

- `src/modules/settings/**`
- `src/modules/iam/**`
- `src/modules/health/**`
- `src/common/guards/**`
- `src/common/context/**`
- `prisma/schema.prisma`
- `prisma/seeds/01-permissions.seed.ts`
- `prisma/seeds/02-system-roles.seed.ts`
- relevant unit/e2e/security tests

## Reading Order

1. `OVERVIEW.md`
2. `IAM_AUTH_SESSIONS_SCOPE.md`
3. `SETTINGS_OVERVIEW.md`
4. `SETTINGS_ROLES_PERMISSIONS_USERS.md`
5. `SETTINGS_LOGIN_IDENTITY_CREDENTIALS.md`
6. `SETTINGS_EMAIL.md`
7. `HEALTH_READINESS.md`
8. `API_REFERENCE.md`
9. `REQUEST_RESPONSE_SHAPES.md`
10. `SECURITY_TENANCY_PERMISSIONS.md`
11. `TESTING_GUIDE.md`
12. `DEFERRED_AND_NON_GOALS.md`

## Base URL

All routes are served under the global prefix:

```http
/api/v1
```

Examples in this package assume:

```http
@baseUrl = http://localhost:3000/api/v1
```
