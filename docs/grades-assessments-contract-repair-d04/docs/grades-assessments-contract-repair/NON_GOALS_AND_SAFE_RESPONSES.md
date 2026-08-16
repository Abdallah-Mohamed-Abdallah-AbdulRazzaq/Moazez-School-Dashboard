# Non-Goals And Safe Responses

## Non-Goals

This fix did not add:

- New database schema
- New Prisma migration
- New package dependencies
- New route prefixes
- New Student App routes
- New Parent App routes
- New Teacher App routes
- New question authoring endpoints
- New answer-key exposure
- New direct GradeItem entry for question-based assessments
- New delivery-mode conversion path
- New app-facing mutation behavior

## Safe Response Contract

The repaired assessment detail route returns safe assessment metadata. It must not expose:

- Questions
- Options
- Answer keys
- Correct answers
- Submission internals
- Student answer payloads
- Review internals
- Raw Prisma internals
- Tenant internals such as school/organization/membership/role ids unless already part of an explicitly safe dashboard contract

## Delivery Mode Boundary

`deliveryMode` is now respected as an assessment record attribute across list/detail/update/delete/lock paths, but it is not mutable after creation.

Creation remains split:

- General create route: score-only only.
- Question-based create route: question-based only.

## Direct Entry Boundary

Question-based assessments must go through the submission/review/sync workflow. Direct GradeItem entry remains score-only only.
