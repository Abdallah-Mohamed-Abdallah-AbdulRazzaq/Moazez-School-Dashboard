# Admissions Workflow Policy Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual, permission-aware Admissions Workflow Policy page backed by the school-scoped GET/PATCH API.

**Architecture:** Keep API transport in the existing workflow-policy client, form behavior in a focused presentational component, and request/permission orchestration in the page component. Reuse `@/components/ui` primitives and expose the feature through a thin App Router route and the Admissions navigation group.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: API contract

**Files:**
- Modify: `src/features/admissions/workflow-policy/api/workflowPolicyApi.ts`
- Create: `src/features/admissions/workflow-policy/api/__tests__/workflowPolicyApi.test.ts`

- [ ] Write tests that mock `apiGet`/`apiPatch`, assert GET `/admissions/workflow-policy`, assert PATCH sends only provided booleans, and assert `{}` rejects before transport.
- [ ] Run `npx vitest run src/features/admissions/workflow-policy/api/__tests__/workflowPolicyApi.test.ts` and verify failure because tests/client behavior are incomplete.
- [ ] Normalize wrapped or direct response bodies through `unwrapItemResponse` and retain local empty-payload validation.
- [ ] Re-run the focused test and expect all API contract cases to pass.

### Task 2: Workflow policy form

**Files:**
- Create: `src/features/admissions/workflow-policy/components/WorkflowPolicyForm.tsx`
- Create: `src/features/admissions/workflow-policy/components/__tests__/WorkflowPolicyForm.test.tsx`

- [ ] Write tests rendering a saved policy and asserting: changed-only payload, reset restores snapshot, read-only disables switches/save, unchanged disables save, and the direct-acceptance warning appears only for both optional plus direct acceptance disabled.
- [ ] Run `npx vitest run src/features/admissions/workflow-policy/components/__tests__/WorkflowPolicyForm.test.tsx` and verify failure because the component does not exist.
- [ ] Implement a controlled form using shared `Button`, three labeled native checkboxes with `role="switch"`, policy-source summary, contextual warning, reset, and save.
- [ ] Re-run the focused test and expect all form behavior to pass.

### Task 3: Page orchestration

**Files:**
- Create: `src/features/admissions/workflow-policy/pages/AdmissionsWorkflowPolicyPage.tsx`
- Create: `src/features/admissions/workflow-policy/pages/__tests__/AdmissionsWorkflowPolicyPage.test.tsx`

- [ ] Write page tests with mocked permissions/API/toasts for loading, load success, retry, view-only mode, successful save, and failed save preserving the draft.
- [ ] Run `npx vitest run src/features/admissions/workflow-policy/pages/__tests__/AdmissionsWorkflowPolicyPage.test.tsx` and verify failure because the page does not exist.
- [ ] Implement request state, permission checks (`admissions.applications.view/manage`), shared `AccessDenied`/`Button`, retry, toast feedback, and snapshot replacement from PATCH response.
- [ ] Re-run the focused page test and expect all cases to pass.

### Task 4: Route, navigation, and translations

**Files:**
- Create: `src/app/[lang]/(dashboard)/admissions/workflow-policy/page.tsx`
- Modify: `src/config/navigation.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/config/__tests__/navigation.test.ts`
- Create: `src/messages/__tests__/admissionsWorkflowPolicyTranslations.test.ts`

- [ ] Add failing tests asserting the Admissions navigation item points to both localized workflow-policy routes and both locale files contain identical required keys.
- [ ] Run the two focused tests and verify failures for the missing navigation item/translations.
- [ ] Add the thin route, navigation entry using an existing Lucide icon, and complete English/Arabic copy used by the page/form.
- [ ] Re-run the focused tests and expect them to pass.

### Task 5: Verification and review

**Files:** All files above.

- [ ] Run all workflow-policy, navigation, and translation tests together; expect zero failures.
- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Run ESLint for every changed production/test file; expect no errors.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Review the changed production code with clean-code-guard and changed tests with test-guard; remove duplication or brittle assertions without widening scope.
