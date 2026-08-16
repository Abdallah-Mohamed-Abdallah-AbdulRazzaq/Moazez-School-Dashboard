# Dashboard Source File Inventory

## 1. Review scope

The review covered the Dashboard module itself and the cross-module repositories/models required to explain its actual logic. Historical closeout documents were used as supporting evidence only after current code inspection.

## 2. Module and controllers

- `src/modules/dashboard/dashboard.module.ts`
- `src/modules/dashboard/controller/dashboard.controller.ts`
- `src/modules/dashboard/controller/dashboard-todos.controller.ts`
- `src/modules/dashboard/dashboard-context.ts`

## 3. Application layer

- `application/get-dashboard-summary.use-case.ts`
- `application/list-dashboard-alerts.use-case.ts`
- `application/list-dashboard-activity-feed.use-case.ts`
- `application/get-dashboard-command-center.use-case.ts`
- `application/get-dashboard-light-mode-dropdown.use-case.ts`
- `application/list-dashboard-todos.use-case.ts`
- `application/create-dashboard-todo.use-case.ts`
- `application/update-dashboard-todo.use-case.ts`
- `application/delete-dashboard-todo.use-case.ts`
- `application/dashboard-todo.helpers.ts`
- `application/list-dashboard-modules.use-case.ts`
- `application/get-dashboard-module-page.use-case.ts`
- `application/list-dashboard-widgets.use-case.ts`
- `application/get-dashboard-widget.use-case.ts`
- `application/get-dashboard-analytics-catalog.use-case.ts`
- `application/list-dashboard-analytics-charts.use-case.ts`
- `application/get-dashboard-analytics-chart.use-case.ts`
- `application/get-dashboard-analytics-chart-data.use-case.ts`
- `application/dashboard-analytics-query-context.service.ts`
- `application/dashboard-time-context.service.ts`
- `application/dashboard-widget-composition.service.ts`

## 4. Domain layer

- `domain/dashboard-time-context.ts`
- `domain/dashboard-widget-registry.ts`
- `domain/dashboard-widget-composition.ts`
- `domain/dashboard-module-pages.ts`
- `domain/dashboard-analytics-catalog.ts`
- `domain/dashboard-analytics-data-pack.ts`
- `domain/dashboard-analytics-query.ts`
- `domain/dashboard-analytics-coordinate.ts`
- `domain/dashboard-analytics-buckets.ts`
- `domain/dashboard-attendance-analytics-buckets.ts`
- `domain/dashboard-attendance-analytics.ts`
- `domain/dashboard-admissions-students-analytics.ts`
- `domain/dashboard-academics-analytics.ts`
- `domain/dashboard-grades-homework-analytics.ts`
- `domain/dashboard-behavior-reinforcement-analytics.ts`
- `domain/dashboard-communication-settings-analytics.ts`

## 5. Infrastructure/read repositories

- `infrastructure/dashboard-summary.repository.ts`
- `infrastructure/dashboard-alerts.repository.ts`
- `infrastructure/dashboard-activity-feed.repository.ts`
- `infrastructure/dashboard-time-context.repository.ts`
- `infrastructure/dashboard-light-mode-dropdown.repository.ts`
- `infrastructure/dashboard-todos.repository.ts`
- `infrastructure/dashboard-planner-calendar.repository.ts`
- `infrastructure/dashboard-planner-items.repository.ts`
- `infrastructure/dashboard-analytics-hierarchy.repository.ts`
- `infrastructure/dashboard-analytics-snapshot.repository.ts`
- `infrastructure/dashboard-admissions-analytics.repository.ts`
- `infrastructure/dashboard-students-analytics.repository.ts`
- `infrastructure/dashboard-academics-analytics.repository.ts`
- `infrastructure/dashboard-grades-analytics.repository.ts`
- `infrastructure/dashboard-homework-analytics.repository.ts`
- `infrastructure/dashboard-behavior-analytics.repository.ts`
- `infrastructure/dashboard-reinforcement-analytics.repository.ts`
- `infrastructure/dashboard-communication-analytics.repository.ts`
- `src/modules/attendance/reports/infrastructure/attendance-dashboard-analytics.repository.ts`

## 6. Presenters

- `presenters/dashboard-summary.presenter.ts`
- `presenters/dashboard-alerts.presenter.ts`
- `presenters/dashboard-activity-feed.presenter.ts`
- `presenters/dashboard-command-center.presenter.ts`
- `presenters/dashboard-light-mode-dropdown.presenter.ts`
- `presenters/dashboard-todos.presenter.ts`
- `presenters/dashboard-modules.presenter.ts`
- `presenters/dashboard-widgets.presenter.ts`
- `presenters/dashboard-analytics.presenter.ts`
- `presenters/dashboard-analytics-data.presenter.ts`
- `presenters/dashboard-metadata.presenter.ts`

## 7. DTOs

- `dto/dashboard-summary.dto.ts`
- `dto/dashboard-alerts.dto.ts`
- `dto/dashboard-activity-feed.dto.ts`
- `dto/dashboard-command-center.dto.ts`
- `dto/dashboard-light-mode-dropdown.dto.ts`
- `dto/dashboard-todos.dto.ts`
- `dto/dashboard-modules.dto.ts`
- `dto/dashboard-widgets.dto.ts`
- `dto/dashboard-analytics.dto.ts`
- `dto/dashboard-analytics-data.dto.ts`
- `dto/dashboard-metadata.dto.ts`

## 8. Persistence and authorization

- `prisma/schema.prisma`
- `prisma/migrations/20260710135222_baseline_v1/migration.sql`
- `prisma/migrations/20260711162248_dashboard_todos/migration.sql`
- `prisma/seeds/01-permissions.seed.ts`
- `prisma/seeds/02-system-roles.seed.ts`
- `src/infrastructure/database/school-scope.extension.ts`
- `src/common/guards/permissions.guard.ts`
- request-context and standard authentication/scope guards

## 9. E2E tests

- `test/e2e/dashboard-activity-feed-foundation.e2e-spec.ts`
- `test/e2e/dashboard-alerts-foundation.e2e-spec.ts`
- `test/e2e/dashboard-analytics-catalog-foundation.e2e-spec.ts`
- `test/e2e/dashboard-analytics-data-pack-foundation.e2e-spec.ts`
- `test/e2e/dashboard-command-center-foundation.e2e-spec.ts`
- `test/e2e/dashboard-light-mode-dropdown-foundation.e2e-spec.ts`
- `test/e2e/dashboard-module-pages-foundation.e2e-spec.ts`
- `test/e2e/dashboard-summary-foundation.e2e-spec.ts`
- `test/e2e/dashboard-todos-crud.e2e-spec.ts`
- `test/e2e/dashboard-widgets-foundation.e2e-spec.ts`

## 10. Security tests

The final closeout dynamically discovered ten current files matching `test/security/tenancy.dashboard*.spec.ts`. Named evidence includes:

- `test/security/tenancy.dashboard.spec.ts`
- `test/security/tenancy.dashboard-alerts.spec.ts`
- `test/security/tenancy.dashboard-activity-feed.spec.ts`
- `test/security/tenancy.dashboard-command-center.spec.ts`
- `test/security/tenancy.dashboard-widgets.spec.ts`
- `test/security/tenancy.dashboard-modules.spec.ts`
- Dashboard Analytics tenancy suites
- `test/security/tenancy.dashboard-light-mode-dropdown.spec.ts`
- `test/security/tenancy.dashboard-todos.spec.ts`

## 11. Unit-test families

Current Dashboard unit discovery includes tests for:

- time context and civil-date/DST helpers
- Summary repository/presenter/use case
- alert computation/repository/presenter
- activity mapping/filter/cursor/repository
- widget registry/presenter/composition plan
- module registry/presenter/use case
- Todo helpers/use cases/presenter/repository behavior
- analytics catalog/query validation/hierarchy
- coordinate and bucket contracts
- each analytics computation pack
- each aggregate repository
- Light Mode and planner adapters/presenters
- no-leak and fixed-route metadata

## 12. Supporting repository documentation inspected

- `docs/sprint-dashboard-v1-final-closeout-audit.md`
- Dashboard phase closeouts for Summary, Alerts, Activity, Command Center, Light Mode, Todos, Analytics packs, Widget composition, and Planner Calendar
- root architecture, security, Prisma, migration, testing, and API governance files

Current code and tests take precedence over historical phase statements.
