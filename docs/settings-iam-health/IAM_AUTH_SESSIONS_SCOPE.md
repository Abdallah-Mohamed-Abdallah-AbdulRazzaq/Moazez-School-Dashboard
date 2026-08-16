# IAM Auth, Sessions, Scope, and Passwords

## Module

Runtime code:

```text
src/modules/iam/iam.module.ts
src/modules/iam/auth/**
src/common/guards/jwt-auth.guard.ts
src/common/guards/scope-resolver.guard.ts
src/common/guards/permissions.guard.ts
src/common/context/request-context.ts
```

`IamModule` imports and exports `AuthModule`. `AuthModule` registers:

- `AuthController`
- `AuthRepository`
- `PasswordService`
- `TokenService`
- `LoginUseCase`
- `RefreshUseCase`
- `MeUseCase`
- `LogoutUseCase`
- `ChangePasswordUseCase`

## Runtime Routes

| Method | Route | Public | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Yes | Exchange login identifier + password for access/refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | Yes | Rotate refresh token and issue new token pair. |
| `GET` | `/api/v1/auth/me` | No | Return authenticated actor and active membership. |
| `POST` | `/api/v1/auth/logout` | No | Revoke current session. |
| `POST` | `/api/v1/auth/change-password` | No | Change current user's password and revoke other sessions. |

## Login Flow

Request:

```json
{
  "email": "admin@moazez.dev",
  "password": "Admin123!"
}
```

The login identifier is trimmed and lowercased before lookup.

Flow:

1. Normalize login identifier.
2. Find user by `User.email`.
3. Reject if user does not exist or `passwordHash` is missing.
4. Verify password hash.
5. Reject non-`ACTIVE` users.
6. Issue access and refresh JWTs.
7. Store hashed refresh token in `Session`.
8. Update `lastLoginAt`.
9. Write login audit log.
10. Return token pair and safe user identity fields.

Response shape:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "admin@moazez.dev",
    "username": null,
    "loginEmail": "admin@moazez.dev",
    "contactEmail": null,
    "firstName": "Platform",
    "lastName": "Admin",
    "userType": "PLATFORM_USER",
    "mustChangePassword": false
  }
}
```

## Refresh Flow

Request:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Flow:

1. Verify refresh token signature and type.
2. Find session by token `sid`.
3. Reject unknown/revoked/expired sessions.
4. Hash submitted refresh token and compare to stored hash.
5. Load current user.
6. If user is no longer active, revoke all user sessions and reject.
7. Revoke old session.
8. Create new session and return new token pair.

This is refresh-token rotation. Reusing an old refresh token is treated as revoked/rotated behavior.

## `/auth/me`

Returns current user and active membership. It uses `RequestContext` populated by guards and reloads the user from the repository.

Typical response:

```json
{
  "id": "uuid",
  "email": "user@school.local",
  "username": "user.name",
  "loginEmail": "user@school.local",
  "contactEmail": "personal@example.com",
  "firstName": "User",
  "lastName": "Name",
  "userType": "TEACHER",
  "status": "ACTIVE",
  "mustChangePassword": false,
  "activeMembership": {
    "id": "membership-uuid",
    "organizationId": "organization-uuid",
    "schoolId": "school-uuid",
    "roleId": "role-uuid",
    "roleName": "Teacher",
    "permissions": ["attendance.sessions.view"]
  }
}
```

## Logout

`POST /auth/logout` revokes the current session using the access-token `sid` attached by `JwtAuthGuard`.

Response: `204 No Content`.

## Change Password

Request:

```json
{
  "currentPassword": "OldPassword!123",
  "newPassword": "NewPassword!456"
}
```

Flow:

1. Require authenticated actor.
2. Load user.
3. Require existing password hash.
4. Verify current password.
5. Validate new password policy.
6. Hash and store new password.
7. Set `mustChangePassword=false`.
8. Increment credential version.
9. Revoke other sessions except current session.
10. Audit `auth.password.change`.

Response:

```json
{
  "success": true,
  "mustChangePassword": false
}
```

## Guard Stack

### `JwtAuthGuard`

- Skips public routes.
- Extracts `Authorization: Bearer <token>`.
- Verifies access token.
- Loads backing session by `sid`.
- Rejects revoked session.
- Ensures session user id matches token subject.
- Reloads user.
- Rejects non-active user and revokes sessions.
- Writes actor to `RequestContext`.
- Attaches session id to request.

### `ScopeResolverGuard`

- Skips public routes.
- Reloads user.
- Rejects non-active user and revokes sessions.
- Uses the latest active membership.
- Allows platform users without school membership by loading platform super-admin permissions.
- Allows applicant users only on applicant-portal routes explicitly marked for applicant access.
- Throws scope missing for all other membership-less actors.

### `PermissionsGuard`

- Skips public routes.
- Reads required permission metadata.
- Checks active-membership permissions or platform permissions.
- Throws if required permissions are missing.

## Data Models

Core IAM models:

- `User`
- `Membership`
- `Role`
- `Permission`
- `RolePermission`
- `Session`
- `AuditLog`

Important fields:

- `User.email` is the login identifier.
- `User.username` is optional and used for school-owned login identity.
- `User.contactEmail` is personal/contact email.
- `User.passwordHash` is nullable until credential provisioning.
- `User.mustChangePassword` supports temporary credential flows.
- `User.credentialVersion` increments on password changes/provisioning.
- `Session.refreshTokenHash` stores only refresh token hash.
- `Membership` links user to organization/school/role/scope.

## Security Notes

- Passwords are never returned except one-time temporary password generation endpoints in Settings credential provisioning.
- Refresh tokens are stored as hashes only.
- Non-active users cannot continue using old access tokens because `JwtAuthGuard` reloads user state.
- Disabling a user through Settings revokes their active sessions.
