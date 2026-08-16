# Errors and Edge Cases

## Subject Catalog Edge Cases

### `termId` or `stage` sent on create/update

Expected: validation error because these fields are no longer whitelisted in the DTO.

Frontend action: remove these fields from subject create/update payloads.

### `GET /academics/subjects?termId=...`

Expected: still returns the catalog. It does not become an allocation endpoint.

Frontend action: use `/academics/subject-allocations` for term/grade assignment reads.

### Duplicate subject code

Expected: conflict through existing subject code uniqueness behavior.

## Subject Allocation Edge Cases

### Closed term on bulk save

Expected: rejected because bulk save requires active/open term.

### Invalid grade/subject/term

Expected: invalid scope error.

### Inactive subject

Expected: invalid scope error with subject inactive reason.

### Duplicate pair inside bulk request

Expected: duplicate pair error for repeated `(gradeId, subjectId)`.

### Weekly hours outside range

Expected: invalid weekly hours error for values outside `0..80` or non-integers.

### Stage-level allocation

Expected: not supported as a direct backend field. UI must resolve stage to grades first.
