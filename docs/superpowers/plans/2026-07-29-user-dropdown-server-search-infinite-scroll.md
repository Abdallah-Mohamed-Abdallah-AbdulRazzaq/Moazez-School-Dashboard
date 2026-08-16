# User Dropdown Server Search and Infinite Scroll Implementation Plan

**Goal:** Move every searchable user-backed selector to debounced server search
and infinite pagination through the verified `GET /settings/users` contract.

**Architecture:** Add a reusable paginated-users hook under Settings Users,
keep the base `Select` API-agnostic, and place a standard async user adapter
above it. Shared communication selectors use compatibility wrappers.
Specialized account and teacher-allocation renderers reuse the data hook while
retaining their current rows and domain-specific information.

**Backend contract:** `GET /settings/users` accepts `search`, `roleId`,
`status`, `page`, and `limit`; `limit` is `1..100`; the response contains
`items` and `{ page, limit, total }`; access requires
`settings.users.view`.

**Design:** `docs/superpowers/specs/2026-07-29-user-dropdown-server-search-infinite-scroll-design.md`

## Working-tree constraint

The repository already contains user-owned, uncommitted edits in some planned
files, including `CommunicationEntitySelect.tsx`,
`UserMultiSearchSelect.tsx`, the Settings Users service and types, and message
files. Inspect and preserve those edits before every overlapping change. Do not
reset or replace them.

## Task 1: Add server-owned search controls to the base Select

**Files:**

- Modify: `src/components/ui/input/Select.tsx`
- Modify: `src/components/ui/input/__tests__/Select.test.tsx`

### Steps

- [ ] Add failing component tests for a server-search configuration that:
  - reports every search input change to the owner;
  - renders supplied options without locally filtering them;
  - preserves the existing default client-filtering behavior;
  - calls `onEndReached` near the scroll boundary;
  - renders an externally supplied menu footer;
  - retains keyboard selection and RTL layout.
- [ ] Add generic props such as:
  - `searchMode?: "client" | "server"`, defaulting to `"client"`;
  - `onSearchChange?: (query: string) => void`;
  - `menuFooter?: React.ReactNode`.
- [ ] Keep the search input's internal value so existing consumers remain
  uncontrolled.
- [ ] Invoke `onSearchChange` synchronously from the search input change
  handler.
- [ ] In server mode, return the supplied options unchanged from the filtering
  memo.
- [ ] Keep `onEndReached` API-agnostic and guard only at the data-owner layer.
- [ ] Run:

```powershell
pnpm vitest run src/components/ui/input/__tests__/Select.test.tsx
```

## Task 2: Build and test the paginated-users controller

**Files:**

- Create: `src/features/settings/users/hooks/usePaginatedUsers.ts`
- Create: `src/features/settings/users/hooks/__tests__/usePaginatedUsers.test.tsx`
- Reuse: `src/features/settings/services/settingsUsersService.ts`
- Reuse: `src/hooks/useDebounce.ts`

### Controller contract

Inputs:

- `enabled: boolean`;
- `query: string`;
- optional `roleId`;
- optional `status`;
- optional `limit`, defaulting to `20`.

Outputs:

- unique loaded `users`;
- `isInitialLoading`;
- `isLoadingMore`;
- `initialError`;
- `loadMoreError`;
- `hasMore`;
- `loadMore()`;
- `retryInitial()`;
- `retryLoadMore()`.

### Steps

- [ ] Add failing hook tests using fake timers and a mocked
  `fetchSettingsUsers`.
- [ ] Assert no request while disabled.
- [ ] Assert enabling with an empty query requests `{ page: 1, limit: 20 }`
  plus the supplied scope.
- [ ] Assert any input is trimmed and requested after approximately 300 ms.
- [ ] Assert a query, role, or status change replaces results and resets the
  page sequence.
- [ ] Assert `loadMore` requests the next page with an identical query and
  scope.
- [ ] Assert page append preserves backend order and removes duplicate user
  IDs.
- [ ] Derive `hasMore` from unique loaded users compared with
  `pagination.total`.
- [ ] Suppress duplicate page requests caused by repeated scroll events.
- [ ] Ignore responses from older query/scope generations.
- [ ] Preserve loaded users when a later page fails.
- [ ] Implement separate first-page and later-page retries.
- [ ] Clear old first-page errors when a new generation starts.
- [ ] Run:

```powershell
pnpm vitest run src/features/settings/users/hooks/__tests__/usePaginatedUsers.test.tsx
```

## Task 3: Add the standard paginated user selector

**Files:**

- Create: `src/features/settings/users/components/PaginatedUserSelect.tsx`
- Create: `src/features/settings/users/components/__tests__/PaginatedUserSelect.test.tsx`
- Modify: `src/features/communication/components/selectors/UserSearchSelect.tsx`
- Modify: `src/features/communication/components/selectors/UserMultiSearchSelect.tsx`
- Modify: `src/features/communication/components/selectors/__tests__/UserMultiSearchSelect.test.tsx`
- Add or modify:
  `src/features/communication/components/selectors/__tests__/UserSearchSelect.test.tsx`

### Steps

- [ ] Add failing tests for opening with an empty query, debounced server
  search, page append, loading footers, empty results, first-page retry,
  later-page retry, and permission errors.
- [ ] Give `PaginatedUserSelect` the current label, value, placeholder,
  helper, error, disabled, clear, selection, and option-observer capabilities
  needed by `UserSearchSelect` consumers.
- [ ] Accept optional `roleId`, `status`, and selected-option metadata.
- [ ] Enable the paginated hook only after the dropdown opens.
- [ ] Map user records to select options containing full name, username or
  login email, and searchable identity metadata.
- [ ] Configure `Select` with server search mode and forward end-reached to
  `loadMore`.
- [ ] Preserve the selected label by caching the selected option independently
  of the current page.
- [ ] Render distinct localized footer states for loading more, retry, and
  permission denial.
- [ ] Refactor `UserSearchSelect` into a compatibility wrapper around the new
  component. Do not change its existing consumer-facing callbacks unless a new
  optional scope prop is required.
- [ ] Merge the existing uncommitted option-observer work in
  `UserMultiSearchSelect`; do not overwrite it.
- [ ] Keep an ID-indexed label cache for all supplied, loaded, and selected
  multi-select users.
- [ ] Ensure a selected multi-user ID cannot be added twice.
- [ ] Run:

```powershell
pnpm vitest run src/features/settings/users/components/__tests__/PaginatedUserSelect.test.tsx src/features/communication/components/selectors/__tests__/UserSearchSelect.test.tsx src/features/communication/components/selectors/__tests__/UserMultiSearchSelect.test.tsx
```

## Task 4: Migrate account linking and registration

**Files:**

- Modify:
  `src/features/students-guardians/shared/components/ExistingAccountPicker.tsx`
- Add or modify:
  `src/features/students-guardians/shared/components/__tests__/ExistingAccountPicker.test.tsx`
- Modify:
  `src/features/students-guardians/registration/pages/RegistrationWizardPage.tsx`
- Modify relevant tests under:
  `src/features/students-guardians/registration/pages/__tests__/`

### Steps

- [ ] Replace `ExistingAccountPicker`'s local debounce and direct request with
  `usePaginatedUsers`.
- [ ] Enable the hook only while the picker is rendered.
- [ ] Preserve `status="active"`.
- [ ] Load the empty-query first page immediately after the picker appears.
- [ ] Keep the current full-name, username/email, and role result rows.
- [ ] Add an end-of-list observer or scroll-boundary handler to request later
  pages.
- [ ] Distinguish initial loading, loading more, empty, error, permission, and
  retry states.
- [ ] In `RegistrationWizardPage`, migrate only the Settings Users account
  search. Do not alter the separate guardian search powered by
  `fetchGuardians`.
- [ ] Reuse the page's generic visual search-result layout where practical,
  but remove its user-specific direct request and debounce state.
- [ ] Test empty-query loading, active status, server query changes, append,
  retry, and selection.
- [ ] Run the focused account-linking and registration suites discovered in
  those feature folders.

## Task 5: Migrate admissions interviewer selection

**Files:**

- Modify:
  `src/features/admissions/interviews/components/ScheduleInterviewModal.tsx`
- Add or modify:
  `src/features/admissions/interviews/components/__tests__/ScheduleInterviewModal.test.tsx`

### Steps

- [ ] Keep the existing teacher-role resolution through Settings Roles.
- [ ] Replace the one-time teacher-user preload with `PaginatedUserSelect`.
- [ ] Pass the resolved teacher role ID and `status="active"`.
- [ ] Enable requests only while the modal and selector are open.
- [ ] Preserve required validation, selected interviewer ID, loading copy, and
  no-active-teachers behavior.
- [ ] Test role resolution, empty-query first page, server search, pagination,
  role/status parameters, failure, and submit behavior.
- [ ] Run:

```powershell
pnpm vitest run src/features/admissions/interviews/components/__tests__/ScheduleInterviewModal.test.tsx
```

## Task 6: Migrate both Nedaa staff selectors

**Files:**

- Modify: `src/features/nedaa/pages/NedaaStaffAssignmentsPage.tsx`
- Modify:
  `src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx`

### Steps

- [ ] Keep dismissal-staff role resolution and gate loading in the page.
- [ ] Remove the eager `limit: 100` staff-user preload and the local
  `staffOptionsSource` list.
- [ ] Replace the staff list filter with `PaginatedUserSelect`.
- [ ] Replace the create-form staff selector with a separate
  `PaginatedUserSelect` controller instance.
- [ ] Pass the same resolved dismissal-staff role ID and `status="active"` to
  both.
- [ ] Keep the edit-mode staff field disabled and preserve its unchanged-value
  semantics.
- [ ] Keep staff filtering and form state independent so searching one does
  not replace options in the other.
- [ ] Preserve the selected filter/form labels after a query changes.
- [ ] Test exact role/status/page/search requests for both render sites,
  scrolling, clear/reset, create validation, and edit mode.
- [ ] Run:

```powershell
pnpm vitest run src/features/nedaa/pages/__tests__/NedaaStaffAssignmentsPage.test.tsx
```

## Task 7: Migrate teacher allocation without breaking reference data

**Files:**

- Modify:
  `src/features/academics/teacher-allocation/services/teacherAllocationTeachersApiService.ts`
- Modify:
  `src/features/academics/teacher-allocation/services/__tests__/teacherAllocationTeachersApiService.test.ts`
- Modify:
  `src/features/academics/teacher-allocation/services/teacherAllocationService.ts`
- Modify:
  `src/features/academics/teacher-allocation/container/TeacherAllocationContainer.tsx`
- Modify:
  `src/features/academics/teacher-allocation/views/TeacherAllocationView.tsx`
- Modify:
  `src/features/academics/teacher-allocation/components/AllocationMatrixView.tsx`
- Modify:
  `src/features/academics/teacher-allocation/components/TeacherSelect.tsx`
- Add or modify:
  `src/features/academics/teacher-allocation/components/__tests__/TeacherSelect.test.tsx`

### Steps

- [ ] Refactor the teacher directory service to resolve the teacher role once
  per container load and return its role ID with the complete reference list.
- [ ] Paginate the reference-list load through all active teacher pages so
  allocation labels, exports, bulk actions, and the teacher-load view do not
  lose teachers beyond the backend's default first page.
- [ ] Guard exhaustive pagination against malformed or non-advancing backend
  metadata.
- [ ] Store the resolved teacher role ID in
  `TeacherAllocationContainer` and propagate it through
  `TeacherAllocationView` and `AllocationMatrixView`.
- [ ] Keep the exhaustive `teachers` collection for existing reference-data
  consumers.
- [ ] Change `TeacherSelect` so visible dropdown results come from
  `usePaginatedUsers` using the propagated role ID and `status="active"`.
- [ ] Preserve the component's Arabic/English labels, load/capacity display,
  overloaded styling, clear action, and selected teacher.
- [ ] Enable the hook only while an individual teacher dropdown is open.
- [ ] Add infinite scrolling to the custom option list and remove local
  filtering as the source of visible search results.
- [ ] Test that rendering many closed cells issues no user requests.
- [ ] Test that opening one cell loads one first page, typing uses server
  search, scrolling appends, and the teacher scope is present on every
  request.
- [ ] Test complete reference-list pagination separately from dropdown search.
- [ ] Run the focused teacher-allocation service and component suites.

## Task 8: Localization and contract coverage

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify:
  `src/features/settings/services/__tests__/settingsUsersService.test.ts`
- Modify relevant translation-contract tests under:
  `src/messages/__tests__/`

### Steps

- [ ] Merge with the existing uncommitted message changes.
- [ ] Add equivalent English and Arabic strings for:
  - initial user loading;
  - loading more;
  - no users;
  - user load failure;
  - permission/unavailable state;
  - retry.
- [ ] Reuse existing generic translations where their meaning is exact.
- [ ] Add service assertions for `search`, `roleId`, `status`, `page`, and
  `limit` serialization and pagination mapping.
- [ ] Add a frontend validation test ensuring a limit above `100` is not used
  by the shared controller. Do not invent a backend field or endpoint.
- [ ] Run focused settings-service and translation tests.

## Task 9: Integrated verification and quality gates

### Focused verification

- [ ] Run all tests added or modified by Tasks 1 through 8.
- [ ] Run:

```powershell
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

- [ ] If the full repository has unrelated failures, record them and rerun
  direct focused commands for every changed area.

### Manual verification

- [ ] Open a shared communication user selector:
  - confirm empty-query page one;
  - type one character and confirm one debounced server request;
  - scroll and confirm increasing page numbers;
  - select, search again, and confirm the selected label remains.
- [ ] Verify multi-select chips survive query changes.
- [ ] Verify student and guardian account linking start with active users.
- [ ] Verify registration's user search changed while guardian search did not.
- [ ] Verify admissions requests only active teachers.
- [ ] Verify both Nedaa selectors request only active dismissal staff and keep
  independent search state.
- [ ] Verify teacher-allocation cells remain idle while closed and preserve
  load/capacity rows after opening.
- [ ] Verify English, Arabic, keyboard use, and RTL layout.

### Final scope audit

- [ ] Search for remaining searchable user controls that call
  `fetchSettingsUsers` directly or locally filter prefetched Settings Users.
- [ ] Confirm any remaining direct call is a non-dropdown directory/list
  workflow and document why it is out of scope.
- [ ] Confirm no non-user searchable select was converted to server search.
- [ ] Review the final production-code diff with the clean-code quality gate
  and all changed test files with the test quality gate before committing.
