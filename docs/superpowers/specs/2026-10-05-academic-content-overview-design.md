# Academic Content Overview (Screen 1) Design

**Date:** 2026-10-05  
**Frontend worktree:** `feat/academic-content-center-wave-1-2`  
**Backend contract audited at:** `f71d8af2` (`Moazez-Backend` `origin/main`)

## Goal

Replace the Academic Content root library screen with a contract-faithful overview that follows the supplied Screen 1 mockup while preserving the existing library, authoring, review, templates, settings, lifecycle, publication, permissions, localization, and academic-context behavior.

This design does not require a backend change. It does not display values that the current backend cannot provide.

## Scope

This specification covers only the Academic Content overview screen and the minimum routing adjustment required to preserve the existing library.

Included:

- Overview header and permission-gated Create Content menu.
- Six content-type summary cards.
- Work in Progress panel.
- Upcoming Online Sessions panel.
- Recently Updated panel.
- Quick Links panel.
- Independent loading, empty, error, and partial-failure states.
- Responsive English/LTR and Arabic/RTL layouts.
- Moving the existing library UI to a dedicated route without changing its behavior.

Excluded:

- Dedicated list and detail designs for the six content types.
- New backend endpoints or DTO fields.
- Readiness aggregation.
- Content deadlines.
- Online-session recording metadata.
- Approval workflows for content other than Teacher Preparations.

## Verified Contract Constraints

The backend supports these content types:

- `TEACHER_PREPARATION`
- `WEEKLY_PLAN`
- `GUARDIAN_WEEKLY_NOTE`
- `SUBJECT_RESOURCE`
- `ONLINE_SESSION`
- `GENERAL_RESOURCE`

The management library supports academic year, term, type, lifecycle status, session start range, and other existing filters. Its response contains a paginated `items` array and `total`. Items contain base content fields plus a lightweight type-specific summary.

The list response does not expose:

- Creator or updater names.
- Academic targets.
- Teacher, subject, grade, or classroom display values.
- Readiness state or readiness reasons.
- A general attention deadline.
- Online-session join URLs.

Approval is optional and limited to `TEACHER_PREPARATION`. The overview must not describe Weekly Plans, Subject Resources, or other types as pending approval or needing review.

## Routing and Navigation

The overview becomes the root route:

```text
/{locale}/academic-content-hub
```

The existing library moves to:

```text
/{locale}/academic-content-hub/library
```

The existing library remains filterable through its current URL-backed filters, including:

```text
/library?contentStatus=DRAFT
/library?contentStatus=ARCHIVED
/library?type=ONLINE_SESSION
```

Until dedicated type pages are implemented, each content-type card links to the library with the matching `type` query value. All navigation preserves the selected `year` and `term` query values.

The Academic Content shell navigation becomes:

1. Overview
2. All Content
3. Drafts
4. Archived
5. Review Queue, when the user can approve content
6. Preparation Templates
7. File Policy Settings
8. Workflow Policy, subject to its existing permission behavior

The application continues to own the global sidebar, school header, academic-year selector, and term selector. The overview does not duplicate them.

## Page Composition

### Header

The header contains:

- Localized `Academic Content Center` heading.
- Localized description.
- Permission-gated Create Content menu.

The Create Content menu contains all six backend types. Selecting an option opens the existing creation route with a `type` query value. The creation page reads that value as its initial type while retaining its existing allowed-audience behavior.

The mockup's `Screen 1` badge is not part of the application UI.

### Content Type Grid

The grid contains one card per backend content type. Each card displays:

- A Lucide icon.
- Localized type name.
- Real item total, `0`, or localized unavailable copy.
- Short localized static description.
- View All action.

The card is keyboard accessible and has visible hover and focus feedback without layout movement. Different low-emphasis icon backgrounds may identify the types, but colors must use the application's existing tokens.

Grid behavior:

- Desktop: three columns by two rows.
- Tablet: two columns by three rows.
- Mobile: one column.

### Work in Progress

This panel replaces the mockup's unsupported Needs Attention panel. It combines the most recently updated `DRAFT` and `CHANGES_REQUESTED` content.

Each row displays:

- Type icon.
- Title.
- Localized content type.
- Draft or Changes Requested badge.
- Localized last-updated time.
- Open action.

The panel does not display deadlines, readiness claims, teachers, or approval claims.

### Upcoming Online Sessions

This panel displays future Online Session items that have an Online Session summary.

Each row displays:

- Localized session date.
- Start and end time.
- Title.
- Platform label with a supported local icon or a Lucide video icon.
- Derived temporal state.
- Open action.

Temporal states are derived from the current time and the contract's `startAt` and `endAt` values:

- Upcoming.
- Starting Soon.

The exact Starting Soon threshold must be defined as a pure frontend policy and covered by tests during implementation.

Because the request uses `sessionStartAtFrom` set to the current instant, this overview panel does not show Live or Ended sessions. Those states belong to the later dedicated Online Sessions experience, which can load a broader date range.

The panel does not display a teacher, subject, grade, classroom, or join URL because the list contract does not return them.

The backend orders management results by `updatedAt`, not session start. The frontend requests up to 100 matching future sessions and sorts the returned items by `startAt` ascending before displaying four. If more than 100 future sessions exist in the selected term, the backend cannot guarantee that this client-side window contains the absolute nearest four. The UI must not claim a stronger ordering guarantee.

### Recently Updated

This panel uses the backend's `updatedAt DESC` ordering and displays five items.

Desktop columns:

```text
Title | Content Type | Updated | Status | Actions
```

The unsupported Updated By column is omitted. On mobile, rows become stacked cards instead of forcing a wide page-level table.

Relative time may be shown visually, but each value uses a semantic `time` element whose accessible label or tooltip includes the full localized date and time.

### Quick Links

The panel contains:

- Review Queue, shown only with `academics.academic_content.approve`.
- Preparation Templates.
- Content Settings, linked to the existing file-policy settings route.

Workflow Policy remains available through the Academic Content shell.

## Data Flow

The page depends on both `academicYearId` and `termId` from the existing academic context. If either is missing, it renders the established academic-context empty state and does not send overview requests.

Ten requests run independently and in parallel:

1. Six library requests with `page=1`, `limit=1`, and one fixed content type. Only each response's `total` is used.
2. One `DRAFT` request for Work in Progress.
3. One `CHANGES_REQUESTED` request for Work in Progress.
4. One `ONLINE_SESSION` request with `sessionStartAtFrom` set to the current instant and `limit=100`.
5. One unfiltered library request with `page=1` and `limit=5` for Recently Updated.

Every request includes the selected academic year and term.

The overview state is coordinated by one page-level hook or controller. Presentation components receive data and callbacks; they do not fetch independently. Requests use settled-result behavior so one failure does not discard successful sections. Stale responses are ignored after academic-context changes or unmounting.

## Permissions

- Page access continues to require `academics.academic_content.view` through the existing access guard.
- Create Content requires `academics.academic_content.manage`.
- Review Queue requires `academics.academic_content.approve`.
- Existing settings and content actions retain their current permission checks.

Unauthorized actions are omitted. The overview does not replace them with controls that appear available but cannot succeed.

## Component Boundaries

The page uses existing primitives from `src/components/ui`, including Button, DropdownMenu, EmptyState, loader or skeleton patterns, and established status badges where applicable.

Feature-specific components live under:

```text
src/features/academic-content/components/overview/
```

Planned responsibilities:

- `AcademicContentOverviewHeader`: heading, description, and Create Content menu.
- `ContentTypeGrid`: responsive arrangement of the six type cards.
- `ContentTypeSummaryCard`: one type's icon, total, description, and navigation.
- `WorkInProgressPanel`: merged Draft and Changes Requested rows.
- `UpcomingSessionsPanel`: session window, client-side ordering, and temporal state.
- `RecentlyUpdatedPanel`: recent item table/card presentation.
- `AcademicContentQuickLinks`: permission-aware operational links.
- `AcademicContentOverviewSkeleton`: initial page-level loading composition.

These are feature components, not replacements for generic UI primitives.

## Loading, Empty, and Error States

- Each card total and operational panel has an independent loading state.
- A failed total displays localized unavailable copy, never `0`.
- Failed panels display localized error copy and a scoped Retry action.
- Successful sections remain visible when another request fails.
- Empty Draft/Changes Requested, Upcoming Sessions, and Recently Updated results have distinct localized empty states.
- A real zero total remains distinguishable from a failed request.
- Existing API error normalization remains authoritative.

## Responsive and Accessibility Requirements

- Test layout behavior at 375px, 768px, 1024px, and 1440px.
- No page-level horizontal overflow.
- Interactive targets remain at least 44px where the existing primitive supports it.
- Cards, menus, links, and row actions are keyboard operable.
- Focus indicators remain visible.
- Status is communicated with text or an icon in addition to color.
- Dates use semantic `time` elements.
- Refreshed result regions use polite announcements where useful without making skeletons sound like content.
- Directional icons mirror in Arabic where required.
- All visible copy exists in both English and Arabic.
- Reduced-motion preferences are respected.

## Verification Strategy

Targeted tests cover:

- Exact queries for all six content types.
- Academic year and term propagation.
- Correct zero, total, loading, and unavailable states.
- Independent partial failures and scoped retries.
- Stale-response suppression after context changes.
- Draft and Changes Requested merging and ordering.
- Online Session filtering, summary validation, client-side ordering, and temporal-state boundaries.
- Recently Updated mapping and ordering preservation.
- Permission-gated Create Content and Review Queue controls.
- Type-prefilled creation navigation.
- Year and term query preservation.
- Loading, empty, error, and partial-data states.
- English and Arabic translation-key parity.
- Absence of unsupported teacher, subject, deadline, readiness, and updater fields.

Implementation verification may run targeted tests, ESLint, typecheck, and build. The repository-wide test suite requires explicit user approval before it is run.

Every production-code change must pass Clean Code Guard. Every test change must pass Test Guard.

## Acceptance Criteria

- The overview matches the supplied mockup's hierarchy while using the application's existing shell and styles.
- Every displayed dynamic value is supported by the current backend contract or explicitly derived from supported timestamps.
- Existing Academic Content functionality remains reachable and behaviorally unchanged.
- No backend modification is required.
- Partial backend failures do not collapse the whole overview.
- English, Arabic, desktop, tablet, and mobile experiences remain usable.
- No UUID, invented deadline, invented user name, or unsupported academic target is rendered.

## Known Limitation

The frontend-only Upcoming Online Sessions ordering is exact only within the maximum 100 matching items returned by the backend request. Removing this limitation would require a backend sort or dedicated overview endpoint, which is outside scope.
