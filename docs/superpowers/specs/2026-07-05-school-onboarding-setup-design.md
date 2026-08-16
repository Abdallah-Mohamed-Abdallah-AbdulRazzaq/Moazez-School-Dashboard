# School Onboarding Setup Design

## Goal

Add a school setup onboarding experience that guides administrators through the minimum data required by dependent dashboard modules. The onboarding reads real API data, prevents users from opening setup steps whose prerequisites are missing, and does not rely on a manually stored completion flag.

## Product decisions

- The onboarding is a non-blocking checklist. Administrators may dismiss the dashboard card temporarily and continue using unrelated modules.
- A compact card appears at the top of the school dashboard. A dedicated onboarding page exposes the same steps with more room and remains reachable from Settings after setup is complete.
- Setup actions run inside the onboarding experience. Existing dialogs and domain services are reused instead of duplicating validation or API contracts.
- API data is the source of truth for completion. Dismissing the dashboard card never marks a step complete.
- Steps are sequential because later records depend on earlier records.

## Setup sequence and completion rules

1. **Organization / school setup**
   - Complete when the existing branding/profile API returns the required school identity fields, including a non-empty school name.
   - Reuse the branding profile service and the validation rules already enforced by `SettingsBrandingPage`.
2. **Academic year and terms**
   - Complete when at least one academic year exists and at least one term belongs to an existing year.
   - Reuse `YearDialog`, `TermDialog`, and the academic structure service.
3. **Academic structure**
   - Complete when the structure contains at least one stage, one grade, and one section/classroom connected through valid parent IDs.
4. **Subjects and grade allocations**
   - Complete when at least one subject exists and at least one subject allocation links a subject to an existing grade.
5. **Rooms**
   - Complete when at least one room exists.

The first incomplete step whose prerequisites are complete is `available`. Later steps are `locked` and state which prerequisite is missing. Completed steps remain accessible for review or adding more records.

## User experience

The dashboard card is titled `Complete your school setup` / `أكمل إعداد مدرستك`. It shows completed-step count, percentage progress, and the five setup steps. Steps use a horizontal tab treatment on wide screens and a vertical list on small screens.

Selecting an available or completed step reveals:

- a concise explanation of the required data and the modules that depend on it;
- a summary derived from current API data;
- a primary action such as `Add academic year`, `Add term`, or `Add room`;
- the existing dialog or a focused setup form;
- a textual status: `Not started`, `In progress`, `Complete`, `Locked`, or `Unavailable`.

The dedicated page uses the existing dashboard shell and the same step content. The dashboard card disappears after all five steps are complete. The permanent Settings navigation entry remains available.

The UI follows the existing application theme rather than introducing a separate onboarding palette or typography. It uses Lucide icons, visible focus states, text plus icons for status, stable 150–300 ms transitions, and no layout-shifting hover effects. It must work in Arabic RTL and English LTR at 375, 768, 1024, and 1440 pixel widths without horizontal scrolling.

## Architecture

Create a focused `src/features/onboarding/` feature with these boundaries:

- `config/setupSteps.ts`: ordered step metadata, prerequisite IDs, and presentation keys.
- `types.ts`: normalized setup snapshot and `complete | available | locked | error` status types.
- `utils/setupStatus.ts`: pure completion and dependency evaluation functions.
- `hooks/useSetupStatus.ts`: request orchestration, targeted refresh functions, and retry state.
- `components/SetupGuideCard.tsx`: compact dashboard surface.
- `components/SetupStepContent.tsx`: shared step panel and status treatment.
- `components/steps/`: one small adapter component per domain, responsible only for summaries and opening the relevant existing form/dialog.
- `pages/SchoolOnboardingPage.tsx`: full-page composition.
- `src/app/[lang]/(dashboard)/settings/onboarding/page.tsx`: route entry.

Both surfaces consume the same setup status hook and registry. Domain creation logic remains in existing academic and settings services. Onboarding adapters refresh the affected data slice after a successful mutation.

## Data flow

1. On mount, request the school profile, academic years, terms, structure tree, subjects, subject allocations, and rooms through existing services.
2. Normalize the results into a setup snapshot without copying domain mutation logic.
3. Run pure completion predicates, then apply step prerequisites to derive display status and progress.
4. After a successful create or update, close the dialog, refresh only the affected slice and any direct dependents, and recompute all statuses.
5. A user dismissal hides the dashboard card only for that user/session using the project's existing preference mechanism if available; otherwise session storage is the explicit fallback. It does not alter server data or unlock steps.

Requests that need an academic context must use a real selected year/term ID. The onboarding must not synthesize IDs or infer completion from HTTP success alone.

## Existing components and services to reuse

- `src/features/settings/services/brandingService.ts` and the school-profile validation used by `SettingsBrandingPage`.
- `src/features/academics/components/dialogs/YearTermDialogs.tsx` for `YearDialog` and `TermDialog`.
- `src/features/academics/academic-structure-tree/services/structureService.ts` for years, terms, and the structure tree.
- `src/features/academics/subjects/services/subjectsService.ts` and `SubjectDialog`.
- `src/features/academics/rooms/services/roomsService.ts` and `RoomDialog`.
- Existing shared buttons, inputs, modal primitives, loaders, toast handling, and access-denied treatment from `src/components/ui`.

If an existing dialog assumes page-local state, expose the smallest callback/initial-data interface needed for reuse. Do not fork a second dialog implementation into onboarding.

## Loading, errors, and mutation behavior

- Initial loading uses a fixed-size skeleton matching the final card dimensions.
- Failure of one domain request marks only that step as `error`; unaffected earlier steps remain usable.
- A failed prerequisite request keeps dependent steps locked because their readiness cannot be proven.
- Each failed step includes a scoped retry action.
- Validation errors render next to their fields using existing dialog behavior.
- Network or server mutation failures preserve entered values and permit retry.
- Successful mutations close the dialog, show the existing success feedback, and refresh status.
- Duplicate submissions are prevented while a mutation is pending.
- Empty arrays and partial objects never count as complete unless they satisfy the explicit completion predicate.

## Permissions

The onboarding respects the permissions already used by each destination settings or academics feature. A user may view progress when they can access the dashboard, but an action is disabled with an explanatory message when they lack that domain's manage permission. The onboarding does not introduce broader permissions or bypass backend authorization.

## Internationalization and accessibility

- Add every title, description, status, prerequisite explanation, action, loading label, and error message to both `src/messages/en.json` and `src/messages/ar.json`.
- Use semantic buttons and tabs/step controls with keyboard operation and visible focus.
- Announce progress and post-save status updates without moving keyboard focus unexpectedly.
- Do not use color as the only completion or error indicator.
- Respect `prefers-reduced-motion`.
- Inputs retain programmatic labels and existing validation associations.

## Testing

- Unit-test every completion predicate with empty, partial, valid, and orphaned relationship data.
- Unit-test dependency evaluation, including partial API errors and all-complete progress.
- Component-test locked-step behavior, permission-disabled actions, scoped retry, dashboard dismissal, and card disappearance after completion.
- Test that year and term dialog success triggers the targeted refresh and unlocks the next valid step.
- Test that mutation errors preserve form values.
- Test Arabic RTL and English LTR rendering, keyboard navigation, and status text independent of color.
- Add a page-level test for loading, partial failure, retry, and successful progress changes.
- Run focused Vitest suites, typecheck, lint for changed files, and `git diff --check` before completion.

## Scope boundaries

- No backend schema, seed, role, or endpoint changes.
- No automatic creation of sample academic data.
- No hard redirect that blocks the entire dashboard.
- No duplicate academic or settings forms when an existing dialog can be adapted.
- No timetable, teacher, student, admissions, or grading setup steps in this iteration.
- No manually persisted `completed` boolean; completion always derives from current API data.

