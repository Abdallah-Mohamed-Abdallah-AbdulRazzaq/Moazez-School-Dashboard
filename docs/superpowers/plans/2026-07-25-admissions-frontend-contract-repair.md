# Admissions Frontend Contract Repair Implementation Plan

**Goal:** Align the Admissions frontend with the current backend contract, remove lead chat, and preserve all working Admissions workflows without backend changes.

**Architecture:** Keep the existing feature folders and route composition. Add a shared typed pagination adapter and exhaustive page loader, move academic selection into the workflows that need it, use the school-scoped document configuration service, and enforce resource-specific permissions before requests and actions.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl, existing API helpers, Tailwind/shared UI components, Vitest, and Testing Library.

## Global Constraints

- Frontend only; do not change the backend contract or send undocumented fields.
- Remove the lead chat completely without replacing it.
- Preserve unrelated dirty worktree changes, especially the existing curriculum and locale edits.
- Patch locale files narrowly; do not regenerate or reformat them wholesale.
- Write or update focused tests before each behavioral change.
- Use backend `dashboardState`, registration handoff/state, workflow policy, and document `canReview` as authoritative.

---

### Task 1: Add typed Admissions pagination and permission keys

**Files:**

- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/features/admissions/shared/services/admissionsApiUtils.ts`
- Modify: `src/features/admissions/shared/services/__tests__/admissionsApiUtils.test.ts`

**Interfaces:**

- Add `admissions.leads.view` and `admissions.leads.manage`.
- Add `admissions.tests.view` and `admissions.tests.manage`.
- Add `admissions.interviews.view` and `admissions.interviews.manage`.
- Add a typed `{ items, pagination: { page, limit, total } }` collection result.
- Add an exhaustive paginated loader that derives the final page from `total` and `limit`.

- [ ] Add failing adapter tests for direct and supported wrapped paginated envelopes.
- [ ] Add failing loader tests for one page, multiple pages, empty results, malformed metadata, and application filtering after all pages load.
- [ ] Extend `PermissionKey` with the backend-defined Admissions keys instead of casting strings.
- [ ] Implement pagination parsing without changing existing item/array unwrapping behavior.
- [ ] Implement bounded exhaustive loading with a maximum backend-supported limit of `100`.
- [ ] Run the shared Admissions service tests and typecheck.

### Task 2: Remove lead chat completely

**Files:**

- Delete: `src/features/admissions/leads/components/LeadChatPanel.tsx`
- Delete: `src/features/admissions/leads/services/communicationApiService.ts`
- Delete: `src/features/admissions/leads/types/message.ts`
- Delete: `src/app/[lang]/(dashboard)/admissions/leads/[id]/chat/page.tsx`
- Modify: `src/features/admissions/leads/components/LeadDetails.tsx`
- Modify: `src/features/admissions/leads/components/index.ts`
- Modify: `src/features/admissions/leads/components/__tests__/LeadDetails.test.tsx`
- Modify: `src/features/admissions/leads/types/index.ts` if it exports the message type
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] Update `LeadDetails` tests to assert that no chat tab or panel is rendered.
- [ ] Remove the chat tab state and rendering from `LeadDetails`.
- [ ] Remove the dedicated route, adapter, panel, message type, and public exports.
- [ ] Remove only the lead-chat translation subtree in both locales.
- [ ] Search the repository for `LeadChatPanel`, `communicationApiService`, the chat route, and lead message imports.
- [ ] Run focused lead tests.

### Task 3: Replace the global Admissions academic context with local selection

**Files:**

- Delete after migration: `src/features/admissions/shared/hooks/useAdmissionsYearTermContext.tsx`
- Delete after migration: `src/features/admissions/shared/components/AdmissionsYearTermContextBar.tsx`
- Delete after migration: `src/features/admissions/shared/components/AdmissionsReadOnlyBanner.tsx`
- Modify: `src/app/[lang]/(dashboard)/admissions/layout.tsx`
- Create or modify: a focused local academic-selection hook under `src/features/admissions/shared/hooks/`
- Modify: `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`
- Modify: `src/features/admissions/applications/components/registration/ApplicationRegistrationWizard.tsx`
- Modify: `src/features/admissions/applications/hooks/useApplicationRegistration.ts`
- Modify: `src/features/admissions/enrollment/components/EnrollmentForm.tsx`
- Modify: `src/features/admissions/enrollment/pages/EnrollmentList.tsx`
- Modify: `src/features/admissions/tests/components/ScheduleTestModal.tsx`
- Modify: all remaining Admissions consumers returned by the context-reference search
- Modify: affected tests

- [ ] Add tests proving the Admissions shell renders without a global year/term bar.
- [ ] Add tests proving closed terms no longer disable school-scoped Admissions actions.
- [ ] Extract only reusable year/term option loading needed by local forms; do not preserve URL-wide Admissions scope or `isReadOnly`.
- [ ] Give application creation explicit local year and term controls used to load grade options.
- [ ] Send only `requestedAcademicYearId` and `requestedGradeId` in application creation.
- [ ] Give registration and enrollment local academic placement state with handoff prefill where available.
- [ ] Let scheduling controls load local academic options only when required to select a supported payload field.
- [ ] Remove provider, context bar, read-only banners, and all `useAdmissionsYearTermContext` imports.
- [ ] Remove obsolete `year`/`term` Admissions query synchronization and context translations if unused.
- [ ] Run focused creation, registration, enrollment, scheduling, layout, and action tests.

### Task 4: Use backend-required documents for the active school

**Files:**

- Modify: `src/features/admissions/applications/components/ApplicationCreateStepper.tsx`
- Modify: `src/features/admissions/applications/components/__tests__/ApplicationCreateStepper.test.ts`
- Modify: `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`
- Modify: `src/features/admissions/applications/components/tabs/__tests__/DocumentsTab.test.tsx`
- Modify: `src/features/settings/services/settingsService.ts`
- Modify: `src/features/settings/__tests__/sprint11EndpointContracts.test.ts`
- Modify: related document types/mappers as needed

- [ ] Add tests that both consumers call `fetchAdmissionRequiredDocumentsForSchool(activeSchoolId)`.
- [ ] Add tests for missing school scope, loading, request failure, retry, and preserved form/document state.
- [ ] Map `AdmissionRequiredDocument` fields into the existing input presentation without converting them back to local mock configuration.
- [ ] Respect backend `isMandatory`, accepted file types, maximum file count, title, description, and sort order where the current UI supports them.
- [ ] Block requirement-dependent upload/link controls until canonical configuration loads.
- [ ] Preserve display of already linked application documents when configuration loading fails.
- [ ] Remove the local `fetchAdmissionsDocumentRequirements`/update/store path after all consumers migrate and a repository search confirms it is unused; preserve unrelated Settings state.
- [ ] Run focused creation, Documents tab, and Settings contract tests.

### Task 5: Return real pagination from test, interview, and decision services

**Files:**

- Modify: `src/features/admissions/tests/services/testsApiService.ts`
- Modify: `src/features/admissions/tests/services/__tests__/testsApiService.test.ts`
- Modify: `src/features/admissions/interviews/services/interviewsApiService.ts`
- Modify: `src/features/admissions/interviews/services/__tests__/interviewsApiService.test.ts`
- Modify: `src/features/admissions/decisions/services/decisionsApiService.ts`
- Modify: `src/features/admissions/decisions/services/__tests__/decisionsApiService.test.ts`

- [ ] Change each list method to return the typed paginated result.
- [ ] Preserve resource normalization for every returned item.
- [ ] Assert placement-test query support for `search`, `status`, `type`, `dateFrom`, `dateTo`, `page`, and `limit`.
- [ ] Assert interview query support for `search`, `status`, `dateFrom`, `dateTo`, `page`, and `limit`.
- [ ] Assert decision query support for `search`, `decision`, `dateFrom`, `dateTo`, `page`, and `limit`.
- [ ] Remove the decision parameter discard.
- [ ] Omit undefined, blank, and `"all"` values.
- [ ] Run all three service suites.

### Task 6: Add server pagination and filters to standalone lists

**Files:**

- Modify: `src/features/admissions/tests/pages/TestsList.tsx`
- Add or modify: focused Tests list tests
- Modify: `src/features/admissions/interviews/pages/InterviewsList.tsx`
- Add or modify: focused Interviews list tests
- Modify: `src/features/admissions/decisions/pages/DecisionsList.tsx`
- Modify: `src/features/admissions/decisions/pages/__tests__/DecisionsList.test.tsx`
- Modify: standalone route pages under `src/app/[lang]/(dashboard)/admissions/`
- Reuse: existing shared pagination controls where compatible

- [ ] Add tests that the initial request includes page and limit.
- [ ] Add tests that each supported filter is sent to the backend and resets page to `1`.
- [ ] Add tests that page changes request the selected backend page.
- [ ] Add stale-response protection tests.
- [ ] Drive rows and total counts from the latest paginated result.
- [ ] Remove duplicate client filtering for filters now handled by the backend.
- [ ] Gate each page before request with its exact view permission.
- [ ] Keep mutation actions behind the exact resource manage permission.
- [ ] Add retryable loading/error/empty states without clearing the last successful result unnecessarily.
- [ ] Run focused list and route tests.

### Task 7: Exhaustively load application-related collections

**Files:**

- Modify: `src/features/admissions/applications/hooks/useApplicationRelatedData.ts`
- Add: `src/features/admissions/applications/hooks/__tests__/useApplicationRelatedData.test.tsx`
- Modify: `src/features/admissions/applications/components/ApplicationTabContent.tsx`
- Modify: `src/features/admissions/applications/components/__tests__/ApplicationTabContent.test.tsx`
- Modify: `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`
- Modify: `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`
- Modify: `src/features/admissions/applications/pages/__tests__/ApplicationDetailsPage.test.tsx`
- Modify: `src/features/admissions/applications/components/tabs/TestsTab.tsx`
- Modify: `src/features/admissions/applications/components/tabs/InterviewsTab.tsx`

- [ ] Add hook tests with the matching application record located after page one.
- [ ] Fetch all test, interview, and decision pages with limit `100`, then filter by `applicationId`.
- [ ] Start no resource request when its view permission is absent.
- [ ] Expose independent loading/error/retry state so one related failure does not hide the application.
- [ ] Cancel or ignore stale work after application navigation or unmount.
- [ ] Remove first-page-only fetches inside `TestsTab` and `InterviewsTab`; consume the exhaustive related data instead.
- [ ] Keep the live route layout, `ApplicationTabContent`, and secondary `ApplicationDetailsPage` consistent.
- [ ] Run hook, tab-content, live-layout, and details-page tests.

### Task 8: Correct action permissions and backend workflow authority

**Files:**

- Modify: `src/app/[lang]/(dashboard)/admissions/applications/[id]/layout.tsx`
- Modify: `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`
- Modify: `src/features/admissions/applications/components/ApplicationTabContent.tsx`
- Modify: `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`
- Modify: `src/features/admissions/applications/utils/applicationActionReadiness.ts`
- Modify: affected permission and readiness tests

- [ ] Add matrix tests for test/interview view and manage permissions independently from application permissions.
- [ ] Require `admissions.tests.manage` for placement-test scheduling/update/completion.
- [ ] Require `admissions.interviews.manage` for interview scheduling/update/completion.
- [ ] Require decision view/manage and document view/manage at their matching surfaces.
- [ ] Require both `admissions.documents.manage` and `files.uploads.manage` before file upload.
- [ ] Use `dashboardState` and workflow policy for decision/registration readiness.
- [ ] Use registration handoff and `registrationState` for registration.
- [ ] Remove the `doc.canReview ?? doc.status === "pending_review"` fallback and use backend `canReview`.
- [ ] Preserve backend conflict/prerequisite handling after frontend guards.
- [ ] Run focused permission, readiness, Documents tab, and application action tests.

### Task 9: Make application creation partial success recoverable

**Files:**

- Modify: `src/features/admissions/leads/pages/LeadsList.tsx`
- Add or modify: focused Leads list conversion tests
- Modify: `src/features/admissions/applications/pages/ApplicationsList.tsx`
- Modify: `src/features/admissions/applications/pages/__tests__/ApplicationsList.test.tsx`
- Modify: creation service/types if needed

- [ ] Add tests where application creation succeeds and a document upload or link fails.
- [ ] Assert that the created application ID is retained and application creation is not retried.
- [ ] Attempt each selected upload/link once, collect all failed document labels, and skip lead conversion if any document fails.
- [ ] Do not mark a source lead converted after any document failure.
- [ ] Replace toast-only failure with a persistent partial-success result and direct Documents-tab link.
- [ ] Close or switch the creation dialog so it cannot resubmit the already-created application.
- [ ] Handle lead-conversion failure separately after successful application/documents.
- [ ] Keep ordinary successful creation and conversion behavior unchanged.
- [ ] Run focused lead and application creation tests.

### Task 10: Remove misleading dashboard scope and finish localization

**Files:**

- Modify: `src/features/admissions/dashboard/pages/AdmissionsDashboardContent.tsx`
- Modify: `src/features/admissions/shared/utils/admissionsContextScope.ts` and tests if no longer used
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: affected dashboard tests

- [ ] Remove global year/term scoping and closed-term messaging from dashboard calculations.
- [ ] Keep the explicit date-range filter as the only displayed dashboard time scope.
- [ ] Ensure lead and application metrics use the same explicit date-range semantics where their source timestamps support it.
- [ ] Remove obsolete context-scope helpers when no consumer remains.
- [ ] Add bilingual messages for required-document errors, pagination, permission denial, partial success, recovery, and workflow conflicts.
- [ ] Preserve unrelated locale edits with narrow structural patches.
- [ ] Verify RTL pagination direction and accessible action labels.
- [ ] Run focused dashboard and translation-key tests.

### Task 11: Final verification and quality guards

- [ ] Run `npm run typecheck`.
- [ ] Run `npx vitest run src/features/admissions src/features/settings/__tests__/sprint11EndpointContracts.test.ts`.
- [ ] Run ESLint on all affected source and test files.
- [ ] Run `git diff --check`.
- [ ] Search for `LeadChatPanel`, `communicationApiService`, the lead chat route, `fetchAdmissionsDocumentRequirements`, `useAdmissionsYearTermContext`, `AdmissionsYearTermContextBar`, `AdmissionsReadOnlyBanner`, and the document-status review fallback.
- [ ] Manually verify standalone list pagination and filters.
- [ ] Manually verify application detail records beyond page one.
- [ ] Manually verify denied permissions make no requests.
- [ ] Manually verify document-configuration failure and retry.
- [ ] Manually verify partial creation recovery and lead non-conversion.
- [ ] Review changed production code with `clean-code-guard`.
- [ ] Review changed tests with `test-guard`.
- [ ] Address all material findings and rerun affected checks.
- [ ] Confirm unrelated dirty worktree changes were neither overwritten nor included in Admissions commits.
