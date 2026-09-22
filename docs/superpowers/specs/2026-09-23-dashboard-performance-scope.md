# Dashboard Performance Scope

## Goal

Reduce avoidable dashboard requests and improve time to useful content while keeping the current API contracts, permissions, and visible data.

## Observed behavior

- `SchoolDashboardContainer` independently loads summary, alert preview, activity preview, and module list after permission and academic context readiness.
- `DashboardIntelligencePanel` loads command center, widget preview, analytics chart list, and todos together, then requests data for up to two charts. Changing only its analytics range repeats the other requests.
- `DashboardAnalyticsPage` requests up to 100 chart definitions and requests data for every returned chart when the resolved queries change.
- The home refresh control reloads container data. The intelligence panel has its own refresh control. Loaded module details remain in the container cache.
- The home view imports chart rendering components directly.

These are code observations, not measured performance results. Record a baseline before changing behavior.

## Requirements

1. Preserve current permission checks, API payloads, translations, and visible dashboard content.
2. Changing analytics range on the home panel reloads only affected analytics data.
3. Obsolete responses cannot replace data for a newer range, filter, or academic context.
4. The analytics page limits simultaneous chart-data requests and starts with visible charts, while all charts remain reachable by scrolling.
5. Home refresh updates its related sections consistently, reloads the selected module detail, and invalidates other cached module details.
6. Use existing components from `src/components/ui` for any new loading or status UI.
7. Record before and after request counts, transferred bytes, and useful-content timing for the same account, permissions, academic context, and network profile. Report results without an unmeasured speed claim.

## Delivery boundaries

- Keep home request lifecycle changes and analytics-page chart loading as separate tasks and pull requests.
- Do not change backend code, API contracts, authentication, deployment configuration, or unrelated dashboard pages.
- Apply clean-code-guard to production code changes and test-guard to test changes.
- Run focused tests, lint, typecheck, and build as appropriate. Ask the owner before running the full test suite.
