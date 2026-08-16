# Credentials Status Contract Design

## Goal

Align the Credentials page with the existing `GET /settings/users/credentials/status` contract. The page must treat `items[].status` as credential state and must not expose or send an unsupported user-status filter.

## Response Contract

`CredentialStatusRecord.status` uses `CredentialStatusFilter`:

- `missing`
- `set`
- `temporary_or_must_change`
- `must_change`

The record type models the endpoint fields consumed by the page: `userId`, `fullName`, `username`, `loginEmail`, `contactEmail`, `userType`, `roleId`, `roleKey`, `roleName`, `status`, `hasPassword`, `mustChangePassword`, and the optional credential timestamps and version. It does not model `status` as `UserAdminStatus` or depend on a separate `email` field that the endpoint does not return.

## Filters

Remove the Active, Invited, and Inactive filter from the Credentials page. Also remove its local state, active-filter calculation, reset behavior, page-reset dependency, and `UserAdminStatus` import.

`FetchCredentialStatusParams` remains limited to the backend-supported query fields: `roleKey`, `userType`, `credentialStatus`, `search`, `page`, and `limit`. The frontend must not send `status` or `userStatus`.

The existing password filters continue to derive the supported `credentialStatus` query values. Adding a backend user-status filter is outside this change. If introduced later, its explicit contract name should be `userStatus` so it cannot be confused with credential or membership state.

## Status Presentation

The table displays credential states with credential-specific labels and styles. It does not pass these values to `SettingsStatusBadge`, whose contract and translations cover shared administrative statuses such as `active`, `invited`, and `inactive`.

The Credentials translation namespace provides labels for all four credential states in English and Arabic. The table and single-user credential modals read `loginEmail` from the response contract instead of falling back to an absent `email` field.

## Verification

Focused tests cover:

- The credential record type and table accept all four credential status values.
- Credential status values render through credential-specific labels rather than user-status labels.
- Credential status requests serialize `credentialStatus` with the supported search, pagination, role, and user-type fields.
- Credential status requests do not serialize `status` or `userStatus`.
- The Credentials page no longer exposes Active, Invited, or Inactive filtering.

Run the focused Vitest suite, TypeScript typecheck, and lint on the changed files.

## Non-Goals

- Adding or changing backend query support.
- Adding a frontend-only user-status filter.
- Changing membership filtering in the credentials repository.
- Changing credential generation, password setting, regeneration, or bulk-generation behavior.
