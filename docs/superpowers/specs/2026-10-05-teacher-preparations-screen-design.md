# Teacher Preparations (Screen 2) Design

**Date:** 2026-10-05  
**Frontend branch:** `feat/academic-content-center-wave-1-2`  
**Backend contract audited at:** `f71d8af2` (`Moazez-Backend` `main`)

## Goal

Add a dedicated Teacher Preparations management page that follows the supplied Screen 2 hierarchy while displaying only data supported by the current Academic Content backend. The page uses the existing application shell, academic context, permissions, localization, UI primitives, API client, and editor routes.

This design does not require or permit a backend contract change.

## Scope

Included:

- A dedicated localized Teacher Preparations route.
- Screen 1 navigation from the Teacher Preparations card.
- Preparation count cards.
- Contract-supported search and filters.
- A preparation-specific desktop table and mobile card list.
- URL-backed filter and pagination state.
- Permission-aware creation and row actions.
- Independent loading, empty, error, and retry states.
- English/LTR and Arabic/RTL behavior.

Excluded:

- Backend changes or new aggregate endpoints.
- Historical percentage trends.
- Teacher identity in list rows.
- Target names in list rows.
- Readiness percentages or readiness filtering.
- Bulk selection or bulk actions.
- User-selectable sorting.
- A grid-view mode.
- Changes to the existing preparation editor or lifecycle contracts.

## Verified Backend Constraints

The management list accepts these filters needed by the page:

- `academicYearId`
- `termId`
- `type`
- `status`
- `stageId`
- `gradeId`
- `classroomId`
- `subjectId`
- `teacherUserId`
- `search`
- `page`
- `limit`

The list response provides paginated items and a `total`. Each preparation item contains base Academic Content fields plus a lightweight preparation summary whose supported type-specific value is `topic`.

The list response does not expose:

- Creator, updater, or teacher identity.
- Targets or display names for subject, stage, grade, section, or classroom.
- Readiness state, blocking reasons, or completion percentage.
- Approval-record status separate from the content lifecycle.
- Arbitrary sorting controls.

Management results are ordered by `updatedAt DESC` and then ID descending. The UI must not present an interactive sort control.

The content lifecycle status `SUBMITTED` is presented to users as **Pending approval**. It must not be confused with the approval-history status `PENDING`, which is not part of the management-list response.

## Routing and Navigation

The dedicated page is planned at:

```text
/{locale}/academic-content-hub/preparations
```

The Screen 1 Teacher Preparations card links to this route while preserving the current academic year and term query state.

The existing all-content library remains at:

```text
/{locale}/academic-content-hub/library
```

The New Preparation action opens the existing creation route with `type=TEACHER_PREPARATION`. Opening a preparation uses the existing content details/editor route. Existing access guards and lifecycle behavior remain authoritative.

## Page Composition

### Header

The header contains:

- Breadcrumb: Academic Content Center, then Teacher Preparations.
- Preparation icon.
- Localized title and description.
- New Preparation button, visible only when the user can manage Academic Content.

### Summary Cards

Four cards show current counts for the selected academic year and term:

1. Total Preparations: `type=TEACHER_PREPARATION`.
2. Draft: fixed `status=DRAFT`.
3. Pending Approval: fixed `status=SUBMITTED`.
4. Approved: fixed `status=APPROVED`.

Each card uses the response `total`. Historical percentages and trend arrows from the reference image are omitted because the backend does not provide comparison data.

Each count has an independent loading, unavailable, and retry state. A failed request is never rendered as zero.

### Search and Filters

The page supports:

- Debounced search.
- Teacher.
- Stage.
- Grade.
- Classroom.
- Subject.
- Content status.
- Active filter chips.
- Clear All.

Filter option loading reuses the existing Academic Content browse-option sources. Dependent options retain the project's current academic hierarchy behavior. Applying a filter resets the result page to 1.

Readiness is omitted because it is not a list filter. Approval Status is represented by the existing content-status filter rather than a second, misleading status control.

### Results

The desktop table contains:

```text
Preparation / Topic | Description | Status | Last Updated | Actions
```

Preparation / Topic shows the preparation title and the summary topic when available. Description is the base content description. Status uses the existing localized Academic Content status presentation. Last Updated uses `updatedAt` in a semantic `time` element.

The row action area always supports Open. Additional actions may appear only when an existing endpoint, permission, and lifecycle rule all authorize them. Unsupported bulk-selection controls are omitted.

The result header shows the real filtered `total`. The footer provides the existing supported page-size and pagination controls.

On small screens, results render as cards using the same returned fields. The page must not depend on horizontal scrolling to expose primary information or actions.

## Data Flow

The page reads `academicYearId` and `termId` from the existing academic context. No preparation request runs until both values are available.

The primary list request always fixes `type=TEACHER_PREPARATION` and passes only the supported URL filters, page, and limit.

Four lightweight count requests run independently. Each sends `page=1`, the smallest supported limit, `type=TEACHER_PREPARATION`, the selected academic context, and the relevant fixed status when applicable. Only `total` is consumed.

The main list state and summary resources are coordinated by a preparation page hook or controller. Presentation components do not fetch independently. Request identity or cancellation prevents stale responses from older academic contexts, searches, filters, or pages from replacing current state.

Search, filters, page, and limit are stored in the URL. Existing academic year and term query values remain intact when these values change.

## Component Boundaries

The implementation should use existing primitives from `src/components/ui` and existing Academic Content status, pagination, translation, permission, API, and browse-option behavior where their contracts fit.

Planned feature responsibilities:

- `TeacherPreparationsPage`: page composition and navigation.
- Preparation data hook/service: fixed type, URL state, count and list requests, retries, and stale-response protection.
- Preparation header: breadcrumb, heading, and permission-aware create action.
- Statistics grid: four independent summary resources.
- Preparation filters: supported filter controls and active chips.
- Preparation results: desktop table and mobile cards from one data source.

Shared code is extracted only when the existing library and the new page have the same rule and both consume it. The page must not duplicate generic UI primitives.

## Loading, Empty, and Error States

- Initial count cards use stable loading placeholders.
- Each failed count shows localized unavailable copy and a scoped retry.
- Count failures do not hide successful counts or the results list.
- List loading preserves the page structure and shows a stable loading state.
- An empty filtered result distinguishes itself from an empty preparation collection and offers Clear Filters when applicable.
- A list failure shows the normalized API error and a Retry action without removing the header or filters.
- Missing academic context uses the existing context state and sends no requests.

## Permissions and Actions

- Page access continues to rely on `academics.academic_content.view` through the existing Academic Content access behavior.
- New Preparation requires `academics.academic_content.manage`.
- Editing remains limited to mutable statuses according to the existing frontend and backend lifecycle rules.
- Unauthorized or invalid actions are omitted instead of rendered as controls that will fail.

## Visual, Responsive, and Accessibility Requirements

- Use the application background, primary blue, semantic colors, typography, spacing, radii, borders, shadows, and UI components.
- Use four columns for summary cards when space permits, two at intermediate widths, and one on narrow screens.
- Stack filters responsively and allow active chips to wrap.
- Replace the desktop table with mobile result cards at narrow widths.
- Preserve visible keyboard focus and existing minimum interactive-target behavior.
- Label every search, filter, pagination, and row-action control.
- Communicate status with text, not color alone.
- Use semantic headings, table markup, and `time` elements.
- Localize every visible string in English and Arabic.
- Keep directional spacing and icons safe in RTL.
- Prevent page-level horizontal overflow.

## Verification Strategy

Targeted tests cover:

- Screen 1 navigation to the dedicated route.
- Fixed `TEACHER_PREPARATION` type on every page request.
- Academic year and term propagation.
- Total, `DRAFT`, `SUBMITTED`, and `APPROVED` count queries.
- Count zero, loading, partial failure, and scoped retry states.
- Supported filter serialization and unsupported-filter absence.
- Debounced search and page reset after filter changes.
- URL state and academic-context query preservation.
- Stale-response suppression.
- Desktop and mobile result presentation.
- Topic fallback behavior when the preparation summary is absent.
- Pending Approval localization for `SUBMITTED`.
- Permission-aware New Preparation behavior.
- Loading, empty, filtered-empty, and list-error states.
- English and Arabic translation-key parity.
- Absence of invented teacher, target, readiness, trend, bulk-action, and sorting data.

Implementation verification may run targeted tests, scoped ESLint, typecheck, and a production build. The repository-wide test suite requires explicit user approval.

Every production-code change must pass Clean Code Guard. Every test change must pass Test Guard.

## Acceptance Criteria

- Teacher Preparations has a dedicated route and distinct type-specific UI.
- Screen 1 links to the dedicated route without removing the all-content library.
- Every dynamic value is supported by the current backend response or is a localized label for an existing enum value.
- No backend files or contracts change.
- Search, supported filters, pagination, creation, and opening a preparation work with existing APIs.
- Partial count failures do not collapse the page.
- Desktop, tablet, mobile, English, and Arabic layouts remain usable.
- No teacher name, target label, readiness percentage, historical trend, or unsupported sort is invented.
