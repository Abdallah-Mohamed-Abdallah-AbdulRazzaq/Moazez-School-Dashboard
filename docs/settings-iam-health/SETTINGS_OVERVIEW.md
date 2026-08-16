# Settings Overview, Branding, and Security

## Settings Module Composition

`SettingsModule` imports:

- Branding
- Roles
- Permissions
- Users
- Security
- Login Identity
- Email
- Overview

Every Settings route is school-scoped and goes through the global IAM guard chain. Most use-cases call `requireSettingsScope()`, which requires an authenticated actor and active school membership.

## Settings Overview

### Route

```http
GET /api/v1/settings/overview
```

Permission:

```text
settings.overview.view
```

Purpose:

Returns basic settings dashboard readiness metrics and recent audit activity.

Response shape:

```json
{
  "profileCompleteness": 70,
  "activeUsersCount": 12,
  "pendingInvitesCount": 3,
  "recentAuditEvents": [
    {
      "id": "audit-id",
      "actor": "Admin User",
      "action": "iam.user.create",
      "module": "iam",
      "entity": "user",
      "severity": "info",
      "timestamp": "2026-06-25T10:00:00.000Z",
      "ipAddress": "127.0.0.1"
    }
  ]
}
```

Implementation notes:

- The use-case reads current `schoolId` from Settings scope.
- It fetches metrics and recent audit events in parallel.
- Presenter converts internal values to dashboard-safe fields.

## Branding / School Profile

### Routes

```http
GET   /api/v1/settings/branding
PATCH /api/v1/settings/branding
```

Permissions:

| Route | Permission |
| --- | --- |
| `GET /settings/branding` | `settings.branding.view` |
| `PATCH /settings/branding` | `settings.branding.manage` |

### Request Body: PATCH Branding

```json
{
  "schoolName": "Moazez Demo School",
  "shortName": "MDS",
  "timezone": "Africa/Cairo",
  "addressLine": "123 Education Street",
  "formattedAddress": "123 Education Street, Cairo, Egypt",
  "city": "Cairo",
  "country": "Egypt",
  "footerSignature": "Moazez Demo School Administration",
  "logoUrl": "https://example.test/logo.png",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "mapPlaceLabel": "Main Campus"
}
```

All fields are optional. Sending a field updates that profile field. Validation includes max lengths and URL validation for `logoUrl`.

### Response

```json
{
  "schoolName": "Moazez Demo School",
  "shortName": "MDS",
  "timezone": "Africa/Cairo",
  "addressLine": "123 Education Street",
  "formattedAddress": "123 Education Street, Cairo, Egypt",
  "city": "Cairo",
  "country": "Egypt",
  "footerSignature": "Moazez Demo School Administration",
  "logoUrl": "https://example.test/logo.png",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "mapPlaceLabel": "Main Campus"
}
```

### Data Model

Branding uses `SchoolProfile`:

- `schoolId` unique
- school display fields
- timezone/address/location fields
- `updatedById`
- timestamps

## Security Settings

### Routes

```http
GET   /api/v1/settings/security
PATCH /api/v1/settings/security
```

Permissions:

| Route | Permission |
| --- | --- |
| `GET /settings/security` | `settings.security.view` |
| `PATCH /settings/security` | `settings.security.manage` |

### Request Body: PATCH Security

```json
{
  "enforceTwoFactor": false,
  "ipAllowlistEnabled": false,
  "ipAllowlist": "127.0.0.1\n10.0.0.0/8",
  "sessionTimeoutMinutes": 30,
  "suspiciousLoginAlerts": true,
  "passwordMinLength": 10,
  "passwordRotationDays": 90
}
```

### Response

```json
{
  "enforceTwoFactor": false,
  "ipAllowlistEnabled": false,
  "ipAllowlist": "127.0.0.1\n10.0.0.0/8",
  "sessionTimeoutMinutes": 30,
  "suspiciousLoginAlerts": true,
  "passwordMinLength": 10,
  "passwordRotationDays": 90
}
```

### Important Runtime Boundary

Security settings are currently stored and returned, but several controls are not enforced at request time yet:

- 2FA enforcement is not active.
- IP allowlist enforcement is not active.
- Password rotation enforcement is not active.
- Suspicious login alerts are not actively emitted.

This is intentional and should not be represented as enforced behavior until a future sprint adds runtime enforcement.

## Data Models

- `SchoolProfile`
- `SecuritySetting`

Both are school-scoped and tied to the current Settings scope.
