# Dashboard Security and Tenancy

## Security principle

Dashboard is school-scoped. It must show the current school's operational data only. It must not leak cross-school or platform-level data.

## Authentication

All Dashboard endpoints require a valid authenticated request. Public access is not allowed.

## Scope requirement

Dashboard requires an active school membership. The active membership supplies:

- `organizationId`
- `schoolId`
- `roleId`
- actor identity
- actor user type

If the active membership does not include a school id, Dashboard rejects the request with a scope error.

## Permission checks

Each endpoint requires a dedicated permission:

| Endpoint | Permission |
| --- | --- |
| Summary | `dashboard.summary.view` |
| Alerts | `dashboard.alerts.view` |
| Activity Feed | `dashboard.activity_feed.view` |

A user may have access to one Dashboard surface but not another if permissions are assigned granularly.

## Role posture

Dashboard permissions are intended for admin-like school operational roles, such as school admin or organization admin style roles that inherit school-level permissions. Teacher, parent, and student roles should not receive Dashboard permissions by default.

## School-scoped reads

Summary and Alerts repositories use scoped Prisma reads for source-domain models. This allows the school-scope extension to inject the active school filter for school-scoped tables.

## AuditLog exception

Activity Feed reads from `AuditLog`. Audit logs are platform-sensitive and are intentionally not automatically scoped by the Prisma school-scope extension. For this reason, Activity Feed manually filters audit rows by the active `schoolId`.

Required Activity Feed base filters:

```text
schoolId = active dashboard school
outcome = SUCCESS
module in allowed dashboard modules
```

## Safe response shaping

Dashboard presenters return DTOs only. They should not expose:

- raw Prisma records;
- raw audit `before` and `after` payloads;
- JWTs or refresh tokens;
- session hashes;
- storage keys;
- private tenant identifiers;
- raw organization or school identifiers in Summary/Alerts/Activity Feed responses.

## Read-only posture

Dashboard endpoints do not mutate source modules. There are no write routes for read state, dismissals, acknowledgements, pins, comments, notifications, or realtime events.

## Cross-school leakage prevention

The expected security behavior is:

- School A user sees only School A summary values.
- School A user sees only School A alerts.
- School A user sees only School A audit-backed activities.
- School B records must not appear in School A responses.
- A platform user without active school membership cannot use these school Dashboard routes as a platform dashboard.

## Deferred lifecycle risk controls

Because alert lifecycle and activity lifecycle are deferred, clients must not assume the existence of durable alert ids, read state, dismissed state, pins, or persisted feed preferences.

## Recommended review checklist

Before changing Dashboard code, verify:

- Every route has `@RequiredPermissions(...)`.
- Every use case calls `requireDashboardScope()` before data loading.
- Summary and Alerts reads use scoped Prisma unless there is a documented reason not to.
- AuditLog reads include explicit `schoolId` filtering.
- Presenters do not expose raw payloads or tenant-sensitive identifiers.
- New route inventory remains aligned with documented non-goals.
