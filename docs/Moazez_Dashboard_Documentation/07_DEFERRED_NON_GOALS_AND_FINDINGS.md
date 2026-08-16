# Dashboard Deferred Work, Non-Goals, and Review Findings

## 1. Final V1 status

The repository classifies the accepted Dashboard V1 contract as complete and closed. The limitations below are explicit extensions or non-goals, not hidden blockers.

## 2. Accepted limitations

### Definition-only analytics

- `admissions.funnel`
- `academics.structure_readiness`
- `academics.subject_allocation_coverage`
- `settings.notification_readiness`

No formula is fabricated. Each remains discoverable in the catalog and safely reports not implemented.

### Weather provider

The Light Mode contract exposes a stable unavailable state. There is:

- no external provider call
- no provider secret
- no cache
- no forecast data

Planner/Todo data remains available independently.

### Alerts lifecycle

Alerts are request-time signals. There is no:

- acknowledge
- dismiss
- snooze
- persisted alert identity
- per-user alert state

### Realtime

There is no Dashboard Socket.io subscription or invalidation/replay contract. All data is request-time.

### Performance and cache

The code uses bounded queries and selective composition, but no production latency SLO, query-plan proof, load test, or cache benefit claim exists.

## 3. Out of scope for V1

- custom Dashboard layouts
- saved dashboards
- user widget preferences
- advanced analytics/query builder
- platform-wide multi-school Dashboard
- database RLS migration
- arbitrary Dashboard-to-source action dispatch

## 4. Planner extensions not implemented

- standalone planner endpoint
- date-range planner browsing/export
- recurrence
- reminders
- ICS export
- meeting requests
- scheduled announcements as planner items
- timetable-derived recurring schedule instances
- automatic attendance-session generation
- heuristic deduplication across independent source facts

## 5. Confirmed absent API routes

- alert acknowledge/dismiss/snooze
- activity read/pin/comment
- custom layout/saved dashboard
- analytics builder
- standalone/date-range planner
- Weather provider management/mutation

## 6. Important implementation observations

### 6.1 Module Page analytics is intentionally narrower than standalone analytics

Module detail returns chart definitions for the module but its inline `availableData` is limited to already composable operational snapshots. The standalone chart data endpoint is the authoritative surface for the full 33-chart computed capability.

This is a bounded-fanout decision, not evidence that those charts are missing.

### 6.2 Activity text has controlled fallback behavior

Important known audit event paths have explicit titles/descriptions. Other valid events from an approved source module can be presented through a generic humanized fallback. This makes the feed forward-compatible while preserving source allowlisting.

### 6.3 Todo POST has no retry key

Clients should not automatically retry Todo creation without understanding that duplicate records can be created. There is no `Idempotency-Key` contract.

### 6.4 Dashboard is school-operational, not platform-operational

Even when a platform super admin has the permission code, the feature requires active school context. A separate platform-wide Dashboard would need a different contract and authorization model.

### 6.5 No direct app-facing impact

Teacher, Student, Parent, Applicant, and Dismissal Staff applications do not consume these Dashboard routes by default and their system roles receive no Dashboard permissions. Their source-domain actions can affect aggregate values, but no app contract is redefined.

## 7. Future triggers

A future phase should begin only after an explicit decision for the relevant source of truth:

- analytics formula/model decision for the four definition-only charts
- provider-neutral Weather contract and privacy/cache rules
- alert ownership and lifecycle semantics
- realtime subscription, authorization, replay, and invalidation rules
- measured production performance need
- planner range/recurrence/reminder identity model
