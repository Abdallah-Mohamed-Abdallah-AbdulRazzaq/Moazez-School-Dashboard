# Locale Switch State Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve authentication and global client state when switching between Arabic and English.

**Architecture:** Move locale-independent providers into a new root layout while leaving next-intl messages under `[lang]`. Synchronize document language attributes after client navigation and replace the locale URL without losing query state.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl 4.8, Vitest, Testing Library.

## Global Constraints

- Do not introduce Redux or a query-cache dependency.
- Keep URL-prefixed locales and preserve pathname/query parameters.
- Preserve unrelated dirty-worktree changes.

---

### Task 1: Persistent root provider boundary

**Files:**
- Create: `src/app/layout.tsx`
- Modify: `src/app/[lang]/layout.tsx`
- Test: `src/app/__tests__/localeProviderBoundary.test.tsx`

**Interfaces:**
- Consumes: middleware request header `X-NEXT-INTL-LOCALE`.
- Produces: a persistent document shell and global `Providers` boundary.

- [x] Write a failing test that imports the root layout and asserts that it wraps children with `Providers` while the locale layout does not.
- [x] Run `npm exec -- vitest run src/app/__tests__/localeProviderBoundary.test.tsx` and confirm failure because `src/app/layout.tsx` does not exist.
- [x] Add the root layout and reduce `[lang]/layout.tsx` to locale-specific responsibilities.
- [x] Run the focused test and confirm it passes.

### Task 2: Document locale synchronization

**Files:**
- Create: `src/components/i18n/DocumentLocaleSync.tsx`
- Test: `src/components/i18n/__tests__/DocumentLocaleSync.test.tsx`
- Modify: `src/app/[lang]/layout.tsx`

**Interfaces:**
- Consumes: `locale: "ar" | "en"`.
- Produces: synchronized `document.documentElement.lang` and `dir` attributes.

- [x] Write failing Arabic and English DOM-attribute tests.
- [x] Confirm failure because the synchronizer does not exist.
- [x] Implement the client effect and mount it inside the locale provider.
- [x] Run the focused tests and confirm they pass.

### Task 3: Locale navigation semantics

**Files:**
- Modify: `src/components/ui/language-switcher/LanguageSwitcher.tsx`
- Test: `src/components/ui/language-switcher/__tests__/LanguageSwitcher.test.tsx`

**Interfaces:**
- Consumes: current pathname and search parameters.
- Produces: `router.replace(nextLocalizedUrl, {scroll: false})`.

- [x] Update the existing test to expect replacement navigation without scrolling.
- [x] Run the test and confirm it fails against the current `router.push` behavior.
- [x] Change the switcher to replacement navigation.
- [x] Run focused tests, `npm run typecheck`, ESLint, and `git diff --check`.
