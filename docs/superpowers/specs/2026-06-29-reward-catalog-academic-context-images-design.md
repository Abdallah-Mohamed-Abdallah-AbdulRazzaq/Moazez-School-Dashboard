# Reward Catalog Academic Context and Images Design

## Goal

Align the Reward Catalog page with the backend academic-scope and file contracts. Catalog list and summary requests use the active academic context, the table exposes synchronized academic-year and term filters, and catalog forms support scoped or global rewards with an uploaded image.

## Academic Context

The reinforcement route group is wrapped with the existing `AcademicsContextLayout`. It uses `academicYearId` and `termId` as its URL parameter keys so the visible context bar and reinforcement pages share the same identifiers.

The context always resolves an active academic year and term when options exist. The Reward Catalog page therefore treats its academic filters as context selectors, not independent optional filters. The page initializes from the context and sends the selected `academicYearId` and `termId` to both `GET /reinforcement/rewards/catalog` and `GET /reinforcement/rewards/catalog-summary`.

Changing the academic year uses the context change API, reloads terms for that year, selects the preferred term, resets catalog pagination, and reloads the list and summary. Changing the term follows the same context path and resets pagination. The table filters do not offer an "all periods" value because it would contradict the active context displayed above the page.

## Form Scope

The create and edit forms include academic-year and term selectors. Creating a reward defaults both selectors to the active context. Editing a reward uses the scope stored on the item rather than replacing it with the current page context.

The backend allows `academicYearId` and `termId` to be null, so the form also supports a global reward. Selecting global scope clears and disables both selectors and submits both fields as `null`. For scoped rewards, selecting a year reloads its term options and clears any term that does not belong to the new year. A term is never submitted without an academic year.

Academic option loading is isolated from catalog loading. A failure to load form term options shows a localized field error and leaves the catalog table and other form values available.

## File Contract

The form uploads reward images with `POST /files` as multipart form data using the `file` field. The returned file ID becomes `imageFileId` in the catalog create or update payload. To match the backend file constraints, the image control accepts JPEG and PNG files up to 10 MB, validates both constraints before upload, and exposes uploading, preview, replace, remove, and retry states.

The backend protects upload with `files.uploads.manage` and download with `files.downloads.view`. The frontend checks these permissions independently from Reward Catalog permissions. Without upload permission, it hides upload and replace controls while preserving the rest of the catalog form. Without download permission, it does not request protected image blobs and renders the localized unavailable placeholder. Removing an existing catalog image remains a catalog update and follows the existing reward-catalog manage permission.

The backend create and update DTOs accept `imageFileId: string | null`. Replacing an image submits the new ID. Removing an existing image submits `imageFileId: null`. Leaving the image unchanged during edit preserves its existing ID.

The frontend transport types model nullable academic IDs and `imageFileId` where the backend accepts null. The catalog response models the returned image summary explicitly instead of using an untyped record:

```ts
interface RewardCatalogImageFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}
```

## Image Loading and Presentation

Protected reward images use the same authenticated loading pattern as Conversation media. A small shared image component requests `/api/files/{fileId}/download` as a blob, creates an object URL, and revokes the URL when the file changes or the component unmounts.

The Reward Catalog table displays a compact image thumbnail beside the localized reward title. The form displays a larger preview with the file name and replace/remove controls. Missing images use a neutral placeholder. Loading and download failures use localized fallbacks and do not fail the catalog request, table, or modal.

Async image loading ignores stale responses when a component changes to another file or unmounts before the download completes.

## Alternatives Considered

Rendering the backend download URL directly is rejected because protected files require the authenticated proxy and blob response handling. Reusing the Conversation `AttachmentCard` is rejected because it contains message attachment, media playback, download, and deletion behavior that does not belong to Reward Catalog. A focused shared authenticated image component reuses the correct transport behavior without coupling the features.

Allowing an "all periods" table filter is also rejected. The existing academic context automatically resolves and displays an active year and term, so an independent all-periods table state would make the filter and context bar disagree. Global scope remains available where it is meaningful: catalog item creation and editing.

## Error Handling

- Catalog list and summary failures retain their existing independent page behavior.
- Academic option failures are shown within the affected selector.
- Image upload failures keep the modal open and preserve all form values.
- Image download failures render a placeholder and retry affordance without removing the row.
- Missing file upload or download permission skips the corresponding request and leaves the remaining catalog UI usable.
- Form submission stays disabled while an image upload is in progress.
- Closing the modal clears transient upload state and object URLs.

## Verification

Focused tests cover:

- The reinforcement layout initializes Reward Catalog with the active academic context.
- Year and term changes update the context-backed URL, reset pagination, and reload list and summary requests with matching IDs.
- Dependent term options refresh when the selected year changes.
- Create defaults to the active context, while edit preserves the item's stored scope.
- Global mode submits `academicYearId: null` and `termId: null`.
- Image upload captures the returned file ID and includes it in create and update payloads.
- Existing table and form images load through `/api/files/{fileId}/download`.
- Missing `files.uploads.manage` hides upload and replace controls and does not send `POST /files`.
- Missing `files.downloads.view` skips image download requests and renders the unavailable state.
- Replacing an image submits the new file ID and removing it submits null.
- Object URLs are revoked on replacement and unmount.
- Stale image responses do not replace the current preview.
- Upload, download, and academic-option failures remain localized and preserve page or form state.
