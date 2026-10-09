# Guardian Note Detail Workspace Implementation Plan

> **For agentic workers:** Execute this plan inline with focused verification. Do not run the full test suite without user approval.

**Goal:** Replace the generic Guardian Note editor presentation with a dedicated, responsive workspace consistent with the Weekly Plan and Teacher Preparation detail experiences.

**Architecture:** Keep the existing detail route, aggregate editor hook, mutations, and backend contracts. Route only `GUARDIAN_WEEKLY_NOTE` content into a focused composition that reuses shared metadata, targets, tags, files, links, readiness, publication, revision, lifecycle, and UI primitives. Add Guardian-specific header, navigation, note editor, and context rail components.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, next-intl, Lucide React, Vitest, Testing Library, existing `src/components/ui` primitives.

## Constraints

- Do not change or extend the backend contract.
- Display only the supported body, priority, acknowledgement setting, targets, tags, links, assets, readiness, publication, and revision data.
- Keep other content-type editors behaviorally unchanged.
- Use the shared rich-text editor for the note body.
- Preserve bilingual English/Arabic copy and responsive behavior.

## Tasks

- [x] Add Guardian Note panel definitions and exact detail normalization/validation.
- [x] Build the dedicated header, section navigation, details panel, resources panel, and contextual right rail.
- [x] Compose the dedicated editor view and route Guardian Notes to it from `AcademicContentEditorPage`.
- [x] Add English and Arabic translations.
- [x] Add focused model, component, and routing tests.
- [x] Run focused tests, typecheck, and scoped lint only.
- [x] Apply clean-code-guard to production changes and test-guard to test changes.
