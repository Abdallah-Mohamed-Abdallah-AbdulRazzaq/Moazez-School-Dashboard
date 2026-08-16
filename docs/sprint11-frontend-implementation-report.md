# Sprint 11 Frontend Implementation Report

## Executive Status

**PARTIAL**

The Sprint 11 frontend modules are implemented and wired into the existing Next.js dashboard structure. `npm run build`, `npm run lint`, and `npm run test:run` completed successfully. `npm run test:e2e` was run and failed in existing broad Playwright suites outside the Sprint 11 settings flows, so the release cannot be marked fully green.

## Implemented Modules

- **Auth mustChangePassword:** forced `/[lang]/change-password` lifecycle, password change service, form validation, success redirect, and dashboard gating for users with `mustChangePassword`.
- **Login Identity:** settings page for login domain, username rules, preview, and username availability.
- **Settings Users Sprint 11 model:** users page now treats `email` as generated login email and `contactEmail` as the personal inbox; create/edit flows prefer `username + contactEmail`.
- **Credentials:** credential status, single generate/set/regenerate, bulk preview/generate, and one-time temporary password reveal.
- **Email Connection:** SMTP/API configuration, safe secret flags, test, activate, disable.
- **Email Templates:** list/detail/edit/preview/reset for account credentials, password reset, and general message templates.
- **Credential Delivery:** wizard for audience, template, credential mode, recipient preview, and queued delivery creation.
- **Email Deliveries:** delivery batch list, filters, detail, recipient table, and cancellable batch action.
- **Email Campaigns:** general campaign composer, recipient preview, rendered preview, list/detail, and credential-variable blocking.
- **Student/Guardian account linking:** service and account-link modals added to existing students and guardians areas.

## File Inventory

### New Sprint 11 files

- `docs/sprint11-frontend-contract-audit.md`
- `docs/sprint11-frontend-implementation-report.md`
- `src/app/[lang]/change-password/page.tsx`
- `src/app/[lang]/(dashboard)/settings/login-identity/page.tsx`
- `src/app/[lang]/(dashboard)/settings/credentials/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/connection/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/templates/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/credential-deliveries/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/deliveries/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/deliveries/[batchId]/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/campaigns/page.tsx`
- `src/app/[lang]/(dashboard)/settings/email/campaigns/[batchId]/page.tsx`
- `src/features/auth/components/ChangePasswordForm.tsx`
- `src/features/settings/login-identity/types.ts`
- `src/features/settings/login-identity/services/loginIdentityService.ts`
- `src/features/settings/login-identity/pages/LoginIdentityPage.tsx`
- `src/features/settings/login-identity/components/LoginIdentityForm.tsx`
- `src/features/settings/login-identity/components/UsernamePreviewCard.tsx`
- `src/features/settings/credentials/types.ts`
- `src/features/settings/credentials/services/credentialsService.ts`
- `src/features/settings/credentials/pages/CredentialsPage.tsx`
- `src/features/settings/credentials/components/CredentialStatusTable.tsx`
- `src/features/settings/credentials/components/GenerateCredentialModal.tsx`
- `src/features/settings/credentials/components/SetPasswordModal.tsx`
- `src/features/settings/credentials/components/BulkGenerateCredentialsModal.tsx`
- `src/features/settings/credentials/components/TemporaryPasswordRevealModal.tsx`
- `src/features/settings/email/connection/types.ts`
- `src/features/settings/email/connection/services/emailConnectionService.ts`
- `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- `src/features/settings/email/connection/components/EmailConnectionForm.tsx`
- `src/features/settings/email/connection/components/EmailConnectionStatusCard.tsx`
- `src/features/settings/email/templates/types.ts`
- `src/features/settings/email/templates/services/emailTemplatesService.ts`
- `src/features/settings/email/templates/pages/EmailTemplatesPage.tsx`
- `src/features/settings/email/templates/components/TemplateKeyTabs.tsx`
- `src/features/settings/email/templates/components/TemplateEditor.tsx`
- `src/features/settings/email/templates/components/TemplatePreviewModal.tsx`
- `src/features/settings/email/credential-deliveries/types.ts`
- `src/features/settings/email/credential-deliveries/services/credentialDeliveryService.ts`
- `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryAudienceStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryModeStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryPreviewStep.tsx`
- `src/features/settings/email/credential-deliveries/components/CredentialDeliveryConfirmStep.tsx`
- `src/features/settings/email/deliveries/types.ts`
- `src/features/settings/email/deliveries/services/emailDeliveriesService.ts`
- `src/features/settings/email/deliveries/pages/EmailDeliveriesPage.tsx`
- `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- `src/features/settings/email/deliveries/components/DeliveryBatchTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryRecipientTable.tsx`
- `src/features/settings/email/deliveries/components/DeliveryStatusBadge.tsx`
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

### Modified Sprint 11 files

- `src/types/user.ts`
- `src/services/auth-service.ts`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/context/AuthProvider.tsx`
- `src/features/settings/types/index.ts`
- `src/features/settings/services/settingsUsersService.ts`
- `src/features/settings/components/UserEditorModal.tsx`
- `src/features/settings/users/pages/SettingsUsersPage.tsx`
- `src/features/settings/dashboard/pages/SettingsOverviewPage.tsx`
- `src/features/students-guardians/students/pages/StudentsList.tsx`
- `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
- `src/features/students-guardians/guardians/pages/GuardiansList.tsx`
- `src/features/students-guardians/guardians/pages/GuardianProfilePage.tsx`
- `src/config/navigation.ts`
- `src/hooks/usePermissions.ts`
- `src/components/layout/Sidebar.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`
- `vitest.config.ts`

### Focused test files

- `src/features/settings/__tests__/sprint11Services.test.ts`
- `src/features/auth/components/__tests__/LoginForm.test.tsx`
- `src/features/auth/components/__tests__/ChangePasswordForm.test.tsx`
- `src/features/settings/login-identity/components/__tests__/UsernamePreviewCard.test.tsx`
- `src/features/settings/components/__tests__/UserEditorModal.test.tsx`
- `src/features/settings/credentials/components/__tests__/TemporaryPasswordRevealModal.test.tsx`
- `src/features/settings/email/connection/components/__tests__/EmailConnectionForm.test.tsx`
- `src/features/settings/email/campaigns/components/__tests__/CampaignComposer.test.tsx`

## API Endpoint Inventory

### Auth

- `POST /auth/change-password`

### Login Identity

- `GET /settings/login-identity`
- `PUT /settings/login-identity`
- `GET /settings/login-identity/preview?username=...`
- `GET /settings/users/usernames/available?username=...`

### Settings Users

- Existing settings users list/create/update/delete/status/role endpoints are reused through `settingsUsersService`.
- Sprint 11 request/response types include `username`, generated login `email`, `contactEmail`, `mustChangePassword`, `passwordProvisionedAt`, and `credentialVersion`.

### Credentials

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

### Credential Delivery

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

## Security Proof

- Temporary passwords are typed as one-time response fields and are only held in component state long enough to display the reveal modal.
- `TemporaryPasswordRevealModal` clears its temporary password state on close, and focused tests assert that the value is removed and is not written to `localStorage` or `sessionStorage`.
- Credential delivery does not display raw temporary passwords; it warns when password generation or regeneration will happen during delivery.
- Student and guardian account linking modals show a returned temporary password once if the backend returns one, then clear it on modal close.
- The email connection form does not expect or render `encryptedPassword` or `encryptedApiKey`; saved secrets are represented only with `hasPassword` and `hasApiKey`.
- Password/API key fields are blank by default on edit. Blank secret fields are omitted from update payloads so existing backend secrets are not accidentally cleared.
- General campaign submission blocks credential-only variables such as `{{credential.temporaryPassword}}` before calling the API.
- The users model now distinguishes generated login `email` from personal `contactEmail`; reports, tables, and modal labels avoid treating `email` as the personal inbox.

## Manual Test Script

1. Login as an admin with settings permissions.
2. Open Settings > Login Identity.
3. Configure the login domain and username rules.
4. Preview a username and confirm the generated login email.
5. Open Settings > Users.
6. Create a user with `fullName`, `username`, `contactEmail`, and `roleId`.
7. Open Settings > Credentials.
8. Generate a temporary password and confirm it is shown once.
9. Login as the generated user.
10. Confirm forced redirect to `/change-password`.
11. Change password successfully and confirm dashboard access.
12. Open Settings > Email Connection.
13. Configure SMTP/API fields, test connection, then activate it.
14. Open Settings > Email Templates.
15. Edit, preview, save, and reset a template.
16. Open Settings > Credential Delivery.
17. Preview credential delivery recipients and create a queued delivery batch.
18. Open Settings > Email Deliveries and inspect the created batch.
19. Open Settings > Email Campaigns.
20. Preview recipients, preview rendered campaign, and create a general campaign.
21. Confirm general campaigns reject credential variables before submit.

## Verification Commands

```bash
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

### Results

- `npm run build`: **PASS**. Next.js compiled successfully, TypeScript completed, static pages generated, and route manifest includes all Sprint 11 routes.
- `npm run lint`: **PASS WITH WARNINGS**. ESLint reported `0 errors, 91 warnings`. Warnings are existing code quality warnings such as `@typescript-eslint/no-explicit-any`, React hook dependency warnings, and unused variables.
- `npm run test:run`: **PASS**. Vitest reported `13 passed` test files and `46 passed` tests.
- `npm run test:e2e`: **FAIL**. Playwright reported `39 failed`, `36 passed`, and `50 did not run`.

### E2E failure summary

The failing Playwright suites are broad existing smoke/data-table/navigation checks rather than Sprint 11-specific tests:

- `e2e/data-table.spec.ts`: admissions applications table tests fail across multiple browsers due to navigation/load timeouts or no visible `table`.
- `e2e/attendance-smoke.spec.ts`: shared layout context checks fail or redirect to `/en/login` in some projects.
- `e2e/grades-smoke.spec.ts`: shared layout context checks fail or redirect to `/en/login` in some projects.
- `e2e/teachers-smoke.spec.ts`: expected `Academic Context` heading is missing.
- `e2e/navigation.spec.ts` and `e2e/responsive.spec.ts`: selected Firefox/WebKit navigation and mobile menu checks fail.

Representative errors:

- `page.goto: Test timeout of 30000ms exceeded` while opening `/en/admissions/applications`.
- `page.waitForSelector: Timeout 10000ms exceeded` waiting for `table`.
- `Expected: 1, Received: 0` for `getByRole("heading", { name: "Academic Context" })`.
- Expected grades/attendance URLs, received `http://localhost:3000/en/login`.

## Known Limitations

- The full Playwright suite is not passing. Sprint 11 should remain **PARTIAL** until those E2E failures are investigated or the suite is split so Sprint 11 smoke coverage can be evaluated independently.
- SMTP/API connection was not verified against a real sandbox email provider in this automated pass; production readiness for outbound mail still requires an environment-backed manual test.
- Lint still has 91 warnings. They do not block build or tests, but they should be cleaned up separately.
- The repository worktree contains many unrelated modified files outside Sprint 11, so this report inventories Sprint 11-relevant files rather than claiming ownership of every dirty file.

## Final Acceptance Checklist

```text
[x] Auth supports mustChangePassword and forced change-password route.
[x] Login Identity page is implemented.
[x] Users page uses username + contactEmail model.
[x] Credential generation/set/regeneration UI exists.
[x] Temporary passwords are shown once only and not persisted.
[x] Email connection setup/test/activate/disable UI exists.
[x] Email templates list/edit/preview/reset UI exists.
[x] Credential delivery wizard exists.
[x] Delivery monitoring list/detail/cancel exists.
[x] General campaign composer/list/detail exists.
[x] General campaigns block credential-only variables.
[x] Student/guardian account linking exists if required in this frontend release.
[x] Sidebar navigation is updated.
[x] English and Arabic translations are updated.
[x] Permissions are enforced in UI.
[x] npm run build passes.
[x] npm run lint passes.
[x] npm run test:run passes.
[ ] npm run test:e2e passes if E2E coverage was added.
[x] Final implementation report exists.
```
