# Security, Tenancy, and Permissions

## Tenancy

Both subject catalog and subject allocation APIs are school-scoped. They rely on request context and scoped Prisma access.

The APIs must not accept or trust client-supplied tenant identifiers such as:

- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`

## Subject Catalog Permissions

| Route | Permission |
| --- | --- |
| `GET /api/v1/academics/subjects` | `academics.subjects.view` |
| `POST /api/v1/academics/subjects` | `academics.subjects.manage` |
| `PATCH /api/v1/academics/subjects/:id` | `academics.subjects.manage` |
| `DELETE /api/v1/academics/subjects/:id` | `academics.subjects.manage` |

## Subject Allocation Permissions

| Route | Permission |
| --- | --- |
| `GET /api/v1/academics/subject-allocations` | `academics.structure.view` |
| `PUT /api/v1/academics/subject-allocations/bulk` | `academics.structure.manage` |

## Why Allocation Is More Restricted Than Subject Read

Some app roles may be allowed to view subject names, but they should not receive the dashboard setup matrix. Therefore, allocation matrix routes use `academics.structure.*`, not `academics.subjects.*`.

## No-Leak Expectations

Subject catalog responses must not leak internal fields.

Allocation responses are dashboard setup responses and include academic ids required by the matrix, such as `academicYearId`, `termId`, `gradeId`, and `subjectId`. They still must not leak school membership, role, deleted timestamps, or raw Prisma relation internals.

## Default App Role Impact

The closeout test coverage states that Teacher, Student, and Parent app roles do not receive allocation matrix permissions by default. That means direct calls to `/academics/subject-allocations` should not be part of those app integrations.
