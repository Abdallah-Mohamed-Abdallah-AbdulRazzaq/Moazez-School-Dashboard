# Moazez Backend Dashboard - Complete Implementation Documentation

## Document status

- Repository: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Reviewed branch: `main`
- Current reviewed main commit: `a372f97829dfff6833b0b8d850164bb7fb638f75`
- Accepted runtime baseline documented by the repository: `d72b0f5e9f786e3f39a6526a469ff9bf0fd287b7`
- Review date: `2026-07-15`
- Review method: current controllers, DTOs, application services/use cases, domain rules, repositories, presenters, Prisma schema/migrations, seeds, and tests were inspected through the GitHub repository connector.
- Repository modifications made by this review: none.
- Tests executed by this review: none. Test results in this package are explicitly identified as repository closeout evidence.

## Executive conclusion

The current Dashboard backend is a School Dashboard app-facing composition and read-model feature. It aggregates operational truth from Admissions, Students, Academics, Attendance, Grades, Homework, Behavior, Reinforcement, Communication, Settings/IAM, Academic Calendar, and AuditLog. It does not take ownership of those domains or write into them.

`DashboardTodo` is the only Dashboard-owned persistence model. Todo operations write personal, owner-scoped data for the authenticated school-management actor. All other Dashboard surfaces are request-time reads or computations.

The accepted V1 Dashboard contract contains:

- 17 HTTP routes.
- 10 Dashboard permissions.
- 19 fixed widgets.
- 10 fixed module pages.
- 37 analytics chart definitions.
- 33 computed analytics charts.
- 4 truthful definition-only charts.
- Summary, Alerts, Activity Feed, Command Center, Light Mode Dropdown, Todos, Widgets, Module Pages, Analytics, Academic Calendar preview, and cross-module planner composition.

## Package contents

- `DASHBOARD_COMPLETE_DOCUMENTATION.md` - consolidated master document.
1. `01_FEATURE_OVERVIEW_AND_ARCHITECTURE.md`
2. `02_API_INTEGRATION_CONTRACTS.md`
3. `03_DATA_LOGIC_AND_ANALYTICS.md`
4. `04_SECURITY_TENANCY_PERMISSIONS.md`
5. `05_PERSISTENCE_MIGRATIONS_AND_SIDE_EFFECTS.md`
6. `06_TESTING_GUIDE_AND_EVIDENCE.md`
7. `07_DEFERRED_NON_GOALS_AND_FINDINGS.md`
8. `08_SOURCE_FILE_INVENTORY.md`
9. `dashboard-api-tests.http`

## Product-surface impact

| Product surface | Impact |
| --- | --- |
| School Dashboard | Direct. This is the owning API surface. |
| Platform/System Dashboard | No platform-wide or multi-school Dashboard API. A platform actor still needs active school scope for these routes. |
| Teacher App | No direct Dashboard contract or Dashboard permission. Teacher data can contribute to core-domain aggregates. |
| Student App | No direct Dashboard contract or Dashboard permission. Student/enrollment activity can contribute to aggregates. |
| Parent App | No direct Dashboard contract or Dashboard permission. Guardian-related core data can contribute to aggregates. |
| Applicant Portal | No direct Dashboard route. Admissions source data can contribute to Dashboard calculations. |
| Dismissal Staff App | No direct Dashboard route or permission. |

## Integration starting point

For frontend implementation, begin with:

- `GET /api/v1/dashboard/command-center` for the primary operational overview.
- `GET /api/v1/dashboard/widgets` for the fixed widget registry and data.
- `GET /api/v1/dashboard/modules` and `GET /api/v1/dashboard/modules/:moduleKey` for module-level pages.
- `GET /api/v1/dashboard/analytics/charts/:chartKey/data` for standalone analytics data.
- `GET /api/v1/dashboard/light-mode-dropdown` for location, selected-day planner, and personal Todos.

Use the exact permissions and request shapes documented in `02_API_INTEGRATION_CONTRACTS.md`.
