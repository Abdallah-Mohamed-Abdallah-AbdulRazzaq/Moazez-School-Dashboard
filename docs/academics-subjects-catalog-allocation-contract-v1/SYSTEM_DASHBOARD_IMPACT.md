# System / Platform Dashboard Impact

## Direct Platform Impact

No direct Platform/System Dashboard API was added or changed by this sprint.

There are no new routes under:

```text
/api/v1/platform-admin/*
```

for subject catalog or subject allocation management.

## Platform Users

Platform users do not gain direct platform-scope subject catalog or allocation management in this sprint. The implemented routes remain school-scoped Academics routes and rely on active school membership and school permissions.

## Operational Impact

The Platform/System Dashboard may only be indirectly affected if it displays API documentation, feature readiness, or school setup status that references Academics subject setup. In that case, the text should reflect:

```text
Subjects are catalog records.
SubjectAllocations define term/grade/weekly-hours assignment.
```

## What Not To Build From This Sprint

- Do not add Platform Admin subject management UI from this commit alone.
- Do not call `/platform-admin/...` routes for subject allocation; none exist.
- Do not assume cross-school platform-bypass subject allocation APIs were implemented.

## Correct Product Statement

This sprint is a school-dashboard contract clarification, not a platform dashboard feature expansion.
