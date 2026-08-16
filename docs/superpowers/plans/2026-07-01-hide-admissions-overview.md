# Hide Admissions Overview Implementation Plan

## Goal

Remove access to the unsupported Admissions Overview and route Admissions entry points to Applications.

## Task 1: Update Admissions navigation

Files:

- Modify `src/config/navigation.ts`.

Changes:

1. Change the Admissions parent links from `/en/admissions` and `/ar/admissions` to their `/applications` destinations.
2. Remove the `admissions-dashboard` child item.
3. Keep Applications as the first visible child.
4. Remove `LayoutDashboard` only if no remaining navigation item uses it.

Verification:

- Search the Admissions navigation block for links to the root Admissions route.
- Run ESLint on `src/config/navigation.ts`.

## Task 2: Redirect the Admissions root route

Files:

- Modify `src/app/[lang]/(dashboard)/admissions/page.tsx`.

Changes:

1. Replace the dashboard-shell render with Next.js `redirect`.
2. Read the route's `lang` parameter using the project's current Next.js page-prop convention.
3. Redirect to `/${lang}/admissions/applications`.
4. Remove the now-unused dashboard-shell import.

Verification:

- Confirm the route no longer imports or renders `AdmissionsDashboardShell`.
- Run ESLint and TypeScript checks.

## Task 3: Add focused regression coverage

Files:

- Add or update a navigation configuration test in the nearest existing navigation test location.
- Add a route-level test only if the repository already has a stable pattern for testing Next.js redirects; otherwise use static route verification to avoid introducing brittle framework mocks.

Scenarios:

1. Admissions parent navigation points to Applications in English and Arabic.
2. Admissions children do not include `admissions-dashboard`.
3. Applications remains the first Admissions child.
4. The root page targets the locale-preserving Applications route.

Verification:

- Run only the new or modified focused tests.
- Apply the test quality guard: assert public navigation/route behavior, not component internals.

## Task 4: Final quality gate

1. Search production navigation for `admissions-dashboard` and root Admissions links.
2. Run targeted ESLint.
3. Run `npm run typecheck`.
4. Run `git diff --check` on touched files.
5. Review the diff for unrelated changes and preserve the existing dirty worktree.

## Non-goals

- Do not delete the retained Admissions dashboard feature files.
- Do not add a feature flag or unavailable placeholder.
- Do not integrate `GET /dashboard/summary` into Admissions.
- Do not change any dedicated Admissions workflow page.
