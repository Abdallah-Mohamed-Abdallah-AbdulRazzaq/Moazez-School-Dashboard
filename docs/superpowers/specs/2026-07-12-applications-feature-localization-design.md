# Applications Feature Localization Design

## Scope

Localize all user-facing text in the applications feature for English and Arabic. The scope includes:

- Applications list and filters.
- Application profile layout and all profile tabs: overview, readiness, guardians, documents, tests, and interviews.
- Application loading, empty, permission, and error states.
- Document upload, review, preview, download, deletion, and confirmation flows.
- Test and interview success/error feedback shown from application tabs.
- Application creation stepper.
- Application registration wizard shown from an accepted application.
- Legacy `Application360Modal` and shared `DocumentViewerModal`.

API calls, permissions, status transitions, validation behavior, and component layout remain unchanged.

## Translation structure

Keep the existing namespaces:

- `admissions.applications`: list labels, filters, KPIs, loading/error states, fallback values, and list actions.
- `admissions.application360`: profile header, tabs, overview, readiness, guardians, documents, tests, interviews, timeline, document viewer text, document actions/errors, and detail-page actions.
- `admissions.create_application`: creation-stepper loading/error/fallback text and document input states.

Both `en.json` and `ar.json` must expose matching leaf keys for these namespaces. Existing keys will be reused where their meaning matches; new keys will be grouped under the relevant feature section instead of creating a parallel namespace.

## Component changes

Each user-facing hardcoded string will be replaced with `useTranslations` output in its owning component. Helper functions that currently return English error messages will receive a translation callback or return translation keys, while preserving API-provided error messages when they are available.

Dynamic values such as document names, backend blocker reasons, student names, and configured document labels remain data-driven. Fixed fallback labels, action titles, confirmation prompts, and status text will be translated. Existing status/source mapping behavior will be retained.

The document viewer will receive its own translated labels for unavailable previews, download guidance, close, and download actions. The application list will use translated fallback and processing-time labels rather than raw `N/A`, `h`, or `days` text.

## Error and fallback behavior

- Preserve backend error messages when they are meaningful and provided by the API.
- Translate local fallback messages for network failures, permission failures, validation prompts, and mutation failures.
- Keep loading and empty states visible in the current locations.
- Use translated not-available values for missing IDs, grade labels, profile fields, and document metadata.
- Keep confirmation behavior unchanged; only the confirmation text becomes localized.

## Testing

Add a translation-parity test that recursively verifies the required application keys exist in both locales. Include the newly localized readiness, document action/error, tab feedback, list fallback, creation-stepper, and document-viewer keys.

Run focused application tests for affected components where available, plus:

- The translation-parity test.
- TypeScript typecheck.
- ESLint for changed application files.
- `git diff --check`.

No API or end-to-end behavior changes are required for this localization-only work.

