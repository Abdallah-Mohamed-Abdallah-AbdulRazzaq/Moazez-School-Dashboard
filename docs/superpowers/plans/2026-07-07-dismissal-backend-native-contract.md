# Dismissal Backend-Native Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend to the backend-native Dismissal settings, gates, and staff-assignment endpoint contracts.

**Architecture:** Add backend DTO types and a focused Dismissal API service that calls `/dismissal/settings`, `/dismissal/gates`, and `/dismissal/staff-assignments` through `@/lib/api`. Migrate the Nedaa settings/gate UI to use backend-native settings and gate fields directly, without translating them back into the old `nameEn/nameAr/supportsPickup` model.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing `apiGet/apiPost/apiPatch/apiDelete` helpers.

---

### Task 1: Dismissal API Service Contract

**Files:**
- Create: `src/features/nedaa/services/dismissalApiService.ts`
- Create: `src/features/nedaa/services/__tests__/dismissalApiService.test.ts`
- Modify: `src/features/nedaa/types/nedaa.ts`

- [ ] Write failing tests that assert exact backend paths and payloads for settings, gates, and staff assignments.
- [ ] Run `npm run test:run -- src/features/nedaa/services/__tests__/dismissalApiService.test.ts` and confirm it fails because the service does not exist.
- [ ] Implement backend-native DTO types and the service functions with no shape translation.
- [ ] Run the service test and confirm it passes.

### Task 2: Backend-Native Gate Presentation

**Files:**
- Modify: `src/features/nedaa/utils/nedaaPresentation.ts`
- Modify: `src/features/nedaa/components/NedaaGateFormModal.tsx`
- Modify: `src/features/nedaa/views/NedaaSettingsView.tsx`

- [ ] Update presentation helpers to order and label gates by `sortOrder`, `name`, and `code`.
- [ ] Change the gate form to submit `code`, `name`, `campus`, `status`, `isActive`, `sortOrder`, `latitude`, `longitude`, `waitingZones`, and `notes`.
- [ ] Change the settings view to render backend settings fields: `enabled`, `timezone`, `schoolZone`, `allowedRadiusMeters`, `requestWindow`, `thresholds`, `policies`, and `defaultGate`.
- [ ] Change gate management labels and actions to backend fields.

### Task 3: Settings Page Integration

**Files:**
- Modify: `src/features/nedaa/pages/NedaaSettingsPage.tsx`
- Modify: `src/features/nedaa/services/nedaaService.ts`

- [ ] Load settings and gates separately using `fetchDismissalSettings()` and `listDismissalGates()`.
- [ ] Save settings through `updateDismissalSettings()` using backend-native update DTO keys.
- [ ] Create/update gates immediately through `createDismissalGate()` and `updateDismissalGate()`.
- [ ] Keep delete wired to staff-assignment service only; gates have no DELETE endpoint in the backend contract.
- [ ] Keep mock request/overview generation working by reading backend-native gates where needed.

### Task 4: Verification

**Files:**
- Affected TypeScript and tests above.

- [ ] Run `npm run test:run -- src/features/nedaa/services/__tests__/dismissalApiService.test.ts`.
- [ ] Run `npm run typecheck`.
- [ ] Fix only issues caused by this dismissal contract migration.
