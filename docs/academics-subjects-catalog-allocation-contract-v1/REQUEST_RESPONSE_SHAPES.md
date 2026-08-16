# Request / Response Shapes

## Create Subject

```http
POST /api/v1/academics/subjects
```

```json
{
  "nameAr": "الرياضيات",
  "nameEn": "Mathematics",
  "code": "MATH",
  "color": "#3366ff",
  "isActive": true
}
```

Response:

```json
{
  "id": "uuid",
  "name": "Mathematics",
  "nameAr": "الرياضيات",
  "nameEn": "Mathematics",
  "code": "MATH",
  "color": "#3366ff",
  "isActive": true
}
```

## Invalid Subject Create

```json
{
  "nameEn": "Mathematics",
  "termId": "uuid"
}
```

Expected result: validation rejection because `termId` is no longer part of `CreateSubjectDto`.

## Update Subject

```http
PATCH /api/v1/academics/subjects/{{subjectId}}
```

```json
{
  "nameEn": "Advanced Mathematics",
  "color": "#8844ff"
}
```

Response remains catalog-only.

## List Subject Allocations

```http
GET /api/v1/academics/subject-allocations?termId={{termId}}&gradeId={{gradeId}}
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "academicYearId": "uuid",
      "termId": "uuid",
      "gradeId": "uuid",
      "subjectId": "uuid",
      "weeklyHours": 5,
      "grade": {
        "id": "uuid",
        "nameAr": "الصف الأول",
        "nameEn": "Grade 1"
      },
      "subject": {
        "id": "uuid",
        "nameAr": "الرياضيات",
        "nameEn": "Mathematics",
        "code": "MATH",
        "color": "#3366ff"
      },
      "createdAt": "2026-07-08T00:00:00.000Z",
      "updatedAt": "2026-07-08T00:00:00.000Z"
    }
  ]
}
```

## Bulk Save Allocations

```http
PUT /api/v1/academics/subject-allocations/bulk
```

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

Response returns the affected allocation rows.
