# Nedaa Filter Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each operations tab's filters easier to scan without changing query behavior.

**Architecture:** Introduce a presentational `OperationsFilterGroup` wrapper inside the existing page. Compose Primary and Academic groups for Active/Waiting, then add History Period, Status Scope, and Request Flags groups for History.

**Tech Stack:** React, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

## Global Constraints

- Preserve all existing endpoint parameters and filter state behavior.
- Keep groups unframed inside the existing FilterPanel; use separators rather than nested cards.
- Maintain responsive one, two, and three-column layouts.

---

### Task 1: Grouped filter regression test

**Files:**
- Modify: `src/features/nedaa/pages/__tests__/NedaaOperationsPage.test.tsx`

- [x] Add a test asserting Active exposes Primary and Academic grouped regions only, while History exposes all five grouped regions with their own controls.
- [x] Run the focused test and confirm it fails because the grouped regions do not exist.

### Task 2: Grouped filter composition

**Files:**
- Modify: `src/features/nedaa/pages/NedaaOperationsPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/nedaaTranslations.test.ts`

- [x] Add `OperationsFilterGroup` with a heading, divider, and responsive content grid.
- [x] Move existing controls into Primary, Academic, History Period, Status Scope, and Request Flags groups.
- [x] Keep existing bilingual group labels and translation coverage.
- [x] Run focused tests, type checking, lint, and the operations regression suite.
