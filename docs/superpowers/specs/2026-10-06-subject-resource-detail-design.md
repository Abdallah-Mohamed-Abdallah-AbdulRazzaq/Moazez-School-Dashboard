# Subject Resource Detail Workspace Design

## Goal

Create a dedicated Subject Resource detail workspace inspired by Screen 9 while consuming the complete existing backend contract and preserving the application’s established styles, permissions, workflows, and shared UI components.

## Contract boundaries

The workspace uses the existing `AcademicContentDetail` aggregate and related workflow endpoints. It does not add or assume backend fields.

The aggregate supplies:

- title, rich-text description, audience, content status, archive state, and timestamps;
- publication identifier, publication status, publish time, and visibility window;
- academic targets;
- all assets with name, MIME type, size, order, and creation time;
- links and tags;
- Subject Resource category and curriculum, unit, and lesson references.

Existing focused endpoints supply audience preview, readiness, revisions, authenticated file downloads, file upload/unlink, lifecycle actions, and publication actions.

The design explicitly excludes “Created by” because the backend does not return it. It also excludes student-specific sharing because targets support school, stage, grade, section, and classroom scopes only.

## Architecture

The existing academic-content detail page selects a dedicated `SubjectResourceEditorView` when the aggregate type is `SUBJECT_RESOURCE`. The workspace reuses the current editor hook and its save, refresh, permission, publication, lifecycle, upload, readiness, and revision behavior.

The dedicated view is composed from focused units:

- resource header and permission-aware actions;
- metadata summary strip;
- embedded authenticated asset preview;
- asset selector and download fallback;
- resource information and curriculum panel;
- audience and academic-target panel;
- publication panel;
- tags and links panels;
- readiness and revision panels;
- focused inline editors or existing form components.

Shared UI components remain the default. A new component under `src/components/ui` is justified only for a reusable embedded authenticated-file preview that the existing modal cannot provide cleanly.

## Layout

The header contains the breadcrumb, Back to Resources action, title, rich-text description, status, Edit, Share, Download, and lifecycle actions. Actions appear only when the current permission and workflow state allow them.

A compact metadata strip shows resource category, audience, resolved academic-target summary, primary file type, and publication/content status. It never fabricates subject or grade fields when targets do not contain them.

The main desktop area uses a dominant preview column and a context rail. The rail contains resource information, sharing and targets, publication details, tags, curriculum references, links, readiness, and revision history. Secondary panels may collapse or open focused drawers to keep the preview visually dominant.

On smaller screens, the preview appears before the context panels. Attachments use a horizontally scrollable selector, action groups collapse when necessary, and tabular content remains horizontally scrollable.

## Asset preview

Assets are ordered by `sortOrder`. The first compatible asset is selected automatically. When the aggregate refreshes, the current selection is retained if that asset still exists. Selecting another asset changes only the preview; it does not refetch the aggregate.

Inline preview support is:

- PDF through the authenticated blob URL and browser PDF renderer;
- JPG, PNG, WebP, and GIF as contained images;
- MP4 and WebM through native video controls;
- MP3, M4A, WAV, OGG, and audio WebM through native audio controls;
- TXT through a safe read-only text viewer;
- CSV through a bounded read-only table preview.

DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, and 7Z use a polished file-information fallback with authenticated download/open actions. True Office rendering is outside scope because private authenticated blobs cannot be passed safely to public third-party viewers and the backend has no conversion endpoint.

Preview failures are isolated from the page. Access denial, unsupported type, malformed text/CSV, and size limits produce an actionable fallback rather than replacing the full workspace.

## Full-contract interaction mapping

- Edit metadata updates title, description, and audience through the existing metadata endpoint.
- Resource information updates category and curriculum references through the Subject Resource detail endpoint.
- Share edits audience and academic targets. It does not call a nonexistent sharing endpoint.
- Tags and links use their existing replacement endpoints.
- Files use the existing resumable upload, authenticated download, and unlink flows.
- Publication uses the existing publish, schedule, unschedule, cancel, and start-revision behavior.
- Lifecycle actions use existing archive, restore, and delete behavior.
- Readiness displays all returned blocking reasons and supports refresh.
- Revision history and revision details reuse the existing revision components.
- Audience preview is loaded only when its panel is opened or explicitly refreshed.

Published content follows the existing revision workflow and is not silently mutated outside the backend’s state rules.

## Permissions

Users with view access may inspect the aggregate and preview or download files when file-download permission allows it. Academic-content manage permission controls metadata, resource detail, targets, tags, links, uploads, unlinking, and lifecycle mutations. Academic-content publish permission controls publication mutations.

Controls are hidden or disabled consistently with existing application behavior. IDs required for operations remain internal and are not shown as user-facing information.

## Accessibility and UX

The implementation uses the existing MOAZEZ design tokens and shared UI controls. Interactive elements have accessible names, pointer and keyboard behavior, stable hover feedback, and visible focus states. Loading and error changes use appropriate live-status semantics. Native media controls provide accessible audio and video operation. State is never communicated by color alone, and motion respects reduced-motion preferences.

## Error handling

The aggregate retains the existing page-level loading and failure behavior. Preview, audience preview, readiness, publication, file operations, and revision history handle failures independently with local retry paths. Backend errors remain visible and are not replaced with mock or inferred data.

## Testing and verification

Focused tests cover:

- selection of the dedicated workspace for `SUBJECT_RESOURCE`;
- mapping of every aggregate area to the correct panel;
- initial asset selection and switching without aggregate refetch;
- PDF, image, video, audio, TXT, and CSV preview routing;
- unsupported/Office/archive fallback and authenticated download;
- audience/target Share behavior;
- manage, publish, and download permissions;
- published revision rules;
- missing assets, access denial, preview failures, and malformed preview content;
- English and Arabic translation parity;
- accessible labels and responsive component structure.

Production changes receive the clean-code review. Test changes receive the test-quality review. Verification is limited to focused tests, scoped lint, type checking, and diff validation unless the user separately approves the full test suite.
