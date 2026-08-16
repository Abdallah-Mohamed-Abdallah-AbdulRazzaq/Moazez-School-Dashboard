# Reinforcement Subject-by-Stage Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only subjects allocated to grades within the selected stage in the reinforcement academic context filter.

**Architecture:** Load term subject allocations alongside the academic structure tree. Derive the visible subject list from allocations whose grade belongs to the selected stage, and clear `subjectId` when a stage change makes the current subject invalid. Keep the existing filter UI and API contracts unchanged.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing academic subject services.

## Global Constraints

- Preserve the existing academic context filter UI and dependent-selection behavior.
- Do not add a new API endpoint; reuse `fetchSubjectAllocations(termId)`.
- A selected subject must be cleared when it is no longer available for the selected stage.

---

### Task 1: Add stage-aware subject options to the academic context filter

**Files:**
- Modify: `src/features/reinforcement/components/ReinforcementAcademicContextFilter.tsx`
- Test: `src/features/reinforcement/components/__tests__/ReinforcementAcademicContextFilter.test.tsx`

**Interfaces:**
- Consumes: `fetchSubjectAllocations(termId)`, `AcademicStructureTree`, and the existing `ReinforcementAcademicContextValue`.
- Produces: subject select options derived from the selected stage, while preserving the existing `onChange` selection shape.

- [x] **Step 1: Write the failing test**

Render the filter with a term and a tree containing two stages whose grades have different subject allocations. Assert that selecting stage A shows only stage A subjects and that changing to stage B clears an incompatible selected subject.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run src/features/reinforcement/components/__tests__/ReinforcementAcademicContextFilter.test.tsx`

Expected: FAIL because subjects are currently loaded globally and are not filtered by `stageId`.

- [x] **Step 3: Implement the minimal behavior**

Fetch `SubjectAllocation[]` for the selected term, derive unique subjects from allocations whose `gradeId` belongs to `value.stageId`, and use that derived list for the subject select and selection lookup. When `stageId` changes, clear dependent grade/section/classroom fields and clear `subjectId` if it is not in the newly derived list.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --run src/features/reinforcement/components/__tests__/ReinforcementAcademicContextFilter.test.tsx`

Expected: PASS.

- [x] **Step 5: Run type checking**

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [x] **Step 6: Review the diff for unused code**

Run: `git diff --check` and inspect the changed component and test for unused imports, stale state, and behavior outside the requested filter.
