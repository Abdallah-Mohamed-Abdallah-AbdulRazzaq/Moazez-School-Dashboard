# API Reference

All paths are served under the global prefix:

```text
/api/v1
```

All non-public routes require `Authorization: Bearer <accessToken>`.

## Public / Root / Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | Root hello endpoint. |
| GET | `/health` | Public | Liveness and dependency readiness. |

## IAM / Auth

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Exchange email/password for access + refresh token pair. |
| POST | `/auth/refresh` | Public | Rotate refresh token and issue new token pair. |
| GET | `/auth/me` | Authenticated | Return current actor and active membership. |
| POST | `/auth/logout` | Authenticated | Revoke current session. |
| POST | `/auth/change-password` | Authenticated | Change current user's password. |

## Settings Overview

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/overview` | `settings.overview.view` | Settings dashboard overview metrics and recent audit events. |

## Settings Branding

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/branding` | `settings.branding.view` | Read school profile/branding. |
| PATCH | `/settings/branding` | `settings.branding.manage` | Update school profile/branding. |

## Settings Security

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/security` | `settings.security.view` | Read stored security settings. |
| PATCH | `/settings/security` | `settings.security.manage` | Update stored security settings. |

## Settings Roles

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/roles` | `settings.roles.view` | List roles. |
| POST | `/settings/roles` | `settings.roles.manage` | Create custom role. |
| POST | `/settings/roles/:id/clone` | `settings.roles.manage` | Clone role. |
| PATCH | `/settings/roles/:id` | `settings.roles.manage` | Update role metadata. |
| DELETE | `/settings/roles/:id` | `settings.roles.manage` | Delete custom role. |
| PUT | `/settings/roles/:id/permissions` | `settings.roles.manage` | Replace role permissions. |

## Settings Permissions

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/permissions` | `settings.permissions.view` | List permission catalog. |

## Settings Users

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/users` | `settings.users.view` | List school users. |
| POST | `/settings/users/invite` | `settings.users.manage` | Create invited user. |
| POST | `/settings/users` | `settings.users.manage` | Create active user. |
| PATCH | `/settings/users/:id` | `settings.users.manage` | Update user profile/role. |
| PATCH | `/settings/users/:id/status` | `settings.users.manage` | Activate/deactivate user. |
| POST | `/settings/users/:id/resend-invite` | `settings.users.manage` | Resend invite action. |
| POST | `/settings/users/:id/reset-password` | `settings.users.manage` | Queue/initiate reset-password action. |

## Settings Login Identity

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/login-identity` | `settings.users.view` | Get school login domain and username policy. |
| PUT | `/settings/login-identity` | `settings.users.manage` | Update login identity settings. |
| GET | `/settings/login-identity/preview` | `settings.users.view` | Preview generated login email for username. |
| GET | `/settings/users/usernames/available` | `settings.users.view` | Validate username availability. |

## Settings User Credentials

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/users/credentials/status` | `settings.users.view` | List users with credential readiness. |
| POST | `/settings/users/credentials/bulk-preview` | `settings.users.view` | Preview bulk credential generation audience. |
| POST | `/settings/users/credentials/bulk-generate` | `settings.users.manage` | Generate temporary passwords for eligible users. |
| POST | `/settings/users/:userId/credentials/generate` | `settings.users.manage` | Generate temporary password for one user. |
| POST | `/settings/users/:userId/credentials/set` | `settings.users.manage` | Set password for one user. |
| POST | `/settings/users/:userId/credentials/regenerate` | `settings.users.manage` | Regenerate temporary password for one user. |

## Settings Email Connection

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/connection` | `settings.email.connection.view` | Read school email provider connection. |
| PUT | `/settings/email/connection` | `settings.email.connection.manage` | Create/update provider connection. |
| POST | `/settings/email/connection/test` | `settings.email.connection.manage` | Validate configured provider. |
| POST | `/settings/email/connection/activate` | `settings.email.connection.manage` | Activate verified provider. |
| POST | `/settings/email/connection/disable` | `settings.email.connection.manage` | Disable provider. |

## Settings Email Templates

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/templates` | `settings.email.templates.view` | List templates. |
| GET | `/settings/email/templates/:key` | `settings.email.templates.view` | Get template. |
| PUT | `/settings/email/templates/:key` | `settings.email.templates.manage` | Update template. |
| POST | `/settings/email/templates/:key/preview` | `settings.email.templates.view` | Render preview. |
| POST | `/settings/email/templates/:key/reset-default` | `settings.email.templates.manage` | Reset template to default. |

## Settings Credential Delivery

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/settings/email/credential-deliveries/preview-recipients` | `settings.email.credential_deliveries.view` | Preview recipients. |
| POST | `/settings/email/credential-deliveries` | `settings.email.credential_deliveries.manage` | Create queued credential delivery. |

## Settings General Email Campaigns

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| POST | `/settings/email/campaigns/preview-recipients` | `settings.email.campaigns.view` | Preview campaign recipients. |
| POST | `/settings/email/campaigns/preview` | `settings.email.campaigns.view` | Render campaign preview. |
| POST | `/settings/email/campaigns` | `settings.email.campaigns.manage` | Create queued campaign. |
| GET | `/settings/email/campaigns` | `settings.email.campaigns.view` | List campaigns. |
| GET | `/settings/email/campaigns/:batchId` | `settings.email.campaigns.view` | Get campaign detail. |

## Settings Email Delivery Monitoring

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET | `/settings/email/deliveries` | `settings.email.deliveries.view` | List delivery batches. |
| GET | `/settings/email/deliveries/:batchId` | `settings.email.deliveries.view` | Get delivery batch. |
| GET | `/settings/email/deliveries/:batchId/recipients` | `settings.email.deliveries.view` | List recipients. |
| POST | `/settings/email/deliveries/:batchId/cancel` | `settings.email.deliveries.manage` | Cancel queued delivery. |
