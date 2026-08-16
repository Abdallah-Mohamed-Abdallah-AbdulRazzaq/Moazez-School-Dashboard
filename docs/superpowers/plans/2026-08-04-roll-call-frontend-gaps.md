# Roll-Call Frontend Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep roll-call date, timetable-day availability, legacy Stage policies, and effective-policy resolution consistent with the backend contract.

**Architecture:** Put calendar-only conversion and weekday validation in a small roll-call utility. Have the page retain the effective policy's timetable days for the picker, and use the backend effective-policy endpoint as the single policy-selection authority. Legacy Stage policies use the backend-supported term timetable fallback.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Do not change submitted-session period navigation (explicitly excluded).
- Preserve existing unrelated worktree changes.
- Do not change backend code or backend permissions.

---

### Task 1: Local calendar dates and active timetable days

**Files:**
- Create: `src/features/attendance/roll-call/utils/localDate.ts`
- Create: `src/features/attendance/roll-call/utils/__tests__/localDate.test.ts`
- Modify: `src/features/attendance/roll-call/components/SessionPickerPanel.tsx`
- Modify: `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`

- [x] Write failing utility tests for local date serialization and inactive weekdays.
- [x] Implement the minimal date utility.
- [x] Pass timetable active-day indexes from the effective policy configuration to the picker.
- [x] Disable inactive weekdays in the picker without changing submitted-session controls.
- [x] Run the focused tests.

### Task 2: Backend-effective policy and legacy Stage timetable fallback

**Files:**
- Modify: `src/features/attendance/policies/services/attendancePolicyService.ts`
- Modify: `src/features/attendance/roll-call/services/attendanceRollCallService.ts`
- Modify: `src/features/attendance/roll-call/services/__tests__/attendanceRollCallService.test.ts`
- Modify: `src/features/attendance/roll-call/utils/policyTimetableConfig.ts`
- Modify: `src/features/attendance/roll-call/utils/__tests__/policyTimetableConfig.test.ts`

- [x] Write failing tests proving roll-call requests the backend effective policy and Stage selects the term timetable.
- [x] Implement the minimal shared policy-service request and use it directly in roll-call.
- [x] Make legacy Stage policies load the term timetable.
- [x] Run the focused tests.

### Task 3: Review and verification

**Files:**
- Review: all changed files and `E:\Moazzez\Moazez-Backend-main` policy/controller contracts.

- [x] Review production and test diffs for quality and behavior coverage.
- [x] Run roll-call tests, typecheck, targeted lint, and whitespace validation.
- [x] Compare frontend request shapes and fallback behavior with the backend source.
