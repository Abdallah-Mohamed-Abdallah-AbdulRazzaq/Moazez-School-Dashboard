# Applications Feature Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Localize every user-facing string in the applications list, application profile tabs, creation flow, registration flow, and application document modals in English and Arabic.

**Architecture:** Reuse the existing `admissions.applications`, `admissions.application360`, and `admissions.create_application` namespaces. Components will call `useTranslations` at their owning boundary; helper functions will accept a small translation callback so local fallback errors remain localized while API-provided messages are preserved.

**Tech Stack:** Next.js 16, React 19, TypeScript, `next-intl`, Vitest, ESLint.

## Global Constraints

- Localization-only change: do not change API calls, permissions, status transitions, validation rules, or component layout.
- Both `src/messages/en.json` and `src/messages/ar.json` must expose matching leaf keys for the required application namespaces.
- Preserve meaningful backend error messages; translate local fallback, permission, validation, loading, empty, and confirmation text.
- Preserve unrelated working-tree changes and stage only files belonging to this feature in each commit.

---

## File map

- Message contracts: `src/messages/en.json`, `src/messages/ar.json`.
- Regression coverage: `src/messages/__tests__/applicationsTranslations.test.ts`.
- Applications list and creation flow: `src/features/admissions/applications/pages/ApplicationsList.tsx`, `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`.
- Profile shell and tab host: `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`, `src/features/admissions/applications/components/ApplicationTabContent.tsx`.
- Profile tabs: `ApplicationReadinessPanel.tsx`, `GuardiansTab.tsx`, `DocumentsTab.tsx`, `TestsTab.tsx`, `InterviewsTab.tsx`.
- Shared modals: `DocumentViewerModal.tsx`, `Application360Modal.tsx`.
- Existing registration wizard: `ApplicationRegistrationWizard.tsx`; verify its namespace parity and only modify if the audit finds a user-facing gap.

### Task 1: Add the failing translation-parity contract

**Files:**

- Create: `src/messages/__tests__/applicationsTranslations.test.ts`
- Modify: none yet

**Interfaces:**

- Consumes: JSON message imports from `src/messages/en.json` and `src/messages/ar.json`.
- Produces: a single test that fails until every required application key exists in both locales.

- [ ] **Step 1: Write the failing test**

Create a recursive lookup helper and assert these required paths in both locales:

```ts
const requiredPaths = [
  "admissions.applications.load_error",
  "admissions.applications.submit_error",
  "admissions.applications.create_error",
  "admissions.applications.loading",
  "admissions.applications.not_available",
  "admissions.applications.processing_hours",
  "admissions.applications.processing_days",
  "admissions.application360.loading",
  "admissions.application360.not_found",
  "admissions.application360.schedule_test_error",
  "admissions.application360.schedule_interview_error",
  "admissions.application360.decision_error",
  "admissions.application360.registration_blocked",
  "admissions.application360.details.not_provided",
  "admissions.application360.details.personal_info_not_provided",
  "admissions.application360.details.contact_not_provided",
  "admissions.application360.details.readiness_title",
  "admissions.application360.details.readiness_subtitle",
  "admissions.application360.details.decision_action",
  "admissions.application360.details.registration_action",
  "admissions.application360.details.enabled",
  "admissions.application360.details.blocked",
  "admissions.application360.details.document_summary",
  "admissions.application360.details.documents_complete",
  "admissions.application360.details.documents_missing",
  "admissions.application360.details.documents_pending_review",
  "admissions.application360.details.documents_total",
  "admissions.application360.details.workflow_readiness",
  "admissions.application360.details.placement_test",
  "admissions.application360.details.interview",
  "admissions.application360.details.required",
  "admissions.application360.details.optional",
  "admissions.application360.details.satisfied",
  "admissions.application360.details.not_satisfied",
  "admissions.application360.details.completed_count",
  "admissions.application360.details.policy_source",
  "admissions.application360.details.direct_acceptance",
  "admissions.application360.details.allowed",
  "admissions.application360.details.not_allowed",
  "admissions.application360.details.blockers",
  "admissions.application360.guardians.loading",
  "admissions.application360.guardians.retry",
  "admissions.application360.guardians.empty",
  "admissions.application360.actions.blocked_title",
  "admissions.application360.documents.loading",
  "admissions.application360.documents.empty",
  "admissions.application360.documents.uploaded",
  "admissions.application360.documents.review.accept",
  "admissions.application360.documents.review.reject",
  "admissions.application360.documents.review.request_replacement",
  "admissions.application360.documents.review.title",
  "admissions.application360.documents.review.submit",
  "admissions.application360.documents.review.cancel",
  "admissions.application360.documents.review.note",
  "admissions.application360.documents.review.optional",
  "admissions.application360.documents.review.required_note",
  "admissions.application360.documents.review.optional_note",
  "admissions.application360.documents.review.approval_note",
  "admissions.application360.documents.review.rejection_note",
  "admissions.application360.documents.review.replacement_note",
  "admissions.application360.documents.review.replacement_notice",
  "admissions.application360.documents.actions.view",
  "admissions.application360.documents.actions.download",
  "admissions.application360.documents.actions.remove",
  "admissions.application360.documents.preview_unavailable",
  "admissions.application360.documents.download_hint",
  "admissions.application360.documents.url_unavailable",
  "admissions.application360.documents.uploaded_label",
  "admissions.application360.documents.remove_confirm",
  "admissions.application360.documents.errors.review_failed",
  "admissions.application360.documents.errors.review_permission",
  "admissions.application360.documents.errors.not_found",
  "admissions.application360.documents.errors.already_reviewed",
  "admissions.application360.documents.errors.invalid_review_note",
  "admissions.application360.documents.errors.load_failed",
  "admissions.application360.documents.errors.view_permission",
  "admissions.application360.documents.errors.manage_permission",
  "admissions.application360.documents.errors.changed_status",
  "admissions.application360.documents.errors.invalid_details",
  "admissions.application360.documents.errors.open_failed",
  "admissions.application360.documents.errors.download_failed",
  "admissions.application360.documents.errors.select_type",
  "admissions.application360.documents.errors.file_type",
  "admissions.application360.documents.errors.file_size",
  "admissions.application360.documents.errors.type_missing",
  "admissions.application360.documents.errors.upload_success",
  "admissions.application360.documents.errors.remove_success",
  "admissions.application360.documents.errors.remove_failed",
  "admissions.application360.documents.types.birth_certificate",
  "admissions.application360.documents.types.passport_copy",
  "admissions.application360.documents.types.medical_report",
  "admissions.application360.documents.types.previous_school_certificate",
  "admissions.application360.documents.types.national_id",
  "admissions.application360.documents.types.vaccination_record",
  "admissions.application360.documents.types.report_card",
  "admissions.application360.documents.types.transfer_certificate",
  "admissions.create_application.loading",
  "admissions.create_application.errors.load_failed",
];
```

Use `getMessage(en, path)` and `getMessage(ar, path)` with `toBeTruthy()` for each path.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/messages/__tests__/applicationsTranslations.test.ts`

Expected: FAIL with missing message paths, especially readiness Arabic keys and new document UI keys.

- [ ] **Step 3: Commit the test contract**

```bash
git add src/messages/__tests__/applicationsTranslations.test.ts
git commit -m "test: define applications translation contract"
```

### Task 2: Complete message keys in both locales

**Files:**

- Modify: `src/messages/en.json`.
- Modify: `src/messages/ar.json`.
- Test: `src/messages/__tests__/applicationsTranslations.test.ts`.

**Interfaces:**

- Consumes: the required paths from Task 1.
- Produces: matching English/Arabic keys under the three existing admissions namespaces.

- [ ] **Step 1: Add list and creation fallback keys**

Add list keys for loading, load failure, submit failure, create failure, not-available fallback, and processing-time units. Add `admissions.create_application.loading` and `admissions.create_application.errors.load_failed` while retaining all existing creation keys.

- [ ] **Step 2: Add missing Arabic application360 keys**

Add Arabic translations for the existing English readiness, guardian state, and blocked-action keys identified by the audit: `details.not_provided`, `details.personal_info_not_provided`, `details.contact_not_provided`, all readiness fields, `guardians.loading`, `guardians.retry`, `guardians.empty`, and `actions.blocked_title`.

- [ ] **Step 3: Add document action and error keys**

Add matching `application360.documents` groups for loading/empty/uploaded labels, review actions and descriptions, document viewer actions, confirmation text, permission and mutation errors, and fallback document type labels.

- [ ] **Step 4: Run the parity test**

Run: `npx vitest run src/messages/__tests__/applicationsTranslations.test.ts`

Expected: PASS with one test and zero failures.

- [ ] **Step 5: Commit the message contract**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/applicationsTranslations.test.ts
git commit -m "feat: complete applications translations"
```

### Task 3: Localize the list, creation stepper, profile host, and detail actions

**Files:**

- Modify: `src/features/admissions/applications/pages/ApplicationsList.tsx`.
- Modify: `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`.
- Modify: `src/features/admissions/applications/components/ApplicationTabContent.tsx`.
- Modify: `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`.

**Interfaces:**

- Consumes: list/create/application360 keys from Task 2.
- Produces: no raw user-facing English strings in these four production surfaces.

- [ ] **Step 1: Localize `ApplicationsList.tsx`**

Use `t("load_error")`, `t("submit_error")`, `t("create_error")`, `t("loading")`, `t("not_available")`, and translated processing-time units. Replace `"N/A"`, `"—"`, `"Loading applications..."`, and local toast messages only; leave `console.error` diagnostics and API enum values unchanged.

- [ ] **Step 2: Localize `ApplicationCreateStepper.tsx`**

Replace `setError("Failed to load application form data.")` with `setError(t("errors.load_failed"))`. Keep document labels supplied by the settings API data-driven and retain existing validation keys.

- [ ] **Step 3: Localize `ApplicationTabContent.tsx`**

Add `useTranslations("admissions.application360")` and replace the tab loader and not-found text with `t("loading")` and `t("not_found")`.

- [ ] **Step 4: Localize `ApplicationDetailsPage.tsx`**

Replace loading/not-found, back navigation, schedule test/interview failures, decision fallback, and registration-blocked fallback with application360 keys. Preserve API-friendly decision error messages when returned by the service.

- [ ] **Step 5: Run affected page tests**

Run: `npx vitest run src/features/admissions/applications/pages/__tests__/ApplicationsList.test.tsx src/features/admissions/applications/pages/__tests__/ApplicationDetailsPage.test.tsx src/features/admissions/applications/components/__tests__/ApplicationTabContent.test.tsx`

Expected: all affected tests pass.

- [ ] **Step 6: Commit the page changes**

```bash
git add src/features/admissions/applications/pages/ApplicationsList.tsx src/features/admissions/applications/components/ApplicationCreateStepper.tsx src/features/admissions/applications/components/ApplicationTabContent.tsx src/features/admissions/applications/pages/ApplicationDetailsPage.tsx
git commit -m "feat: localize application list and profile states"
```

### Task 4: Localize readiness, guardians, tests, and interviews tabs

**Files:**

- Modify: `src/features/admissions/applications/components/tabs/ApplicationReadinessPanel.tsx`.
- Modify: `src/features/admissions/applications/components/tabs/GuardiansTab.tsx`.
- Modify: `src/features/admissions/applications/components/tabs/TestsTab.tsx`.
- Modify: `src/features/admissions/applications/components/tabs/InterviewsTab.tsx`.

**Interfaces:**

- Consumes: Arabic parity keys and tab feedback keys from Task 2.
- Produces: localized readiness cards, guardian states, test feedback, and interview feedback.

- [ ] **Step 1: Verify readiness and guardian keys**

Use the completed `application360.details.*` and `application360.guardians.*` keys without changing blocker data or readiness calculations.

- [ ] **Step 2: Add translated test and interview feedback**

Replace success and error toast literals with `t` keys. Keep the existing scheduling and completion API payloads unchanged.

- [ ] **Step 3: Run affected tests**

Run: `npx vitest run src/features/admissions/applications/components/tabs/__tests__ src/features/admissions/applications/components/__tests__/ApplicationTabContent.test.tsx`

Expected: all selected tab tests pass.

- [ ] **Step 4: Commit tab changes**

```bash
git add src/features/admissions/applications/components/tabs/ApplicationReadinessPanel.tsx src/features/admissions/applications/components/tabs/GuardiansTab.tsx src/features/admissions/applications/components/tabs/TestsTab.tsx src/features/admissions/applications/components/tabs/InterviewsTab.tsx
git commit -m "feat: localize application profile tabs"
```

### Task 5: Localize documents tab and document viewer

**Files:**

- Modify: `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`.
- Modify: `src/features/admissions/applications/components/modals/DocumentViewerModal.tsx`.
- Test: `src/features/admissions/applications/components/modals/__tests__/DocumentViewerModal.test.tsx`.

**Interfaces:**

- Consumes: `admissions.application360.documents.*` keys from Task 2.
- Produces: localized document list, upload/review/delete flows, preview fallback, and viewer actions.

- [ ] **Step 1: Make document error helpers translatable**

Change helper signatures to accept a translation callback:

```ts
type Translate = (key: string) => string;

function documentReviewErrorMessage(error: unknown, t: Translate): string;
function documentLoadErrorMessage(error: unknown, t: Translate): string;
function documentMutationErrorMessage(error: unknown, fallback: string, t: Translate): string;
```

Return `error.message` when supplied by the API; otherwise return concrete keys such as `t("documents.errors.review_permission")`, `t("documents.errors.not_found")`, `t("documents.errors.changed_status")`, or `t("documents.errors.invalid_details")` for the corresponding status branch.

- [ ] **Step 2: Replace document tab literals**

Use translations for loading/empty/uploaded text, upload validation, permission errors, success toasts, delete confirmation, review titles/descriptions, note labels/placeholders, action buttons, and icon-button titles. Convert fallback `DOCUMENT_TYPES` values to `documents.types.*` labels while preserving their API values.

- [ ] **Step 3: Localize `DocumentViewerModal.tsx`**

Add `useTranslations("admissions.application360")` and replace preview unavailable, download guidance, URL unavailable, close, and download text. Preserve document-provided names, URLs, and file types.

- [ ] **Step 4: Update viewer test mocks if required**

Extend the existing test’s `next-intl` mock only if the component now calls `useTranslations`; assert the modal renders the translated action labels through the existing mock contract.

- [ ] **Step 5: Run document tests**

Run: `npx vitest run src/features/admissions/applications/components/modals/__tests__/DocumentViewerModal.test.tsx src/features/admissions/applications/components/__tests__/ApplicationTabContent.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 6: Commit document changes**

```bash
git add src/features/admissions/applications/components/tabs/DocumentsTab.tsx src/features/admissions/applications/components/modals/DocumentViewerModal.tsx src/features/admissions/applications/components/modals/__tests__/DocumentViewerModal.test.tsx
git commit -m "feat: localize application document workflows"
```

### Task 6: Localize legacy application modal and verify registration wizard

**Files:**

- Modify: `src/features/admissions/applications/components/modals/Application360Modal.tsx`.
- Inspect and modify only if needed: `src/features/admissions/applications/components/registration/ApplicationRegistrationWizard.tsx`.
- Inspect and modify only if needed: `src/features/admissions/applications/components/registration/RegistrationFields.tsx`.

**Interfaces:**

- Consumes: existing application360 and registration translation keys from Task 2.
- Produces: no raw fallback labels such as `N/A` in the legacy modal; registration remains fully localized.

- [ ] **Step 1: Replace legacy modal fallback literals**

Use `t("overview.not_available")` for missing profile values and keep all existing tab/action translations and data values unchanged.

- [ ] **Step 2: Audit registration wizard output**

Confirm every visible label, notice, validation message, and button uses `admissions.application360.registration` or a translated validation key. Only edit files if a user-facing hardcoded string is found.

- [ ] **Step 3: Run modal and registration tests**

Run: `npx vitest run src/features/admissions/applications/components/modals/__tests__ src/features/admissions/applications/hooks/__tests__/useApplicationRegistration.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 4: Commit legacy modal changes**

```bash
git add src/features/admissions/applications/components/modals/Application360Modal.tsx src/features/admissions/applications/components/registration/ApplicationRegistrationWizard.tsx src/features/admissions/applications/components/registration/RegistrationFields.tsx
git commit -m "feat: localize legacy application modal"
```

### Task 7: Full verification and source audit

**Files:**

- Inspect all changed application files and message files.

- [ ] **Step 1: Run the translation contract**

Run: `npx vitest run src/messages/__tests__/applicationsTranslations.test.ts`

Expected: PASS.

- [ ] **Step 2: Run affected application tests**

Run: `npx vitest run src/features/admissions/applications`

Expected: all application tests pass.

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npx eslint src/features/admissions/applications src/messages/__tests__/applicationsTranslations.test.ts`

Expected: zero errors.

- [ ] **Step 4: Scan for remaining user-facing literals**

Run: `rg -n 'Loading|Failed|Please|No |Not Available|N/A|Accept|Reject|Download|Close|Remove' src/features/admissions/applications -g '*.tsx' -g '*.ts'`

Any remaining match must be a diagnostic log, API enum, comment, or data value; otherwise replace it with a translation key.

- [ ] **Step 5: Check the diff**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Report verification**

Summarize changed files, focused test counts, typecheck/lint results, and any unrelated pre-existing test failures without modifying unrelated worktree changes.
