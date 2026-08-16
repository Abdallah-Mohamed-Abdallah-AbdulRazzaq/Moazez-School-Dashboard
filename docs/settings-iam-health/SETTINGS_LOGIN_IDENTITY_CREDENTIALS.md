# Settings Login Identity and Credential Provisioning

## Login Identity

The login identity subsystem separates school-owned login email from personal/contact email.

### Routes

```http
GET /api/v1/settings/login-identity
PUT /api/v1/settings/login-identity
GET /api/v1/settings/login-identity/preview?username=<username>
GET /api/v1/settings/users/usernames/available?username=<username>
```

Permissions:

| Route | Permission |
| --- | --- |
| get settings | `settings.users.view` |
| update settings | `settings.users.manage` |
| preview generated email | `settings.users.view` |
| username availability | `settings.users.view` |

### Update Login Identity Settings

```json
{
  "loginDomain": "demo-school.moazez.local",
  "usernameMinLength": 3,
  "usernameMaxLength": 32,
  "allowedCharacters": "lowercase letters, numbers, dots, underscores, and hyphens",
  "reservedUsernames": ["admin", "support", "principal"],
  "status": "active"
}
```

### Settings Response

```json
{
  "configured": true,
  "loginDomain": "demo-school.moazez.local",
  "usernameMinLength": 3,
  "usernameMaxLength": 32,
  "allowedCharacters": "lowercase letters, numbers, dots, underscores, and hyphens",
  "reservedUsernames": ["admin", "support", "principal"],
  "status": "active"
}
```

### Preview Generated Login Email

```http
GET /api/v1/settings/login-identity/preview?username=nour.ali
```

Response:

```json
{
  "username": "nour.ali",
  "loginEmail": "nour.ali@demo-school.moazez.local"
}
```

### Check Username Availability

```http
GET /api/v1/settings/users/usernames/available?username=nour.ali
```

Response:

```json
{
  "username": "nour.ali",
  "loginEmail": "nour.ali@demo-school.moazez.local",
  "available": true,
  "reason": null
}
```

Possible `reason` values:

- `username_invalid`
- `login_domain_missing`
- `login_email_taken`
- `reserved_username`

## Identity Resolution Rules For User Creation

When creating or inviting a user:

### Preferred school-owned identity path

```json
{
  "fullName": "Nour Ali",
  "username": "nour.ali",
  "contactEmail": "nour.parent@example.com",
  "roleId": "role-uuid"
}
```

Behavior:

1. Load current school login identity settings.
2. Require settings to exist and be active.
3. Validate username policy.
4. Build login email as `username@loginDomain`.
5. If `email` is also provided, it must equal the generated login email.
6. Reject if generated login email already exists.
7. Store generated login email in `User.email`.
8. Store personal email in `User.contactEmail`.

### Legacy email path

```json
{
  "fullName": "Nour Ali",
  "email": "nour@example.com",
  "contactEmail": "nour.parent@example.com",
  "roleId": "role-uuid"
}
```

Behavior:

1. Require `email` when no `username` is provided.
2. Normalize email.
3. Reject if email already exists.
4. Store email as `User.email`.
5. Store optional `contactEmail` separately.

## Credential Provisioning

The credential subsystem manages password readiness without exposing plaintext passwords except for explicit one-time temporary password generation responses.

### Routes

```http
GET  /api/v1/settings/users/credentials/status
POST /api/v1/settings/users/credentials/bulk-preview
POST /api/v1/settings/users/credentials/bulk-generate
POST /api/v1/settings/users/:userId/credentials/generate
POST /api/v1/settings/users/:userId/credentials/set
POST /api/v1/settings/users/:userId/credentials/regenerate
```

Permissions:

| Route | Permission |
| --- | --- |
| status | `settings.users.view` |
| bulk-preview | `settings.users.view` |
| bulk-generate | `settings.users.manage` |
| generate/set/regenerate | `settings.users.manage` |

### Credential Status Query

```http
GET /api/v1/settings/users/credentials/status?roleKey=teacher&credentialStatus=missing&page=1&limit=20
```

Supported filters:

- `roleKey`
- `userType`
- `credentialStatus`: `missing`, `set`, `temporary_or_must_change`, `must_change`
- `search`
- `page`, `limit`

### Credential Status Response

```json
{
  "items": [
    {
      "userId": "user-uuid",
      "fullName": "Nour Ali",
      "username": "nour.ali",
      "loginEmail": "nour.ali@demo-school.moazez.local",
      "contactEmail": "nour.parent@example.com",
      "userType": "teacher",
      "roleId": "role-uuid",
      "roleKey": "teacher",
      "roleName": "Teacher",
      "status": "missing",
      "hasPassword": false,
      "mustChangePassword": false,
      "passwordChangedAt": null,
      "passwordProvisionedAt": null,
      "credentialVersion": 0,
      "lastLoginAt": null,
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### Generate Temporary Password For One User

```http
POST /api/v1/settings/users/:userId/credentials/generate
```

Response:

```json
{
  "user": {
    "userId": "user-uuid",
    "fullName": "Nour Ali",
    "username": "nour.ali",
    "loginEmail": "nour.ali@demo-school.moazez.local",
    "contactEmail": "nour.parent@example.com",
    "userType": "teacher",
    "roleId": "role-uuid",
    "roleKey": "teacher",
    "roleName": "Teacher",
    "status": "temporary_or_must_change",
    "hasPassword": true,
    "mustChangePassword": true,
    "passwordProvisionedAt": "2026-06-25T10:00:00.000Z",
    "credentialVersion": 1,
    "lastLoginAt": null,
    "createdAt": "2026-06-25T09:00:00.000Z"
  },
  "temporaryPassword": "MZ-7KQ9-PL2R",
  "mustChangePassword": true,
  "generatedAt": "2026-06-25T10:00:00.000Z",
  "credentialVersion": 1
}
```

Behavior:

- Generates a temporary password.
- Hashes it before storage.
- Stores only the hash.
- Sets `mustChangePassword=true`.
- Sets `passwordProvisionedAt`.
- Revokes active sessions.
- Audits `iam.credentials.generate` or `iam.credentials.regenerate`.
- Returns plaintext temporary password once in this response only.

### Set User Password

```http
POST /api/v1/settings/users/:userId/credentials/set
```

Request:

```json
{
  "password": "S3curePass!2026",
  "forceResetOnLogin": true
}
```

Response:

```json
{
  "user": {
    "userId": "user-uuid",
    "fullName": "Nour Ali",
    "username": "nour.ali",
    "loginEmail": "nour.ali@demo-school.moazez.local",
    "contactEmail": "nour.parent@example.com",
    "userType": "teacher",
    "roleId": "role-uuid",
    "roleKey": "teacher",
    "roleName": "Teacher",
    "status": "must_change",
    "hasPassword": true,
    "mustChangePassword": true,
    "passwordChangedAt": null,
    "passwordProvisionedAt": "2026-06-25T10:00:00.000Z",
    "credentialVersion": 2,
    "lastLoginAt": null,
    "createdAt": "2026-06-25T09:00:00.000Z"
  },
  "mustChangePassword": true,
  "updatedAt": "2026-06-25T10:00:00.000Z",
  "credentialVersion": 2
}
```

Behavior:

- Validates admin-provided password against policy.
- Hashes and stores password.
- Sets `mustChangePassword` from `forceResetOnLogin` defaulting to true.
- Revokes active sessions.
- Audits `iam.credentials.set`.

### Bulk Credential Preview

```http
POST /api/v1/settings/users/credentials/bulk-preview
```

Request:

```json
{
  "scope": "missing_password",
  "includeUsersWithPassword": false,
  "includeDisabledUsers": false
}
```

Supported `scope` values:

- `selected`
- `role`
- `user_type`
- `missing_password`
- `all_school_users`

Additional selectors:

- `userIds` for selected users
- `roleKeys` for role targeting
- `userTypes` for user type targeting

### Bulk Credential Generate

```http
POST /api/v1/settings/users/credentials/bulk-generate
```

Request:

```json
{
  "scope": "role",
  "roleKeys": ["teacher"],
  "includeUsersWithPassword": false,
  "includeDisabledUsers": false
}
```

Response:

```json
{
  "generatedAt": "2026-06-25T10:00:00.000Z",
  "totalMatched": 30,
  "generated": 24,
  "skipped": 6,
  "skippedReasons": {
    "has_password": 4,
    "inactive": 2
  },
  "items": [
    {
      "user": { "userId": "user-uuid", "fullName": "Nour Ali" },
      "temporaryPassword": "MZ-8QWA-13ZX"
    }
  ]
}
```

## Credential Security Rules

- Temporary passwords are one-time reveal in generate responses.
- Password hashes only are stored.
- Sessions are revoked after direct credential changes.
- Disabled/inactive users are blocked from auth paths.
- Credential delivery over email uses a safer queue-backed pending-secret design documented in `SETTINGS_EMAIL.md`.
