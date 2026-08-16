# Hide Admissions Overview Design

## Context

The current Admissions Overview derives analytics in the browser from leads and applications. The backend does not expose a dedicated admissions overview or analytics endpoint. `GET /dashboard/summary` contains a limited admissions card, but it is a school-wide dashboard contract and does not support the Overview's charts, date filters, or tables. Presenting locally calculated values as authoritative would create data-contract drift.

## Decision

Hide Admissions Overview until the backend provides a dedicated endpoint. Users entering Admissions should land on Applications, which is backed by the admissions applications API.

## Navigation

- Remove the Overview entry from every Admissions navigation surface.
- Keep Applications as the first visible Admissions destination.
- Do not replace Overview with a disabled item or placeholder.

## Routing

`/[lang]/admissions` will perform a server-side redirect to `/${lang}/admissions/applications`. The locale must be preserved. The redirect must happen before rendering the Admissions dashboard shell, so no client-side analytics requests or loading flash occur.

## Existing Overview Code

Retain the dashboard feature files but leave them unreachable from normal navigation and the root Admissions route. This limits regression risk and keeps the existing presentation available for reference when a backend contract is introduced. No new overview service abstraction or feature flag will be added.

## Error Handling

The redirect has no data dependency and therefore no loading or API error state. The Applications page remains responsible for its own authorization, loading, empty, and error states.

## Verification

- Verify the Admissions root route redirects while preserving both Arabic and English locale segments.
- Verify no visible Admissions navigation item links to the root Overview route.
- Run targeted lint and TypeScript checks.
- Confirm the retained Overview components are not imported by the root route.

## Deferred Backend Contract

Re-enable Overview only after the backend publishes a dedicated, permission-protected admissions overview endpoint with explicit KPI definitions, date-window behavior, academic context rules, and response schemas for every displayed chart and table.
