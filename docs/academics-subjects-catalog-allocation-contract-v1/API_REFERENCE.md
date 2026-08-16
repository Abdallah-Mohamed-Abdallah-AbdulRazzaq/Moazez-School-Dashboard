# API Reference

All routes use the global prefix:

```text
/api/v1
```

## Subject Catalog APIs

### `GET /api/v1/academics/subjects`

Permission: `academics.subjects.view`

Purpose: List school-scoped subject catalog records.

Users: School Dashboard users with subject read permission.

Notes:

- Catalog-only.
- Does not filter by `termId`.
- Does not return `termId` or `stage`.

### `POST /api/v1/academics/subjects`

Permission: `academics.subjects.manage`

Purpose: Create a school-scoped subject catalog record.

Allowed body fields:

- `name`
- `nameAr`
- `nameEn`
- `code`
- `color`
- `isActive`

Rejected/non-contract body fields:

- `termId`
- `stage`

### `PATCH /api/v1/academics/subjects/:id`

Permission: `academics.subjects.manage`

Purpose: Update catalog fields on an existing subject.

Rejected/non-contract body fields:

- `termId`
- `stage`

### `DELETE /api/v1/academics/subjects/:id`

Permission: `academics.subjects.manage`

Purpose: Soft-delete a school-scoped subject catalog record.

## Subject Allocation APIs

### `GET /api/v1/academics/subject-allocations`

Permission: `academics.structure.view`

Query filters:

| Filter | Required? | Type | Notes |
| --- | --- | --- | --- |
| `termId` | Yes | UUID | Main required filter. |
| `gradeId` | Optional | UUID | Filters allocations for one grade. |
| `subjectId` | Optional | UUID | Filters allocations for one subject. |

Purpose: Read term/grade subject allocation rows.

Users: School Dashboard users with structure read permission.

### `PUT /api/v1/academics/subject-allocations/bulk`

Permission: `academics.structure.manage`

Purpose: Create or update multiple term/grade subject allocation rows.

Body:

```json
{
  "termId": "uuid",
  "items": [
    {
      "gradeId": "uuid",
      "subjectId": "uuid",
      "weeklyHours": 5
    }
  ]
}
```

Users: School Dashboard users with structure manage permission.

## Routes Not Added

No route was added for:

- `/api/v1/platform-admin/academics/subjects`
- `/api/v1/platform-admin/academics/subject-allocations`
- `/api/v1/academics/subjects/apply-to-stage`
- `/api/v1/academics/subject-allocations/apply-to-stage`
