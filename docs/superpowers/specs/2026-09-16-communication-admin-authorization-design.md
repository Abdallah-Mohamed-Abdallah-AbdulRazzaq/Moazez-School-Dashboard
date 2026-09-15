# Communication Admin Authorization Design

**Date:** 2026-09-16

## Goal

Align the School Dashboard Communication UI with the backend's authorization capabilities. School administrators and other users with explicit Communication management permissions must be able to discover and use the actions the backend permits, while ordinary users remain limited by message ownership, participant state, conversation state, and school policy.

The backend remains the final authorization authority. Frontend capabilities determine which controls are discoverable and which workflow to start; backend errors still decide whether a mutation succeeds.

## Scope

This change covers:

- A centralized frontend authorization layer for Communication.
- Conversation, participant, invite, and join-request management visibility.
- Own-message and cross-user message editing, deletion, and attachment management.
- Read-only conversation sending for eligible administrators.
- A discoverable Safety hub for reports, moderation, restrictions, and blocks.
- Direct moderation actions from reported-message details.
- Shared moderation dialogs, endpoint selection, error handling, and reconciliation.
- Focused unit, component, hook, and API tests for the new behavior.

This change does not alter backend authorization, database records, API routes, or permission assignments. It does not refactor unrelated Communication pages or redesign the overall dashboard navigation.

## Current Problems

The current UI combines account permissions with ownership and participant-role checks in individual components. This produces several mismatches:

- `MessageBubble` restricts edit, delete, and attachment controls to the current user's own messages even when the session has moderation permissions.
- Conversation management requires a manager participant role in addition to `communication.conversations.manage`, although the backend management routes rely on the permission and school scope.
- The composer blocks every user in a read-only conversation, although the backend allows an active participant with moderation or admin management permission to bypass read-only mode.
- Reports are discoverable, but the existing moderation, restrictions, and blocks pages have no visible navigation.
- Report details update report workflow status but do not expose message moderation actions.
- The moderation form displays backend aliases as separate actions, producing eight buttons for four operations.

## Authorization Architecture

### Pure capability model

Create a pure Communication authorization module. It accepts normalized inputs and returns explicit capability results without importing React, calling APIs, or reading global state.

Inputs include:

- Granted `PermissionKey` values from the authenticated membership.
- Current user ID.
- Communication policy.
- Conversation type, status, and read-only state.
- Current participant role and status, when present.
- Message sender, kind, status, and delivery state, when evaluating a message.
- Attachment uploader and deletion state, when evaluating an attachment.

The module returns capabilities grouped by scope:

```ts
interface CommunicationModuleCapabilities {
  canViewReports: boolean;
  canModerateMessages: boolean;
  canManageRestrictions: boolean;
  canManageBlocks: boolean;
}

interface CommunicationConversationCapabilities {
  canManageConversation: boolean;
  canManageParticipants: boolean;
  canManageInvites: boolean;
  canReviewJoinRequests: boolean;
  canSendMessage: boolean;
  canLeaveConversation: boolean;
  canJoinRealtimeRoom: boolean;
}

type MessageDeleteMode = "self" | "moderation" | null;

interface CommunicationMessageCapabilities {
  canEditMessage: boolean;
  canDeleteMessage: boolean;
  deleteMode: MessageDeleteMode;
  canAddAttachment: boolean;
  canRemoveAttachment: boolean;
  canReportMessage: boolean;
  canViewMessageInfo: boolean;
  canHideMessage: boolean;
  canUnhideMessage: boolean;
  canRestrictSender: boolean;
  canViewModerationHistory: boolean;
}
```

Exact exported names may be adjusted during implementation to match local naming conventions, but there must be one authoritative capability calculation rather than parallel rules in page components.

### React adapter

A thin React hook gathers session permissions and normalized Communication state, then invokes the pure functions. The hook must not perform mutations. Mutation hooks and components consume capability output.

The existing `getConversationPermissionFlags` helper will be replaced or reduced to an adapter over the centralized layer so it cannot compete with the new rules.

### Authorization rules

- School scope and backend guards remain authoritative.
- Global management permissions do not imply message sending. Sending still requires an active participant.
- `communication.conversations.manage` enables same-school conversation metadata and lifecycle controls without requiring a manager participant role.
- `communication.participants.manage` enables participant, invite, and join-request management without requiring a manager participant role. Backend owner-protection rules remain authoritative.
- An active participant with `communication.messages.moderate` or `communication.admin.manage` may send in a read-only conversation when the communication policy is enabled and no mute, block, restriction, closed, or archived state prevents sending.
- Ordinary users may edit and delete only their own eligible messages.
- A user with moderation authority may edit eligible text messages sent by another user.
- Cross-user deletion uses moderation; it never silently falls back to ordinary deletion.
- Administrators may add or remove attachments on another user's eligible message when the backend permission and policy allow it.
- Hidden and deleted messages suppress actions that the backend rejects. Hidden messages may expose Unhide and Delete moderation actions. Deleted messages expose no further mutation.

## Conversation UX

### Message action menu

The message action menu consumes per-message capabilities.

Own messages retain the existing workflows:

- Edit uses `PATCH /api/v1/communication/messages/:messageId`.
- Delete uses `DELETE /api/v1/communication/messages/:messageId`.
- Attachment linking and removal use the existing attachment endpoints.

Eligible messages from other users expose:

- Edit Message
- Delete Message
- Add Attachment
- Remove Attachment
- Hide Message
- Unhide Message, when currently hidden
- Restrict Sender
- View Moderation History

Editing another user's message opens the existing editor with a warning confirmation before submission. The warning states that the original author's text will be changed. The update still uses the existing message PATCH endpoint and relies on its audit record.

Deleting another user's message opens the shared moderation dialog. A non-empty reason is required, confirmation is required, and the frontend submits a moderation action with `action: "delete"` to `POST /api/v1/communication/messages/:messageId/moderation-actions`.

Hide, Unhide, and Restrict Sender use the same dialog and endpoint with the supported canonical actions `hide`, `unhide`, and `restrict_sender`. Backend aliases such as `message_deleted` are accepted by the API but are not presented as separate UI operations.

### Attachment behavior

When capabilities allow it, an administrator may add an attachment to or remove an attachment from another user's existing eligible message. Upload, file validation, linking, and deletion continue through the existing attachment hooks and API functions. The UI must not imply that the original sender uploaded an administrator-added file; existing uploader metadata remains the source of attribution.

### Conversation controls

Conversation edit, archive, close, and reopen controls use global permission capabilities rather than participant management roles. Participant, invite, and join-request controls follow `communication.participants.manage` plus resource-state rules.

The UI continues to suppress operations invalid for the conversation state. Backend errors such as last-owner protection, stale status, or policy restrictions are mapped and displayed rather than duplicated as incomplete frontend business logic.

### Read-only sending

The composer remains unavailable to non-participants and inactive participants. It becomes available in a read-only conversation only when the actor:

- Is an active participant.
- Has `communication.messages.send`.
- Has `communication.messages.moderate` or `communication.admin.manage`.
- Is not muted, blocked, removed, restricted, or otherwise prevented by policy.
- Is not in a closed or archived conversation.

The existing read-only label must match this behavior.

## Safety Hub

### Information architecture

The Communication Safety tab becomes a hub with permission-filtered sub-navigation:

- Reports: `/communication/safety/reports`
- Moderation: `/communication/safety/moderation`
- Restrictions: `/communication/safety/restrictions`
- Blocks: `/communication/safety/blocks`

Unavailable sections are hidden. Every direct route retains its existing permission guard.

The report list is the Safety landing destination. Existing localized `/communication/moderation` and `/communication/moderation/:reportId` entry points remain compatibility redirects to the canonical Safety report routes.

The existing moderation, restrictions, and blocks pages are reused. A shared Safety sub-navigation component is rendered on all four sections so none becomes an orphaned route.

### Report details moderation

Reported-message details add direct moderation controls for:

- Hide
- Unhide
- Delete
- Restrict Sender
- View Moderation History

Actions use the same capability calculation, dialog, validation, and dispatcher as conversation actions. A moderation action does not automatically resolve the report. Report status and resolution note remain an explicit, separate workflow.

### Moderation form cleanup

The moderation form displays four semantic operations rather than backend aliases:

- Hide
- Unhide
- Delete
- Restrict Sender

Availability depends on message state. For example, Unhide is available only for a hidden message, while mutation controls are removed for a deleted message.

## Mutation Data Flow

Introduce a shared moderation command hook or dispatcher used by conversation messages, report details, and the dedicated moderation page.

1. The component checks a centralized capability and opens the appropriate confirmation or reason dialog.
2. The dispatcher validates required input and calls the existing API function.
3. On success, the initiating screen applies the returned message state or refreshes the narrow affected resource.
4. Existing realtime events reconcile other sessions, the message list, conversation previews, reports, and moderation history.
5. On failure, optimistic state is discarded by refreshing the affected message, attachment collection, report, or moderation history.
6. The existing Communication error mapper provides localized, domain-specific feedback.

The dispatcher must not contain authorization policy. It accepts only commands already allowed by the capability layer and still handles backend rejection safely.

## Error Handling

The frontend must preserve and extend existing domain-error behavior for:

- Permission denied or conversation membership requirements.
- Message already deleted or hidden.
- Invalid moderation transition.
- Archived or closed conversations.
- Disabled Communication or attachment policy.
- Muted, blocked, restricted, removed, or read-only participants.
- Last-owner and participant lifecycle protections.
- Stale message, report, or attachment state.

Known stale-state errors trigger a targeted refresh. Unknown failures use the existing fallback toast. A failed optimistic action must not leave the local message marked edited, hidden, or deleted.

## Testing Strategy

### Capability unit tests

Use table-driven tests covering:

- Own versus other-user messages.
- Ordinary, management, moderation, and admin permission combinations.
- Participant and non-participant administrators.
- Owner, admin, moderator, member, read-only, muted, removed, and left participant states.
- Active, read-only, closed, and archived conversations.
- Sent, hidden, deleted, pending, and failed messages.
- Policy-enabled and policy-disabled actions.
- Own and other-user attachments.
- Safety-section visibility by permission.

### Component tests

Verify that:

- Cross-user controls render only for authorized sessions.
- Ordinary users cannot mutate other users' messages or attachments.
- Cross-user editing requires confirmation.
- Cross-user deletion requires a reason and selects moderation mode.
- Own-message deletion selects ordinary mode.
- Read-only sending is enabled only for eligible active admin participants.
- Global management permissions expose conversation and participant controls without a manager participant role.
- Safety sub-navigation exposes only permitted sections.
- Report moderation does not automatically resolve a report.
- The moderation form has no alias duplicates.

### Hook and API tests

Verify:

- Correct endpoint and payload selection for self deletion and moderation deletion.
- Edit, attachment, hide, unhide, and restriction commands.
- Reason validation.
- Targeted refresh after mutation failure.
- Realtime reconciliation after message and attachment state changes.
- Compatibility redirects for previous report URLs.

All changed production code receives a Clean Code Guard review. All changed test code receives a Test Guard review. Focused tests, lint, type checking, and build verification may run during implementation. The full test suite requires explicit owner approval before it is run.

## Acceptance Criteria

- One centralized capability layer is the source of frontend Communication authorization decisions.
- A school administrator can manage any same-school conversation allowed by their permissions without first becoming a manager participant.
- An active administrator participant can send in a read-only conversation when the backend permits it.
- Authorized administrators can edit another user's eligible text message after confirming the authorship warning.
- Authorized administrators can add or remove attachments on another user's eligible message.
- Own-message deletion uses ordinary DELETE; cross-user deletion uses moderation with a required reason.
- Safety Reports, Moderation, Restrictions, and Blocks are reachable through visible permission-aware navigation.
- Report details expose direct moderation without implicitly resolving the report.
- The moderation UI exposes four semantic actions with no alias duplicates.
- Backend rejection restores consistent frontend state and displays a localized error.
- Existing ordinary-user ownership restrictions and backend-protected participant rules remain intact.

## Delivery Boundaries

Implementation stays within the School Dashboard repository. No backend, database, deployment, environment, or production configuration changes are included. Any newly discovered backend contract gap must be reported rather than patched from this frontend task.
