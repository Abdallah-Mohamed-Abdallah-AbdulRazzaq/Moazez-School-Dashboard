# Admissions Authenticated Document Access Design

## Goal

Allow staff to view and download protected application documents without exposing credentials or navigating directly to an authenticated API endpoint.

## Cause

`DocumentsTab` currently opens `/api/files/{fileId}/download` with `window.open`. New browser navigation does not use the dashboard API client, so its bearer-token interceptor is skipped and the server returns `Unauthorized`.

## Data Flow

- Both actions require the document's `fileId`.
- The client calls the existing `downloadFileBlob(fileId)` function from `src/services/filesService.ts`.
- That function requests `/api/files/{fileId}/download` through the authenticated API client with `responseType: "blob"`.
- The UI creates a temporary object URL from the returned blob.
- No token is placed in a query string, DOM attribute, or browser address bar.

## View Action

- Preview is available for `pending_review`, `complete`, and `missing` documents whenever a `fileId` exists. Review status does not restrict staff from inspecting the linked file.
- The View button enters a loading state and ignores duplicate clicks.
- After loading, the existing `DocumentViewerModal` receives the temporary object URL.
- PDFs and supported images remain viewable through the existing modal presentation.
- Closing or replacing the viewed document revokes the previous object URL.

## Download Action

- The Download button enters a per-document loading state and ignores duplicate clicks.
- After loading, the client creates a temporary anchor with the document's original filename and triggers the browser download.
- The temporary anchor and object URL are removed immediately after the download starts.

## Errors

- Failed view/download requests keep the current page open and show an error toast.
- A missing `fileId` disables both actions because a protected file cannot be requested safely without it.
- Existing document list, upload, review, replacement, and delete behavior is unchanged.

## Verification

Focused tests verify that:

- View and Download use `downloadFileBlob` instead of opening the protected API URL.
- View supplies a blob URL to the existing modal and revokes it on close.
- Download uses the original filename and cleans up its temporary URL.
- Loading prevents duplicate requests.
- Failures show an error without navigating away.

Run the focused Documents tab tests, TypeScript checking, targeted linting, and `git diff --check`.
