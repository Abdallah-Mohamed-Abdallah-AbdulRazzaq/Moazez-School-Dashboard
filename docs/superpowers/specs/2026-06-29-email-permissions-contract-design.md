# Email Permissions Contract Design

## Goal

Align every Settings email surface with the backend's granular email permissions. Broad `settings.security.*` permissions remain exclusive to the separate Security settings surface and must not grant or deny email access.

## Permission Mapping

| Surface | View permission | Manage permission |
| --- | --- | --- |
| Email Connection | `settings.email.connection.view` | `settings.email.connection.manage` |
| Email Templates | `settings.email.templates.view` | `settings.email.templates.manage` |
| Credential Deliveries | `settings.email.credential_deliveries.view` | `settings.email.credential_deliveries.manage` |
| Delivery Monitoring | `settings.email.deliveries.view` | `settings.email.deliveries.manage` |
| Email Campaigns | `settings.email.campaigns.view` | `settings.email.campaigns.manage` |

View permissions control page access, settings navigation visibility, and Settings Overview shortcuts. Manage permissions control mutations supported by the corresponding backend endpoints.

Email Template preview remains available with the templates view permission, while update and reset require templates manage. Credential Delivery and Campaign previews remain available with their view permissions, while creating a batch requires the corresponding manage permission. Cancelling a delivery requires deliveries manage.

## Frontend Surfaces

Update the page guards and action checks in:

- Email Connection.
- Email Templates.
- Credential Deliveries.
- Email Deliveries list and detail.
- Email Campaigns list and detail.

Update `settingsNavigationPermissionByKey` and the Settings Overview shortcut definitions so each email entry uses its own view permission. The `PermissionKey` union includes all ten email permission keys.

## Permission Assignment

Add all ten granular email permissions to the frontend permission catalog so role-management UI can display and assign the backend-supported keys.

The mock default System Admin and IT Supervisor roles receive all ten email permissions because their previous local email access was inherited from `settings.security.view/manage`. Keep their existing security permissions so access to the separate Security page does not change. Do not grant new email permissions to other mock roles.

## Authorization Behavior

Frontend checks only control visibility and interaction. Backend authorization remains authoritative and may still return `403` when the authenticated membership does not hold the required permission.

No compatibility fallback from an email permission to `settings.security.*` is introduced. Such a fallback would preserve the incorrect coupling and could expose actions the backend rejects.

## Verification

Focused tests cover:

- Every email navigation and Settings Overview entry maps to its granular view permission.
- Every email page guard uses its granular view permission.
- Manage actions use the matching granular manage permission.
- The permission catalog contains all ten email permission keys.
- Mock System Admin and IT Supervisor roles retain Security access and receive the granular email permissions.
- No file under the Settings email feature references `settings.security.view` or `settings.security.manage`.

Run the focused Vitest suite, TypeScript typecheck, and lint on changed files.

## Non-Goals

- Changing backend permission definitions, role seeds, or authorization middleware.
- Changing the separate Settings Security page permissions.
- Adding permission aliases or broad fallback behavior.
- Changing email API payloads, response contracts, or delivery workflows.
