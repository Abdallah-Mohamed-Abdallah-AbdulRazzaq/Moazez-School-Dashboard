# Communication Admin Authorization — Backend Requirements

**Status:** Supported frontend phase implemented; backend work remains for deferred controls  
**Prepared:** 2026-09-16  
**Backend baseline reviewed:** `origin/main` at `8d30148527808dc24ede7a26f9a189a41eeb5d73`  
**Frontend design:** [Communication Admin Authorization Design](superpowers/specs/2026-09-16-communication-admin-authorization-design.md)

## Purpose

This handoff defines the backend changes required before the School Dashboard can expose the deferred restrictions, blocks, `restrict_sender`, and server-derived effective-state controls. The frontend may expose the operations listed under **Already supported**; this document does not claim the deferred behavior exists today.

The backend remains the final authorization authority. Hiding a frontend control is not an acceptable substitute for enforcing these rules in the mutation use cases.

## Already supported

The reviewed backend already supports the following operations and does not need a replacement API for them:

- School-scoped conversation lifecycle and participant management through the existing permission-protected routes.
- Editing another user's eligible text message through `PATCH /api/v1/communication/messages/:messageId` when the actor is an active participant with moderation authority.
- Soft-deleting another user's message through `POST /api/v1/communication/messages/:messageId/moderation-actions` with the `delete` action, without requiring the moderator to be a participant.
- Linking an attachment to another user's eligible message when the actor is an active participant with the required authority.
- Removing another user's eligible attachment when the actor has message-management authority.
- Message moderation actions for `hide`, `unhide`, and `delete`, including audit entries and message-state realtime events.
- List/create/update/revoke endpoints for communication restrictions, plus list/create/delete endpoints for actor-owned blocks.

## Blocking requirements

### BR-01 — Enforce active restrictions

Restriction records are currently created, listed, updated, revoked, and audited, but message and conversation creation do not consult them.

Add a shared, school-scoped restriction evaluator and apply it server-side before the corresponding mutation:

| Effective restriction | Required enforcement |
| --- | --- |
| `MUTE` | Reject sending a message while the restriction is active. |
| `SEND_DISABLED` | Reject sending a message while the restriction is active. `read_only` remains an accepted request alias for this stored type. |
| `GROUP_CREATE_DISABLED` | Reject creation of a group conversation by the restricted actor. |
| `DIRECT_MESSAGE_DISABLED` | Reject creation of a direct conversation by the restricted actor. |

An active restriction is one whose start time has been reached, whose expiry has not been reached, and which has not been lifted. Expired or lifted restrictions must not block an operation.

Required integration points:

- `POST /api/v1/communication/conversations/:conversationId/messages`
- `POST /api/v1/communication/conversations`

The evaluator must derive the actor and school from the authenticated communication scope. It must not accept either value from the request body.

When a restriction denies an operation, return a stable domain error that distinguishes restriction denial from permission denial, read-only state, archived state, and closed state. Include only safe identifiers and the effective restriction type in error details.

### BR-02 — Make `restrict_sender` effective and atomic

The existing moderation action normalizes `restrict_sender` to `USER_RESTRICTED`, but its use case only records the moderation history entry. It does not create a `CommunicationUserRestriction`; `buildMessageUpdateForAction` returns no update for this action.

`POST /api/v1/communication/messages/:messageId/moderation-actions` with `action: "restrict_sender"` must create an enforceable restriction against the message sender in the same school and in the same transaction as the moderation action.

Extend the accepted payload for this action to carry explicit restriction settings:

```json
{
  "action": "restrict_sender",
  "reason": "Repeated abusive messages",
  "restriction": {
    "type": "send_disabled",
    "startsAt": "2026-09-16T12:00:00.000Z",
    "expiresAt": "2026-09-23T12:00:00.000Z"
  }
}
```

Contract rules:

- `reason` is required and must remain subject to the existing 1000-character maximum.
- `restriction.type` is required for `restrict_sender` and accepts the canonical restriction values already supported by the restriction domain.
- `startsAt` and `expiresAt` are optional ISO-8601 timestamps and follow the existing restriction date validation.
- The target user is always derived from `message.senderUserId`; a client-supplied target user ID must not be accepted.
- If the restriction cannot be created, neither the moderation action nor the restriction may persist.
- The response must include the created moderation action and the created restriction so the client can reconcile without guessing.
- Existing `hide`, `unhide`, and `delete` payloads and responses must remain backward compatible.

If the product decision is to keep restriction creation as a separate request instead, remove `restrict_sender` from the moderation action vocabulary. Do not retain an action that reports success while producing no restriction.

### BR-03 — Enforce user blocks in direct communication

Blocks are currently actor-owned records. They are not checked during direct conversation creation or message sending.

For a direct conversation between users A and B, deny the operation when either active block exists:

- A blocks B.
- B blocks A.

Required integration points:

- Creating a direct conversation.
- Sending a message in an existing direct conversation.

Block checks must be bilateral, school-scoped, and based on active block records. The response must use a stable domain error without revealing which party created the block. Group-conversation behavior is unchanged unless a separate product requirement defines it.

The existing routes below may remain actor-scoped and should be labeled as personal block management rather than school-wide moderation:

- `GET /api/v1/communication/blocks`
- `POST /api/v1/communication/blocks`
- `DELETE /api/v1/communication/blocks/:blockId`

If school administrators must inspect all school blocks, add a separate permission-protected administrative listing contract. Do not broaden the personal list route silently.

### BR-04 — Enforce message edit and delete policy flags

The policy fields `allowMessageEdit` and `allowMessageDelete` are stored and presented, but the current edit and ordinary delete use cases do not enforce them.

Apply the effective school policy in:

- `PATCH /api/v1/communication/messages/:messageId`
- `DELETE /api/v1/communication/messages/:messageId`

Required behavior:

- Reject ordinary edit when `allowMessageEdit` is false.
- Reject ordinary delete when `allowMessageDelete` is false.
- Use stable policy-denial domain errors so the client can refresh capabilities and show an accurate message.
- Keep moderation actions (`hide`, `unhide`, and moderation `delete`) available to actors with `communication.messages.moderate`; these actions are safety controls rather than ordinary author mutations.
- Preserve school scope, message-state checks, conversation-state checks, ownership/moderation checks, and audit behavior.

### BR-05 — Expose effective communication state and capabilities

The participant response currently has no effective block or restriction state. The frontend must not reconstruct security decisions from several lists or treat absent fields as `false`.

Add a server-derived capability/state object for the current actor in a conversation. It may be returned with conversation detail or through a dedicated endpoint, but it must have one authoritative contract. Required fields:

```json
{
  "canSendMessage": false,
  "sendDeniedReason": "send_disabled",
  "canCreateDirectConversation": true,
  "canCreateGroupConversation": false,
  "effectiveRestrictions": ["send_disabled", "group_create_disabled"],
  "hasDirectBlock": false
}
```

Contract rules:

- Values are computed for the authenticated actor and current school.
- `canSendMessage` reflects participant status, participant mute state, conversation status, read-only rules, communication policy, active restrictions, and bilateral direct-message blocks.
- `sendDeniedReason` is a stable machine-readable value or `null`; it must not contain private moderation notes.
- `effectiveRestrictions` contains active restriction types only.
- `hasDirectBlock` indicates that direct communication is blocked without identifying which user initiated the block.
- Mutation endpoints remain authoritative even when a previously fetched capability says an action is allowed.

The existing read-only rule must be represented accurately: an active participant may bypass read-only mode when they have global message-management authority **or** their participant role is `OWNER`, `ADMIN`, or `MODERATOR`. Closed and archived conversations still reject sending.

### BR-06 — Publish restriction-state changes

Open clients need to stop offering message composition when a restriction becomes effective or is revoked.

Publish a user-scoped realtime event after a restriction is created, updated, revoked, becomes active, or expires. The payload must contain only the affected user ID, public restriction type/status/timestamps, and an event timestamp; it must not contain the moderation reason, note, or internal metadata.

Document the final event name and payload in the backend realtime contract. Event delivery improves reconciliation but does not replace REST authorization.

## Security and transaction requirements

- Every lookup and mutation must remain scoped to the authenticated school.
- Permission checks remain mandatory: restriction and moderation management require `communication.messages.moderate`; normal sending and conversation creation retain their existing permissions.
- Do not trust client-supplied actor, school, sender, or moderation target IDs.
- A moderator must not restrict themselves through `restrict_sender`.
- Restriction and block denials must not disclose private reasons or which side of a direct conversation created a block.
- Every restriction creation, update, and revocation retains the existing audit behavior.
- The `restrict_sender` moderation record and its restriction record must commit or roll back together.
- Realtime events are emitted only after successful persistence.

## Required backend tests

Add focused tests for the following cases:

1. Each active restriction blocks its corresponding mutation.
2. Future, expired, and lifted restrictions do not block mutations outside their effective interval.
3. A direct-message block denies direct conversation creation and sending in both block directions without disclosing the blocker.
4. Blocks do not change group behavior unless explicitly implemented as a separate rule.
5. `restrict_sender` creates one moderation action and one restriction for the message sender.
6. Failure to create either record rolls back both records.
7. A moderator cannot use a request body to change the restriction target or school.
8. `allowMessageEdit: false` rejects ordinary editing.
9. `allowMessageDelete: false` rejects ordinary deletion.
10. Moderation hide, unhide, and delete remain available when ordinary edit/delete policy is disabled.
11. Capability output agrees with the mutation guards for active, muted, restricted, blocked, read-only, closed, and archived scenarios.
12. Restriction realtime events are user-scoped, occur after persistence, and omit private reason/metadata fields.

Run the backend's focused Communication tests, lint, and type checks. Full-suite execution remains a separate repository-owner decision.

## Backend completion criteria for deferred features

The deferred frontend controls can be implemented when all of the following are true:

- Restrictions and bilateral direct-message blocks are enforced by mutations, not only represented in storage.
- `restrict_sender` either creates a real restriction atomically or is removed from the API vocabulary.
- Message edit/delete policy flags are enforced server-side.
- The frontend has a documented, server-derived effective capability/state contract.
- Restriction-state changes have a documented realtime reconciliation path.
- Focused backend tests cover the authorization matrix and pass.
- The deployed backend version or commit containing these contracts is supplied to the frontend team.

## Verification evidence from the reviewed baseline

- The API prefix is set to `/api/v1` in `src/main.ts`.
- Safety routes and their permissions are declared in `src/modules/communication/controller/communication-safety.controller.ts`.
- `restrict_sender` records `USER_RESTRICTED`, while only hide, unhide, and delete produce message updates in `src/modules/communication/application/communication-moderation.use-cases.ts`.
- Restriction creation persists and audits records in `src/modules/communication/application/communication-restriction.use-cases.ts`; the message-send path in `communication-message.use-cases.ts` does not load restrictions.
- Block listing and deletion are scoped to the current actor in `src/modules/communication/application/communication-block.use-cases.ts`.
- Message update loads policy only for `maxMessageLength`, and ordinary delete does not load policy, in `src/modules/communication/application/communication-message.use-cases.ts`.
- Participant presentation does not include block/restriction state in `src/modules/communication/presenters/communication-participant.presenter.ts`.
- Moderation realtime state changes cover hide, delete, and unhide only in `src/modules/communication/application/communication-realtime-events.service.ts`.
