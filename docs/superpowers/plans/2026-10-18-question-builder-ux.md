# Question Builder UX Implementation Plan

> Execute inline in the current session, as authorized by the user.

**Goal:** Improve assignment and assessment authoring with collapsible settings, a cleaner outline, separate save statuses, and links to questions requiring correction.

**Architecture:** Share small presentation components between the existing builders. Preserve persistence, permissions, question types, validation rules, and guarded navigation.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, MUI, next-intl.

**Spec:** The accepted first-release recommendations in this chat.

## Constraints

- Preserve Somar, project tokens, Arabic/English and RTL/LTR behavior.
- Reuse components from `src/components/ui/`; add no dependencies.
- Preserve unrelated work in the original checkout.
- Run focused tests; obtain permission before the full suite.

## Steps

- [x] Add shared collapsible settings sidebar and integrate both desktop layouts. Keep form contents mounted so toggling preserves input state. Show settings validation counts while collapsed.
- [x] Simplify `QuestionOutlineItem`: native selection button, two-line text, neutral metadata, accessible reorder buttons, existing dropdown for delete. Retain read-only and validation-pending behavior.
- [x] Add `BuilderSaveStatus` to both headers with separate question/settings status. Keep existing save handlers and button enablement.
- [x] Add `QuestionValidationSummary` to desktop/mobile layouts, using existing validation results and guarded selection callbacks. Pass these same results into outlines.
- [x] Add English/Arabic translations and focused interaction tests using real next-intl providers. Apply clean-code-guard and test-guard.
- [x] Finish local verification and prepare the draft PR handoff. The user requested focused verification and declined the full suite.

## Verification

- Focused Vitest checks: 27 tests across seven files passed.
- Full-project lint and targeted lint of the final edits passed.
- Final `npm run typecheck` passed.
- `npm run build` passed in the F: validation copy with a fresh `npm ci` installation.
- Full test suite skipped at the user's request.
- English and Arabic previews using the assessment layout components: no horizontal overflow at 375, 768, 1024, and 1440px; no browser runtime errors. Reviewed screenshots and corrected the mobile header and smaller desktop settings default.
- The previews used local sample content; authenticated backend workflows were not exercised.
- The original checkout's unrelated changes were preserved. Build verification uses an identical source copy on F: with dependencies installed from the lockfile, avoiding cross-drive dependency links and limited C: disk space.
