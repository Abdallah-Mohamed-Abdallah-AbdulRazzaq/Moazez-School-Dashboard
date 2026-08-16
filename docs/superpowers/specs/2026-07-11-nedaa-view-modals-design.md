# Nedaa View Modals Design

## Problem

Nedaa operations can open request detail, pickup recipients, and history detail modals, but the API responses are discarded. The modal therefore renders the generic loading message even when the backend returns data.

## Design

Keep the existing `ActionModalState` as the source of which modal is open. Add separate state for each response payload, plus a shared detail loading/error state. Each opener clears stale payload state, opens the modal immediately, and loads its response. A response updates state only if the request is still relevant; failures render an error message instead of leaving the modal permanently loading.

Render compact read-only sections using fields already present in the Nedaa contracts: request identity/status/timestamps/timeline, pickup policy/recipients, and history summary/timeline. Mutation modals remain unchanged.

## Verification

Add page tests proving each view action displays a value from its resolved API response. Run the focused Nedaa page tests and the project typecheck.
