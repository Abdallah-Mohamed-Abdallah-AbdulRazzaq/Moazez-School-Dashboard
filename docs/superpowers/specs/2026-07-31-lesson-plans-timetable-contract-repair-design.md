# Lesson Plans and Timetable Contract Repair Design

**Backend authority:** `Moazez-Backend` commit `2f87a155cf27f2186cfd7746026562ef18cb4f71`

## Goal

Repair the `sis-dashboard` lesson-plan and timetable-selection workflows so they
match the verified backend contract while preserving the existing Lesson Plans
route, filters, weekly board, dialogs, permissions, and responsive layouts.

The work is frontend-only. It does not change `Moazez-Backend` or introduce new
API routes.

## Scope

The repair covers:

- stable lesson-plan scope loading without duplicate request cycles;
- complete adjacent-item reorder updates;
- display-only support for the backend `rescheduled` item status;
- closed-term Auto-plan previews without closed-term mutations;
- exact backend validation-issue translations;
- typed preservation of allocation-level summary data;
- safe timetable-config hierarchy fallback; and
- timetable-slot discovery consistent with backend Auto-plan.

## Architecture

The current feature boundaries remain in place:

1. Lesson-plan backend DTOs describe the complete response contract.
2. Pure lesson-plan mappers convert DTOs into board-facing models.
3. The lesson-plan adapter remains responsible only for HTTP paths and payloads.
4. Lesson-plan hooks own loading, mutation orchestration, and reconciliation.
5. A timetable scope resolver owns exact config lookup and parent fallback.
6. Timetable entry discovery remains separate from config metadata resolution.

No page-level orchestration service or component rewrite will be introduced.

## Lesson-Plan Contract Changes

### Item status

Add `rescheduled` to `LessonPlanItemStatusDto` and `RESCHEDULED` to the UI item
status union. Map the backend value to `RESCHEDULED` instead of `UNKNOWN`.

`RESCHEDULED` is display-only and terminal. It exposes no start, complete, skip,
cancel, edit-status, or invented reschedule transition. Moving an item continues
to use `PATCH /academics/lesson-plans/items/:itemId/move` and does not itself
change status.

This decision intentionally supersedes the earlier
`2026-06-19-lesson-plans-item-contract-hardening-design.md` non-goal that kept
`rescheduled` mapped to `UNKNOWN`.

### Allocation summaries

Replace `byTeacherAllocation: unknown[]` with a DTO that mirrors the backend
allocation summary:

- `teacherSubjectAllocationId`;
- safe teacher summary;
- subject summary;
- classroom summary;
- planned, completed, and unplanned counts; and
- coverage percentage.

The mapped lesson-plan summary model preserves both aggregate totals and the
allocation breakdown. The current Lesson Plans page continues to render the
aggregate summary because its filters already select one operational teacher
allocation. No new breakdown UI is added.

### Validation issues

English and Arabic translations cover every issue code currently emitted by the
backend validation workflow:

- `missing_planned_lesson`;
- `missing_planned_date`;
- `holiday_planned_item`;
- `outside_term_item`; and
- `duplicate_planned_lesson`.

Unknown future codes continue to fall back to the backend message.

## Reorder Workflow

The backend reorder endpoint updates one item to one supplied `sortOrder`; it
does not shift neighboring items. A Move up or Move down action therefore swaps
the selected item and adjacent item's existing order values.

The frontend will:

1. derive the ordered item list from backend `sortOrder` values;
2. identify the selected item and its adjacent target;
3. mark both item IDs pending;
4. patch both affected items through the existing plan-scoped reorder endpoint;
5. refresh the owning lesson-plan detail after both requests settle; and
6. refresh summary and validation after successful reconciliation.

If either reorder request fails, the frontend still refreshes the lesson-plan
detail before displaying the mapped error. This prevents a partial backend
update from leaving stale optimistic state on screen. The frontend does not
claim atomicity because the backend has no bulk or transactional reorder route.

## Auto-Plan Readiness

Preview and Apply use separate readiness decisions.

### Open term

A user with `academics.lesson_plans.manage` may preview and apply when the
selected term, teacher allocation, classroom, curriculum, curriculum lessons,
and date range are ready.

### Closed term

A user with `academics.lesson_plans.manage` may open Auto-plan and submit
`dryRun: true`. Apply remains disabled and the frontend never sends
`dryRun: false`.

This matches the backend workflow, which checks term writability only for
non-dry-run Auto-plan commands. All other readiness requirements continue to
apply to closed-term previews.

The Auto-plan dialog receives separate `canPreview` and `canApply` values and
separate blocked reasons. The Apply action retains backend error handling in
case term state changes after the preview.

## Timetable Configuration Resolution

The backend config endpoint performs an exact lookup. The frontend supplies
inheritance by trying exact candidates from most specific to broadest:

1. `CLASSROOM`;
2. `SECTION`;
3. `GRADE`;
4. `TERM`.

Every request includes `academicYearId` and `termId`. Section candidates include
`gradeId` and `sectionId`. Classroom candidates include `gradeId`, `sectionId`,
and `classroomId` so the backend can reject inconsistent hierarchy selections.

Fallback continues only when an `ApiError` has the exact code
`academics.timetable.config_not_found`. A generic HTTP `404` is not sufficient:
the backend also uses `404` for invalid academic years, terms, hierarchy IDs,
and inconsistent ancestor/descendant selections. Permission, validation,
all other not-found responses, server, request-setup, and network errors stop
resolution and propagate to the caller.

The first successfully resolved config supplies metadata such as `activeDays`
and `weekStartDay`. A successfully resolved specific config overrides broader
config metadata even when it has no matching timetable entries.

Obsolete async responses are ignored when the selected lesson-plan scope changes.

## Timetable Slot Discovery

Config metadata does not own lesson-plan slot discovery. Backend Auto-plan finds
eligible timetable entries by `termId` and `teacherSubjectAllocationId` across
configs, excluding cancelled entries. Manual selection will follow the same
business rule through `GET /academics/timetable/all`.

The frontend adapter will model that endpoint's actual response contract:
`TimetableDashboardAllResponseDto` contains an `items` array grouped by
classroom, and each classroom item contains its applicable `configs`, `periods`,
and `entries`. It is not a flat entry-list response. For a classroom-scoped
request, slot discovery reads the matching classroom item's `entries`.

The frontend will:

1. request the timetable dashboard for the selected `termId` and `classroomId`;
2. select the response item whose `classroomId` matches the selected classroom;
3. exclude cancelled entries;
4. filter to the selected planned day; and
5. require an exact, non-null `teacherSubjectAllocationId` match.

Entries with a different or missing allocation ID are not selectable. The
lesson-plan create and move use cases validate this same allocation identity,
so a classroom/subject/teacher compatibility fallback would expose choices that
the backend rejects.

The resolved config still controls active-day presentation. If there is no
matching entry, the UI shows the existing no-slots state. If entry loading
fails, the UI shows an error state rather than treating the failure as an empty
schedule or falling back to a broader config.

## Request Stability

The existing lesson-plan loading repair remains part of this change. Main scope
loading must depend only on selected academic scope and stable explicit-query
refresh functions. Resolving the selected classroom or teacher allocation must
not recreate the main loader and repeat curriculum, allocation, weeks, plans,
summary, or validation requests.

## Error Handling

- Timetable config not found is the only hierarchy-fallback condition.
- Timetable entry request failures remain distinguishable from zero matching
  entries.
- Reorder failures reconcile the plan from the backend before reporting failure.
- Closed-term Apply remains protected by both frontend readiness and backend
  domain validation.
- Existing lesson-plan error mapping and trace-ID presentation remain unchanged.
- Unknown validation issue codes and unknown future statuses remain resilient
  through backend-message and `UNKNOWN` fallbacks.

## Testing

### Timetable resolution

- Candidate order is classroom, section, grade, then term.
- Candidate requests contain a consistent ancestor chain.
- Config-not-found responses continue to the next candidate.
- Generic `404` responses with any other error code propagate immediately.
- Other API and network errors propagate immediately.
- A successful specific config stops metadata fallback.
- Obsolete config responses cannot replace the current scope.

### Timetable slots

- Entries can be discovered across timetable configs for the selected
  term/classroom.
- The dashboard adapter preserves the grouped `items[].entries` response shape.
- Exact teacher-allocation matches are selectable.
- Entries with another allocation ID are rejected.
- Entries without an allocation ID are rejected.
- Cancelled and wrong-day entries are excluded.
- Request failure and empty-result states remain distinct.

### Lesson plans

- Adjacent reorder patches both affected items with swapped order values.
- Reorder refreshes plan detail after success and partial failure.
- Both items remain pending during reconciliation.
- `rescheduled` maps to `RESCHEDULED`, renders its translation, and exposes no
  lifecycle actions.
- Closed terms permit preview requests with `dryRun: true` and disable Apply.
- Open terms retain preview and Apply behavior.
- Allocation-level summary data survives DTO mapping.
- English and Arabic include every backend validation issue code.
- Selecting classroom and subject triggers one lesson-plan request set.

### Verification

Run:

- focused Lesson Plans tests;
- focused timetable component and service tests;
- translation contract tests;
- TypeScript typecheck;
- ESLint for changed files; and
- the broader relevant Vitest suite.

## Non-Goals

- Backend repository changes.
- New lesson-plan or timetable API routes.
- A bulk or transactional reorder contract.
- A new allocation-summary screen.
- New lifecycle transitions for `RESCHEDULED`.
- Rebuilding the Lesson Plans board, filters, or responsive layouts.
- Changing Auto-plan allocation, curriculum, holiday, or overwrite semantics.
