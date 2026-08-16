# Login Identity Page UX Design

## Goal

Make the Login Identity page easier to understand, safer to edit, and fully usable for view-only administrators while preserving the existing backend contracts.

## Information Architecture

The page keeps a focused settings layout instead of becoming a data-dense dashboard. A compact summary appears below the page header and shows the persisted status, login domain, username-length range, reserved-username count, and last-updated value when available.

The editable content uses two columns on wide screens and one column on smaller screens. The main column contains the configuration form. The secondary column contains a sticky username test card. Both columns remain within the existing settings content width and collapse without horizontal scrolling.

The form is divided into three labeled groups:

1. Login domain and activation status.
2. Username length and allowed-character policy.
3. Reserved usernames.

## Form Interaction

The form uses semantic `<form>` submission so Enter and assistive technology follow standard behavior. Field labels remain explicit, errors are connected to their inputs, and validation runs on blur while final validation still runs before save.

The page compares normalized draft values with the last persisted settings. Save is enabled only when the user can manage settings, the draft is valid, a save is not running, and the draft differs from the persisted state. A Discard Changes action restores persisted values and clears field errors.

The page integrates with the existing `useDirtyKey` and global navigation guard. Dirty state starts only after a real normalized change and clears after save, discard, refresh, or successful rehydration.

Changing the login domain or activation status requires a confirmation dialog before the update request is sent. Other policy-only changes save directly. The dialog explains which sensitive fields changed without claiming that the backend rewrites existing user identities.

## Reserved Usernames

Reserved usernames use a local tag input instead of a comma-separated text field. Enter and comma commit a normalized tag, duplicate or empty tags are ignored, and every tag has a keyboard-accessible remove action. The transport request remains `reservedUsernames: string[]`; no backend change is required.

## View-Only Experience

The page remains guarded by `settings.users.view`. Administrators without `settings.users.manage` see persisted configuration in a readable definition-list presentation rather than disabled form controls.

Username preview and availability endpoints also require only `settings.users.view`. The test card therefore remains available to view-only users. Edit, discard, confirmation, and save controls remain restricted to `settings.users.manage`.

## Username Test Flow

The two existing actions become one Test Username action. It requests the generated login-email preview and username availability together for the same normalized username. Successful partial results remain visible if only one request fails, while each failed operation exposes its own localized error.

The result panel shows the generated login email, an icon-and-text availability state, and a localized explanation for the backend reason codes `username_invalid`, `login_domain_missing`, `login_email_taken`, and `reserved_username`. Unknown non-empty reasons use a readable fallback rather than raw empty output.

Changing the test username clears prior results. The action is disabled while a test is running or the username is empty, and repeated submissions cannot start duplicate concurrent requests.

## Feedback and Accessibility

Save, refresh, and username testing expose loading states and prevent duplicate actions. Inline errors and test results use `role="alert"` or `aria-live` as appropriate. Status is conveyed with text and an icon in addition to color. Icon-only tag removal controls have accessible names and visible keyboard focus.

The sticky action region does not cover content on mobile, respects the existing RTL layout, and uses the current Lucide icon set and design tokens.

## Verification

Focused tests cover:

- View-only users see readable settings and can test usernames without edit controls.
- Manage users receive grouped editable fields, dirty-state Save/Discard behavior, and navigation-guard integration.
- Domain or status changes require confirmation; policy-only changes do not.
- Reserved username tags add, deduplicate, and remove values while producing the existing request array.
- Test Username combines preview and availability, prevents duplicate requests, and preserves partial success.
- Known availability reasons are localized and unknown reasons use the fallback.
- Summary status and metadata reflect persisted settings rather than unsaved draft values.
- Form errors and asynchronous results are announced accessibly.
