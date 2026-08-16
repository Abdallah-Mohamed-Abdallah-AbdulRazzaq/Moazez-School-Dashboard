# School Dashboard Integration

## Dashboard Areas Affected

The School Dashboard academics UI is directly affected. The frontend should treat subject catalog management and term/grade assignment as two separate screens or two separate workflow steps.

## Subject Catalog UI

Use the catalog endpoints for subject creation and maintenance:

- `GET /api/v1/academics/subjects`
- `POST /api/v1/academics/subjects`
- `PATCH /api/v1/academics/subjects/:id`
- `DELETE /api/v1/academics/subjects/:id`

This screen should allow editing only catalog fields:

- `name`
- `nameAr`
- `nameEn`
- `code`
- `color`
- `isActive`

The UI must not show `termId` or `stage` as Subject fields.

## Subject Allocation Matrix UI

Use allocation endpoints for term/grade subject assignment:

- `GET /api/v1/academics/subject-allocations?termId=...&gradeId=...`
- `PUT /api/v1/academics/subject-allocations/bulk`

This screen should allow editing:

- `termId`
- `gradeId`
- `subjectId`
- `weeklyHours`

## Suggested Dashboard Flow

```text
1. Create catalog subject.
2. Select academic term.
3. Select one grade or multiple grades.
4. Submit subject allocation rows using gradeId per row.
5. Read allocations again to refresh matrix state.
```

## Permissions

Subject catalog:

- Read: `academics.subjects.view`
- Write/delete: `academics.subjects.manage`

Subject allocation matrix:

- Read: `academics.structure.view`
- Bulk write: `academics.structure.manage`

## Why Allocation Uses Structure Permissions

The subject allocation matrix is a dashboard structure/setup matrix. It defines how subjects apply to academic grades and terms. The sprint moved these routes to `academics.structure.*` permissions so app roles that merely have subject read permissions do not gain dashboard allocation-matrix access.

## UX Warnings

- Avoid a single form that sends `termId` and `stage` to `/academics/subjects`.
- Avoid treating the subjects list as a per-term list.
- Avoid storing stage directly as allocation data.
- Avoid an `apply-to-stage` API assumption; it was not implemented in this sprint.
