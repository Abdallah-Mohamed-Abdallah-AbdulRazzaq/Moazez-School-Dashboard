# Reinforcement Template Table UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the reinforcement template list easier to scan in Arabic RTL and responsive layouts without changing its API contract.

**Architecture:** Keep `ReinforcementTemplateTable` as the single presentation component. Replace the oversized stages-in-cell layout with compact metadata, a stage count/progress strip, and a responsive card representation using the existing Lucide and Tailwind patterns.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Preserve template data, translations, and API behavior.
- Keep RTL and LTR layouts semantically correct.
- Use Lucide icons only; no emoji icons.
- Keep hover/focus states stable and keyboard-visible.
- Do not alter unrelated dirty worktree changes.

---

### Task 1: Add UI regression expectations

**Files:**
- Modify: `src/features/reinforcement/__tests__/reinforcementFrontendHardening.test.tsx`
- Modify: `src/features/reinforcement/components/ReinforcementTemplateTable.tsx`

- [x] Add assertions for compact stage summary, source/reward badges, and responsive card semantics.
- [x] Run the focused test and observe failures against the current table markup.

### Task 2: Implement compact table/card presentation

**Files:**
- Modify: `src/features/reinforcement/components/ReinforcementTemplateTable.tsx`

- [x] Replace the wide multi-line stage cell with a compact stage summary and numbered preview strip.
- [x] Add stronger header hierarchy, row hover/focus states, and balanced column widths.
- [x] Keep mobile cards aligned with the same information hierarchy and RTL direction.
- [x] Run the focused UI test and verify it passes.

### Task 3: Verify visual implementation

- [x] Run focused Reinforcement tests.
- [x] Run `npm run typecheck`.
- [x] Run lint on the changed component and test.
- [ ] Inspect the rendered page at mobile, desktop, Arabic RTL, and English LTR widths; the in-app browser was unavailable in this session.
