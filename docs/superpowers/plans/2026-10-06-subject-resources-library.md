# Subject Resources Library Implementation Plan

**Goal:** Add a dedicated, responsive Subject Resources library that follows the approved screen while using only the existing academic-content list contract.

**Architecture:** Reuse the academic-content list API, browse selectors, URL-backed filters, shared UI components, and existing detail/create routes. The page performs one paginated content-list request; summary cards are derived from that response.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Vitest, Testing Library.

### Task 1: Model and service

- Add URL filter parsing, list-query mapping, and response-derived statistics.
- Add a Subject Resource list service that fixes `type` to `SUBJECT_RESOURCE`.
- Cover contract mapping with focused unit tests.

### Task 2: Dedicated library UI

- Add the route, page composition, header, summary cards, filters, and table/grid results.
- Reuse shared UI controls, status badges, rich-text display, error/empty states, and server pagination.
- Route create and open actions through the existing academic-content editor/detail URLs.

### Task 3: Navigation and localization

- Route the overview Subject Resources card to the dedicated page.
- Add complete English and Arabic copy for the new page.

### Task 4: Verification

- Apply clean-code and test-quality review.
- Run focused tests, TypeScript checking, scoped lint, and `git diff --check`.
- Do not run the full test suite without explicit approval.
