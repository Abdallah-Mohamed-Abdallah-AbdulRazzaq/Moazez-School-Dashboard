# Weekly Plan Detail Screen Design

Date: 2026-10-05
Status: Approved

## Objective

Create a dedicated Weekly Plan detail experience that expresses the hierarchy of Screen 5 while preserving the latest backend contract, application styles, permissions, publication rules, and section-based editor behavior. The redesign applies only to `WEEKLY_PLAN`; other academic-content types retain their current specialized or generic editors.

## Scope

### Included

- A Weekly Plan-specific presentation on the existing academic-content detail route.
- A plan header, summary strip, section navigation, focused authoring panels, and contextual right rail.
- Existing metadata, multi-target editing, audience, Weekly Plan details, links, attachments, readiness, publication, revisions, and lifecycle behavior.
- Contract alignment for current publication metadata and revision actions required by the latest backend.
- Resolution of academic target, subject, homework, and assessment names through existing frontend services.
- Responsive desktop, tablet, mobile, RTL, loading, empty, error, partial-failure, and read-only states.

### Excluded

- Backend changes or new endpoints.
- Daily breakdowns, activities, Weekly Plan curriculum references, additional audiences, or separate teacher and guardian notes.
- Fabricated author names, creator identities, publication dates, topics, target labels, or readiness percentages.
- A fake whole-page “Save Draft” action.
- Redesigning other content types or unrelated editor infrastructure.

## Backend Contract Constraints

The latest backend aggregate response provides:

- base content fields: title, description, type, audience, content status, academic year, term, archive timestamp, created timestamp, and updated timestamp;
- current publication metadata: latest publication identifier, publication status, publish time, visibility start, and visibility end;
- academic targets with scope, subject, and allocation identifiers;
- assets, links, and tags;
- Weekly Plan details: start date, end date, objectives, topics, expected-homework text, upcoming-assessment text, general notes, homework reference identifiers, and assessment reference identifiers.

Publication endpoints provide readiness, audience preview, scheduling, history, cancellation, revision start, recipient counts, creator user identifiers, cancellation reasons, superseded-publication relationships, change significance, and minor-update notification behavior.

The contract does not provide daily breakdowns, Weekly Plan activities, curriculum references, multiple simultaneous audiences, separate teacher and guardian notes, or a content creator identity. `createdByUserId` belongs to a publication record and must not be presented as the content author.

## Architecture

The route remains:

`/[lang]/academic-content-hub/[contentId]?year=...&term=...`

`AcademicContentEditorPage` continues to own aggregate loading, academic-context resolution, dirty-navigation guards, permissions, lifecycle refresh, and deletion navigation. Its presentation branch becomes:

- `TEACHER_PREPARATION`: existing specialized preparation view;
- `WEEKLY_PLAN`: new `WeeklyPlanEditorView`;
- all other types: existing generic editor.

The Weekly Plan view consumes the existing `useAcademicContentEditor` state. It must reuse current metadata, targets, files, links, readiness, publication, revision, and lifecycle services rather than creating a second data or mutation layer.

## Layout

### Desktop

- Backend-safe “Back to Weekly Plans” navigation and breadcrumbs.
- Header with plan title, description, content status, week range, academic context, and permitted lifecycle/publication actions.
- Summary strip for week range, resolved subjects, target scopes, and the single saved audience.
- Three-column body:
  - sticky Weekly Plan section navigation;
  - active content panel;
  - contextual rail for readiness, publication status, targets, topics, and attachments.

### Tablet

- Navigation and active panel remain primary.
- Context cards flow below the active panel when three columns no longer fit.

### Mobile

- Compact section navigation above the active panel.
- Full-width cards and actions.
- Context cards follow the active panel.
- No horizontal-table dependency.

Sticky elements must respect the dashboard header offset. Directional icons, breadcrumbs, ordering, and alignment must support RTL.

## Information Mapping

### Header and Summary

- Title and description: base content record.
- Week range: Weekly Plan details.
- Optional term-relative week number: derived from saved dates and the selected term for display only.
- Subject and target summaries: resolved from every saved target; the UI must not assume one classroom or subject.
- Audience: the single saved backend audience.
- Content status and publication status: displayed as distinct concepts.
- Published time: publication metadata or the latest applicable history record, never `updatedAt`.

### Sections

1. **Plan Details** — title, rich-text description, start date, and end date.
2. **Targets** — existing multi-target editor, including subject selection.
3. **Learning Objectives** — ordered `objectives` list.
4. **Topics** — ordered `topics` list.
5. **Homework** — rich-text `expectedHomework` plus `homeworkAssignmentIds` references.
6. **Assessments** — rich-text `upcomingAssessments` plus `gradeAssessmentIds` references.
7. **Plan Notes** — rich-text `notes`; it must not be relabelled as separate teacher or guardian notes.
8. **Resources** — links and the complete attachments manager.
9. **Readiness** — authoritative backend readiness and blocking reasons.
10. **Publication** — readiness, audience preview, scheduling, publication history, withdrawal, and revision start when supported and permitted.
11. **Revisions** — existing immutable revision history and snapshots.

Tags remain supported backend metadata but do not replace topics. They appear as optional Labels in Plan Details beneath the description and use the existing tag editor.

## Editing and Saving

Editing remains panel-based. Each editable panel exposes its own validation, dirty, saving, saved, and error states.

The Weekly Plan backend replaces the complete type-detail payload in one request. Objectives, topics, dates, homework text, assessment text, notes, and both reference arrays therefore share one Weekly Plan detail draft controller. Saving one detail panel sends the complete normalized detail payload so values owned by other panels are preserved.

Metadata, targets, links, and assets continue using their existing endpoints. Switching panels preserves unsaved draft values. Browser-exit and academic-context-change guards remain active.

Publishing is disabled while relevant changes are dirty or saving, or while backend readiness blocks the operation. Published content remains read-only until the backend revision-start action restores it to an editable authoring status.

## Publication Contract Alignment

The frontend contract and parser must align with the latest backend fields used by this screen:

- aggregate publication metadata: `latestPublicationId`, `publicationStatus`, `publishAt`, `visibleFrom`, and `visibleUntil`;
- publication request: optional `notifyMinorUpdate`;
- publication response: `cancellationReason`, `supersedesPublicationId`, `changeSignificance`, and `notifyMinorUpdate`;
- revision-start response and the backend revision-start endpoint.

The publication UI must keep content status and publication status separate. Revision, withdrawal, schedule, and publish actions remain permission- and backend-readiness-gated. No optimistic label may claim final publication before the backend returns a final state.

## Contextual Rail

### Readiness

Show ready or blocked state and localized backend blocking reasons. Do not generate a percentage or completed-section count.

### Publication Status

Show current publication state, publish schedule, visibility window, and latest real publication timestamp when available. The contextual rail omits the reference image’s “Created By” row because the aggregate contract has no author identity. Detailed publication history may show the backend-provided publication creator identifier with an explicit identifier label; it must not present that value as a resolved person name.

### Targets and Topics

Summarize all resolved target scopes, subjects, and topics. Missing resolvers produce a neutral unavailable state without exposing raw identifiers.

### Attachments

Display the current backend asset collection with existing upload, preview, download, unlink, policy, and refresh behavior. The rail and Resources panel must share the same aggregate data and actions rather than maintaining independent attachment state.

## Component Boundaries

- `WeeklyPlanEditorView`: page composition and active-panel selection.
- `WeeklyPlanHeader`: breadcrumbs, summary, status, and permitted actions.
- `WeeklyPlanSectionNav`: plan-specific navigation and save-state indicators.
- `WeeklyPlanDetailDraft` hook or controller: shared complete-detail draft and replacement payload.
- Focused plan-details, ordered-list, homework, assessment, and notes panels.
- `WeeklyPlanResources`: links and attachment management.
- `WeeklyPlanContextRail`: readiness, publication, target, topic, and attachment summaries.
- Small pure formatting and resolution helpers for week and target summaries.

Existing UI components from `src/components/ui` must be used. A reusable primitive belongs there only when no suitable component exists. Existing academic-content target, link, file, readiness, publication, revision, and lifecycle components should be reused directly or through narrow presentation variants.

## States and Failure Isolation

- Aggregate loading: existing partial loader or skeleton treatment.
- Aggregate failure: page-level error with retry.
- Missing Weekly Plan details: explicit incomplete state and action to author them.
- Supporting option failure: affected labels and selectors show a localized warning and retry while saved plan data remains visible.
- Missing homework or assessment reference: retain the saved identifier until the user replaces or removes it; do not silently discard it.
- Save failure: attached to the panel that failed.
- Readiness or publication failure: isolated from normal authoring.
- Empty lists, notes, links, and assets: clear section-specific empty states.
- Read-only state: visible in the header and enforced across all controls.

## Accessibility and Visual Rules

- Follow the existing MOAZEZ colors, typography, spacing, borders, shadows, and component conventions.
- Use Lucide or established application icons; no emoji or invented marks.
- Do not communicate status by color alone.
- Icon-only controls require accessible names.
- Section navigation and forms require keyboard support, visible focus, labels, and associated validation messages.
- Rich text must render through the shared formatter and edit through the shared editor.
- Hover feedback uses color, opacity, border, or shadow changes without layout-shifting scale effects.
- Content must not overflow at 375px, 768px, 1024px, or 1440px widths.
- Reduced-motion preferences must be respected.

## Verification

Focused tests will verify:

- Weekly Plans select the specialized view while other types retain their current views;
- complete Weekly Plan detail payload preservation when saving individual panels;
- multi-target, multi-subject, and unavailable-name summaries;
- missing-detail recovery and missing-reference preservation;
- permission, read-only, readiness, dirty, saving, and publication action gating;
- publication metadata, revision-start, scheduling, withdrawal, and history behavior;
- shared attachment behavior across the rail and Resources panel;
- responsive section switching, English and Arabic labels, and RTL-safe presentation;
- loading, empty, error, and partial-failure states.

Before handoff, run focused tests, scoped lint, type-check, and a production build. Run the full test suite only after explicit user approval.

## Acceptance Criteria

- The Weekly Plan detail screen expresses Screen 5’s hierarchy without showing unsupported fields or actions.
- Every displayed value comes from the current backend contract, an existing resolver, or an explicitly identified display-only derivation.
- Daily breakdowns, activities, curriculum references, additional audiences, and separate teacher/guardian notes are absent.
- All detail-panel saves preserve the complete Weekly Plan detail payload.
- Publication data and actions match the latest backend contract and remain distinct from content lifecycle status.
- Other content-type editors remain behaviorally unchanged.
- Unsaved values survive panel changes and cannot be silently discarded through page or context navigation.
- The experience works on desktop and mobile, in English and Arabic, and with keyboard navigation.
