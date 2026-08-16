# Users Backend Alignment and Guided Provisioning Design

## Summary

Align the frontend Settings Users module with the current `Moazez-Backend`
contracts without changing the backend. The Users page will manage user
identity, role assignment, directory status, and account status. Credential
generation and credential email delivery will remain owned by their existing
frontend modules, but the Users workflow will guide administrators into those
capabilities immediately after user creation or invitation.

This design corrects every mismatch identified in the July 29 contract audit:

- placeholder invite resend and password reset actions;
- unsupported Teacher lifecycle operations;
- credential fields that are absent from the users response;
- lack of the backend's legacy login-email creation mode;
- an unsupported user-detail endpoint;
- an inaccurate status-update response type;
- incomplete role loading.

## Scope

### In scope

- Settings Users page, editor, service, types, actions, exports, and tests.
- Login-identity-aware create and invite forms.
- A guided credential-provisioning step after create or invite.
- Safe handoffs to Credentials, Credential Deliveries, and Teachers.
- URL initialization needed for those handoffs.
- Complete role pagination for Users.
- English and Arabic copy required by the corrected workflows.

### Out of scope

- Backend changes.
- A new invitation token, password-reset token, or email delivery backend.
- Changes to Teacher lifecycle rules.
- Duplicating the Credentials table or Credential Deliveries wizard inside the
  Users page.
- Persisting or exporting temporary passwords.
- Redesigning unrelated Settings pages.

## Backend Boundaries

The design treats these backend behaviors as authoritative:

- `POST /settings/users` creates an active user without a password.
- `POST /settings/users/invite` creates an invited user without sending an
  invitation email.
- Credentials are provisioned through
  `/settings/users/:userId/credentials/*`.
- Credential email delivery is created through
  `/settings/email/credential-deliveries`.
- Teacher provisioning and lifecycle changes belong to the Teachers module.
- `GET /settings/users` does not return credential status.
- `PATCH /settings/users/:id/status` returns only `{ id, status }`.
- There is no `GET /settings/users/:id` endpoint.

The frontend must not imply that a user can log in, that an email was sent, or
that a password was reset until the corresponding credential or delivery
operation succeeds.

## Architecture

### Settings Users page

`SettingsUsersPage` remains the directory orchestrator. It owns:

- user list filters and pagination;
- role metadata used for labels and lifecycle-safe actions;
- create, invite, edit, and supported non-Teacher status changes;
- the post-create/post-invite provisioning state;
- navigation handoffs to the specialized modules.

It does not own credential status data or duplicate credential-delivery state.

### User editor

`UserEditorModal` supports two identity modes.

#### Generated identity mode

Use this mode when login-identity settings exist and are active.

- Username is required.
- The generated login email is previewed.
- Username availability is checked before submission.
- Contact email is optional.
- The request contains `fullName`, `username`, optional `contactEmail`, and
  `roleId`.

#### Legacy login-email mode

Use this mode when login-identity settings are absent or inactive.

- Login email is required.
- Username controls and generated-email preview are hidden.
- Contact email remains optional and distinct from login email.
- The request contains `fullName`, `email`, optional `contactEmail`, and
  `roleId`.

A login-identity request failure is not equivalent to an inactive
configuration. Network or server failures block submission and expose a retry
action so the UI does not silently choose the wrong identity model.

Edit mode continues to expose only fields supported by the backend update
contract. Teacher rows cannot enter generic edit mode.

### User provisioning modal

Add a focused `UserProvisioningModal` that opens after a successful create or
invite response. It receives the returned user record and offers:

1. Generate a temporary password.
2. Deliver credentials by email.
3. Finish later.

Generating a temporary password reuses the existing credential service and
one-time reveal component. The secret exists only in transient React state and
is cleared when the reveal UI closes.

Delivering credentials navigates to the localized Credential Deliveries route
with `userId=<createdUserId>`. The wizard initializes:

- audience mode: selected users;
- selected user IDs: the supplied user ID;
- credential mode: `GENERATE_TEMPORARY_PASSWORD`.

The delivery wizard still requires preview and explicit confirmation. The
Users page never starts an email batch automatically.

Provisioning is a second operation. If it fails, the created user remains
saved, the modal reports only the provisioning failure, and the administrator
may retry or finish later.

### Specialized-module handoffs

- Existing user “Manage credentials” navigates to the localized Credentials
  page with `search=<loginEmail>`.
- Invited user “Deliver credentials” navigates to Credential Deliveries with
  `userId=<userId>`.
- Teacher “Manage in Teachers” navigates to the localized Teachers directory
  with `search=<loginEmail>`.

URLs may contain user IDs or login-email search values, but never temporary
passwords or other secrets.

## Role and Teacher Rules

The frontend loads all Settings roles by following pagination with a maximum
page size of 100. Role metadata is indexed by role ID.

- All roles remain available for directory filtering and display.
- Roles with `key === "teacher"` are excluded from create and invite choices.
- Teacher users remain visible in the Users directory.
- Teacher rows do not expose generic edit, activation, deactivation,
  resend-invite, reset-password, or role-change actions.
- Teacher rows expose “Manage in Teachers” when the current user can access the
  Teachers module.
- Credential management remains available for Teachers through the approved
  credential flows and permissions.
- If role metadata cannot be resolved, lifecycle-changing actions fail closed.

This prevents the frontend from offering operations the backend intentionally
rejects while preserving account visibility.

## Users Table and Export

Remove the credential-status column from the Users table because
`GET /settings/users` does not provide authoritative credential fields.

Remove credential status from Users exports for the same reason. Credentials
exports, if any, remain the responsibility of the Credentials module.

The Users table retains:

- full name and username;
- login email;
- contact email;
- role;
- account status;
- last active time;
- lifecycle-safe actions.

## Service and Type Corrections

Update the Users frontend contract to mirror the backend:

- Remove credential-only fields from `SettingsUserApiDto` and
  `SettingsUserRecord`.
- Model the status response as `{ id, status }`.
- Make `setSettingsUserStatus` return that partial response.
- Remove `fetchSettingsUser` because the backend has no matching endpoint,
  provided repository-wide caller search confirms it is unused.
- Remove placeholder `resendSettingsUserInvite` and
  `triggerSettingsUserPasswordReset` functions after confirming no callers
  remain.
- Preserve the complete user response for create, invite, and update.
- Add a reusable all-role loader or pagination helper rather than relying on
  the backend's default first page.

The existing Credentials service remains the source of credential response
types and mapping.

## Detailed Workflows

### Create active user

1. Administrator opens Create User.
2. The modal resolves login-identity configuration.
3. The administrator completes the applicable identity form.
4. The frontend checks username availability when generated identity mode is
   active.
5. The frontend posts to `/settings/users`.
6. The directory refreshes and reports that the user record was created.
7. `UserProvisioningModal` opens.
8. The administrator generates a temporary password, proceeds to delivery, or
   finishes later.

### Invite user

1. Administrator opens Invite User.
2. Identity resolution and validation follow the same mode rules as Create.
3. The frontend posts to `/settings/users/invite`.
4. The directory refreshes and reports that the invited user record was
   created. It does not claim an email was sent.
5. `UserProvisioningModal` opens.
6. The administrator may generate credentials, continue to confirmed email
   delivery, or finish later.

### Existing invited user

The row exposes “Deliver credentials,” not “Resend invite.” Delivery opens the
Credential Deliveries wizard preselected to that user. The wizard's preview
decides eligibility and reports skipped reasons using the backend contract.

### Existing non-Teacher user

Supported actions are:

- edit full name and role;
- activate or deactivate;
- manage credentials;
- deliver credentials when the account state makes the action relevant.

### Existing Teacher user

Supported actions are:

- manage credentials through the approved credential surface;
- manage lifecycle and profile in Teachers.

No generic Settings lifecycle write is offered.

## Permissions

- `settings.users.view` gates the Users directory.
- `settings.users.manage` gates create, invite, non-Teacher edit/status, and
  temporary-password generation.
- `settings.email.credential_deliveries.manage` gates the email-delivery
  option.
- Users without delivery permission can generate credentials when allowed or
  finish later.
- Teacher-directory navigation is shown only when the user has the permission
  required by the existing Teachers navigation contract.

Permissions are checked in the UI for discoverability, while backend
authorization remains authoritative.

## Error Handling

### Identity configuration

- Known missing/inactive configuration selects legacy login-email mode.
- Fetch failure shows a retryable form-level error and blocks submission.
- Username preview and availability errors remain inline.

### Validation

Backend validation details map to:

- `fullName`;
- `username`;
- `email`;
- `contactEmail`;
- `roleId`.

Identity conflicts preserve actionable backend messages. Teacher lifecycle
conflicts that reach the frontend due to stale data show a targeted message
directing the administrator to Teachers.

### Provisioning

- User creation success and provisioning success have separate messages.
- Provisioning failure does not close the modal or relabel creation as failed.
- A retry is available.
- “Finish later” is always available after the user record exists.

### Secrets

Temporary passwords must not be written to:

- console output;
- URLs;
- local or session storage;
- IndexedDB;
- analytics;
- exports;
- snapshots;
- persistent application state.

## Localization

English and Arabic copy must distinguish these outcomes:

- user record created;
- invited user record created;
- credential generated;
- delivery queued;
- provisioning postponed;
- identity settings unavailable;
- identity configuration inactive, using login email;
- Teacher lifecycle is managed in Teachers.

Remove or replace copy that implies the placeholder reset or resend endpoint
completed a real delivery.

## Testing

### Component tests

`UserEditorModal` tests cover:

- active configuration and username mode;
- missing/inactive configuration and login-email mode;
- configuration fetch failure and retry;
- optional contact email;
- Teacher-role exclusion;
- username validation and availability.

`UserProvisioningModal` tests cover:

- temporary-password generation;
- one-time reveal;
- secret cleanup on close;
- delivery handoff with user preselection;
- missing delivery permission;
- finish later;
- retry after provisioning failure.

`SettingsUsersPage` tests cover:

- Teacher visibility and safe actions;
- non-Teacher edit/status actions;
- removal of credential status;
- post-create and post-invite provisioning;
- separate creation and provisioning error states;
- complete role pagination;
- safe fallback when role metadata is unavailable.

### Service tests

- Create and invite payloads for both identity modes.
- Exact partial status response.
- Removal of unsupported detail and placeholder endpoints.
- All-role pagination.
- Credential delivery query initialization.

### Integration and browser tests

Where existing authenticated fixtures permit:

- create followed by finish later;
- create followed by temporary-password generation;
- invite followed by delivery handoff;
- Teacher row handoff;
- legacy login-email fallback.

### Verification commands

Run:

- targeted Vitest suites;
- full TypeScript typecheck;
- lint on changed files, followed by the repository lint command when viable;
- production build;
- relevant Playwright tests.

If an environment or dependency policy prevents a command, record the exact
blocker and run the closest direct local binary as supporting evidence.

## Acceptance Criteria

The work is complete when:

1. Every Users action maps to a real supported backend operation or a safe
   handoff.
2. The UI no longer claims that placeholder reset/resend operations performed
   delivery.
3. Teacher lifecycle-invalid actions cannot be initiated from Users.
4. Both generated-username and legacy login-email creation modes work.
5. Credential status is shown only where the backend supplies it.
6. User creation and credential provisioning are clearly separate outcomes.
7. All roles needed for display and filtering are loaded.
8. Unsupported or inaccurately typed Users service methods are removed or
   corrected.
9. Temporary passwords remain one-time, transient secrets.
10. English and Arabic behavior and messages remain equivalent.
11. No backend file or API contract is changed.
