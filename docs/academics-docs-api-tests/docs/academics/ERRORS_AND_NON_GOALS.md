# Academics V1 Errors and Non-Goals

## Error handling principles

Academics follows the project-wide domain exception envelope and safe error behavior.

Important principles:

- Permission failures return forbidden behavior.
- Unauthenticated requests return unauthorized behavior.
- Cross-school or inaccessible detail reads return safe not-found behavior.
- Closed-term mutations return conflict behavior.
- Invalid teacher lesson status values return validation/domain errors.
- Invalid teacher lesson status transitions return domain errors.
- Archived/read-only curriculum or lesson plan mutation attempts return read-only/domain errors.

## Representative error cases

### Missing dashboard permission

Dashboard Academics routes require specific permissions. A school user without the required permission is denied.

### Cross-school dashboard detail read

A user from School A trying to fetch School B's curriculum/calendar/lesson plan detail should receive a safe 404 response without hidden School B IDs serialized in the response.

### Closed-term mutation

Mutating closed-term resources is rejected.

Example code observed in the final security sweep:

```text
academics.subject_allocation.closed_term
```

### Teacher lesson-preparation invalid status

Teacher status update accepts only:

```text
planned
in_progress
done
skipped
```

Values such as `prepared` are rejected.

### Teacher lesson-preparation invalid transition

Allowed transitions:

```text
PLANNED     -> IN_PROGRESS | DONE | SKIPPED
IN_PROGRESS -> DONE | SKIPPED
DONE        -> no transition
SKIPPED     -> no transition
RESCHEDULED -> no transition
CANCELLED   -> no transition
```

Other transitions are rejected.

### Student/Parent lesson mutation

Student/Parent lesson mutation routes do not exist in V1.

Requests to non-existent routes should not be documented as supported APIs.

## Explicit non-goals

The following are intentionally outside Academics V1 backend scope:

- Signed file URLs.
- Direct file downloads.
- Student lesson status mutation.
- Parent lesson status mutation.
- Lesson completion/progress tracking for students or parents.
- A `PREPARED` lesson status.
- New dashboard permission families beyond accepted ones.
- App home composition enrichment.
- Notification/reminder features.
- AI lesson planning.
- Advanced analytics.
- Frontend/API redesign.
- Timetable publication gate changes beyond accepted V1 behavior.
- Teacher qualification model beyond accepted allocation validation.
- Persisted teacher max-load policy unless already implemented.

## Important documentation rule

Do not document future/non-goal endpoints as implemented.

Especially do not document these as existing:

```http
POST /api/v1/student/lessons
PATCH /api/v1/student/lessons/:lessonPlanItemId/status
POST /api/v1/parent/children/:studentId/lessons
PATCH /api/v1/parent/children/:studentId/lessons/:lessonPlanItemId/status
```
