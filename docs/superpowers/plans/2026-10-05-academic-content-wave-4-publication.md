# Academic Content Wave 4 Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add publication readiness, audience preview, publish-now, scheduling, publication history/detail, unscheduling, cancellation, and asynchronous status handling to the existing Academic Content Center without rebuilding Waves 1–3.

**Architecture:** Extend the existing `academic-content` feature vertically: typed contracts and API functions at the boundary, pure publication policy/request helpers, one feature hook that owns loading/mutations/idempotency/polling, and focused publication components embedded in the current content-detail section navigation. The backend at commit `4691b4ecef4dd8c278850beca430070b4084a717` remains authoritative for readiness, timing, recipient resolution, and lifecycle transitions; the frontend performs only immediate form validation and permission-aware presentation.

**Tech Stack:** Next.js 16.1.6 App Router, React 19.2.3, TypeScript 5, next-intl 4.8.2, Tailwind CSS 4, MUI date-time picker through the shared `DateTimePicker`, Axios-backed `@/lib/api`, Vitest 2.1.8, Testing Library.

**Spec:** `C:/Users/Ahmed Mostafa/Downloads/message (12).txt`, verified against Moazez Backend commit `4691b4ecef4dd8c278850beca430070b4084a717`.

## Global Constraints

- Preserve the current Library, Authoring, Review, Approval, and Preparation Template architecture from Waves 1–3.
- Do not modify the backend repository as part of this frontend plan.
- Use `/academics/academic-content` in the frontend service beneath the existing `NEXT_PUBLIC_API_URL` base; the project test environment configures that base as `http://localhost:3001/api/v1`.
- Read endpoints require `academics.academic_content.view`; publication mutations require exactly `academics.academic_content.publish`.
- External publication is unavailable for `TEACHER_PREPARATION` and for any content whose audience is `INTERNAL_STAFF`.
- Treat publication status and academic-content status as separate enums even where string values overlap.
- Treat the backend readiness response as authoritative. Do not infer readiness from the authoring form or duplicate term/session business rules.
- Do not display final publish success until publication detail returns `PUBLISHED`; the create command may return `SCHEDULED` for publish-now.
- Generate one `clientRequestId` per logical attempt and reuse it when retrying an unchanged request after a transport/server error.
- Omit unset timing properties. In particular, omitting `publishAt` means publish-now, and omitting `visibleUntil` lets an Online Session inherit its session end.
- Zero student or guardian counts are valid successful results.
- Use shared components from `src/components/ui`, specifically `Button`, `DateTimePicker`, `Modal`, `ConfirmDialog`, `EmptyState`, and `PartialLoader` where their behavior fits.
- Do not add Notification Settings, notification analytics, significant-update controls, revise-published-content controls, reminders, feeds, engagement, acknowledgement, or analytics.
- Apply `clean-code-guard` to every production-code change and `test-guard` to every test change before each commit.
- Targeted test files may run during implementation. Ask the owner before running the full `npm run test:run` suite.
- Do not implement on the current checkout until its Git state is resolved: `feat/academic-content-center-wave-1-2` is 25 commits ahead and 40 commits behind `origin/main`, and it contains uncommitted Wave 3/UI work. Preserve those changes and agree on synchronization before execution.

---

## Source Audit

### Backend contract verified at `4691b4ec`

| Capability | Method and path | Permission | Verified behavior |
|---|---|---|---|
| Publication readiness | `GET /api/v1/academics/academic-content/:contentId/publication-readiness` | `academics.academic_content.view` | Returns `{ canPublish, canSchedule, blockingReasons: string[] }` with no-store cache headers. |
| Audience preview | `GET /api/v1/academics/academic-content/:contentId/audience-preview` | `academics.academic_content.view` | Returns current counts plus `asOf`; it is not the historical publication snapshot. |
| Create publication | `POST /api/v1/academics/academic-content/:contentId/publications` | `academics.academic_content.publish` | Returns HTTP 201 and always persists the intent initially as `SCHEDULED`; a worker later moves it to `PUBLISHED`. |
| History | `GET /api/v1/academics/academic-content/:contentId/publications?page=1&limit=20` | `academics.academic_content.view` | Ordered newest first, defaults to 20, maximum 100. |
| Detail | `GET /api/v1/academics/academic-content/:contentId/publications/:publicationId` | `academics.academic_content.view` | Returns the safe publication shape only; there is no recipient-list endpoint. |
| Unschedule | `POST /api/v1/academics/academic-content/:contentId/publications/:publicationId/unschedule` | `academics.academic_content.publish` | Accepts `{}` and returns the publication as `CANCELLED` while restoring content to its recorded source status. |
| Cancel published | `POST /api/v1/academics/academic-content/:contentId/publications/:publicationId/cancel` | `academics.academic_content.publish` | Accepts `{}` and returns `CANCELLED`; revision and audience snapshot remain intact. |

The exact response shape verified in `academic-content-publication.dto.ts` is:

```ts
interface AcademicContentPublication {
  publicationId: string;
  revisionId: string;
  status: "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "CANCELLED";
  sourceContentStatus: AcademicContentStatus;
  publishAt: string;
  visibleFrom: string;
  visibleUntil: string | null;
  publishedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  studentRecipientCount: number;
  guardianRecipientContextCount: number;
  createdByUserId: string;
  createdAt: string;
}
```

The verified readiness reason codes are:

```text
publication.type_or_audience_unavailable
publication.source_status_unavailable
publication.revision_strategy_unavailable
publication.authoring_incomplete
publication.term_invalid
publication.term_ended
publication.targets_missing
publication.type_detail_incomplete
publication.assets_invalid
publication.active_publication_exists
publication.online_session_finished_or_missing
```

Important source-derived edge cases:

- `blockingReasons` can be empty while `canPublish=false` and `canSchedule=true` for a future term.
- At the last schedulable instant, `canPublish=true` and `canSchedule=false` is possible.
- Backend publication sources are only `DRAFT` and `APPROVED`; approved content uses its exact approved revision.
- A repeated `clientRequestId` with an unchanged logical body returns the existing publication. Reusing it with different timing returns `academic_content.publication.idempotency_conflict` (HTTP 409).
- A second active publication returns `academic_content.publication.active_conflict` or readiness reason `publication.active_publication_exists`.
- Invalid readiness returns `academic_content.publication.not_ready` (HTTP 409).
- Invalid unschedule returns `academic_content.publication.cannot_unschedule` (HTTP 409).
- Invalid cancel/lifecycle transition returns `academic_content.publication.lifecycle_conflict` (HTTP 409).
- Online Session publication requires a future session end; omitting `visibleUntil` selects the session end, while explicit `null` is rejected.
- Visibility begins inclusively at `visibleFrom` and ends exclusively at `visibleUntil`.

### Frontend gap audit

- `src/features/academic-content/types/contracts.ts` contains academic-content lifecycle values but no publication enum, readiness, preview, request, history, or detail contracts.
- `src/features/academic-content/services/academicContentApi.ts` has no Wave 4 endpoints.
- `src/features/academic-content/pages/AcademicContentEditorPage.tsx` has no publication surface or `academics.academic_content.publish` gating.
- `src/features/academic-content/components/editor/EditorSectionNav.tsx` has no conditional publication section.
- `src/messages/en.json` and `src/messages/ar.json` have no publication copy or localized readiness reasons.
- Existing `src/components/ui/input/DateTimePicker.tsx`, `src/components/ui/modal/Modal.tsx`, and `src/components/ui/confirm-dialog/ConfirmDialog.tsx` already provide the required shared controls.
- Existing polling code is batch-specific and emits batch-specific errors; it should be used as a behavioral reference, not imported into Academic Content.

## File Structure

### Create

- `src/features/academic-content/model/academicContentPublicationPolicy.ts` — publishability, request serialization, local timing checks, reason-key mapping, and action predicates.
- `src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts` — pure policy/request tests.
- `src/features/academic-content/hooks/useAcademicContentPublication.ts` — load, mutate, retry identity, detail fetch, history pagination, and bounded polling orchestration.
- `src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx` — hook state, retry, and timer behavior.
- `src/features/academic-content/components/publication/PublicationStatusBadge.tsx` — publication-only status rendering.
- `src/features/academic-content/components/publication/PublicationReadinessCard.tsx` — separate publish-now/schedule capability presentation and localized reasons.
- `src/features/academic-content/components/publication/AudiencePreviewCard.tsx` — current audience counts and snapshot disclaimer.
- `src/features/academic-content/components/publication/PublicationDialog.tsx` — publish-now/schedule and optional visibility inputs using shared UI controls.
- `src/features/academic-content/components/publication/PublicationHistoryPanel.tsx` — paginated history and action entry points.
- `src/features/academic-content/components/publication/PublicationDetailModal.tsx` — endpoint-backed safe publication detail.
- `src/features/academic-content/components/publication/AcademicContentPublicationPanel.tsx` — composes the Wave 4 experience.
- Focused tests under `src/features/academic-content/components/publication/__tests__/` for each interactive component.

### Modify

- `src/features/academic-content/types/contracts.ts` — add Wave 4 request/response types.
- `src/features/academic-content/services/academicContentApi.ts` — add seven publication API functions.
- `src/features/academic-content/services/__tests__/academicContentApi.test.ts` — verify exact methods, paths, bodies, and pagination.
- `src/features/academic-content/components/editor/EditorSectionNav.tsx` — support a caller-provided section list and the publication panel id.
- `src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx` — verify conditional section rendering.
- `src/features/academic-content/pages/AcademicContentEditorPage.tsx` — conditionally mount publication and pass view/publish capabilities plus refresh callbacks.
- `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx` — verify publishability and permission behavior.
- `src/messages/en.json` and `src/messages/ar.json` — complete bilingual Wave 4 copy.
- `src/messages/__tests__/academicContentWorkflowTranslations.test.ts` — enforce publication key parity and reason coverage.

---

### Task 1: Add exact publication contracts and API boundary

**Files:**
- Modify: `src/features/academic-content/types/contracts.ts`
- Modify: `src/features/academic-content/services/academicContentApi.ts`
- Test: `src/features/academic-content/services/__tests__/academicContentApi.test.ts`

**Interfaces:**
- Consumes: Existing `contentPath`, `nonEmptyQuery`, `apiGet`, and `apiPost` conventions.
- Produces: All Wave 4 types and service functions used by Tasks 2–7.

- [ ] **Step 1: Extend the endpoint contract test with exact Wave 4 calls**

```ts
it("uses the exact publication management endpoints", async () => {
  const request = {
    clientRequestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    publishAt: "2026-10-06T08:00:00.000Z",
    visibleFrom: "2026-10-06T09:00:00.000Z",
    visibleUntil: "2026-10-07T09:00:00.000Z",
  };

  await academicContentApi.getAcademicContentPublicationReadiness(CONTENT_ID);
  await academicContentApi.getAcademicContentAudiencePreview(CONTENT_ID);
  await academicContentApi.createAcademicContentPublication(CONTENT_ID, request);
  await academicContentApi.listAcademicContentPublications(CONTENT_ID, {
    page: 2,
    limit: 20,
  });
  await academicContentApi.getAcademicContentPublication(
    CONTENT_ID,
    "publication/id",
  );
  await academicContentApi.unscheduleAcademicContentPublication(
    CONTENT_ID,
    "publication/id",
  );
  await academicContentApi.cancelAcademicContentPublication(
    CONTENT_ID,
    "publication/id",
  );

  const base = `/academics/academic-content/${ENCODED_CONTENT_ID}`;
  expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, `${base}/publication-readiness`);
  expect(apiMocks.apiGet).toHaveBeenNthCalledWith(2, `${base}/audience-preview`);
  expect(apiMocks.apiPost).toHaveBeenNthCalledWith(1, `${base}/publications`, request);
  expect(apiMocks.apiGet).toHaveBeenNthCalledWith(3, `${base}/publications`, {
    params: { page: 2, limit: 20 },
  });
  expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
    4,
    `${base}/publications/publication%2Fid`,
  );
  expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
    2,
    `${base}/publications/publication%2Fid/unschedule`,
    {},
  );
  expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
    3,
    `${base}/publications/publication%2Fid/cancel`,
    {},
  );
});
```

- [ ] **Step 2: Run the focused API test and confirm the new functions are absent**

Run: `npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts`

Expected: FAIL because the seven Wave 4 exports do not exist.

- [ ] **Step 3: Add the exact request and response types**

```ts
export const ACADEMIC_CONTENT_PUBLICATION_STATUSES = [
  "SCHEDULED",
  "PUBLISHED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type AcademicContentPublicationStatus =
  (typeof ACADEMIC_CONTENT_PUBLICATION_STATUSES)[number];

export interface AcademicContentPublicationReadinessResponse {
  canPublish: boolean;
  canSchedule: boolean;
  blockingReasons: string[];
}

export interface AcademicContentAudiencePreviewResponse {
  asOf: string;
  students: number;
  guardianContexts: number;
  guardianUsersWithAccounts: number;
  guardianNotificationOptOutContexts: number;
}

export interface CreateAcademicContentPublicationRequest {
  clientRequestId: string;
  publishAt?: string;
  visibleFrom?: string;
  visibleUntil?: string | null;
}

export interface AcademicContentPublication {
  publicationId: string;
  revisionId: string;
  status: AcademicContentPublicationStatus;
  sourceContentStatus: AcademicContentStatus;
  publishAt: string;
  visibleFrom: string;
  visibleUntil: string | null;
  publishedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  studentRecipientCount: number;
  guardianRecipientContextCount: number;
  createdByUserId: string;
  createdAt: string;
}

export interface AcademicContentPublicationHistoryResponse {
  items: AcademicContentPublication[];
  page: number;
  limit: number;
  total: number;
}
```

- [ ] **Step 4: Implement the seven API functions with encoded identifiers**

```ts
function publicationPath(contentId: string, publicationId: string): string {
  return `${contentPath(contentId)}/publications/${encodeURIComponent(publicationId)}`;
}

export function getAcademicContentPublicationReadiness(contentId: string) {
  return apiGet<AcademicContentPublicationReadinessResponse>(
    `${contentPath(contentId)}/publication-readiness`,
  );
}

export function getAcademicContentAudiencePreview(contentId: string) {
  return apiGet<AcademicContentAudiencePreviewResponse>(
    `${contentPath(contentId)}/audience-preview`,
  );
}

export function createAcademicContentPublication(
  contentId: string,
  request: CreateAcademicContentPublicationRequest,
) {
  return apiPost<AcademicContentPublication>(
    `${contentPath(contentId)}/publications`,
    request,
  );
}

export function listAcademicContentPublications(
  contentId: string,
  query: AcademicContentPaginationQuery,
) {
  return apiGet<AcademicContentPublicationHistoryResponse>(
    `${contentPath(contentId)}/publications`,
    { params: nonEmptyQuery(query) },
  );
}

export function getAcademicContentPublication(
  contentId: string,
  publicationId: string,
) {
  return apiGet<AcademicContentPublication>(
    publicationPath(contentId, publicationId),
  );
}

export function unscheduleAcademicContentPublication(
  contentId: string,
  publicationId: string,
) {
  return apiPost<AcademicContentPublication>(
    `${publicationPath(contentId, publicationId)}/unschedule`,
    {},
  );
}

export function cancelAcademicContentPublication(
  contentId: string,
  publicationId: string,
) {
  return apiPost<AcademicContentPublication>(
    `${publicationPath(contentId, publicationId)}/cancel`,
    {},
  );
}
```

- [ ] **Step 5: Run the focused API test**

Run: `npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts`

Expected: PASS.

- [ ] **Step 6: Apply the required code and test guards**

Run `clean-code-guard` on `contracts.ts` and `academicContentApi.ts`, then run `test-guard` on `academicContentApi.test.ts`. Correct every must-fix finding before committing.

- [ ] **Step 7: Commit the boundary change**

```bash
git add src/features/academic-content/types/contracts.ts src/features/academic-content/services/academicContentApi.ts src/features/academic-content/services/__tests__/academicContentApi.test.ts
git commit -m "feat(academic-content): add publication api contracts"
```

---

### Task 2: Add pure publication policy and idempotent request helpers

**Files:**
- Create: `src/features/academic-content/model/academicContentPublicationPolicy.ts`
- Test: `src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts`

**Interfaces:**
- Consumes: `AcademicContentType`, `AcademicContentAudience`, `AcademicContentPublicationStatus`, and `CreateAcademicContentPublicationRequest` from Task 1.
- Produces: `PublicationDraft`, `isPublicationSurfaceAvailable`, `publicationDraftFingerprint`, `publicationRequestFromDraft`, `publicationBlockingReasonKey`, `canUnschedulePublication`, and `canCancelPublication`.

- [ ] **Step 1: Write pure policy tests for publishability, omitted fields, and action status**

```ts
it.each([
  ["WEEKLY_PLAN", "STUDENTS", true],
  ["GUARDIAN_WEEKLY_NOTE", "GUARDIANS", true],
  ["SUBJECT_RESOURCE", "STUDENTS_AND_GUARDIANS", true],
  ["ONLINE_SESSION", "STUDENTS", true],
  ["GENERAL_RESOURCE", "GUARDIANS", true],
  ["TEACHER_PREPARATION", "INTERNAL_STAFF", false],
  ["GENERAL_RESOURCE", "INTERNAL_STAFF", false],
] as const)("classifies %s/%s publication surface", (type, audience, expected) => {
  expect(isPublicationSurfaceAvailable(type, audience)).toBe(expected);
});

it("omits publish-now and unset visibility fields", () => {
  expect(
    publicationRequestFromDraft(
      {
        mode: "now",
        publishAt: null,
        visibleFrom: null,
        visibleUntil: null,
      },
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ),
  ).toEqual({ clientRequestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
});

it("serializes a scheduled publication as ISO instants", () => {
  expect(
    publicationRequestFromDraft(
      {
        mode: "schedule",
        publishAt: new Date("2026-10-06T08:00:00.000Z"),
        visibleFrom: new Date("2026-10-06T09:00:00.000Z"),
        visibleUntil: new Date("2026-10-07T09:00:00.000Z"),
      },
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ),
  ).toMatchObject({
    publishAt: "2026-10-06T08:00:00.000Z",
    visibleFrom: "2026-10-06T09:00:00.000Z",
    visibleUntil: "2026-10-07T09:00:00.000Z",
  });
});

it.each([
  ["SCHEDULED", true, false],
  ["PUBLISHED", false, true],
  ["EXPIRED", false, false],
  ["CANCELLED", false, false],
] as const)("maps %s lifecycle actions", (status, unschedule, cancel) => {
  expect(canUnschedulePublication(status)).toBe(unschedule);
  expect(canCancelPublication(status)).toBe(cancel);
});
```

- [ ] **Step 2: Run the focused policy test and confirm the module is missing**

Run: `npx vitest run src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the pure policy surface**

```ts
const EXTERNAL_TYPES = new Set<AcademicContentType>([
  "WEEKLY_PLAN",
  "GUARDIAN_WEEKLY_NOTE",
  "SUBJECT_RESOURCE",
  "ONLINE_SESSION",
  "GENERAL_RESOURCE",
]);

export interface PublicationDraft {
  mode: "now" | "schedule";
  publishAt: Date | null;
  visibleFrom: Date | null;
  visibleUntil: Date | null;
}

export function isPublicationSurfaceAvailable(
  type: AcademicContentType,
  audience: AcademicContentAudience,
): boolean {
  return EXTERNAL_TYPES.has(type) && audience !== "INTERNAL_STAFF";
}

export function publicationDraftFingerprint(draft: PublicationDraft): string {
  return JSON.stringify({
    mode: draft.mode,
    publishAt: draft.publishAt?.toISOString() ?? null,
    visibleFrom: draft.visibleFrom?.toISOString() ?? null,
    visibleUntil: draft.visibleUntil?.toISOString() ?? null,
  });
}

export function publicationRequestFromDraft(
  draft: PublicationDraft,
  clientRequestId: string,
): CreateAcademicContentPublicationRequest {
  return {
    clientRequestId,
    ...(draft.mode === "schedule" && draft.publishAt
      ? { publishAt: draft.publishAt.toISOString() }
      : {}),
    ...(draft.visibleFrom
      ? { visibleFrom: draft.visibleFrom.toISOString() }
      : {}),
    ...(draft.visibleUntil
      ? { visibleUntil: draft.visibleUntil.toISOString() }
      : {}),
  };
}

export const PUBLICATION_BLOCKING_REASON_KEYS = {
  "publication.type_or_audience_unavailable": "type_or_audience_unavailable",
  "publication.source_status_unavailable": "source_status_unavailable",
  "publication.revision_strategy_unavailable": "revision_strategy_unavailable",
  "publication.authoring_incomplete": "authoring_incomplete",
  "publication.term_invalid": "term_invalid",
  "publication.term_ended": "term_ended",
  "publication.targets_missing": "targets_missing",
  "publication.type_detail_incomplete": "type_detail_incomplete",
  "publication.assets_invalid": "assets_invalid",
  "publication.active_publication_exists": "active_publication_exists",
  "publication.online_session_finished_or_missing":
    "online_session_finished_or_missing",
} as const;

export function publicationBlockingReasonKey(reason: string): string {
  return PUBLICATION_BLOCKING_REASON_KEYS[
    reason as keyof typeof PUBLICATION_BLOCKING_REASON_KEYS
  ] ?? "unknown";
}

export function canUnschedulePublication(
  status: AcademicContentPublicationStatus,
): boolean {
  return status === "SCHEDULED";
}

export function canCancelPublication(
  status: AcademicContentPublicationStatus,
): boolean {
  return status === "PUBLISHED";
}
```

- [ ] **Step 4: Add minimal local validation without copying backend business rules**

```ts
export type PublicationDraftError =
  | "publish_at_required"
  | "publish_at_not_future"
  | "visible_from_before_publish"
  | "visible_until_before_visible_from";

export function validatePublicationDraft(
  draft: PublicationDraft,
  now: Date,
): PublicationDraftError[] {
  const errors: PublicationDraftError[] = [];
  const effectivePublishAt =
    draft.mode === "schedule" ? draft.publishAt : now;

  if (draft.mode === "schedule" && !draft.publishAt) {
    errors.push("publish_at_required");
  } else if (
    draft.mode === "schedule" &&
    draft.publishAt &&
    draft.publishAt <= now
  ) {
    errors.push("publish_at_not_future");
  }
  if (
    effectivePublishAt &&
    draft.visibleFrom &&
    draft.visibleFrom < effectivePublishAt
  ) {
    errors.push("visible_from_before_publish");
  }
  const visibilityStart = draft.visibleFrom ?? effectivePublishAt;
  if (
    visibilityStart &&
    draft.visibleUntil &&
    draft.visibleUntil <= visibilityStart
  ) {
    errors.push("visible_until_before_visible_from");
  }
  return errors;
}
```

- [ ] **Step 5: Run the focused policy test**

Run: `npx vitest run src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts`

Expected: PASS, including explicit tests for all eleven readiness reasons and invalid date ordering.

- [ ] **Step 6: Apply the required code and test guards**

Run `clean-code-guard` on the policy module and `test-guard` on its test. Correct every must-fix finding.

- [ ] **Step 7: Commit the policy layer**

```bash
git add src/features/academic-content/model/academicContentPublicationPolicy.ts src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts
git commit -m "feat(academic-content): add publication policy helpers"
```

---

### Task 3: Add complete Arabic and English publication copy

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

**Interfaces:**
- Consumes: The eleven reason keys and four publication statuses from Tasks 1–2.
- Produces: `academic_content.publication.*` messages used by all publication components.

- [ ] **Step 1: Extend the translation parity test**

```ts
const sections = [
  "library",
  "editor",
  "workflow_policy",
  "workflow",
  "review",
  "templates",
  "readiness",
  "revisions",
  "publication",
] as const;

const publicationReasonKeys = [
  "type_or_audience_unavailable",
  "source_status_unavailable",
  "revision_strategy_unavailable",
  "authoring_incomplete",
  "term_invalid",
  "term_ended",
  "targets_missing",
  "type_detail_incomplete",
  "assets_invalid",
  "active_publication_exists",
  "online_session_finished_or_missing",
  "unknown",
] as const;

it.each(publicationReasonKeys)("localizes publication reason %s", (reason) => {
  expect(valueAt(enMessages.academic_content, `publication.reasons.${reason}`)).toEqual(
    expect.any(String),
  );
  expect(valueAt(arMessages.academic_content, `publication.reasons.${reason}`)).toEqual(
    expect.any(String),
  );
});
```

- [ ] **Step 2: Run the translation test and confirm the publication section is missing**

Run: `npx vitest run src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

Expected: FAIL on the missing `publication` tree.

- [ ] **Step 3: Add matching `publication` trees to both locales**

Define non-empty localized strings for:

```text
title, description, readiness, audience_preview, current_preview_disclaimer,
publish_now, schedule, publish_at, visible_from, visible_until,
online_session_end_hint, no_visibility_end, submit, processing,
poll_timeout, refresh, history, history_empty, view_detail, detail,
unschedule, unschedule_title, unschedule_description,
cancel_publication, cancel_title, cancel_description,
students, guardian_contexts, guardian_accounts, guardian_opt_out_contexts,
as_of, source_status, publication_status, revision, created_at,
published_at, expired_at, cancelled_at, recipient_counts,
publish_permission_missing, zero_audience_valid,
statuses.SCHEDULED, statuses.PUBLISHED, statuses.EXPIRED, statuses.CANCELLED,
validation.publish_at_required, validation.publish_at_not_future,
validation.visible_from_before_publish,
validation.visible_until_before_visible_from,
reasons.<all twelve tested keys>
```

Arabic readiness copy must describe the remedy in user language and must never expose the backend code or a UUID.

- [ ] **Step 4: Run the translation parity test**

Run: `npx vitest run src/messages/__tests__/academicContentWorkflowTranslations.test.ts`

Expected: PASS.

- [ ] **Step 5: Apply the required test guard and documentation guard**

Run `test-guard` on the translation test and verify the message keys against Tasks 1–2. Correct every must-fix finding.

- [ ] **Step 6: Commit localization**

```bash
git add src/messages/en.json src/messages/ar.json src/messages/__tests__/academicContentWorkflowTranslations.test.ts
git commit -m "feat(academic-content): localize publication workflow"
```

---

### Task 4: Implement publication state, mutations, retry identity, and bounded polling

**Files:**
- Create: `src/features/academic-content/hooks/useAcademicContentPublication.ts`
- Test: `src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx`

**Interfaces:**
- Consumes: Task 1 service functions and Task 2 request helpers.
- Produces: A single `useAcademicContentPublication(contentId, onContentChanged)` hook for Tasks 5–7.

- [ ] **Step 1: Write hook tests for initial loading and independent read failure**

Mock readiness, preview, and history separately. Assert the hook keeps successful cards visible when one read fails and exposes a retry action rather than replacing the entire publication panel.

```ts
expect(api.getAcademicContentPublicationReadiness).toHaveBeenCalledWith("content-1");
expect(api.getAcademicContentAudiencePreview).toHaveBeenCalledWith("content-1");
expect(api.listAcademicContentPublications).toHaveBeenCalledWith("content-1", {
  page: 1,
  limit: 20,
});
```

- [ ] **Step 2: Write retry-identity tests**

```ts
vi.spyOn(crypto, "randomUUID")
  .mockReturnValueOnce("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
  .mockReturnValueOnce("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

api.createAcademicContentPublication.mockRejectedValueOnce(new Error("offline"));
await act(() => result.current.create(draft));
await act(() => result.current.create(draft));

expect(api.createAcademicContentPublication.mock.calls[0][1].clientRequestId).toBe(
  api.createAcademicContentPublication.mock.calls[1][1].clientRequestId,
);

await act(() => result.current.create({ ...draft, visibleUntil: later }));
expect(api.createAcademicContentPublication.mock.calls[2][1].clientRequestId).not.toBe(
  api.createAcademicContentPublication.mock.calls[1][1].clientRequestId,
);
```

- [ ] **Step 3: Write fake-timer tests for asynchronous publication**

Cover these exact cases:

1. A publish-now create response of `SCHEDULED` sets a processing state and does not report published success.
2. Detail polling runs sequentially every 2 seconds and stops when detail returns `PUBLISHED`.
3. A future scheduled item performs no detail request before `publishAt`, then begins polling at the due time.
4. Polling stops after 15 reads and sets `pollTimedOut=true`.
5. Unmount and `contentId` change clear timers and ignore stale responses.
6. A terminal response refreshes readiness, preview, history, and invokes `onContentChanged` once.

- [ ] **Step 4: Run the focused hook test and confirm the hook is absent**

Run: `npx vitest run src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 5: Implement independent loading and mutation state**

Use this public return shape:

```ts
export interface AcademicContentPublicationState {
  readiness: AcademicContentPublicationReadinessResponse | null;
  audiencePreview: AcademicContentAudiencePreviewResponse | null;
  history: AcademicContentPublicationHistoryResponse | null;
  trackedPublication: AcademicContentPublication | null;
  detail: AcademicContentPublication | null;
  errors: {
    readiness: AcademicContentUiError | null;
    audiencePreview: AcademicContentUiError | null;
    history: AcademicContentUiError | null;
    mutation: AcademicContentUiError | null;
    detail: AcademicContentUiError | null;
  };
  isLoading: boolean;
  isMutating: boolean;
  isDetailLoading: boolean;
  pollTimedOut: boolean;
  historyPage: number;
  reload: () => Promise<void>;
  setHistoryPage: (page: number) => void;
  create: (draft: PublicationDraft) => Promise<AcademicContentPublication | null>;
  loadDetail: (publicationId: string) => Promise<void>;
  clearDetail: () => void;
  unschedule: (publicationId: string) => Promise<boolean>;
  cancel: (publicationId: string) => Promise<boolean>;
}
```

- [ ] **Step 6: Implement logical attempt identity**

Keep `{ fingerprint, clientRequestId }` in a ref. Reuse it only while `publicationDraftFingerprint(draft)` is unchanged and the prior call has not succeeded. Clear it after a successful create response; a later user action is a new logical attempt.

```ts
const attemptRef = useRef<{
  fingerprint: string;
  clientRequestId: string;
} | null>(null);

const requestFor = (draft: PublicationDraft) => {
  const fingerprint = publicationDraftFingerprint(draft);
  if (attemptRef.current?.fingerprint !== fingerprint) {
    attemptRef.current = { fingerprint, clientRequestId: crypto.randomUUID() };
  }
  return publicationRequestFromDraft(
    draft,
    attemptRef.current.clientRequestId,
  );
};
```

- [ ] **Step 7: Implement due-time waiting and bounded polling**

```ts
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_READS = 15;
const DUE_TIMER_SLICE_MS = 60_000;
```

Use `window.setTimeout`, never `setInterval`; schedule the next read only after the current request settles. If `publishAt` is in the future, use non-network timer slices up to 60 seconds until it is due. Stop on `PUBLISHED`, `EXPIRED`, or `CANCELLED`, after 15 detail reads, on unmount, or when `contentId` changes.

- [ ] **Step 8: Run the focused hook test**

Run: `npx vitest run src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx`

Expected: PASS with no pending fake timers.

- [ ] **Step 9: Apply the required code and test guards**

Run `clean-code-guard` on the hook and `test-guard` on its tests. Pay special attention to stale closures, duplicate requests, timer cleanup, and tests that merely mirror implementation details.

- [ ] **Step 10: Commit the orchestration layer**

```bash
git add src/features/academic-content/hooks/useAcademicContentPublication.ts src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx
git commit -m "feat(academic-content): orchestrate publication lifecycle"
```

---

### Task 5: Build readiness, audience preview, and publication composer UI

**Files:**
- Create: `src/features/academic-content/components/publication/PublicationStatusBadge.tsx`
- Create: `src/features/academic-content/components/publication/PublicationReadinessCard.tsx`
- Create: `src/features/academic-content/components/publication/AudiencePreviewCard.tsx`
- Create: `src/features/academic-content/components/publication/PublicationDialog.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/PublicationReadinessCard.test.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/AudiencePreviewCard.test.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/PublicationDialog.test.tsx`

**Interfaces:**
- Consumes: Task 1 response types, Task 2 validation/policy helpers, Task 3 messages, and shared UI components.
- Produces: Focused cards/dialog used by the composite panel in Task 7.

- [ ] **Step 1: Write readiness-card tests for independent actions**

Assert all four combinations explicitly:

```ts
it.each([
  [true, true, false, false],
  [true, false, false, true],
  [false, true, true, false],
  [false, false, true, true],
] as const)(
  "maps canPublish=%s and canSchedule=%s independently",
  (canPublish, canSchedule, publishDisabled, scheduleDisabled) => {
    renderReadiness({ canPublish, canSchedule, blockingReasons: [] });
    expect(screen.getByRole("button", { name: "Publish now" })).toHaveProperty(
      "disabled",
      publishDisabled,
    );
    expect(screen.getByRole("button", { name: "Schedule" })).toHaveProperty(
      "disabled",
      scheduleDisabled,
    );
  },
);
```

Also assert every backend reason renders localized text and the raw `publication.*` code is absent.

- [ ] **Step 2: Write audience preview tests including valid zero counts**

Render all four counts as `0`, retain the `asOf` timestamp, and display the current-preview disclaimer without an error treatment.

- [ ] **Step 3: Write dialog tests for publish-now and schedule bodies**

Verify:

- publish-now submits with `publishAt: null` in the UI draft, allowing Task 2 to omit it from the request;
- schedule requires `publishAt` and uses the shared `DateTimePicker`;
- optional visibility dates remain null when empty;
- Online Session displays the session-end default hint;
- invalid date ordering blocks submission with localized inline errors;
- the dialog disables close/submit while a mutation is in flight.

- [ ] **Step 4: Run the focused component tests and confirm the components are absent**

Run:

```bash
npx vitest run src/features/academic-content/components/publication/__tests__/PublicationReadinessCard.test.tsx src/features/academic-content/components/publication/__tests__/AudiencePreviewCard.test.tsx src/features/academic-content/components/publication/__tests__/PublicationDialog.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 5: Implement a publication-only status badge**

Use `AcademicContentPublicationStatus` and `publication.statuses.*`. Do not import or reuse `AcademicContentStatusBadge`, because the two enums are separate contracts.

- [ ] **Step 6: Implement the readiness and audience cards**

`PublicationReadinessCard` receives separate callbacks and capability booleans:

```ts
interface PublicationReadinessCardProps {
  readiness: AcademicContentPublicationReadinessResponse | null;
  error: AcademicContentUiError | null;
  canMutate: boolean;
  isMutating: boolean;
  onPublishNow: () => void;
  onSchedule: () => void;
  onRetry: () => void;
}
```

`AudiencePreviewCard` receives the preview/error/retry state and uses semantic `<dl>` markup for all four counts. Show `0` exactly; do not replace it with an empty state.

- [ ] **Step 7: Implement the publication dialog with shared UI controls**

Use:

```tsx
<Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
  {mode === "schedule" ? (
    <DateTimePicker
      label={t("publish_at")}
      value={draft.publishAt}
      minDateTime={new Date()}
      required
      onChange={(publishAt) => update({ publishAt })}
    />
  ) : null}
  <DateTimePicker
    label={t("visible_from")}
    value={draft.visibleFrom}
    onChange={(visibleFrom) => update({ visibleFrom })}
  />
  <DateTimePicker
    label={t("visible_until")}
    value={draft.visibleUntil}
    onChange={(visibleUntil) => update({ visibleUntil })}
  />
</Modal>
```

Use shared `Button` instances in the modal footer. The submit callback receives the validated `PublicationDraft`; it does not generate request IDs or call the API directly.

- [ ] **Step 8: Run the focused component tests**

Run the same three-file Vitest command from Step 4.

Expected: PASS.

- [ ] **Step 9: Apply the required code and test guards**

Run `clean-code-guard` on all four components and `test-guard` on the three tests. Correct accessibility, enum-mixing, and duplicated business-rule findings.

- [ ] **Step 10: Commit the publication controls**

```bash
git add src/features/academic-content/components/publication
git commit -m "feat(academic-content): add publication readiness controls"
```

---

### Task 6: Build publication history, detail, unschedule, and cancel UX

**Files:**
- Create: `src/features/academic-content/components/publication/PublicationHistoryPanel.tsx`
- Create: `src/features/academic-content/components/publication/PublicationDetailModal.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx`

**Interfaces:**
- Consumes: Task 1 publication/history contracts, Task 2 action predicates, Task 3 messages, Task 4 detail/mutation callbacks, Task 5 status badge.
- Produces: Complete read history and lifecycle action UI for Task 7.

- [ ] **Step 1: Write history tests**

Cover:

- newest-first rows with status, publish/visibility dates, and recipient counts;
- empty history;
- pagination at `limit=20` with previous/next buttons;
- a detail click calling `onViewDetail(publicationId)`;
- unschedule visible only for `SCHEDULED` plus publish permission;
- cancel visible only for `PUBLISHED` plus publish permission;
- neither action for `EXPIRED` or `CANCELLED`;
- zero counts rendered as valid values.

- [ ] **Step 2: Write detail modal tests**

Assert the modal loads through the detail callback, displays every safe response field, never claims to show recipient identities, and distinguishes `sourceContentStatus` from publication `status`.

- [ ] **Step 3: Run the two focused tests and confirm the components are absent**

Run:

```bash
npx vitest run src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement paginated history with shared buttons**

Use `Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })` for instants. Receive pagination and action callbacks instead of owning API calls:

```ts
interface PublicationHistoryPanelProps {
  history: AcademicContentPublicationHistoryResponse | null;
  error: AcademicContentUiError | null;
  canMutate: boolean;
  isMutating: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onViewDetail: (publicationId: string) => void;
  onUnschedule: (publicationId: string) => void;
  onCancel: (publicationId: string) => void;
}
```

- [ ] **Step 5: Implement endpoint-backed detail modal**

Use the shared `Modal` and `PartialLoader`. Render `publicationId` and `revisionId` only inside the technical detail view, not as primary page labels. Show the two historical recipient counts with the snapshot explanation.

- [ ] **Step 6: Add confirmation dialogs for lifecycle mutations**

Use shared `ConfirmDialog` with warning severity for unschedule and danger severity for cancel. Confirm callbacks call the Task 4 hook; closing is disabled while mutation state is active.

- [ ] **Step 7: Run the two focused component tests**

Run the same two-file Vitest command from Step 3.

Expected: PASS.

- [ ] **Step 8: Apply the required code and test guards**

Run `clean-code-guard` on both components and `test-guard` on both tests. Correct every must-fix finding.

- [ ] **Step 9: Commit history and lifecycle actions**

```bash
git add src/features/academic-content/components/publication/PublicationHistoryPanel.tsx src/features/academic-content/components/publication/PublicationDetailModal.tsx src/features/academic-content/components/publication/__tests__/PublicationHistoryPanel.test.tsx src/features/academic-content/components/publication/__tests__/PublicationDetailModal.test.tsx
git commit -m "feat(academic-content): add publication history actions"
```

---

### Task 7: Compose and integrate the publication section into content detail

**Files:**
- Create: `src/features/academic-content/components/publication/AcademicContentPublicationPanel.tsx`
- Test: `src/features/academic-content/components/publication/__tests__/AcademicContentPublicationPanel.test.tsx`
- Modify: `src/features/academic-content/components/editor/EditorSectionNav.tsx`
- Modify: `src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx`
- Modify: `src/features/academic-content/pages/AcademicContentEditorPage.tsx`
- Modify: `src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–6 and existing editor refresh callbacks.
- Produces: A conditional `publication` editor section for external publishable content.

- [ ] **Step 1: Write navigation tests for a caller-provided section set**

```tsx
render(
  <EditorSectionNav
    variant="desktop"
    activeSection="publication"
    sections={EDITOR_SECTIONS.filter((section) => section.id !== "revisions").concat({
      id: "publication",
      labelKey: "publication",
    })}
    onChange={onChange}
  />,
);
expect(screen.getByRole("button", { name: "Publication" })).toHaveAttribute(
  "aria-current",
  "true",
);
```

- [ ] **Step 2: Write editor integration tests**

Cover:

- external `GENERAL_RESOURCE` shows the Publication section;
- `TEACHER_PREPARATION` does not show it;
- `GENERAL_RESOURCE` with `INTERNAL_STAFF` does not show it;
- view-only users can inspect readiness, preview, history, and detail but see no mutation buttons;
- `academics.academic_content.publish` enables mutation controls independently of `manage`;
- reaching `SCHEDULED/PUBLISHED/EXPIRED/CANCELLED` keeps authoring read-only;
- terminal publication refresh updates the content header status.

- [ ] **Step 3: Write composite-panel tests**

Mock `useAcademicContentPublication` and verify dialog mode, detail modal, confirmations, retry routing, processing state, poll timeout state, and successful refresh behavior without retesting each child component's rendering internals.

- [ ] **Step 4: Run the focused integration tests and confirm failure**

Run:

```bash
npx vitest run src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx src/features/academic-content/components/publication/__tests__/AcademicContentPublicationPanel.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
```

Expected: FAIL because the publication section and composite panel are absent.

- [ ] **Step 5: Make editor sections configurable**

Extend the panel union and section definition:

```ts
export type AcademicContentEditorPanel =
  | "metadata"
  | "targets"
  | "details"
  | "links"
  | "tags"
  | "files"
  | "readiness"
  | "publication"
  | "revisions";

interface EditorSectionNavProps {
  activeSection: AcademicContentEditorPanel;
  onChange: (section: AcademicContentEditorPanel) => void;
  variant: "desktop" | "mobile";
  sections?: readonly EditorSectionDefinition[];
  indicators?: Partial<Record<AcademicContentEditorPanel, EditorSectionIndicator>>;
}
```

Default `sections` to `EDITOR_SECTIONS` to preserve existing callers.

- [ ] **Step 6: Implement the composite publication panel**

The panel owns only presentation state such as which dialog is open and which lifecycle confirmation is pending. It delegates all server state to `useAcademicContentPublication` and receives:

```ts
interface AcademicContentPublicationPanelProps {
  content: AcademicContentDetail;
  canMutate: boolean;
  onContentChanged: () => Promise<unknown>;
}
```

When create returns `SCHEDULED`, show localized processing/scheduled state. Do not emit a published-success message until the tracked detail is `PUBLISHED`.

- [ ] **Step 7: Integrate the conditional editor section**

In `AcademicContentEditorPage`, derive:

```ts
const publicationAvailable = isPublicationSurfaceAvailable(
  content.type,
  content.audience,
);
const editorSections = publicationAvailable
  ? [
      ...EDITOR_SECTIONS.slice(0, -1),
      { id: "publication", labelKey: "publication" } as const,
      EDITOR_SECTIONS.at(-1)!,
    ]
  : EDITOR_SECTIONS;
```

Pass `sections={editorSections}` to both responsive navigations. Render `AcademicContentPublicationPanel` only when the publication section is available and active. Gate mutations with:

```ts
hasPermission("academics.academic_content.publish")
```

On terminal/mutation changes call both `editor.refreshAggregate()` and `editor.refreshReadiness()` so the content header and authoring lock follow backend state.

- [ ] **Step 8: Run the focused integration tests**

Run the same three-file Vitest command from Step 4.

Expected: PASS.

- [ ] **Step 9: Apply the required code and test guards**

Run `clean-code-guard` on the composite panel, navigation, and editor page. Run `test-guard` on all three changed test files. Correct every must-fix finding.

- [ ] **Step 10: Commit the editor integration**

```bash
git add src/features/academic-content/components/publication/AcademicContentPublicationPanel.tsx src/features/academic-content/components/publication/__tests__/AcademicContentPublicationPanel.test.tsx src/features/academic-content/components/editor/EditorSectionNav.tsx src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx src/features/academic-content/pages/AcademicContentEditorPage.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx
git commit -m "feat(academic-content): integrate publication workspace"
```

---

### Task 8: Verify Wave 4 without expanding scope

**Files:**
- Review only: all Wave 4 files from Tasks 1–7

**Interfaces:**
- Consumes: The completed Wave 4 implementation.
- Produces: Evidence for owner review; no backend, deployment, or notification changes.

- [ ] **Step 1: Run all Academic Content Wave 4 targeted tests**

```bash
npx vitest run src/features/academic-content/services/__tests__/academicContentApi.test.ts src/features/academic-content/model/__tests__/academicContentPublicationPolicy.test.ts src/features/academic-content/hooks/__tests__/useAcademicContentPublication.test.tsx src/features/academic-content/components/publication/__tests__ src/features/academic-content/components/editor/__tests__/EditorSectionNav.test.tsx src/features/academic-content/pages/__tests__/AcademicContentEditorPage.test.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint over the touched implementation and test paths**

```bash
npx eslint src/features/academic-content/types/contracts.ts src/features/academic-content/services/academicContentApi.ts src/features/academic-content/model/academicContentPublicationPolicy.ts src/features/academic-content/hooks/useAcademicContentPublication.ts src/features/academic-content/components/publication src/features/academic-content/components/editor/EditorSectionNav.tsx src/features/academic-content/pages/AcademicContentEditorPage.tsx src/messages/__tests__/academicContentWorkflowTranslations.test.ts
```

Expected: PASS with no new warnings caused by Wave 4.

- [ ] **Step 3: Run TypeScript validation**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Ask the owner before the full test suite**

Ask explicitly whether to run `npm run test:run`. If approved, run it and record the real result. If not approved, report `TESTS=TARGETED_PASS/FULL_NOT_RUN_BY_OWNER_INSTRUCTION`; never report the full suite as passing.

- [ ] **Step 6: Perform the final clean-code and test guards**

Run `clean-code-guard` across the complete production diff and `test-guard` across the complete test diff. Resolve every must-fix finding and rerun only the affected focused checks.

- [ ] **Step 7: Manually verify the Wave 4 matrix against the running backend**

Verify with accounts that separate `view`, `manage`, and `publish` permissions:

```text
1. Future term: publish-now disabled, schedule enabled.
2. Current valid content: publish-now and schedule follow backend booleans.
3. Publish now: UI shows processing while SCHEDULED, then PUBLISHED after polling.
4. Future schedule: no premature network polling; publishing begins at publishAt.
5. Online Session: omitted visibleUntil resolves to session end in returned detail.
6. Zero audience: publication succeeds and displays zero counts without an error.
7. Scheduled publication: unschedule restores source content status.
8. Published publication: cancel moves publication/content to CANCELLED.
9. View-only user: reads are available; mutation controls are absent.
10. Teacher Preparation and INTERNAL_STAFF General Resource: no external publication section.
11. Arabic locale: all readiness reasons and lifecycle labels are localized.
12. History detail: counts are historical and no recipient list is implied.
```

- [ ] **Step 8: Inspect Git scope before handoff**

Run: `git status --short`

Expected: only Wave 4 files and any explicitly preserved pre-existing changes are present. Do not include unrelated files, environment files, build output, or `node_modules` links in a commit.

- [ ] **Step 9: Commit any verification-only corrections**

```bash
git add --patch
git diff --cached --check
git commit -m "fix(academic-content): harden publication workflow"
```

Use this commit only when verification required a real source correction; otherwise leave the implementation commits unchanged.

---

## Definition of Done Traceability

| Wave 4 requirement | Plan coverage |
|---|---|
| `PUBLICATION_READINESS_UI` | Tasks 1, 2, 3, 5, 7 |
| `AUDIENCE_PREVIEW` | Tasks 1, 4, 5, 7 |
| `PUBLISH_NOW` | Tasks 1, 2, 4, 5, 7 |
| `SCHEDULE` | Tasks 1, 2, 4, 5, 7 |
| `VISIBILITY` | Tasks 1, 2, 5 |
| `PUBLICATION_HISTORY` | Tasks 1, 4, 6 |
| `PUBLICATION_DETAIL` | Tasks 1, 4, 6 |
| `UNSCHEDULE` | Tasks 1, 2, 4, 6 |
| `CANCEL_PUBLISHED` | Tasks 1, 2, 4, 6 |
| `PUBLISH_PERMISSION_UI` | Tasks 5, 6, 7 |
| `ASYNC_STATUS_HANDLING` | Tasks 4, 7, 8 |
| `NOTIFICATION_UI=NOT_STARTED` | Global constraints and Task 8 scope check |

## Self-Review Results

- Spec coverage: all Wave 4 Definition of Done items map to at least one task.
- Contract consistency: endpoint paths, request fields, response fields, defaults, permissions, statuses, and readiness codes match Backend commit `4691b4ec`.
- Architecture consistency: no new App Router route is required; the feature remains inside the existing content-detail workspace.
- Scope consistency: no backend, deployment, notification, feed, analytics, or recipient-list work is included.
- Test discipline: every production task has focused failing/passing tests, `clean-code-guard`, and `test-guard`; the full suite remains owner-gated.
