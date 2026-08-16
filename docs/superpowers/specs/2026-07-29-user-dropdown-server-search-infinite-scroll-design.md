# User Dropdown Server Search and Infinite Scroll Design

## Summary

Move every searchable, user-backed selector to paginated server search through
the existing `GET /settings/users` endpoint. Opening a selector loads its first
page, typing sends a debounced server query, and scrolling near the end loads
the next page. Each feature keeps its current role and account-status scope.

This design covers the shared communication selectors and the specialized user
pickers used by account linking, registration, admissions interviews, Nedaa,
and teacher allocation. It does not change non-user searchable selectors.

## Goals

- Use the backend as the only source of user search results.
- Load the first page for an empty query when a selector opens or a picker
  becomes visible.
- Search after any input using an approximately 300 ms debounce.
- Append later pages automatically as the user scrolls.
- Preserve each feature's existing `roleId` and `status` restrictions.
- Preserve selected labels across searches and page replacement.
- Centralize request, pagination, stale-response, loading, and error behavior.
- Retain specialized option presentation where it carries feature-specific
  information.

## Out of Scope

- Changing the backend users endpoint or its permission contract.
- Adding client-side fallback filtering for user results.
- Changing non-user searchable selects.
- Standardizing all selectors to active users.
- Redesigning the visual language of the existing dropdown component.
- Fixing backend full-name search semantics as part of the frontend change.

## Verified Backend Contract

The source of truth is the `main` branch of
`Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`, inspected on
2026-07-29.

`GET /settings/users` supports:

- `search?: string`;
- `roleId?: string`;
- `status?: "active" | "invited" | "inactive"`;
- `page`, defaulting to `1` with a minimum of `1`;
- `limit`, defaulting to `20` with a range of `1` through `100`.

The response is:

```ts
{
  items: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

The endpoint requires `settings.users.view` and applies the current school
scope. Search is case-insensitive across login email, username, contact email,
first name, and last name. Results are ordered by first name and then last
name.

Verified backend files:

- [`list-users-query.dto.ts`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/blob/main/src/modules/settings/users/dto/list-users-query.dto.ts)
- [`user-response.dto.ts`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/blob/main/src/modules/settings/users/dto/user-response.dto.ts)
- [`users.controller.ts`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/blob/main/src/modules/settings/users/controller/users.controller.ts)
- [`users.repository.ts`](https://github.com/Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend/blob/main/src/modules/settings/users/infrastructure/users.repository.ts)

### Backend search limitation

Although the query DTO describes full-name search, the repository applies the
complete search string independently to `firstName` and `lastName`. A
multi-word query such as `Nour Ali` can therefore fail to match a user whose
first name is `Nour` and last name is `Ali`, while either individual token can
match.

The frontend will send the exact trimmed query and display the backend result.
It will not merge client-filtered records into the response. Improving
multi-word full-name matching requires a separate backend change.

## Current Frontend State

The frontend already exposes:

- `fetchSettingsUsers`, which accepts `search`, `page`, `limit`, `roleId`, and
  `status` and maps the pagination envelope;
- `Select.onEndReached`, which fires when the option list is within 40 pixels
  of its scroll end;
- `UserSearchSelect` and `UserMultiSearchSelect`, which serve most
  communication-related consumers.

The shared `CommunicationEntitySelect` currently invokes its search function
with an empty query after mounting and gives the resulting options to
`Select`. `Select` then filters that first page locally. Consequently, typing
does not request matching users beyond the initially loaded page.

The specialized account, interviewer, Nedaa, and teacher-allocation pickers
each own different portions of search or preload behavior. This duplication is
the boundary this design replaces.

## Architecture

### Proposed `usePaginatedUsers` controller

Add a shared user-data controller with an interface shaped around:

- an enable flag;
- a raw search query;
- optional `roleId`;
- optional `status`;
- a page size of `20`;
- an explicit retry action.

The controller owns:

- the debounced, trimmed query;
- the current page and pagination total;
- initial loading and loading-more state;
- first-page and later-page errors;
- page replacement when the query or scope changes;
- page append when the end of the list is reached;
- ID-based deduplication;
- duplicate-request prevention;
- stale-response protection;
- `hasMore`, derived from the number of unique loaded items compared with
  `pagination.total`.

The first page is requested only while enabled. Standard dropdowns enable the
controller when opened. Always-visible account-search controls enable it when
the relevant link-existing mode becomes visible. This prevents a grid of
closed teacher-allocation selectors from issuing one request per cell.

Changing the debounced query, `roleId`, or `status` resets the result to page
one. An empty query is valid and loads the first scoped page.

### Proposed standard user-select adapter

Add a standard paginated user-select adapter that:

- connects search input changes to `usePaginatedUsers`;
- maps user records to the existing select option shape;
- disables the base select's local filtering for server-owned results;
- invokes the controller's next-page action through `onEndReached`;
- presents loading, empty, error, and retry states;
- preserves the selected option when it is not part of the current page.

`UserSearchSelect` becomes a compatibility wrapper around this adapter so its
existing consumers receive the new behavior without duplicating orchestration.

### Proposed multi-user adapter

`UserMultiSearchSelect` continues to build on the single-user selector. It
keeps an ID-indexed label cache containing:

- initially supplied selected options;
- options returned by any completed page;
- options selected during the current component lifetime.

Changing a query or replacing page-one results must not remove labels for
already-selected chips. Selecting a user clears the pending selection but does
not erase the current query unless the existing consumer behavior requires it.

### Base `Select` boundary

Keep `Select` API-agnostic. Add only generic capabilities needed by an external
server-search owner:

- notification when the search input changes;
- a mode that bypasses local option filtering;
- an externally supplied loading state or footer;
- an open-state callback if the existing `onOpen` callback is insufficient.

Retain the existing `onEndReached` behavior. The base component must not import
the users service, know about pages, or construct API queries.

### Specialized renderers

Selectors with meaningful custom presentation retain it while reusing the
same controller:

- account pickers retain their full user and role result rows;
- teacher allocation retains load and capacity indicators;
- specialized empty and error copy remains localizable by the owning feature.

The data controller remains independent of rendering so these consumers do not
fork debounce and pagination logic.

## Scope Preservation

Every migrated selector keeps the restrictions it currently applies:

- shared communication, behavior, dashboard, and settings-email selectors keep
  their existing unrestricted-status behavior;
- account linking and registration keep `status="active"`;
- admissions interviews keep the resolved teacher role and
  `status="active"`;
- Nedaa keeps the resolved dismissal-staff role and `status="active"`;
- teacher allocation keeps the resolved teacher role and
  `status="active"`.

Role discovery remains in the owning feature because teacher and
dismissal-staff role resolution already have feature-specific rules. The
resolved `roleId` is passed to the shared user controller.

## Migration Inventory

### Shared selector consumers

The compatibility wrappers migrate these consumers:

- communication restrictions list filter;
- communication blocks list filter;
- restriction form;
- create-block form;
- notification filter;
- notification-delivery filter;
- conversation invite form;
- conversation participant form;
- announcement editor;
- dashboard announcement draft form;
- behavior review creator filter;
- email campaign selected-user audience;
- credential-delivery selected-user audience.

### Specialized consumers

Migrate these without removing their feature-specific UI:

- student account linking;
- guardian account linking;
- registration account linking;
- admissions interviewer selection;
- Nedaa staff-assignment list filter;
- Nedaa staff-assignment form;
- teacher-allocation selection.

The Nedaa page contains two dropdown render sites but they share the same
resolved role scope. Student and guardian account linking share the existing
account-picker implementation.

## Request and State Flow

### Opening with no query

1. The user opens the dropdown or reveals an account picker.
2. The controller becomes enabled.
3. After the debounce boundary, it requests page `1`, limit `20`, an omitted
   `search`, and the current role/status scope.
4. The menu replaces its contents with the returned page.
5. `hasMore` is true while the number of unique loaded users is less than
   `pagination.total`.

### Searching

1. Each input change updates the raw query immediately.
2. After approximately 300 ms without another change, the trimmed query becomes
   active.
3. The controller invalidates the prior page sequence and requests page `1`.
4. Only the response matching the latest query and scope may replace options.

### Loading more

1. `Select.onEndReached` or the specialized list's equivalent fires near the
   scroll end.
2. The controller checks `hasMore`, loading state, and the requested-page
   registry.
3. It requests the next page with the same search and scope.
4. Successful records append in backend order and duplicate IDs are ignored.

### Selecting

The selected ID and label remain available even when:

- the search query changes;
- the first page is replaced;
- the selected user does not appear in a later response;
- a multi-select user is no longer part of the visible result set.

## Loading and Error Behavior

### Initial loading

Show a loading row inside the menu. Do not display the empty state until the
request succeeds with no records.

### Loading another page

Keep loaded users interactive and show a footer loading indicator. Repeated
scroll events must not issue duplicate requests.

### Empty result

Show the localized no-users result after a successful empty first page.

### First-page failure

Replace the result area with a localized load-failure state and retry action.
Do not present the failure as an empty result.

### Later-page failure

Keep existing records and show a localized footer error with retry. Retrying
requests the failed page rather than restarting the query.

### Permission failure

A `403` response produces a localized unavailable/permission state. Existing
screens must not describe this as no matching users. The endpoint continues to
rely on backend authorization; the frontend does not bypass
`settings.users.view`.

### Stale requests

If transport-level cancellation is unavailable, use a monotonically increasing
request generation or an equivalent identity check. Responses from an older
query, role, or status scope are ignored.

## Accessibility and Localization

- Search remains keyboard reachable when the menu opens.
- Scrolling does not move focus or reset the active selection.
- Loading and error status are exposed to assistive technology without
  repeatedly announcing every scroll event.
- Retry is keyboard operable.
- Existing RTL positioning and text alignment remain intact.
- Add equivalent English and Arabic messages for initial loading, loading more,
  no users, load failure, permission failure, and retry.

## Testing

### Controller tests

Cover:

- empty-query page-one loading when enabled;
- approximately 300 ms debounce after any input;
- exact `search`, `page`, `limit`, `roleId`, and `status` parameters;
- page replacement after query or scope changes;
- page append and ID deduplication;
- `hasMore` behavior using `pagination.total`;
- stopping when every result is loaded;
- duplicate end-reached suppression;
- stale response rejection;
- first-page retry;
- later-page retry without losing loaded users;
- disabled-state request suppression.

### Base select tests

Cover:

- controlled search-change notification;
- bypassing local filtering in server-search mode;
- end-reached notification;
- initial and footer loading presentation;
- keyboard and RTL behavior retained by the new state variants.

### Selector tests

Cover:

- selected single-user label preservation;
- multi-user chip preservation across searches and page replacement;
- clear and selection callbacks;
- localized empty and error states.

### Feature integration tests

Cover representative consumers from every scope:

- unrestricted shared communication selector;
- active account-link selector;
- active teacher interviewer selector;
- active dismissal-staff Nedaa filter and form;
- lazy teacher-allocation selector with load/capacity presentation.

Assert that each feature forwards its current role/status scope and that closed
teacher-allocation cells do not request users.

### Contract tests

Keep frontend service tests aligned with the verified backend contract:

- `GET /settings/users`;
- supported search and filter fields;
- page and limit serialization;
- the `1..100` backend limit boundary;
- `items` and `pagination.page`, `pagination.limit`, and `pagination.total`.

## Acceptance Criteria

1. Every searchable user-backed selector in the migration inventory obtains
   visible search results from `GET /settings/users`.
2. Opening or revealing a selector with an empty query loads page one.
3. Any typed query triggers a debounced server request and no client-side user
   filtering supplements that response.
4. Scrolling loads and appends pages until `pagination.total` is reached.
5. Duplicate scroll events and stale responses cannot duplicate or replace
   valid results.
6. Each selector retains its current role and status scope.
7. Selected single- and multi-user labels survive search and pagination
   changes.
8. Specialized account, Nedaa, admissions, and teacher-allocation presentation
   remains intact.
9. Initial loading, loading more, empty, permission, failure, and retry states
   are distinct and localized in English and Arabic.
10. Closed teacher-allocation selectors do not preload users independently.
11. The implementation uses only backend-supported user-list query fields and
    pagination metadata.
