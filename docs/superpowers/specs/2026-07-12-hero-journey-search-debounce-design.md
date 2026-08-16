# Hero Journey Search Debounce Design

## Context

The Hero Journey missions search input uses `useUrlQueryState` with `q` listed as a debounced URL key. The hook updates its local query state immediately, however, and the missions loading effect consumes that local value. As a result, `getHeroJourneyMissions` is called for every keystroke even though the URL update is delayed.

The Hero Journey overview student selector is a client-side searchable select. It does not issue an API request for each typed search term and is outside this change.

## Design

Apply the debounce at the Hero Journey missions data-fetch boundary:

- Keep the input value and local UI state immediate so typing remains responsive.
- Derive a 300 ms debounced missions search value using the project’s existing `use-debounce` dependency.
- Build the API filter from the debounced value.
- Skip the missions loading effect while the raw input and debounced input differ.
- Fetch once the user pauses typing, while preserving existing URL, filter, pagination, cancellation, and error behavior.

This is intentionally component-scoped. The shared `useUrlQueryState` hook remains unchanged so other features retain their current behavior.

## Verification

- Add or update focused coverage for the missions search debounce behavior where the existing test setup permits.
- Run the relevant Hero Journey tests.
- Run TypeScript and ESLint checks for the changed component.
- Review the diff to confirm no API contract or unrelated filter behavior changed.

## Acceptance criteria

1. Typing a multi-character search does not issue one missions request per character.
2. One missions request is issued after approximately 300 ms of inactivity.
3. Clearing the search still refreshes the full missions list after the debounce interval.
4. Status, archived, pagination, and academic context filters continue to work immediately and normally.
5. Existing URL synchronization remains intact.
