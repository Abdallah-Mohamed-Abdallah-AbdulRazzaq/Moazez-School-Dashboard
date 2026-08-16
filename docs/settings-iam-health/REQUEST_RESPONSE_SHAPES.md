# Request and Response Shapes

This file contains compact examples for the most important Settings/IAM/Health contracts.

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@moazez.dev",
  "password": "Admin123!"
}
```

Response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid",
    "email": "admin@moazez.dev",
    "username": "admin",
    "loginEmail": "admin@moazez.dev",
    "contactEmail": null,
    "firstName": "Platform",
    "lastName": "Admin",
    "userType": "PLATFORM_USER",
    "mustChangePassword": false
  }
}
```

## Refresh

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Response uses the same shape as login.

## Me

```http
GET /api/v1/auth/me
Authorization: Bearer {{accessToken}}
```

Response:

```json
{
  "id": "user-uuid",
  "email": "nour.ali@demo-school.moazez.local",
  "username": "nour.ali",
  "loginEmail": "nour.ali@demo-school.moazez.local",
  "contactEmail": "nour.parent@example.com",
  "firstName": "Nour",
  "lastName": "Ali",
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

## Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "currentPassword": "OldPass!2026",
  "newPassword": "NewPass!2026"
}
```

Response:

```json
{
  "success": true,
  "mustChangePassword": false
}
```

## Branding Update

```json
{
  "schoolName": "Moazez Demo School",
  "shortName": "Demo",
  "timezone": "Africa/Cairo",
  "addressLine": "123 School Street",
  "formattedAddress": "123 School Street, Cairo, Egypt",
  "city": "Cairo",
  "country": "Egypt",
  "footerSignature": "Moazez Demo School",
  "logoUrl": "https://cdn.example.test/logo.png",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "mapPlaceLabel": "Main Campus"
}
```

## Security Settings Update

```json
{
  "enforceTwoFactor": false,
  "ipAllowlistEnabled": false,
  "ipAllowlist": "",
  "sessionTimeoutMinutes": 60,
  "suspiciousLoginAlerts": true,
  "passwordMinLength": 10,
  "passwordRotationDays": 90
}
```

## Create User With School-Owned Login Identity

```json
{
  "fullName": "Nour Ali",
  "username": "nour.ali",
  "contactEmail": "nour.parent@example.com",
  "roleId": "role-uuid"
}
```

Response:

```json
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
  "lastActiveAt": null,
  "invitedAt": null,
  "lastInviteSentAt": null
}
```

## Generate Credential

```http
POST /api/v1/settings/users/{{userId}}/credentials/generate
Authorization: Bearer {{accessToken}}
```

Response includes a one-time plaintext temporary password:

```json
{
  "user": {
    "userId": "user-uuid",
    "fullName": "Nour Ali",
    "username": "nour.ali",
    "loginEmail": "nour.ali@demo-school.moazez.local",
    "contactEmail": "nour.parent@example.com",
    "status": "temporary_or_must_change",
    "hasPassword": true,
    "mustChangePassword": true,
    "credentialVersion": 1
  },
  "temporaryPassword": "MZ-7KQ9-PL2R",
  "mustChangePassword": true,
  "generatedAt": "2026-06-25T10:00:00.000Z",
  "credentialVersion": 1
}
```

## Email Connection Update

```json
{
  "providerType": "SMTP",
  "fromName": "Moazez Demo School",
  "fromEmail": "no-reply@demo-school.moazez.local",
  "replyToEmail": "support@demo-school.moazez.local",
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "username": "smtp-user",
  "password": "smtp-password"
}
```

Response hides the password and returns boolean flags only.

## Credential Delivery Create

```json
{
  "scope": "missing_password",
  "templateKey": "ACCOUNT_CREDENTIALS",
  "credentialMode": "GENERATE_TEMPORARY_PASSWORD",
  "requireContactEmail": true,
  "allowLoginEmailFallback": false,
  "maxRecipients": 250
}
```

## Campaign Create

```json
{
  "templateKey": "GENERAL_MESSAGE",
  "subject": "School trip reminder",
  "title": "School trip reminder",
  "bodyHtml": "<p>Please remember to submit trip permission forms.</p>",
  "recipientScope": {
    "scope": "user_type",
    "userTypes": ["parent"]
  },
  "customEmails": ["external.guardian@example.com"],
  "maxRecipients": 500
}
```

## Health

```http
GET /api/v1/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-06-25T10:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "db": { "status": "ok", "durationMs": 4 },
    "redis": { "status": "ok", "durationMs": 4 },
    "storage": { "status": "ok", "durationMs": 10 },
    "queues": { "status": "ok", "durationMs": 8, "details": { "queues": [] } },
    "email": { "status": "skipped", "durationMs": 2, "message": "no_active_email_connections", "details": { "activeConnections": 0 } },
    "push": { "status": "skipped", "durationMs": 1, "message": "push_disabled", "details": { "mode": "disabled" } }
  }
}
```
