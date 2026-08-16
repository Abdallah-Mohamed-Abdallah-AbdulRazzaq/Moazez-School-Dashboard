# Dashboard API Delta

## Affected Route Family

Base route:

```http
/api/v1/grades/assessments
```

Controller routes remain unchanged. The contract behavior changed under existing routes.

## List Assessments

```http
GET /api/v1/grades/assessments
```

### New/Corrected Behavior

- Default response includes both `SCORE_ONLY` and `QUESTION_BASED` assessments.
- Existing tenant, school, academic scope, status, type, search, date, and soft-delete filtering remain in force.
- The list does not create a participant/student/app-specific view; it is still a dashboard/core Grades surface.

### Optional Filter

```http
GET /api/v1/grades/assessments?deliveryMode=question_based
GET /api/v1/grades/assessments?deliveryMode=score_only
```

Supported accepted values:

```text
score_only
SCORE_ONLY
question_based
QUESTION_BASED
```

The filter is normalized and applied only when provided.

## Assessment Detail

```http
GET /api/v1/grades/assessments/:assessmentId
```

### New/Corrected Behavior

- Returns safe `GradeAssessmentResponseDto` shape for both `SCORE_ONLY` and `QUESTION_BASED`.
- Missing records still return not found through the existing domain exception convention.
- Detail does not embed question content, options, answer keys, correct answers, or submission internals.

## Patch Assessment

```http
PATCH /api/v1/grades/assessments/:assessmentId
```

### New/Corrected Behavior

Draft, unlocked, writable-term assessments can be patched regardless of delivery mode.

Still blocked:

- Published assessments
- Approved assessments
- Locked assessments
- Closed/inactive-term assessments
- Protected changes

### Delivery Mode Conversion

`UpdateGradeAssessmentDto` does not accept `deliveryMode`, and the patch path never writes delivery mode. Converting a score-only assessment into a question-based assessment, or the reverse, remains unsupported.

## Delete Assessment

```http
DELETE /api/v1/grades/assessments/:assessmentId
```

### New/Corrected Behavior

Draft, unlocked, writable-term assessments can be soft-deleted for both delivery modes when no blocking dependencies exist.

Blocked when:

- Grade items exist
- Submissions exist
- Assessment is published
- Assessment is approved
- Assessment is locked
- Term is closed/inactive

For draft question-based assessments, deletion soft-deletes only the parent assessment. Existing child questions are not hard-deleted; they become inaccessible through normal parent-loaded question routes.

## Lock Assessment

```http
POST /api/v1/grades/assessments/:assessmentId/lock
```

### New/Corrected Behavior

Approved, unlocked, writable-term assessments can be locked for both delivery modes.

Still blocked:

- Draft assessments
- Published but not approved assessments
- Already locked assessments
- Closed/inactive-term assessments

Audit behavior is preserved.
