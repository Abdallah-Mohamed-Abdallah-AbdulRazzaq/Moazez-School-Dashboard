# Security, Tenancy, and Permissions

## Dashboard permissions

### Grades permissions

Implemented seed permission codes:

```text
grades.assessments.view
grades.assessments.manage
grades.assessments.publish
grades.assessments.approve
grades.assessments.lock
grades.questions.view
grades.questions.manage
grades.submissions.view
grades.submissions.submit
grades.submissions.review
grades.items.view
grades.items.manage
grades.gradebook.view
grades.rules.view
grades.rules.manage
grades.analytics.view
grades.snapshots.view
```

### Homework permissions

Implemented seed permission codes:

```text
homework.assignments.view
homework.assignments.manage
homework.targets.view
homework.targets.manage
homework.submissions.view
```

Some Homework-to-Grades sync routes require both Homework and Grades permissions, for example:

```text
homework.assignments.manage + grades.assessments.manage
homework.assignments.manage + grades.items.manage
homework.assignments.view + grades.items.view
```

## Dashboard tenancy

Dashboard Grades and Homework routes use school-scoped data access.

Security closeout verifies:

- cross-school assessment isolation.
- cross-school homework isolation.
- cross-school question/option/submission/item isolation.
- dashboard permission denial for actors without required permissions.
- Teacher, Student, and Parent app actors cannot use dashboard core routes.

## Teacher App ownership

Teacher App routes do not rely on dashboard `RequiredPermissions` for app actions.

They enforce:

- authenticated teacher role.
- teacher-owned classroom/subject/term allocation.
- same-school ownership.
- denial for unowned same-school class.
- denial for cross-school resources.

Teacher App Homework and Classroom Grades read/review/sync surfaces are allocation-scoped.

## Student App ownership

Student App routes enforce:

- authenticated current student.
- linked student identity.
- active enrollment.
- current-school scope.
- own submission / own grades only.

Student cannot access another student's homework, submissions, or grades.

## Parent App ownership

Parent App routes enforce:

- authenticated parent.
- guardian/parent linkage.
- linked-child access.
- active enrollment where required.

Parent cannot access unlinked-child or cross-school child homework/grades.

Parent App Homework/Grades is read-only in V1.

## Locked assessment protections

Locked assessments remain readable in gradebook, analytics, and overview contexts, but block protected mutations such as:

- GradeItem writes.
- question mutation.
- submission review/finalization.
- GradeItem sync.
- homework grade sync where linked to locked assessment.

## Closed/inactive term protections

Closed/inactive term protections block protected write paths across Grades and Homework sync workflows.

Examples include:

- GradeItem mutation.
- review/finalization.
- publish and protected workflow actions.
- GradeItem sync.
- homework grade sync.

## Draft/unpublished visibility

Student and Parent app-facing grade reads hide draft/unpublished assessments.

Student and Parent homework surfaces show only assigned visible homework according to assignment lifecycle and target visibility.

## Safe error behavior

Accepted convention:

- unauthenticated actors receive 401.
- authenticated but unauthorized actors receive 403.
- cross-school and unowned resources return safe 404/403 according to module conventions.
- hidden IDs and internal identifiers are not serialized into safe not-found responses.
