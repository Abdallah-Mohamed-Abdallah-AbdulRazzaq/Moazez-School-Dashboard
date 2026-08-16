# STU-GUARD-ROUTE-1A — Canonical Guardians Routes

## Goal

Fix the route collision where the legacy guardians list route could be interpreted as a dynamic student route:

```http
GET /api/v1/students-guardians/students/guardians?search=fda
```

Before the fix, this could hit `students/:studentId` and fail UUID parsing because `guardians` was treated as `studentId`.

## Canonical routes

New frontend code should use:

```http
GET   /api/v1/students-guardians/guardians
POST  /api/v1/students-guardians/guardians
GET   /api/v1/students-guardians/guardians/:guardianId
PATCH /api/v1/students-guardians/guardians/:guardianId
GET   /api/v1/students-guardians/guardians/:guardianId/students
POST  /api/v1/students-guardians/guardians/:guardianId/account
```

## Legacy routes preserved

The following legacy routes remain available for backward compatibility:

```http
GET   /api/v1/students-guardians/students/guardians
POST  /api/v1/students-guardians/students/guardians
GET   /api/v1/students-guardians/students/guardians/:guardianId
PATCH /api/v1/students-guardians/students/guardians/:guardianId
GET   /api/v1/students-guardians/students/guardians/:guardianId/students
```

## Permissions

| Action | Permission |
|---|---|
| List guardians | `students.guardians.view` |
| Get guardian | `students.guardians.view` |
| Get guardian students | `students.guardians.view` |
| Create guardian | `students.guardians.manage` |
| Update guardian | `students.guardians.manage` |
| Create/link guardian account | `students.guardians.manage` |

## Frontend recommendation

Use canonical routes for all new Admissions registration / guardian search UIs. Keep legacy routes only for old clients until a future API deprecation window.
