# Nedaa Active Request Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support every documented `GET /dismissal/requests/active` query parameter from the Active operations tab.

**Architecture:** Extend the Active tab's independent filter state with one mutually exclusive academic ID, sort, page, and limit. Populate gate and academic ID filters from existing services, and pass validated values through the existing dismissal API service.

**Tech Stack:** Next.js, React, TypeScript, next-intl, Vitest, Testing Library.

## Global Constraints

- Academic filters are mutually exclusive because the backend currently applies only one reliably.
- Every UUID filter uses a searchable dropdown populated from backend data.
- Search is limited to 120 characters and debounced.
- Sort values are exactly `urgency_desc`, `requested_at_asc`, and `requested_at_desc`.
- Active, Waiting, and History retain independent filter state.

---

### Task 1: Active query contract tests

**Files:**
- Modify: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

- [ ] Add a failing interaction test that selects gate, status, academic IDs, and sort and asserts the active endpoint receives the documented query fields.
- [ ] Add a failing pagination test asserting table page and page-size changes update `page` and `limit`.
- [ ] Run `npm run test:run -- src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx` and confirm the new assertions fail for missing controls or parameters.

### Task 2: Active filter state and controls

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`
- Modify: `src/features/nedaa/types/nedaa.ts`

- [ ] Add typed sort values and active-only academic, page, and limit state.
- [ ] Use `useNedaaAcademicStructure` and `getNedaaAcademicOptions` to build searchable stage, grade, section, and classroom selectors.
- [ ] Clear the other academic IDs whenever one academic selector changes.
- [ ] Pass search, gate, status, one academic ID, sort, page, and limit to `listActiveDismissalRequests`.
- [ ] Wire `DataTable.serverPagination` to the Active tab's page and limit.
- [ ] Run the focused test and confirm it passes.

### Task 3: Bilingual labels and verification

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/nedaaTranslations.test.ts`

- [ ] Add English and Arabic labels for academic filters and sort options.
- [ ] Run the Nedaa translation and operations tests.
- [ ] Run `npm run typecheck` and ESLint for touched TypeScript files.
- [ ] Run the complete Nedaa test set and confirm no regressions.
