# Lesson Plans Backend Integration Design

**Backend authority:** `Moazez-Backend` commit `dc9a73cfa9d9158688de24597288f0ffe7657d2d`

## Goal

Connect the existing Lesson Plans page to the production lesson-plan API without rebuilding its route, board, filters, dialogs, or responsive layouts. Production code must use allocation-, curriculum-, plan-, and item-based identifiers rather than section-scoped mock operations.

## Architecture

The feature will have three boundaries:

1. Exact backend DTO and request types mirror the NestJS DTOs and presenters.
2. Pure mappers convert backend responses into UI models required by the existing weekly board.
3. A route-accurate adapter uses `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`; the service exports this adapter as the production default.

Hooks will resolve the selected `teacherSubjectAllocationId`, load backend weeks/plans/summary, and pass `lessonPlanId` and `itemId` to mutations. Existing components remain presentation-focused.

## Backend Contract

The frontend base path is `/academics/lesson-plans`.

### Lesson plans

- `GET /academics/lesson-plans`
- `POST /academics/lesson-plans`
- `GET /academics/lesson-plans/:lessonPlanId`
- `PATCH /academics/lesson-plans/:lessonPlanId`
- `POST /academics/lesson-plans/:lessonPlanId/activate`
- `POST /academics/lesson-plans/:lessonPlanId/archive`
- `DELETE /academics/lesson-plans/:lessonPlanId`

List responses are `{ items: LessonPlanResponseDto[] }`. Detail responses add `items: LessonPlanItemResponseDto[]`. Delete responses are `{ ok: true }`.

A lesson plan response contains IDs for academic year, term, teacher subject allocation, teacher, classroom, subject, and curriculum; title and nullable description; lowercase status; week start/end dates; lifecycle timestamps; related academic-year, term, teacher, classroom, subject, and curriculum summaries; and `itemCount`.

### Workflow

- `GET /academics/lesson-plans/weeks`
- `GET /academics/lesson-plans/summary`
- `GET /academics/lesson-plans/validation`
- `POST /academics/lesson-plans/auto-plan`
- `PATCH /academics/lesson-plans/items/:itemId/move`

Weeks responses contain `termId`, `academicYearId`, and buckets with `weekIndex`, `startsAt`, `endsAt`, instructional dates, holiday dates, and planned-item counts.

Summary responses contain overall plan/item/planned/completed/unplanned counts and coverage percentage plus allocation-level teacher, subject, classroom, and coverage summaries.

Validation responses contain checked/missing/holiday/outside-term/duplicate counts and issues with code, severity, message, and optional lesson, item, or allocation IDs.

Auto-plan responses contain scope IDs, `dryRun`, candidate/slot/proposed/created/skipped counts, and item proposals/results.

### Items

- `POST /academics/lesson-plans/:lessonPlanId/items`
- `PATCH /academics/lesson-plans/:lessonPlanId/items/:itemId`
- `PATCH /academics/lesson-plans/:lessonPlanId/items/:itemId/reorder`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/start`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/complete`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/skip`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/cancel`
- `DELETE /academics/lesson-plans/:lessonPlanId/items/:itemId`

Item responses contain plan/curriculum/unit/lesson IDs, unit and lesson titles, timetable/date/day/period fields, title, nullable notes, lowercase status, `sortOrder`, lifecycle timestamps, and audit timestamps. Item delete responses are `{ ok: true }`.

## Mapping Rules

- Prefer `lessonPlanId`, falling back to `id`, for the UI plan ID.
- Prefer `itemId`, falling back to `id`, for the UI item ID.
- Preserve backend lowercase plan and item status as `rawStatus`.
- Convert item status to the existing uppercase board status only at the UI boundary.
- Map `sortOrder` to the board's `order` field.
- Map week `startsAt`/`endsAt` directly into `WeekInfo` dates.
- Assign items to week buckets from `plannedDate` within backend week ranges. A plan's `weekStartDate` is a fallback only when an item has no planned date.
- Keep `notes` as the canonical backend field. Existing bilingual notes UI may combine or migrate its draft values, but it must not call a dedicated notes endpoint.
- Do not synthesize sections, weeks, summaries, or coverage.

## UI and Mutation Integration

The selected teacher subject allocation is the operational scope. Filters may continue displaying grade, section, classroom, subject, and teacher choices, but API calls use the allocation ID derived from those selections.

- Add lesson: create an item under its owning lesson plan. If the target week has no plan, create the lesson plan first with the selected allocation and curriculum.
- Edit notes or scheduling fields: patch the plan-scoped item.
- Move between weeks: call the global item move endpoint.
- Reorder within a plan: patch each affected item individually with `sortOrder`; there is no bulk reorder endpoint.
- Status actions: use start, complete, skip, or cancel endpoints. Skip/cancel accept an optional note.
- Remove item: call the plan-scoped item delete endpoint.
- Auto-plan: send only the documented allocation/date/overwrite/dry-run payload.

Unsupported comments, attachments, bulk item creation, bulk reorder, and publishing actions will not be added.

## Permissions and Read-Only Rules

- Page read access requires `academics.lesson_plans.view`.
- Mutations require `academics.lesson_plans.manage`.
- Closed terms are read-only.
- Archived lesson plans are read-only.
- Existing access guards remain responsible for avoiding unauthorized-content flashes.

## Error Handling

Map these verified backend codes to user-facing messages while preserving details and trace IDs:

- `academics.lesson_plan.not_found`
- `academics.lesson_plan.duplicate`
- `academics.lesson_plan.invalid_scope`
- `academics.lesson_plan.closed_term`
- `academics.lesson_plan.invalid_date_range`
- `academics.lesson_plan.holiday_date`
- `academics.lesson_plan.auto_plan_no_curriculum`
- `academics.lesson_plan.auto_plan_no_slots`
- `academics.lesson_plan.invalid_timetable_entry`
- `academics.lesson_plan.read_only`
- `academics.lesson_plan.invalid_transition`
- `academics.lesson_plan.item_not_found`
- `academics.lesson_plan.invalid_item_scope`
- `academics.lesson_plan.item_invalid_transition`

## Testing

Tests will cover DTO mapping, lowercase-to-board status conversion, week bucketing, query serialization, every supported route and HTTP method, omission of unsupported routes, the real-adapter default, permission/read-only behavior, plan creation before first item creation, item movement/reordering, status endpoint selection, and backend error mapping.

## Non-Goals

- Rebuilding the Lesson Plans page or board.
- Inventing section-based lesson-plan APIs.
- Retaining mock data in the production path.
- Adding comments, attachments, bulk operations, or publication workflows.
