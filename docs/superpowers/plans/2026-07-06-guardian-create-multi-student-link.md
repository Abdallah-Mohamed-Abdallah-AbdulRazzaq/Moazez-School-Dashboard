# Guardian Create Multi-Student Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins create a guardian and link that new guardian to multiple students in the same flow, while exposing all guardian profile fields in edit.

**Architecture:** Extend the existing `AddGuardianModal` data model with selected student links and keep backend calls staged: create guardian first, then link once per selected student. Keep the edit change local to `GuardiansList` because that page owns the current edit modal.

**Tech Stack:** Next.js, React 19, TypeScript, next-intl, Vitest, Testing Library.

---

## File Structure

- Modify `src/features/students-guardians/students/components/modals/AddGuardianModal.tsx`: add student search, selected student list, and per-student primary toggle to the create guardian form data.
- Modify `src/features/students-guardians/guardians/pages/GuardiansList.tsx`: link created guardians to selected students, handle partial link failures, and expand edit form fields.
- Modify `src/features/students-guardians/students/components/tabs/GuardiansTab.tsx`: adapt existing student-profile create flow to the extended form data without double-linking the current student if selected.
- Modify `src/messages/en.json` and `src/messages/ar.json`: add create modal labels and link failure text.
- Test `src/features/students-guardians/registration/pages/__tests__/RegistrationWizardPage.test.tsx` is not touched; add tests only if existing modal test patterns are present.

## Tasks

### Task 1: Extend Create Modal State

- [ ] Add `selectedStudents: Array<{ studentId: string; label: string; is_primary: boolean }>` to `GuardianFormData`.
- [ ] Load student search results with `studentsService.fetchAllStudents({ search })` while the modal is open.
- [ ] Filter out already selected students.
- [ ] Render selected student rows with remove and primary toggle actions.
- [ ] Reset selected students on cancel and successful submit.

### Task 2: Link Created Guardian From Guardians List

- [ ] In `handleCreateGuardian`, create the guardian exactly as today.
- [ ] Loop over `guardianData.selectedStudents` and call `studentsService.linkGuardianToStudent(studentId, { guardianId, is_primary })`.
- [ ] If all links succeed, close the modal and add the guardian to the current list.
- [ ] If some links fail, keep the created guardian in the list and throw a user-visible error naming failed students.

### Task 3: Preserve Student Profile Add Behavior

- [ ] In `GuardiansTab`, create the guardian as today.
- [ ] Link the new guardian to the current profile student using `guardianData.is_primary`.
- [ ] Link any extra selected students except the current student ID.
- [ ] Refresh the current student's guardians after linking.

### Task 4: Expand Edit Guardian Fields

- [ ] Add `phone_secondary`, `national_id`, and `is_primary` to `editGuardianForm`.
- [ ] Populate those fields from the selected guardian.
- [ ] Render inputs/toggles for every supported backend field.
- [ ] Submit the full form to `studentsService.updateGuardian`.

### Task 5: Verify

- [ ] Run `npm run typecheck`.
- [ ] Run `npx vitest run src/features/students-guardians`.
- [ ] Inspect `git diff` to ensure unrelated existing changes are not reverted.
