# Curriculum Backend Alignment Design

## Goal

Align the dashboard curriculum experience with the backend contract at `Moazez-Backend` commit `d46b19e`, limited to curricula, units, lessons, and lesson content. The backend is the source of truth. Mock-only or unsupported curriculum behavior will be removed or disabled rather than emulated.

Homework assignments are outside this change. Their files, endpoints, and behavior remain untouched.

## Contract boundary

The frontend will support these backend routes under `/academics/curriculum`:

- `GET /` lists curricula with optional `academicYearId`, `termId`, `gradeId`, `subjectId`, `status`, and `search` query parameters.
- `POST /` creates a curriculum.
- `GET /:curriculumId`, `PATCH /:curriculumId`, and `DELETE /:curriculumId` read, update, and soft-delete a curriculum.
- `POST /:curriculumId/activate` and `POST /:curriculumId/archive` perform lifecycle transitions.
- `POST /:curriculumId/units`, `PATCH /:curriculumId/units/:unitId`, `PATCH /:curriculumId/units/:unitId/reorder`, and `DELETE /:curriculumId/units/:unitId` manage units.
- `POST /:curriculumId/units/:unitId/lessons`, `PATCH /:curriculumId/units/:unitId/lessons/:lessonId`, `PATCH /:curriculumId/units/:unitId/lessons/:lessonId/reorder`, and `DELETE /:curriculumId/units/:unitId/lessons/:lessonId` manage lessons.
- Nested `/content` routes list, create, read, update, reorder, and soft-delete lesson content items.

All read routes require `academics.curriculum.view`. All write and lifecycle routes require `academics.curriculum.manage`.

## Frontend architecture

The curriculum service will use explicit backend request and response types instead of exposing the current in-memory mock shape. The API adapter will own transport details, request construction, envelope normalization, and nested route construction. Small pure mappers will convert backend DTOs to focused UI models only where the component layer needs a presentation-friendly name.

`GET /academics/curriculum` returns `{ items }`. The page will select the matching curriculum from that response, then request `GET /academics/curriculum/:curriculumId` for the authoritative detail tree. The detail response is the only source for units and lessons; nonexistent standalone unit and lesson list endpoints will not be called.

Mutation functions will receive the full hierarchy required by the backend route. Unit operations receive `curriculumId`; lesson operations receive `curriculumId` and `unitId`; content operations receive `curriculumId`, `unitId`, and `lessonId`. This removes implicit ID lookups and prevents construction of invalid shortened paths.

## Supported data model

A curriculum exposes its four scope IDs, `title`, nullable `description`, lifecycle `status`, timestamps, scope summaries, counts, and detailed units. Creation sends `academicYearId`, `termId`, `gradeId`, `subjectId`, and `title`, with an optional description. Updates send only title and description.

A unit uses `title`, nullable `description`, zero-based `sortOrder`, and nullable `estimatedLessons` from 0 through 200. Its response includes nested lessons and `lessonCount`.

A lesson uses `title`, nullable `description`, up to 20 string objectives, zero-based `sortOrder`, and nullable `estimatedMinutes` from 1 through 600. The frontend will not synthesize planned-week or completion state because those fields and mutations do not exist in the curriculum backend contract.

The frontend's canonical lesson-content type and every create or update request use the Prisma enum casing:

- `TEXT` requires `bodyText` and rejects URL and file values.
- `FILE` requires an existing `fileId` and rejects URL values. The frontend will not enable FILE content creation unless a supported existing file picker or upload flow returns a backend `fileId`; if no such flow exists in this dashboard, FILE is shown disabled with explanatory help text.
- `VIDEO_LINK` and `EXTERNAL_LINK` require an HTTP or HTTPS URL and reject file values.

The current backend presenter serializes response types as `text`, `file`, `video_link`, and `external_link`. The response mapper must normalize those values to the uppercase canonical frontend type before data reaches components.

Backend curriculum status filters use the Prisma enum casing `DRAFT`, `ACTIVE`, and `ARCHIVED`. The frontend may derive lowercase display values for UI comparisons, but requests to the backend must preserve the uppercase enum casing. Unknown backend status values must not silently become draft; they should be displayed as unknown or surfaced as an error state.

Every content item also supports `title`, zero-based `sortOrder`, `isRequired`, nullable `estimatedMinutes` from 1 through 600, and optional metadata. Type changes clear fields that are invalid for the new type.

## UI behavior and lifecycle

The page keeps the academic-year and term context and grade and subject selectors. Requests include all four scope filters. Backend `status` and `search` filters may be exposed only where the existing UI has a clear control for them; if `status` is sent, it uses `DRAFT`, `ACTIVE`, or `ARCHIVED`. These filters are not required to locate the current scoped curriculum.

Creating a curriculum requires a non-empty title and all four scope IDs. The existing bilingual-only editor fields will be replaced by the backend's single `title` and `description` values. Unit and lesson editors follow the same single-title contract.

Draft curricula can be activated only after at least one non-deleted unit and one non-deleted lesson exist. Any non-archived curriculum can be archived. Archived curricula are read-only. A closed term remains read-only in the dashboard, and users lacking the manage permission receive the same read-only presentation. The page-level view guard continues to require the view permission.

The page and component access logic will be explicit:

```tsx
<AcademicsPermissionGuard permission="academics.curriculum.view">
  <CurriculumPageContent />
</AcademicsPermissionGuard>
```

```ts
const canViewCurriculum = hasPermission("academics.curriculum.view");
const canManageCurriculum = hasPermission("academics.curriculum.manage");

const isArchived = curriculum?.status === "archived";
const isClosedTerm = termStatus === "closed";
const isReadOnly = !canManageCurriculum || isArchived || isClosedTerm;

const canMutate = canViewCurriculum && !isReadOnly;
const canActivate =
  canMutate &&
  curriculum?.status === "draft" &&
  curriculum.unitCount > 0 &&
  curriculum.lessonCount > 0;
const canArchive = canMutate && curriculum != null;
```

The route guard blocks users without view permission. Components render mutation controls only when `canMutate` is true, use `canActivate` for the activation action, and use `canArchive` for the archive action. Event handlers repeat the same guards before issuing requests so disabled or hidden controls are not the only enforcement layer. The backend remains authoritative and independently enforces both permissions and lifecycle constraints.

Unsupported curriculum features will be removed from the reachable UI and service interface:

- curriculum carry-over;
- planned-week scheduling;
- mark-done and undo-done actions;
- dedicated attachment and video endpoints that are not part of the nested lesson-content contract;
- standalone unit and lesson list endpoints;
- bulk reorder requests that send arrays of IDs.

Reordering remains supported through one backend `PATCH .../reorder` request per moved node with its target `sortOrder`. The UI will refresh curriculum detail after successful mutations so counts and ordering come from the server.

## Errors

The transport layer will preserve `ApiError` status, domain code, validation details, and trace ID. Curriculum errors will map to localized, actionable messages for:

- `academics.curriculum.not_found`;
- `academics.curriculum.duplicate`;
- `academics.curriculum.invalid_scope`;
- `academics.curriculum.read_only`;
- `academics.curriculum.activation_incomplete`;
- `academics.curriculum.unit_not_found`;
- `academics.curriculum.lesson_not_found`;
- `academics.curriculum.invalid_reorder`;
- `academics.lesson_content.not_found`;
- `academics.lesson_content.invalid_scope`;
- `academics.lesson_content.invalid_type_payload`;
- `academics.lesson_content.invalid_url`;
- `academics.lesson_content.file_not_found`;
- `academics.lesson_content.read_only`.

An empty list response for the selected scope means no curriculum exists and shows the create state. A failed list or detail request is an error state with retry. Permission failures show access-denied or read-only behavior according to the missing permission. Mutation failures keep the editor open, retain entered values, and show the mapped message. Trace IDs are displayed as technical context when present.

## Testing

Adapter tests will assert each supported HTTP method, exact nested URL, query string, request body, and response mapping. They will also prove that an empty `{ items: [] }` response becomes the no-curriculum state without hiding genuine request failures.

Mapper and error tests will cover lifecycle statuses, nested units and lessons, all four content types, each known domain code, validation details, and trace IDs.

Component tests will cover view and manage permissions, closed-term and archived read-only states, draft activation readiness, archive actions, retention of form data after errors, and the absence of unsupported controls. Existing tests that encode mock-only routes or fields will be replaced rather than preserved.

Verification will run the focused Vitest suites, TypeScript checking, linting for touched files, and the production build when repository-wide baseline failures do not prevent it. Any unrelated baseline failure will be reported separately from curriculum regressions.

## Out of scope

- Homework assignments, questions, assignment attachments, and grading.
- Backend changes.
- New file-upload infrastructure; file content selects an existing backend `fileId` through whatever supported file picker already exists.
- Unrelated academics modules or broad visual redesign.
