# API Delta Reference

All routes are under `/api/v1`.

## Admissions application list/detail

### `GET /admissions/applications`

User: school staff / dashboard user.

Permission: `admissions.applications.view`.

Delta: each returned application now includes:

- `documentsSummary`
- `dashboardState`

### `GET /admissions/applications/:id`

User: school staff / dashboard user.

Permission: `admissions.applications.view`.

Delta: detail response now includes the same `documentsSummary` and `dashboardState` fields.

### Other `ApplicationResponseDto` routes

The following routes share the same presenter and therefore also include the additive fields:

```http
POST  /admissions/applications
PATCH /admissions/applications/:id
POST  /admissions/applications/:id/submit
```

## Admissions documents

### `GET /admissions/applications/:applicationId/documents`

User: school staff / admissions reviewer.

Permission: `admissions.documents.view`.

Delta: each document response now includes:

- `source`
- `canReview`
- `reviewEligibility`
- `linkedApplicantDocument`

### `POST /admissions/applications/:applicationId/documents`

User: school staff.

Permission: `admissions.documents.manage`.

Delta: staff can no longer create documents with `status: pending_review`.

Allowed staff statuses:

- `complete`
- `missing`
- omitted status, which defaults to `complete`

Rejected:

```json
{ "status": "pending_review" }
```

### Review actions

User: school staff / admissions reviewer.

Permission: `admissions.documents.manage`.

```http
POST /admissions/applications/:applicationId/documents/:documentId/accept
POST /admissions/applications/:applicationId/documents/:documentId/reject
POST /admissions/applications/:applicationId/documents/:documentId/request-replacement
```

Delta: action responses include enriched document review fields. Actions remain valid only for reviewable Applicant Portal bridged documents.

## Workflow policy

### `GET /admissions/workflow-policy`

User: school staff / dashboard user.

Permission: `admissions.applications.view`.

Returns effective policy for current school:

```json
{
  "requiresPlacementTest": true,
  "requiresInterview": true,
  "allowDirectAcceptance": false,
  "source": "default",
  "updatedAt": null
}
```

### `PATCH /admissions/workflow-policy`

User: school staff / admissions admin.

Permission: `admissions.applications.manage`.

Accepts at least one boolean field:

```json
{
  "requiresPlacementTest": false,
  "requiresInterview": false,
  "allowDirectAcceptance": true
}
```

## Guardians route alias

### Canonical routes

User: school staff / student-guardian management UI.

```http
GET   /students-guardians/guardians
POST  /students-guardians/guardians
GET   /students-guardians/guardians/:guardianId
PATCH /students-guardians/guardians/:guardianId
GET   /students-guardians/guardians/:guardianId/students
POST  /students-guardians/guardians/:guardianId/account
```

### Legacy routes

```http
GET   /students-guardians/students/guardians
POST  /students-guardians/students/guardians
GET   /students-guardians/students/guardians/:guardianId
PATCH /students-guardians/students/guardians/:guardianId
GET   /students-guardians/students/guardians/:guardianId/students
```

Frontend should migrate to canonical routes.
