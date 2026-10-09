# General Resource Detail Workspace Design

Date: 2026-10-06
Status: Approved

## Objective

Create a dedicated General Resource detail workspace that follows the successful Weekly Plan detail hierarchy while expressing the simpler, school-wide nature of a General Resource. The workspace must use the current backend contract without adding fields, endpoints, or behaviors that the backend does not support.

The redesign applies only to `GENERAL_RESOURCE`. Existing specialized views for other academic-content types remain unchanged.

## Scope

### Included

- A General Resource-specific presentation on the existing academic-content detail route.
- A resource header, compact summary strip, section navigation, focused content panels, and contextual right rail.
- Existing metadata, audience, tags, academic targets, files, links, readiness, publication, revisions, and lifecycle behavior.
- Permission-aware editing and publication controls.
- Responsive desktop, tablet, mobile, English, Arabic, RTL, loading, empty, error, partial-failure, and read-only states.

### Excluded

- Backend changes, new endpoints, or changes to persisted payloads.
- A General Resource `details` payload; the current contract defines `details` as `null` for this content type.
- Invented fields such as category, curriculum references, author identity, download count, or resource-specific notes.
- Asset reordering, because the current file manager does not expose an asset-order mutation.
- A new asset download action unless implementation discovers and reuses an already verified authenticated download service and permission path.
- Changes to the General Resources list screen or unrelated academic-content editors.

## Backend Contract Constraints

This design was audited against backend `origin/main` at
`d84945e09c90de8723f4859b7eb69285ffd0468d`. The local backend checkout was
behind that revision, so the remote default branch is the contract authority
for this audit.

The General Resource aggregate provides the shared academic-content fields:

- identifier, academic year identifier, term identifier, type, audience, title, rich-text description, and content status;
- archive, created, and updated timestamps;
- latest publication identifier, publication status, publish time, visibility start, and visibility end;
- academic targets;
- assets;
- links;
- tags;
- `details: null`.

Existing focused endpoints and services provide metadata updates, target replacement, tag replacement, link replacement, file upload and unlink operations, readiness, publication workflows, revision history, and lifecycle actions.

The design must not derive unsupported resource-specific fields from `details`, because no such payload exists. Raw backend identifiers remain internal unless an existing resolver can provide a user-facing label or a detailed audit view explicitly identifies the value as an unresolved backend identifier.

### Complete contract coverage

“Complete contract coverage” means that every General Resource field and every
backend operation applicable to a General Resource is deliberately mapped to a
display, editor, action, ordering rule, policy rule, or internal correlation
use. It does not mean exposing internal UUIDs as ordinary user-facing content.

| Backend surface | Contract consumed by this workspace |
| --- | --- |
| Management detail | `id` drives mutations; `academicYearId` and `termId` resolve read-only context; `type` selects this workspace; `audience`, `title`, and `description` are displayed and edited; `status` and `archivedAt` drive lifecycle/read-only UI; `createdAt` and `updatedAt` appear in audit context. |
| Publication summary on aggregate | `latestPublicationId` correlates the active publication; `publicationStatus`, `publishAt`, `visibleFrom`, and `visibleUntil` drive badges and visibility context. |
| Targets | `scopeType` and stage, grade, section, classroom, subject, and teacher-allocation references drive the existing target editor and resolved summaries; target IDs remain internal. |
| Assets | `sortOrder` determines stable display order; `originalName`, `mimeType`, `sizeBytes`, and `createdAt` are displayed; `assetId` and `fileId` remain internal operation/correlation keys. |
| Links | `sortOrder` determines display and replacement order; `label` and `url` are editable; link IDs remain internal. |
| Tags | `sortOrder` determines display and replacement order; `value` is editable; tag IDs remain internal. |
| General Resource details | `details` is always `null`; no type-detail form or request is created. |
| Authoring readiness | `canAdvance` controls ready/blocked state; every blocking reason’s `code`, localized `message`, and optional safe `details` are preserved for presentation or diagnostics. |
| Metadata mutation | `title`, nullable `description`, and `audience` are sent only through the existing metadata update request. |
| Target, link, and tag replacement | The complete ordered arrays are submitted through their existing replacement endpoints, respecting backend limits and normalization. |
| File policy | `attachmentsEnabled`, maximum size, document/image/video/audio/archive/other-file switches gate selection and validation. `allowStudentDownload`, `allowGuardianDownload`, and `allowInlinePreview` appear as read-only recipient-access policy context; they do not invent management download or preview operations. |
| Upload lifecycle | `clientRequestId`, name, MIME type, and byte size create the resumable upload intent; session capability and expiry data remain internal to the uploader; complete and cancel responses drive upload state; unlink uses `assetId`. |
| Revisions | List pagination, revision number, contract version, source status, title, and capture time drive history. Revision detail consumes academic context, type, audience, description, ordered targets/assets/links/tags, and the `null` General Resource detail snapshot. |
| Publication readiness | `canPublish`, `canSchedule`, and all blocking reasons drive allowed actions and explanation states. |
| Audience preview | `asOf`, student count, guardian-context count, guardian-account count, and guardian opt-out-context count are shown in the publication section. |
| Publication request | Idempotent `clientRequestId`, optional `publishAt`, `visibleFrom`, nullable `visibleUntil`, and `notifyMinorUpdate` are sent through the existing publication dialog. |
| Publication history/detail | Status, source status, schedule and visibility times, published/expired/cancelled times, recipient counts, creator user identifier, cancellation reason, superseded-publication link, change significance, minor-update notification choice, creation time, revision ID, and publication ID are consumed by history or detailed audit presentation. Operational identifiers are used for actions; unresolved creator identity is labelled explicitly as an identifier rather than a person name. |
| Publication mutations | Unschedule, cancel/withdraw, and start-revision actions use the selected publication ID and refresh publication state, aggregate state, and readiness. The revision-start response updates restored content status and retains old publication/revision correlation and cancellation metadata for result handling. |
| Lifecycle | Archive, restore, and draft deletion remain status- and permission-gated and use their existing responses to refresh or navigate. |

Client validation mirrors the request contract before submission: title is at
most 180 characters, rich-text description serialization is at most 4,000
characters, link collections contain at most 100 entries with a 180-character
label and 2,048-character safe HTTP/HTTPS URL, and tag collections contain at
most 100 unique normalized values of at most 80 characters each. Upload size
and file-family validation comes from the live file policy rather than a
hard-coded page limit. Backend validation remains authoritative.

### Intentionally non-applicable backend surfaces

- General Resources have no type-detail endpoint or payload.
- Submit, approve, request-changes, approval-history, and review-queue surfaces
  are not shown because the current workflow policy applies approval only to
  `TEACHER_PREPARATION`, not `GENERAL_RESOURCE`.
- Content creation and library listing belong to the General Resources list and
  creation flows, not this detail workspace.
- Updating the school-wide file policy belongs to settings and requires the
  separate settings permission; this page reads but does not mutate it.
- Preparation templates and the other content types’ detail endpoints are not
  applicable to General Resources.

### Exact field inventory for implementation review

The implementation review must account for these exact response and request
properties from the applicable backend DTOs:

- Aggregate: `id`, `academicYearId`, `termId`, `type`, `audience`, `title`,
  `description`, `status`, `archivedAt`, `createdAt`, `updatedAt`,
  `latestPublicationId`, `publicationStatus`, `publishAt`, `visibleFrom`,
  `visibleUntil`, `targets`, `assets`, `links`, `tags`, `details`.
- Target: `id`, `scopeType`, `stageId`, `gradeId`, `sectionId`, `classroomId`,
  `subjectId`, `teacherSubjectAllocationId`.
- Asset: `assetId`, `fileId`, `originalName`, `mimeType`, `sizeBytes`,
  `sortOrder`, `createdAt`.
- Link and tag: `id`, `label`, `url`, `value`, `sortOrder`.
- Authoring readiness: `canAdvance`, `blockingReasons`, reason `code`,
  `message`, and optional `details`.
- File policy: `attachmentsEnabled`, `maximumFileSizeBytes`,
  `documentsEnabled`, `imagesEnabled`, `videosEnabled`, `audioEnabled`,
  `archivesEnabled`, `otherFilesEnabled`, `allowStudentDownload`,
  `allowGuardianDownload`, `allowInlinePreview`.
- Upload intent/result: `clientRequestId`, `originalName`, `expectedMimeType`,
  `expectedSizeBytes`, `uploadId`, `status`, `sessionUrl`,
  `capabilityExpiresAt`, `expiresAt`, `uploadMode`, completed `asset`, completed
  `file`, `cancelledAt`, unlink `ok`, and unlink `assetId`.
- Revision summary/detail: `id`, `revisionNumber`, `snapshotContractVersion`,
  `sourceStatus`, `title`, `capturedAt`, `academicContentId`, `academicYearId`,
  `termId`, `type`, `audience`, `description`, `targets`, `assets`, `links`,
  `tags`, `details`, plus paginated `items`, `page`, `limit`, and `total`.
- Publication readiness: `canPublish`, `canSchedule`, `blockingReasons`.
- Audience preview: `asOf`, `students`, `guardianContexts`,
  `guardianUsersWithAccounts`, `guardianNotificationOptOutContexts`.
- Publication request: `clientRequestId`, `notifyMinorUpdate`, `publishAt`,
  `visibleFrom`, `visibleUntil`.
- Publication record: `publicationId`, `revisionId`, `status`,
  `sourceContentStatus`, `publishAt`, `visibleFrom`, `visibleUntil`,
  `publishedAt`, `expiredAt`, `cancelledAt`, `studentRecipientCount`,
  `guardianRecipientContextCount`, `createdByUserId`, `createdAt`,
  `cancellationReason`, `supersedesPublicationId`, `changeSignificance`,
  `notifyMinorUpdate`, plus paginated `items`, `page`, `limit`, and `total`.
- Revision-start result: `contentId`, `oldPublicationId`, `oldRevisionId`,
  `cancellationReason`, `restoredContentStatus`, `cancelledAt`.
- Metadata and ordered replacement requests: optional `title`, `description`,
  and `audience`; complete `targets`, `links`, and `tags` arrays.

Some property names recur across DTOs. Each occurrence is consumed according
to its owning response rather than merged into a synthetic frontend model.

## Architecture

The route remains:

`/[lang]/academic-content-hub/[contentId]?year=...&term=...`

`AcademicContentEditorPage` continues to own aggregate loading, academic-context resolution, dirty-navigation guards, permissions, lifecycle refresh, deletion navigation, and the shared `useAcademicContentEditor` state. Its presentation selection adds a dedicated `GeneralResourceEditorView` for `GENERAL_RESOURCE` while preserving all other existing type branches.

The dedicated workspace must reuse the current mutation and workflow layer rather than creating duplicate state or services. It composes the existing academic-content components where their behavior already matches the contract:

- `BasicInformationSection` for title, description, and audience;
- `TagsSection` for labels;
- `AcademicTargetsSection` for academic targeting;
- `LinksSection` for related links;
- `FilesSection` for attachments;
- `ReadinessPanel` for backend readiness;
- `AcademicContentPublicationPanel` for publication behavior;
- `RevisionHistoryPanel` for immutable history and snapshots;
- `LifecycleActions` for archive, restore, and delete behavior.

## Layout

### Header

The header includes:

- breadcrumbs and a Back to General Resources action;
- a sky-blue folder identity consistent with the General Resources list page;
- the resource title and rich-text description excerpt;
- content status and publication status as distinct values;
- permission- and state-aware lifecycle and publication actions.

The header must not display an author name, category, or other unsupported metadata.

### Summary strip

A compact summary strip shows:

- the saved audience;
- academic-target count;
- attachment count;
- last-updated date.

Counts come from the loaded aggregate. Empty values use clear neutral states rather than fabricated defaults.

### Desktop body

Use the established detail-workspace hierarchy:

- sticky section navigation approximately 220 pixels wide;
- a flexible active content panel;
- a contextual rail approximately 320 pixels wide on large screens.

The intended grid follows the existing Weekly Plan workspace pattern:

- two-column layout at large widths: `220px` navigation plus flexible content;
- three-column layout at extra-large widths: `220px` navigation, flexible content, and `320px` context rail.

### Tablet and mobile

- Section navigation becomes a horizontally scrollable control above the active panel.
- The context rail flows below the active panel.
- Cards and actions become full width where necessary.
- No section depends on a wide table.
- Directional icons, ordering, alignment, and breadcrumbs remain RTL-safe.

## Section Navigation

The dedicated navigation contains:

1. Overview
2. Target Audience
3. Resources
4. Readiness
5. Publication
6. Revision History

The active section is visually clear and keyboard accessible. When supported by existing editor state, sections may show dirty, saving, saved, blocked, or error indicators without introducing a second source of truth.

## Section Design

### Overview

Overview presents and edits only shared General Resource metadata:

- title;
- rich-text description;
- audience;
- tags.

Academic year, term, and content type are displayed as read-only context when useful. The existing metadata and tag mutations remain independent, so saving tags does not resend metadata and saving metadata does not replace tags.

Rich text is edited through the shared rich-text editor and displayed through the shared formatter. No raw markup is shown.

### Target Audience

Target Audience reuses the existing academic-target editor and supports only the scopes and relationships already accepted by the backend. Resolved stage, grade, section, classroom, and subject labels come from existing option/resolution services.

The screen must support multiple saved targets and must not assume one grade, classroom, or subject. If a resolver fails, the affected label displays a localized unavailable state without exposing the raw identifier.

### Resources

Resources combines related links and attachments into one focused workspace.

The links area reuses `LinksSection` and supports the verified behaviors:

- add a safe HTTP or HTTPS link;
- remove a link;
- reorder links;
- save the replacement list through the existing endpoint.

The attachments area reuses `FilesSection` and the current academic-content file policy. It supports the verified behaviors:

- upload permitted files;
- display upload progress and policy feedback;
- cancel an active upload;
- retry a failed upload;
- unlink an attached asset when permitted.

Attached items are ordered by backend `sortOrder` and show the returned name,
MIME type, size, and creation time. A compact recipient-access policy summary
shows whether student download, guardian download, and inline preview are
enabled by the school policy.

The design does not promise attachment reordering. It also does not introduce a download button unless implementation verifies and reuses an existing authenticated download action with the correct permission behavior. File and link failures remain local to their respective resource area.

### Readiness

Readiness reuses `ReadinessPanel` and displays the authoritative backend result and blocking reasons. The UI must not invent a percentage, completion count, or readiness rule.

Refreshing readiness must not reload or discard unrelated unsaved editor values.

### Publication

Publication reuses `AcademicContentPublicationPanel` and the existing publication policy. General Resources may expose publication controls when the content audience and permissions make the publication surface available. The existing policy excludes the publication surface for `INTERNAL_STAFF` content.

The section keeps content lifecycle status separate from publication status and continues to support only the actions currently implemented by the shared publication workflow, such as publish, schedule, unschedule, cancel, or start revision when the backend state and permissions allow them.

The publication section must consume the complete shared publication contract:

- readiness capabilities and blocking reasons;
- the complete audience preview and its `asOf` timestamp;
- immediate or scheduled timing, visibility window, and minor-update notification choice;
- paginated publication history and publication detail;
- source content status, recipient counts, creation and terminal timestamps;
- cancellation reason, superseded publication, change significance, and
  minor-update notification result;
- revision start, unschedule, and withdrawal/cancellation results.

The existing shared publication detail presentation must be extended if needed
so fields currently parsed but not visibly represented—particularly
`cancellationReason`, `supersedesPublicationId`, `changeSignificance`, and
`notifyMinorUpdate`—are available in the detailed audit view. This is a narrow
shared-component correction, not a new backend contract.

### Revision History

Revision History reuses `RevisionHistoryPanel` and existing snapshot presentation. History remains read-only. Revision failures are isolated from the editable sections.

## Contextual Rail

The contextual rail summarizes current aggregate data without becoming a second editing surface:

- readiness status and a concise blocking summary;
- audience and resolved academic-target summary;
- tags;
- publication status, schedule, and visibility window when available;
- created and updated timestamps;
- attachment and related-link counts.
- recipient attachment-access policy when attachments are enabled.

The rail must not show raw identifiers or infer a creator identity. Detailed
publication audit may show an unresolved creator user ID only with an explicit
identifier label, matching the backend’s actual value. Editing remains in the
corresponding main section so there is one mutation path per field group.

## Editing, Permissions, and Workflow

The workspace uses existing permission and mutability rules:

- view access permits inspection of the loaded aggregate;
- academic-content manage permission and mutable content status govern metadata, targets, tags, links, files, and lifecycle mutations;
- academic-content publish permission governs publication mutations;
- published or otherwise immutable content remains read-only until the existing revision workflow permits editing.

Each editable section retains its own validation, dirty, saving, saved, and error states. Section changes must preserve unsaved drafts. Existing page-exit and academic-context-change guards remain active.

After successful mutations that affect publication eligibility, the workspace refreshes the shared aggregate and readiness through the existing editor behavior. It must not maintain an independent copy of aggregate state in the dedicated view.

## Loading and Failure Isolation

- Initial aggregate loading and aggregate failure use the existing page-level behavior and retry path.
- Metadata, tags, targets, links, and files report errors inside their owning sections.
- Supporting-option failures affect only labels and selectors that require those options.
- Readiness, publication, and revision failures do not replace otherwise available resource data.
- Empty targets, files, links, tags, and revision history receive clear section-specific empty states.
- Permission-denied or immutable states remain understandable and do not expose nonfunctional controls.

## Component Boundaries

Expected dedicated presentation units are:

- `GeneralResourceEditorView`: layout, active-section selection, and composition;
- `GeneralResourceHeader`: breadcrumbs, identity, title, statuses, summary strip, and allowed top-level actions;
- `GeneralResourceSectionNav`: resource-specific navigation and state indicators;
- `GeneralResourceOverview`: composition of shared metadata and tags;
- `GeneralResourceResources`: composition of links and attachments;
- `GeneralResourceContextRail`: read-only readiness, target, tag, publication, audit, and resource summaries.

Existing UI components from `src/components/ui` remain the default. A new shared UI primitive belongs there only if no current primitive supports a reusable requirement. General Resource components must not duplicate existing editor mutations, publication logic, readiness rules, or file policies.

## Accessibility and Visual Rules

- Follow the existing MOAZEZ colors, typography, spacing, borders, shadows, and component conventions.
- Use established application or Lucide icons; do not use emoji or invented marks.
- Status is never communicated by color alone.
- Icon-only controls require accessible names.
- Navigation, forms, dialogs, uploads, and link controls require keyboard operation and visible focus.
- Validation messages remain associated with their controls.
- Hover feedback must not cause layout-shifting scale effects.
- Motion respects reduced-motion preferences.
- The workspace must remain usable at 375px, 768px, 1024px, and 1440px widths.

## Verification

Focused tests should verify:

- `GENERAL_RESOURCE` selects the dedicated workspace while other types keep their current views;
- the header and summary map only contract-backed fields and counts;
- overview metadata and tags save through their existing independent mutations;
- multiple targets, resolved labels, and resolver failure states;
- link add, remove, reorder, validation, and replacement behavior;
- asset ordering and display of name, MIME type, size, and creation time;
- file upload, progress, cancel, retry, complete, policy feedback, and unlink behavior;
- every file-policy flag, including recipient download and inline-preview policy context;
- readiness, publication, revision, and lifecycle composition;
- complete audience-preview field mapping;
- complete publication request, history, detail, cancellation, supersession, change-significance, minor-update, and revision-start mapping;
- `INTERNAL_STAFF` publication-surface exclusion;
- explicit absence of approval workflow for `GENERAL_RESOURCE` under the current backend policy;
- manage and publish permission gating, immutable states, and dirty-state preservation;
- localized loading, empty, failure, and retry behavior;
- English and Arabic translation parity, RTL-safe layout, accessibility, and responsive structure.

Before handoff, run focused tests, scoped lint, type checking, and a production build as appropriate. Run the full test suite only after explicit user approval.

## Acceptance Criteria

- General Resources open in a dedicated workspace that feels consistent with the Weekly Plan detail experience while retaining their own folder/resource identity.
- Every displayed or editable value is backed by the existing aggregate, an existing focused endpoint, or an established label resolver.
- The UI does not create a General Resource detail payload or display unsupported category, curriculum, creator, download-count, or notes fields.
- Overview, targets, links, files, readiness, publication, revisions, and lifecycle actions reuse the existing mutation and policy layers.
- Link reordering is supported; attachment reordering and unverified attachment download actions are absent.
- Publication availability respects audience, permissions, readiness, and backend lifecycle state.
- Other content-type editors remain behaviorally unchanged.
- Unsaved values survive section changes and remain protected by existing navigation guards.
- The experience works on desktop and mobile, in English and Arabic, in RTL, and with keyboard navigation.
