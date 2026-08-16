# Admissions Workflow Policy Page Design

## Goal

Add a school-scoped Admissions Workflow Policy page that lets authorized staff view and update whether placement tests and interviews are required and whether direct acceptance is permitted.

## Route and navigation

- Route: `/[lang]/admissions/workflow-policy`
- Navigation: add `Workflow Policy` / `سياسة سير العمل` under the existing Admissions group.
- Visibility follows `admissions.applications.view`.

## Authorization

- `admissions.applications.view`: load and view the page.
- `admissions.applications.manage`: edit and save policy fields.
- View-only users see the same policy details with disabled controls and no active save action.
- The backend remains authoritative; API authorization errors are surfaced without exposing internal data.

## Page structure

The page uses the existing dashboard shell and Admissions visual language. It contains:

1. A page header with title and a concise explanation that changes affect decision and registration readiness.
2. A status summary showing whether the policy source is `default` or `school_override`, plus the last update time when present.
3. Three focused setting cards:
   - Require placement test.
   - Require interview.
   - Allow direct acceptance.
4. A contextual warning when both workflow steps are optional but direct acceptance is disabled. The warning explains that accept remains blocked while waitlist and reject can remain available.
5. A footer action area with reset and save controls.

Controls use labeled switches or checkboxes, visible keyboard focus, sufficient contrast, and text in addition to color for state communication. The layout stacks on small screens and avoids horizontal scrolling.

## Shared UI components

- Reuse components exported by `src/components/ui/index.ts` wherever an equivalent exists.
- Use the shared `Button` for save, reset, and retry actions.
- Use the shared `AccessDenied` and existing toast system for permission and feedback states.
- Do not create page-local button, modal, input, empty-state, or access-denied primitives that duplicate `src/components/ui/`.
- The shared library does not currently export a switch or checkbox component. The workflow form may use an accessible native checkbox with `role="switch"`, styled to match the existing design tokens; this control remains local until a reusable switch is added to the shared UI library.

## Data flow

1. On mount, call `GET /admissions/workflow-policy`.
2. Store the returned policy as both the saved snapshot and editable draft.
3. Compute dirty fields by comparing the draft with the saved snapshot.
4. Save sends only changed boolean fields to `PATCH /admissions/workflow-policy`.
5. An empty PATCH is never sent; save is disabled while unchanged or submitting.
6. Replace both snapshot and draft with the PATCH response so `source` and `updatedAt` remain backend-authored.
7. Reset restores the current saved snapshot without an API request.

## States and errors

- Initial load: focused page skeleton/loading state.
- Load failure: error panel with retry.
- Saving: controls and navigation actions remain stable; save shows progress and prevents duplicate submission.
- Save success: show a success toast and render the returned policy.
- Save failure: preserve the draft, show an error toast, and permit retry.
- Permission failure: use the existing Admissions access-denied treatment.

## Components and files

- `src/features/admissions/workflow-policy/api/workflowPolicyApi.ts`: existing typed GET/PATCH client; add contract tests if needed.
- `src/features/admissions/workflow-policy/pages/AdmissionsWorkflowPolicyPage.tsx`: page orchestration and request state.
- `src/features/admissions/workflow-policy/components/WorkflowPolicyForm.tsx`: accessible policy controls, dirty-field calculation, warning, and actions; imports shared primitives from `@/components/ui`.
- `src/app/[lang]/(dashboard)/admissions/workflow-policy/page.tsx`: route entry.
- `src/config/navigation.ts`: Admissions menu item.
- `src/messages/en.json` and `src/messages/ar.json`: bilingual page labels, descriptions, states, and feedback.

## Testing

- API contract tests assert GET and partial PATCH endpoints and reject an empty update locally.
- Form tests assert dirty-field payloads, reset behavior, read-only behavior, and the direct-acceptance warning.
- Page tests assert loading, retry after load failure, successful save, preserved draft after save failure, and permission behavior.
- Typecheck, focused Vitest suites, ESLint for changed files, and `git diff --check` are required before completion.

## Scope boundaries

- No backend, permission seed, role, or database changes.
- No policy history or audit-log UI.
- No per-grade or per-academic-year policy controls because the backend policy is school-scoped.
- No automatic application-list refresh from this page; list/detail screens naturally fetch updated dashboard state when opened or refreshed.
