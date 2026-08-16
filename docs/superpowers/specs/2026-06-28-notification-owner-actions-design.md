# Notification Owner Actions Design

## Goal

Allow administrators to inspect notifications for any recipient while exposing read and archive mutations only for notifications owned by the signed-in user.

## Ownership Rule

The notifications page obtains the signed-in user ID from the existing auth hook. A notification is owned only when `notification.recipientUserId ?? notification.userId` is present and exactly equals the signed-in user ID.

Missing recipient data is not treated as ownership. This is a visibility rule for the frontend; backend authorization must continue to enforce mutation permissions.

## Actions

Every notification continues to expose View details.

The list item shows Mark read and Archive only for an owned notification. The details drawer receives the same ownership result and hides Mark read and Archive for a non-owned or missing-owner notification.

The page-level Mark All Read action is shown only when at least one notification is loaded and every loaded notification is owned by the signed-in user. It is hidden for empty, mixed-owner, non-owned, or missing-owner result sets.

## Verification

Focused tests cover:

- Owned notifications show View details, Mark read, and Archive where applicable.
- Non-owned notifications show only View details.
- Notifications without a recipient identifier show only View details.
- The details drawer follows the same ownership rule.
- Mark All Read appears only when every loaded notification is owned.
