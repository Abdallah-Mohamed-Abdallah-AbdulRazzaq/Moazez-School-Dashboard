# App Impact Analysis

## School Dashboard

Directly affected.

The School Dashboard must update its Academics UI contract:

- `/academics/subjects` is catalog-only.
- `/academics/subject-allocations` is the term/grade/weekly-hours matrix.
- Subject create/update forms must remove `termId` and `stage` from the submitted body.
- Stage-level UX must expand to grade rows before calling bulk allocation.

## System / Platform Dashboard

Not directly affected.

No platform-scope routes, platform controllers, platform permissions, or cross-school allocation APIs were added by this commit.

## Teacher App

Not directly affected by this commit.

Teacher app-facing academics surfaces should not call dashboard allocation matrix routes directly. Existing teacher schedule/classroom/read-model behavior may consume downstream academic setup indirectly, but this sprint did not add or change Teacher App endpoints.

## Student App

Not directly affected by this commit.

Student subject views should remain app-facing read models, not dashboard subject-allocation management APIs. The sprint reinforces that catalog subjects and allocation matrix are separate backend concepts.

## Parent App

Not directly affected by this commit.

Parent app academics surfaces should not call dashboard allocation matrix routes directly.

## Dismissal Staff App

Not affected.

No Dismissal Staff route, permission, or read model changed.

## Admissions / Registration / Other Domains

No direct effect.

This is confined to Academics subject catalog/allocation contract behavior.
