# Hero Journey Modal Localization Design

## Scope

Remove hardcoded English UI fallbacks from the Hero Journey mission and badge form modals. The change is limited to modal presentation and translation coverage; it does not alter form behavior, API payloads, validation rules, or internal identifiers.

## Current finding

Both form modals already use the `heroJourney.missionForm` and `heroJourney.badgeForm` namespaces for their visible labels, descriptions, placeholders, and validation messages. The only user-facing English fallback is the `defaultMessage: "Save"` argument passed to the shared `common.save` translation in each modal.

Values such as numeric placeholders and internal API comparison strings remain unchanged because they are not displayed UI copy.

## Design

Use the existing shared `common.save` translation directly in:

- `HeroJourneyBadgeFormModal`
- `HeroJourneyMissionFormModal`

This keeps the English and Arabic button text owned by the existing common translation contract and removes the embedded English fallback.

## Testing

Add a focused translation regression test that verifies:

1. `common.save` exists in both English and Arabic.
2. The modal namespaces used by both forms have matching English and Arabic key paths.

Run the focused test, the Hero Journey service tests, TypeScript, and ESLint for the changed files.

## Non-goals

- No changes to the Hero Journey missions search debounce behavior.
- No changes to API data, internal status values, or backend-provided content.
- No visual redesign or modal interaction changes.
