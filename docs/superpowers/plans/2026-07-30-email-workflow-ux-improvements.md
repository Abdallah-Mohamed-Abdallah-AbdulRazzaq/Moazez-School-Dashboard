# Email Workflow UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve email administration workflows with independent role loading, recoverable errors, destructive-action confirmation, clearer recipient feedback, reusable campaign drafts, and a more usable template editor.

**Architecture:** Keep backend contracts unchanged. Split campaign-list and role-catalog state so either can succeed independently, extend existing email components through focused props, and reuse the shared accessible `ConfirmDialog` for destructive actions. Preserve current Tailwind styling and `next-intl` localization.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

## Global Constraints

- Do not use the brainstorming workflow unless explicitly requested.
- Preserve unrelated dirty-worktree changes.
- Follow test-driven development: observe each regression test fail before production edits.
- Maintain English/Arabic translation-key parity and RTL behavior.
- Do not stage, commit, push, or create a pull request unless requested.

---

### Task 1: Independent campaign role catalog

**Files:**
- Modify: `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- Modify: `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- Modify: `src/features/settings/email/campaigns/components/CampaignAudienceStep.tsx`
- Test: `src/features/settings/email/campaigns/pages/__tests__/EmailCampaignsPage.test.tsx`
- Test: `src/features/settings/email/campaigns/components/__tests__/CampaignAudienceStep.test.tsx`

**Interfaces:**
- `CampaignAudienceStep` consumes `roles`, `isLoadingRoles`, `rolesError`, and `onRetryRoles`.
- Campaign pagination refreshes only campaigns; the role catalog has its own request lifecycle.

- [ ] Write failing tests proving campaign data survives a role failure, retry restores roles, pagination does not refetch roles, and role labels show member counts.
- [ ] Run the focused tests and confirm failures describe the missing independent state.
- [ ] Split `hydrateCampaigns` from `hydrateRoles`, pass role status to the selector, and render skeleton/error/retry states.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Destructive-action confirmations

**Files:**
- Modify: `src/features/settings/email/connection/pages/EmailConnectionPage.tsx`
- Modify: `src/features/settings/email/templates/pages/EmailTemplatesPage.tsx`
- Modify: `src/features/settings/email/deliveries/pages/EmailDeliveryDetailPage.tsx`
- Test: corresponding page tests under each feature.

**Interfaces:**
- Reuse `ConfirmDialog` with danger or warning severity.
- Confirmed actions call the existing mutation handlers; cancel closes the dialog without a request.

- [ ] Write failing user-interaction tests proving the first click opens confirmation and does not mutate.
- [ ] Run tests and confirm the existing direct mutations cause the expected failures.
- [ ] Add confirmation-dialog state and localized content for disable, reset, and cancel.
- [ ] Run the focused tests and confirm all three flows pass.

### Task 3: Campaign recipient and post-create guidance

**Files:**
- Modify: `src/features/settings/email/campaigns/components/CampaignComposer.tsx`
- Modify: `src/features/settings/email/campaigns/pages/EmailCampaignsPage.tsx`
- Test: `src/features/settings/email/campaigns/components/__tests__/CampaignComposer.test.tsx`

**Interfaces:**
- `onStartNewCampaign(): void` clears the created batch and preview only after explicit user action.
- Zero-eligible previews render an announced warning alongside localized skip reasons.

- [ ] Write failing tests for zero-eligible guidance, draft preservation after create, and explicit “Create another campaign.”
- [ ] Run tests and confirm the current reset behavior fails them.
- [ ] Preserve composer values, add the guidance banner and explicit reset action.
- [ ] Run focused tests and confirm they pass.

### Task 4: Template body-format tabs and variable insertion

**Files:**
- Modify: `src/features/settings/email/templates/components/TemplateEditor.tsx`
- Create: `src/features/settings/email/templates/components/__tests__/TemplateEditor.test.tsx`

**Interfaces:**
- Body format tabs switch between `bodyHtml` and `bodyText`.
- Clicking an allowed-variable button appends that exact backend variable to the active body field through the existing `onChange` callback.

- [ ] Write failing keyboard/user-event tests for tab selection and inserting into HTML and text bodies.
- [ ] Run tests and confirm controls are missing.
- [ ] Add accessible tab semantics, visible focus, and variable insertion buttons.
- [ ] Run focused tests and confirm they pass.

### Task 5: Localization and verification

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Add matching localized keys for role loading/retry, confirmations, zero-recipient guidance, new-campaign action, editor tabs, and insertion help.

- [ ] Add both locales and validate recursive key parity.
- [ ] Run the scoped email/settings Vitest suite.
- [ ] Run `tsc --noEmit`, scoped ESLint, locale JSON parsing/parity, and `git diff --check`.
- [ ] Review the final diff with clean-code and test guards and fix any findings.
