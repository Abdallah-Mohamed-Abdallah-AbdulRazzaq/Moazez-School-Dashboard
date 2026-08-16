# Sprint 11 Frontend Contract Audit

Date: 2026-05-12  
Repository: `blackfalc0ns/sis_dashboard`  
Scope: audit only. No product UI was implemented in this stage.

## Executive Summary

The dashboard already has the right structural foundations for Sprint 11: a localized `src/app/[lang]/...` route tree, `next-intl` message files, a dashboard shell with toast/modal/table components, an Axios API client in `src/lib/api.ts`, auth context/provider wiring, and Settings pages guarded by permission checks.

The current implementation is not yet aligned with the Sprint 11 identity and email contracts. Settings Users still treats `email` as the user's personal email/invite address. Sprint 11 changes that model:

- `email` is the generated login email used for authentication.
- `contactEmail` is the user's personal inbox/contact address.
- Temporary passwords are one-time secrets. They must be shown once only and must never be written to logs, browser storage, mock data, analytics payloads, snapshots, or test fixtures.
- SMTP/API secrets must never be shown after save. GET responses should expose only safe flags such as `hasPassword` and `hasApiKey`; the frontend must not render `encryptedPassword`, `encryptedApiKey`, or similar backend secret fields.

## Existing Auth Implementation

### Files Found

- `src/app/providers.tsx`
- `src/app/[lang]/layout.tsx`
- `src/app/[lang]/login/page.tsx`
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/context/AuthProvider.tsx`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/AuthLayout.tsx`
- `src/features/auth/components/AuthBrandPanel.tsx`
- `src/features/auth/components/LanguageSwitcher.tsx`
- `src/features/auth/utils/authValidation.ts`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/types/user.ts`
- `src/lib/token-storage.ts`

### Current Behavior

- `authService.login` calls `POST /auth/login` and stores `accessToken`/`refreshToken` via `tokenStorage`.
- `authService.logout` calls `POST /auth/logout` and clears tokens.
- `authService.getCurrentUser` calls `GET /auth/me`.
- `authService.refreshToken` calls `POST /auth/refresh`.
- `AuthProvider` restores the user from `/auth/me`, redirects anonymous users to `/{locale}/login`, and redirects authenticated users away from `/login` to `/{locale}/dashboard`.
- `LoginForm` submits `email` and `password`, then pushes to `/{locale}/dashboard`.
- Tokens are stored in `localStorage` keys `moazez_access_token` and `moazez_refresh_token`.

### Gaps for Sprint 11

- `src/types/user.ts` does not expose `mustChangePassword`, `username`, `contactEmail`, or credential metadata.
- `src/services/auth-service.ts` does not expose `changePassword`.
- There is no `src/app/[lang]/change-password/page.tsx`.
- There is no `ChangePasswordForm`.
- `AuthProvider` does not route `mustChangePassword` users to a forced change-password flow and does not block dashboard access while the flag is true.
- `LoginForm` still assumes the login identifier is labelled as an ordinary email. Sprint 11 should label this as the generated login email where relevant.
- No route guard exists for the forced password-change exception path.

## Existing API Client Implementation

### Files Found

- `src/lib/api.ts`
- `src/lib/api-error.ts`
- `src/lib/validation-errors.ts`
- `src/lib/token-storage.ts`
- Feature services under `src/features/**/services/*`

### Current Behavior

- `src/lib/api.ts` creates an Axios `apiClient` with base URL from `NEXT_PUBLIC_API_URL`, defaulting to `https://api.moazez.sa/api/v1`.
- Request interceptor attaches the access token from `tokenStorage`.
- Response interceptor refreshes on `401` through `/auth/refresh`, queues concurrent refresh subscribers, updates stored tokens, and wraps Axios failures in `ApiError`.
- Typed helpers exist: `apiGet<T>`, `apiPost<T>`, `apiPut<T>`, `apiPatch<T>`, `apiDelete<T>`.
- Deprecated fetch-style wrappers remain: `api<T>` and `apiWithToken<T>`.

### Gaps for Sprint 11

- Sprint 11 services have not been created for login identity, credentials, email connection, email templates, credential deliveries, delivery monitoring, email campaigns, or student/guardian account linking.
- Existing Settings template/integration code still uses `src/features/settings/services/settingsService.ts`, an in-browser mock/localStorage store, not Sprint 11 backend endpoints.
- `settingsService.ts` currently persists mocked integration configuration including password-like values in localStorage. Future Sprint 11 email connection work must not reuse that persistence pattern for SMTP/API secrets.
- Service functions should use `apiGet/apiPost/apiPut/apiPatch` with request/response TypeScript types for every endpoint.

## Existing Settings Users Implementation

### Files Found

- `src/app/[lang]/(dashboard)/settings/users/page.tsx`
- `src/features/settings/users/pages/SettingsUsersPage.tsx`
- `src/features/settings/components/UserEditorModal.tsx`
- `src/features/settings/services/settingsUsersService.ts`
- `src/features/settings/types/index.ts`

### Current Behavior

- Users list route exists at `/{lang}/settings/users`.
- Page uses `SettingsAccessGuard permission="settings.users.view"`.
- Manage buttons are disabled/hidden through `hasPermission("settings.users.manage")`.
- Data loads through `fetchSettingsUsers`, backed by `GET /settings/users`.
- User creation uses `POST /settings/users` with `{ fullName, email, roleId }`.
- Invite uses `POST /settings/users/invite`.
- Update uses `PATCH /settings/users/:userId` with `{ fullName, roleId }`.
- Status updates use `PATCH /settings/users/:userId/status`.
- Invite resend uses `POST /settings/users/:userId/resend-invite`.
- Password reset placeholder uses `POST /settings/users/:userId/reset-password`.
- `SettingsUserRecord` and `SettingsUserPayloadDto` only include `fullName`, `email`, `roleId`, status/invite timestamps, and last active time.

### Gaps for Sprint 11

- User types do not include `username`, `contactEmail`, `mustChangePassword`, `hasPassword`, `passwordProvisionedAt`, `passwordChangedAt`, or `credentialVersion`.
- The table labels and export columns call `email` simply "Email"; Sprint 11 must distinguish generated login email from personal contact email.
- `UserEditorModal` collects `email` as if it were personal email. Sprint 11 creation should prefer `fullName`, `username`, `contactEmail`, and `roleId`, then preview the generated login email.
- Existing invite/password-reset flows do not model temporary password generation, one-time reveal, credential versioning, or credential delivery.
- `UserEditorModal` currently contains `console.log(errors)`. It is not logging a password today, but Sprint 11 credential work should remove debug logging before any secret-bearing fields are introduced.
- Error handling has generic validation support but does not map Sprint 11 identity-specific errors such as `iam.user.email_taken` or username availability failures.

## Existing Settings Navigation and Permissions

### Files Found

- `src/config/navigation.ts`
- `src/config/permissions.ts`
- `src/features/settings/constants/permissions.ts`
- `src/features/settings/constants/defaults.ts`
- `src/hooks/usePermissions.ts`
- `src/features/settings/components/SettingsAccessGuard.tsx`
- `src/components/navigation/GuardedLink.tsx`
- Dashboard shell: `src/app/[lang]/(dashboard)/layout.tsx`

### Current Behavior

- Settings navigation already has Overview, Branding, Users, Roles, Policies, Admissions Documents, Notification Templates, Integrations, Security & Audit, and Backup.
- `PermissionKey` already includes:
  - `settings.users.view`
  - `settings.users.manage`
  - `settings.security.view`
  - `settings.security.manage`
- `SettingsAccessGuard` shows a translated no-access state.
- Current settings permissions also include legacy/template/integration-specific keys such as `settings.templates.*` and `settings.integrations.*`.

### Gaps for Sprint 11

- Navigation has no entries for:
  - Login Identity
  - Credentials
  - Email Connection
  - Email Templates under Sprint 11 backend
  - Credential Deliveries
  - Email Deliveries
  - Email Campaigns
- If nested Settings > Email navigation is not supported well by `SideBarTopNav`, add flat settings children as an implementation compromise.
- Sprint 11 should use `settings.users.view/manage` for Users, Login Identity, and Credentials, and `settings.security.view/manage` for Email Connection/Templates/Deliveries/Campaigns.
- `settings.templates.*` and `settings.integrations.*` should not be used for Sprint 11 email foundation unless the backend explicitly keeps them. The prompt-level contract says to respect `settings.security.*`.

## Existing Translation Files

### Files Found

- `src/messages/en.json`
- `src/messages/ar.json`

### Current Keys

Relevant existing namespaces:

- `auth.login`
- `settings.access`
- `settings.users`
- `settings.roles`
- `settings.templates`
- `settings.integrations`
- `settings.security`
- `settings.export`
- `common`

### Keys Needed for Sprint 11

Add matching English and Arabic keys for:

- `auth.changePassword`: title, subtitle, current password, new password, confirm password, show/hide labels, validation errors, success, failure, submitting.
- `settings.loginIdentity`: domain, username preview, generated login email, validation, save success/failure, empty/loading states.
- `settings.users`: username, login email, contact email, has password, must change password, password provisioned/changed dates, credential version, username availability, generated login email preview, identity-specific validation messages.
- `settings.credentials`: page title/subtitle, filters, table columns, generate/set/regenerate actions, bulk generate, one-time password reveal warning, copy success, modal validation, credential metadata labels.
- `settings.email.connection`: connection status, provider fields, safe secret labels, has password/API key indicators, test recipient, activate/disable/test/update states and errors.
- `settings.email.templates`: template key tabs, template fields, preview modal, reset default, unknown/missing variables, credential-variable restrictions.
- `settings.email.credentialDeliveries`: wizard steps, audience options, credential modes, preview recipient states, skipped reasons, safety warnings.
- `settings.email.deliveries`: list/detail columns, recipient table, filters, cancel action, status labels.
- `settings.email.campaigns`: composer, audience, custom emails, campaign preview, credential-variable rejection, list/detail labels.
- `students_guardians.accountLinking`: student and guardian account linking actions, username/contact email fields, generated login email preview, one-time temporary password reveal.
- Navigation labels for all new Settings routes in both languages.

## Sprint 11 Module Mapping

| Backend module | Current frontend surface | Required frontend route(s) | Required service/type files | Permissions |
| --- | --- | --- | --- | --- |
| auth | Login exists; no forced password-change flow | `src/app/[lang]/change-password/page.tsx` | update `src/types/user.ts`, `src/services/auth-service.ts`, `src/features/auth/context/AuthContext.tsx`, `src/features/auth/context/AuthProvider.tsx`; create `src/features/auth/components/ChangePasswordForm.tsx` | authenticated user; dashboard must be blocked while `mustChangePassword` is true |
| settings-users | Users page and service exist but email-based | existing `src/app/[lang]/(dashboard)/settings/users/page.tsx` | update `src/features/settings/users/pages/SettingsUsersPage.tsx`, `src/features/settings/components/UserEditorModal.tsx`, `src/features/settings/services/settingsUsersService.ts`, `src/features/settings/types/index.ts` | view: `settings.users.view`; manage: `settings.users.manage` |
| settings-login-identity | Missing | `src/app/[lang]/(dashboard)/settings/login-identity/page.tsx` | create `src/features/settings/login-identity/types.ts`, `src/features/settings/login-identity/services/loginIdentityService.ts`, `src/features/settings/login-identity/pages/LoginIdentityPage.tsx`, `src/features/settings/login-identity/components/LoginIdentityForm.tsx`, `src/features/settings/login-identity/components/UsernamePreviewCard.tsx` | view: `settings.users.view`; manage: `settings.users.manage` |
| settings-user-credentials | Missing | `src/app/[lang]/(dashboard)/settings/credentials/page.tsx` | create `src/features/settings/credentials/types.ts`, `src/features/settings/credentials/services/credentialsService.ts`, `src/features/settings/credentials/pages/CredentialsPage.tsx`, credential modals/table components | view: `settings.users.view`; manage: `settings.users.manage` |
| settings-email-connection | Generic integrations mock exists, not Sprint 11 | `src/app/[lang]/(dashboard)/settings/email/connection/page.tsx` | create `src/features/settings/email/connection/types.ts`, `src/features/settings/email/connection/services/emailConnectionService.ts`, page/form/status components | view: `settings.security.view`; manage: `settings.security.manage` |
| settings-email-templates | Notification Templates mock page exists, not Sprint 11 email templates | `src/app/[lang]/(dashboard)/settings/email/templates/page.tsx` | create `src/features/settings/email/templates/types.ts`, service, page, key tabs, editor, preview modal | view/preview: `settings.security.view`; update/reset: `settings.security.manage` |
| settings-email-credential-deliveries | Missing | `src/app/[lang]/(dashboard)/settings/email/credential-deliveries/page.tsx` | create types/service/page/wizard components under `src/features/settings/email/credential-deliveries/` | preview: `settings.security.view`; create: `settings.security.manage` |
| settings-email-deliveries | Missing | `src/app/[lang]/(dashboard)/settings/email/deliveries/page.tsx`; `src/app/[lang]/(dashboard)/settings/email/deliveries/[batchId]/page.tsx` | create types/service/list/detail pages and delivery batch/recipient tables under `src/features/settings/email/deliveries/` | view: `settings.security.view`; cancel: `settings.security.manage` |
| settings-email-campaigns | Missing | `src/app/[lang]/(dashboard)/settings/email/campaigns/page.tsx`; `src/app/[lang]/(dashboard)/settings/email/campaigns/[batchId]/page.tsx` | create types/service/list/detail/composer/preview components under `src/features/settings/email/campaigns/` | preview/list/detail: `settings.security.view`; create: `settings.security.manage` |
| student/guardian account linking actions | Students and guardians routes exist; account linking missing | existing student/guardian list/detail routes | create `src/features/students-guardians/services/accountLinkingService.ts`, `StudentAccountLinkModal.tsx`, `GuardianAccountLinkModal.tsx`; update student/guardian pages/actions | likely same existing student/guardian management permissions; verify backend before implementation |

## Exact API Endpoints to Integrate

### Auth

- `POST /auth/login` (already integrated)
- `POST /auth/logout` (already integrated)
- `POST /auth/refresh` (already integrated)
- `GET /auth/me` (already integrated)
- `POST /auth/change-password` (missing)

### Login Identity

- `GET /settings/login-identity`
- `PUT /settings/login-identity`
- `GET /settings/login-identity/preview?username=...`
- `GET /settings/users/usernames/available?username=...`

### Settings Users

- `GET /settings/users` (already integrated; needs Sprint 11 shape)
- `POST /settings/users` (already integrated; payload must move to username/contactEmail model)
- `PATCH /settings/users/:userId` (already integrated; payload must support allowed Sprint 11 fields)
- `PATCH /settings/users/:userId/status` (already integrated)
- `POST /settings/users/invite` (existing; verify whether still part of Sprint 11)
- `POST /settings/users/:userId/resend-invite` (existing; verify whether still part of Sprint 11)
- `POST /settings/users/:userId/reset-password` (existing placeholder; likely superseded by credential endpoints)

### User Credentials

- `GET /settings/users/credentials/status`
- `POST /settings/users/credentials/bulk-preview`
- `POST /settings/users/credentials/bulk-generate`
- `POST /settings/users/:userId/credentials/generate`
- `POST /settings/users/:userId/credentials/set`
- `POST /settings/users/:userId/credentials/regenerate`

### Email Connection

- `GET /settings/email/connection`
- `PUT /settings/email/connection`
- `POST /settings/email/connection/test`
- `POST /settings/email/connection/activate`
- `POST /settings/email/connection/disable`

### Email Templates

- `GET /settings/email/templates`
- `GET /settings/email/templates/:key`
- `PUT /settings/email/templates/:key`
- `POST /settings/email/templates/:key/preview`
- `POST /settings/email/templates/:key/reset-default`

### Credential Deliveries

- `POST /settings/email/credential-deliveries/preview-recipients`
- `POST /settings/email/credential-deliveries`

### Delivery Monitoring

- `GET /settings/email/deliveries`
- `GET /settings/email/deliveries/:batchId`
- `GET /settings/email/deliveries/:batchId/recipients`
- `POST /settings/email/deliveries/:batchId/cancel`

### Email Campaigns

- `POST /settings/email/campaigns/preview-recipients`
- `POST /settings/email/campaigns/preview`
- `POST /settings/email/campaigns`
- `GET /settings/email/campaigns`
- `GET /settings/email/campaigns/:batchId`

### Student/Guardian Account Linking

- `POST /students-guardians/students/:studentId/account`
- `POST /students-guardians/guardians/:guardianId/account`

## Exact Frontend Files to Create or Change

### Create

- `src/app/[lang]/change-password/page.tsx`
- `src/features/auth/components/ChangePasswordForm.tsx`
- `src/app/[lang]/(dashboard)/settings/login-identity/page.tsx`
- `src/features/settings/login-identity/types.ts`
- `src/features/settings/login-identity/services/loginIdentityService.ts`
- `src/features/settings/login-identity/pages/LoginIdentityPage.tsx`
- `src/features/settings/login-identity/components/LoginIdentityForm.tsx`
- `src/features/settings/login-identity/components/UsernamePreviewCard.tsx`
- `src/app/[lang]/(dashboard)/settings/credentials/page.tsx`
- `src/features/settings/credentials/types.ts`
- `src/features/settings/credentials/services/credentialsService.ts`
- `src/features/settings/credentials/pages/CredentialsPage.tsx`
- `src/features/settings/credentials/components/CredentialStatusTable.tsx`
- `src/features/settings/credentials/components/GenerateCredentialModal.tsx`
- `src/features/settings/credentials/components/SetPasswordModal.tsx`
- `src/features/settings/credentials/components/BulkGenerateCredentialsModal.tsx`
- `src/features/settings/credentials/components/TemporaryPasswordRevealModal.tsx`
- `src/app/[lang]/(dashboard)/settings/email/connection/page.tsx`
- `src/features/settings/email/connection/types.ts`
- `src/features/settings/email/connection/services/emailConnectionService.ts`
- `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- `src/features/settings/email/connection/components/EmailConnectionForm.tsx`
- `src/features/settings/email/connection/components/EmailConnectionStatusCard.tsx`
- `src/app/[lang]/(dashboard)/settings/email/templates/page.tsx`
- `src/features/settings/email/templates/types.ts`
- `src/features/settings/email/templates/services/emailTemplatesService.ts`
- `src/features/settings/email/templates/pages/EmailTemplatesPage.tsx`
- `src/features/settings/email/templates/components/TemplateKeyTabs.tsx`
- `src/features/settings/email/templates/components/TemplateEditor.tsx`
- `src/features/settings/email/templates/components/TemplatePreviewModal.tsx`
- `src/app/[lang]/(dashboard)/settings/email/credential-deliveries/page.tsx`
- `src/features/settings/email/credential-deliveries/types.ts`
- `src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts`
- `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryAudienceStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryModeStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep.tsx`
- `src/app/[lang]/(dashboard)/settings/email/deliveries/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/deliveries/[batchId]/page.tsx`
- `src/features/settings/email/deliveries/types.ts`
- `src/features/settings/email/deliveries/services/emailDeliveriesService.ts`
- `src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx`
- `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- `src/features/settings/email/deliveries/components/DeliveryBatchTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryRecipientTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryStatusBadge.tsx`
- `src/app/[lang]/(dashboard)/settings/email/campaigns/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/campaigns/[batchId]/page.tsx`
- `src/features/settings/email/campaigns/types.ts`
- `src/features/settings/email/campaigns/services/emailCampaignsService.ts`
- `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- `src/features/settings/email/campaigns/pages/EmailCampaignDetailPage.tsx`
- `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- `src/features/settings/email/campaigns/components/CampaignAudienceStep.tsx`
- `src/features/settings/email/campaigns/components/CampaignPreviewModal.tsx`
- `src/features/students-guardians/services/accountLinkingService.ts`
- `src/features/students-guardians/students/components/StudentAccountLinkModal.tsx`
- `src/features/students-guardians/guardians/components/GuardianAccountLinkModal.tsx`

### Change

- `src/types/user.ts`
- `src/services/auth-service.ts`
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/context/AuthProvider.tsx`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/settings/types/index.ts`
- `src/features/settings/services/settingsUsersService.ts`
- `src/features/settings/users/pages/SettingsUsersPage.tsx`
- `src/features/settings/components/UserEditorModal.tsx`
- `src/config/navigation.ts`
- `src/config/permissions.ts`
- `src/features/settings/constants/permissions.ts`
- `src/features/settings/constants/defaults.ts`
- `src/hooks/usePermissions.ts`
- `src/messages/en.json`
- `src/messages/ar.json`
- Student list/detail pages under `src/app/[lang]/(dashboard)/students-guardians/students...` and/or feature pages under `src/features/students-guardians/students/...`
- Guardian list/detail pages under `src/app/[lang]/(dashboard)/students-guardians/guardians...` and/or feature pages under `src/features/students-guardians/guardians/...`

## Security and Product Risks

### Temporary Passwords

- Temporary passwords must be treated as one-time response fields only.
- The frontend may hold a temporary password in React state only long enough to display it in a one-time reveal modal.
- Clear password state when the modal closes, when navigation changes, and after successful copy/dismiss flows where appropriate.
- Never write temporary passwords to `console.log`, `console.warn`, `console.error`, `localStorage`, `sessionStorage`, IndexedDB, mock stores, exported data, analytics/event payloads, screenshots, snapshots, or tests.
- Credential delivery should usually rely on email delivery and should not display raw temporary passwords unless the backend explicitly returns one.

### `email` vs `contactEmail`

- Sprint 11 must consistently treat `email` as the generated login email.
- Sprint 11 must consistently treat `contactEmail` as the personal inbox/contact email.
- The current Settings Users UI and exports call `email` simply "Email"; this is risky because admins may overwrite or misunderstand login identity.
- User creation/editing should not blindly edit generated login email unless the backend explicitly supports it.
- Exports must include separate `username`, `email`/login email, and `contactEmail` columns.

### SMTP/API Secrets

- Do not reuse the existing mock integration persistence pattern for Sprint 11 email connection secrets.
- `GET /settings/email/connection` must be typed to return safe fields only, including flags such as `hasPassword` and `hasApiKey`.
- Password/API key inputs should be blank by default.
- Leaving secret fields blank on update should not clear existing backend secrets unless the backend contract explicitly documents that behavior.
- Never render backend encrypted secret fields.

### `mustChangePassword` Routing

- A user with `mustChangePassword: true` must be routed to `/{locale}/change-password` after login.
- A user with `mustChangePassword: true` must not be allowed into dashboard routes until the password is changed.
- After successful change, refresh `/auth/me` or update auth state before redirecting to `/{locale}/dashboard`.
- The change-password route must remain accessible to authenticated users even while dashboard routes are blocked.
- Password values must not be logged or stored.

## Audit-Only Verification Notes

This document was produced without adding UI, routes, services, tests, or Playwright coverage. The required verification commands for this prompt are:

```bash
npm run build
npm run lint
npm run test:run
```

Results should be recorded in the final execution report for this prompt.
