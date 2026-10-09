# Academic Content Center Wave 1 + Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Academic Content Hub placeholder with a permission-aware, bilingual School Dashboard workspace for the ACC-0 through ACC-5 management contract: library, draft authoring, academic targets, type details, links, tags, resumable files, readiness, revision reads, draft lifecycle, and file-policy settings.

**Architecture:** Keep the existing `/[lang]/academic-content-hub` route and add a feature boundary under `src/features/academic-content`. Use the existing Axios API helpers, manual React state/hooks, Academic Year/Term context, and `src/components/ui` primitives; do not add a query, forms, or component library. Treat each backend aggregate section as an explicit save boundary, keep upload capabilities in memory only, and refresh the aggregate/readiness after successful mutations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Axios-backed `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete`, `next-intl`, Tailwind CSS, existing shared UI primitives, Vitest 2 + Testing Library.

**Spec:** `C:/Users/Ahmed Mostafa/Downloads/message (4).txt`, verified against backend commit `b32104d9cea3155c2f09860bcbbfbfb0732f0fac`.

## Global Constraints

- Backend contract authority for this plan is `Moazez-Backend@b32104d9cea3155c2f09860bcbbfbfb0732f0fac` (ACC-0 through ACC-5).
- Backend `origin/main` was `00ee6b693a1c119aff7364e207baf5002bae6923` during the audit and contains ACC-6A through ACC-6D. Review/approval/workflow-policy/preparation-template UI remains outside this Wave 1 + Wave 2 plan.
- Frontend audit baseline is `Moazez-School-Dashboard@bb4164350a61540ce84121db2f170cff19efac84`.
- Start implementation from the latest GitHub `main`, on one new feature branch and one Draft PR; never develop or push directly on `main`, force-push, rewrite history, merge, or deploy.
- Run the `clean-code-guard` skill after every production-code task and before each task commit.
- Run the `test-guard` skill after every test-code task and before each task commit.
- Do not run `npm run test:run`, `npm run test:all`, or any other full test suite without asking the owner first. Targeted Vitest files are allowed during implementation.
- Use existing components from `src/components/ui`; extend a shared primitive only when the feature cannot be expressed through its current public props.
- Preserve the backend enum values exactly; translations affect labels only.
- Model the complete `AcademicContentStatus` enum, but expose only `DRAFT` and `ARCHIVED` actions in this plan.
- Never add submit, approval, publish, scheduling, visibility windows, notification/reminder, acknowledgement action, analytics, copy, or custom-folder-tree UI.
- Never hardcode a production API origin. Feature calls use relative paths beneath the existing `NEXT_PUBLIC_API_URL` base.
- Treat `sessionUrl` as a bearer capability: hold it only inside the active upload operation, never place it in local/session storage, URL state, logs, telemetry, global context, or persisted React state.
- The binary upload path is browser to the GCS resumable session. Do not reuse the existing learning-media proxy fallback because it would route bytes through the Next.js/Moazez application path.
- Store all byte counts as decimal strings at API boundaries. Convert to `bigint` only for comparison/formatting; never rely on JavaScript `number` for policy limits.
- Keep Arabic/English behavior and RTL/LTR layout parity. Use the existing Cairo font and theme tokens; do not introduce the colors or fonts suggested by external design-system searches.
- All inputs need visible labels; error summaries use `role="alert"` or `aria-live`; status/readiness cannot be communicated by color alone; icon-only actions need accessible names.
- Validate responsive behavior at 375px, 768px, 1024px, and 1440px without horizontal page scrolling.
- Backend authorization is authoritative. Frontend permission checks hide/disable unavailable controls but do not replace server enforcement.

---

## Source Audit

### Backend repository findings

The backend audit read the exact authority commit directly from the repository rather than relying only on the handoff. The primary files were:

- `src/modules/academics/academic-content/controller/academic-content.controller.ts`
- `src/modules/academics/academic-content/controller/academic-content-file-policy.controller.ts`
- `src/modules/academics/academic-content/dto/academic-content-request.dto.ts`
- `src/modules/academics/academic-content/dto/academic-content-response.dto.ts`
- `src/modules/academics/academic-content/dto/academic-content-revision-response.dto.ts`
- `src/modules/academics/academic-content/dto/academic-content-type-detail.dto.ts`
- `src/modules/academics/academic-content/domain/academic-content-*.policy.ts`
- `src/modules/academics/academic-content/files/**`
- `src/modules/iam/reference-data/tests/academic-content-permissions.spec.ts`

Confirmed facts:

- The controller base is `/academics/academic-content`; the global configured API base supplies `/api/v1`.
- Read operations require `academics.academic_content.view`; mutations require `academics.academic_content.manage`; file-policy mutation requires `academics.academic_content.settings.manage`.
- Management detail includes common fields plus `targets`, `assets`, `links`, `tags`, and a type-selected `details` value.
- `GENERAL_RESOURCE` intentionally has `details: null` and no detail-write endpoint.
- Create fixes identity with `academicYearId`, `termId`, and `type`; PATCH only accepts `title`, `description`, and `audience`.
- The list contract is server-paginated (`page` default 1, `limit` default 50, limit 1..100) and supports every filter listed in the handoff.
- Target replacement is whole-array replacement. Exactly one hierarchy anchor is valid per target; multiple targets are OR alternatives. Subject qualification is mandatory for preparation, weekly plan, subject resource, and online session.
- Type-detail length/range rules are enforced in domain policies even where class-validator decorators do not repeat them. The frontend may provide immediate feedback but must still display backend domain errors.
- Readiness has `{ canAdvance, blockingReasons[] }`. Response DTOs can also carry an optional `details` object on a blocking reason, so the frontend type must preserve it even though the handoff showed only code/message.
- Detail reads, revision-detail reads, online-session writes, and upload-intent responses use `Cache-Control: no-store, private, max-age=0` where sensitive data may be present.
- Upload intent is idempotent by `clientRequestId` and returns a GCS resumable capability. Default maximum size is `536870912` bytes and hard maximum is `10737418240` bytes.
- Upload preflight accepts only the backend registry's exact extension/MIME pairs: PDF, TXT, CSV, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/JPEG, PNG, WEBP, GIF, MP4, WEBM video, MP3, M4A, WAV, OGG, WEBM audio, ZIP, and 7Z. Browser MIME values outside those pairs must be rejected before intent creation and still remain subject to server signature verification.
- Default policy enables attachments, documents, images, videos, audio, student/guardian download, and inline preview; archives and other files default off.
- Revision list is paginated. V2 snapshot details are immutable; V1 and general-resource revisions can return `details: null`.
- Current backend main has added ACC-6 workflow/review/template routes after the authority SHA. Those routes are deliberately excluded here so this implementation does not silently expand scope.

### Frontend repository findings

- `/[lang]/academic-content-hub/page.tsx` exists but renders only `ComingSoon`.
- `src/config/navigation.ts` contains a top-level Academic Content Hub item with a “Coming soon” badge.
- `src/hooks/usePermissions.ts` currently treats `academic-content-hub` as a navigation key without a permission, and `PermissionKey` does not include the three ACC permissions.
- The hub route is outside the existing academics context route group. A feature-specific layout must wrap it with `AcademicsContextLayout` so it reuses the year/term selector and closed-term state.
- The project has no TanStack Query/SWR and no form library. Existing features use typed services/adapters, `useEffect`/`useState` hooks, explicit save actions, and Vitest mocks.
- `src/lib/api.ts` already supplies token refresh, normalized `ApiError`, domain error codes/details, and all required HTTP verbs.
- `DataTable` already supports server pagination and URL pagination state; `FilterPanel`, `Input`, `Select`, `TextArea`, `DatePicker`, `DateTimePicker`, `Button`, `Modal`, `ConfirmDialog`, `EmptyState`, `AccessDenied`, `DragDropUploadArea`, and attachment display primitives are available under `src/components/ui`.
- Existing Academic Year/Term context uses `year` and `term` URL parameters plus local-storage fallback. Content-library filters must preserve those parameters.
- Existing selectors are available from academic structure, subjects, teacher allocations, curriculum, lesson plans, homework, grades assessments, and timetable services. They should be adapted, not duplicated.
- Existing learning-media upload code uses direct XHR but may fall back to a Next.js proxy and has a different intent response (`uploadUrl`). ACC needs its own GCS resumable client and must not inherit the proxy fallback or fixed 20/200 MiB validation rules.
- The original checkout had unrelated changes on `fix/remove-chat-invitations`; this plan was created in a separate managed worktree and did not modify those files.

### Gap summary

| Area | Current frontend | Required result |
|---|---|---|
| Route/navigation | Coming-soon page, public nav item | Context-aware, permission-filtered workspace |
| Contracts | No ACC types/services | Exact ACC-0..5 types, mappers, API adapter |
| Library | None | Server search/filter/pagination and type summaries |
| Authoring | None | Create once, then section-scoped draft saves |
| Selectors | Existing sources in separate features | Thin ACC selector composition over authoritative sources |
| Uploads | Other upload contracts and proxy fallback | Direct in-memory GCS resumable workflow |
| Lifecycle | None | Draft edit/archive/delete and archived read/restore |
| Readiness/revisions | None | Server-authoritative readiness and immutable history |
| Settings | None | Permission-aware file-policy form using decimal strings |

---

## File Structure

### Routes and navigation

- Modify `src/app/[lang]/(dashboard)/academic-content-hub/page.tsx` — library route entry.
- Create `src/app/[lang]/(dashboard)/academic-content-hub/layout.tsx` — Academic Year/Term context wrapper.
- Create `src/app/[lang]/(dashboard)/academic-content-hub/new/page.tsx` — create route.
- Create `src/app/[lang]/(dashboard)/academic-content-hub/[contentId]/page.tsx` — detail/edit route.
- Create `src/app/[lang]/(dashboard)/academic-content-hub/settings/file-policy/page.tsx` — settings route.
- Modify `src/config/navigation.ts` and its tests — remove “Coming soon” and attach the view permission.
- Modify `src/hooks/usePermissions.ts` and its tests — add ACC permission keys and navigation mapping.

### Feature boundary

- Create `src/features/academic-content/types/contracts.ts` — backend request/response DTOs and enums.
- Create `src/features/academic-content/model/academicContentPolicy.ts` — audience matrix, subject requirements, immutable-context helpers, form validation, size-string utilities.
- Create `src/features/academic-content/services/academicContentApi.ts` — every ACC-0..5 API call, no invented routes.
- Create `src/features/academic-content/services/academicContentErrors.ts` — preserve backend code/message/details/traceId for UI presentation.
- Create `src/features/academic-content/services/academicContentUpload.ts` — transient direct-GCS resumable operation.
- Create `src/features/academic-content/hooks/useAcademicContentLibrary.ts` — URL-derived filters, debounced search, race-safe loading.
- Create `src/features/academic-content/hooks/useAcademicContentEditor.ts` — aggregate loading, section saves, dirty state, readiness refresh.
- Create `src/features/academic-content/components/AcademicContentAccessGuard.tsx` — feature-level view guard.
- Create `src/features/academic-content/components/AcademicContentShell.tsx` — Library/Create/Drafts/Archived/Settings navigation.
- Create the exact library component files listed in Task 4 — filter panel, table, status, and type-summary cells.
- Create the exact editor component files listed in Tasks 5–10 — common metadata, target builder, five detail forms, general-resource notice, links, tags, files, readiness, revisions, and lifecycle controls.
- Create `src/features/academic-content/pages/AcademicContentLibraryPage.tsx`.
- Create `src/features/academic-content/pages/CreateAcademicContentPage.tsx`.
- Create `src/features/academic-content/pages/AcademicContentEditorPage.tsx`.
- Create `src/features/academic-content/pages/AcademicContentFilePolicyPage.tsx`.
- Create `src/features/academic-content/index.ts` — route-facing public exports only.
- Modify `src/messages/ar.json` and `src/messages/en.json` — all ACC labels, help text, empty/loading/error states.

### Tests

- Create focused tests beside each service/model/component under `__tests__`.
- Modify `src/config/__tests__/navigation.test.ts` and `src/components/layout/__tests__/Sidebar.test.tsx`.
- Do not add E2E coverage until the feature is stable and the owner separately approves any full-suite run.

---

## Task 1: Add exact contracts, policies, and error preservation

**Files:**
- Create: `src/features/academic-content/types/contracts.ts`
- Create: `src/features/academic-content/model/academicContentPolicy.ts`
- Create: `src/features/academic-content/services/academicContentErrors.ts`
- Test: `src/features/academic-content/model/__tests__/academicContentPolicy.test.ts`
- Test: `src/features/academic-content/services/__tests__/academicContentErrors.test.ts`

**Interfaces:**
- Consumes: `ApiError` from `src/lib/api-error.ts`.
- Produces: all DTOs used by subsequent tasks; `allowedAudiences(type)`, `requiresSubject(type)`, `validateTargetDraft(target, type)`, `parseByteCount(value)`, `formatByteCount(value)`, and `academicContentUiError(error)`.

- [ ] **Step 1: Write failing policy tests**

```ts
import { describe, expect, it } from "vitest";
import {
  allowedAudiences,
  parseByteCount,
  requiresSubject,
  validateTargetDraft,
} from "../academicContentPolicy";

describe("academic content policy", () => {
  it("restricts preparation to internal staff", () => {
    expect(allowedAudiences("TEACHER_PREPARATION")).toEqual(["INTERNAL_STAFF"]);
  });

  it("requires a subject for online-session targets", () => {
    expect(requiresSubject("ONLINE_SESSION")).toBe(true);
    expect(validateTargetDraft({ scopeType: "GRADE", gradeId: "grade-1" }, "ONLINE_SESSION"))
      .toContain("subjectId");
  });

  it("keeps byte counts outside number arithmetic", () => {
    expect(parseByteCount("10737418240")).toBe(10737418240n);
  });
});
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `npx vitest run src/features/academic-content/model/__tests__/academicContentPolicy.test.ts`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Define backend-exact discriminated contracts**

Include the complete status enum while keeping action policy separate:

```ts
export type AcademicContentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "EXPIRED"
  | "ARCHIVED"
  | "CANCELLED";

export type AcademicContentType =
  | "TEACHER_PREPARATION"
  | "WEEKLY_PLAN"
  | "GUARDIAN_WEEKLY_NOTE"
  | "SUBJECT_RESOURCE"
  | "ONLINE_SESSION"
  | "GENERAL_RESOURCE";

export interface AcademicContentReadinessReason {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

Define request DTOs separately from response DTOs so immutable create fields cannot leak into PATCH payloads. Define `details` as a union selected by the outer content `type`; do not add a fake general-resource detail type.

- [ ] **Step 4: Implement pure frontend policy helpers**

Mirror only stable presentation constraints: audience choices, subject-required types, one hierarchy anchor, field lengths, date ordering, HTTPS URL shape, and byte-string parsing. Do not duplicate backend readiness evaluation.

- [ ] **Step 5: Write and implement error-preservation tests**

```ts
expect(
  academicContentUiError(
    new ApiError("Term is closed", 409, "academic_content.term.closed", undefined, {
      termId: "term-1",
    }, "trace-1"),
  ),
).toEqual({
  code: "academic_content.term.closed",
  message: "Term is closed",
  details: { termId: "term-1" },
  traceId: "trace-1",
});
```

- [ ] **Step 6: Run both targeted tests**

Run: `npx vitest run src/features/academic-content/model/__tests__/academicContentPolicy.test.ts src/features/academic-content/services/__tests__/academicContentErrors.test.ts`

Expected: PASS.

- [ ] **Step 7: Apply quality gates and commit**

Run `test-guard` on both new test files and `clean-code-guard` on the three production files, address findings, then commit:

```text
feat(academic-content): add frontend contract model
```

---

## Task 2: Implement the ACC-0..5 API boundary

**Files:**
- Create: `src/features/academic-content/services/academicContentApi.ts`
- Test: `src/features/academic-content/services/__tests__/academicContentApi.test.ts`

**Interfaces:**
- Consumes: DTOs from Task 1 and API helpers from `src/lib/api.ts`.
- Produces: `listAcademicContent`, `getAcademicContent`, `getAcademicContentReadiness`, `createAcademicContent`, `updateAcademicContent`, `replaceAcademicContentTargets`, five detail writers, `replaceAcademicContentLinks`, `replaceAcademicContentTags`, upload intent/complete/cancel, asset unlink, revisions, archive/restore/delete, and file-policy get/update.

- [ ] **Step 1: Write endpoint-contract tests for every method group**

Use hoisted mocks for all five API helpers. Assert paths, query params, HTTP verbs, and payloads. Example:

```ts
await listAcademicContent({
  academicYearId: "year-1",
  termId: "term-1",
  status: "DRAFT",
  search: "fractions",
  page: 2,
  limit: 25,
});

expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
  params: {
    academicYearId: "year-1",
    termId: "term-1",
    status: "DRAFT",
    search: "fractions",
    page: 2,
    limit: 25,
  },
});
```

Also assert that update sends only `title`, `description`, and `audience`, and that no service exposes approval or publication routes.

- [ ] **Step 2: Run the service test and verify it fails**

Run: `npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts`

Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement a route-accurate service**

Use one base constant:

```ts
const BASE_PATH = "/academics/academic-content";

export const getAcademicContent = (contentId: string) =>
  apiGet<AcademicContentDetailResponse>(`${BASE_PATH}/${encodeURIComponent(contentId)}`);

export const replaceAcademicContentTargets = (
  contentId: string,
  targets: AcademicContentTargetInput[],
) => apiPut<AcademicContentTargetsResponse>(
  `${BASE_PATH}/${encodeURIComponent(contentId)}/targets`,
  { targets },
);
```

Pass list filters through Axios `params` and omit empty values before the call. Never include `/api/v1` in feature paths because the configured base already owns it.

- [ ] **Step 4: Run targeted service tests**

Run: `npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts`

Expected: PASS with all endpoint groups covered.

- [ ] **Step 5: Apply quality gates and commit**

Run `test-guard`, run `clean-code-guard`, fix findings, then commit:

```text
feat(academic-content): add management api boundary
```

---

## Task 3: Activate routes, permissions, navigation, and workspace shell

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/hooks/__tests__/usePermissions.test.ts`
- Modify: `src/config/navigation.ts`
- Modify: `src/config/__tests__/navigation.test.ts`
- Modify: `src/components/layout/__tests__/Sidebar.test.tsx`
- Create: `src/features/academic-content/components/AcademicContentAccessGuard.tsx`
- Create: `src/features/academic-content/components/AcademicContentShell.tsx`
- Create: `src/features/academic-content/components/__tests__/AcademicContentAccessGuard.test.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/layout.tsx`
- Create: `src/features/academic-content/index.ts`

**Interfaces:**
- Consumes: `AcademicsContextLayout`, `AccessDenied`, `usePermissions`, and existing navigation filtering.
- Produces: a route shell that all ACC pages share and permission keys available to later tasks.

- [ ] **Step 1: Update tests first**

Change the navigation expectation from “upcoming” to an active item without `statusBadge`, and assert that users without `academics.academic_content.view` do not see it. Add guard tests for loading, access denied, and granted states.

- [ ] **Step 2: Run targeted tests and verify the new assertions fail**

Run: `npx vitest run src/hooks/__tests__/usePermissions.test.ts src/config/__tests__/navigation.test.ts src/components/layout/__tests__/Sidebar.test.tsx src/features/academic-content/components/__tests__/AcademicContentAccessGuard.test.tsx`

- [ ] **Step 3: Extend permissions and navigation**

Add:

```ts
| "academics.academic_content.view"
| "academics.academic_content.manage"
| "academics.academic_content.settings.manage"
```

Remove `academic-content-hub` from `navigationKeysWithoutPermission` and map it to `academics.academic_content.view`. Remove the coming-soon badge from the navigation entry.

- [ ] **Step 4: Add the feature layout and shell**

The route layout must compose existing context and access control:

```tsx
export default function AcademicContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AcademicsContextLayout>
      <AcademicContentAccessGuard>
        <AcademicContentShell>{children}</AcademicContentShell>
      </AcademicContentAccessGuard>
    </AcademicsContextLayout>
  );
}
```

The shell exposes Library, Drafts, Archived, Create, and Settings links. Drafts/Archived are root-library URLs with `contentStatus=DRAFT|ARCHIVED`; they are not duplicate page implementations. Hide Create without manage permission. Keep Settings readable with the view permission and disable its mutation controls without settings-manage permission.

- [ ] **Step 5: Run targeted tests, then quality gates and commit**

Expected targeted tests: PASS. Run `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): activate guarded workspace routes
```

---

## Task 4: Build the server-paginated library

**Files:**
- Create: `src/features/academic-content/hooks/useAcademicContentLibrary.ts`
- Create: `src/features/academic-content/components/library/AcademicContentFilters.tsx`
- Create: `src/features/academic-content/components/library/AcademicContentTable.tsx`
- Create: `src/features/academic-content/components/library/AcademicContentStatusBadge.tsx`
- Create: `src/features/academic-content/components/library/AcademicContentSummary.tsx`
- Create: `src/features/academic-content/pages/AcademicContentLibraryPage.tsx`
- Modify: `src/app/[lang]/(dashboard)/academic-content-hub/page.tsx`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentLibrary.test.tsx`
- Test: `src/features/academic-content/components/library/__tests__/AcademicContentFilters.test.tsx`
- Test: `src/features/academic-content/components/library/__tests__/AcademicContentTable.test.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentLibraryPage.test.tsx`

**Interfaces:**
- Consumes: list API, academic context, `FilterPanel`, `Input`, `Select`, `DataTable`, `EmptyState`, and permission flags.
- Produces: URL-stable list filters and navigation to the content editor.

- [ ] **Step 1: Write failing hook tests**

Cover: default page/limit, 300 ms debounced search, preserving `year`/`term`, resetting page to 1 after filter changes, stale-request protection, and using server `total`.

```ts
expect(listAcademicContent).toHaveBeenLastCalledWith(
  expect.objectContaining({ academicYearId: "year-1", termId: "term-1", page: 1, limit: 50 }),
);
```

- [ ] **Step 2: Implement the library hook without a new cache dependency**

Keep filters serializable in the URL. Maintain `items`, `total`, `isLoading`, `error`, and `reload`; use an incrementing request id or AbortController so older responses cannot overwrite newer filters.

- [ ] **Step 3: Write failing UI tests**

Cover all backend filters, summary variants, `summary: null`, empty state, retry, server page changes, and view-only permissions. Assert search is capped at 120 characters and tag at 80. Resolve `teacherUserId` choices through the existing teacher directory service rather than a feature-owned list.

- [ ] **Step 4: Implement filters and table using shared UI components**

Use `DataTable.serverPagination`:

```tsx
<DataTable
  columns={columns}
  data={items}
  getRowKey={(row) => row.id}
  serverPagination={{
    enabled: true,
    currentPage: filters.page,
    pageSize: filters.limit,
    totalItems: total,
    onPageChange: setPage,
    onPageSizeChange: setLimit,
  }}
/>
```

Do not expose join URLs/access codes in list rows. Render dates and labels locally while retaining enum values in query parameters.

- [ ] **Step 5: Replace the placeholder route with the real page**

The route remains a thin import/export so business logic stays in the feature boundary.

- [ ] **Step 6: Run targeted tests, quality gates, and commit**

Run only the new library tests plus navigation tests. Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add searchable content library
```

---

## Task 5: Add create flow and editor foundation

**Files:**
- Create: `src/features/academic-content/components/editor/BasicInformationSection.tsx`
- Create: `src/features/academic-content/components/editor/EditorSectionNav.tsx`
- Create: `src/features/academic-content/hooks/useAcademicContentEditor.ts`
- Create: `src/features/academic-content/pages/CreateAcademicContentPage.tsx`
- Create: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/new/page.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/[contentId]/page.tsx`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentEditor.test.tsx`
- Test: `src/features/academic-content/pages/__tests__/CreateAcademicContentPage.test.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Interfaces:**
- Consumes: create/detail/update APIs, academic context, audience policy, manage permission, and the existing guarded academic-context change pattern.
- Produces: a loaded editor aggregate, `saveMetadata`, `refreshAggregate`, `refreshReadiness`, and section dirty/saving/error state for later tasks.

- [ ] **Step 1: Write create-flow tests**

Assert required year/term/type/audience/title, type-driven audience options, title 180, description 4000, a create payload with only the six supported fields, and redirect to `/{locale}/academic-content-hub/{id}?year=...&term=...`.

- [ ] **Step 2: Implement create with existing inputs**

Use visible labels and an error summary. Closed-term context may still be displayed, but the create action must be disabled locally and backend errors remain visible if state changes during submission.

- [ ] **Step 3: Write editor-hook tests**

Cover detail loading, 404/403/domain errors, read-only archived state, metadata payload narrowing, aggregate refresh after save, readiness refresh after successful mutations, and stale content-id protection.

- [ ] **Step 4: Implement the editor foundation**

Show `type`, Academic Year, and Term as immutable read-only context after create. `saveMetadata` may send only:

```ts
type UpdateAcademicContentRequest = Pick<
  AcademicContentDetailResponse,
  "title" | "description" | "audience"
>;
```

Use explicit section saves rather than one synthetic mega-payload. Register the existing unsaved-change guard while any section is dirty.

- [ ] **Step 5: Add responsive section navigation**

Desktop: sticky section rail or compact horizontal tabs. Mobile: horizontally scrollable named tabs without forcing the page wider than the viewport. Active section must be conveyed by text/border, not color alone.

- [ ] **Step 6: Run targeted tests, quality gates, and commit**

Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add draft creation and editor shell
```

---

## Task 6: Compose authoritative academic selectors and target replacement

**Files:**
- Create: `src/features/academic-content/services/academicContentSelectors.ts`
- Create: `src/features/academic-content/components/editor/AcademicTargetsSection.tsx`
- Test: `src/features/academic-content/services/__tests__/academicContentSelectors.test.ts`
- Test: `src/features/academic-content/components/editor/__tests__/AcademicTargetsSection.test.tsx`

**Interfaces:**
- Consumes: `fetchStructureTree`, `fetchSubjects`, `fetchSubjectAllocations`, and `resolveTeacherAllocationForTarget` from existing academic features.
- Produces: `loadAcademicTargetOptions({ academicYearId, termId })` and normalized target inputs for `replaceAcademicContentTargets`.

- [ ] **Step 1: Write selector and target-shape tests**

Cover cascading Stage → Grade → Section → Classroom options, SCHOOL scope, a single hierarchy anchor, mandatory subject types, optional-subject types, duplicate target prevention, and allocation IDs selected only from authoritative allocation results.

```ts
expect(toTargetInput({ scopeType: "CLASSROOM", classroomId: "class-1", subjectId: "subject-1" }))
  .toEqual({
    scopeType: "CLASSROOM",
    stageId: null,
    gradeId: null,
    sectionId: null,
    classroomId: "class-1",
    subjectId: "subject-1",
    teacherSubjectAllocationId: null,
  });
```

- [ ] **Step 2: Implement a thin selector composition layer**

Do not create cached copies of academic reference data. Resolve names for existing target IDs for display, but submit IDs only. Expose `teacherSubjectAllocationId` only for CLASSROOM + subject targets because the existing allocation resolver requires section, subject, and optional classroom context.

- [ ] **Step 3: Implement target editing with shared selects and buttons**

Present each target as an editable row/card with scope, one hierarchy selector, optional/required subject, optional authoritative teacher allocation, and remove action. Multiple rows are labeled as alternatives (OR); the hierarchy and subject inside a row are labeled as combined requirements (AND).

- [ ] **Step 4: Save the whole target array**

Validate locally, call the replace endpoint once, replace editor aggregate targets with the server response, clear dirty state, and refresh readiness. Preserve backend errors including non-disclosure/cross-school responses.

- [ ] **Step 5: Run targeted tests, quality gates, and commit**

Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add academic targeting editor
```

---

## Task 7: Add all type-specific detail forms

**Files:**
- Create: `src/features/academic-content/components/editor/details/OrderedTextList.tsx`
- Create: `src/features/academic-content/components/editor/details/TeacherPreparationForm.tsx`
- Create: `src/features/academic-content/components/editor/details/WeeklyPlanForm.tsx`
- Create: `src/features/academic-content/components/editor/details/GuardianWeeklyNoteForm.tsx`
- Create: `src/features/academic-content/components/editor/details/SubjectResourceForm.tsx`
- Create: `src/features/academic-content/components/editor/details/OnlineSessionForm.tsx`
- Create: `src/features/academic-content/components/editor/details/GeneralResourceNotice.tsx`
- Create: `src/features/academic-content/components/editor/details/TypeDetailSection.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/OrderedTextList.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/TeacherPreparationForm.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/WeeklyPlanForm.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/GuardianWeeklyNoteForm.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/SubjectResourceForm.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/OnlineSessionForm.test.tsx`
- Test: `src/features/academic-content/components/editor/details/__tests__/TypeDetailSection.test.tsx`

**Interfaces:**
- Consumes: five detail endpoints; curriculum, lesson-plan, homework, assessment, and timetable existing services; editor save state.
- Produces: exact detail payloads with no unsupported fields.

- [ ] **Step 1: Build and test the reusable ordered-text list**

Support add/remove/reorder, a maximum of 50 non-empty items, and a maximum of 500 normalized characters per item. Use `Button`/`Input` and accessible move/remove names.

- [ ] **Step 2: Implement Teacher Preparation**

Cover `topic` (500), four ordered text lists, three notes (4000 each), and optional curriculum/unit/lesson, lesson-plan/item, and timetable-entry references. Child selectors clear when a parent changes. Empty references serialize as `null`, not invented IDs.

- [ ] **Step 3: Implement Weekly Plan**

Cover date-only start/end constrained to the selected term, two ordered lists, three narrative fields (4000), and up to 100 unique homework/assessment IDs. Use existing list services; selecting references never creates or mutates homework/assessments.

- [ ] **Step 4: Implement Guardian Weekly Note**

Require a nonblank body up to 10000, enum priority, and boolean `requiresAcknowledgement`. Explain that acknowledgement is configuration only; render no acknowledgement action.

- [ ] **Step 5: Implement Subject Resource**

Render the exact nine categories and optional curriculum/unit/lesson references. Keep the category separate from file MIME type.

- [ ] **Step 6: Implement Online Session**

Require HTTPS without credentials, provider name for `OTHER`, `startAt < endAt`, a valid IANA timezone, access code 255, instructions 4000, and optional timetable entry. Never infer or show attendance actions.

- [ ] **Step 7: Implement union routing and General Resource**

```tsx
switch (content.type) {
  case "TEACHER_PREPARATION": return <TeacherPreparationForm />;
  case "WEEKLY_PLAN": return <WeeklyPlanForm />;
  case "GUARDIAN_WEEKLY_NOTE": return <GuardianWeeklyNoteForm />;
  case "SUBJECT_RESOURCE": return <SubjectResourceForm />;
  case "ONLINE_SESSION": return <OnlineSessionForm />;
  case "GENERAL_RESOURCE": return <GeneralResourceNotice />;
}
```

The general-resource notice points users to metadata, targets, files, links, and tags; it must not render or submit an empty detail form.

- [ ] **Step 8: Run targeted form tests, quality gates, and commit**

Apply `test-guard` to all form tests and `clean-code-guard` to all form code, then commit:

```text
feat(academic-content): add type-specific authoring forms
```

---

## Task 8: Add ordered links and tags

**Files:**
- Create: `src/features/academic-content/components/editor/LinksSection.tsx`
- Create: `src/features/academic-content/components/editor/TagsSection.tsx`
- Test: `LinksSection.test.tsx` and `TagsSection.test.tsx`.

**Interfaces:**
- Consumes: replace-links and replace-tags APIs.
- Produces: ordered server-backed lists and readiness refresh notifications.

- [ ] **Step 1: Write failing interaction tests**

Links: maximum 100, label 180, URL 2048, safe HTTP/HTTPS client feedback, reorder preservation, and exact `{ links: [...] }` payload. Tags: maximum 100, value 80, order preservation, and exact `{ tags: [...] }` payload.

- [ ] **Step 2: Implement links using existing inputs/buttons**

Keep the submitted array order as displayed. Use stable local keys separate from backend IDs for unsaved rows.

- [ ] **Step 3: Implement tags without claiming normalization authority**

Allow the backend to normalize/deduplicate. After save, replace local rows with the returned server list rather than treating pre-submit spelling/casing as canonical.

- [ ] **Step 4: Run targeted tests, quality gates, and commit**

Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add ordered links and tags
```

---

## Task 9: Implement file policy and direct resumable uploads

**Files:**
- Create: `src/features/academic-content/services/academicContentUpload.ts`
- Create: `src/features/academic-content/components/editor/FilesSection.tsx`
- Create: `src/features/academic-content/pages/AcademicContentFilePolicyPage.tsx`
- Create: `src/app/[lang]/(dashboard)/academic-content-hub/settings/file-policy/page.tsx`
- Test: `src/features/academic-content/services/__tests__/academicContentUpload.test.ts`
- Test: `src/features/academic-content/components/editor/__tests__/FilesSection.test.tsx`
- Test: `src/features/academic-content/pages/__tests__/AcademicContentFilePolicyPage.test.tsx`

**Interfaces:**
- Consumes: upload intent/complete/cancel/unlink APIs, file-policy APIs, `DragDropUploadArea`, `AttachmentListItem`, and settings permission.
- Produces: `uploadAcademicContentFile({ contentId, file, signal, onProgress })` and policy-aware UI validation.

- [ ] **Step 1: Write upload protocol tests with a fake XMLHttpRequest**

Cover new `crypto.randomUUID()` per logical intent, canonical response `expectedMimeType`, 8 MiB chunks (a multiple of GCS's 256 KiB requirement), `Content-Range`, intermediate `308 Resume Incomplete`, `Range`-based offset advancement, a zero-byte status probe after retryable interruption, final `200/201` followed by complete, abort followed by cancel, and no logging/persistence of `sessionUrl`.

```ts
await uploadAcademicContentFile({ contentId: "content-1", file, onProgress });

expect(createAcademicContentUpload).toHaveBeenCalledWith("content-1", {
  clientRequestId: expect.any(String),
  originalName: "lesson.pdf",
  expectedMimeType: "application/pdf",
  expectedSizeBytes: String(file.size),
});
expect(completeAcademicContentUpload).toHaveBeenCalledWith("content-1", "upload-1");
```

- [ ] **Step 2: Implement a transient direct-upload operation**

Keep the capability in a local variable inside the operation. Send file slices directly to `sessionUrl`; do not normalize the URL, proxy it, store it, or include application auth headers. Use `Content-Range: bytes start-end/total` for data chunks and `Content-Range: bytes */total` for an empty status probe. Advance only from the acknowledged `Range` header after a `308`; complete only after provider `200/201`. On `404/410` or an expired backend capability, return a typed restart state that creates a new logical intent with a new UUID only after explicit user retry.

```ts
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export interface AcademicContentUploadProgress {
  uploadedBytes: string;
  totalBytes: string;
  percent: number;
}

export function uploadAcademicContentFile(input: {
  contentId: string;
  file: File;
  signal?: AbortSignal;
  onProgress?: (progress: AcademicContentUploadProgress) => void;
}): Promise<AcademicContentUploadCompleteResponse>;
```

Use the backend-returned `expectedMimeType` for provider requests. Refuse an empty or mismatched browser MIME/extension pair before creating an intent; do not guess `application/octet-stream` because the backend registry requires exact pairs.

Protocol reference: [Google Cloud Storage — Perform resumable uploads](https://docs.cloud.google.com/storage/docs/performing-resumable-uploads).

- [ ] **Step 3: Write file-policy tests**

Assert decimal-string rendering/editing, hard max `10737418240`, partial PATCH payloads, settings permission, default server values, and all boolean switches.

- [ ] **Step 4: Implement the file-policy page**

The page is viewable with `academics.academic_content.view`; controls/save are enabled only with `academics.academic_content.settings.manage`. Convert display units to/from `bigint` without changing the API string.

- [ ] **Step 5: Implement the files section**

Fetch/use effective policy, validate category and size for feedback, queue selected files, show progress/state text, allow cancel/retry, refresh aggregate after complete, and unlink by `assetId`. Do not assume unlink physically deletes a file. Do not expose bucket/object key/provider URL because they are absent from the contract.

- [ ] **Step 6: Run targeted tests, quality gates, and commit**

Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add resumable assets and file policy
```

---

## Task 10: Add readiness, revisions, archive/restore, and draft delete

**Files:**
- Create: `src/features/academic-content/components/editor/ReadinessPanel.tsx`
- Create: `src/features/academic-content/components/editor/RevisionHistoryPanel.tsx`
- Create: `src/features/academic-content/components/editor/RevisionDetailModal.tsx`
- Create: `src/features/academic-content/components/editor/LifecycleActions.tsx`
- Test: `src/features/academic-content/components/editor/__tests__/ReadinessPanel.test.tsx`
- Test: `src/features/academic-content/components/editor/__tests__/RevisionHistoryPanel.test.tsx`
- Test: `src/features/academic-content/components/editor/__tests__/RevisionDetailModal.test.tsx`
- Test: `src/features/academic-content/components/editor/__tests__/LifecycleActions.test.tsx`

**Interfaces:**
- Consumes: readiness, revision-list/detail, archive, restore, and delete APIs; `ConfirmDialog` and `Modal`.
- Produces: server-authoritative readiness display, immutable revision inspection, and status-appropriate lifecycle controls.

- [ ] **Step 1: Test readiness rendering**

Assert `canAdvance`, arbitrary unknown reason codes/messages, optional reason details, retry, and refresh after editor mutation. Never hardcode a whitelist that drops future reasons.

- [ ] **Step 2: Implement readiness panel**

Render Ready/Incomplete with icon + text and an `aria-live` reason list. This panel is informational in Wave 1+2; it does not add a submit action.

- [ ] **Step 3: Test revision V1/V2 rendering**

Cover pagination, `snapshotContractVersion`, V1 `details: null`, V2 type detail, general-resource null detail, historical assets/links/tags/targets, and confirmation that current aggregate details are never substituted.

- [ ] **Step 4: Implement immutable revision history**

Fetch detail only when a revision is opened. Render the revision response as read-only and never show create/edit/delete revision controls.

- [ ] **Step 5: Test and implement lifecycle actions**

For `DRAFT`: show Edit sections, Archive, and Delete (manage permission required). For `ARCHIVED`: render read-only content and Restore. Use confirmation dialogs; call the backend and display returned restrictions rather than assuming all actions succeed. After delete, return to the library; after archive/restore, replace the aggregate with the server result.

- [ ] **Step 6: Run targeted tests, quality gates, and commit**

Apply `test-guard` and `clean-code-guard`, then commit:

```text
feat(academic-content): add readiness revisions and lifecycle
```

---

## Task 11: Complete localization, responsive behavior, and feature integration

**Files:**
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`
- Modify: editor/library components only where integration exposes gaps.
- Create: `src/features/academic-content/pages/__tests__/AcademicContentWorkflow.test.tsx`

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: one coherent bilingual workflow with no deferred controls.

- [ ] **Step 1: Add complete message namespaces**

Add `academic_content` keys for navigation, enums, filters, sections, field labels/help, errors, upload states, readiness, revisions, lifecycle confirmation, settings, and empty/loading states. Avoid hardcoded Arabic/English strings in feature components.

- [ ] **Step 2: Write a focused integration test**

Cover the happy path: load library → create draft → edit metadata → add target → save matching detail → add link/tag → readiness refresh. Separately assert archived view is read-only and no submit/approve/publish text or action exists.

- [ ] **Step 3: Verify accessibility and responsive states in component tests**

Assert labeled inputs, focusable actions, accessible icon buttons, alert regions, keyboard row navigation, and no hidden action rendered for missing permissions. Manually inspect 375/768/1024/1440 widths during implementation.

- [ ] **Step 4: Run targeted ACC tests only**

Run:

```text
npx vitest run src/features/academic-content src/config/__tests__/navigation.test.ts src/components/layout/__tests__/Sidebar.test.tsx
```

Expected: PASS. This is not the full repository test suite.

- [ ] **Step 5: Run static checks that do not execute the full tests**

Run:

```text
npm run lint
npm run typecheck
npm run build
```

Expected: PASS, with no new task-caused warnings. If build behavior executes tests in a future configuration, stop and ask the owner before continuing.

- [ ] **Step 6: Apply final quality gates and commit**

Run `docs-guard` if user-facing technical docs changed, `test-guard` on the final test delta, and `clean-code-guard` on the full production-code diff. Commit:

```text
feat(academic-content): complete wave one and two workspace
```

---

## Task 12: Owner-approved full verification and Draft PR handoff

**Files:**
- No source files unless verification finds a task-caused defect.

**Interfaces:**
- Consumes: completed feature branch.
- Produces: verified Draft PR and required MOAZEZ handoff report.

- [ ] **Step 1: Ask the owner before the full test suite**

Ask explicitly before running `npm run test:run`. Do not infer approval from approval to implement the feature.

- [ ] **Step 2: Run the full suite only after approval**

Run:

```text
npm run test:run
```

Record the actual result; never report PASS for a command that did not run.

- [ ] **Step 3: Inspect the final diff and worktree**

Confirm only ACC-related source, tests, messages, navigation/permissions, and plan/docs files changed. Check for secrets, capability URLs, debug logging, provider URLs, or production configuration.

- [ ] **Step 4: Push normally and create/update one Draft PR**

Use the task feature branch, base `main`, no force push, and no merge. PR body includes Summary, Scope, Changed Files, Verification, and Notes, including the ACC-6 exclusion.

- [ ] **Step 5: Deliver the required handoff**

Populate every field in `MOAZEZ FRONTEND DEVELOPER HANDOFF` from actual Git/verification state. Use `NOT_RUN` or `NOT_APPLICABLE` rather than claiming PASS for unexecuted checks.

---

## Acceptance Coverage Matrix

| Definition of Done item | Primary task |
|---|---|
| Library/search/filters/pagination | Task 4 |
| Create/common edit | Task 5 |
| Academic targeting | Task 6 |
| Five specialized forms | Task 7 |
| General Resource without fake detail | Task 7 |
| Links/tags | Task 8 |
| Files/resumable upload/file policy | Task 9 |
| Readiness/revisions/archive/restore/delete | Task 10 |
| Permission-aware UI | Tasks 3, 5, 9, 10 |
| Arabic/English, RTL/LTR, accessibility | Task 11 |
| Approval/publish/student-parent surfaces remain absent | Tasks 2, 10, 11 |

## Known Decisions and Risks

- **ACC-6 drift:** Backend main now supports review workflow and preparation templates, but this plan deliberately honors the Wave 1+2 authority SHA. Add those capabilities through a separately approved plan after this foundation lands.
- **Upload protocol testing:** Unit tests can validate request headers, progress, abort, completion, and cancellation. Real GCS resumability/CORS still needs a staging smoke test with an actual capability; never substitute a Next.js proxy.
- **Selector breadth:** Existing services expose the needed domains but not always purpose-built lightweight selectors. The ACC layer may compose and filter them; it must not create new sources of truth or unsupported backend routes.
- **Archived restoration:** UI availability is status/permission based, while actual eligibility remains backend-owned. A visible Restore action can still return a domain restriction that must be shown intact.
- **Readiness text:** Backend messages are authoritative and can be displayed as returned. Localized friendly labels may supplement known codes but must never hide an unknown code/message.
- **Data sensitivity:** Online-session detail, revision detail, and upload capability flows require no-store behavior and must not be cached in durable browser state.

## Self-Review Record

- Spec coverage: all 54 handoff sections map to Tasks 1–12 or Global Constraints.
- Deferred-surface scan: no submit, approval, publish, schedule, notification, acknowledgement action, analytics, copy, or folder-tree task exists.
- Placeholder scan: every implementation step names its files, behavior, test command, and expected result.
- Type consistency: all API tasks consume the Task 1 DTOs; editor mutations refresh the Task 5 aggregate/readiness boundary; uploads use `uploadId`, assets use `assetId`, and byte values remain strings.
- Full-test safety: the only full-suite step explicitly requires owner approval first.
