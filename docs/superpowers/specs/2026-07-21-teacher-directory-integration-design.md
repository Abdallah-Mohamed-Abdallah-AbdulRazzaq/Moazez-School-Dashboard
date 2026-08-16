# Teacher Directory API Integration — Design Specification

> Date: 2026-07-21
> Contract source: `docs/teacher-management-dashboard-contract-workflow.md`
> Scope: Section 5.1 — Teacher Directory (7 endpoints)
> Approach: Contract-aligned frontend rewrite of `src/features/teachers/`

---

## 1. Overview

Replace the existing mock-based teacher feature with a contract-aligned implementation that:

- Calls the real backend API through the existing `apiClient` (Axios) infrastructure
- Models all 7 teacher directory endpoints with exact contract DTOs
- Uses repository-native React hooks for loading, mutation state, and explicit refreshes
- Renders a two-page layout: teacher list + teacher detail
- Supports three separate statuses (employment, account, membership)
- Implements the employment transition matrix with confirmation dialogs
- Handles all contract-specified error codes

Credential operations (§5.2), organization transfer (§5.3), and academic allocations (§5.4) are **out of scope** for this implementation.

---

## 2. Type System

### 2.1 Directory structure

```
src/features/teachers/
  types/
    enums.ts        — All enumeration types from §6
    responses.ts    — All response DTOs from §7
    requests.ts     — All request DTOs from §10, §11, §13, §15, §8
    forms.ts        — UI-specific form models
    index.ts        — Barrel exports
```

### 2.2 Enumerations (`enums.ts`)

From contract §6, mapped exactly:

```ts
type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';
type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'SUSPENDED';
type TeacherGender = 'MALE' | 'FEMALE';
type TeacherEmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
type TeacherEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
type TeacherWorkDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
type PreferredDisplayLanguage = 'AR' | 'EN';
type ProfileCompletenessFilter = 'complete' | 'incomplete';
type TeacherCredentialStatus = 'missing' | 'temporary_or_must_change' | 'must_change' | 'set';
```

### 2.3 Response types (`responses.ts`)

Match contract §7 exactly:

- `ErrorEnvelope` — `{ error: { code, message, details?, traceId? } }`
- `TeacherCredentialSummary` — `{ hasPassword, status, mustChangePassword, passwordProvisionedAt, passwordChangedAt, credentialVersion }`
- `TeacherProfileCompleteness` — `{ isComplete, missingFields[] }`
- `TeacherDirectoryListItem` — Full list item with id, userId, login info, bilingual names, displayName, gender, department, specialization, three statuses, profileCompleteness, credentialSummary, timestamps
- `TeacherDirectoryDetail extends TeacherDirectoryListItem` — Adds employmentType, experienceYears, hireDate, workingDays, workStartTime, workEndTime, notesAr, notesEn
- `Pagination` — `{ page, limit, total }`
- `TeachersListResponse` — `{ items: TeacherDirectoryListItem[], pagination: Pagination }`
- `TeacherEmploymentStatusResponse` — `{ teacher: TeacherDirectoryDetail, transition: { previousEmploymentStatus, employmentStatus, accountStatus, membershipStatus, membershipEndedAt, effectiveAt, revokedSessionCount, reassignmentRequired, allocationSummary } }`

### 2.4 Request types (`requests.ts`)

- `TeacherListQuery` — `{ search?, accountStatus?, membershipStatus?, employmentStatus?, gender?, profileCompleteness?, page?, limit? }`
- `CreateTeacherRequest` — From §10.2 (loginEmail/username identity modes, all profile fields, TERMINATED rejected)
- `UpdateTeacherRequest` — From §11.2 (all fields optional, at least one required)
- `ChangeTeacherEmploymentStatusRequest` — `{ employmentStatus, effectiveAt? }`
- `RehireTeacherRequest` — From §15.2 (complete profile payload, no identity/status fields)

### 2.5 Form types (`forms.ts`)

Internal UI form state models (not sent to API):

- `TeacherIdentityForm` — `{ identityMode: 'username' | 'loginEmail', username, loginEmail, contactEmail, phone }`
- `TeacherProfileForm` — `{ teacherCode, firstNameAr, lastNameAr, firstNameEn, lastNameEn, preferredDisplayLanguage, gender, department, specialization, employmentType, experienceYears, hireDate, notesAr, notesEn }`
- `TeacherScheduleForm` — `{ workingDays: TeacherWorkDay[], workStartTime, workEndTime }`
- `EmploymentStatusForm` — `{ employmentStatus: TeacherEmploymentStatus, effectiveAt?: string }`

---

## 3. API Service

### 3.1 File: `services/teacherApi.ts`

Uses `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `@/lib/api`.

```ts
const TEACHERS_PATH = '/teachers';

export const teacherApi = {
  list: (query?: TeacherListQuery) => apiGet<TeachersListResponse>(TEACHERS_PATH, { params: query }),
  get: (teacherId: string) => apiGet<TeacherDirectoryDetail>(`${TEACHERS_PATH}/${teacherId}`),
  create: (input: CreateTeacherRequest) => apiPost<TeacherDirectoryDetail>(TEACHERS_PATH, input),
  update: (teacherId: string, input: UpdateTeacherRequest) => apiPatch<TeacherDirectoryDetail>(`${TEACHERS_PATH}/${teacherId}`, input),
  changeEmploymentStatus: (teacherId: string, input: ChangeTeacherEmploymentStatusRequest) => apiPatch<TeacherEmploymentStatusResponse>(`${TEACHERS_PATH}/${teacherId}/employment-status`, input),
  archive: (teacherId: string) => apiDelete<void>(`${TEACHERS_PATH}/${teacherId}`),
  rehire: (teacherId: string, input: RehireTeacherRequest) => apiPost<TeacherDirectoryDetail>(`${TEACHERS_PATH}/${teacherId}/rehire`, input),
};
```

### 3.2 File: `services/teacherApiAdapter.ts`

**Removed.** The adapter pattern is no longer needed since we call the real API directly.

### 3.3 File: `services/teacherService.ts`

**Removed.** The in-memory mock store is replaced by real API calls.

---

## 4. Data Loading and Mutation State

No new data-fetching or state-management dependency is introduced. The feature
uses React's existing `useState`, `useEffect`, `useCallback`, and `useRef`
primitives with the repository's Axios helpers.

### 4.1 List hook (`hooks/useTeacherList.ts`)

`useTeacherList(query: TeacherListQuery)` owns:

- `data: TeachersListResponse | null`;
- `isLoading` for the initial request;
- `isRefreshing` when existing rows remain visible during a refresh;
- `error: ApiError | null`;
- `refresh(): Promise<void>` for post-mutation and retry flows.

The hook fetches whenever the normalized query changes. It uses an incrementing
request sequence stored in `useRef` so an older response cannot overwrite a
newer search/filter response after rapid URL changes.

### 4.2 Detail hook (`hooks/useTeacherDetail.ts`)

`useTeacherDetail(teacherId: string | undefined)` owns the same loading, error,
and refresh states for one teacher. It does not request until `teacherId` is
defined. It also exposes `replaceTeacher(teacher)` so successful update and
employment-transition responses immediately replace the displayed detail.

### 4.3 Action hook (`hooks/useTeacherActions.ts`)

The action hook wraps the five mutation endpoints and tracks the active action
without introducing a shared cache:

- `createTeacher(input)` returns the created detail;
- `updateTeacher(teacherId, input)` returns the updated detail;
- `changeEmploymentStatus(teacherId, input)` returns the transition response;
- `archiveTeacher(teacherId)` resolves only after the 204 response;
- `rehireTeacher(teacherId, input)` returns the restored detail.

The calling page coordinates local replacement, list refresh, navigation, and
toasts. The hook does not hide backend errors; it rethrows them after clearing
its loading state so the page or form can map them consistently.

### 4.4 Refresh contract

| Mutation | Immediate local update | Required refresh/navigation |
|---|---|---|
| Create | Use returned detail for success feedback | Refresh list before showing the new row |
| Update | Replace open detail with returned object | Refresh list when returning to or displaying it |
| Employment transition | Replace open detail with `response.teacher` | Refresh list; show transition summary |
| Archive | Clear the open detail | Navigate to list and refresh it |
| Rehire | Retain returned detail in the headless action result | Refresh any caller-owned list when a discovery UI exists |

On lifecycle `409`, refresh the detail before allowing resubmission because the
source state may have changed.

---

## 5. Utilities

### 5.1 Diff builder (`utils/buildTeacherPatch.ts`)

From contract §23.3:

```ts
function buildTeacherPatch(
  initial: TeacherDirectoryDetail,
  form: UpdateTeacherRequest
): UpdateTeacherRequest
```

- Compares each field against initial values
- Automatically includes `preferredDisplayLanguage` when any name changes
- Work times sent as a pair (both or neither)
- Empty strings normalized to `null` for nullable fields
- Returns empty object if no changes (caller prevents submission)

### 5.2 Form mappers (`utils/teacherFormMappers.ts`)

- `mapDetailToIdentityForm(detail: TeacherDirectoryDetail): TeacherIdentityForm`
- `mapDetailToProfileForm(detail: TeacherDirectoryDetail): TeacherProfileForm`
- `mapDetailToScheduleForm(detail: TeacherDirectoryDetail): TeacherScheduleForm`
- `mapFormsToCreateRequest(identity, profile, schedule, employmentStatus): CreateTeacherRequest`
- `mapFormsToUpdateRequest(identity, profile, schedule): UpdateTeacherRequest`
- `mapDetailToRehireRequest(profile, schedule): RehireTeacherRequest`

### 5.3 Employment transition helpers (`utils/employmentTransitions.ts`)

- `getAllowedTransitions(current: TeacherEmploymentStatus): TeacherEmploymentStatus[]`
- `canActivate(teacher: TeacherDirectoryDetail): { allowed: boolean, reasons: string[] }`
  - Checks: profile complete, credential exists (hasPassword=true), employment currently INACTIVE
- `getTransitionConfirmationText(from, to): string`

### 5.4 Pagination helpers (`utils/pagination.ts`)

```ts
function derivePagination(pagination: Pagination): {
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### 5.5 Error mapping (`utils/teacherErrors.ts`)

Maps API error codes to user-facing messages and form field associations:

| Error code | Form field | Message |
|---|---|---|
| `teachers.profile.code_conflict` | teacherCode | "Teacher code already in use" |
| `teachers.account.identity_conflict` | loginEmail/username | "Login identity already exists" |
| `teachers.account.teacher_role_required` | — | Configuration error; contact an administrator |
| `teachers.account.role_transition_conflict` | — | Refresh state and show a safe lifecycle conflict |
| `iam.user.username_invalid` | username | Username violates school policy |
| `iam.user.username_taken` | username | Username already exists |
| `iam.user.login_email_taken` | loginEmail | Generated login email already exists |
| `iam.user.login_domain_missing` | loginEmail | School login domain is not configured |
| `iam.user.email_taken` | loginEmail | Login email already exists |
| `teachers.lifecycle.invalid_transition` | — | Dynamic from reasonCode |
| `teachers.lifecycle.active_assignments` | — | Link to allocation management |
| `teachers.lifecycle.archive_conflict` | — | "Refresh and inspect state" |
| `teachers.lifecycle.revocation_failed` | — | "Retryable — please try again" |
| `validation.failed` | mapped from details.fields | Field-level validation messages |

---

## 6. Pages

### 6.1 Teacher List Page

**Route**: `app/[lang]/(dashboard)/teachers/page.tsx`

**Components**:
- Header with title, Add Teacher button (gated on `teachers.records.manage`)
- `TeacherFilterBar` — search + 5 filter dropdowns (employment, account, membership, gender, profile completeness)
- `TeacherListTable` — existing shared `DataTable` with 9 columns
- Server-driven pagination component
- Skeleton loading state
- Empty state (no results vs no teachers)
- URL query state sync via `useUrlQueryState`

**Behavior**:
- Debounce search (300ms)
- Reset page to 1 on filter change
- Keep all query state in URL
- Hide mutation actions without `teachers.records.manage`

### 6.2 Teacher Detail Page

**Route**: `app/[lang]/(dashboard)/teachers/[teacherId]/page.tsx`

**Components**:
- `TeacherDetailHeader` — Name, code, three-status badges, profile completeness, credential indicator
- `TeacherDetailSections` — Card-based content sections (identity, profile, employment, schedule, notes, metadata)
- Action bar — Edit, Employment actions, Archive (all gated on `teachers.records.manage`)

**Behavior**:
- Load detail via `useTeacherDetail(teacherId)`
- Show skeleton while loading
- Show 404 state on `teachers.profile.not_found`
- Never attempt to distinguish not-found sub-reasons (per §9.4)

### 6.3 Layout

```
app/[lang]/(dashboard)/teachers/
  layout.tsx     — Minimal pass-through layout; removes AcademicsContextLayout
  page.tsx       — List page
  [teacherId]/
    page.tsx     — Detail page
```

---

## 7. UI Components

All teacher feature components are built using the existing UI component library from `src/components/ui/`. No new UI primitives are created.

### 7.0 Existing UI Components Used

| Existing Component | Import Path | Usage |
|---|---|---|
| `DataTable` + `Column<T>` | `@/components/ui` | Teacher list table with `serverPagination` prop |
| `FilterPanel` | `@/components/ui` | Filter bar with search slot + filter dropdowns |
| `Modal` | `@/components/ui` | Create/Edit teacher dialogs (`size="xl"`) |
| `ConfirmDialog` | `@/components/ui` | Archive + employment transition confirmations |
| `Button` | `@/components/ui` | All action buttons (primary/danger/secondary/ghost) |
| `Input` | `@/components/ui` | Text fields (teacher code, email, phone, etc.) |
| `Select` + `SelectOption` | `@/components/ui` | Filter dropdowns, employment type, gender selectors |
| `BilingualTextField` | `@/components/ui` | Arabic/English name pairs, bilingual notes |
| `TextArea` | `@/components/ui` | Notes fields (AR/EN, max 500 chars) |
| `DatePicker` | `@/components/ui` | Hire date field |
| `DateTimePicker` | `@/components/ui` | `effectiveAt` field in employment transitions |
| `EmptyState` | `@/components/ui` | Empty table / no-results states |
| `AccessDenied` | `@/components/ui` | Permission denied screen |
| `DropdownMenu` + `DropdownItem` | `@/components/ui` | Row action menus in table |
| `useToast` | `@/components/ui/toast/Toast` | Success/error/warning notifications |
| `MainLoader` | `@/components/ui/loaders/MainLoader` | Full-page loading state |

### 7.1 `TeacherListTable.tsx`

Uses existing `DataTable<TeacherDirectoryListItem>` with `serverPagination` enabled:

```ts
<DataTable
  columns={columns}
  data={teachers}
  onRowClick={handleRowClick}
  getRowKey={(row) => row.id}
  isLoading={isLoading}
  searchQuery={searchQuery}
  serverPagination={{
    enabled: true,
    currentPage: page,
    pageSize: limit,
    totalItems: pagination.total,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }}
/>
```

Column definitions use `Column<TeacherDirectoryListItem>` with custom `render` functions:
1. Display name — custom render with initials avatar + `displayName.fullName`
2. Teacher code — `searchable: true` for highlighting
3. Department — plain text, `searchable: true`
4. Specialization — plain text
5. Employment status — render → `<TeacherStatusBadge>`
6. Account status — render → `<TeacherStatusBadge>`
7. Credential status — render → `<TeacherCredentialIndicator>`
8. Profile completeness — render → `<TeacherProfileCompleteness>`
9. Actions — render → `<DropdownMenu>` with `data-row-action` items

Row click navigates to detail page. Sorting disabled (`sortable: false` on all columns) per contract §8.4 (backend-fixed order).

### 7.2 `TeacherFilterBar.tsx`

Uses existing `FilterPanel` with `searchSlot` and `filtersSlot`:

```ts
<FilterPanel
  searchSlot={<Input placeholder={t("search")} value={search} onChange={...} />}
  filtersSlot={<>
    <Select options={employmentStatusOptions} value={...} onChange={...} />
    <Select options={accountStatusOptions} value={...} onChange={...} />
    <Select options={membershipStatusOptions} value={...} onChange={...} />
    <Select options={genderOptions} value={...} onChange={...} />
    <Select options={profileCompletenessOptions} value={...} onChange={...} />
  </>}
  showFilters={showFilters}
  onToggleFilters={toggleFilters}
  hasActiveFilters={hasActiveFilters}
  clearAction={<Button variant="ghost" onClick={clearAll}>{t("clearFilters")}</Button>}
/>
```

Filter `Select` options use `SelectOption[]` with exact enum values:
- Employment Status: `""` (ALL) | `"ACTIVE"` | `"INACTIVE"` | `"TERMINATED"`
- Account Status: `""` (ALL) | `"ACTIVE"` | `"INVITED"` | `"SUSPENDED"` | `"DISABLED"`
- Membership Status: `""` (ALL) | `"ACTIVE"` | `"INACTIVE"` | `"TRANSFERRED"` | `"SUSPENDED"`
- Gender: `""` (ALL) | `"MALE"` | `"FEMALE"`
- Profile Completeness: `""` (ALL) | `"complete"` | `"incomplete"`

### 7.3 `TeacherStatusBadge.tsx` (new teacher-specific component)

A small presentational component rendering a colored Tailwind CSS chip. **No new UI primitive** — just a styled `<span>` with status-to-color mapping:

| Category | Value | Color |
|---|---|---|
| Employment | ACTIVE | Green |
| Employment | INACTIVE | Amber |
| Employment | TERMINATED | Red |
| Account | ACTIVE | Green |
| Account | INVITED | Blue |
| Account | SUSPENDED | Amber |
| Account | DISABLED | Gray |
| Membership | ACTIVE | Green |
| Membership | INACTIVE | Gray |
| Membership | TRANSFERRED | Blue |
| Membership | SUSPENDED | Amber |

### 7.4 `TeacherCredentialIndicator.tsx` (new teacher-specific component)

Shows credential status as an icon + MUI Tooltip:
- `missing` → Red warning with "Credentials required"
- `temporary_or_must_change` → Amber with "Temporary password"
- `must_change` → Amber with "Must change password"
- `set` → Green checkmark with "Credentials set"

### 7.5 `TeacherProfileCompleteness.tsx` (new teacher-specific component)

- Complete: Green checkmark icon
- Incomplete: Orange warning icon with missing fields listed in MUI Tooltip

### 7.6 `CreateTeacherDialog.tsx`

Uses existing `Modal` (`size="xl"`) with `footer` containing Cancel + Submit `Button`s.

**Section 1 — Login Identity**:
- Radio toggle (username mode / login-email mode) using HTML radio inputs
- `Input` for username (shown in username mode)
- `Input` for login email (shown in login-email mode)
- `Input` for contact email
- `Input` for phone

**Section 2 — Bilingual Identity**:
- `Input` for teacher code (with normalized preview: uppercase, no spaces via `helperText`)
- `BilingualTextField` for first name (AR/EN pair)
- `BilingualTextField` for last name (AR/EN pair)
- `Select` for preferred display language (AR/EN)
- `Select` for gender (MALE/FEMALE)

**Section 3 — Employment Profile**:
- `Select` for employment status (ACTIVE/INACTIVE only — TERMINATED excluded per §10.2)
- `Input` for department
- `Input` for specialization
- `Select` for employment type (FULL_TIME/PART_TIME/CONTRACT)
- `Input` type="number" for experience years (0-60)
- `DatePicker` for hire date

**Section 4 — Work Schedule**:
- Checkbox group for working days (7 checkboxes, unique)
- `Input` type="time" for work start time
- `Input` type="time" for work end time
- Both required together or both empty

**Section 5 — Notes**:
- `TextArea` for notes Arabic (max 500, `dir="rtl"`)
- `TextArea` for notes English (max 500, `dir="ltr"`)

Post-creation success: `useToast().showSuccess()` with caveat about account activation (§10.7).

### 7.7 `EditTeacherDialog.tsx`

Same sections as Create, using the same UI components, but:
- Pre-populated from `TeacherDirectoryDetail`, except
  `preferredDisplayLanguage`, which the response contract does not return
- Initializes `preferredDisplayLanguage` from the current dashboard locale and
  keeps the selector visible so the administrator explicitly controls the
  compatibility-name projection when editing either language pair
- Does NOT show employment status (use employment-status endpoint)
- Does NOT show account/membership status fields
- Uses diff builder to send minimal PATCH
- Enforces name + `preferredDisplayLanguage` coupling

### 7.8 `EmploymentTransitionDialog.tsx`

Uses existing `ConfirmDialog` with `severity` matching the transition:

**ACTIVE teacher** can:
- Inactivate → `ConfirmDialog` with `severity="warning"`, confirmation copy from §13.8
- Terminate → `ConfirmDialog` with `severity="danger"`, termination copy from §13.8

**INACTIVE teacher** can:
- Activate → Custom `Modal` with pre-check display (profile complete? credential exists?), then confirm
- Terminate → `ConfirmDialog` with `severity="danger"`

**TERMINATED teacher**: No transitions available.

Optional `effectiveAt` field using `DateTimePicker` (defaults to server time when omitted).

On success: Shows transition result via `Modal` with revoked session count, reassignment warning, allocation summary.

### 7.9 `ArchiveConfirmDialog.tsx`

Uses existing `ConfirmDialog` with `severity="danger"`:
- Description text from §14.5
- `confirmLabel`: translated "Archive" label
- On 204 success: navigate to list via `router.push`, refresh list state, `useToast().showSuccess()`
- On 409 (active assignments): `useToast().showError()` with link text pointing to academic allocations

---

## 8. Error Handling

### 8.1 Global error patterns

All API errors go through `lib/api-error.ts` → `ApiError` class.

Teacher-specific errors are mapped in `utils/teacherErrors.ts` to:
- Toast messages for action errors
- Form field errors for validation failures
- Refresh-and-retry for 409 conflicts

### 8.2 Error code → UI behavior mapping

| Code | HTTP | UI Behavior |
|---|---|---|
| `teachers.profile.not_found` | 404 | Navigate to list or show not-found |
| `teachers.profile.code_conflict` | 409 | Highlight teacher code field |
| `teachers.profile.incomplete` | 409 | Highlight missing profile fields |
| `teachers.account.identity_conflict` | 409 | Highlight identity fields |
| `teachers.account.teacher_role_required` | 422 | Show an administrator-facing configuration error |
| `teachers.account.role_transition_conflict` | 409 | Refresh state and show a safe lifecycle conflict |
| `iam.user.username_invalid` | 422 | Highlight username |
| `iam.user.username_taken` | 409 | Highlight username |
| `iam.user.login_email_taken` | 409 | Highlight login email |
| `iam.user.login_domain_missing` | 422 | Show school login-domain configuration error |
| `iam.user.email_taken` | 409 | Highlight login email |
| `teachers.lifecycle.invalid_transition` | 409 | Refresh detail, show explanation |
| `teachers.lifecycle.active_assignments` | 409 | Show assignment conflict, link to allocations |
| `teachers.lifecycle.archive_conflict` | 409 | Refresh and inspect |
| `teachers.lifecycle.revocation_failed` | 503 | Show retryable action |
| `validation.failed` | 400 | Map field-level errors to form |
| `auth.scope.missing` | 403 | Access denied message |

---

## 9. Permissions

### 9.1 Permission checks

| UI Element | Permission |
|---|---|
| View teacher list | `teachers.records.view` |
| View teacher detail | `teachers.records.view` |
| Add Teacher button | `teachers.records.manage` |
| Edit button | `teachers.records.manage` |
| Employment transition actions | `teachers.records.manage` |
| Archive button | `teachers.records.manage` |
| Table row action menu (mutating) | `teachers.records.manage` |

### 9.2 Integration with `usePermissions`

Add `teachers.records.view` and `teachers.records.manage` to the permissions system.

---

## 10. Files to Delete

The following files are replaced by the new implementation:

- `src/features/teachers/types.ts` — replaced by `types/` directory
- `src/features/teachers/services/teacherService.ts` — mock store removed
- `src/features/teachers/services/teacherApiAdapter.ts` — adapter pattern removed
- `src/features/teachers/components/TeacherStatusChip.tsx` — replaced by `TeacherStatusBadge.tsx`
- `src/features/teachers/components/TeachersListPanel.tsx` — replaced by `TeacherListTable.tsx`
- `src/features/teachers/components/TeacherFiltersBar.tsx` — replaced by `TeacherFilterBar.tsx`
- `src/features/teachers/components/TeacherFormDialog.tsx` — replaced by Create/Edit dialogs
- `src/features/teachers/components/TeacherDetailsDrawer.tsx` — replaced by detail page
- `src/features/teachers/components/ChangeTeacherPasswordModal.tsx` — out of scope (credentials)
- `src/features/teachers/pages/TeachersPage.tsx` — replaced by new list page
- `src/features/teachers/utils/teacherMappers.ts` — replaced by new mappers
- `src/features/teachers/utils/teacherValidation.ts` — replaced by new validation

Files to **keep**:
- `src/features/teachers/shared/` — export utilities remain useful
- `src/features/teachers/utils/__tests__/` — tests will be updated

---

## 11. Known Limitations

### Gap 1 — Archived teacher discovery (§25.1)
No archived teacher listing or archived-detail endpoint exists. The API service,
request mapping, action hook, and tests will cover rehire, but this scope will
not expose a rehire button or archived-teacher page. A visible rehire workflow is
deferred until an authorized discovery mechanism supplies archived teacher IDs
and the profile data needed to build the complete rehire payload.

### Gap 2 — Account activation bridge (§25.2)
After teacher creation, the account is INVITED but the backend doesn't have a verified INVITED → ACTIVE bridge. The UI will show a caveat message (§10.7) and NOT promise login readiness.

### Gap 3 — No client-defined sort (§25.5)
Teacher list ordering is backend-fixed. No sort controls in the table UI.

---

## 12. Testing Strategy

Testing follows the repository's existing Vitest, Testing Library, and
Playwright setup.

- API service tests mock `apiGet`, `apiPost`, `apiPatch`, and `apiDelete` and
  verify all seven paths, methods, query parameters, payloads, and the archive
  `void` response.
- Data-hook tests verify loading/error transitions, stale-response protection,
  explicit refreshes, local detail replacement, and lifecycle-409 refresh.
- Utility tests cover form mapping, nullable-field normalization, minimal PATCH
  generation, bilingual-name coupling, work-time pairing, allowed lifecycle
  transitions, and pagination derivation.
- Component tests cover permissions, filter serialization, loading/empty/error
  states, action availability, field-level API errors, and destructive
  confirmations.
- Page integration tests cover list-to-detail navigation and mutation success
  paths without depending on live backend data.
- `e2e/teachers-smoke.spec.ts` is rewritten around the contract-aligned list and
  detail routes, URL-backed server filters, permission gates, and safe dialog
  entry points.
- Rehire remains headless in this scope: its service, request mapper, action,
  and caller-refresh behavior are tested even though no archived-record UI is exposed.

---

## 13. Acceptance Criteria

From contract §24, scoped to Section 5.1:

- [ ] User without `teachers.records.view` cannot open the list
- [ ] User with view but without manage sees no mutation actions
- [ ] Default request uses page 1 and limit 20
- [ ] Search is debounced and resets page
- [ ] All supported filters use exact enum casing
- [ ] Employment, account, membership, credential, and completeness states are displayed separately
- [ ] Username mode does not send a conflicting login email
- [ ] Teacher code is previewed in normalized form
- [ ] Empty patches are prevented
- [ ] Name changes include preferred language
- [ ] Only allowed employment transitions are offered
- [ ] Activation requires password and complete profile in UI
- [ ] 409 triggers state refresh
- [ ] Archive 204 is not parsed as JSON
- [ ] Assignment conflicts link to allocation management
- [ ] Rehire service and refresh behavior are covered without exposing an undiscoverable archived-record UI
