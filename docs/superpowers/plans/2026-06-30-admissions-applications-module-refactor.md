# Admissions Applications Module Refactor Implementation Plan

**Goal:** Replace mock-shaped Applications behavior with a typed, contract-accurate module covering application CRUD/submit, the complete document lifecycle, enrollment readiness, and accepted-application registration.

**Architecture:** Backend DTOs and endpoint clients feed pure mappers and workflow predicates. Focused hooks own list, detail, document, and registration state; pages compose these hooks while components remain presentation-focused. Existing routes and surrounding admissions features remain stable.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios-backed API helpers, next-intl, Tailwind/MUI, Vitest, Testing Library, Playwright.

---

### Task 1: Inventory consumers and lock the backend contract

**Files:**

- Create: `src/features/admissions/applications/api/applicationDtos.ts`
- Create: `src/features/admissions/applications/api/applicationDocumentDtos.ts`
- Create: `src/features/admissions/applications/api/registrationDtos.ts`
- Test: `src/features/admissions/applications/api/__tests__/applicationContract.test.ts`

- [ ] Locate every consumer of the current `Application` aliases, application services, mock creation function, containers, views, and routes.
- [ ] Define exact request/response DTOs for list/create/get/update/submit, document actions, enrollment preview, registration handoff, and registration.
- [ ] Represent `registrationState`, pagination/envelopes where applicable, file metadata, warnings, missing fields, account modes, and idempotent registration responses.
- [ ] Add compile-time/runtime fixture tests based on the supplied Postman collection and backend documentation.
- [ ] Verify no DTO invents fields absent from the contract.

### Task 2: Canonical models, mappers, workflow rules, and errors

**Files:**

- Create: `src/features/admissions/applications/model/application.ts`
- Create: `src/features/admissions/applications/model/applicationDocument.ts`
- Create: `src/features/admissions/applications/model/registration.ts`
- Create: `src/features/admissions/applications/model/mappers.ts`
- Create: `src/features/admissions/applications/model/workflow.ts`
- Create: `src/features/admissions/applications/model/errors.ts`
- Test: `src/features/admissions/applications/model/__tests__/*`

- [ ] Write failing tests for null/optional fields, timestamps, registration state, document file metadata, warnings, and envelope variations supported by the shared API client.
- [ ] Implement one canonical application model without duplicate snake/camel aliases or nested mock resources.
- [ ] Implement pure DTO mappers that tolerate absent optional values without fabricating student, guardian, document, test, interview, or decision data.
- [ ] Implement permission/state predicates for submit, document review, handoff preview, and registration.
- [ ] Map validation, authorization, not-found, conflict, prerequisite, throttling, and fallback errors while preserving trace IDs.
- [ ] Run focused model tests.

### Task 3: Route-accurate API clients

**Files:**

- Create: `src/features/admissions/applications/api/applicationsApi.ts`
- Create: `src/features/admissions/applications/api/applicationDocumentsApi.ts`
- Create: `src/features/admissions/applications/api/applicationRegistrationApi.ts`
- Test: `src/features/admissions/applications/api/__tests__/*Api.test.ts`
- Replace/remove after migration: existing services under `src/features/admissions/applications/services/`

- [ ] Write failing tests asserting exact verbs, URLs, query parameters, and bodies for every Applications and Application Documents endpoint in the Postman collection.
- [ ] Implement list with only the documented `status` query; do not send unsupported application search/page/limit parameters.
- [ ] Implement create/get/update/submit and normalize their responses through Task 2 mappers.
- [ ] Implement document list/link/accept/reject/request-replacement/delete.
- [ ] Implement `POST /enroll`, `GET /registration-handoff`, and `POST /register`.
- [ ] Ensure reject/replacement notes are trimmed and application ID is taken only from the route argument.
- [ ] Run all API route tests.

### Task 4: List state and honest list UI

**Files:**

- Create: `src/features/admissions/applications/hooks/useApplicationsList.ts`
- Create: `src/features/admissions/applications/hooks/useApplicationMutations.ts`
- Modify: `src/features/admissions/applications/pages/ApplicationsList.tsx`
- Modify or remove: `container/ApplicationsListContainer.tsx`
- Modify or remove: `views/ApplicationsListView.tsx`
- Modify: application list/filter/KPI utilities and tests

- [ ] Write hook tests for URL status normalization, client search over loaded results, stale-request protection, retry, create, update, and submit refresh.
- [ ] Consolidate duplicate page/container/view orchestration into the new hooks and one presentation path.
- [ ] Keep backend status filtering URL-backed; label search as operating on the loaded result set.
- [ ] Replace the rich mock-shaped create submission with only supported application fields.
- [ ] Remove local mock creation, fabricated nested data, guessed processing dates, and synthetic chart series.
- [ ] Derive only honest counts from loaded applications.
- [ ] Add loading, empty, forbidden, failure, and retry states.
- [ ] Gate create/update/submit by permission and workflow state.

### Task 5: Detail composition and editing

**Files:**

- Create: `src/features/admissions/applications/hooks/useApplicationDetails.ts`
- Modify: `src/features/admissions/applications/pages/ApplicationDetailsPage.tsx`
- Modify: `src/features/admissions/applications/components/ApplicationTabContent.tsx`
- Modify: detail header/summary and Details tab components
- Test: `src/features/admissions/applications/pages/__tests__/ApplicationDetailsPage.test.tsx`

- [ ] Write tests for application loading, not found, retry, canonical field display, edit payloads, and registration-state display.
- [ ] Load the core application independently from documents/tests/interviews/decisions.
- [ ] Keep the header available when a related tab fails and give each related surface its own retry state.
- [ ] Send only documented, changed patch fields.
- [ ] Show unavailable/empty states instead of compatibility aliases or mock content.
- [ ] Preserve all existing detail URLs and tab navigation.

### Task 6: Complete document lifecycle

**Files:**

- Create: `src/features/admissions/applications/hooks/useApplicationDocuments.ts`
- Modify: `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`
- Modify: document viewer/upload components as needed
- Test: `src/features/admissions/applications/components/tabs/__tests__/DocumentsTab.test.tsx`
- Test: `src/features/admissions/applications/hooks/__tests__/useApplicationDocuments.test.tsx`

- [ ] Write tests for independent loading/retry, upload then link, same-type replacement messaging, and targeted refresh.
- [ ] Reuse the Files service to upload and obtain `fileId`, then link the document with contract fields.
- [ ] Add accept with optional note, reject with required note, and replacement request with required note.
- [ ] Validate required notes at 1–2,000 trimmed characters and retain input after failure.
- [ ] Add delete confirmation identifying the document.
- [ ] Apply per-document pending locks, permission/state action gating, and actionable `409` refresh handling.
- [ ] Preserve authenticated file view/download behavior using returned file metadata.

### Task 7: Enrollment readiness and registration wizard

**Files:**

- Create: `src/features/admissions/applications/hooks/useApplicationRegistration.ts`
- Create: `src/features/admissions/applications/components/registration/EnrollmentReadinessPanel.tsx`
- Create: `src/features/admissions/applications/components/registration/ApplicationRegistrationWizard.tsx`
- Create: focused wizard step components and payload mapper
- Test: registration hook, mapper, and component tests

- [ ] Write tests for eligibility, all four permissions, handoff loading, missing fields, warnings, and registered state.
- [ ] Surface `POST /enroll` as a non-mutating readiness check.
- [ ] Populate the registration wizard from `GET /registration-handoff` and existing academic selectors.
- [ ] Implement student, guardians/accounts, enrollment, student-account, and review steps.
- [ ] Validate required student/guardian/enrollment data, account-mode dependencies, classroom, date, and username length.
- [ ] Map the form exactly to the register payload without accepting an editable application ID.
- [ ] Prevent duplicate submission and treat `alreadyRegistered: true` as successful idempotency.
- [ ] Keep the application status accepted, refresh `registrationState`, show warnings, and link to returned student/enrollment records where routes exist.

### Task 8: Permissions, translations, accessibility, and responsive UX

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: affected Applications components and permission tests

- [ ] Add English and Arabic messages for all new actions, validation, errors, warnings, confirmations, readiness, and registration states.
- [ ] Verify document actions require `admissions.documents.manage`; registration requires all documented permissions.
- [ ] Ensure status meaning is not color-only, focus is visible/restored, async state is announced, and dialogs are keyboard operable.
- [ ] Verify directional icons and layouts in LTR and RTL.
- [ ] Verify 375, 768, 1024, and 1440 pixel widths without page-level horizontal overflow.
- [ ] Verify light/dark contrast and stable hover states using existing dashboard tokens and Lucide icons.

### Task 9: Remove obsolete compatibility paths

**Files:**

- Remove or rewrite: `services/applicationCreationService.ts`
- Remove or rewrite: old `applicationsApiService.ts` and `applicationDocumentsApiService.ts`
- Modify: old application types and all remaining consumers
- Modify: mock admissions data only where dead Applications exports can be safely removed

- [ ] Search for the old mock create function, duplicate field aliases, old service imports, duplicated list orchestration, and synthetic KPI inputs.
- [ ] Migrate every live consumer to the canonical model and new public API.
- [ ] Delete dead containers/views/services/types only after no imports remain.
- [ ] Keep unrelated admissions mock data used by other modules intact.

### Task 10: Final verification

- [ ] Run focused Applications unit/component tests.
- [ ] Run related admissions regression tests.
- [ ] Run `npm run typecheck`.
- [ ] Run ESLint on changed files.
- [ ] Run relevant Playwright flows for list, detail, documents, submit, readiness, registration, RTL, and narrow viewport behavior.
- [ ] Search for mock application creation, unsupported query parameters, fabricated chart data, duplicate application aliases, and old service imports; confirm none remain in live Applications code.
- [ ] Review production code with `clean-code-guard` and changed tests with `test-guard`, then address material findings.
- [ ] Confirm unrelated dirty-worktree files were not changed or committed.
