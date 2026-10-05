# Teacher Preparation Detail Screen Design

Date: 2026-10-05
Status: Approved

## Objective

Redesign the teacher-preparation detail experience to express the visual hierarchy of Screen 3 while preserving the existing backend contract, application styles, permissions, workflow rules, and editor behavior. The redesign applies only to `TEACHER_PREPARATION`; every other academic-content type keeps its current editor until it receives a dedicated design.

## Scope

### Included

- A specialized teacher-preparation presentation on the existing academic-content detail route.
- Preparation-specific header, section navigation, content panels, and contextual right rail.
- Existing metadata, targets, preparation details, links, tags, files, readiness, workflow, approval history, revisions, publication, and lifecycle behavior.
- Responsive desktop, tablet, mobile, RTL, loading, empty, error, partial-failure, and read-only states.
- Contract-backed resolution of academic targets, assigned teachers, curriculum references, lesson-plan references, and timetable references when those names are available from existing frontend services.

### Excluded

- Backend changes.
- New API fields or endpoints.
- Redesigning other academic-content types.
- Invented lesson duration, author identity, readiness percentage, completion counts, or approval data.
- A route-per-section model.
- Unrelated refactoring of the generic academic-content editor.

## Backend Contract Constraints

The aggregate content detail provides:

- base fields: title, description, type, audience, status, academic year, term, timestamps, and publication metadata;
- academic targets as identifiers and scope types;
- assets, links, and tags;
- teacher-preparation details: topic, objectives, learning outcomes, teaching strategies, activities, resource notes, assessment notes, teacher notes, curriculum identifiers, lesson-plan identifiers, and timetable-entry identifier.

Readiness provides only:

- `canAdvance`;
- ordered `blockingReasons` containing backend reason codes and safe messages.

Workflow endpoints provide policy, submit/resubmit behavior, approval rounds, statuses, timestamps, decision actors, and notes. Revision endpoints provide immutable snapshots. File endpoints provide upload, completion, cancellation, and unlink behavior.

The contract does not provide a readiness percentage, completed-section count, lesson duration, or content-author identity. A teacher resolved through `teacherSubjectAllocationId` is an assigned teacher, not necessarily the creator.

## Architecture

The route remains:

`/[lang]/academic-content-hub/[contentId]?year=...&term=...`

`AcademicContentEditorPage` continues to own aggregate loading, context resolution, dirty-navigation guards, permissions, lifecycle refresh, and deletion navigation. Its presentation branch becomes:

- `TEACHER_PREPARATION`: render a specialized `TeacherPreparationEditorView`.
- all other types: render the existing generic `AcademicContentEditorView` unchanged.

The specialized view consumes the existing `useAcademicContentEditor` state and current workflow/reference services. It must not duplicate API state or create an independent saving implementation.

## Layout

### Desktop

- Breadcrumb and a backend-safe “Back to Preparations” action.
- Header with title, description, status, academic context, target summary, assigned-teacher summary when resolvable, and permitted workflow/lifecycle actions.
- Three-column body:
  - sticky preparation section navigation;
  - active content panel;
  - contextual rail for readiness, references, and approval history.

### Tablet

- Section navigation and content remain the primary columns.
- Contextual cards flow below the active content panel when horizontal space is insufficient.

### Mobile

- Compact section selector above the active panel.
- Stacked cards and full-width primary actions.
- No horizontal-table dependency.

Sticky elements must respect the dashboard header offset. Directional icons, breadcrumbs, alignment, and ordering must behave correctly in RTL.

## Information Mapping

### Header

- Title and description: academic-content base record.
- Status: academic-content status.
- Academic year and term: resolved from the page context.
- Subject, stage, grade, section, and classroom: resolved from all current targets.
- Assigned teacher: resolved from target allocation identifiers where possible and labelled accurately.
- Multiple targets: summarized without collapsing the underlying multi-target model.

### Sections

1. **Overview** — title, description, topic, audience, academic context, and tags.
2. **Targets** — existing multi-target editor.
3. **Objectives** — ordered `objectives`.
4. **Learning outcomes** — ordered `learningOutcomes`.
5. **Teaching strategies** — ordered `teachingStrategies`.
6. **Activities** — ordered `activities`.
7. **Resources** — `resourceNotes`, assets, and links.
8. **Assessment** — `assessmentNotes`.
9. **Teacher notes** — `teacherNotes`.
10. **Academic references** — curriculum, unit, lesson, lesson plan, lesson-plan item, and timetable entry.
11. **Readiness** — authoritative backend result and blocking reasons.
12. **Publication** — only when allowed by the existing type/audience policy.
13. **Revision history** — existing immutable revisions.

Tags visually replace the reference image’s unsupported “Key Concepts” concept. No field is relabelled in a way that changes its meaning.

## Editing and Saving

Editing remains section-based. Each visible section owns validation, dirty, saving, saved, and error presentation.

The teacher-preparation backend replaces the complete preparation-detail payload in one request. Therefore, objectives, outcomes, strategies, activities, notes, and references must share a single preparation-detail draft controller. Saving an individual presentation section sends the complete normalized detail payload so values owned by other sections are preserved.

Switching presentation sections must retain unsaved values. Submission remains disabled while any section is dirty or saving. Existing browser-exit and academic-context-change guards remain active.

After saves, uploads, lifecycle transitions, or submission, the view refreshes the aggregate and readiness data through existing editor operations.

## Actions and Permissions

- Submit or resubmit appears only when the workflow policy requires approval and existing permission, mutable-status, readiness, and clean-state checks allow it.
- Read-only content exposes no editing controls.
- Lifecycle actions remain limited to supported archive, restore, and delete transitions.
- Publication controls remain permission- and policy-gated.
- File actions keep the current file-policy and permission behavior.
- There is no fake global “Save Draft” action; saving follows the backend-compatible section model.

## Contextual Rail

### Readiness

Show `Ready to submit` when `canAdvance` is true. Otherwise show `Blocked` and the localized backend blocking reasons. Never synthesize a percentage or completed-section count.

### Curriculum and Lesson References

Resolve selected identifiers through existing detail-option services. Show a neutral unavailable or unassigned state when an optional reference is absent or cannot be resolved. Do not expose raw identifiers as fallback display values.

### Timetable Reference

Resolve the selected timetable entry through existing detail options. Display only fields returned by that service. If the entry is no longer resolvable, show an unavailable state without treating the whole preparation as failed.

### Approval History

Use real rounds, statuses, submitters, decision makers, timestamps, and decision notes. Approval-history failure remains isolated from the aggregate preparation view.

## Component Boundaries

- `TeacherPreparationEditorView`: preparation page composition.
- `TeacherPreparationHeader`: breadcrumbs, content summary, status, and permitted actions.
- `TeacherPreparationSectionNav`: preparation-specific section selection and save-state indicators.
- `TeacherPreparationOverview`: metadata and topic presentation/editing.
- Focused ordered-list and note panels: presentation-specific editors backed by the shared detail draft controller.
- `TeacherPreparationContextRail`: readiness, reference, and approval-card layout.
- Small pure resolution and formatting helpers for target and reference summaries.

Existing target, file, link, tag, readiness, workflow, approval-history, revision-history, publication, and lifecycle components should be reused directly or through narrowly scoped presentation variants. All new UI primitives must come from `src/components/ui`; create a reusable UI primitive there only when no suitable component exists.

## States and Failure Isolation

- Aggregate loading: existing loader or skeleton treatment.
- Aggregate failure: page-level alert and retry.
- Reference-option failure: affected labels/cards show a localized unavailable state while the preparation remains usable.
- Optional data absent: section-specific empty or “Not assigned” state.
- Readiness failure: isolated retry without discarding editor data.
- Empty lists and notes: clear section-specific empty states.
- Unknown backend readiness reason: safe localized fallback while preserving the backend result.
- Read-only state: visible in the header and enforced by all controls.

## Accessibility and Visual Rules

- Use the app’s existing colors, spacing, typography, borders, shadows, and UI components.
- Use Lucide or established app icons; no emoji or invented brand marks.
- Do not communicate status by color alone.
- Icon-only controls require accessible names.
- Navigation uses labelled buttons with keyboard and focus support.
- Forms retain visible labels and associated validation messages.
- Interactive states use subtle color/opacity transitions without layout-shifting scale effects.
- Respect reduced-motion preferences.

## Verification

Focused tests will verify:

- teacher preparations select the specialized view while other types retain the generic editor;
- complete preparation-detail payload preservation when saving individual presentation sections;
- multi-target and unavailable-name summaries;
- permission, mutability, readiness, saving, and dirty-state action gating;
- submission and approval-history refresh behavior;
- responsive navigation and section switching;
- loading, failure, empty, read-only, and RTL behavior;
- translation-key alignment.

Before handoff, run focused tests, scoped lint, type-check, and a production build. Run the full test suite only after explicit user approval.

## Acceptance Criteria

- The teacher-preparation detail screen reflects Screen 3’s hierarchy without displaying unsupported data.
- All displayed values are sourced from the academic-content contract or existing resolvers.
- All mutations use existing frontend services and backend endpoints.
- Other content-type editors remain behaviorally unchanged.
- Unsaved changes cannot be silently discarded through section or context navigation.
- The experience is usable on desktop and mobile, in English and Arabic, and with keyboard navigation.
