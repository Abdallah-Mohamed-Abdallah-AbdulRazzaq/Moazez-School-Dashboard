# Reinforcement Target Cascade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reinforcement task targets follow the academic hierarchy from stage to grade, section, classroom, and student.

**Architecture:** Keep the existing target-scope payload contract, but derive the final target from a cascading set of selectors. Scope determines the final hierarchy level, and changing a parent clears all dependent selections.

**Tech Stack:** React, TypeScript, existing `Select` and reinforcement filter-options service, Vitest.

## Global Constraints

- Preserve `ReinforcementTargetPayload` values sent by the form.
- Reuse the existing filter-options response; do not add an endpoint.
- Reset all downstream selections whenever an upstream hierarchy selection changes.

---

### Task 1: Implement cascading target selection

**Files:**
- Modify: `src/features/reinforcement/components/ReinforcementTaskTargetSelector.tsx`
- Test: `src/features/reinforcement/components/__tests__/ReinforcementTaskTargetSelector.test.tsx`

**Interfaces:**
- Consumes: `ReinforcementFilterOptions` records and the existing `onChange` target payload callback.
- Produces: scope-aware stage → grade → section → classroom → student selectors and the same target payload shape.

- [x] **Step 1: Add tests for parent filtering and reset behavior**
- [x] **Step 2: Implement relation-aware option filtering and dependent state resets**
- [x] **Step 3: Render only the hierarchy levels required by the selected target scope**
- [x] **Step 4: Verify the focused test, TypeScript, and diff formatting**
