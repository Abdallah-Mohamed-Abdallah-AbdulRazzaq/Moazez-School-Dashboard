# Onboarding Redirect Loading Design

## Problem

The dashboard layout renders its children while `useSetupStatus` is still loading. When the setup snapshot later resolves as incomplete, `OnboardingRedirectGuard` redirects to `/{locale}/settings/onboarding`. This briefly exposes the dashboard before onboarding appears.

## Design

`OnboardingRedirectGuard` will own the pending UI for this decision:

- While the setup snapshot is loading, render `MainLoader` instead of dashboard children.
- When setup is incomplete and onboarding has not been skipped for the current school session, start the existing localized `router.replace` redirect and continue rendering `MainLoader` until navigation completes.
- Render dashboard children only when setup is complete, onboarding was skipped for the current school session, or no school context is available.
- Preserve the existing onboarding-path exemption and session-scoped skip behavior.

This keeps the change within the existing client-side guard and avoids adding a second onboarding-status request to server routing.

## Testing

Extend `OnboardingRedirectGuard` tests to verify:

- The main loader is rendered and dashboard content is hidden while the setup snapshot is loading.
- The main loader remains visible and dashboard content stays hidden while redirecting an incomplete setup.
- Dashboard content renders for completed setup.
- Dashboard content renders when onboarding was skipped for the current session.
- Existing redirect destination and onboarding-route behavior remain unchanged.

## Scope

No onboarding eligibility rules, API contracts, authentication redirects, or loader visuals will change.
