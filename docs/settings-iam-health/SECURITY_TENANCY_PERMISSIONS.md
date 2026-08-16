# Security, Tenancy, and Permissions

## Guard Chain

The application registers global guards in this order:

1. `JwtAuthGuard`
2. `ScopeResolverGuard`
3. `PermissionsGuard`

This means every protected request first proves token/session validity, then resolves school/platform scope, then checks route permissions.

## Public Routes

The following routes are public:

- `GET /api/v1/`
- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

Other IAM/Settings routes require bearer auth.

## School Scope For Settings

Settings use-cases call `requireSettingsScope()`.

This requires:

- authenticated actor
- active school membership
- organization id
- school id
- role id

Platform-only actors without active school membership cannot use school Settings routes unless the route has a separate platform-specific implementation.

## IAM Session Safety

### Login

Login normalizes the email/login identifier by trimming and lowercasing before lookup. Login fails when:

- user not found
- password hash missing
- password invalid
- user status is not `ACTIVE`

Login creates a session record and stores only refresh token hash.

### Refresh

Refresh verifies the refresh token, loads the session, rejects revoked/expired/mismatched tokens, reloads current user state, revokes sessions for inactive users, revokes the used session, and creates a new session.

### JWT Auth

Every protected request verifies:

- access token signature and type
- backing session exists
- session not revoked
- session user matches token subject
- user still exists
- user status is still active

A disabled/suspended user cannot continue using stale access tokens.

### User Status Changes

`PATCH /settings/users/:id/status` maps:

- `active` -> `UserStatus.ACTIVE`
- `inactive` -> `UserStatus.DISABLED`

When the resulting status is not active, all sessions for that user are revoked.

## Credential Safety

Direct credential endpoints:

- hash stored passwords
- return temporary plaintext passwords only once
- set `mustChangePassword` for generated temporary passwords
- revoke existing user sessions after credential change
- audit credential generation/set actions

Credential delivery endpoints:

- create delivery batches instead of returning temporary passwords directly
- generate pending temporary password inside worker
- store only encrypted pending credential metadata
- reuse pending credential on retry
- apply password only after SMTP send succeeds
- redact temporary password-like strings and emails in failure reasons

## Permission Catalog

Settings permissions currently include:

- `settings.overview.view`
- `settings.users.view`
- `settings.users.manage`
- `settings.roles.view`
- `settings.roles.manage`
- `settings.branding.view`
- `settings.branding.manage`
- `settings.permissions.view`
- `settings.security.view`
- `settings.security.manage`
- `settings.email.connection.view`
- `settings.email.connection.manage`
- `settings.email.templates.view`
- `settings.email.templates.manage`
- `settings.email.deliveries.view`
- `settings.email.deliveries.manage`
- `settings.email.campaigns.view`
- `settings.email.campaigns.manage`
- `settings.email.credential_deliveries.view`
- `settings.email.credential_deliveries.manage`

## Role Seed Behavior

System role behavior:

- `platform_super_admin` receives all permissions.
- `organization_admin` receives non-platform permissions.
- `school_admin` receives all school-level non-platform permissions.
- `teacher`, `parent`, and `student` do not receive Settings email/admin permissions by default.

## Email Permission Hardening

Email settings are protected by granular permissions, not broad `settings.security.*` permissions.

Examples:

- Reading email connection requires `settings.email.connection.view`.
- Updating/testing/activating email connection requires `settings.email.connection.manage`.
- Template preview uses `settings.email.templates.view`.
- Template update/reset uses `settings.email.templates.manage`.
- Credential delivery preview uses `settings.email.credential_deliveries.view`.
- Credential delivery create uses `settings.email.credential_deliveries.manage`.
- Delivery monitoring uses `settings.email.deliveries.view`.
- Delivery cancel uses `settings.email.deliveries.manage`.
- Campaign preview/list/detail uses `settings.email.campaigns.view`.
- Campaign create uses `settings.email.campaigns.manage`.

## No-Leak Rules

Responses should not expose:

- password hashes
- plaintext passwords except direct one-time generation responses
- refresh token hashes
- encrypted email passwords/API keys
- pending encrypted credential metadata
- storage provider secrets
- Firebase private keys
- raw stack traces
- database connection strings

Health output is sanitized. Email connection output exposes `hasPassword` and `hasApiKey` booleans only.

## Stored-Only Security Settings

The following are stored as configuration values but are not fully enforced runtime controls yet:

- 2FA enforcement
- password rotation enforcement
- suspicious login alert enforcement
- IP allowlist enforcement

They should be displayed as stored settings, not as fully enforced runtime policies.
