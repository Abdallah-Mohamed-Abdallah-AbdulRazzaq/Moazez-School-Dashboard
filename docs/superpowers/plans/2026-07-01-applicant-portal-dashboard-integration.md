# Applicant Portal Outputs in Admissions Dashboard Implementation Plan

## Goal

Make submitted Applicant Portal applications and bridged documents reliable and understandable in existing Admissions staff workflows without adding applicant-facing endpoints or routes.

## Task 1: Harden application source presentation

Files:

- Modify `src/features/admissions/applications/pages/ApplicationsList.tsx`.
- Add a small source-label utility beside the Applications feature only if it enables focused behavior tests without rendering the entire page.
- Add focused tests in the nearest Applications test directory.

Changes:

1. Preserve localized labels for `in_app`, `referral`, `walk_in`, and `other`.
2. Keep the `in_app` label unchanged.
3. Render an em dash for missing source.
4. Convert unknown underscore-separated values to readable text.
5. Ensure source rendering does not filter `in_app` applications.
6. Preserve the current local status filter and include `documents_pending`.
7. Improve empty-state distinction between an empty dataset and no filtered matches if the current page does not already distinguish them.

Verification:

- Test `in_app`, missing source, and unknown source behavior.
- Test `documents_pending` remains a selectable and renderable status.

## Task 2: Preserve the backend applications query contract

Files:

- Review and modify only if required:
  - `src/features/admissions/applications/api/applicationsApi.ts`
  - `src/features/admissions/applications/services/applicationsApiService.ts`
- Update `src/features/admissions/applications/api/__tests__/applicationsApi.test.ts`.

Changes:

1. Keep list filtering limited to the backend-supported status query.
2. Do not add or forward `source`.
3. Add a focused assertion showing the request URL contains status only.

## Task 3: Render all bridged Admissions documents

Files:

- Modify `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`.
- Update `src/features/admissions/applications/components/tabs/__tests__/DocumentsTab.test.tsx`.

Changes:

1. Keep loading from `/admissions/applications/:applicationId/documents` through the existing service.
2. Render every returned document without checking it against the staff upload type list.
3. Keep the staff upload type list unchanged and isolated to upload controls.
4. Add explicit copy for `pending_review`, `missing`, and complete/accepted states in English and Arabic translations.
5. Ensure unfamiliar `documentType` values display as returned.

Verification:

- Test an unfamiliar bridged document type is visible.
- Test `pending_review` and `missing` status copy.

## Task 4: Enforce document permission boundaries

Files:

- Modify `DocumentsTab.tsx` only where existing gating is incomplete.
- Extend `DocumentsTab.test.tsx`.

Scenarios:

1. Without `admissions.documents.view`, document content and view/download actions are unavailable.
2. With view but without manage, view/download are available and review/delete actions are absent.
3. With `admissions.documents.manage`, accept, reject, request replacement, and delete controls are available only in valid workflow states.
4. Staff upload remains under the existing manage and application-status rules.

## Task 5: Add endpoint ownership regression protection

Files:

- Add a focused contract test under `src/features/admissions/applications/__tests__` or the nearest established contract-test location.

Changes:

1. Scan Admissions dashboard production files for `/applicant-portal/requests` references.
2. Fail if applicant-owned request or document endpoints are introduced.
3. Do not reject the public school required-documents endpoint globally because Settings legitimately uses it; scope the test to Admissions production code and `/applicant-portal/requests` ownership.

## Task 6: Final validation

1. Run focused Applications API and Documents tab tests.
2. Run the endpoint ownership regression test.
3. Run targeted ESLint on touched production and test files.
4. Run `npm run typecheck`.
5. Run `git diff --check` on touched files.
6. Apply clean-code and test quality guards, removing brittle implementation assertions and unrelated edits.

## Non-goals

- Applicant Portal routes, account, profile, request, submission, or document-management UI.
- Applicant-owned request/document endpoint calls.
- A server-side source filter.
- Renaming `in_app` to include Portal.
- Required-document settings integration or name-based matching.
- Changes to Tests, Interviews, Decisions, or Enrollment behavior.
