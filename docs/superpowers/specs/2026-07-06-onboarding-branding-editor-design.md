# Onboarding Branding Editor Design

## Goal

Let administrators review saved school branding data and update the complete branding profile from the onboarding Organization step. The onboarding and Settings experiences must share the same editor behavior instead of maintaining separate forms.

## Scope

The feature covers the complete `SchoolProfileSettings` contract:

- School name and short name
- Timezone
- Address line, formatted address, city, and country
- Selected map location label, latitude, and longitude
- Footer signature
- School logo

It also adds localized summary, edit, cancel, validation, upload, location, and save states to onboarding. No API contract changes are required.

## Architecture

Extract a reusable `SchoolBrandingEditor` from `SettingsBrandingPage`.

The shared editor owns:

- The editable profile draft
- Field validation
- Logo upload and preview
- School location selection
- Save and cancel actions
- Loading and error states

`SettingsBrandingPage` continues to own page layout, permissions, audit logging, and initial profile loading. `OrganizationSetupStep` continues to own onboarding-specific mode selection and refreshing the setup evaluation after a successful save.

The existing branding service, API DTOs, and `SchoolProfileSettings` types remain the single data contract.

## Onboarding Experience

The Organization step starts in summary mode when a saved profile is available. The summary shows every saved branding field, a logo preview, the selected location and coordinates, and the branding completeness percentage.

An **Edit branding** action opens the complete shared editor with the saved API values prefilled. **Cancel** restores the last saved values and returns to summary mode. **Save** validates the profile, calls the existing branding update endpoint, refreshes the onboarding Organization step, and returns to the updated summary.

If no profile is available, the Organization step opens directly in edit mode.

## Completion and Validation

A complete branding profile requires:

- School name
- Short name
- Timezone
- Address line
- City
- Country
- Footer signature
- Logo URL produced by the existing upload flow
- A selected location with both latitude and longitude

Formatted address and map place label are displayed and persisted as part of the selected location, but completion is determined by the required fields above.

Validation errors appear beside their relevant controls. Upload, location, and save failures preserve the current draft and display localized feedback. Cancel never persists draft changes.

## Localization

All new onboarding copy uses the existing `onboarding` namespace in `src/messages/en.json` and `src/messages/ar.json`. The translation contract includes summary labels, completeness text, edit/cancel actions, field labels, and validation/error messages. English and Arabic key parity remains enforced by the onboarding translation test.

## Testing

Tests cover:

- Rendering all saved values in summary mode
- Opening the editor with saved values prefilled
- Cancelling and restoring the saved profile
- Saving the complete branding payload
- Refreshing onboarding status after a successful save
- Logo upload and preview behavior
- Location selection and coordinates
- Required-field validation and API failures
- English/Arabic translation key parity
- Existing Settings Branding behavior after extracting the shared editor

The implementation must pass the focused onboarding and Settings Branding tests, TypeScript type checking, targeted linting, and the full Vitest suite.
