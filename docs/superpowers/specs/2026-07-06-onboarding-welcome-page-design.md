# Onboarding Welcome Page Design

## Goal

Introduce a focused welcome screen before the school setup workflow so users understand what they will configure before entering forms and dialogs.

## Routes and Navigation

- `/{lang}/settings/onboarding` becomes the welcome page.
- `/{lang}/settings/onboarding/setup` renders the existing `SchoolOnboardingPage` setup workflow.
- `OnboardingRedirectGuard` continues redirecting authenticated dashboard users with incomplete setup to `/{lang}/settings/onboarding` on every eligible visit.
- The welcome page primary action, `Start setup`, navigates to `/{lang}/settings/onboarding/setup`.
- Existing setup Skip behavior continues returning eligible users to `/{lang}/dashboard`.
- Direct access to the welcome page after setup completion redirects to `/{lang}/dashboard`.

The welcome screen is not persisted as seen. An incomplete setup therefore shows the welcome screen again when the dashboard guard redirects the user in a later visit.

## Welcome Page

Create a focused `OnboardingWelcomePage` client component within the onboarding feature. It uses the existing onboarding layout and contains:

- A small `School onboarding` eyebrow.
- Page heading: `Welcome to your school workspace`.
- Supporting text explaining that the guided setup prevents missing-data errors across the dashboard.
- Five concise stage summaries: Organization, Academic year and terms, Academic structure, Subjects and allocations, Rooms.
- One primary `Start setup` button.

Use Lucide icons already installed in the project. Do not add an illustration asset or animation dependency.

## State and Redirect Behavior

`OnboardingWelcomePage` uses `useSetupStatus` to determine completion.

- While the setup snapshot is loading, show a compact centered loading state instead of incomplete setup content.
- When setup is complete, replace the route with the localized dashboard path and render no welcome actions.
- When setup is incomplete or individual resources fail to load, keep `Start setup` available; the setup page already exposes resource errors and retry controls.

This page does not mutate setup data and does not change skip-session storage.

## Visual Design and Motion

- Use a centered responsive card with the same maximum content width and visual tokens as the onboarding setup.
- Present the five stages in a responsive grid that becomes a single column on narrow screens.
- Reuse the existing `onboarding-enter` and stagger delay classes for the heading, stage list, and action.
- Preserve visible focus styles and respect the existing `prefers-reduced-motion` CSS behavior.
- Keep the primary action visible without scrolling at common desktop heights; allow normal document scrolling on small screens.

## Component Boundaries

- `src/features/onboarding/pages/OnboardingWelcomePage.tsx` owns welcome content, setup-completion redirect, and localized Start navigation.
- `src/app/[lang]/(onboarding)/settings/onboarding/page.tsx` renders `OnboardingWelcomePage`.
- `src/app/[lang]/(onboarding)/settings/onboarding/setup/page.tsx` renders the existing `SchoolOnboardingPage`.
- `OnboardingRedirectGuard` retains the incomplete-setup decision and its root welcome destination.

## Testing and Verification

- Test that the welcome heading, five setup stages, and Start action render for incomplete setup.
- Test that Start navigates to the localized setup route.
- Test that completed setup replaces the route with the localized dashboard and hides the Start action.
- Test both route entry files render their intended feature pages.
- Keep existing setup, skip, and redirect-guard tests passing.
- Run onboarding tests, TypeScript typecheck, ESLint, and the full test suite.
