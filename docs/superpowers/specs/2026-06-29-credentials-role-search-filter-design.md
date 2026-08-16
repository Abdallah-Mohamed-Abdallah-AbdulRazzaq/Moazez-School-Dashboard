# Credentials Role Search Filter Design

## Goal

Make the Credentials page role filter searchable and resilient when role loading fails, without introducing a second dropdown implementation.

## Dropdown Behavior

Use the existing `Select` component with its `searchable`, `searchPlaceholder`, `noResultsText`, `onOpen`, and option `searchText` support.

The first option remains All. Each loaded role option uses `role.key` as its value, `role.name` as its visible label, and both name and key as searchable text. Search remains local to the loaded role list.

The open dropdown shows a disabled loading option while roles are being requested and a disabled error option after a failed request. Existing selected-role and filter-reset behavior does not change.

## Data Loading

Credential status loading and role loading use independent requests and state. A role request failure must not fail or hide credential records.

Load roles when the page initializes. When the role dropdown opens, request roles again only when the role list is empty and a role request is not already running. This covers both an initial failure and a successful empty response while preventing duplicate concurrent requests.

Role-loading errors are scoped to the dropdown. A successful retry clears the error and populates the options.

## Verification

Focused tests cover:

- The initial page load requests both credential records and roles.
- Credential records remain usable when the initial role request fails.
- Opening an empty role dropdown retries role loading without starting duplicate requests.
- The role dropdown exposes search and matches role options by both `role.name` and `role.key`.
- Loading, error, empty-search, and successful option states are visible in the dropdown.

Run the focused Vitest suite, TypeScript typecheck, and lint on changed files.

## Non-Goals

- Adding server-side role search or role pagination.
- Creating a new role-specific dropdown component.
- Changing the credential-status API request or role filter query value.
- Changing filters outside the Credentials page.
