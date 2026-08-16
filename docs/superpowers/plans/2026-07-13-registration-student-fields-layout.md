# Registration Student Fields Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organize the accepted-application registration student identity fields into clear full-name, English-name, and Arabic-name groups.

**Architecture:** Keep `RegistrationFields` as the single presentation component and preserve all existing `RegistrationFormState` keys, validation, and update callbacks. Only the JSX grouping and visual spacing change.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest.

## Global Constraints

- Do not change submitted field names, validation rules, or locale-aware dropdown behavior.
- Preserve RTL support and the existing two-column responsive grid.

---

### Task 1: Group student identity fields

**Files:**
- Modify: `src/features/admissions/applications/components/registration/RegistrationFields.tsx`

- [ ] **Step 1: Add a full-name subsection**

Keep `fullNameEn` and `fullNameAr` together under a small subsection heading before the individual name fields.

- [ ] **Step 2: Add English and Arabic subsections**

Render the existing four English fields together, followed by the existing four Arabic fields. Keep each field’s current `updateField` key and label.

- [ ] **Step 3: Run focused verification**

Run:

```powershell
npx vitest run src/features/admissions/applications/components/registration/__tests__/RegistrationFields.test.ts
npm run typecheck
```

Expected: the focused tests pass and TypeScript exits with code 0.

- [ ] **Step 4: Review the diff**

Run `git diff --check` and confirm only the registration field layout changed.
