# ADM-DOC-UX-1B — Application Document Counters

## Goal

Add backend-computed aggregate document counters directly to school-side Admissions application responses.

## Returned by

```http
GET /api/v1/admissions/applications
GET /api/v1/admissions/applications/:id
POST /api/v1/admissions/applications
PATCH /api/v1/admissions/applications/:id
POST /api/v1/admissions/applications/:id/submit
```

Create/update/submit paths share the same `ApplicationResponseDto` presenter and therefore include the additive field too.

## Field

```ts
documentsSummary: {
  totalCount: number;
  completeCount: number;
  missingCount: number;
  pendingReviewCount: number;
  reviewableCount: number;
  applicantPortalCount: number;
  staffUploadCount: number;
  needsReplacementCount: number;
  hasPendingReview: boolean;
  hasReviewableDocuments: boolean;
  hasMissingDocuments: boolean;
}
```

## Counter definitions

- `totalCount`: count of school-side `ApplicationDocument` rows.
- `completeCount`: `ApplicationDocument.status = COMPLETE`.
- `missingCount`: `ApplicationDocument.status = MISSING`.
- `pendingReviewCount`: `ApplicationDocument.status = PENDING_REVIEW`.
- `reviewableCount`: documents satisfying the same gates as document review eligibility.
- `applicantPortalCount`: documents with a non-deleted linked Applicant Portal document.
- `staffUploadCount`: `totalCount - applicantPortalCount`.
- `needsReplacementCount`: non-deleted linked applicant documents with `NEEDS_REPLACEMENT`.
- `hasPendingReview`: `pendingReviewCount > 0`.
- `hasReviewableDocuments`: `reviewableCount > 0`.
- `hasMissingDocuments`: `missingCount > 0 || needsReplacementCount > 0`.

## Query strategy

The application repository selects only minimal document summary inputs. The presenter computes public counters and does not expose raw relations, IDs, tenant IDs, storage fields, or document arrays.

## Frontend usage

Use `documentsSummary` for:

- application list/card badges
- review queue counters
- missing document warning badges
- document summary panels

Fetch the full documents list only when rendering a document table or review drawer.
