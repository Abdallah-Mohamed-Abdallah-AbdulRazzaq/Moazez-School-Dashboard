# Communication Performance Scope

## Goal

Reduce initial conversation request fanout and time to readable messages, keep long histories responsive, and make announcement browsing scalable without changing backend contracts.

## Current behavior

- `useConversationMessages` fetches the first 30 messages, then awaits read-summary data before its `refresh` completes.
- `ConversationDetail` hides the entire thread until conversation, participants, messages, and policy requests all finish.
- `useMessageReactions` issues one `getReactions` request for every loaded message. `useMessageAttachments` does the same for messages without inline attachment data. These requests are unbounded.
- `MessagesPanel` renders every accumulated message after older pages are loaded.
- `useAnnouncements` requests at most 50 announcements, sends a request for each search change, and refreshes the full list on every window focus.

## Required behavior

1. Fetch reactions and missing attachments only for messages near the visible thread viewport. Cap each background request pool at four concurrent calls, retain fetched data while a conversation remains open, and discard responses after switching conversations.
2. Render message history as soon as its request finishes. Read receipts, policy, and participant details may arrive later. Mutation controls remain unavailable until the required permissions, policy, and participant data have resolved.
3. Virtualize the accumulated message list with variable-height rows. Preserve initial bottom alignment, the current viewport when older messages are prepended, conditional following of new messages, date separators, and the unread jump control.
4. Page announcements in batches of 20, debounce search by 350 ms, ignore stale responses after filter changes, and refresh on focus only when data is older than 60 seconds. Preserve the visible list during refresh and support loading further pages.

## Constraints

- Work only in the School Dashboard frontend. Do not change backend endpoints, authentication, production configuration, or deployment workflows.
- Use existing `src/components/ui` controls for new UI.
- Preserve Arabic and English copy and keyboard accessibility.
- Apply `clean-code-guard` to each production-code change and `test-guard` to each test change.
- Run focused communication tests, lint, typecheck, and build. Ask the user before `npm run test:run`.

## Acceptance checks

- Opening a 30-message thread no longer starts 30 reaction requests or unbounded attachment requests at once.
- A slow read summary or policy request does not keep fetched messages behind the full-page spinner.
- After loading several history pages, only viewport-adjacent message rows remain mounted, and prepend/append scrolling behaves as before.
- Announcement search issues one request after typing pauses; page navigation returns additional items without repeating already displayed items; an old response cannot replace newer filters.
- Existing realtime, optimistic send, permission, and announcement actions remain intact.
