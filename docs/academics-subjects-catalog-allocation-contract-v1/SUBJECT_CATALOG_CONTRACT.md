# Subject Catalog Contract

## Concept

A Subject is a school-scoped catalog item. It describes the subject itself, not where or when it is taught.

## Database Model

`Subject` contains catalog fields:

- `id`
- `schoolId`
- `nameAr`
- `nameEn`
- `code`
- `color`
- `isActive`
- timestamps and soft-delete metadata

`Subject` does not contain:

- `termId`
- `stage`
- `gradeId`
- `weeklyHours`

## Create / Update DTO

Allowed fields:

```json
{
  "name": "Mathematics",
  "nameAr": "الرياضيات",
  "nameEn": "Mathematics",
  "code": "MATH",
  "color": "#3366ff",
  "isActive": true
}
```

Rejected/non-contract fields:

```json
{
  "termId": "uuid",
  "stage": "Primary"
}
```

Because global validation is whitelist-based, these removed fields are treated as non-whitelisted client input on create/update.

## Response Shape

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

## Response Guarantees

The response must not include:

- `termId`
- `stage`
- `schoolId`
- `organizationId`
- `membershipId`
- `roleId`
- `deletedAt`
- `createdAt`
- `updatedAt`
- raw Prisma relation objects

## Catalog-Only Read Behavior

`GET /api/v1/academics/subjects` lists the school subject catalog. Supplying a `termId` query parameter must not turn it into an allocation read endpoint.

Correct allocation reads must use:

```http
GET /api/v1/academics/subject-allocations?termId={{termId}}&gradeId={{gradeId}}
```
