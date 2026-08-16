# Teacher Directory Integration Implementation Plan

> **For implementation agents:** Execute this plan task by task. Keep every
> commit focused, run the listed tests before each commit, and preserve unrelated
> worktree changes.

**Goal:** Replace the mock-backed Teachers Management feature with the seven
contract-aligned Teacher Directory endpoints documented in
`docs/teacher-management-dashboard-contract-workflow.md`.

**Architecture:** Keep the existing Axios wrappers and React state model. A typed
API service owns HTTP calls; small hooks own loading, stale-response protection,
action state, and explicit refreshes; pages coordinate URL state and mutations;
presentational components remain isolated from transport concerns.

**Tech stack:** Next.js 16, React 19, TypeScript, Axios, next-intl, existing MUI
and shared UI components, Vitest, Testing Library, Playwright.

## Global constraints

- Do not install or add any dependency.
- Do not modify `package.json`, lockfiles, or application providers.
- Scope is Teacher Directory only. Credential operations, transfer, and
  allocation writes remain out of scope.
- Preserve the uncommitted files currently under `src/features/teachers/types/`;
  review and amend them instead of recreating them.
- Until legacy `src/features/teachers/types.ts` is removed, new code must import
  the new barrel explicitly from `@/features/teachers/types/index`.
- Do not add academic year/term parameters to Teacher Directory requests.
- Do not add unsupported sort parameters.
- Do not expose a rehire UI until archived-record discovery exists.
- Use focused Vitest commands during tasks. Run the full typecheck only after
  legacy files have been retired.
- Keep Arabic and English messages aligned.

---

### Task 1: Finalize contract DTOs and typed fixtures

**Files:**

- Review/modify: `src/features/teachers/types/enums.ts`
- Review/modify: `src/features/teachers/types/requests.ts`
- Review/modify: `src/features/teachers/types/responses.ts`
- Review/modify: `src/features/teachers/types/forms.ts`
- Review/modify: `src/features/teachers/types/index.ts`
- Create: `src/features/teachers/types/__tests__/contractFixtures.test.ts`

**Produces:** Exact request/response types for all seven endpoints and UI-only
form types. Existing legacy consumers continue resolving `types.ts` until Task
10 removes them.

- [ ] Add typed request and response fixtures covering nullable profile data,
  all three status dimensions, credential summary, pagination, and employment
  transition allocation counts.
- [ ] Use Vitest `expectTypeOf` plus runtime assertions to verify enum casing and
  the distinction between `id` and `userId`.
- [ ] Verify create rejects `TERMINATED` at the type boundary and update excludes
  lifecycle/account/membership fields.
- [ ] Keep `preferredDisplayLanguage` in create/update/rehire requests only; do
  not invent it on response DTOs.
- [ ] Run:
  `npx vitest run src/features/teachers/types/__tests__/contractFixtures.test.ts`
- [ ] Commit the five existing DTO files and the contract fixture test.

---

### Task 2: Implement the API service and teacher error mapping

**Files:**

- Create: `src/features/teachers/services/teacherApi.ts`
- Create: `src/features/teachers/services/__tests__/teacherApi.test.ts`
- Create: `src/features/teachers/utils/teacherErrors.ts`
- Create: `src/features/teachers/utils/__tests__/teacherErrors.test.ts`

**Produces:** `teacherApi.list`, `get`, `create`, `update`,
`changeEmploymentStatus`, `archive`, and `rehire`, plus one normalized UI error
mapping boundary.

- [ ] Write failing service tests that mock `apiGet`, `apiPost`, `apiPatch`, and
  `apiDelete` and assert the exact `/teachers` paths, query object, payload, and
  archive `void` behavior.
- [ ] Implement the service using only helpers from `@/lib/api`; do not prepend a
  second `/api/v1` when the configured base URL already owns the API prefix.
- [ ] Write failing error tests for teacher profile, identity, lifecycle, IAM
  username/login-email, validation, permission, network, and unknown errors.
- [ ] Implement error mapping from the existing `ApiError` class. Preserve
  `traceId` for support details and map backend field details without exposing
  raw error objects.
- [ ] Run:
  `npx vitest run src/features/teachers/services/__tests__/teacherApi.test.ts src/features/teachers/utils/__tests__/teacherErrors.test.ts`
- [ ] Commit the service, error utility, and focused tests.

---

### Task 3: Build form mapping, patch, lifecycle, pagination, and validation utilities

**Files:**

- Create: `src/features/teachers/utils/teacherFormMappers.ts`
- Create: `src/features/teachers/utils/buildTeacherPatch.ts`
- Create: `src/features/teachers/utils/employmentTransitions.ts`
- Create: `src/features/teachers/utils/pagination.ts`
- Replace: `src/features/teachers/utils/teacherValidation.ts`
- Replace tests: `src/features/teachers/utils/__tests__/teacherMappers.test.ts`
- Replace tests: `src/features/teachers/utils/__tests__/teacherValidation.test.ts`
- Create: `src/features/teachers/utils/__tests__/buildTeacherPatch.test.ts`
- Create: `src/features/teachers/utils/__tests__/employmentTransitions.test.ts`
- Create: `src/features/teachers/utils/__tests__/pagination.test.ts`

**Produces:** Pure, independently tested utilities used by forms, pages, and
action availability checks.

- [ ] Write tests for username versus login-email serialization; username mode
  must omit `loginEmail` rather than send an empty or conflicting value.
- [ ] Test empty-string-to-null normalization, numeric experience conversion,
  unique work days, and paired work times.
- [ ] Test minimal PATCH generation, empty-patch rejection, and inclusion of
  `preferredDisplayLanguage` whenever any bilingual name changes.
- [ ] Because detail responses do not contain `preferredDisplayLanguage`, test
  edit-form initialization using the current locale (`AR` or `EN`) as the
  explicit default.
- [ ] Test lifecycle edges: ACTIVE → INACTIVE/TERMINATED, INACTIVE →
  ACTIVE/TERMINATED, and no transition from TERMINATED. Activation requires a
  complete profile and `credentialSummary.hasPassword`.
- [ ] Test pagination derivation from `page`, `limit`, and `total`, including
  zero records and a partial last page.
- [ ] Run:
  `npx vitest run src/features/teachers/utils/__tests__`
- [ ] Commit the utilities and their focused tests.

---

### Task 4: Implement dependency-free data and action hooks

**Files:**

- Create: `src/features/teachers/hooks/useTeacherList.ts`
- Create: `src/features/teachers/hooks/useTeacherDetail.ts`
- Create: `src/features/teachers/hooks/useTeacherActions.ts`
- Create: `src/features/teachers/hooks/__tests__/useTeacherList.test.tsx`
- Create: `src/features/teachers/hooks/__tests__/useTeacherDetail.test.tsx`
- Create: `src/features/teachers/hooks/__tests__/useTeacherActions.test.tsx`

**Produces:** React-only hooks for list/detail reads, stale-response protection,
explicit refresh, local detail replacement, and mutation loading state.

- [ ] Write list-hook tests for initial loading, refresh-with-existing-data,
  errors, retry, query changes, and ignoring a late stale response.
- [ ] Write detail-hook tests for disabled requests without an ID, not-found
  errors, refresh, and `replaceTeacher`.
- [ ] Write action-hook tests for all five mutations, action state cleanup after
  success/failure, returned DTOs, and error rethrowing.
- [ ] Implement with `useState`, `useEffect`, `useCallback`, and `useRef` only.
  Do not introduce a global cache, provider, or package.
- [ ] Run:
  `npx vitest run src/features/teachers/hooks/__tests__`
- [ ] Commit the hooks and focused tests.

---

### Task 5: Add permissions, navigation guard, and bilingual messages

**Files:**

- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/hooks/__tests__/usePermissions.test.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Produces:** Typed `teachers.records.view`/`teachers.records.manage`
permissions, sidebar gating for the existing `teachers` navigation item, and all
new list/detail/form/lifecycle/error text in both locales.

- [ ] Extend `PermissionKey` with the two teacher permissions.
- [ ] Map navigation key `teachers` to `teachers.records.view` and add a focused
  permission-map assertion.
- [ ] Add messages for five filters, three status groups, credential states,
  completeness, create/edit sections, lifecycle confirmations/results, archive,
  not-found, validation, and the onboarding caveat.
- [ ] Remove or stop referencing assignment/password copy from the new pages;
  retain the existing `teachers.export` subtree because shared export utilities
  are not removed in this scope.
- [ ] Validate both JSON files with:
  `node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/messages/ar.json','utf8'))"`
- [ ] Run:
  `npx vitest run src/hooks/__tests__/usePermissions.test.ts src/config/__tests__/navigation.test.ts`
- [ ] Commit permissions and translations together.

---

### Task 6: Build list status indicators, filters, and server-paginated table

**Files:**

- Create: `src/features/teachers/components/TeacherStatusBadge.tsx`
- Create: `src/features/teachers/components/TeacherCredentialIndicator.tsx`
- Create: `src/features/teachers/components/TeacherProfileCompleteness.tsx`
- Create: `src/features/teachers/components/TeacherFilterBar.tsx`
- Create: `src/features/teachers/components/TeacherListTable.tsx`
- Create: `src/features/teachers/components/__tests__/TeacherStatusIndicators.test.tsx`
- Create: `src/features/teachers/components/__tests__/TeacherFilterBar.test.tsx`
- Create: `src/features/teachers/components/__tests__/TeacherListTable.test.tsx`

**Produces:** Presentational list building blocks using only existing UI/MUI
dependencies.

- [ ] Test every employment/account/membership badge mapping, all four
  credential presentations, and complete/incomplete profile tooltips.
- [ ] Test exact filter enum values and clear behavior for employment, account,
  membership, gender, and profile completeness.
- [ ] Test nine columns, disabled client sorting, row navigation, mutating action
  visibility, loading rows, and shared `serverPagination` callbacks.
- [ ] Ensure row action clicks do not trigger row navigation.
- [ ] Run:
  `npx vitest run src/features/teachers/components/__tests__/TeacherStatusIndicators.test.tsx src/features/teachers/components/__tests__/TeacherFilterBar.test.tsx src/features/teachers/components/__tests__/TeacherListTable.test.tsx`
- [ ] Commit list components and tests.

---

### Task 7: Build create and edit teacher dialogs

**Files:**

- Create: `src/features/teachers/components/TeacherFormSections.tsx`
- Create: `src/features/teachers/components/CreateTeacherDialog.tsx`
- Create: `src/features/teachers/components/EditTeacherDialog.tsx`
- Create: `src/features/teachers/components/__tests__/CreateTeacherDialog.test.tsx`
- Create: `src/features/teachers/components/__tests__/EditTeacherDialog.test.tsx`

**Produces:** Two contract-specific dialogs sharing focused field sections but
emitting different request DTOs.

- [ ] Test identity-mode switching and verify hidden identity fields are omitted
  from requests.
- [ ] Test normalized teacher-code preview, bilingual names, required preferred
  language/gender, employment values excluding TERMINATED on create, nullable
  employment profile data, work days/times, and bilingual notes.
- [ ] Test field-level errors from `teacherErrors`, disabled submit while active,
  close/reset behavior, and the post-create activation caveat.
- [ ] Test edit initialization from detail. Initialize preferred language from
  locale because the response omits it, keep the selector visible, and prevent
  submission when `buildTeacherPatch` returns an empty object.
- [ ] Keep lifecycle/account/membership fields out of edit requests.
- [ ] Run:
  `npx vitest run src/features/teachers/components/__tests__/CreateTeacherDialog.test.tsx src/features/teachers/components/__tests__/EditTeacherDialog.test.tsx`
- [ ] Commit form components and tests.

---

### Task 8: Build detail, lifecycle, and archive components

**Files:**

- Create: `src/features/teachers/components/TeacherDetailHeader.tsx`
- Create: `src/features/teachers/components/TeacherDetailSections.tsx`
- Create: `src/features/teachers/components/EmploymentTransitionDialog.tsx`
- Create: `src/features/teachers/components/EmploymentTransitionResultDialog.tsx`
- Create: `src/features/teachers/components/ArchiveConfirmDialog.tsx`
- Create: `src/features/teachers/components/__tests__/TeacherDetail.test.tsx`
- Create: `src/features/teachers/components/__tests__/EmploymentTransitionDialog.test.tsx`
- Create: `src/features/teachers/components/__tests__/ArchiveConfirmDialog.test.tsx`

**Produces:** Read-only teacher profile sections plus legal employment and archive
actions.

- [ ] Test all detail sections with null/empty fallbacks and separate employment,
  account, membership, credential, and completeness states.
- [ ] Test legal action availability, activation preconditions, optional
  `effectiveAt`, confirmation severity/copy, and transition result counts.
- [ ] Test lifecycle 409 refresh-before-retry behavior at the component/page
  callback boundary.
- [ ] Test archive confirmation, 204 success callback, assignment-conflict link
  to the existing academic allocation route, integrity conflict, and retryable
  revocation failure.
- [ ] Run:
  `npx vitest run src/features/teachers/components/__tests__/TeacherDetail.test.tsx src/features/teachers/components/__tests__/EmploymentTransitionDialog.test.tsx src/features/teachers/components/__tests__/ArchiveConfirmDialog.test.tsx`
- [ ] Commit detail/action components and tests.

---

### Task 9: Replace the teacher list page and remove academic context

**Files:**

- Replace: `src/features/teachers/pages/TeachersPage.tsx`
- Create: `src/features/teachers/pages/__tests__/TeachersPage.test.tsx`
- Modify: `src/app/[lang]/(dashboard)/teachers/layout.tsx`
- Verify: `src/app/[lang]/(dashboard)/teachers/page.tsx`

**Produces:** Permission-gated list page backed by `GET /teachers`, URL filters,
server pagination, create flow, and explicit refreshes.

- [ ] Write page tests for access denied, view-only users, manage users, initial
  `page=1&limit=20`, loading/error/empty/no-results states, create success, and
  retry.
- [ ] Configure `useUrlQueryState` for all filter/page values. Use the already
  installed `use-debounce` package (300 ms) for the server search term and reset
  page to 1 when any filter changes.
- [ ] Normalize invalid URL enum/page values before building `TeacherListQuery`.
- [ ] Remove assignment reference-data loading, client filtering, password
  actions, academic context parameters, and export UI from the page.
- [ ] Change the route layout to a minimal pass-through layout; do not modify
  global providers.
- [ ] Run:
  `npx vitest run src/features/teachers/pages/__tests__/TeachersPage.test.tsx`
- [ ] Commit the list page, route layout, and test.

---

### Task 10: Add the teacher detail route and retire legacy teacher code

**Files:**

- Create: `src/features/teachers/pages/TeacherDetailPage.tsx`
- Create: `src/features/teachers/pages/__tests__/TeacherDetailPage.test.tsx`
- Create: `src/app/[lang]/(dashboard)/teachers/[teacherId]/page.tsx`
- Delete: `src/features/teachers/types.ts`
- Delete: `src/features/teachers/services/teacherService.ts`
- Delete: `src/features/teachers/services/teacherApiAdapter.ts`
- Delete: `src/features/teachers/components/TeacherStatusChip.tsx`
- Delete: `src/features/teachers/components/TeachersListPanel.tsx`
- Delete: `src/features/teachers/components/TeacherFiltersBar.tsx`
- Delete: `src/features/teachers/components/TeacherFormDialog.tsx`
- Delete: `src/features/teachers/components/TeacherDetailsDrawer.tsx`
- Delete: `src/features/teachers/components/ChangeTeacherPasswordModal.tsx`
- Delete obsolete legacy utility files after their tests have been replaced:
  `src/features/teachers/utils/teacherMappers.ts`

**Produces:** Dedicated detail route with update, lifecycle, and archive flows;
no mock service or ambiguous `types.ts`/`types/` resolution remains.

- [ ] Test view/manage permission states, loading, safe 404, generic error retry,
  edit success, transition success/result, 409 detail refresh, archive navigation,
  and absence of a rehire button.
- [ ] Wire returned update/transition objects through `replaceTeacher`.
- [ ] On archive success, navigate to the locale-aware list route. The list
  remount performs the required fresh read.
- [ ] Delete only the listed legacy files. Keep
  `src/features/teachers/shared/` intact.
- [ ] Confirm all new imports use `@/features/teachers/types/index` or resolve the
  directory barrel after `types.ts` deletion.
- [ ] Run:
  `npx vitest run src/features/teachers`
- [ ] Run: `npm run typecheck`
- [ ] Commit the detail route and legacy retirement together.

---

### Task 11: Rewrite Teacher Directory browser smoke coverage

**Files:**

- Replace: `e2e/teachers-smoke.spec.ts`
- Replace: `e2e/teachers-test-helpers.ts`

**Produces:** Deterministic smoke tests for the contract-aligned routes without
requiring mutable backend teacher data.

- [ ] Add Playwright route fixtures for list, detail, create, update, lifecycle,
  archive, 404, and 409 responses using contract-shaped JSON.
- [ ] Remove academic-context helpers and assertions.
- [ ] Cover list rendering, URL filter normalization, debounced search, server
  pagination, list-to-detail navigation, create/edit dialog entry, legal
  lifecycle actions, and archive confirmation.
- [ ] Assert there are no password, assignment-edit, export, or rehire actions in
  the directory scope.
- [ ] Run:
  `npx playwright test e2e/teachers-smoke.spec.ts --project=chromium`
- [ ] Commit the rewritten smoke tests.

---

### Task 12: Final verification and clean-code gates

**Files:** No planned production edits. Fix only defects found by verification.

- [ ] Confirm `git status --short` contains no unexpected files and no dependency
  manifest changes.
- [ ] Run: `npx vitest run src/features/teachers`
- [ ] Run:
  `npx vitest run src/hooks/__tests__/usePermissions.test.ts src/config/__tests__/navigation.test.ts`
- [ ] Run: `npm run typecheck`
- [ ] Run:
  `npx eslint src/features/teachers src/hooks/usePermissions.ts "src/app/[lang]/(dashboard)/teachers" e2e/teachers-smoke.spec.ts e2e/teachers-test-helpers.ts`
- [ ] Run:
  `npx playwright test e2e/teachers-smoke.spec.ts --project=chromium`
- [ ] Run a production-code clean-code review and a separate test-code review on
  the final diff before merging.
- [ ] Verify the acceptance checklist in
  `docs/superpowers/specs/2026-07-21-teacher-directory-integration-design.md`.
- [ ] Commit only verification fixes, if any, in a final focused commit.
