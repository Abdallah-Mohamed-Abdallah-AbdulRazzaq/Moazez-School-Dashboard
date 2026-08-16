# Users Backend Alignment and Guided Provisioning Implementation Plan

**Goal:** Align the frontend Settings Users module with the current backend
contract and connect user creation to real credential generation and delivery
without changing the backend.

**Architecture:** Keep Settings Users responsible for identity, role, and
account status. Add a post-save provisioning modal that reuses the existing
Credentials service and hands selected users to Credential Deliveries. Treat
Teachers and Credentials as authoritative for their own lifecycle data, and
initialize those pages through safe URL query state rather than duplicating
their logic.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, existing API
helpers and shared UI components, Vitest, Testing Library, and Playwright.

**Design:** `docs/superpowers/specs/2026-07-29-users-backend-alignment-guided-provisioning-design.md`

## Global Constraints

- Frontend only; do not modify `Moazez-Backend` or send undocumented fields.
- Preserve Teacher lifecycle ownership in the Teachers module.
- Keep credential state authoritative in the Credentials module.
- Treat create/invite success separately from credential or delivery success.
- Never log, persist, export, snapshot, or place temporary passwords in URLs.
- Patch locale files narrowly and preserve unrelated worktree changes.
- Add or update focused tests before each behavioral change.

---

### Task 1: Lock the corrected Users service contract

**Files:**

- Modify: `src/features/settings/types/index.ts`
- Modify: `src/features/settings/services/settingsUsersService.ts`
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`
- Add: `src/features/settings/services/__tests__/settingsUsersService.test.ts`

- [ ] Add failing tests for generated-identity create/invite payloads.
- [ ] Add failing tests for legacy-email create/invite payloads.
- [ ] Add a failing test proving status updates return only `{ id, status }`.
- [ ] Add repository-search assertions or explicit tests confirming no caller
      requires `fetchSettingsUser`, `resendSettingsUserInvite`, or
      `triggerSettingsUserPasswordReset`.
- [ ] Remove credential-only fields from `SettingsUserApiDto` and
      `SettingsUserRecord`.
- [ ] Add an exact `SettingsUserStatusResponseDto`.
- [ ] Change `setSettingsUserStatus` to return the partial status response.
- [ ] Remove the unsupported user-detail service method and unused placeholder
      resend/reset service methods.
- [ ] Update the Sprint 11 endpoint-contract suite to stop locking removed
      placeholder behavior.
- [ ] Run both Users service contract suites and typecheck.

### Task 2: Load all roles and expose lifecycle-safe role metadata

**Files:**

- Modify: `src/features/settings/services/settingsRolesService.ts`
- Add: `src/features/settings/services/__tests__/settingsRolesService.test.ts`
- Modify: `src/features/settings/users/pages/SettingsUsersPage.tsx`
- Modify: affected Settings role service callers only if a reusable helper
  requires a signature adjustment

- [ ] Add failing tests for one-page, multi-page, empty, and exact-multiple role
      collections.
- [ ] Implement an exhaustive role loader using `limit=100`, `pagination.total`,
      and bounded page progression.
- [ ] Preserve the existing paginated `fetchSettingsRoles` API for callers that
      need one page.
- [ ] Use the exhaustive loader in Settings Users.
- [ ] Build `rolesById` with role key and display metadata.
- [ ] Fail closed on lifecycle-changing actions when a row's role cannot be
      resolved.
- [ ] Run role service tests and the Settings Users page tests.

### Task 3: Make the user editor login-identity aware

**Files:**

- Modify: `src/features/settings/components/UserEditorModal.tsx`
- Modify: `src/features/settings/components/__tests__/UserEditorModal.test.tsx`
- Reuse: `src/features/settings/login-identity/services/loginIdentityService.ts`
- Reuse: `src/features/settings/login-identity/types.ts`
- Modify: `src/features/settings/users/pages/SettingsUsersPage.tsx`

- [ ] Add tests for active login identity selecting username mode.
- [ ] Add tests for absent and inactive configuration selecting legacy
      login-email mode.
- [ ] Add tests that a configuration request failure blocks submission and
      exposes retry instead of silently falling back.
- [ ] Add tests that contact email is optional in both modes.
- [ ] Add tests that Teacher roles are excluded from create/invite options but
      remain usable for display/filtering outside the editor.
- [ ] Add tests for generated-email preview and username availability only in
      username mode.
- [ ] Extend the modal payload discriminantly so username mode submits
      `username` and legacy mode submits `email`.
- [ ] Keep edit mode limited to the backend-supported full-name and role
      fields.
- [ ] Map backend validation errors to the correct identity-mode fields.
- [ ] Run the modal tests and typecheck.

### Task 4: Add guided post-save credential provisioning

**Files:**

- Add: `src/features/settings/users/components/UserProvisioningModal.tsx`
- Add: `src/features/settings/users/components/__tests__/UserProvisioningModal.test.tsx`
- Modify if needed for composition:
  `src/features/settings/credentials/components/TemporaryPasswordRevealModal.tsx`
- Reuse: `src/features/settings/credentials/services/credentialsService.ts`
- Modify: `src/features/settings/users/pages/SettingsUsersPage.tsx`

- [ ] Add tests for displaying the created/invited user independently from
      provisioning state.
- [ ] Add tests for temporary-password generation and one-time reveal.
- [ ] Add tests proving secret state is cleared when the reveal or provisioning
      modal closes.
- [ ] Add tests for a delivery handoff containing only `userId`.
- [ ] Add tests that delivery is hidden without
      `settings.email.credential_deliveries.manage`.
- [ ] Add tests for finish later and retry after generation failure.
- [ ] Implement generation with `generateUserCredential`.
- [ ] Reuse the existing reveal UI without copying the secret into persistent
      page state, storage, logs, or URLs.
- [ ] Keep the created user saved and the provisioning modal retryable after a
      credential failure.
- [ ] Run provisioning and temporary-password tests.

### Task 5: Correct the Users directory actions, table, and export

**Files:**

- Modify: `src/features/settings/users/pages/SettingsUsersPage.tsx`
- Add: `src/features/settings/users/pages/__tests__/SettingsUsersPage.test.tsx`
- Modify: `src/features/settings/types/index.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] Add tests that the credential-status table column and export field are
      absent.
- [ ] Add tests that successful create and invite refresh the directory and
      open provisioning.
- [ ] Add tests that provisioning failure never produces a creation-failed
      message.
- [ ] Add a non-Teacher action matrix for edit, account status, manage
      credentials, and deliver credentials.
- [ ] Add a Teacher action matrix that hides generic edit, activation,
      deactivation, resend, reset, and role change.
- [ ] Add tests for `teachers.records.view` controlling “Manage in Teachers.”
- [ ] Replace placeholder reset/resend controls with real credential or
      delivery handoffs.
- [ ] Route Manage Credentials with `search=<loginEmail>`.
- [ ] Route invited-user delivery with `userId=<userId>`.
- [ ] Route Teacher management with `search=<loginEmail>`.
- [ ] Preserve server-side user pagination, filters, refresh, and supported
      non-Teacher status updates.
- [ ] Run the Users page tests and Settings endpoint-contract tests.

### Task 6: Initialize Credential Deliveries from a selected user

**Files:**

- Modify:
  `src/features/settings/email/credential-deliveries/pages/CredentialDeliveriesPage.tsx`
- Modify:
  `src/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard.tsx`
- Modify:
  `src/features/settings/email/credential-deliveries/components/CredentialDeliveryAudienceStep.tsx`
- Add or modify:
  `src/features/settings/email/credential-deliveries/pages/__tests__/CredentialDeliveriesPage.test.tsx`
- Modify:
  `src/features/settings/email/credential-deliveries/components/__tests__/CredentialDeliveryAudienceStep.test.tsx`

- [ ] Add tests for `?userId=<uuid>` initializing selected-user audience mode.
- [ ] Add tests for default
      `credentialMode=GENERATE_TEMPORARY_PASSWORD`.
- [ ] Add tests that preview and create requests contain the selected `userIds`.
- [ ] Add tests that ordinary navigation without `userId` preserves the
      existing blank wizard.
- [ ] Add tests that reset clears initialized selection and safe query state.
- [ ] Add optional initial-values support to the wizard without coupling it to
      the Users page.
- [ ] Keep preview and explicit create confirmation mandatory.
- [ ] Run Credential Deliveries page, wizard, and audience tests.

### Task 7: Initialize Credentials and Teachers from safe searches

**Files:**

- Modify: `src/features/settings/credentials/pages/CredentialsPage.tsx`
- Modify:
  `src/features/settings/credentials/pages/__tests__/CredentialsPage.test.tsx`
- Modify: `src/features/teachers/pages/TeachersPage.tsx`
- Modify: `src/features/teachers/pages/__tests__/TeachersPage.test.tsx`

- [ ] Add tests for a `search` query initializing each page's existing search
      filter.
- [ ] Add tests that the initialized search is sent to the relevant backend
      list request.
- [ ] Add tests that clearing filters removes or resets the safe query value.
- [ ] Reuse the repository's URL-query-state pattern; do not add a parallel
      router-state abstraction.
- [ ] Preserve debounce, pagination reset, back/forward navigation, and locale.
- [ ] Run Credentials and Teachers page tests.

### Task 8: Finish bilingual workflow and error copy

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/features/settings/users/pages/SettingsUsersPage.tsx`
- Modify: `src/features/settings/components/UserEditorModal.tsx`
- Modify:
  `src/features/settings/users/components/UserProvisioningModal.tsx`

- [ ] Add equivalent English and Arabic messages for record created, invited
      record created, credential generated, delivery queued, finish later,
      login-email fallback, retryable identity-settings failure, and
      Teacher-directory ownership.
- [ ] Remove unused placeholder reset/resend messages after repository search
      confirms no remaining consumer.
- [ ] Add a translation-key parity test or extend the existing Settings locale
      test if one exists.
- [ ] Verify RTL order, dialog focus, accessible labels, and icon-only action
      titles.
- [ ] Run focused component and localization tests.

### Task 9: Update end-to-end contract coverage

**Files:**

- Modify: `e2e/sprint11-frontend-endpoints.spec.ts`
- Modify or add: focused Settings Users Playwright coverage
- Reuse: existing authentication and Settings fixtures

- [ ] Cover generated-identity user creation followed by finish later.
- [ ] Cover legacy login-email fallback when login identity is inactive.
- [ ] Cover create followed by temporary-password generation when fixtures can
      safely expose a one-time test credential.
- [ ] Cover invite followed by Credential Deliveries handoff and preselection.
- [ ] Cover Teacher row handoff and absence of generic lifecycle actions.
- [ ] Assert no request targets `/settings/users/:id` GET, resend-invite, or
      reset-password from the Users UI.
- [ ] Keep secrets out of traces, screenshots, and assertion messages.
- [ ] Run the focused Playwright file when its environment is available.

### Task 10: Final verification and quality gates

- [ ] Run direct targeted Vitest suites for Users, roles, credentials,
      credential deliveries, Teachers, and endpoint contracts.
- [ ] Run `npm run typecheck`.
- [ ] Run ESLint on every changed source and test file.
- [ ] Run the repository production build.
- [ ] Run relevant Playwright tests.
- [ ] Run `git diff --check`.
- [ ] Search for `fetchSettingsUser`, `resendSettingsUserInvite`,
      `triggerSettingsUserPasswordReset`, Users credential-status rendering,
      and Teacher generic action handlers.
- [ ] Confirm no temporary-password value is logged, persisted, exported, or
      placed in a query string.
- [ ] Review changed production code with `clean-code-guard`.
- [ ] Review changed tests with `test-guard`.
- [ ] Address all material findings and rerun affected checks.
- [ ] Confirm no backend file and no unrelated frontend file was changed.

