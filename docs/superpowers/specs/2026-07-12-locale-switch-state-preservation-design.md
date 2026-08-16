# Locale Switch State Preservation Design

## Goal

Changing between Arabic and English must preserve locale-independent application state so the authenticated dashboard does not restart from the global loading screen.

## Design

Introduce a locale-independent root layout at `src/app/layout.tsx`. It owns the document shell, global CSS/font setup, and the existing `Providers` tree containing authentication, realtime communication, and MUI state. The middleware-provided `X-NEXT-INTL-LOCALE` request header supplies the correct initial server-rendered `lang` and `dir` attributes.

Keep `NextIntlClientProvider` in `src/app/[lang]/layout.tsx`, because its locale and messages must change with the route. Add a small client synchronizer beneath that provider to update the persistent document element after client-side locale navigation.

The language switch keeps the current pathname and query string, uses history-replacing navigation, and does not alter the existing next-intl routing model.

## Boundaries

- Preserve `AuthProvider`, realtime, theme, and MUI state across locale changes.
- Preserve correct initial and client-updated `lang` and RTL/LTR document attributes.
- Do not introduce Redux or a new query-cache dependency.
- Do not migrate page-specific API fetching in this change.
- Preserve all unrelated working-tree changes.

## Verification

- Layout tests prove global providers live above the locale boundary.
- Locale document tests cover Arabic and English direction updates.
- Language-switcher tests prove path/query preservation and replacement navigation.
- Run focused tests, TypeScript, ESLint, and `git diff --check`.
