# Lesson Plans Item Contract Hardening Design

## Scope

Harden the existing Lesson Plans item UI against the current Moazez Backend contract at commit `8ddfaf4e11eea7c1596025c36ac58d9fd83722f7`. Keep the existing route, board, dialogs, responsive layout, service boundary, and backend-driven weeks.

## Verified backend contract

Item operations use these routes:

- `POST /academics/lesson-plans/:lessonPlanId/items`
- `PATCH /academics/lesson-plans/:lessonPlanId/items/:itemId`
- `PATCH /academics/lesson-plans/:lessonPlanId/items/:itemId/reorder`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/start`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/complete`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/skip`
- `POST /academics/lesson-plans/:lessonPlanId/items/:itemId/cancel`
- `DELETE /academics/lesson-plans/:lessonPlanId/items/:itemId`
- `PATCH /academics/lesson-plans/items/:itemId/move`

The existing frontend adapter paths and HTTP methods match these routes. Skip and cancel accept `{ note?: string | null }`. Reorder accepts `{ sortOrder: number }`. Move accepts optional `plannedDate`, `weekIndex`, `timetableEntryId`, and `sortOrder`. Delete returns `{ ok: true }`.

## Required corrections

### Status-aware actions

Expose only transitions accepted by the backend:

- `PLANNED`: start, complete, skip, cancel.
- `IN_PROGRESS`: complete, skip, cancel.
- `DONE`, `SKIPPED`, `CANCELLED`, `UNKNOWN`: no status transition actions.

Moving an item does not change its status. Although the database enum contains `RESCHEDULED`, it is not a supported UI status and remains mapped to `UNKNOWN` while preserving `rawStatus`.

### Response preservation

Preserve item response fields needed for resilient display and diagnostics:

- `unitTitle` and `lessonTitle`.
- nullable timetable, period, and planned-date metadata.
- lifecycle timestamps (`startedAt`, `completedAt`, `skippedAt`, `cancelledAt`).
- `createdAt` and `updatedAt`.

Type create, update, activate, and archive plan responses as lesson-plan detail responses because the backend returns the item collection for those operations.

### Resilient item rendering

Render the backend item title first, then the backend lesson title, then the current curriculum lesson title. An item must remain visible if the curriculum lookup no longer contains its lesson. Existing notes, status, planned date, period label, reorder, move, and delete behavior remains unchanged.

No new scheduling editor or workflow is introduced.

## Error and read-only behavior

Continue using the existing backend error mapper and translated UI messages. Invalid transitions should be prevented by the menu rather than intentionally sent to the backend. Closed terms, archived plans, and users without manage permission remain read-only.

## Tests

- Adapter contract tests cover every item route, HTTP method, and payload shape.
- Mapper tests verify metadata preservation and unknown/`rescheduled` fallback behavior.
- Item action tests cover the exact transition matrix.
- Component tests verify terminal statuses expose no transition actions and orphaned curriculum items still render using backend response titles.
- Run typecheck, lint, Lesson Plans tests, and the translation guard.

## Non-goals

- Adding `RESCHEDULED` to the supported UI status set.
- Calculating weeks locally.
- Bulk item operations.
- Comments, attachments, or publishing workflows.
- Rebuilding the Lesson Plans page.
