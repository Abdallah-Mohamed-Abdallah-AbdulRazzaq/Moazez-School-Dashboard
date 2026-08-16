# Subject Allocation Contract

## Concept

`SubjectAllocation` is the source of truth for assigning catalog subjects to academic terms and grades with weekly hours.

## Database Model

`SubjectAllocation` stores:

- `academicYearId`
- `termId`
- `gradeId`
- `subjectId`
- `weeklyHours`

The unique business key is:

```text
schoolId + termId + gradeId + subjectId
```

## Read API

```http
GET /api/v1/academics/subject-allocations?termId={{termId}}&gradeId={{gradeId}}&subjectId={{subjectId}}
```

Required query:

- `termId`

Optional query:

- `gradeId`
- `subjectId`

## Bulk Save API

```http
PUT /api/v1/academics/subject-allocations/bulk
```

Request:

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

## Validation Rules

- `items` must be a non-empty array.
- Max bulk size is 500 items.
- `weeklyHours` must be an integer between 0 and 80.
- Duplicate `(gradeId, subjectId)` pairs in the same request are rejected.
- `termId` must exist in current school scope.
- The term must be active/open for writes.
- Every `gradeId` must exist in current school scope.
- Every `subjectId` must exist in current school scope.
- Subject must be active.

## Stage Handling

`stage` is not an allocation key. The API does not accept `stage` or `stageId` on allocation bulk save.

If the dashboard supports stage-level UX, it should resolve the selected stage to grades and submit one row per `gradeId`.

## Timetable Relationship

Timetable validation should rely on `SubjectAllocation`, especially `weeklyHours`, rather than assuming the subject catalog carries term/grade assignment data.
