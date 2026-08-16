# Safe Responses and No-Leak Policy

The accepted V1 security posture requires dashboard and app-facing responses to avoid leaking internal or sensitive fields.

## Fields that must not leak to app-facing responses

Responses must avoid exposing:

```text
schoolId
organizationId
membershipId
roleId
passwordHash
session/token fields
deletedAt
objectKey
bucket
storage provider internals
answer keys
correct answers
isCorrect where inappropriate
raw Prisma internals
soft-delete metadata
```

## Student and Parent grade no-leak behavior

Student and Parent grade reads hide:

- answer keys.
- correct answers.
- `isCorrect` review-only information.
- draft/unpublished assessments.
- other-student or unlinked-child grades.
- cross-school grades.
- tenant/internal IDs and storage internals.

## Homework no-leak behavior

Student and Parent homework reads hide:

- answer keys.
- correct answers.
- teacher-only review data.
- storage internals.
- tenant/internal fields.

Parent App homework is read-only and exposes only visible linked-child homework data.

## Teacher review-safe behavior

Teacher review surfaces may expose review-appropriate information for owned allocations, but remain safe against:

- cross-school data.
- same-school unowned class data.
- tenant/internal/storage leaks.
- answer/correctness leakage to actors outside review surfaces.

## Dashboard safe behavior

Dashboard aggregate/read models such as Grades bootstrap, overview, analytics, gradebook, and Homework reads are school-scoped and permission-protected.

Dashboard responses should avoid password/session/storage internals and avoid serializing cross-school IDs in safe error paths.

## File metadata policy

File-related responses expose safe metadata only, such as:

```text
fileId
filename/originalName
mimeType
sizeBytes
visibility where appropriate
```

They must not expose:

```text
bucket
objectKey
signed URLs unless a dedicated authorized download flow explicitly provides them
storage provider internals
```
