# Onboarding Localization Design

## Goal

Localize the complete onboarding experience in English and Arabic through the project's existing `next-intl` message system, without changing setup behavior, API calls, routing, or completion rules.

## Translation Structure

Expand the existing top-level `onboarding` namespace in `src/messages/en.json` and `src/messages/ar.json`. Organize keys under:

- `layout`
- `loading`
- `errors`
- `welcome`
- `setup`
- `guide`
- `steps.organization`
- `steps.academicContext`
- `steps.structure`
- `steps.subjects`
- `steps.rooms`

Both locale files must contain identical key paths. Progress text, academic-year counts, and term counts use `next-intl` interpolation and ICU plural syntax rather than string concatenation.

## Component Integration

- `OnboardingWelcomePage` uses `useTranslations("onboarding")` for loading, heading, description, stage cards, and the Start action.
- `SchoolOnboardingPage` uses the same namespace for its hero, skip requirement, Skip action, and setup title.
- `SetupGuideContent` builds `SetupGuideCopy` and all step-specific copy objects from `useTranslations("onboarding")`, then passes translated strings into the existing leaf step components.
- `SetupGuideCard` translates its dismiss label and relies on `SetupGuideContent` for the card body.
- The onboarding layout uses `getTranslations("onboarding")` to localize its accessible `aria-label`.

The existing copy props on `OrganizationSetupStep`, `AcademicContextSetupStep`, `AcademicStructureSetupStep`, `SubjectsSetupStep`, and `RoomsSetupStep` remain their localization boundary. Those components do not import `next-intl` directly.

## Error Handling

Validation and mutation errors controlled by onboarding use localized message keys. Raw resource errors returned by services or backend responses are not rendered directly in `SetupGuide`; an onboarding-owned generic localized load error is shown for a step with error status. Shared academic-year, term, subject, and room dialogs retain their existing translation namespaces.

## Locale and Direction

Route locale resolution remains handled by the existing `next-intl` request configuration. Components use translated content only; they do not branch manually on `en` or `ar`. Existing global locale direction behavior remains responsible for RTL layout. The approved white onboarding background, responsive layout, and animations remain unchanged.

## Testing

- Extend the onboarding translation parity test to verify the expanded English and Arabic key trees remain identical.
- Mock `useTranslations` in focused component tests using a deterministic key-to-message translator.
- Verify the welcome page renders translated content and navigation behavior remains unchanged.
- Verify the setup page renders translated hero, skip text, and title while preserving skip behavior.
- Verify `SetupGuideContent` supplies translated guide and step copy, including interpolated progress and count values.
- Verify `SetupGuideCard` exposes a translated dismiss label.
- Verify the layout renders its translated accessible name.
- Run onboarding and translation tests, TypeScript typecheck, ESLint, and the full test suite.
