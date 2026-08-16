# Dashboard Security, Tenancy, and Permissions

## 1. Security posture

The Dashboard uses the standard Moazez chain:

1. authenticate actor
2. resolve active membership and school context
3. enforce route permission
4. apply management-only restriction where required
5. apply resource ownership for personal Todo records
6. query only the trusted school scope
7. present allowlisted aggregate fields

This is application-level tenancy enforcement through guards, request context, and Prisma scoping. It is not PostgreSQL RLS.

## 2. Dashboard permissions

Exactly ten permission codes are seeded:

1. `dashboard.command_center.view`
2. `dashboard.light_mode_dropdown.view`
3. `dashboard.todos.view`
4. `dashboard.todos.manage`
5. `dashboard.analytics.view`
6. `dashboard.modules.view`
7. `dashboard.widgets.view`
8. `dashboard.summary.view`
9. `dashboard.alerts.view`
10. `dashboard.activity_feed.view`

## 3. Default role posture

| System role | Dashboard posture |
| --- | --- |
| platform_super_admin | Inherits all permission codes, but Dashboard still requires active school scope; Todo routes also reject platform-only management posture. |
| organization_admin | Inherits non-platform permissions, including Dashboard permissions; must operate in active school scope. |
| school_admin | Inherits school-level permissions, including Dashboard permissions. |
| teacher | No `dashboard.*` permissions in the system-role allowlist. |
| parent | No `dashboard.*` permissions. |
| student | No `dashboard.*` permissions. |
| dismissal_staff | No `dashboard.*` permissions. |

Custom roles may receive individual Dashboard permissions according to normal Settings/IAM governance, but the active school boundary remains mandatory.

## 4. Tenant boundaries by surface

| Surface | Boundary |
| --- | --- |
| Summary | `prisma.scoped` active school, aggregate-only response. |
| Alerts | `prisma.scoped` active school, aggregate-only response. |
| Widgets | Selected dependencies all run in active school scope. |
| Module Pages | Summary/alerts in active school scope. |
| Analytics | Trusted active school + same-school hierarchy validation. |
| Light Mode | Active school for location/Calendar/planner; actor owner for Todos. |
| Todo CRUD | Active school + authenticated owner + soft-delete exclusion. |
| Activity Feed | Explicit trusted `schoolId` on AuditLog because AuditLog is intentionally scope-exempt. |

## 5. AuditLog exception

`AuditLog` is append-only and not automatically injected by the general school-scope extension. The Dashboard Activity Feed repository therefore explicitly requires:

- `schoolId` from trusted `DashboardScope`
- successful outcome
- approved module set

The repository does not accept a client school ID.

## 6. Todo ownership

Todo access requires both:

- active school scope
- `ownerUserId = current actor ID`

Client-controlled fields cannot override either value.

Safe not-found behavior applies to:

- unknown Todo ID
- another actor's Todo in the same school
- another school's Todo
- soft-deleted Todo

This avoids revealing whether a record exists outside the caller's boundary.

## 7. Analytics hierarchy isolation

Before any aggregate repository executes, the query context resolves requested academic entities through school-scoped repositories.

Validation includes:

- UUID syntax
- record existence in active school
- term belongs to academic year
- section belongs to grade
- classroom belongs to section and grade

A foreign-school or mismatched ID returns safe not-found rather than cross-tenant detail.

## 8. Field-level no-leak behavior

The Dashboard contracts avoid exposing:

- school ID
- organization ID
- role ID
- membership ID
- Todo owner ID
- raw source entity rows
- source-domain PII
- AuditLog metadata blobs
- internal notes/descriptions not approved for a preview

Approved identifier exceptions:

- Activity Feed safe actor and subject IDs
- full Light Mode Calendar/cross-module event IDs
- full Todo CRUD and Light Mode planner Todo IDs

Preview widgets deliberately strip these IDs where they are not required.

## 9. Permission isolation from source routes

A Dashboard permission authorizes only the fixed Dashboard composition. It does not grant permission to the underlying source endpoint.

Examples:

- `dashboard.widgets.view` can expose an attendance count but does not authorize `/attendance/...` routes.
- `dashboard.light_mode_dropdown.view` can expose a safe Calendar event but does not grant `academics.calendar.view`.
- `dashboard.command_center.view` can display a homework risk but does not grant homework management.

## 10. Security-sensitive findings

- No Dashboard route accepts tenant selection from the client.
- No arbitrary analytics query builder exists.
- No raw SQL surface or dynamic model selection is exposed.
- Widget and module actions are fixed frontend routes.
- Weather provider credentials do not exist in the Dashboard contract because the provider is deferred.
- No realtime Dashboard subscription exists, avoiding an unapproved cross-tenant subscription surface.
