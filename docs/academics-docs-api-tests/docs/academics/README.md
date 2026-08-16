# Academics V1 Backend Documentation

## Status

Academics V1 backend is complete for the accepted V1 backend scope.

The implemented surface covers:

- School Dashboard Academics.
- Teacher App Academics.
- Student App Academics.
- Parent App Academics.
- School-scoped tenancy enforcement.
- Role-specific app-facing access boundaries.
- Closed-term mutation protections.
- Soft-delete filtering.
- Safe response shaping.
- Final E2E and security sweep coverage.

## High-level mental model

Academics is not a single flat CRUD module. It is a group of related backend surfaces:

```text
Academics V1
├── Dashboard / School Admin side
│   ├── Overview
│   ├── Academic structure
│   ├── Rooms
│   ├── Subjects
│   ├── Subject allocation weekly-hours matrix
│   ├── Teacher allocation workflows
│   ├── Timetable workflows
│   ├── Academic calendar CRUD
│   ├── Curriculum / units / lessons / content
│   └── Lesson plans / lesson plan items / planning workflows
│
├── Teacher App side
│   ├── Schedule
│   ├── Calendar
│   └── Lesson preparation read/status workflow
│
├── Student App side
│   ├── Schedule
│   ├── Subjects
│   ├── Calendar
│   └── Lesson content read workflow
│
└── Parent App side
    ├── Child schedule
    ├── Child calendar
    └── Child lesson content read workflow
```

Dashboard Academics is a management surface protected by dashboard permissions.

Teacher, Student, and Parent Academics are app-facing surfaces. They do not reuse dashboard permissions. They use role-specific access services and ownership rules.

## Base URL convention

All paths below assume the global API prefix:

```http
/api/v1
```

For example:

```http
GET /api/v1/academics/overview
```

## Documentation files

| File | Purpose |
| --- | --- |
| `OVERVIEW.md` | Full implementation summary and boundaries. |
| `DASHBOARD_ACADEMICS.md` | Dashboard-side Academics logic. |
| `TEACHER_APP_ACADEMICS.md` | Teacher App schedule, calendar, lesson-preparation. |
| `STUDENT_APP_ACADEMICS.md` | Student App schedule, subjects, calendar, lessons. |
| `PARENT_APP_ACADEMICS.md` | Parent child schedule, calendar, lessons. |
| `API_REFERENCE.md` | Implemented route inventory. |
| `DATA_MODEL.md` | Main Prisma models and relationships. |
| `WORKFLOWS_AND_LIFECYCLES.md` | Operational workflows and state transitions. |
| `SECURITY_TENANCY_PERMISSIONS.md` | Permissions, role isolation, tenancy. |
| `CLOSED_TERM_SOFT_DELETE_SAFE_RESPONSES.md` | Closed-term, soft-delete, safe response details. |
| `ERRORS_AND_NON_GOALS.md` | Important errors and explicit non-goals. |
| `TESTING_GUIDE.md` | Verification commands and expected coverage. |
| `API_TESTS.http` | Manual request collection with placeholders. |

## Key conclusions

- Dashboard Academics is permission-based and school-scoped.
- Teacher App is teacher-owned allocation based.
- Student App is linked-student + active-enrollment based.
- Parent App is guardian-linked-child based.
- Student and Parent lesson surfaces are read-only.
- Teacher lesson preparation supports limited status updates only.
- Lesson content file exposure is metadata-only.
- Signed URLs and direct file downloads are intentionally out of scope.
- Closed terms block mutations.
- Soft-deleted records are filtered out of normal reads.
