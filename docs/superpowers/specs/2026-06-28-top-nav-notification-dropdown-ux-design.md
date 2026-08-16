# Top Navigation Notification Dropdown UX Design

## Scope

Improve the existing top-navigation notification dropdown without changing notification API contracts. The work covers localization, loading and failure states, tabs, sound-control ownership, accessibility, and navigation to the full notification center.

## Data And State

`TopNav` continues to own `useNotifications` and passes notifications, unread count, actions, `isLoading`, `isRefreshing`, `error`, and `refresh` to `TopNavNotificationDropdown`.

Initial loading shows skeleton rows instead of an empty state. An API error shows a localized failure message and retry action. Existing notifications remain visible during background refresh, with the refresh control indicating activity. The empty state appears only after a successful request returns no notifications.

The dropdown has All, Chat, and Announcements tabs. Chat sends `sourceModule=communication`; Announcements sends `sourceModule=announcements`; All clears `sourceModule`. The Academics tab is removed because the backend accepts only one source module and cannot return a complete grouped academic result in one request.

## Localization

`TopNav` passes every user-facing and accessibility label. The contract includes title, unread count, mark-all action, tabs, empty state, loading state, failure state, retry, refresh, archive, priority badges, mute, unmute, list label, tab-list label, and view-all action.

English and Arabic message catalogs receive dedicated keys for labels that do not already exist. The dropdown does not rely on English fallbacks during normal `TopNav` usage.

## Interaction And Accessibility

Notification sound control remains in the notification dropdown and is removed from the profile menu.

The notification collection uses `role="list"`. Each notification uses a `role="listitem"` container with separate semantic buttons for opening and archiving. This avoids nested interactive controls. Archive aria labels use the localized archive label and notification title.

The footer contains a localized action that closes the dropdown and routes to `/{locale}/communication/notifications`.

## Verification

Focused tests cover:

- Complete localized labels, including archive and sound controls.
- Skeleton, error, retry, refresh, empty, and background-refresh states.
- All, Chat, and Announcements tabs and backend filter changes.
- Absence of the Academics tab and profile sound toggle.
- List/listitem semantics and separate open/archive buttons.
- View-all navigation to the localized notification center.
