# ADM-DOC-UX-1A — Admissions Document Review Eligibility

## Goal

Expose the backend's real document review gates to the Admissions Dashboard so the frontend does not decide reviewability from `status === pending_review` alone.

## New document response fields

`ApplicationDocumentResponseDto` now includes:

```ts
{
  source: 'staff_upload' | 'applicant_portal';
  canReview: boolean;
  reviewEligibility: {
    canAccept: boolean;
    canReject: boolean;
    canRequestReplacement: boolean;
    reason:
      | 'reviewable'
      | 'application_status_not_reviewable'
      | 'document_not_pending_review'
      | 'not_applicant_portal_document'
      | 'applicant_document_not_uploaded';
  };
  linkedApplicantDocument: {
    id: string;
    status: 'uploaded' | 'accepted' | 'rejected' | 'needs_replacement' | 'superseded';
  } | null;
}
```

## Eligibility gates

A document is reviewable only if all gates are true:

1. The parent application status is reviewable:
   - `SUBMITTED`
   - `DOCUMENTS_PENDING`
   - `UNDER_REVIEW`
2. The school-side `ApplicationDocument.status` is `PENDING_REVIEW`.
3. There is a linked Applicant Portal document.
4. The linked Applicant Portal document status is `UPLOADED`.

## Reason precedence

The presenter applies deterministic precedence:

1. `application_status_not_reviewable`
2. `document_not_pending_review`
3. `not_applicant_portal_document`
4. `applicant_document_not_uploaded`
5. `reviewable`

`canAccept`, `canReject`, and `canRequestReplacement` currently equal `canReview`.

## Staff-created pending review rule

Staff-created documents can be `complete`, `missing`, or omit `status` to default to `complete`.

Staff cannot create an Admissions document with:

```json
{ "status": "pending_review" }
```

The backend rejects it with:

```json
{
  "field": "status",
  "reason": "pending_review_reserved_for_applicant_portal"
}
```

## Review action results

After review actions:

- Accept: application document becomes `complete`; linked applicant document becomes `accepted`.
- Reject: application document becomes `missing`; linked applicant document becomes `rejected`.
- Request replacement: application document becomes `missing`; linked applicant document becomes `needs_replacement`.

All three action responses include the same enriched eligibility fields and usually return `canReview: false` afterwards because the document is no longer `pending_review`.

## No-leak boundary

The school-side diagnostic link exposes only:

- `linkedApplicantDocument.id`
- `linkedApplicantDocument.status`

It does not expose applicant user id, request id, required document id, tenant ids, storage internals, signed URLs, or raw Prisma enum names.
