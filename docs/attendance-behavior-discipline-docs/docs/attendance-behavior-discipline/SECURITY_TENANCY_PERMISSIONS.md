# Security, Tenancy, and Permissions

## Global security model

All persisted data access must resolve:

1. Authenticated actor.
2. User type.
3. Active membership and school scope.
4. Permission or app-facing ownership rule.
5. Resource ownership.

## Dashboard/Admin permissions

### Attendance

```text
attendance.policies.view
attendance.policies.manage
attendance.sessions.view
attendance.sessions.manage
attendance.sessions.submit
attendance.entries.manage
attendance.absences.view
attendance.excuses.view
attendance.excuses.manage
attendance.excuses.review
attendance.reports.view
```

### Behavior

```text
behavior.overview.view
behavior.categories.view
behavior.categories.manage
behavior.records.view
behavior.records.create
behavior.records.manage
behavior.records.review
behavior.points.view
```

## App-facing ownership boundaries

### Teacher App Attendance

- Actor must be a teacher.
- Teacher must have active membership.
- `classId` must resolve to an owned `TeacherSubjectAllocation.id`.
- Same-school unowned and cross-school allocation ids must not leak existence.
- Teacher App writes delegate to Core Attendance.

### Student Discipline / Behavior

- Actor must be a student.
- Backend resolves current `Student` and active enrollment.
- Client never passes arbitrary student ids to Student App routes.
- Student can read only current-student data.

### Parent Discipline / Behavior / Reports

- Actor must be a parent.
- Backend verifies linked-child ownership through Parent App access service.
- Child must have active enrollment in current school scope.
- Unlinked and cross-school children must be hidden through safe denial/not-found behavior.

## Derived Discipline read safety

The derived Discipline repository reads only:

- Submitted attendance sessions.
- Attendance incident statuses: absent, late, early leave, excused.
- Approved behavior records.
- Non-deleted source rows.
- Current student/enrollment/year/term scope.

It does not perform mutations.

## Closed-term behavior

- Attendance writes are blocked for inactive/closed terms.
- Attendance reads remain allowed.
- Discipline reads remain allowed because they are read-only.
- Teacher App Attendance writes inherit Core Attendance closed-term protection.

## Safe response rules

App-facing responses must not expose:

```text
schoolId
organizationId
membershipId
roleId
deletedAt
passwordHash
reviewedById
submittedById
markedById
createdById
updatedById
bucket
objectKey
signedUrl
raw metadata
internal audit metadata
```

## Direct core route usage by apps

Student and Parent mobile surfaces should not call core Dashboard/Admin Attendance routes unless product explicitly approves that cross-surface behavior.

Teacher App uses its own attendance adapter routes under `/teacher/classroom/:classId/attendance/*`.

## Read-only surfaces

The following are read-only in V1:

- Student Discipline.
- Parent Discipline.
- Parent Reports.
- Teacher Attendance `today` read route.
