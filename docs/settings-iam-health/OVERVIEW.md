# Overview

## Runtime Module Wiring

The root application imports all three modules:

- `HealthModule`
- `IamModule`
- `SettingsModule`

`SettingsModule` composes:

- `BrandingModule`
- `RolesModule`
- `PermissionsModule`
- `UsersModule`
- `SecurityModule`
- `LoginIdentityModule`
- `EmailModule`
- `OverviewModule`

`IamModule` currently exports the `AuthModule`.

`HealthModule` imports infrastructure dependencies used for readiness checks:

- queue/BullMQ
- storage
- Firebase Admin push provider
- email secret crypto

## Global Request Pipeline

The app uses a global prefix of `/api/v1` and global validation with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- `enableImplicitConversion: false`

The application-level guard stack is registered globally in this order:

1. `JwtAuthGuard`
2. `ScopeResolverGuard`
3. `PermissionsGuard`

This means almost every non-public route follows this security flow:

```text
Bearer access token -> session check -> active user check -> active membership/school scope -> permission check -> controller -> use-case
```

Public routes are marked with `@PublicRoute()`.

## Source-of-Truth Summary

| Area | Source of truth |
| --- | --- |
| Login/session/password auth | `src/modules/iam/auth/**` |
| Roles/permissions/users | `src/modules/settings/roles`, `permissions`, `users` |
| Login identity policy | `src/modules/settings/login-identity/**` |
| Credential provisioning | `src/modules/settings/users/credentials/**` |
| School profile/branding | `src/modules/settings/branding/**` |
| Security settings | `src/modules/settings/security/**` |
| Email provider/templates/delivery | `src/modules/settings/email/**` |
| Health readiness | `src/modules/health/**` |

## Implemented Feature Groups

### IAM

- Login using email/login identifier.
- Refresh token rotation.
- Current actor profile `/auth/me`.
- Logout/session revocation.
- Authenticated password change.
- Access token validation with backing session verification.
- Disabled/suspended user rejection at login, refresh, JWT auth, and scope resolution.

### Settings

- Settings overview metrics.
- Branding/school profile settings.
- Security settings storage.
- Roles and role permissions.
- Permission catalog read.
- School user invite/create/list/update/status/reset-password placeholder.
- Login identity settings and username availability.
- Credential status, direct credential generate/regenerate/set, and bulk credential preview/generate.
- School outbound email connection configuration and bounded test.
- School email templates, preview, update, reset.
- Credential delivery recipient preview and queued delivery creation.
- General email campaign preview, send, and history.
- Delivery batch and recipient monitoring/cancel.

### Health

- Public liveness/readiness endpoint.
- Database check.
- Redis/BullMQ check.
- Storage readiness check.
- Queue readiness summary.
- Email readiness summary.
- Push provider readiness summary.
- Sanitized error output.

## Important Boundary

Settings, IAM, and Health include some stored-only configuration fields. For example, 2FA and IP allowlist settings are stored in `settings/security`, but the current runtime does not enforce 2FA, password rotation, suspicious-login alerts, or IP allowlist checks. This is documented explicitly in `DEFERRED_AND_NON_GOALS.md`.
