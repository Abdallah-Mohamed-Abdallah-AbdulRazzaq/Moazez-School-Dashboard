# File Proofs and Safe Responses

## Proof submission and display

Task proof data can include:

- proof text
- safe proof file metadata

Student task submission accepts optional `proofText` and/or `proofFileId` according to the core proof requirements.

## Student proof file validation

For Student App task submission, a proof file must be:

- within the current organization and school scope
- uploaded by the current student user
- private
- not soft-deleted

If the file fails validation, the route returns safe not-found before core submission.

## Safe metadata fields

Allowed app-facing metadata fields may include:

- `fileId` or `id`
- `filename`
- `originalName`
- `mimeType`
- `size` or `sizeBytes`
- `visibility`
- `createdAt`
- a backend `downloadPath` only where that route explicitly returns one

## Forbidden fields

Never expose these fields in app-facing Reinforcement/Learning Flow responses:

- `bucket`
- `objectKey`
- `storageKey`
- raw storage metadata
- signed URL
- direct storage URL
- unsafe file URL
- uploader internal id
- tenant ids
- actor/reviewer ids

## Parent proof download

Parent task proof download is intentionally deferred. Parent task/reinforcement responses may show proof text and safe file metadata, but do not expose a proof download path yet.

## Download route handling

Where a backend route reference such as `/api/v1/files/:id/download` is returned, frontend should call the backend route and let the backend authorize access. Frontend must not construct object storage URLs.
