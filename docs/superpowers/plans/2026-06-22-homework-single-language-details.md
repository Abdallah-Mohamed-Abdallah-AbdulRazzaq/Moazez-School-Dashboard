# Homework Single-Language Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bilingual homework assignment title and description controls with single inputs mapped to backend `title` and `description`.

**Architecture:** Extend the reused curriculum settings panel with a homework-only display mode. Keep the shared `Assignment` adapter fields synchronized so the existing homework mapper emits the backend's single title and description fields without changing curriculum behavior.

**Tech Stack:** React, TypeScript, Next.js, next-intl, Vitest.

---

### Task 1: Lock Single-Input Behavior

**Files:**
- Create: `src/features/academics/curriculum/components/__tests__/AssignmentSettingsPanel.test.tsx`

- [x] Add a component test proving homework renders one title control and one description control.
- [x] Verify each edit synchronizes both localized adapter fields used by the existing backend mapper.
- [x] Run the focused test and confirm it fails while the panel still renders bilingual controls.

### Task 2: Add Homework-Only Single Inputs

**Files:**
- Modify: `src/features/academics/curriculum/components/AssignmentSettingsPanel.tsx`
- Modify: `src/features/academics/curriculum/components/DesktopLayout.tsx`
- Modify: `src/features/academics/curriculum/components/MobileLayout.tsx`
- Modify: `src/features/academics/homework/pages/HomeworkAssignmentBuilderPage.tsx`

- [x] Add an optional `detailsInputMode` prop defaulting to `"bilingual"`.
- [x] In single-language mode, render `Input` for title and `TextArea` for description and mirror each changed value into both localized adapter fields.
- [x] Pass the mode through desktop and mobile layouts and enable it only on the homework builder.
- [x] Keep existing bilingual controls as the default curriculum rendering path.

### Task 3: Verify

**Files:**
- Modify only if verification exposes a defect.

- [x] Run all homework tests with `npx vitest run src/features/academics/homework --reporter=dot`.
- [x] Run `npx tsc --noEmit`.
- [x] Run ESLint on the touched production files.
- [x] Confirm English and Arabic translation JSON files still parse.
