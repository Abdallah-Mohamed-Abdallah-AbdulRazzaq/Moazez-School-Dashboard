# Academics V1 Docs + API Tests Package

This archive contains a complete documentation package for the implemented Moazez Backend Academics V1 logic.

The documentation is intentionally split into operational areas:

1. Dashboard Academics.
2. Teacher App Academics.
3. Student App Academics.
4. Parent App Academics.
5. Shared security, tenancy, permissions, closed-term protections, soft-delete filtering, safe responses, and testing guidance.

## Recommended reading order

1. `docs/academics/README.md`
2. `docs/academics/OVERVIEW.md`
3. `docs/academics/DASHBOARD_ACADEMICS.md`
4. `docs/academics/TEACHER_APP_ACADEMICS.md`
5. `docs/academics/STUDENT_APP_ACADEMICS.md`
6. `docs/academics/PARENT_APP_ACADEMICS.md`
7. `docs/academics/API_REFERENCE.md`
8. `docs/academics/SECURITY_TENANCY_PERMISSIONS.md`
9. `docs/academics/CLOSED_TERM_SOFT_DELETE_SAFE_RESPONSES.md`
10. `docs/academics/TESTING_GUIDE.md`

## Important note

The `.http` file is a manual testing aid. It contains placeholders such as `{{accessToken}}`, `{{termId}}`, and `{{lessonPlanId}}`. Replace those values with real seeded or locally created IDs before running requests.
