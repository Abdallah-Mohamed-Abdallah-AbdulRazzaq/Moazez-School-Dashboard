# Moazez Backend — Admission Module API Documentation

Generated from repository: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`  
Module scope: Dashboard-facing admissions APIs under `/api/v1/admissions/*`.

> Note: the repository also contains a separate `applicant-portal` module. This document focuses on the implemented dashboard admissions module and documents the bridge points where applicant uploads affect admissions document review and registration handoff.

---

## 1. Runtime and API base

| Item | Value |
|---|---|
| Framework | NestJS + TypeScript |
| Global API prefix | `/api/v1` |
| Local base URL | `http://localhost:3000/api/v1` |
| Swagger URL | `http://localhost:3000/api/v1/docs` |
| Auth scheme | Bearer JWT |
| Default error envelope | `{ "error": { "code", "message", "details?", "traceId" } }` |

All routes below are relative to `/api/v1`.

---

## 2. Security, scope, and permissions

### 2.1 Authentication and school scope

All admissions dashboard endpoints require:

1. A valid access token.
2. An active membership with a `schoolId` in the request context.
3. The route-specific permission code.

When the token is missing/invalid, the module throws `auth.token.invalid` with HTTP `401`. When the actor has no active school scope or lacks route permissions, it throws `auth.scope.missing` with HTTP `403`.

### 2.2 Permission matrix

| Area | Method(s) | Endpoint(s) | Permission |
|---|---:|---|---|
| Leads read | GET | `/admissions/leads`, `/admissions/leads/:id` | `admissions.leads.view` |
| Leads write | POST/PATCH | `/admissions/leads`, `/admissions/leads/:id` | `admissions.leads.manage` |
| Applications read | GET | `/admissions/applications`, `/admissions/applications/:id` | `admissions.applications.view` |
| Applications write | POST/PATCH | `/admissions/applications`, `/admissions/applications/:id`, `/admissions/applications/:id/submit`, `/admissions/applications/:id/enroll`, `/admissions/applications/:id/registration-handoff` | `admissions.applications.manage` |
| Accepted registration submit | POST | `/admissions/applications/:id/register` | `admissions.applications.manage`, `students.records.manage`, `students.guardians.manage`, `students.enrollments.manage` |
| Application documents read | GET | `/admissions/applications/:applicationId/documents` | `admissions.documents.view` |
| Application documents write/review | POST/DELETE | `/admissions/applications/:applicationId/documents/*` | `admissions.documents.manage` |
| Placement tests read | GET | `/admissions/tests`, `/admissions/tests/:id` | `admissions.tests.view` |
| Placement tests write | POST/PATCH | `/admissions/tests`, `/admissions/tests/:id` | `admissions.tests.manage` |
| Interviews read | GET | `/admissions/interviews`, `/admissions/interviews/:id` | `admissions.interviews.view` |
| Interviews write | POST/PATCH | `/admissions/interviews`, `/admissions/interviews/:id` | `admissions.interviews.manage` |
| Decisions read | GET | `/admissions/decisions`, `/admissions/decisions/:id` | `admissions.decisions.view` |
| Decisions write | POST | `/admissions/decisions` | `admissions.decisions.manage` |

---

## 3. Canonical enums

### 3.1 Leads

| Enum | API values |
|---|---|
| Lead channel | `In-app`, `Referral`, `Walk-in`, `Other` |
| Lead status | `New`, `Contacted`, `Converted`, `Closed` |

### 3.2 Applications

| Enum | API values |
|---|---|
| Application source | `in_app`, `referral`, `walk_in`, `other` |
| Application status | `submitted`, `documents_pending`, `under_review`, `accepted`, `waitlisted`, `rejected` |
| Application document status | `complete`, `missing`, `pending_review` |

### 3.3 Workflows

| Enum | API values |
|---|---|
| Placement test status | `scheduled`, `completed`, `failed`, `cancelled`, `rescheduled` |
| Interview status | `scheduled`, `completed`, `cancelled`, `rescheduled` |
| Admission decision | `accept`, `waitlist`, `reject` |

---

## 4. Global validation behavior

The app uses a global `ValidationPipe` with:

- `whitelist: true` — unknown fields are stripped.
- `forbidNonWhitelisted: true` — unknown fields are rejected.
- `transform: true` — DTO transformation is enabled.
- `enableImplicitConversion: false` — explicit `@Type(() => Number)` is used for numeric query params.

Standard validation failures return HTTP `400`:

```json
{
  "error": {
    "code": "validation.failed",
    "message": "studentName must be shorter than or equal to 200 characters",
    "details": {
      "fields": ["studentName must be shorter than or equal to 200 characters"]
    },
    "traceId": "..."
  }
}
```

---

## 5. Data model summary

| Model/table | Purpose | Important fields |
|---|---|---|
| `admission_leads` | Admission prospect/lead | `studentName`, `primaryContactName`, `phone`, `email`, `channel`, `status`, `notes`, `ownerUserId` |
| `admission_applications` | Main admission application | `leadId`, `studentName`, `requestedAcademicYearId`, `requestedGradeId`, `status`, `source`, `submittedAt` |
| `admission_application_documents` | Uploaded/linked application docs | `applicationId`, `fileId`, `documentType`, `status`, `notes` |
| `admission_tests` | Placement tests | `applicationId`, `subjectId`, `type`, `scheduledAt`, `score`, `result`, `status` |
| `admission_interviews` | Admissions interviews | `applicationId`, `scheduledAt`, `interviewerUserId`, `status`, `notes` |
| `admission_decisions` | Final decision, one per application | `applicationId`, `decision`, `reason`, `decidedByUserId`, `decidedAt` |

Multi-tenancy is enforced through `schoolId` and `organizationId` taken from active request scope.

---

## 6. Endpoints overview

| Method | Endpoint | Success | Purpose |
|---:|---|---:|---|
| GET | `/admissions/leads` | 200 | List leads |
| POST | `/admissions/leads` | 201 | Create lead |
| GET | `/admissions/leads/:id` | 200 | Get lead |
| PATCH | `/admissions/leads/:id` | 200 | Update lead |
| GET | `/admissions/applications` | 200 | List applications |
| POST | `/admissions/applications` | 201 | Create application |
| GET | `/admissions/applications/:id` | 200 | Get application |
| PATCH | `/admissions/applications/:id` | 200 | Update application |
| POST | `/admissions/applications/:id/submit` | 200 | Submit documents-pending application |
| POST | `/admissions/applications/:id/enroll` | 200 | Accepted application enrollment handoff preview |
| GET | `/admissions/applications/:id/registration-handoff` | 200 | Accepted application registration handoff wizard data |
| POST | `/admissions/applications/:id/register` | 200 | Create student/guardian/enrollment records from accepted application |
| GET | `/admissions/applications/:applicationId/documents` | 200 | List application documents |
| POST | `/admissions/applications/:applicationId/documents` | 201 | Create/link application document |
| POST | `/admissions/applications/:applicationId/documents/:documentId/accept` | 200 | Accept pending-review document |
| POST | `/admissions/applications/:applicationId/documents/:documentId/reject` | 200 | Reject pending-review document |
| POST | `/admissions/applications/:applicationId/documents/:documentId/request-replacement` | 200 | Request applicant replacement |
| DELETE | `/admissions/applications/:applicationId/documents/:documentId` | 200 | Delete application document link |
| GET | `/admissions/tests` | 200 | List placement tests |
| POST | `/admissions/tests` | 201 | Create placement test |
| GET | `/admissions/tests/:id` | 200 | Get placement test |
| PATCH | `/admissions/tests/:id` | 200 | Update placement test |
| GET | `/admissions/interviews` | 200 | List interviews |
| POST | `/admissions/interviews` | 201 | Create interview |
| GET | `/admissions/interviews/:id` | 200 | Get interview |
| PATCH | `/admissions/interviews/:id` | 200 | Update interview |
| GET | `/admissions/decisions` | 200 | List decisions |
| POST | `/admissions/decisions` | 201 | Create decision |
| GET | `/admissions/decisions/:id` | 200 | Get decision |

---

## 7. Leads API

### 7.1 List leads

`GET /admissions/leads`

Permission: `admissions.leads.view`

Query filters:

| Query | Type | Required | Allowed values |
|---|---|---:|---|
| `status` | string | no | `New`, `Contacted`, `Converted`, `Closed` |
| `channel` | string | no | `In-app`, `Referral`, `Walk-in`, `Other` |

Example:

```http
GET /api/v1/admissions/leads?status=New&channel=Referral
Authorization: Bearer {{accessToken}}
```

Response `200`:

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "studentName": "Omar Ahmed",
    "primaryContactName": "Ahmed Mostafa",
    "phone": "+201001112233",
    "email": "parent@example.com",
    "channel": "Referral",
    "status": "New",
    "notes": "Interested in Grade 4",
    "createdAt": "2026-06-30T09:00:00.000Z",
    "updatedAt": "2026-06-30T09:00:00.000Z"
  }
]
```

### 7.2 Create lead

`POST /admissions/leads`

Permission: `admissions.leads.manage`

Request body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `studentName` | string | yes | max 200 |
| `primaryContactName` | string | yes | max 200 |
| `phone` | string | yes | phone number |
| `email` | string | no | string, max 200 |
| `channel` | string | yes | enum |
| `notes` | string | no | max 2000 |

Example body:

```json
{
  "studentName": "Omar Ahmed",
  "primaryContactName": "Ahmed Mostafa",
  "phone": "+201001112233",
  "email": "parent@example.com",
  "channel": "Referral",
  "notes": "Interested in Grade 4"
}
```

Logic:

- The server normalizes/trims required and optional text fields.
- New leads always start with status `New`.
- `schoolId` and `organizationId` are taken from active scope.

Response `201`: `LeadResponseDto`.

### 7.3 Get lead

`GET /admissions/leads/:id`

Permission: `admissions.leads.view`

Path params:

| Param | Validation |
|---|---|
| `id` | UUID |

Errors:

- `404 not_found` — `Lead not found`.

### 7.4 Update lead

`PATCH /admissions/leads/:id`

Permission: `admissions.leads.manage`

Body fields are optional:

| Field | Type | Validation |
|---|---|---|
| `studentName` | string | max 200 |
| `primaryContactName` | string | max 200 |
| `phone` | string | phone number |
| `email` | string | max 200 |
| `channel` | string | enum |
| `status` | string | enum |
| `notes` | string | max 2000 |

Example body:

```json
{
  "status": "Contacted",
  "notes": "Called parent and explained admission steps"
}
```

Errors:

- `404 not_found` — `Lead not found`.

---

## 8. Applications API

### 8.1 List applications

`GET /admissions/applications`

Permission: `admissions.applications.view`

Query filters:

| Query | Type | Required | Allowed values |
|---|---|---:|---|
| `status` | string | no | `submitted`, `documents_pending`, `under_review`, `accepted`, `waitlisted`, `rejected` |

Response `200`: array of `ApplicationResponseDto`.

### 8.2 Create application

`POST /admissions/applications`

Permission: `admissions.applications.manage`

Request body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `leadId` | UUID | no | must reference an existing scoped lead when provided |
| `studentName` | string | yes | min 1, max 200 |
| `requestedAcademicYearId` | UUID | no | must reference existing scoped academic year when provided |
| `requestedGradeId` | UUID | no | must reference existing scoped grade when provided |
| `source` | string | yes | `in_app`, `referral`, `walk_in`, `other` |

Example:

```json
{
  "leadId": "11111111-1111-1111-1111-111111111111",
  "studentName": "Omar Ahmed",
  "requestedAcademicYearId": "22222222-2222-2222-2222-222222222222",
  "requestedGradeId": "33333333-3333-3333-3333-333333333333",
  "source": "referral"
}
```

Logic:

- Validates referenced lead, academic year, and grade when IDs are provided.
- Trims and normalizes `studentName`.
- Creates the application with status `documents_pending` and `submittedAt = null`.

Response `201`:

```json
{
  "id": "44444444-4444-4444-4444-444444444444",
  "leadId": "11111111-1111-1111-1111-111111111111",
  "studentName": "Omar Ahmed",
  "requestedAcademicYearId": "22222222-2222-2222-2222-222222222222",
  "requestedGradeId": "33333333-3333-3333-3333-333333333333",
  "source": "referral",
  "status": "documents_pending",
  "submittedAt": null,
  "createdAt": "2026-06-30T09:10:00.000Z",
  "updatedAt": "2026-06-30T09:10:00.000Z",
  "registrationState": {
    "registered": false,
    "studentId": null,
    "enrollmentId": null,
    "enrollmentStatus": null,
    "registeredVia": null,
    "registeredAt": null,
    "source": "derived_from_student_application_id"
  }
}
```

Errors:

- `404 not_found` — `Lead not found`.
- `404 not_found` — `Academic year not found`.
- `404 not_found` — `Grade not found`.

### 8.3 Get application

`GET /admissions/applications/:id`

Permission: `admissions.applications.view`

Path params:

| Param | Validation |
|---|---|
| `id` | UUID |

Errors:

- `404 not_found` — `Application not found`.

### 8.4 Update application

`PATCH /admissions/applications/:id`

Permission: `admissions.applications.manage`

Body fields are optional:

| Field | Type | Validation |
|---|---|---|
| `leadId` | UUID | existing lead when provided |
| `studentName` | string | min 1, max 200 |
| `requestedAcademicYearId` | UUID | existing academic year when provided |
| `requestedGradeId` | UUID | existing grade when provided |
| `source` | string | enum |

Response `200`: `ApplicationResponseDto`.

### 8.5 Submit application

`POST /admissions/applications/:id/submit`

Permission: `admissions.applications.manage`

No request body.

Logic:

- Application must currently be `documents_pending`.
- `submittedAt` must be `null`.
- The endpoint changes status to `submitted` and sets `submittedAt` to current server time.

Success response `200`: updated `ApplicationResponseDto`.

Errors:

```json
{
  "error": {
    "code": "conflict",
    "message": "Application cannot be submitted from its current status",
    "details": {
      "applicationId": "...",
      "status": "ACCEPTED"
    },
    "traceId": "..."
  }
}
```

### 8.6 Enrollment handoff preview

`POST /admissions/applications/:id/enroll`

Permission: `admissions.applications.manage`

Purpose: returns a lightweight enrollment handoff draft for accepted applications. It does **not** create the student/guardian/enrollment records.

Eligibility logic:

- At least one placement test must exist and all placement tests must be `completed`.
- At least one interview must exist and all interviews must be `completed`.
- Application status must be `accepted`.
- Existing decision must be `accept`.

Response `200`:

```json
{
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "eligible": true,
  "handoff": {
    "studentDraft": {
      "fullName": "Omar Ahmed"
    },
    "guardianDrafts": [
      {
        "fullName": "Ahmed Mostafa",
        "phone": "+201001112233",
        "email": "parent@example.com"
      }
    ],
    "enrollmentDraft": {
      "requestedAcademicYearId": "22222222-2222-2222-2222-222222222222",
      "requestedAcademicYearName": "2026/2027",
      "requestedGradeId": "33333333-3333-3333-3333-333333333333",
      "requestedGradeName": "Grade 4"
    }
  }
}
```

Errors:

- `422 admissions.decision.requires_all_steps` — tests/interviews missing or not completed.
- `409 admissions.application.not_accepted` — application is not accepted or decision is not `accept`.

### 8.7 Registration handoff wizard

`GET /admissions/applications/:id/registration-handoff`

Permission: `admissions.applications.manage`

Purpose: returns the full wizard draft for school registration, including source application/applicant data, eligibility details, documents, warnings, and already-registered state.

Eligibility is validated using the same handoff validator as `/enroll`; non-eligible applications return the same workflow errors.

Key response fields:

| Field | Meaning |
|---|---|
| `applicationId` | Source application |
| `status` | Current application status |
| `eligible` | Whether handoff can be prepared |
| `alreadyRegistered` | Whether a student has already been created from this application |
| `eligibility.reasonCodes` | Machine-readable reasons |
| `source` | Application, applicant request, and lead source summaries |
| `wizardDraft.student` | Student form draft |
| `wizardDraft.guardians` | Guardian form draft(s) |
| `wizardDraft.enrollment` | Enrollment form draft |
| `documents` | Bridged application documents |
| `registered` | Existing student/enrollment if already registered |
| `warnings` | Non-blocking warnings |
| `missingRequiredForRegistration` | Required fields still missing |

### 8.8 Register accepted application

`POST /admissions/applications/:id/register`

Permissions required together:

- `admissions.applications.manage`
- `students.records.manage`
- `students.guardians.manage`
- `students.enrollments.manage`

Purpose: creates student, guardians, enrollment, and optional accounts from an accepted application by delegating to the students registration use case.

Request body extends `CreateSchoolRegistrationDto`:

```json
{
  "student": {
    "name": "Omar Ahmed",
    "full_name_en": "Omar Ahmed",
    "dateOfBirth": "2017-05-10",
    "gender": "male",
    "nationality": "Egyptian",
    "status": "active",
    "contact": {
      "address_line": "Street 1",
      "city": "Cairo",
      "district": "Nasr City",
      "student_phone": null,
      "student_email": null
    }
  },
  "guardians": [
    {
      "profile": {
        "full_name": "Ahmed Mostafa",
        "relation": "father",
        "phone_primary": "+201001112233",
        "email": "parent@example.com",
        "can_pickup": true,
        "can_receive_notifications": true
      },
      "relationship": {
        "is_primary": true
      },
      "account": {
        "mode": "none"
      }
    }
  ],
  "enrollment": {
    "academicYearId": "22222222-2222-2222-2222-222222222222",
    "gradeId": "33333333-3333-3333-3333-333333333333",
    "sectionId": "55555555-5555-5555-5555-555555555555",
    "classroomId": "66666666-6666-6666-6666-666666666666",
    "termId": "77777777-7777-7777-7777-777777777777",
    "enrollmentDate": "2026-09-01",
    "status": "active"
  },
  "studentAccount": {
    "mode": "none"
  }
}
```

Important validations inherited from registration DTO:

- `student` is required.
- `guardians` is required and must contain at least one item.
- `enrollment` is required.
- `enrollment.classroomId` is required UUID.
- `enrollment.enrollmentDate` is required ISO date string.
- Account `mode` must be one of `none`, `create`, `link`.
- If account mode is `link`, `userId` is required UUID.
- If account mode is `create`, `username` is required string max 64.

Response `200`:

```json
{
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "registered": true,
  "alreadyRegistered": false,
  "registration": {
    "registrationId": "88888888-8888-8888-8888-888888888888",
    "student": {},
    "guardians": [],
    "enrollment": {},
    "parentAccounts": [],
    "studentAccount": {
      "target": "student",
      "mode": "none",
      "status": "skipped"
    },
    "warnings": [],
    "createdAt": "2026-06-30T09:30:00.000Z",
    "completedAt": "2026-06-30T09:30:00.000Z"
  },
  "warnings": []
}
```

Idempotency/duplicate behavior:

- If the application already has a student, the endpoint returns the already registered summary instead of creating duplicates.
- If a unique constraint happens concurrently and a student is then found, the endpoint returns the already registered summary.

---

## 9. Application Documents API

### 9.1 List documents

`GET /admissions/applications/:applicationId/documents`

Permission: `admissions.documents.view`

Path params:

| Param | Validation |
|---|---|
| `applicationId` | UUID |

Response `200`:

```json
[
  {
    "id": "99999999-9999-9999-9999-999999999999",
    "applicationId": "44444444-4444-4444-4444-444444444444",
    "fileId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "documentType": "Birth Certificate",
    "status": "pending_review",
    "notes": null,
    "createdAt": "2026-06-30T09:15:00.000Z",
    "updatedAt": "2026-06-30T09:15:00.000Z",
    "file": {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "originalName": "birth-certificate.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": "123456",
      "visibility": "PRIVATE"
    }
  }
]
```

### 9.2 Create/link document

`POST /admissions/applications/:applicationId/documents`

Permission: `admissions.documents.manage`

Body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `fileId` | UUID | yes | must reference scoped file |
| `documentType` | string | yes | min 1, max 100 |
| `status` | string | no | `complete`, `missing`, `pending_review`; default `complete` |
| `notes` | string | no | max 2000 |

Example:

```json
{
  "fileId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "documentType": "Birth Certificate",
  "status": "pending_review",
  "notes": "Uploaded by applicant portal"
}
```

Logic:

- Application must exist.
- File must exist in current scope.
- If the same `documentType` already exists for the application, the endpoint updates that existing record instead of creating a duplicate.
- `documentType` and `notes` are trimmed.

Errors:

- `404 not_found` — `Application not found`.
- File module error when `fileId` is not found.

### 9.3 Accept document

`POST /admissions/applications/:applicationId/documents/:documentId/accept`

Permission: `admissions.documents.manage`

Body:

```json
{
  "note": "Verified"
}
```

`note` is optional for accept.

Logic:

- Application status must be one of: `submitted`, `documents_pending`, `under_review`.
- Application document status must be `pending_review`.
- The document must be linked to an applicant document with applicant status `UPLOADED`.
- Application document becomes `complete`.
- Linked applicant document becomes `ACCEPTED`.
- Audit log action: `admissions.document.accept`.

### 9.4 Reject document

`POST /admissions/applications/:applicationId/documents/:documentId/reject`

Permission: `admissions.documents.manage`

Body:

```json
{
  "note": "Image is unreadable"
}
```

`note` is required, min 1, max 2000.

Logic:

- Same reviewability checks as accept.
- Application document becomes `missing`.
- Linked applicant document becomes `REJECTED`.
- Audit log action: `admissions.document.reject`.

### 9.5 Request replacement

`POST /admissions/applications/:applicationId/documents/:documentId/request-replacement`

Permission: `admissions.documents.manage`

Body:

```json
{
  "note": "Please upload a clearer copy"
}
```

Logic:

- Same reviewability checks as accept.
- Application document becomes `missing`.
- Linked applicant document becomes `NEEDS_REPLACEMENT`.
- Applicant-side application documents can be reopened for replacement.
- Audit log action: `admissions.document.request_replacement`.

### 9.6 Delete document

`DELETE /admissions/applications/:applicationId/documents/:documentId`

Permission: `admissions.documents.manage`

Response `200`:

```json
{ "ok": true }
```

Errors:

- `404 not_found` — `Application not found`.
- `404 not_found` — `Application document not found`.

### 9.7 Document review conflict examples

Document review can fail with HTTP `409`:

```json
{
  "error": {
    "code": "conflict",
    "message": "Application document cannot be reviewed in the current state",
    "details": {
      "documentId": "99999999-9999-9999-9999-999999999999"
    },
    "traceId": "..."
  }
}
```

Application state can also block review:

```json
{
  "error": {
    "code": "conflict",
    "message": "Application documents cannot be reviewed in the current state",
    "details": {
      "applicationId": "44444444-4444-4444-4444-444444444444"
    },
    "traceId": "..."
  }
}
```

---

## 10. Placement Tests API

### 10.1 List placement tests

`GET /admissions/tests`

Permission: `admissions.tests.view`

Query filters:

| Query | Type | Default | Validation |
|---|---|---:|---|
| `search` | string | — | max 200 |
| `status` | string | — | placement test status enum |
| `type` | string | — | min 1, max 100 |
| `dateFrom` | ISO date string | — | must be <= `dateTo` |
| `dateTo` | ISO date string | — | must be >= `dateFrom` |
| `page` | integer | 1 | min 1 |
| `limit` | integer | 20 | min 1, max 100 |

Response `200`:

```json
{
  "items": [
    {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "applicationId": "44444444-4444-4444-4444-444444444444",
      "studentName": "Omar Ahmed",
      "subjectId": null,
      "subjectName": null,
      "type": "Placement",
      "scheduledAt": "2026-07-05T10:00:00.000Z",
      "score": null,
      "result": null,
      "status": "scheduled",
      "createdAt": "2026-06-30T09:20:00.000Z",
      "updatedAt": "2026-06-30T09:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 10.2 Create placement test

`POST /admissions/tests`

Permission: `admissions.tests.manage`

Body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `applicationId` | UUID | yes | existing application |
| `type` | string | yes | min 1, max 100; trimmed |
| `scheduledAt` | ISO date string | yes | converted to Date |
| `subjectId` | UUID | no | existing subject when provided |

Example:

```json
{
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "type": "Placement",
  "scheduledAt": "2026-07-05T10:00:00.000Z",
  "subjectId": null
}
```

Logic:

- Application must exist.
- `type` is trimmed and cannot be blank.
- `subjectId`, when provided, must exist in scope.
- The validator rejects an already scheduled test with the same application/type/subject scope.
- New test starts with `status = scheduled`, `score = null`, `result = null`.

Errors:

- `404 not_found` — `Application not found`.
- `404 not_found` — `Subject not found`.
- `400 validation.failed` — blank type.
- `409 admissions.test.already_scheduled` — conflict with existing scheduled test.

### 10.3 Get placement test

`GET /admissions/tests/:id`

Permission: `admissions.tests.view`

Path param `id`: UUID.

Errors:

- `404 not_found` — `Placement test not found`.

### 10.4 Update placement test

`PATCH /admissions/tests/:id`

Permission: `admissions.tests.manage`

Body fields are optional:

| Field | Type | Validation |
|---|---|---|
| `scheduledAt` | ISO date string | converted to Date |
| `score` | number | 0 to 999.99, max 2 decimals, no NaN/Infinity |
| `result` | string | max 255; blank becomes null |
| `status` | string | `scheduled`, `completed`, `failed`, `cancelled`, `rescheduled` |

Example:

```json
{
  "score": 87.5,
  "result": "Passed",
  "status": "completed"
}
```

If body contains no recognized update fields, the existing record is returned unchanged.

---

## 11. Interviews API

### 11.1 List interviews

`GET /admissions/interviews`

Permission: `admissions.interviews.view`

Query filters:

| Query | Type | Default | Validation |
|---|---|---:|---|
| `search` | string | — | max 200 |
| `status` | string | — | interview status enum |
| `dateFrom` | ISO date string | — | must be <= `dateTo` |
| `dateTo` | ISO date string | — | must be >= `dateFrom` |
| `page` | integer | 1 | min 1 |
| `limit` | integer | 20 | min 1, max 100 |

Response shape:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### 11.2 Create interview

`POST /admissions/interviews`

Permission: `admissions.interviews.manage`

Body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `applicationId` | UUID | yes | existing application |
| `scheduledAt` | ISO date string | yes | converted to Date |
| `interviewerUserId` | UUID | no | must be a scoped interviewer when provided |
| `notes` | string | no | max 2000; trimmed; blank becomes null |

Example:

```json
{
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "scheduledAt": "2026-07-06T11:00:00.000Z",
  "interviewerUserId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "notes": "Bring previous school reports"
}
```

Logic:

- Application must exist.
- Interviewer must exist in current scope when provided.
- New interview starts with status `scheduled`.

Errors:

- `404 not_found` — `Application not found`.
- `404 not_found` — `Interviewer not found`.

### 11.3 Get interview

`GET /admissions/interviews/:id`

Permission: `admissions.interviews.view`

Path param `id`: UUID.

### 11.4 Update interview

`PATCH /admissions/interviews/:id`

Permission: `admissions.interviews.manage`

Body fields are optional:

| Field | Type | Validation |
|---|---|---|
| `scheduledAt` | ISO date string | converted to Date |
| `interviewerUserId` | UUID | scoped interviewer when provided |
| `status` | string | `scheduled`, `completed`, `cancelled`, `rescheduled` |
| `notes` | string | max 2000; blank becomes null |

Example:

```json
{
  "status": "completed",
  "notes": "Interview completed successfully"
}
```

---

## 12. Admission Decisions API

### 12.1 List decisions

`GET /admissions/decisions`

Permission: `admissions.decisions.view`

Query filters:

| Query | Type | Default | Validation |
|---|---|---:|---|
| `search` | string | — | max 200 |
| `decision` | string | — | `accept`, `waitlist`, `reject` |
| `dateFrom` | ISO date string | — | must be <= `dateTo` |
| `dateTo` | ISO date string | — | must be >= `dateFrom` |
| `page` | integer | 1 | min 1 |
| `limit` | integer | 20 | min 1, max 100 |

### 12.2 Create decision

`POST /admissions/decisions`

Permission: `admissions.decisions.manage`

Body:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `applicationId` | UUID | yes | existing application |
| `decision` | string | yes | `accept`, `waitlist`, `reject` |
| `reason` | string | no | max 2000; trimmed; blank becomes null |

Example:

```json
{
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "decision": "accept",
  "reason": "Passed placement test and interview"
}
```

Workflow validation:

1. Application must exist.
2. Application must not already have a decision.
3. Application status must be either `submitted` or `under_review`.
4. At least one placement test must exist, and all placement tests must be `completed`.
5. At least one interview must exist, and all interviews must be `completed`.
6. Decision updates the application status:
   - `accept` → `accepted`
   - `waitlist` → `waitlisted`
   - `reject` → `rejected`
7. Audit log action: `admissions.application.decision`.

Response `201`:

```json
{
  "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "applicationId": "44444444-4444-4444-4444-444444444444",
  "studentName": "Omar Ahmed",
  "decision": "accept",
  "reason": "Passed placement test and interview",
  "decidedByUserId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "decidedByName": "Admissions Officer",
  "decidedAt": "2026-06-30T09:40:00.000Z",
  "applicationStatus": "accepted",
  "createdAt": "2026-06-30T09:40:00.000Z",
  "updatedAt": "2026-06-30T09:40:00.000Z"
}
```

Errors:

- `404 not_found` — `Application not found`.
- `409 admissions.application.already_decided` — application already has a decision.
- `422 admissions.decision.requires_all_steps` — application not in valid status or tests/interviews are incomplete.

Example `422`:

```json
{
  "error": {
    "code": "admissions.decision.requires_all_steps",
    "message": "Tests and interviews must be completed first",
    "details": {
      "applicationId": "44444444-4444-4444-4444-444444444444",
      "applicationStatus": "submitted",
      "placementTests": {
        "total": 1,
        "completed": 0
      },
      "interviews": {
        "total": 0,
        "completed": 0
      }
    },
    "traceId": "..."
  }
}
```

### 12.3 Get decision

`GET /admissions/decisions/:id`

Permission: `admissions.decisions.view`

Path param `id`: UUID.

Errors:

- `404 not_found` — `Admission decision not found`.

---

## 13. Main admissions flow

### 13.1 Manual dashboard flow

1. Staff logs in and selects/has active school scope.
2. Staff creates a lead: `POST /admissions/leads`.
3. Staff optionally updates lead status to `Contacted`.
4. Staff creates application: `POST /admissions/applications`.
5. Staff links documents using existing `fileId`s: `POST /admissions/applications/:id/documents`.
6. Staff submits application: `POST /admissions/applications/:id/submit`.
7. Staff schedules placement test: `POST /admissions/tests`.
8. Staff updates placement test to `completed`: `PATCH /admissions/tests/:id`.
9. Staff schedules interview: `POST /admissions/interviews`.
10. Staff updates interview to `completed`: `PATCH /admissions/interviews/:id`.
11. Staff creates decision: `POST /admissions/decisions`.
12. If accepted, staff previews handoff: `GET /admissions/applications/:id/registration-handoff` or `POST /admissions/applications/:id/enroll`.
13. Staff registers accepted application: `POST /admissions/applications/:id/register`.

### 13.2 Applicant portal document bridge

Applicant portal uploads can create application document records in `pending_review`. Dashboard review endpoints operate on these bridged records:

- accept → application doc `complete`, applicant doc `ACCEPTED`.
- reject → application doc `missing`, applicant doc `REJECTED`.
- request replacement → application doc `missing`, applicant doc `NEEDS_REPLACEMENT` and applicant document upload can reopen.

---

## 14. Error catalog for admissions module

| HTTP | Code | Message | Trigger |
|---:|---|---|---|
| 400 | `validation.failed` | Request validation failed | DTO validation, invalid enum, invalid UUID, blank normalized fields |
| 400 | `validation.failed` | `dateFrom must be before or equal to dateTo` | `dateFrom > dateTo` in list filters |
| 401 | `auth.token.invalid` | Invalid or malformed token | No actor/token in request context |
| 403 | `auth.scope.missing` | Active scope is required for this action | Missing school scope or missing permission(s) |
| 404 | `not_found` | Lead not found | Bad/missing lead id |
| 404 | `not_found` | Application not found | Bad/missing application id |
| 404 | `not_found` | Academic year not found | Application create/update with invalid academic year |
| 404 | `not_found` | Grade not found | Application create/update with invalid grade |
| 404 | `not_found` | Application document not found | Bad/missing document id |
| 404 | `not_found` | Placement test not found | Bad/missing placement test id |
| 404 | `not_found` | Subject not found | Placement test references invalid subject |
| 404 | `not_found` | Interview not found | Bad/missing interview id |
| 404 | `not_found` | Interviewer not found | Interview references invalid interviewer |
| 404 | `not_found` | Admission decision not found | Bad/missing decision id |
| 409 | `conflict` | Application cannot be submitted from its current status | Submit non-`documents_pending` or already submitted app |
| 409 | `conflict` | Application documents cannot be reviewed in the current state | Review document after app moved to final state |
| 409 | `conflict` | Application document cannot be reviewed in the current state | Document not `pending_review` or not linked to uploaded applicant doc |
| 409 | `admissions.test.already_scheduled` | A placement test is already scheduled for this application | Duplicate scheduled test for same app/type/subject |
| 409 | `admissions.application.already_decided` | Application already has a decision | Create second decision for same application |
| 409 | `admissions.application.not_accepted` | Cannot enroll a non-accepted application | Enrollment/registration handoff for non-accepted app |
| 422 | `admissions.decision.requires_all_steps` | Tests and interviews must be completed first | Decision/handoff prerequisites are missing or incomplete |
| 429 | `rate_limit.exceeded` | Too many requests | Global throttling, when configured |
| 500 | `internal_error` | An unexpected error occurred | Unhandled exception |

---

## 15. Important implementation notes

- Controllers contain no business logic; they delegate to use cases.
- Admissions routes are Swagger-tagged as: `admissions-leads`, `admissions-applications`, `admissions-documents`, `admissions-tests`, `admissions-interviews`, `admissions-decisions`.
- Application documents rely on the Files module. To create a document, first upload/create a file record and pass its `fileId`.
- Final decisions are one-per-application at database level.
- Registration submission delegates to the Students registration workflow and records audit logs.
- Audit logs are created for decision creation, document review actions, and application registration.

---

## 16. Quick test data checklist

Before running the Postman collection, make sure you have:

- A user able to login.
- Active school membership on that user.
- Required permissions listed in section 2.2.
- Optional existing `academicYearId`, `gradeId`, `subjectId`, `classroomId`, `termId` for full registration flow.
- Uploaded file `fileId` from Files module before document creation.

Recommended local setup from README:

```bash
cp .env.example .env
npm run infra:up
npm run db:migrate
npm run seed
npm run start:dev
```
