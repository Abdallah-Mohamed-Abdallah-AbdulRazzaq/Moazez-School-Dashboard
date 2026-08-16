# Dashboard Module

## Purpose

The Dashboard module is a backend-native, school-scoped, read-only aggregation layer. It exposes operational views for a school admin style dashboard without owning source-of-truth records and without introducing dashboard-specific storage.

Dashboard reads existing module data from admissions, students, academics, attendance, grades, homework, behavior, reinforcement, communication, settings, and audit logs, then returns safe DTOs for the frontend.

## Implemented backend surfaces

The current Dashboard foundation exposes exactly three HTTP routes:

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dashboard/summary` | `dashboard.summary.view` | Aggregated KPI cards and compact alert preview. |
| `GET` | `/api/v1/dashboard/alerts` | `dashboard.alerts.view` | Computed operational alerts from current source-domain signals. |
| `GET` | `/api/v1/dashboard/activity-feed` | `dashboard.activity_feed.view` | Audit-backed operational activity feed for the current school. |

There are no Dashboard create, update, delete, acknowledge, dismiss, pin, realtime, notification, or analytics-builder routes in the current foundation.

## Runtime model

Dashboard is not a platform-level dashboard. It requires an authenticated actor with an active school membership. The active school and organization come from request context, then downstream reads are school-scoped.

Summary and Alerts use `prisma.scoped` reads so the Prisma school-scope extension applies the active school filter on school-scoped models. Activity Feed uses `AuditLog`, which is intentionally handled with an explicit `schoolId` filter because audit logs are platform-sensitive and excluded from automatic school-scope injection.

## Module architecture

The module follows the established project layering:

```text
src/modules/dashboard/
  application/      use cases and aggregation orchestration
  controller/       HTTP routing only
  dto/              request and response contracts
  infrastructure/   Prisma read repositories
  presenters/       safe response shaping
  tests/            module-local unit coverage
  dashboard-context.ts
  dashboard.module.ts
```

`DashboardController` is intentionally thin. Business logic belongs in use cases, database reads belong in repositories, and response shaping belongs in presenters.

## Main concepts

### Summary

The summary endpoint returns a generated timestamp, school display information, active academic context, KPI cards, compact alert preview, and deferred markers.

### Alerts

The alerts endpoint computes operational alerts at read time. Alerts are not persisted, acknowledged, dismissed, snoozed, or marked as read in the current implementation.

### Activity Feed

The activity feed endpoint maps successful `AuditLog` records for the current school into dashboard activity items with stable event types, actor metadata, subject metadata, and cursor pagination.

## Safe response principle

Dashboard responses are intentionally shaped DTOs. They should not expose raw Prisma records, raw audit payloads, JWT/session data, storage internals, `organizationId`, `schoolId`, or private tenant identifiers unless a future approved contract explicitly requires it.

## Non-goals in the current foundation

- Persisted dashboard alerts.
- Alert lifecycle actions.
- Activity read state.
- Pinning or comments.
- Realtime updates.
- Notification side effects.
- Analytics builder.
- Custom widgets.
- Platform-level dashboard.
