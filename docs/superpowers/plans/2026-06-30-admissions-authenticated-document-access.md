# Admissions Authenticated Document Access Implementation Plan

Design: `docs/superpowers/specs/2026-06-30-admissions-authenticated-document-access-design.md`

## 1. Replace direct protected-URL navigation

Update `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`:

- Import the existing `downloadFileBlob` service.
- Fetch protected files by `fileId` through the authenticated client.
- Track view and per-document download loading states.
- Create and revoke temporary object URLs.
- Trigger downloads with the original filename.
- Disable actions when `fileId` is unavailable.
- Report failures through the existing toast system.

## 2. Keep the viewer presentational

Update `src/features/admissions/applications/components/modals/DocumentViewerModal.tsx` only as needed so it consumes a prepared blob URL and never opens the protected API URL directly.

## 3. Add focused regression tests

Update `src/features/admissions/applications/components/tabs/__tests__/DocumentsTab.test.tsx` to cover authenticated viewing, downloading, cleanup, duplicate-click prevention, and failure behavior.

## 4. Verification

Run:

```text
npm run test:run -- src/features/admissions/applications/components/tabs/__tests__/DocumentsTab.test.tsx
npm run typecheck
npm run lint -- src/features/admissions/applications/components/tabs/DocumentsTab.tsx src/features/admissions/applications/components/modals/DocumentViewerModal.tsx
git diff --check
```

Review production code with `clean-code-guard` and tests with `test-guard` before handoff.
