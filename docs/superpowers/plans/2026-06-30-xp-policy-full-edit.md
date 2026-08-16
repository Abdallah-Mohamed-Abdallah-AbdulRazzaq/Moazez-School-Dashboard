# XP Policy Full Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full edit support for XP policies using the same fields as create.

**Architecture:** Reuse `XpPolicyForm` for create and edit. Move patch submission ownership to `ReinforcementXpPoliciesPage`; keep table as a display component with an edit action.

**Tech Stack:** React, TypeScript, Vitest, existing API services.

---

### Task 1: Payload contract

**Files:**
- Modify: `src/features/reinforcement/types.ts`
- Modify: `src/features/reinforcement/services/reinforcementXpService.ts`
- Test: `src/features/reinforcement/__tests__/xpPolicyMapper.test.ts`

- [ ] Extend `PatchXpPolicyPayload` to include create editable fields.
- [ ] Update `serializePatchXpPolicyPayload` to use create serialization semantics while preserving explicit null clears.
- [ ] Add/adjust tests for full patch payload.

### Task 2: Reusable form

**Files:**
- Modify: `src/features/reinforcement/components/XpPolicyForm.tsx`

- [ ] Add `mode` and `initialPolicy` props.
- [ ] Initialize academic context, selected target, caps, reasons, dates, and active state from `initialPolicy` in edit mode.
- [ ] Submit the same field set for create/edit.

### Task 3: Table and page edit flow

**Files:**
- Modify: `src/features/reinforcement/components/XpPolicyTable.tsx`
- Modify: `src/features/reinforcement/pages/ReinforcementXpPoliciesPage.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] Replace inline cap controls with Edit button for non-default policies.
- [ ] Add edit modal state in the page.
- [ ] On edit submit, call `patchXpPolicy(policy.id, payload)`, close modal, refresh list.
- [ ] Add localized update labels/messages if missing.

### Task 4: Verification

**Files:**
- Test: relevant XP policy tests.

- [ ] Run focused mapper/form/page tests.
- [ ] Run `npm run typecheck`.
- [ ] Run ESLint on touched files.
