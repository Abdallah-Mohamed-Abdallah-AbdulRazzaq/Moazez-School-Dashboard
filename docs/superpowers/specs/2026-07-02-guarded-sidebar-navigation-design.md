# Guarded Sidebar Navigation Design

## Problem

`GuardedLink` currently notifies the sidebar that navigation started before the unsaved-changes guard permits the route change. When the guard blocks or delays navigation, the sidebar displays a loader that cannot clear because the pathname never changes.

## Design

Invoke `onNavigationStart` inside the callback passed to `guardedNavigate`, immediately before starting the progress bar and calling the router. This makes the callback mean that navigation was permitted and is actually starting.

Keep cancellation behavior unchanged. When navigation is blocked, no sidebar pending state or progress indicator starts. When the user confirms leaving, the stored guarded callback runs and starts both indicators immediately before routing.

## Testing

Add a `GuardedLink` regression test with a deferred navigation guard. Clicking the link must not invoke `onNavigationStart`; invoking the captured guarded action must invoke it and route to the target.

## Session expiration

The session-expired event updates authentication state only. `AuthProvider` route protection is the sole owner of the login redirect, preventing concurrent API failures from issuing duplicate router transitions that abort one another.
