# Settings Roles, Permissions, and Users

## Roles

### Routes

```http
GET    /api/v1/settings/roles
POST   /api/v1/settings/roles
POST   /api/v1/settings/roles/:id/clone
PATCH  /api/v1/settings/roles/:id
DELETE /api/v1/settings/roles/:id
PUT    /api/v1/settings/roles/:id/permissions
```

Permissions:

| Route | Permission |
| --- | --- |
| list | `settings.roles.view` |
| create/clone/update/delete/replace permissions | `settings.roles.manage` |

### Create Role

```json
{
  "name": "Academic Coordinator",
  "description": "Can view and manage academic settings"
}
```

### Clone Role

```json
{
  "name": "Teacher - Limited Copy"
}
```

### Update Role

```json
{
  "name": "Academic Coordinator",
  "description": "Updated description"
}
```

### Replace Role Permissions

```json
{
  "permissions": [
    "settings.users.view",
    "settings.roles.view",
    "settings.branding.view"
  ]
}
```

### Role Response

```json
{
  "id": "role-uuid",
  "name": "Academic Coordinator",
  "description": "Can view and manage academic settings",
  "isSystem": false,
  "memberCount": 0,
  "permissions": ["settings.users.view"]
}
```

### Notes

- System roles are protected from unsafe modification/deletion by domain logic.
- Role permissions are represented by permission code strings.
- Role membership count is included in the response.

## Permissions Catalog

### Route

```http
GET /api/v1/settings/permissions
```

Permission:

```text
settings.permissions.view
```

Purpose:

Returns the settings-visible permission catalog for role management screens.

Important hardening:

- This route now has explicit permission protection.
- It is no longer an unprotected broad catalog read for any authenticated settings user.

## Users

### Routes

```http
GET   /api/v1/settings/users
POST  /api/v1/settings/users/invite
POST  /api/v1/settings/users
PATCH /api/v1/settings/users/:id
PATCH /api/v1/settings/users/:id/status
POST  /api/v1/settings/users/:id/resend-invite
POST  /api/v1/settings/users/:id/reset-password
```

Permissions:

| Route | Permission |
| --- | --- |
| list | `settings.users.view` |
| invite/create/update/status/resend/reset | `settings.users.manage` |

### List Users Query

```http
GET /api/v1/settings/users?search=nour&roleId=<roleId>&status=active&page=1&limit=20
```

Supported query fields:

- `search`: name, username, login email, contact email.
- `roleId`: filter by school role.
- `status`: `active`, `invited`, `inactive`.
- `page`: default `1`.
- `limit`: default `20`, max `100`.

### List Users Response

```json
{
  "items": [
    {
      "id": "user-uuid",
      "fullName": "Nour Ali",
      "username": "nour.ali",
      "email": "nour.ali@demo-school.moazez.local",
      "loginEmail": "nour.ali@demo-school.moazez.local",
      "contactEmail": "nour.parent@example.com",
      "roleId": "role-uuid",
      "roleName": "Teacher",
      "status": "active",
      "lastActiveAt": "2026-06-25T10:00:00.000Z",
      "invitedAt": null,
      "lastInviteSentAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### Create / Invite User

Create active user:

```http
POST /api/v1/settings/users
```

Invite user:

```http
POST /api/v1/settings/users/invite
```

Request using generated login identity:

```json
{
  "fullName": "Nour Ali",
  "username": "nour.ali",
  "contactEmail": "nour.parent@example.com",
  "roleId": "role-uuid"
}
```

Request using legacy email identity:

```json
{
  "fullName": "Nour Ali",
  "email": "nour.ali@example.com",
  "contactEmail": "nour.parent@example.com",
  "roleId": "role-uuid"
}
```

Important behavior:

- If `username` is provided, the backend requires active login identity settings and generates `User.email` from `username@loginDomain`.
- If `username` is not provided, `email` is required and is used as legacy login email.
- `contactEmail` is personal/contact delivery email and is not the login identity.
- User password hash is initially `null`; credentials are provisioned separately.
- Create sets status `ACTIVE`.
- Invite sets status `INVITED`.
- Both actions audit `iam.user.create`.

### Update User

```http
PATCH /api/v1/settings/users/:id
```

Typical body:

```json
{
  "fullName": "Nour Updated",
  "roleId": "new-role-uuid",
  "contactEmail": "new-contact@example.com"
}
```

### Update User Status

```http
PATCH /api/v1/settings/users/:id/status
```

Request:

```json
{
  "status": "inactive"
}
```

Behavior:

- API accepts `active` or `inactive`.
- `active` maps to `UserStatus.ACTIVE`.
- `inactive` maps to `UserStatus.DISABLED`.
- When the resulting user status is not active, active sessions are revoked.
- Action is audited as `iam.user.status.change`.

### Resend Invite

```http
POST /api/v1/settings/users/:id/resend-invite
```

Returns the user response. The actual credential/email activation token flow remains deferred unless handled by email delivery flows.

### Reset Password

```http
POST /api/v1/settings/users/:id/reset-password
```

Response:

```json
{
  "id": "user-uuid",
  "status": "queued",
  "message": "Password reset initiated."
}
```

This endpoint currently signals initiation rather than exposing a full reset-token flow.
