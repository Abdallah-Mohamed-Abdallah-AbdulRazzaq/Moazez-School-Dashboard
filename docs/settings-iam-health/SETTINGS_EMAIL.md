# Settings Email

This document covers the implemented school email settings and queue-backed delivery logic.

## Runtime Scope

The email subsystem is part of `SettingsModule` through `EmailModule`. It is school-scoped and relies on:

- active school request scope
- granular settings email permissions
- encrypted provider secrets
- queue-backed delivery processing
- school email templates
- safe delivery history presenters

## Email Module Composition

The module wires:

- connection controller
- template controller
- credential delivery controller
- generic delivery controller
- campaign controller
- recipient targeting service
- renderer service
- BullMQ queue service
- delivery worker
- Nodemailer transport
- encrypted secret helper

## Email Connection

Base path:

```http
/api/v1/settings/email/connection
```

Routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/connection` | `settings.email.connection.view` | Read current provider configuration. |
| PUT | `/settings/email/connection` | `settings.email.connection.manage` | Create/update provider settings. |
| POST | `/settings/email/connection/test` | `settings.email.connection.manage` | Validate the configured provider. |
| POST | `/settings/email/connection/activate` | `settings.email.connection.manage` | Activate a verified connection. |
| POST | `/settings/email/connection/disable` | `settings.email.connection.manage` | Disable current connection. |

### Supported Provider Runtime

The DTO exposes provider types:

- `SMTP`
- `SENDGRID`
- `MAILGUN`
- `SES`
- `CUSTOM`

Actual runtime currently supports SMTP only. Non-SMTP provider runtime is deferred.

### Update Connection Request

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

Notes:

- `password` and `apiKey` are write-only input fields.
- Secrets are encrypted before persistence.
- Updating connection resets status to `DRAFT` and clears verification/failure metadata.
- Response never returns secrets.

### Connection Response

```json
{
  "configured": true,
  "providerType": "SMTP",
  "fromName": "Moazez Demo School",
  "fromEmail": "no-reply@demo-school.moazez.local",
  "replyToEmail": "support@demo-school.moazez.local",
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "username": "smtp-user",
  "hasPassword": true,
  "hasApiKey": false,
  "status": "DRAFT",
  "lastTestedAt": null,
  "verifiedAt": null,
  "failureReason": null,
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:00:00.000Z"
}
```

### Test Connection Response

```json
{
  "configured": true,
  "providerType": "SMTP",
  "status": "VERIFIED",
  "hasPassword": true,
  "hasApiKey": false,
  "testRecipient": "it-admin@example.com",
  "deliveryMode": "configuration_validation",
  "message": "SMTP configuration was validated. No bulk or credential email was sent."
}
```

## Email Templates

Base path:

```http
/api/v1/settings/email/templates
```

Routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/templates` | `settings.email.templates.view` | List templates. |
| GET | `/settings/email/templates/:key` | `settings.email.templates.view` | Get one template. |
| PUT | `/settings/email/templates/:key` | `settings.email.templates.manage` | Customize a template. |
| POST | `/settings/email/templates/:key/preview` | `settings.email.templates.view` | Render unsaved preview. |
| POST | `/settings/email/templates/:key/reset-default` | `settings.email.templates.manage` | Reset to default template. |

Template keys:

- `ACCOUNT_CREDENTIALS`
- `PASSWORD_RESET`
- `GENERAL_MESSAGE`

### Update Template Request

```json
{
  "subject": "Your Moazez account is ready",
  "preheader": "Use your school login email to sign in.",
  "title": "Welcome to Moazez",
  "subtitle": "Your school account has been prepared.",
  "bodyHtml": "<p>Hello {{user.fullName}}, your login email is {{user.loginEmail}}.</p>",
  "bodyText": "Hello {{user.fullName}}, your login email is {{user.loginEmail}}.",
  "footerHtml": "<p>Contact {{support.email}} for help.</p>",
  "logoFileId": null,
  "supportEmail": "support@demo-school.moazez.local",
  "supportPhone": "+201000000000",
  "socialLinks": {
    "website": "https://school.example.com",
    "facebook": "https://facebook.com/demo-school"
  },
  "isActive": true
}
```

### Template Response

```json
{
  "id": "template-uuid",
  "key": "ACCOUNT_CREDENTIALS",
  "customized": true,
  "subject": "Your Moazez account is ready",
  "preheader": "Use your school login email to sign in.",
  "title": "Welcome to Moazez",
  "subtitle": "Your school account has been prepared.",
  "bodyHtml": "<p>Hello {{user.fullName}}, your login email is {{user.loginEmail}}.</p>",
  "bodyText": "Hello {{user.fullName}}, your login email is {{user.loginEmail}}.",
  "footerHtml": "<p>Contact {{support.email}} for help.</p>",
  "logoFileId": null,
  "supportEmail": "support@demo-school.moazez.local",
  "supportPhone": "+201000000000",
  "socialLinks": { "website": "https://school.example.com" },
  "isActive": true,
  "allowedVariables": ["school.name", "user.fullName", "user.loginEmail"],
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:00:00.000Z"
}
```

### Preview Template Request

```json
{
  "subject": "Your Moazez account is ready",
  "bodyHtml": "<p>Hello {{user.fullName}}</p>",
  "previewData": {
    "user": {
      "fullName": "Nour Ali",
      "loginEmail": "nour.ali@demo-school.moazez.local"
    },
    "school": { "name": "Demo School" }
  }
}
```

## Credential Deliveries

Base path:

```http
/api/v1/settings/email/credential-deliveries
```

Routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/settings/email/credential-deliveries/preview-recipients` | `settings.email.credential_deliveries.view` | Preview eligible/skipped recipients. |
| POST | `/settings/email/credential-deliveries` | `settings.email.credential_deliveries.manage` | Create queued credential delivery batch. |

### Recipient Scopes

- `selected`
- `role`
- `user_type`
- `missing_password`
- `must_change_password`
- `with_contact_email`
- `all_school_users`

### Credential Delivery Modes

- `LOGIN_INFO_ONLY`
- `GENERATE_TEMPORARY_PASSWORD`
- `REGENERATE_TEMPORARY_PASSWORD`

### Preview Credential Recipients

```json
{
  "scope": "role",
  "roleKeys": ["teacher"],
  "includeUsersWithPassword": false,
  "includeDisabledUsers": false,
  "requireContactEmail": true,
  "allowLoginEmailFallback": false,
  "limit": 100
}
```

Response:

```json
{
  "totalMatched": 120,
  "eligible": 100,
  "skipped": 20,
  "skippedReasons": {
    "missing_contact_email": 12,
    "disabled_user": 8
  },
  "sample": {
    "eligible": [
      {
        "userId": "user-uuid",
        "fullName": "Nour Ali",
        "username": "nour.ali",
        "loginEmail": "nour.ali@demo-school.moazez.local",
        "contactEmail": "nour.parent@example.com",
        "toEmail": "nour.parent@example.com",
        "userType": "teacher",
        "roleKey": "teacher",
        "hasPassword": false,
        "mustChangePassword": false,
        "credentialVersion": 0,
        "reason": null
      }
    ],
    "skipped": []
  }
}
```

### Create Credential Delivery

```json
{
  "scope": "missing_password",
  "templateKey": "ACCOUNT_CREDENTIALS",
  "credentialMode": "GENERATE_TEMPORARY_PASSWORD",
  "includeUsersWithPassword": false,
  "includeDisabledUsers": false,
  "requireContactEmail": true,
  "allowLoginEmailFallback": false,
  "maxRecipients": 250
}
```

Response:

```json
{
  "batchId": "batch-uuid",
  "status": "QUEUED",
  "kind": "CREDENTIAL_DELIVERY",
  "templateKey": "ACCOUNT_CREDENTIALS",
  "subjectSnapshot": "Account credential delivery",
  "totalRecipients": 100,
  "queuedCount": 100,
  "sentCount": 0,
  "failedCount": 0,
  "skippedCount": 0,
  "startedAt": null,
  "completedAt": null,
  "cancelledAt": null,
  "failureReason": null,
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:00:00.000Z",
  "deliveryMode": "queued"
}
```

## General Email Campaigns

Base path:

```http
/api/v1/settings/email/campaigns
```

Routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/settings/email/campaigns/preview-recipients` | `settings.email.campaigns.view` | Preview recipients. |
| POST | `/settings/email/campaigns/preview` | `settings.email.campaigns.view` | Render campaign preview. |
| POST | `/settings/email/campaigns` | `settings.email.campaigns.manage` | Create queued campaign. |
| GET | `/settings/email/campaigns` | `settings.email.campaigns.view` | List campaign batches. |
| GET | `/settings/email/campaigns/:batchId` | `settings.email.campaigns.view` | Get one campaign batch. |

### Campaign Preview Request

```json
{
  "templateKey": "GENERAL_MESSAGE",
  "subject": "School trip reminder",
  "title": "School trip reminder",
  "bodyHtml": "<p>Please remember to submit trip permission forms by Thursday.</p>",
  "bodyText": "Please remember to submit trip permission forms by Thursday.",
  "footerHtml": "<p>Contact {{support.email}} for help.</p>",
  "previewData": {
    "school": { "name": "Demo School" },
    "support": { "email": "support@demo-school.moazez.local" }
  }
}
```

### Create Campaign Request

```json
{
  "templateKey": "GENERAL_MESSAGE",
  "subject": "School trip reminder",
  "title": "School trip reminder",
  "bodyHtml": "<p>Please remember to submit trip permission forms by Thursday.</p>",
  "bodyText": "Please remember to submit trip permission forms by Thursday.",
  "recipientScope": {
    "scope": "user_type",
    "userTypes": ["parent"]
  },
  "customEmails": ["external.guardian@example.com"],
  "includeDisabledUsers": false,
  "requireContactEmail": true,
  "allowLoginEmailFallback": false,
  "maxRecipients": 500
}
```

## Delivery Monitoring

Base path:

```http
/api/v1/settings/email/deliveries
```

Routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/deliveries` | `settings.email.deliveries.view` | List all delivery batches. |
| GET | `/settings/email/deliveries/:batchId` | `settings.email.deliveries.view` | Get one batch. |
| GET | `/settings/email/deliveries/:batchId/recipients` | `settings.email.deliveries.view` | List recipients in batch. |
| POST | `/settings/email/deliveries/:batchId/cancel` | `settings.email.deliveries.manage` | Cancel a queued delivery batch. |

### List Deliveries Query

```http
GET /api/v1/settings/email/deliveries?kind=CREDENTIAL_DELIVERY&status=QUEUED&page=1&limit=20
```

### Recipient Response

```json
{
  "id": "recipient-uuid",
  "userId": "user-uuid",
  "toEmail": "nour.parent@example.com",
  "displayName": "Nour Ali",
  "status": "QUEUED",
  "attempts": 0,
  "lastAttemptAt": null,
  "sentAt": null,
  "failureReason": null,
  "skippedReason": null,
  "createdAt": "2026-06-25T10:00:00.000Z",
  "updatedAt": "2026-06-25T10:00:00.000Z"
}
```

## Queue Worker And Credential Safety

Credential delivery uses a pending-secret design:

1. For credential deliveries that need temporary password material, the worker generates one temporary password per recipient.
2. It stores only an encrypted pending credential in recipient metadata.
3. On retry, it decrypts and reuses the same pending password instead of generating a different one.
4. It renders and sends the email.
5. Only after SMTP send succeeds, it hashes and applies the password to the user.
6. It sets `mustChangePassword=true` and revokes sessions.
7. On failure, the user credential is not mutated.
8. Failure reasons redact temporary password patterns and email addresses.

## No-Leak Rules

- Provider passwords/API keys are never returned.
- Responses expose `hasPassword` and `hasApiKey` booleans only.
- Plain temporary passwords are not persisted.
- Pending encrypted temporary password metadata is internal to the worker/repository path.
- Delivery history does not return provider secrets or pending credential material.
- General campaigns are external email campaigns, separate from in-app Communication Announcements.
