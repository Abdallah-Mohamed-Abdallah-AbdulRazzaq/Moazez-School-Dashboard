# Remove Grades Rules Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the grade-rules management UI and routes while preserving effective-rule consumption in the gradebook and Grades overview.

**Architecture:** Delete the isolated management feature, its App Router entry points, and its navigation link. Retain the independent gradebook/overview types, mapper, service call, and backend API reference documentation.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, ESLint

## Global Constraints

- Preserve `GET /grades/rules/effective` consumption in `src/features/grades/overview` and `src/features/grades/gradebook`.
- Do not modify unrelated working-tree changes.
- Removed routes use normal not-found behavior; add no redirect.

---

### Task 1: Remove management routes, feature code, and navigation

**Files:**
- Delete: `src/features/grades/rules/**`
- Delete: `src/app/[lang]/(dashboard)/grades/(with-context)/rules/**`
- Delete: `src/app/[lang]/(dashboard)/academics/grades/rules/page.tsx`
- Modify: `src/config/navigation.ts`

**Interfaces:**
- Consumes: the existing Grades navigation configuration and App Router filesystem routes.
- Produces: no grade-rules management navigation or reachable page; no change to effective-rule consumers.

- [ ] **Step 1: Delete the isolated routes and management feature**

Remove every file under the listed route directories and `src/features/grades/rules`.

- [ ] **Step 2: Remove the navigation item and unused icon import**

Delete the object whose key is `grades-rules` and remove `Settings2` from the `lucide-react` import because it has no remaining use in this file.

- [ ] **Step 3: Verify source references**

Run: `rg -n "features/grades/rules|grades-rules|/grades/rules" src`

Expected: only the preserved `/grades/rules/effective` request and related API type comment remain; no route import, navigation item, or management service remains.

- [ ] **Step 4: Run focused static verification**

Run: `npm run typecheck && npx eslint src/config/navigation.ts src/features/grades/overview src/features/grades/gradebook`

Expected: both commands exit successfully.

### Task 2: Remove superseded management planning documents

**Files:**
- Delete: `docs/superpowers/specs/2026-07-11-grades-rules-list-and-editor-design.md`
- Delete: `docs/superpowers/specs/2026-07-11-grades-rules-backend-aligned-ux-design.md`
- Delete: `docs/superpowers/plans/2026-07-11-grades-rules-list-and-editor.md`
- Delete: `docs/superpowers/plans/2026-07-11-grades-rules-backend-aligned-ux.md`

**Interfaces:**
- Consumes: the approved removal spec.
- Produces: documentation that no longer advertises implementation work for the removed management feature.

- [ ] **Step 1: Delete superseded documents**

Remove the four files above. Keep backend/API reference documentation because the effective-rule endpoint remains in use.

- [ ] **Step 2: Verify documentation references**

Run: `rg -n "Grades Rules List and Editor|Grades Rules Backend-Aligned UX" docs`

Expected: no matches.

### Task 3: Final regression verification

**Files:**
- Test: existing tests under `src/features/grades/overview` and `src/features/grades/gradebook`
- Test: `src/__tests__/navigation.test.ts` if present

**Interfaces:**
- Consumes: the post-removal source tree.
- Produces: evidence that retained Grades behavior still compiles and passes its existing tests.

- [ ] **Step 1: Run relevant tests**

Run: `npm run test:run -- src/features/grades/overview src/features/grades/gradebook src/__tests__/navigation.test.ts`

Expected: all discovered relevant tests pass; if the named navigation test is absent, run the two existing Grades directories without it.

- [ ] **Step 2: Check formatting and working-tree scope**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the approved removal plus pre-existing unrelated user changes appear.
