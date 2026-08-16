# Admin Homework Assignment Management Design

## Scope

Build the admin/core homework assignment management slice from `docs/homework_api_documentation.md`.

The feature lives at `src/features/academics/homework` and uses these routes:

- `/[lang]/academics/homework`
- `/[lang]/academics/homework/new`
- `/[lang]/academics/homework/[homeworkId]`

Because these pages need the shared academics year/term context bar, their Next.js
route files must live under the existing hidden route group:

```text
src/app/[lang]/(dashboard)/academics/(with-context)/homework/page.tsx
src/app/[lang]/(dashboard)/academics/(with-context)/homework/new/page.tsx
src/app/[lang]/(dashboard)/academics/(with-context)/homework/[homeworkId]/page.tsx
```

The browser URLs remain `/en/academics/homework` and `/ar/academics/homework`
because route groups are hidden from the URL.

The first implementation includes:

- Listing homework assignments with admin filters.
- Creating a draft homework assignment.
- Editing draft assignment metadata.
- Reusing the existing assignment/question builder experience for homework questions.
- Managing assignment questions, options, and assignment attachments.
- Listing and resolving assignment targets.
- Publishing, closing, and cancelling assignments.

The first implementation excludes:

- Teacher app routes under `/teacher/homeworks`.
- Student app routes under `/student/homeworks`.
- Parent app routes under `/parent/children/:studentId/homeworks`.
- Submission review screens.
- Grade sync screens.

## Architecture

Create a self-contained academic sub-feature:

```text
src/features/academics/homework/
  components/
  hooks/
  pages/
  services/
    __tests__/
    homeworkApi.types.ts
    homeworkApiAdapter.ts
    homeworkErrors.ts
    homeworkMappers.ts
    homeworkService.ts
  types/
  utils/
```

The homework feature owns its backend contract. It must not restore the disabled curriculum assignment service functions. The existing curriculum assignment builder is a UI source to reuse, while homework gets its own service, DTO, mapper, and route boundaries.

The service layer follows existing academic feature patterns:

- `homeworkApi.types.ts` defines backend DTOs, enums, request payloads, and paginated envelopes.
- `homeworkApiAdapter.ts` calls the backend with `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`.
- `homeworkMappers.ts` maps backend DTOs to UI models and UI drafts back to backend payloads.
- `homeworkService.ts` exports public feature functions and supports an adapter setter/resetter for tests.
- `homeworkErrors.ts` maps domain error codes to stable UI error keys.

The mapper layer is mandatory. Existing assignment builder components use
curriculum-style fields such as `titleAr`, `titleEn`, `descriptionAr`,
`descriptionEn`, `dueDate`, `maxScore`, `expectedTimeMinutes`, and
`isPublished`. The homework backend uses `title`, `description`, `dueAt`,
`totalMarks`, `estimatedMinutes`, `isGraded`, and lifecycle `status`.

Required mapper directions:

- `BackendHomeworkAssignmentDto` to `HomeworkAssignmentUiModel`
- `HomeworkAssignmentUiDraft` to `UpdateHomeworkAssignmentRequest`
- `HomeworkQuestionDto` to `BuilderQuestionUiModel`
- `BuilderQuestionUiModel` to homework question create/update payloads

## Routes And Pages

`/[lang]/academics/homework` renders an admin list page guarded by `homework.assignments.view`.

The list page supports these filters where the backend supports them:

- `academicYearId`
- `termId`
- `classroomId`
- `teacherUserId`
- `teacherSubjectAllocationId`
- `status`
- `mode`
- `dueFrom`
- `dueTo`
- `search`
- `page`
- `limit`

The shared academics context bar provides year and term through route query state. The page passes those values into the homework list filter set.

`/[lang]/academics/homework/new` renders a create page guarded by `homework.assignments.manage`.

The create page collects the required backend fields:

- academic year
- term
- teacher subject allocation
- title
- target mode
- due date/time

It also supports useful optional fields at creation time:

- description
- mode
- selected student IDs when target mode requires them
- publish date/time
- estimated minutes
- total marks
- graded flag

After successful creation, it redirects to `/{lang}/academics/homework/{homeworkId}` with the active query context preserved.

`/[lang]/academics/homework/[homeworkId]` renders the builder/edit page guarded by `homework.assignments.view`. Mutating actions require `homework.assignments.manage`; otherwise the page is read-only.

Add a sidebar entry under the existing academics navigation in
`src/config/navigation.ts`, near Curriculum and Lesson Plans:

```ts
{
  key: "academics-homework",
  label_en: "Homework",
  label_ar: "الواجبات",
  href_en: "/en/academics/homework",
  href_ar: "/ar/academics/homework",
  icon: ClipboardList,
}
```

Add the corresponding navigation permission mapping in `src/hooks/usePermissions.ts`:

```ts
"academics-homework": "homework.assignments.view"
```

## Builder Reuse

Reuse the existing assignment builder interaction model instead of creating a second question editor from scratch.

Do not import or reuse `AssignmentBuilderPage` directly. That page is coupled to
curriculum concerns including `lessonId`, `useAssignmentData`,
`useAssignmentMutations`, and `curriculumService`.

Create a homework-specific `HomeworkAssignmentBuilderPage` that reuses
presentational components where their props remain compatible:

- `BuilderHeader`
- `DesktopLayout`
- `MobileLayout`
- `QuestionsOutline`
- `QuestionEditor`
- `AttachmentsPanel`

Replace the curriculum data layer and route assumptions with homework-specific
hooks, services, and `homeworkId` context.

The homework builder should use homework-specific hooks:

- `useHomeworkAssignmentData`
- `useHomeworkAssignmentMutations`
- `useHomeworkQuestionDraft`
- `useHomeworkAttachments`
- `useHomeworkTargets`

The hooks adapt homework data into the UI shape expected by the existing builder components. This keeps backend field names and enum casing inside the homework service/mappers, not scattered through UI components.

Required builder capabilities:

- Load assignment details.
- Load questions.
- Load assignment attachments.
- Save assignment metadata.
- Add, update, reorder, and delete questions.
- Add, update, reorder, and delete question options.
- Add, update, reorder, and delete assignment attachments.
- Publish, close, and cancel the assignment.
- Show read-only state for closed academic terms and users without manage permission.

The builder should preserve existing dirty-state and unsaved-change guard behavior where practical.

Do not implement a publish toggle. Homework lifecycle actions use dedicated
backend endpoints, so the mutation hook should expose explicit functions:

- `publishHomeworkAssignment(homeworkId)`
- `closeHomeworkAssignment(homeworkId)`
- `cancelHomeworkAssignment(homeworkId)`

## Data Flow

List flow:

1. Read year/term from the academics context route state.
2. Combine route filters and local page filters.
3. Call `listHomeworkAssignments`.
4. Render paginated rows with status, mode, teacher/allocation, classroom, due date, question count, attachment count, and counters when present.

Create flow:

1. User fills metadata form.
2. Client validates required fields and obvious numeric/date constraints.
3. Call `createHomeworkAssignment`.
4. Redirect to the edit route for the returned assignment id.

The create route must be a real metadata form. It must not auto-create a draft
on load like the old curriculum assignment builder flow. Homework creation
requires backend context before the draft can exist.

Minimum create payload fields:

- `academicYearId`
- `termId`
- `teacherSubjectAllocationId`
- `title`
- `targetMode`
- `dueAt`

After creation, preserve the active academics query context in the redirect:

```text
/{lang}/academics/homework/{homeworkId}?year=...&term=...&status=...
```

Edit flow:

1. Load assignment detail, questions, attachments, and targets.
2. Keep local assignment and selected-question drafts.
3. Save assignment metadata with `PATCH /homework/assignments/:homeworkId`.
4. Save question changes through the nested homework question endpoints.
5. Save attachment changes through the nested homework attachment endpoints.
6. Resolve targets on demand with `POST /homework/assignments/:homeworkId/targets/resolve`.
7. Publish, close, or cancel through the dedicated action endpoints.

Attachment flow must not assume that
`POST /homework/assignments/:homeworkId/attachments` accepts raw multipart file
uploads. The implementation must choose one of these verified paths:

- Link an already-uploaded file id if the homework attachment endpoint expects a file reference.
- Upload the file through the existing files/upload service first, then call the homework attachment endpoint with the returned file reference.

Raw multipart upload directly to the homework attachment endpoint is out of
scope unless the backend contract explicitly confirms it.

## API Coverage

Implement admin/core endpoints only:

- `GET /homework/assignments`
- `POST /homework/assignments`
- `GET /homework/assignments/:homeworkId`
- `PATCH /homework/assignments/:homeworkId`
- `POST /homework/assignments/:homeworkId/publish`
- `POST /homework/assignments/:homeworkId/close`
- `POST /homework/assignments/:homeworkId/cancel`
- `GET /homework/assignments/:homeworkId/targets`
- `POST /homework/assignments/:homeworkId/targets/resolve`
- `GET /homework/assignments/:homeworkId/questions`
- `POST /homework/assignments/:homeworkId/questions`
- `GET /homework/assignments/:homeworkId/questions/:questionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/reorder`
- `DELETE /homework/assignments/:homeworkId/questions/:questionId`
- `POST /homework/assignments/:homeworkId/questions/:questionId/options`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/options/:optionId`
- `PATCH /homework/assignments/:homeworkId/questions/:questionId/options/:optionId/reorder`
- `DELETE /homework/assignments/:homeworkId/questions/:questionId/options/:optionId`
- `GET /homework/assignments/:homeworkId/attachments`
- `POST /homework/assignments/:homeworkId/attachments`
- `PATCH /homework/assignments/:homeworkId/attachments/:attachmentId`
- `PATCH /homework/assignments/:homeworkId/attachments/:attachmentId/reorder`
- `DELETE /homework/assignments/:homeworkId/attachments/:attachmentId`

Submission review content endpoints and grade sync endpoints are intentionally deferred.

## Error Handling

The service layer maps the backend error envelope to stable UI error keys. Known homework domain codes include:

- `homework.assignment.not_found`
- `homework.assignment.not_mutable`
- `homework.assignment.not_publishable`
- `homework.assignment.already_published`
- `homework.assignment.already_closed`
- `homework.assignment.cancelled`
- `homework.assignment.schedule_mismatch`
- `homework.assignment.allocation_mismatch`
- `homework.assignment.due_date_invalid`
- `homework.assignment.target_required`
- `homework.assignment.no_eligible_targets`
- `homework.assignment.target_conflict`
- `homework.assignment.validation_failed`

Validation errors should preserve the backend message when a field-level mapping is not available. Unknown errors fall back to a generic load/save/action failure message.

## Permissions

The list route requires `homework.assignments.view`.

The create route requires `homework.assignments.manage`.

The edit route requires `homework.assignments.view`, but all mutation controls are disabled unless the user has `homework.assignments.manage`.

Targets use:

- view: `homework.targets.view`
- resolve: `homework.targets.manage`

Update the frontend `PermissionKey` union in `src/hooks/usePermissions.ts` to
include the full homework seed permission set used by the backend:

- `homework.assignments.view`
- `homework.assignments.manage`
- `homework.targets.view`
- `homework.targets.manage`
- `homework.submissions.view`

`homework.submissions.view` is added for permission-model alignment even though
submission review UI is deferred.

Closed academic terms force read-only behavior even when the user has manage permission.

## Assignment Lifecycle UX

The frontend follows the backend lifecycle exactly:

- `DRAFT` may transition to `PUBLISHED` or `CANCELLED`.
- `PUBLISHED` may transition to `CLOSED` or `CANCELLED`.
- `CLOSED` and `CANCELLED` are terminal.
- Only `DRAFT` assignments are editable.

The backend enum includes `ARCHIVED`, but Core exposes no archive transition
endpoint. The frontend must not render an Archive option, button, menu item, or
archive API call. If an archived assignment is returned by a list or detail
response, display its status and treat it as terminal and read-only.

Define one homework lifecycle policy helper used by both list and builder UIs.
It returns the valid actions for a normalized assignment status and whether the
assignment is editable. This prevents the two pages from exposing different or
backend-invalid transitions.

### Builder

The builder renders only actions valid for the current status. Draft homework
shows Publish and Cancel. Published homework shows Close and Cancel. Closed,
cancelled, and archived homework show no lifecycle actions.

Publishing is blocked while assignment details, questions, question additions
or deletions, or question ordering contain unsaved changes. The UI tells the
user to save before publishing; it does not auto-save.

Add a Reset command beside Save. Reset is enabled only while the builder is
dirty and requires confirmation. Confirmation restores assignment details,
questions, additions, deletions, selection, and ordering to the last
server-loaded or successfully saved state. Publish, Close, and Cancel also
require confirmation.

### Homework List

Each assignment row has a three-dot actions menu. The menu contains only valid
lifecycle actions for that row and never contains Archive. Lifecycle menu clicks
must not trigger row navigation. Confirm each action, disable that row's menu
while the request is running, and replace the row with the assignment returned
by the lifecycle endpoint after success.

Users without `homework.assignments.manage` see statuses but no lifecycle menu.
Closed academic terms also suppress lifecycle actions.

## Testing

Add focused tests for:

- API adapter endpoint paths, methods, params, and payloads.
- Mapper conversions for enum casing, dates, title/description fields, marks, counters, targets, questions, options, and attachments.
- Error mapping for known homework assignment error codes.
- Route placement under `academics/(with-context)` for the shared context bar.
- Navigation permission mapping for `academics-homework`.
- Create flow redirect behavior.
- Edit flow read-only behavior when the term is closed or manage permission is missing.
- Publish action behavior through the dedicated lifecycle endpoint.
- Lifecycle policy results for draft, published, closed, cancelled, and archived statuses.
- Published, closed, cancelled, and archived builder read-only behavior.
- Dirty draft publish blocking and full reset to the last saved state.
- List quick-action visibility, click isolation, confirmation, pending state, and row replacement.

Do not add broad snapshot tests. Prefer deterministic service, mapper, and narrow component/hook tests.

## Implementation Notes

### Homework Assignment Detail Inputs

The homework builder displays one Title input and one Description textarea. These
fields accept either Arabic or English content and map directly to the backend
`title` and `description` properties.

Reuse `AssignmentSettingsPanel` with an explicit homework single-language mode.
In that mode, the panel updates both legacy localized fields in the shared
curriculum UI model with the same value so existing shared layout types remain
compatible. `mapBuilderAssignmentToHomeworkUpdate` then emits one backend
`title` and one backend `description` value. Homework validation requires only
the single title value and reports one title error.

The default panel mode remains bilingual. Existing curriculum assignment pages,
validation, and API payloads must remain unchanged.

Keep changes scoped to the homework feature, route registration, required
navigation/sidebar entry, permission union and navigation permission mapping,
translations, and tests.

Avoid refactoring grades or curriculum builder internals unless a minimal prop/interface adjustment is required to reuse them cleanly.

The existing curriculum assignment service functions remain unsupported for curriculum. Homework should use the backend contract documented in `docs/homework_api_documentation.md`.
