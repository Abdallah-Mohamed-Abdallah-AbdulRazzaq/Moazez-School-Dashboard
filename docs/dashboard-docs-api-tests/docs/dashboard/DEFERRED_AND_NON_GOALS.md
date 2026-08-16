# Dashboard Deferred Work and Non-Goals

## Why this file exists

The Dashboard foundation intentionally implements read-only backend-native surfaces. This file documents what is intentionally not implemented so future work does not accidentally treat missing lifecycle features as defects in the foundation.

## Implemented scope

Implemented:

- School-scoped summary aggregation.
- Computed operational alerts.
- Audit-backed activity feed.
- Dashboard permissions.
- School tenancy controls.
- Safe DTO presenters.
- E2E and security coverage for the foundation.

## Deferred alert capabilities

Not implemented:

- persisted alert records;
- alert ids that survive across requests;
- read/unread state;
- acknowledge;
- dismiss;
- snooze;
- alert assignment;
- alert comments;
- alert notification side effects;
- realtime alert events.

## Deferred activity feed capabilities

Not implemented:

- read state;
- pinning;
- unpinning;
- feed comments;
- feed bookmarks;
- custom feed views;
- realtime feed streaming;
- notification coupling.

## Deferred analytics capabilities

Not implemented:

- analytics builder;
- custom dashboard widgets;
- saved dashboard layouts;
- configurable KPI definitions;
- trend charts;
- forecasting;
- cross-school platform analytics.

## Explicit non-goals

The current Dashboard foundation is not:

- a write model;
- a source-of-truth module;
- a replacement for admissions, attendance, grades, homework, or other domain APIs;
- a platform admin dashboard;
- a notification engine;
- an audit log administration API;
- a report builder;
- a BI layer.

## Absent routes

The following should remain absent unless a future sprint explicitly implements them:

```text
POST /api/v1/dashboard/alerts/:alertId/read
POST /api/v1/dashboard/alerts/:alertId/acknowledge
POST /api/v1/dashboard/alerts/:alertId/dismiss
POST /api/v1/dashboard/alerts/:alertId/snooze
POST /api/v1/dashboard/activity-feed/:activityId/read
POST /api/v1/dashboard/activity-feed/:activityId/pin
POST /api/v1/dashboard/activity-feed/:activityId/unpin
POST /api/v1/dashboard/activity-feed/:activityId/comments
GET  /api/v1/dashboard/analytics-builder
POST /api/v1/dashboard/widgets
PATCH /api/v1/dashboard/widgets/:widgetId
```

## Future sprint candidates

Potential future extensions:

1. Persisted Alert Lifecycle Sprint.
2. Activity Feed Interaction Sprint.
3. Realtime Dashboard Sprint.
4. Dashboard Analytics Builder Sprint.
5. Platform-Level Dashboard Sprint.
6. Custom Widgets and Saved Layouts Sprint.

Each future sprint should add explicit contracts, permissions, route inventory tests, tenancy tests, and documentation.
