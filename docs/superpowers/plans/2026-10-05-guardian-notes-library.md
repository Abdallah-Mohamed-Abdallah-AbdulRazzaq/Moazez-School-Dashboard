# Guardian Notes Library Implementation Plan

**Goal:** Build the Screen 6 Guardian Notes library as a dedicated, responsive page while preserving the existing backend contract.

**Architecture:** Add a Guardian Notes model, service, and hook around the existing academic-content list endpoint. The table uses one paginated content request fixed to `GUARDIAN_WEEKLY_NOTE` and `GUARDIANS`; page statistics are derived from that same response. Reuse the shared UI kit for filters, table, actions, status, empty states, and loading states.

## Tasks

1. Add URL-safe Guardian Notes filters and a fixed backend list-query mapper.
2. Add the one-request Guardian Notes service and client hook.
3. Build the header, response-derived statistics, filters, and responsive results components.
4. Add the dedicated route/page and connect overview navigation.
5. Add English and Arabic copy for the backend-compatible UI.
6. Add focused model, service, and presentation tests.
7. Run focused tests, TypeScript, and scoped lint; then apply the clean-code and test quality gates. Do not run the full test suite without user approval.
