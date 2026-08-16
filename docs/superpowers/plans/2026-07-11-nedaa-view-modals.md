# Nedaa View Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Nedaa request detail, pickup recipients, and history detail modals display their loaded API data.

**Architecture:** Keep modal selection in `ActionModalState`, store each read-only response in local page state, and render response-specific content from that state. Existing mutation modal state and service contracts remain unchanged.

**Tech Stack:** React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Do not change Nedaa API service contracts.
- Do not change status, arrival, delivery, or escalation modal behavior.
- Show loading and request errors explicitly for read-only modal fetches.

---

### Task 1: Add failing view-modal regression tests

**Files:**
- Modify: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

- [ ] Add one test for each view action that resolves its mocked API response and asserts a response-specific value appears in the modal.
- [ ] Run the focused test file and confirm the new assertions fail because the page only renders `operations.detail_loading`.

### Task 2: Store and render read-only modal responses

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`

- [ ] Add typed state for request detail, pickup recipients, and history detail, with loading/error state.
- [ ] Load the corresponding response in each opener and clear stale state before loading.
- [ ] Render request, recipients, and history content from resolved state; retain the existing mutation modal branches.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Verify the change

**Files:**
- No additional files.

- [ ] Run the Nedaa operations and gate modal tests.
- [ ] Run `npm run typecheck`.
- [ ] Inspect the diff for dead state, unused imports, and unrelated changes.
