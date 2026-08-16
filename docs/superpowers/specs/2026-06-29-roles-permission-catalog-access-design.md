# Roles Permission Catalog Access Design

## Goal

Allow users with `settings.roles.view` to continue viewing the Roles page when they do not have `settings.permissions.view`, without sending a request that the backend must reject.

## Permission Contract

The frontend permission key union includes `settings.permissions.view`. `GET /settings/roles` remains guarded by `settings.roles.view`, while `GET /settings/permissions` is requested only when the authenticated session contains `settings.permissions.view`.

The frontend must not infer or grant `settings.permissions.view` from `settings.roles.view` or `settings.roles.manage`. Backend authorization remains the source of truth.

## Loading Behavior

Role-list loading and permission-catalog loading are independent. A missing catalog permission skips the catalog request entirely. A catalog request that fails for another reason does not discard a successful role-list response or fail the entire page.

The existing page loader covers the role list. The permission matrix tracks its own availability state so a catalog authorization or loading failure cannot hide the role table.

## User Interface

Users with `settings.roles.view` can access the page and inspect the role list. When `settings.permissions.view` is missing, the permission matrix shows a localized access-required message and does not expose its Save action or permission toggles.

When the user has catalog permission but catalog loading fails, the matrix shows a localized load-failure message. Role creation, editing, cloning, and deletion continue to follow `settings.roles.manage`; this change does not grant or remove those capabilities.

The navigation rule remains `settings.roles.view`, because the page still provides valid role-list functionality without catalog access.

## Alternatives Considered

Requiring both permissions for the entire page would hide role data that the backend explicitly allows through `settings.roles.view`. Automatically treating `settings.roles.view` or `settings.roles.manage` as catalog access would contradict backend authorization and still produce a rejected request. Separating the two data capabilities is therefore the selected approach.

## Verification

Focused tests cover:

- A user without `settings.permissions.view` does not request `/settings/permissions`.
- The role list remains available when catalog access is missing.
- The permission matrix shows its access-required state and cannot save changes.
- A catalog request failure does not fail or remove a successfully loaded role list.
- A user with `settings.permissions.view` loads and sees the permission matrix normally.
