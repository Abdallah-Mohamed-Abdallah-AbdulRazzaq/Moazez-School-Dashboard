# Role-based mobile app download gate

## Goal

After authentication, prevent mobile-first users from entering the school dashboard and present a modern, role-specific page that directs them to their mobile application.

## Audience

The gate applies when either condition is true:

- `userType` is `STUDENT`, `TEACHER`, or `PARENT`.
- The active membership role key is `dismissal_staff` (while accepting `DISMISSAL_STAFF` as an equivalent backend value).

`PAREN` is not used because the current application user-type contract defines the parent value as `PARENT`.

All other users retain the existing dashboard experience unchanged.

## Architecture

Add a central post-auth dashboard gate, rather than placing checks on individual routes. It receives the authenticated user and active membership, determines whether the account belongs to an app-only audience, and renders either the existing dashboard shell or the app download screen.

Keep the role matching and presentation configuration separate from the page component:

- A small pure helper determines the app audience from `userType` and `activeMembership.roleKey`.
- A role configuration map supplies the localized application name, supporting copy, visual accent, and temporary Android/iOS URLs.
- The download screen is a reusable, presentational component and does not own authentication or navigation decisions.

## User experience

The app-only screen replaces the dashboard entirely: no sidebar, dashboard content, or administrative data is rendered for a matched account.

It supports Arabic and English, including RTL/LTR layout, and selects role-specific copy for Student, Teacher, Parent, and Dismissal Staff. The visual design uses a light gradient background, a centered elevated card, a phone-oriented illustration or role icon, concise explanatory copy, and prominent Android and iOS download buttons. A logout action remains available.

Temporary per-role, per-platform links are defined as easy-to-replace constants. Store links open in a new tab with safe external-link attributes.

## State and error handling

- While the authenticated user or membership is still resolving, render a safe loading state; do not briefly expose dashboard content.
- If a future audience configuration lacks a platform URL, render that store button disabled.
- Accounts outside the target audience flow through to the dashboard without behavioral change.

## Verification

Unit tests cover audience matching for `STUDENT`, `TEACHER`, `PARENT`, `dismissal_staff`, and a non-target administrative account. Component tests verify role-specific copy, Android/iOS buttons, disabled-link behavior, and absence of dashboard chrome for an app-only account. Relevant existing authentication/dashboard tests will be run alongside type checking and linting for changed files.

## Non-goals

- Replacing temporary store URLs with production links.
- Adding mobile-app deep linking, QR codes, analytics, or download tracking.
- Changing permissions, account creation, or the existing dashboard behavior for non-target users.
