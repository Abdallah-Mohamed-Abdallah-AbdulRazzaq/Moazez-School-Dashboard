# Hero Journey Mission Contract Alignment Design

## Goal

Align the dashboard Hero Journey mission create and edit flows with the supplied `CreateHeroMissionDto` and `HeroMissionObjectiveDto` contract. The dashboard must prevent invalid requests where it has enough information, preserve backend-owned defaults, surface useful validation feedback in English and Arabic, and continue using the existing Hero Journey mission experience.

## Contract source

The supplied endpoint contract is authoritative for this change:

- `POST /reinforcement/hero/missions`
- Permission: `reinforcement.hero.manage`
- Request DTO: `CreateHeroMissionDto`
- Objective DTO: `HeroMissionObjectiveDto`

The dashboard edit flow will apply the same DTO-level constraints to fields that are supplied, while preserving PATCH partial-update semantics and the backend's mission-status restrictions. Existing POST and PATCH routes remain unchanged.

## Design

### Request models

Replace broad string-based payload fields with separate form-candidate and contract-shaped request types, plus separate public create and update request boundaries. Form candidates model HTML values such as blank strings and numeric strings; normalizers produce strict DTO values.

- Objective `type` is limited to `manual`, `lesson`, `quiz`, `assessment`, `task`, or `custom`.
- Nullable request fields explicitly accept `null` where the DTO does.
- Mission and objective text fields retain their documented maximum lengths.
- Create requests accept either `academicYearId` or the `yearId` alias, with at least one required by runtime validation. If both are supplied with different UUIDs, normalization fails with `academicYearConflict`. Otherwise the normalizer emits one canonical `academicYearId` property and omits `yearId`.
- Objectives are mandatory and non-empty on create. A draft update may omit objectives, send an empty array to remove all objectives, or send a non-empty replacement array.
- Update requests are partial. They validate only supplied properties and retain explicit `null` values where the DTO uses null to clear an existing value.

The existing service functions and routes remain in place. Create continues to POST to `/reinforcement/hero/missions`; edit continues to PATCH the existing mission route.

### Validation and normalization

Introduce two focused public request boundaries that can be tested independently from the modal:

```ts
normalizeCreateHeroMissionRequest(...)
normalizeUpdateHeroMissionRequest(...)
```

They share internal field validators, but they do not share required-field behavior. Create requires academic context, stage, and objectives. Update inspects only fields recorded in a `dirtyFields` set, validates those fields, and can compare against the original mission when a cross-field rule depends on the resulting state.

Contract failures use stable, language-neutral error codes plus an optional field path and structured details. Repeated objective fields retain indexed paths such as `objectives.2.sortOrder`; the page maps codes to next-intl messages.

It will enforce:

- At least one of `academicYearId` or `yearId` for create requests
- Required `termId` and `stageId` on create
- At least one non-empty mission title in the effective resulting mission state
- Mission title limits of 255 characters
- Mission brief limits of 2,000 characters
- Linked lesson reference limits of 255 characters
- Integer `requiredLevel` greater than or equal to 1
- Integer `rewardXp` greater than or equal to 0
- Integer mission coordinates when provided
- Integer mission `sortOrder` when provided
- At least one objective on create. Update may omit objectives, replace them with an empty array, or replace them with a normalized non-empty array.
- Objective title limits of 255 characters
- Objective subtitle limits of 500 characters
- Objective linked lesson reference limits of 255 characters
- Positive, unique objective `sortOrder` values when supplied
- UUID format for supplied `academicYearId`, `yearId`, `termId`, `stageId`, `subjectId`, mission `linkedAssessmentId`, `badgeRewardId`, and objective `linkedAssessmentId` values
- Runtime membership of objective `type` in the six-value DTO union
- Boolean or `null` objective `isRequired` values when supplied; missing or `null` values normalize to the default `true`
- `null` or plain-object mission and objective `metadata` values when supplied; arrays and primitive values are rejected
- Finite integer numeric values, rejecting values such as `NaN`, `Infinity`, and partially parsed numeric strings

Identifier strings are trimmed before UUID validation. Nullable UUID fields convert blank form values to `null` or omission before validation. Create may omit blank optional text or send `null`. Update uses `dirtyFields` to distinguish untouched and explicitly cleared fields: untouched properties are omitted, while a dirty optional text field cleared by the user is sent as `null`. This preserves the backend's PATCH semantics even when the modal submits a full candidate object.

Missing objective types normalize to `manual`, and missing `isRequired` values normalize to `true`. Objective ordering mirrors the backend algorithm exactly:

1. Reject supplied orders that are not positive integers.
2. Reject duplicate supplied orders.
3. Sort objectives with explicit orders first in ascending order.
4. Append objectives without orders in their original relative order.
5. Rewrite the final objective orders sequentially as `1, 2, 3...`.

Optional mission defaults are not injected by the dashboard when omitted. This allows the backend to create missions with `requiredLevel: 1`, `rewardXp: 0`, `sortOrder: 0`, and `status: DRAFT` according to its contract.

Reference existence, term-to-year membership, and active-badge validation remain backend responsibilities because the dashboard does not have authoritative state for those rules.

### Form behavior

The existing create/edit modal remains the user interface. No layout redesign is required.

- New objectives default to type `manual` and required status.
- Inputs expose their documented maximum lengths.
- Validation feedback is available in English and Arabic.
- Duplicate or invalid objective orders produce a clear form error before submission.
- The create action remains hidden unless the user has `reinforcement.hero.manage`.
- Create injects the selected academic year and term before validation and submission.
- Edit tracks dirty fields explicitly. The update context contains the original mission, current status, and the dirty-field set so untouched properties are omitted and explicit clears are sent as `null`.
- Every update omits the dashboard-protected academic scope fields `academicYearId`, `yearId`, `termId`, and `stageId`, regardless of mission status. The corresponding scope controls are read-only while editing. Subject remains editable for drafts because it is not part of the dashboard's always-protected scope rule.
- Draft missions may submit editable mission and objective fields.
- Published missions disable and omit all backend-protected fields: `academicYearId`, `yearId`, `termId`, `stageId`, `subjectId`, `linkedAssessmentId`, `linkedLessonRef`, `requiredLevel`, `rewardXp`, `badgeRewardId`, and `objectives`. Property presence is avoided even when the displayed value is unchanged.
- Archived missions are non-editable and expose no edit action.
- Update validation evaluates the effective title state after applying dirty fields so clearing one localized title cannot leave the mission without either title.
- When the backend rejects a reference or business rule, the UI surfaces the returned API message when it is safe and available, falling back to the existing localized save failure.

### Follow-up UI completion

The mission modal keeps Stage, Grade, and Subject because the existing curriculum service requires Grade and Subject to load lesson options; Academic Year and Term continue to come from page context. Section and Classroom controls are removed because they are not `CreateHeroMissionDto` fields and are not required by curriculum loading. The mission-level lesson selector remains Grade-dependent. Stage, Grade, and Subject changes clear stale dependent lesson/assessment selections.

Objective cards expose every first-class objective DTO field that can be authored safely in the form: type, bilingual titles, bilingual subtitles, linked lesson reference, linked assessment, sort order, and required status. Existing mission and objective metadata is preserved internally; Grade is retained in `metadata.academicScope.gradeId` for restoration, while Section/Classroom metadata is not authored by the UI. Generic metadata remains internal because arbitrary JSON is not an appropriate primary form control. Nullable assessment selectors provide an explicit clear option so untouched, cleared, and newly selected values remain distinct.

### Data flow

1. The modal collects mission and objective candidate values and records the exact DTO fields changed by the user.
2. The create or update normalizer builds the appropriate contract-shaped request using shared field helpers.
3. The page adds academic context for create requests. For edits, it includes only dirty, status-editable properties and preserves explicit clears as `null`.
4. The service sends the normalized payload to the existing POST or PATCH endpoint.
5. Success closes the modal and refreshes missions; failure keeps the form open and displays actionable feedback.

### Tests

Implementation will follow red-green-refactor.

- Contract tests will cover objective type unions and nullable request fields where practical.
- Create-normalizer tests will cover valid bilingual and single-language titles, academic-year aliases, alias conflicts and canonical output, trimmed UUIDs, every UUID field, omitted defaults, numeric-string conversion, finite integer bounds, text limits, empty objectives, metadata shapes, objective runtime types and booleans, objective defaults, duplicate orders, missing orders, stable ordering, and sequential normalization.
- Update-normalizer tests will cover dirty-field-only inspection, untouched-field omission, undefined omission, explicit clears, effective-title validation, UUID formats, `objectives` omitted versus `[]`, always-protected academic scope, published protected fields, archived rejection, and rejection of invalid dirty fields without requiring create-only fields.
- Service tests will verify the existing create and edit routes receive the normalized contract payload.
- Form-level tests cover published protected controls, backend-owned create defaults, draft/create objective removal behavior, and dirty-field submission. Contract-helper coverage verifies archived edit unavailability.
- Relevant Vitest tests, TypeScript typecheck, and ESLint checks for changed files must pass before completion.

## Non-goals

- Changing backend DTOs, routes, permissions, or reference-validation rules
- Redesigning the Hero Journey mission modal
- Adding a new validation dependency
- Changing mission publishing, archiving, deletion, badge management, or list behavior
- Refactoring unrelated Hero Journey work already present in the working tree
