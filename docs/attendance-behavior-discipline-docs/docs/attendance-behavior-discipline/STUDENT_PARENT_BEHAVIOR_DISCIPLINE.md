# Student and Parent Behavior / Discipline

## Student Behavior

```http
GET /api/v1/student/behavior
GET /api/v1/student/behavior/summary
GET /api/v1/student/behavior/:recordId
```

Student Behavior routes expose approved positive/negative Behavior records for the authenticated current student.

They do not expose Attendance timeline items.

## Parent Behavior

```http
GET /api/v1/parent/children/:studentId/behavior
GET /api/v1/parent/children/:studentId/behavior/summary
GET /api/v1/parent/children/:studentId/behavior/:recordId
```

Parent Behavior routes expose approved positive/negative Behavior records for a linked child.

The `studentId` must belong to the authenticated parent in the current school context.

## Behavior is not Discipline

Frontend must not treat Behavior routes as mixed feeds.

Use Behavior routes for:

- positive records
- negative records
- behavior category labels
- behavior point totals
- approved record details

Use Discipline routes for mixed Attendance + Behavior timelines.

## Student Discipline

```http
GET /api/v1/student/discipline
GET /api/v1/student/discipline/summary
```

Ownership rule:

- The backend derives the current student from the authenticated user.
- The client does not pass arbitrary `studentId`.
- The access service resolves current student + active enrollment.

## Parent Discipline

```http
GET /api/v1/parent/children/:studentId/discipline
GET /api/v1/parent/children/:studentId/discipline/summary
```

Ownership rule:

- The parent must be linked to the child.
- The child must have an active enrollment in the current school scope.
- Unlinked or cross-school child ids must not leak resource existence.

## Discipline filters

```text
sourceType=attendance|behavior
itemType=absence|lateness|early_leave|excused|positive|negative
type=absence|lateness|early_leave|excused|positive|negative
fromDate=YYYY-MM-DD
toDate=YYYY-MM-DD
page=1
limit=20
```

## App-facing response principles

Student/Parent app-facing responses are safe DTOs, not raw Prisma models.

They include semantic fields such as:

- `sourceType`
- `itemType`
- `occurredAt`
- `title`
- `severity`
- `pointsDelta`
- `category`
- `attendance`

They must not include source-owner internals such as:

- raw `schoolId`
- raw `organizationId`
- membership/role ids
- deleted-state markers
- internal audit metadata
- internal actor ids
- teacher-only notes
