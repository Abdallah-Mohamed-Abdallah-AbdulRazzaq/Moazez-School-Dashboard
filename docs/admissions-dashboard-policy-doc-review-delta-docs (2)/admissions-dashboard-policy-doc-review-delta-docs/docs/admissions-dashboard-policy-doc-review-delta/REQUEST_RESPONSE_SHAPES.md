# Request / Response Shapes

## ApplicationResponseDto additive fields

```json
{
  "id": "application-id",
  "studentName": "Layla Hassan",
  "status": "submitted",
  "registrationState": {
    "registered": false,
    "studentId": null,
    "enrollmentId": null,
    "enrollmentStatus": null,
    "registeredVia": null,
    "registeredAt": null,
    "source": "derived_from_student_application_id"
  },
  "documentsSummary": {
    "totalCount": 2,
    "completeCount": 1,
    "missingCount": 0,
    "pendingReviewCount": 1,
    "reviewableCount": 1,
    "applicantPortalCount": 1,
    "staffUploadCount": 1,
    "needsReplacementCount": 0,
    "hasPendingReview": true,
    "hasReviewableDocuments": true,
    "hasMissingDocuments": false
  },
  "dashboardState": {
    "canProceedToDecision": true,
    "canRegister": false,
    "registrationState": "not_accepted",
    "decisionState": {
      "canCreateDecision": true,
      "canAccept": true,
      "canWaitlist": true,
      "canReject": true,
      "reason": "ready"
    },
    "workflowReadiness": {
      "policy": {
        "requiresPlacementTest": true,
        "requiresInterview": true,
        "allowDirectAcceptance": false,
        "source": "default"
      },
      "placementTests": {
        "required": true,
        "total": 1,
        "completed": 1,
        "satisfied": true
      },
      "interviews": {
        "required": true,
        "total": 1,
        "completed": 1,
        "satisfied": true
      }
    },
    "documentSignals": {
      "hasPendingReview": true,
      "hasReviewableDocuments": true,
      "hasMissingDocuments": false,
      "pendingReviewCount": 1,
      "reviewableCount": 1,
      "missingCount": 0,
      "needsReplacementCount": 0
    },
    "blockers": [
      {
        "code": "not_accepted",
        "message": "Application is not accepted."
      }
    ]
  }
}
```

## ApplicationDocumentResponseDto additive fields

```json
{
  "id": "application-document-id",
  "applicationId": "application-id",
  "fileId": "file-id",
  "documentType": "birth_certificate",
  "status": "pending_review",
  "source": "applicant_portal",
  "canReview": true,
  "reviewEligibility": {
    "canAccept": true,
    "canReject": true,
    "canRequestReplacement": true,
    "reason": "reviewable"
  },
  "linkedApplicantDocument": {
    "id": "applicant-document-id",
    "status": "uploaded"
  },
  "notes": null,
  "createdAt": "2026-07-03T12:00:00.000Z",
  "updatedAt": "2026-07-03T12:00:00.000Z",
  "file": {
    "id": "file-id",
    "originalName": "birth-certificate.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": "12345",
    "visibility": "PRIVATE"
  }
}
```

## Staff upload rejected pending_review

Request:

```json
{
  "fileId": "file-id",
  "documentType": "birth_certificate",
  "status": "pending_review"
}
```

Expected error details:

```json
{
  "field": "status",
  "reason": "pending_review_reserved_for_applicant_portal"
}
```

## Workflow policy response

Default:

```json
{
  "requiresPlacementTest": true,
  "requiresInterview": true,
  "allowDirectAcceptance": false,
  "source": "default",
  "updatedAt": null
}
```

School override:

```json
{
  "requiresPlacementTest": false,
  "requiresInterview": false,
  "allowDirectAcceptance": true,
  "source": "school_override",
  "updatedAt": "2026-07-03T12:00:00.000Z"
}
```

## Workflow policy update

```json
{
  "requiresPlacementTest": false,
  "requiresInterview": false,
  "allowDirectAcceptance": true
}
```
