# Sprint 11 Frontend Implementation Prompts

Repository: `blackfalc0ns/sis_dashboard`  
Backend API base: `https://api.moazez.sa/api/v1`  
Swagger reference: `https://api.moazez.sa/api/v1/docs#/`  
Backend scope: Moazez Sprint 11 Identity, Credentials, and Email foundation

This file contains staged prompts to send to an implementation AI/Codex agent. Send the prompts **one by one**, in order. Do not merge prompts unless the previous stage is fully verified.

---

## Global implementation rules for every prompt

Use these rules in every implementation stage:

1. Work inside the existing Next.js dashboard structure.
2. Do not rewrite the whole app.
3. Reuse the existing API layer in `src/lib/api.ts`.
4. Reuse the existing auth context, toast system, dashboard layout, settings page components, modal components, and table components where possible.
5. Keep the existing bilingual route structure: `src/app/[lang]/...`.
6. Keep Arabic/English support through `next-intl`.
7. Do not hardcode temporary passwords into logs, browser storage, mock data, analytics, or tests.
8. Do not store SMTP/API secrets in frontend state after save except as form input before submission.
9. Do not show encrypted backend secrets. Show only flags such as `hasPassword` and `hasApiKey`.
10. Use TypeScript types for every request and response.
11. Add loading, empty, success, error, and validation states for every screen.
12. Respect backend permissions:
    - `settings.users.view`
    - `settings.users.manage`
    - `settings.security.view`
    - `settings.security.manage`
13. Do not implement deferred backend cores such as Schedule, Homework, Pickup, Notification Center, Applicant Portal, or Add Child.
14. After each prompt, run:

```bash
npm run build
npm run lint
npm run test:run
```

15. If Playwright tests are changed or added, run:

```bash
npm run test:e2e
```

16. Return a report with:

```text
Execution Summary
Files Changed
Routes Added
API Endpoints Integrated
Security Notes
Verification Commands Run
Pass/Fail Result
Known Limitations
```

---

# Prompt 01 — Sprint 11 Frontend Contract Audit

```text
You are working in the `blackfalc0ns/sis_dashboard` Next.js repository.

Task: perform a frontend contract audit for Sprint 11 backend support before writing product UI.

Backend Sprint 11 modules to support:
1. auth
2. settings-users
3. settings-login-identity
4. settings-user-credentials
5. settings-email-connection
6. settings-email-templates
7. settings-email-credential-deliveries
8. settings-email-deliveries
9. settings-email-campaigns
10. student/guardian account linking actions

Inspect the existing repo and produce a Markdown audit document at:

`docs/sprint11-frontend-contract-audit.md`

The audit must include:
- Existing auth implementation files and gaps.
- Existing API client implementation files and gaps.
- Existing settings users implementation files and gaps.
- Existing settings navigation and permission implementation files and gaps.
- Existing translation files and where new keys must be added.
- Exact frontend files that must be created or changed for Sprint 11.
- Exact API endpoints to integrate.
- Risks around temporary passwords, contactEmail vs login email, SMTP secrets, and mustChangePassword routing.

Do not implement UI in this prompt. This is an audit/documentation-only stage.

Acceptance criteria:
- `docs/sprint11-frontend-contract-audit.md` exists.
- It maps all Sprint 11 backend modules to frontend routes/services/components.
- It clearly states that `email` is the generated login email and `contactEmail` is the personal inbox.
- It clearly states that temporary passwords must be shown once only and never stored.
- `npm run build`, `npm run lint`, and `npm run test:run` pass or any existing unrelated failures are documented with evidence.
```

---

# Prompt 02 — Shared Sprint 11 Types and API Services

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: add the shared TypeScript types and API service layer for Sprint 11 without building UI yet.

Use the existing API helpers from `src/lib/api.ts`.

Create or update the following files:

1. `src/features/settings/login-identity/types.ts`
2. `src/features/settings/login-identity/services/loginIdentityService.ts`
3. `src/features/settings/credentials/types.ts`
4. `src/features/settings/credentials/services/credentialsService.ts`
5. `src/features/settings/email/connection/types.ts`
6. `src/features/settings/email/connection/services/emailConnectionService.ts`
7. `src/features/settings/email/templates/types.ts`
8. `src/features/settings/email/templates/services/emailTemplatesService.ts`
9. `src/features/settings/email/credential-deliveries/types.ts`
10. `src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts`
11. `src/features/settings/email/deliveries/types.ts`
12. `src/features/settings/email/deliveries/services/emailDeliveriesService.ts`
13. `src/features/settings/email/campaigns/types.ts`
14. `src/features/settings/email/campaigns/services/emailCampaignsService.ts`
15. Update `src/features/settings/types/index.ts` only where shared user types are needed.
16. Update `src/types/user.ts` for Sprint 11 login response fields if needed.
17. Update `src/services/auth-service.ts` to expose `changePassword` but do not create UI yet.

Required endpoints:

Auth:
- `POST /auth/change-password`

Login identity:
- `GET /settings/login-identity`
- `PUT /settings/login-identity`
- `GET /settings/login-identity/preview?username=...`
- `GET /settings/users/usernames/available?username=...`

Settings users:
- Keep existing users service, but prepare types for `username`, `contactEmail`, `loginEmail/email`, `mustChangePassword`, `passwordProvisionedAt`, and `credentialVersion`.

Credentials:
- `GET /settings/users/credentials/status`
- `POST /settings/users/credentials/bulk-preview`
- `POST /settings/users/credentials/bulk-generate`
- `POST /settings/users/:userId/credentials/generate`
- `POST /settings/users/:userId/credentials/set`
- `POST /settings/users/:userId/credentials/regenerate`

Email connection:
- `GET /settings/email/connection`
- `PUT /settings/email/connection`
- `POST /settings/email/connection/test`
- `POST /settings/email/connection/activate`
- `POST /settings/email/connection/disable`

Email templates:
- `GET /settings/email/templates`
- `GET /settings/email/templates/:key`
- `PUT /settings/email/templates/:key`
- `POST /settings/email/templates/:key/preview`
- `POST /settings/email/templates/:key/reset-default`

Credential delivery:
- `POST /settings/email/credential-deliveries/preview-recipients`
- `POST /settings/email/credential-deliveries`

Delivery monitoring:
- `GET /settings/email/deliveries`
- `GET /settings/email/deliveries/:batchId`
- `GET /settings/email/deliveries/:batchId/recipients`
- `POST /settings/email/deliveries/:batchId/cancel`

Campaigns:
- `POST /settings/email/campaigns/preview-recipients`
- `POST /settings/email/campaigns/preview`
- `POST /settings/email/campaigns`
- `GET /settings/email/campaigns`
- `GET /settings/email/campaigns/:batchId`

Security requirements:
- Do not persist temporary passwords in token storage, localStorage, sessionStorage, caches, or mock data.
- Services may return temporary passwords from API responses, but only typed as one-time response fields.
- Email connection service must never expect raw saved secrets in GET responses.

Acceptance criteria:
- All new service functions are typed.
- All endpoint paths are correct relative to `src/lib/api.ts` base URL.
- No UI has been added yet except type-safe service exports.
- Build, lint, and tests pass.
```

---

# Prompt 03 — Auth mustChangePassword Flow

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 frontend auth lifecycle for `mustChangePassword`.

Current auth already supports login, logout, refresh, and `/auth/me`. Extend it to support forced password change.

Implement:

1. Update `src/types/user.ts`:
   - Add `mustChangePassword?: boolean` to `LoginResponse.user` or the correct login response shape returned by the backend.
   - Add any needed fields returned from `/auth/me` if the backend exposes `mustChangePassword` there.

2. Update `src/services/auth-service.ts`:
   - Add `changePassword({ currentPassword, newPassword })` using `POST /auth/change-password`.

3. Update `src/features/auth/context/AuthContext.tsx` and `AuthProvider.tsx`:
   - Track whether the current user must change password.
   - After login, if mustChangePassword is true, redirect to `/${locale}/change-password` instead of dashboard.
   - Prevent redirect loops.
   - Do not allow a must-change-password user to continue into dashboard routes until password is changed.

4. Add route:
   - `src/app/[lang]/change-password/page.tsx`

5. Add component:
   - `src/features/auth/components/ChangePasswordForm.tsx`

Form requirements:
- current password
- new password
- confirm new password
- show/hide password toggles
- client validation
- backend validation handling
- success toast
- after success, reload `/auth/me` or update auth state, then redirect to dashboard

Security requirements:
- Do not log passwords.
- Do not store passwords.
- Clear form fields after success.

Acceptance criteria:
- Normal users still login to dashboard.
- Users with `mustChangePassword` are forced to change password.
- `POST /auth/change-password` is integrated.
- Route works in English and Arabic.
- Build, lint, tests pass.
```

---

# Prompt 04 — Login Identity Settings Page

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement the Sprint 11 Login Identity settings page.

Add route:
- `src/app/[lang]/(dashboard)/settings/login-identity/page.tsx`

Add feature files:
- `src/features/settings/login-identity/pages/LoginIdentityPage.tsx`
- `src/features/settings/login-identity/components/LoginIdentityForm.tsx`
- `src/features/settings/login-identity/components/UsernamePreviewCard.tsx`

Use service from Prompt 02:
- `loginIdentityService.ts`

Backend endpoints:
- `GET /settings/login-identity`
- `PUT /settings/login-identity`
- `GET /settings/login-identity/preview?username=...`
- `GET /settings/users/usernames/available?username=...`

UI requirements:
- Show current school login domain.
- Edit login domain.
- Edit username minimum length.
- Edit username maximum length.
- Edit allowed characters text.
- Edit reserved usernames list.
- Edit status if backend supports it.
- Preview username and generated login email.
- Check username availability.
- Show validation errors from backend.
- Show loading/empty/error states.
- Use `SettingsAccessGuard` with `settings.users.view`.
- Manage/save actions require `settings.users.manage`.

Important product rule:
- The generated login email is the login identity.
- Personal inbox must be `contactEmail`, not `email`.

Navigation:
- Add `Login Identity` under Settings in `src/config/navigation.ts`.
- Add Arabic and English labels.

Acceptance criteria:
- Admin can load, edit, save, preview, and check username availability.
- Page is responsive.
- Page is bilingual-ready.
- Build, lint, tests pass.
```

---

# Prompt 05 — Upgrade Settings Users to Sprint 11 Identity Model

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: upgrade the existing Settings Users page from email-based user creation to Sprint 11 username/contactEmail login identity model.

Existing files to modify:
- `src/app/[lang]/(dashboard)/settings/users/page.tsx`
- `src/features/settings/users/pages/SettingsUsersPage.tsx`
- `src/features/settings/components/UserEditorModal.tsx`
- `src/features/settings/services/settingsUsersService.ts`
- `src/features/settings/types/index.ts`

Backend rules:
- `User.email` is the generated login email.
- `User.username` is the school-owned username.
- `User.contactEmail` is the personal/contact inbox.
- User creation should submit `fullName`, `username`, `contactEmail`, and `roleId` when login identity is configured.
- Legacy email-only compatibility may still exist, but the dashboard should prefer Sprint 11 flow.

Required UI changes:
1. User table must display:
   - Full name
   - Username
   - Login email
   - Contact email
   - Role
   - Status
   - Last active
   - Credential status if available from user list or credentials endpoint

2. Create/invite modal must include:
   - Full name
   - Username
   - Generated login email preview
   - Contact email
   - Role

3. Edit modal:
   - Allow editing full name, contact email, and role.
   - Do not blindly edit generated login email unless backend explicitly supports it.

4. Username behavior:
   - Use login identity preview endpoint while typing username.
   - Use username availability endpoint before submit or on blur.
   - Show generated login email clearly.

5. Error handling:
   - Handle `iam.user.email_taken`.
   - Handle `iam.user.username_taken`.
   - Handle `validation.failed`.

6. Export:
   - Include username, login email, and contact email in exported data.

7. Remove or hide old assumption that `email` means personal email.

Acceptance criteria:
- Creating a user uses username + contactEmail.
- Generated login email is visible before create.
- Existing user list remains paginated and filterable.
- Old functions do not break existing users.
- Build, lint, tests pass.
```

---

# Prompt 06 — User Credentials Management Page

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 user credential management UI.

Add route:
- `src/app/[lang]/(dashboard)/settings/credentials/page.tsx`

Add feature files:
- `src/features/settings/credentials/pages/CredentialsPage.tsx`
- `src/features/settings/credentials/components/CredentialStatusTable.tsx`
- `src/features/settings/credentials/components/GenerateCredentialModal.tsx`
- `src/features/settings/credentials/components/SetPasswordModal.tsx`
- `src/features/settings/credentials/components/BulkGenerateCredentialsModal.tsx`
- `src/features/settings/credentials/components/TemporaryPasswordRevealModal.tsx`

Backend endpoints:
- `GET /settings/users/credentials/status`
- `POST /settings/users/:userId/credentials/generate`
- `POST /settings/users/:userId/credentials/set`
- `POST /settings/users/:userId/credentials/regenerate`
- `POST /settings/users/credentials/bulk-preview`
- `POST /settings/users/credentials/bulk-generate`

UI requirements:
- Credential status table with search/filter.
- Show user name, username/login email, contact email, role, status, has password, mustChangePassword, passwordProvisionedAt, passwordChangedAt, credentialVersion.
- Actions per user:
  - Generate temporary password
  - Set custom password
  - Regenerate temporary password
- Bulk actions:
  - Bulk preview
  - Bulk generate
- Temporary passwords must be shown in a one-time reveal modal.
- Provide copy button.
- Provide explicit warning that the password will not be shown again.
- Clear temporary password state after modal close.

Security hard gates:
- No console.log for temporary passwords.
- No persistence of temporary passwords.
- No localStorage/sessionStorage use for temporary passwords.
- No analytics/event payload containing temporary passwords.
- Tests must not snapshot real temporary passwords.

Navigation:
- Add `Credentials` under Settings.

Acceptance criteria:
- Single generate/set/regenerate flows work.
- Bulk preview and bulk generate flows work.
- Temporary password handling is one-time and safe.
- Build, lint, tests pass.
```

---

# Prompt 07 — School Email Connection Page

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 School Email Connection page.

Add route:
- `src/app/[lang]/(dashboard)/settings/email/connection/page.tsx`

Add files:
- `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- `src/features/settings/email/connection/components/EmailConnectionForm.tsx`
- `src/features/settings/email/connection/components/EmailConnectionStatusCard.tsx`

Backend endpoints:
- `GET /settings/email/connection`
- `PUT /settings/email/connection`
- `POST /settings/email/connection/test`
- `POST /settings/email/connection/activate`
- `POST /settings/email/connection/disable`

UI fields:
- providerType
- fromName
- fromEmail
- replyToEmail
- host
- port
- secure
- username
- password
- apiKey
- test recipient email

UI states:
- DRAFT
- VERIFIED
- ACTIVE
- DISABLED
- FAILED

Security rules:
- GET response must not expect raw saved password or apiKey.
- Show only `hasPassword` and `hasApiKey` indicators.
- Password/API key inputs should be blank by default.
- If user leaves secret fields blank while updating, do not accidentally clear existing secret unless backend contract explicitly says so.
- Never render encryptedPassword or encryptedApiKey.

Permissions:
- View requires `settings.security.view`.
- Update/test/activate/disable requires `settings.security.manage`.

Navigation:
- Add Email > Connection route under Settings, or add a flat Settings child if nested sidebar support is limited.

Acceptance criteria:
- Admin can view, update, test, activate, and disable email connection.
- Secret display is safe.
- Build, lint, tests pass.
```

---

# Prompt 08 — School Email Templates Page

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 School Email Templates page.

Add route:
- `src/app/[lang]/(dashboard)/settings/email/templates/page.tsx`

Add files:
- `src/features/settings/email/templates/pages/EmailTemplatesPage.tsx`
- `src/features/settings/email/templates/components/TemplateKeyTabs.tsx`
- `src/features/settings/email/templates/components/TemplateEditor.tsx`
- `src/features/settings/email/templates/components/TemplatePreviewModal.tsx`

Backend endpoints:
- `GET /settings/email/templates`
- `GET /settings/email/templates/:key`
- `PUT /settings/email/templates/:key`
- `POST /settings/email/templates/:key/preview`
- `POST /settings/email/templates/:key/reset-default`

Template keys:
- `ACCOUNT_CREDENTIALS`
- `PASSWORD_RESET`
- `GENERAL_MESSAGE`

Editor fields:
- subject
- preheader
- title
- subtitle
- bodyHtml
- bodyText
- footerHtml
- supportEmail
- supportPhone
- socialLinks.website
- socialLinks.facebook
- socialLinks.instagram
- socialLinks.x
- isActive

Preview requirements:
- Allow preview data JSON editing.
- Render preview result in modal.
- Show unknown variables.
- Show missing variables.
- Do not send email during preview.

Safety rules:
- Credential variables are allowed only in credential templates where backend allows them.
- Do not use general campaign preview to leak credential variables.

Permissions:
- View/list/preview requires `settings.security.view`.
- Update/reset requires `settings.security.manage`.

Acceptance criteria:
- Admin can edit, preview, save, and reset templates.
- Validation errors are visible.
- Build, lint, tests pass.
```

---

# Prompt 09 — Credential Delivery Wizard

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 Credential Delivery wizard.

Add route:
- `src/app/[lang]/(dashboard)/settings/email/credential-deliveries/page.tsx`

Add files:
- `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryAudienceStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryModeStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep.tsx`

Backend endpoints:
- `POST /settings/email/credential-deliveries/preview-recipients`
- `POST /settings/email/credential-deliveries`

Wizard steps:
1. Select audience.
2. Select template key, default `ACCOUNT_CREDENTIALS`.
3. Select credential mode.
4. Configure contact email requirements.
5. Preview recipients.
6. Confirm and create delivery batch.

Credential modes:
- `LOGIN_INFO_ONLY`
- `GENERATE_TEMPORARY_PASSWORD`
- `REGENERATE_TEMPORARY_PASSWORD`

Audience options:
- selected users
- role
- user type
- missing password
- must change password
- all school

Safety warnings:
- For `GENERATE_TEMPORARY_PASSWORD`, warn that temporary passwords are generated during delivery.
- For `REGENERATE_TEMPORARY_PASSWORD`, warn that existing passwords may be replaced.
- Warn that if SMTP fails after credential change, admin recovery is regenerate/resend.

Recipient preview must show:
- eligible count
- skipped count
- sample eligible recipients
- sample skipped recipients
- skip reasons

Permissions:
- Preview requires `settings.security.view`.
- Create requires `settings.security.manage`.

Acceptance criteria:
- Wizard can preview recipients and create a queued batch.
- No raw temporary password is displayed in this wizard unless backend explicitly returns it; credential delivery should rely on email delivery.
- Build, lint, tests pass.
```

---

# Prompt 10 — Email Delivery Monitoring Pages

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 Email Delivery Monitoring pages.

Add routes:
- `src/app/[lang]/(dashboard)/settings/email/deliveries/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/deliveries/[batchId]/page.tsx`

Add files:
- `src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx`
- `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- `src/features/settings/email/deliveries/components/DeliveryBatchTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryRecipientTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryStatusBadge.tsx`

Backend endpoints:
- `GET /settings/email/deliveries`
- `GET /settings/email/deliveries/:batchId`
- `GET /settings/email/deliveries/:batchId/recipients`
- `POST /settings/email/deliveries/:batchId/cancel`

Filters:
- kind: `CREDENTIAL_DELIVERY` or `GENERAL_CAMPAIGN`
- status: `QUEUED`, `PROCESSING`, `SUCCEEDED`, `PARTIAL_FAILED`, `FAILED`, `CANCELLED`
- page
- limit

Batch list columns:
- kind
- status
- subject/title if available
- total recipients
- queued count
- sent count
- failed count
- skipped count
- cancelled count
- created at
- actions

Detail page:
- batch summary
- recipient table
- recipient status
- recipient email if backend returns it safely
- failure reason
- cancel button if cancellable

Security:
- Do not expose raw temporary passwords.
- Do not try to reconstruct passwords from delivery metadata.

Permissions:
- View requires `settings.security.view`.
- Cancel requires `settings.security.manage`.

Acceptance criteria:
- Admin can list, filter, open, inspect recipients, and cancel cancellable batches.
- Build, lint, tests pass.
```

---

# Prompt 11 — General Email Campaigns

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: implement Sprint 11 General Email Campaigns UI.

Add routes:
- `src/app/[lang]/(dashboard)/settings/email/campaigns/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/campaigns/[batchId]/page.tsx`

Add files:
- `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- `src/features/settings/email/campaigns/pages/EmailCampaignDetailPage.tsx`
- `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- `src/features/settings/email/campaigns/components/CampaignAudienceStep.tsx`
- `src/features/settings/email/campaigns/components/CampaignPreviewModal.tsx`

Backend endpoints:
- `POST /settings/email/campaigns/preview-recipients`
- `POST /settings/email/campaigns/preview`
- `POST /settings/email/campaigns`
- `GET /settings/email/campaigns`
- `GET /settings/email/campaigns/:batchId`

Composer requirements:
- Select audience.
- Add optional custom emails.
- Select or use `GENERAL_MESSAGE` template.
- Edit subject.
- Edit title.
- Edit bodyHtml.
- Edit bodyText if supported.
- Preview recipients.
- Preview rendered campaign.
- Create campaign.

Hard safety rule:
- General campaigns must reject credential-only variables such as `{{credential.temporaryPassword}}` before submit, even if backend also rejects them.
- Show user-friendly error explaining credential variables are only allowed for credential delivery templates.

Important product rule:
- Email campaigns are external delivery only.
- Do not connect them to in-app Communication Announcements or Notification Center.

Permissions:
- Preview/list/detail requires `settings.security.view`.
- Create requires `settings.security.manage`.

Acceptance criteria:
- Admin can preview and create general campaign.
- Campaign list/detail works.
- Credential variables are blocked.
- Build, lint, tests pass.
```

---

# Prompt 12 — Student and Guardian Account Linking UI

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: add Sprint 11 student/guardian account linking actions to the existing Students & Guardians area.

Backend endpoints from Sprint 11 guide:
- `POST /students-guardians/students/:studentId/account`
- `POST /students-guardians/guardians/:guardianId/account`

Find the existing students and guardians list/detail pages in the repo. Add account-linking actions without rewriting those modules.

Add services:
- `src/features/students-guardians/services/accountLinkingService.ts`

Add components:
- `src/features/students-guardians/students/components/StudentAccountLinkModal.tsx`
- `src/features/students-guardians/guardians/components/GuardianAccountLinkModal.tsx`

Student modal requirements:
- mode: create or link existing if backend supports both
- username
- contactEmail
- temporaryPasswordMode: generate if selected
- show generated login email preview using login identity service
- show one-time temporary password if API returns one

Guardian modal requirements:
- mode: create or link existing if backend supports both
- username
- contactEmail optional if guardian already has email on record
- temporaryPasswordMode: generate if selected
- show generated login email preview
- show one-time temporary password if API returns one

Security:
- If a temporary password is returned, show once and never persist.
- Do not log generated passwords.

Acceptance criteria:
- Student list/detail has account action.
- Guardian list/detail has account action.
- Account linking uses backend endpoint.
- Build, lint, tests pass.
```

---

# Prompt 13 — Navigation, Translations, and Permissions Finalization

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: finalize navigation, translations, and permission handling for all Sprint 11 frontend pages.

Update:
- `src/config/navigation.ts`
- `src/hooks/usePermissions.ts`
- English translation files
- Arabic translation files
- Any settings overview cards that should link to new Sprint 11 pages

Required Settings navigation structure:

Settings & Integrations:
- Overview
- Branding & Profile
- Users
- Login Identity
- Credentials
- Roles & Permissions
- Email Connection
- Email Templates
- Credential Delivery
- Email Deliveries
- Email Campaigns
- Security & Audit
- Backup & Migration

If nested sidebar groups are safe, place email items under an Email subgroup. If not, keep them flat under Settings.

Permission mapping:
- Users and Login Identity: `settings.users.view`, `settings.users.manage`
- Credentials: `settings.users.view`, `settings.users.manage`
- Email connection/templates/deliveries/campaigns: `settings.security.view`, `settings.security.manage`

Translation requirements:
- Add English and Arabic labels for every new sidebar item.
- Add page titles, subtitles, button labels, status labels, warnings, error messages, empty states, and validation messages.
- Do not leave hardcoded English inside Arabic route pages except technical enum values.

Acceptance criteria:
- Sidebar shows correct links based on permissions.
- Pages do not crash when permission is missing.
- Arabic and English routes render correctly.
- Build, lint, tests pass.
```

---

# Prompt 14 — Unit and E2E Test Coverage

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: add focused tests for Sprint 11 frontend behavior.

Use the existing test stack:
- Vitest for unit/component tests.
- Playwright for E2E where appropriate.

Required unit/component tests:
1. LoginForm redirects mustChangePassword users to change-password route.
2. ChangePasswordForm validates matching passwords and calls `/auth/change-password` service.
3. LoginIdentityForm previews generated login email and handles unavailable username.
4. UserEditorModal submits username + contactEmail, not personal email as login email.
5. TemporaryPasswordRevealModal clears password on close.
6. EmailConnectionForm does not display raw saved secrets.
7. CampaignComposer blocks `{{credential.temporaryPassword}}` in general campaigns.

Required service tests:
1. loginIdentityService endpoint paths.
2. credentialsService endpoint paths.
3. emailConnectionService endpoint paths.
4. emailTemplatesService endpoint paths.
5. credentialDeliveryService endpoint paths.
6. emailDeliveriesService endpoint paths.
7. emailCampaignsService endpoint paths.

Required E2E smoke test if feasible:
- Admin login.
- Open Settings > Login Identity.
- Open Settings > Users.
- Open Settings > Credentials.
- Open Settings > Email Connection.
- Open Settings > Email Templates.
- Open Settings > Email Deliveries.
- Open Settings > Email Campaigns.

Security tests:
- Assert temporary password is not written to localStorage/sessionStorage.
- Assert temporary password is removed from UI state after modal close.

Acceptance criteria:
- `npm run test:run` passes.
- `npm run test:e2e` passes if E2E added.
- Existing tests are not weakened or deleted just to pass.
```

---

# Prompt 15 — Final Sprint 11 Frontend Verification and Handoff

```text
You are working in `blackfalc0ns/sis_dashboard`.

Task: perform final verification and create the Sprint 11 frontend handoff document.

Create:
- `docs/sprint11-frontend-implementation-report.md`

The report must include:

1. Executive status:
   - PASS / PARTIAL / FAIL

2. Implemented modules:
   - Auth mustChangePassword
   - Login Identity
   - Settings Users Sprint 11 model
   - Credentials
   - Email Connection
   - Email Templates
   - Credential Delivery
   - Email Deliveries
   - Email Campaigns
   - Student/Guardian account linking if implemented

3. File inventory:
   - All new files
   - All modified files

4. API endpoint inventory:
   - Every integrated endpoint

5. Security proof:
   - Temporary passwords one-time only
   - No frontend persistence of temporary passwords
   - SMTP/API secrets not displayed after save
   - Credential variables blocked in general campaigns

6. Manual test script:
   - Login admin
   - Configure login identity
   - Preview username
   - Create user with username + contactEmail
   - Generate temporary password
   - Login as generated user
   - Force change password
   - Configure email connection
   - Test and activate connection
   - Edit/preview templates
   - Preview credential delivery recipients
   - Create credential delivery batch
   - Open delivery monitoring
   - Create general campaign

7. Verification commands:

```bash
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

8. Known limitations:
   - Only document real limitations.
   - Do not hide failed tests.
   - Do not claim production readiness if SMTP was not tested against a real sandbox provider.

Acceptance criteria:
- Report file exists.
- All verification commands are run and results documented.
- Any failures include exact error summary and affected files.
- No vague claims such as “all good” without proof.
```

---

## Final acceptance checklist

The Sprint 11 frontend implementation is acceptable only when all of the following are true:

```text
[ ] Auth supports mustChangePassword and forced change-password route.
[ ] Login Identity page is implemented.
[ ] Users page uses username + contactEmail model.
[ ] Credential generation/set/regeneration UI exists.
[ ] Temporary passwords are shown once only and not persisted.
[ ] Email connection setup/test/activate/disable UI exists.
[ ] Email templates list/edit/preview/reset UI exists.
[ ] Credential delivery wizard exists.
[ ] Delivery monitoring list/detail/cancel exists.
[ ] General campaign composer/list/detail exists.
[ ] General campaigns block credential-only variables.
[ ] Student/guardian account linking exists if required in this frontend release.
[ ] Sidebar navigation is updated.
[ ] English and Arabic translations are updated.
[ ] Permissions are enforced in UI.
[ ] npm run build passes.
[ ] npm run lint passes.
[ ] npm run test:run passes.
[ ] npm run test:e2e passes if E2E coverage was added.
[ ] Final implementation report exists.
```
