# Online Session Meeting Lobby Design

## Goal

Replace the generic online-session editor presentation with a focused meeting-lobby detail page. The page should feel specific to Google Meet, Zoom, Microsoft Teams, Webex, or a custom provider while continuing to use the existing academic-content API contract.

This design does not require backend changes.

## Product decisions

- The detail page opens in a read-oriented meeting-lobby presentation.
- A prominent **Join session** action is the primary action.
- **Join session** remains available before, during, and after the scheduled time when the saved meeting URL is a valid HTTPS URL.
- Editing remains a separate action and reuses the existing academic-content editing operations.
- The page uses a single scrolling layout rather than section tabs or the generic editor navigation.
- The page must not invent participant counts, attendance, host controls, chat, recording state, or analytics.

## Backend contract

The page consumes the existing `AcademicContentDetail` aggregate for `ONLINE_SESSION`. Its session-specific fields are defined by `AcademicContentOnlineSessionDetail`:

- `platform`
- `providerName`
- `joinUrl`
- `accessCode`
- `instructions`
- `startAt`
- `endAt`
- `timezone`
- `timetableEntryId`

The aggregate also supplies the existing base metadata, academic targets, assets, links, tags, publication values, timestamps, and status. The UI derives temporal state, duration, countdown text, and readiness locally without additional requests.

## Information architecture

### Page header

The header contains:

- Breadcrumb: Academic Content Center → Online Sessions → session title.
- Back to sessions action.
- Edit session action for users with `academics.academic_content.manage`.
- Existing lifecycle and publication actions when the current user has the required permissions.
- The existing lifecycle actions supported by the loaded content status.

### Meeting lobby hero

The hero is the visual center of the page. It contains:

- The platform icon from the existing meeting-platform asset set.
- Platform-specific accent styling that remains compatible with the application color system.
- Session title and safely rendered rich-text description.
- Derived state: Upcoming, Live now, or Ended.
- Start time, end time, duration, and saved timezone.
- The prominent Join session action.
- Access code with a copy action when an access code exists.
- `providerName` when `platform` is `OTHER`.

The Join action opens `joinUrl` in a new browser tab using safe external-link attributes. When the URL is absent or is not valid HTTPS, the action stays visible but disabled and explains that the meeting link is unavailable.

### Main information cards

The content below the hero uses focused cards:

1. **Meeting instructions** — safely renders `instructions`. The card is omitted when instructions are absent.
2. **Target audience** — renders the academic targets already present in the detail aggregate.
3. **Schedule** — repeats the precise start/end information, duration, timezone, and timetable reference when available.
4. **Meeting materials** — renders existing academic-content assets and uses the established download behavior.
5. **Related links** — renders the saved academic-content links.
6. **Tags** — renders the saved academic-content tags.

Optional cards are omitted when they have no useful content. The audience and core schedule remain visible because they are primary meeting context.

### Context rail

On desktop, a compact right rail contains:

- Content status.
- Publication status.
- `publishAt`, `visibleFrom`, and `visibleUntil` when present.
- Created and last-updated timestamps.
- A meeting-readiness summary derived from required saved fields only.

On smaller screens, the rail moves below the meeting hero and before supplementary cards.

## Temporal behavior

Temporal state is derived from `startAt`, `endAt`, and the current instant:

- `now < startAt`: Upcoming.
- `startAt <= now < endAt`: Live now.
- `now >= endAt`: Ended.

The exact start instant is live. The exact end instant is ended. Duration is calculated from `endAt - startAt`. Upcoming meetings may show a compact countdown; the absolute scheduled time remains the authoritative display.

Temporal state never controls Join-session availability. URL validity controls Join-session availability.

## Editing and permissions

The lobby is readable independently of management permission.

- Users with `academics.academic_content.manage` can enter the existing editing workflow through Edit session. The action adds `mode=edit` to the current detail URL and replaces the lobby body with the existing generic academic-content section editor for this online session. Returning to the lobby removes `mode=edit`. This preserves the current forms and save operations without duplicating them in the lobby.
- Users without management permission receive the same meeting lobby without editing controls.
- Publication actions continue to use the existing publication permission and workflow.
- Asset and link mutations remain in the editing workflow; the lobby presents them as read-only meeting resources.

The proposed specialized view should follow the established specialized detail-view dispatch used by teacher preparations, weekly plans, guardian notes, and subject resources in `AcademicContentEditorPage.tsx`.

## Proposed frontend boundaries

The following are proposed components, not existing symbols:

- `OnlineSessionEditorView` coordinates lobby mode, the `mode=edit` transition, and existing editor callbacks.
- `OnlineSessionHeader` owns breadcrumbs and permitted lifecycle actions.
- `OnlineSessionLobbyHero` presents platform branding, temporal state, schedule, access code, and Join session.
- `OnlineSessionInstructions` presents rich-text meeting instructions.
- `OnlineSessionAudienceCard` presents saved targets.
- `OnlineSessionScheduleCard` presents schedule and timetable context.
- `OnlineSessionMaterials` presents assets and related links.
- `OnlineSessionContextRail` presents publication and audit metadata.

A focused model module owns pure derivations for temporal state, duration, countdown text, URL readiness, and the meeting-readiness summary. Components consume those functions rather than duplicating date or validation logic.

Existing shared UI components remain the default for buttons, badges, cards, empty states, rich-text rendering, dropdowns, and dialogs. The existing `MeetingPlatformIcon` supplies platform imagery.

## Loading, incomplete, and error states

- Initial loading uses the existing partial loader behavior.
- Aggregate-load failure uses the existing academic-content error mapping and retry action.
- Missing session-specific details produce an incomplete-setup state rather than fabricated defaults.
- Authorized users see an Edit session recovery action in the incomplete state.
- Missing optional fields do not block the page.
- A missing or invalid meeting URL disables only Join session; it does not hide the rest of the detail page.
- Asset download failures use the existing user-facing error handling pattern.

## Accessibility and responsive behavior

- Join session has a descriptive accessible name including the session title when practical.
- Copy-access-code feedback is announced without relying only on color.
- Platform identity is available as text; the icon is decorative.
- Status badges meet the existing contrast standards and never communicate state through color alone.
- Keyboard focus remains visible on all actions.
- External-link behavior is communicated by icon or accessible text.
- Mobile places the meeting title, timing, and Join session before supplementary information.
- Long titles, URLs, instructions, and target labels wrap without causing horizontal page overflow.

## Testing strategy

Pure model tests cover:

- Upcoming, exact-start, live, exact-end, and ended temporal boundaries.
- Duration derivation.
- Valid, missing, and invalid HTTPS meeting URLs.
- Readiness derivation from required fields.

Component tests cover:

- Google Meet, Zoom, Microsoft Teams, Webex, and Other platform presentation.
- An enabled Join action for a valid URL in every temporal state.
- A disabled Join action for missing or invalid URLs.
- Access-code copy behavior and confirmation.
- Omission of empty optional cards.
- Incomplete session details.
- Permission-based visibility of Edit session.
- Rendering of targets, assets, links, tags, publication data, and audit metadata from the aggregate.
- No presentation of unsupported attendance, participant, recording, chat, or analytics data.

Translation parity tests cover the added English and Arabic strings. Focused component and model tests run during implementation; the full test suite requires explicit owner approval under the repository working agreement.

## Acceptance criteria

- Opening an online session presents a meeting-specific lobby rather than the generic editor navigation.
- The correct meeting-platform icon is visible.
- A valid saved HTTPS meeting URL always produces an enabled Join session action.
- Start/end time, duration, timezone, temporal state, and access code are accurate.
- All useful fields from the existing detail aggregate have an intentional presentation or remain accessible through the existing editing workflow.
- The page does not issue additional requests to fabricate unsupported meeting data.
- Read-only and management experiences respect existing permissions.
- English and Arabic layouts remain usable on desktop and mobile.
