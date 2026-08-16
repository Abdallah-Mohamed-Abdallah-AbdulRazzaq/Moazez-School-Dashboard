# Security, Tenancy, and Permissions

## Permissions

School support permissions:

- `school.support.view`
- `school.support.send`

Platform support permissions:

- `platform.support.view`
- `platform.support.reply`
- `platform.support.manage`

## Route permission map

| Route family | Permission |
| --- | --- |
| `GET /school-support/conversation` | `school.support.view` |
| `GET /school-support/messages` | `school.support.view` |
| `POST /school-support/messages` | `school.support.send` |
| `POST /school-support/read` | `school.support.view` |
| `GET /platform-admin/support/conversations*` | `platform.support.view` |
| `POST /platform-admin/support/conversations/:id/messages` | `platform.support.reply` |
| `POST /platform-admin/support/conversations/:id/read` | `platform.support.view` |
| `POST /platform-admin/support/conversations/:id/close` | `platform.support.manage` |
| `POST /platform-admin/support/conversations/:id/reopen` | `platform.support.manage` |

## Role behavior

- `school_admin` receives `school.support.view` and `school.support.send` through the non-platform school-level permission bundle.
- `platform_super_admin` receives platform support permissions through the platform `ALL` permission bundle.
- Teacher, Parent, Student, and Dismissal Staff explicit permission arrays do not include `school.support.*` by default.

## School Dashboard tenancy

School routes:

- Derive `schoolId` and `organizationId` from request context.
- Require active school membership.
- Do not accept school/tenant identifiers from the client.
- Use scoped Prisma for school routes.
- Use support presenters to hide internals.

## Platform Admin tenancy

Platform routes:

- Require membershipless `UserType.PLATFORM_USER`.
- Use `@PlatformScope()`.
- Use support-specific `platform.support.*` permissions.
- Use platform-safe repository paths with `platformBypassScope(...)`.
- Verify conversation type/metadata as support conversation before returning or mutating data.

## No-leak posture

School payloads must not expose:

- Raw platform user ids.
- Platform operator emails.
- Participant ids.
- Membership ids.
- Role ids.
- Raw metadata.
- Audit internals.
- Socket room names.
- Token/session internals.

Platform payloads may expose safe operational school/organization summaries, conversation status, last message preview, and unread counts.

## Generic communication separation

Platform Admin support replies are not exposed through generic `/api/v1/communication/*` routes. Generic Communication routes remain school-scoped and were not weakened by this feature.
