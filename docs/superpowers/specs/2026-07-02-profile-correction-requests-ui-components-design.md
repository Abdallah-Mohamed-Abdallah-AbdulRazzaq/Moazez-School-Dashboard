# Spec: Profile Correction Requests UI Refactoring

Refactor the profile correction requests pages to utilize the common UI primitives from the `src/components/ui` library, improving visual consistency and user experience.

## Goal
Replace native dropdowns, inputs, buttons, textareas, and tables with project-standard components:
- `Input`
- `Select`
- `TextArea`
- `Button`
- `DataTable`
- `EmptyState`

---

## Proposed Changes

### 1. ProfileCorrectionRequestsQueuePage
- **Location**: `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestsQueuePage.tsx`
- **Updates**:
  - Replace status `<select>` with `<Select>` component.
  - Replace studentId `<input>` with `<Input>` component.
  - Replace the custom HTML `<table>` with the `<DataTable>` component.
  - Set `onRowClick` to allow clicking anywhere on a row to navigate to details.
  - Utilize the built-in skeleton loader of the `DataTable` for clean loading state.
  - Replace custom empty states with the `<EmptyState>` component.

### 2. ProfileCorrectionRequestDetailPage
- **Location**: `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestDetailPage.tsx`
- **Updates**:
  - Replace back button with a ghost variant `<Button>` using a `ChevronLeft` icon.
  - Replace reviewer note `<textarea>` with the `<TextArea>` component.
  - Replace Approve and Reject buttons with standard `<Button>` components (`variant="success"` and `variant="danger"`).

---

## Verification Plan

### Automated Tests
- Run `npx vitest run src/features/students-guardians/profile-correction-requests` to ensure no regressions are introduced to the core mapper or service tests.

### Manual Verification
- Navigate to `/en/students-guardians/profile-correction-requests`.
- Test filters and query fields.
- Click a row in the queue to open details, and review note actions (approve/reject).
