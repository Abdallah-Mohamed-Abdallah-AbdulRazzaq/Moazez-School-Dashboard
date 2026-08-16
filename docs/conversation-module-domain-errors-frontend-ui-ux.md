# Conversation Module Domain Errors — Frontend UI/UX Handoff

Repo reviewed: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`  
Module focus: `src/modules/communication/*`, app-facing message use cases, and `ERROR_CATALOG.md`.

---

## 1. Backend Error Shape

All backend domain errors should be handled using the stable machine code:

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    traceId?: string;
  };
};
```

### Frontend rule

Use:

```ts
const code = error?.response?.data?.error?.code;
```

Do **not** depend on `message` for logic, because messages can be translated by `Accept-Language`.

---

## 2. Frontend Error Handling Strategy

### Recommended UX behavior

1. **Use error `code` for logic.**
2. **Use backend `message` only as fallback.**
3. **Use `details.field` for form-level errors when available.**
4. **Refresh stale UI after conflict errors.**
5. **Disable impossible actions before sending requests.**

Example:

```ts
export function getConversationErrorMessage(code?: string, fallback?: string) {
  if (!code) return fallback ?? "Something went wrong. Please try again.";
  return CONVERSATION_ERROR_MESSAGES[code] ?? fallback ?? "Something went wrong. Please try again.";
}
```

---

## 3. Core Conversation Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.policy.disabled` | 403 | Communication is disabled by school policy. | Disable create/send/manage actions. Show a banner: **"Messaging is disabled by school policy."** |
| `communication.policy.not_configured` | 404 | Communication policy is missing. | Hide advanced messaging features and show admin-facing setup message. |
| `communication.policy.invalid` | 422 | Policy configuration is invalid. | Show generic policy error and suggest contacting admin. |
| `communication.conversation.invalid_type` | 422 | Conversation type is invalid. | Fix frontend enum/options. Do not allow custom unsupported type values. |
| `communication.scope.invalid` | 422 | Conversation scope/context is invalid. | Show validation error near relevant field using `details.field` if available. |
| `communication.conversation.archived` | 409 | Conversation is archived. | Show archived badge. Disable composer, metadata edits, member changes, archive/close actions. |
| `communication.conversation.closed` | 409 | Conversation is closed. | Show closed badge. Disable composer and conversation mutation actions. Allow reopen only for users with permission. |
| `communication.conversation.not_member` | 403 | User is not a member or no longer has access. | Remove from active conversation list or show access-lost state with refresh CTA. |
| `communication.conversation.direct_duplicate` | 409 | Direct conversation already exists. | Navigate/open the existing conversation if ID is returned; otherwise show "Conversation already exists." |
| `communication.conversation.group_limit_exceeded` | 409 | Group member limit exceeded. | Prevent selecting more users than the limit if known. Show member limit message. |
| `not_found` | 404 | Conversation/context resource not found or outside current school scope. | Show not-found state and refresh list. |
| `validation.failed` | 400 | Generic request validation failed. | Show form-level errors from `details`; fallback to generic validation message. |

---

## 4. Required Conversation Type Values

Use only these frontend values:

```ts
export type ConversationType =
  | "direct"
  | "group"
  | "classroom"
  | "grade"
  | "section"
  | "stage"
  | "school_wide"
  | "support"
  | "system";
```

### UI recommendation

- Do not expose `system` as a normal user-created option unless the product explicitly needs it.
- For scoped types:
  - `classroom` requires `classroomId`
  - `grade` requires `gradeId`
  - `section` requires `sectionId`
  - `stage` requires `stageId`

If any required ID is missing, backend can return `communication.scope.invalid`.

---

## 5. Required Conversation Status Values

Use only these frontend values:

```ts
export type ConversationStatus = "active" | "archived" | "closed";
```

### UI recommendation

| Status | UI Behavior |
|---|---|
| `active` | Normal send/manage actions available based on permissions. |
| `archived` | Read-only history state. Disable composer and member management. |
| `closed` | Finalized/closed state. Disable composer and member management. Show reopen action only if allowed. |

---

## 6. Participant / Member Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.participant.already_exists` | 409 | User already exists in this conversation. | Mark selected user as already added. Do not duplicate in member picker. |
| `communication.participant.not_found` | 404 | Participant was not found. | Refresh members list and show "Member no longer exists in this conversation." |
| `communication.participant.limit_exceeded` | 409 | Participant limit exceeded. | Disable adding more users when limit is reached. |
| `communication.participant.role_forbidden` | 403 | Role/status transition is not allowed. | Hide forbidden roles from dropdown; disable invalid promote/demote/status actions. |
| `communication.participant.cannot_remove_owner` | 409 | Last owner cannot be removed/demoted. | Require assigning another owner before removing/demoting current owner. |
| `communication.participant.not_active` | 409 | Participant is inactive/removed/blocked/left. | Refresh member state. Disable promote/demote/remove actions for inactive users. |

### Participant roles

```ts
export type ParticipantRole =
  | "OWNER"
  | "ADMIN"
  | "MODERATOR"
  | "MEMBER"
  | "READ_ONLY"
  | "SYSTEM";
```

### UI recommendation

- Do not allow users to assign `SYSTEM`.
- Only show role management controls to authorized managers.
- Prevent removing the last `OWNER` in frontend before request.
- Show role badges:
  - Owner
  - Admin
  - Moderator
  - Member
  - Read-only

---

## 7. Invite / Join Request Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.invite.invalid_status` | 409 | Invite already handled, expired, cancelled, or invalid transition. | Refresh invite list. Show "This invite is no longer pending." |
| `communication.invite.duplicate_pending` | 409 | Pending invite already exists. | Show pending state instead of sending another invite. |
| `communication.join_request.invalid_status` | 409 | Join request already handled or invalid transition. | Refresh request list. Show "This request is no longer pending." |
| `communication.join_request.duplicate_pending` | 409 | User already has pending join request. | Show "Join request already pending." Disable request button. |

### UI recommendation

For invite buttons:

```ts
if (invite.status !== "PENDING") {
  disableAcceptRejectButtons();
}
```

For join request button:

```ts
if (hasPendingJoinRequest) {
  showPendingState();
}
```

---

## 8. Message Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.message.empty` | 422 | Message body is empty or media/file message has no attachment. | Disable send button until body or attachment exists. |
| `communication.message.too_long` | 422 | Message exceeds max length. | Show character counter and limit warning before submission. |
| `communication.message.kind_invalid` | 422 | Invalid message kind or invalid body/attachment combination. | Keep composer rules strict: text without files; media/file with attachment. |
| `communication.message.send_forbidden` | 403 | Sending is blocked: read-only conversation, muted participant, or read-only participant. | Disable composer and show reason banner. |
| `communication.message.not_sender` | 403 | User is not the sender and cannot edit/delete. | Hide edit/delete actions unless sender or manager. |
| `communication.message.not_editable` | 409 | Message cannot be edited, usually non-text message. | Show edit only for editable text messages. |
| `communication.message.deleted` | 409 | Message is deleted. | Replace body with deleted placeholder. Refresh if action fails. |
| `communication.message.hidden` | 409 | Message is hidden/moderated. | Replace body with hidden/moderated placeholder. |
| `communication.receipt.invalid_recipient` | 422 | User cannot mark/read receipt because participant is not valid. | Silently ignore read receipt failure or refresh access state. |

### Composer UI recommendations

Disable send when:

```ts
const isSendDisabled =
  conversation.status !== "active" ||
  conversation.isReadOnly === true ||
  participant.role === "READ_ONLY" ||
  participant.status === "MUTED" ||
  !hasMessageBodyOrAttachment;
```

Show specific composer banners:

| State | Banner |
|---|---|
| Archived | `This conversation is archived. You can view messages but cannot send new ones.` |
| Closed | `This conversation is closed.` |
| Read-only | `This conversation is read-only.` |
| Muted | `You are muted in this conversation.` |
| Read-only participant | `You have read-only access to this conversation.` |

---

## 9. Attachment / Media Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.attachment.not_allowed` | 403 | Attachments are disabled/not allowed. | Hide attachment picker or disable upload. |
| `communication.attachment.invalid_file` | 422 | File is invalid for this message. | Show file validation error. Remove invalid file from queue. |
| `files.upload.size_exceeded` | 413 | File is too large. | Validate file size before upload. |
| `files.upload.mime_not_allowed` | 415 | File type is not allowed. | Restrict accepted MIME types in file picker. |
| `files.not_found` | 404 | File not found or inaccessible. | Show broken attachment state. |

---

## 10. Reaction / Report / Moderation / Restriction Errors

| Error Code | HTTP | Meaning | Frontend UI/UX Recommendation |
|---|---:|---|---|
| `communication.reaction.duplicate` | 409 | Reaction already exists. | Treat as already reacted. Update UI optimistically. |
| `communication.report.duplicate` | 409 | Message was already reported. | Show "Already reported" state. |
| `communication.report.invalid_status` | 409 | Report status transition is invalid. | Refresh report/moderation queue. |
| `communication.moderation.forbidden` | 403 | User cannot perform moderation action. | Hide moderation tools for unauthorized users. |
| `communication.user.blocked` | 403 | User is blocked. | Disable direct messaging and show blocked state. |
| `communication.user.restricted` | 403 | User is restricted. | Disable restricted actions and show restriction message. |
| `communication.user.restriction_conflict` | 409 | Restriction conflicts with active state. | Refresh restrictions and show conflict message. |

---

## 11. Recommended Frontend Error Map

```ts
export const CONVERSATION_ERROR_MESSAGES: Record<string, string> = {
  "communication.policy.disabled": "Messaging is disabled by school policy.",
  "communication.policy.not_configured": "Communication policy is not configured.",
  "communication.policy.invalid": "Communication policy is invalid.",

  "communication.conversation.not_member": "You are not a member of this conversation.",
  "communication.conversation.archived": "This conversation is archived.",
  "communication.conversation.closed": "This conversation is closed.",
  "communication.conversation.invalid_type": "Conversation type is invalid.",
  "communication.conversation.direct_duplicate": "Direct conversation already exists.",
  "communication.conversation.group_limit_exceeded": "Conversation group member limit is exceeded.",

  "communication.participant.already_exists": "Participant already exists in this conversation.",
  "communication.participant.not_found": "Participant was not found.",
  "communication.participant.limit_exceeded": "Participant limit is exceeded.",
  "communication.participant.role_forbidden": "Participant role is not allowed.",
  "communication.participant.cannot_remove_owner": "Conversation owner cannot be removed.",
  "communication.participant.not_active": "Participant is not active.",

  "communication.invite.invalid_status": "Invite status transition is invalid.",
  "communication.invite.duplicate_pending": "A pending invite already exists.",
  "communication.join_request.invalid_status": "Join request status transition is invalid.",
  "communication.join_request.duplicate_pending": "A pending join request already exists.",

  "communication.message.empty": "Message cannot be empty.",
  "communication.message.too_long": "Message exceeds maximum length.",
  "communication.message.hidden": "Message is hidden.",
  "communication.message.deleted": "Message is deleted.",
  "communication.message.not_editable": "Message cannot be edited.",
  "communication.message.not_sender": "Only the sender can perform this message action.",
  "communication.message.send_forbidden": "Sending messages is not allowed.",
  "communication.message.kind_invalid": "Message kind is invalid.",
  "communication.receipt.invalid_recipient": "Receipt recipient is invalid.",

  "communication.reaction.duplicate": "Reaction already exists.",
  "communication.attachment.not_allowed": "Attachments are not allowed.",
  "communication.attachment.invalid_file": "Attachment file is invalid.",
  "communication.report.duplicate": "Message report already exists.",
  "communication.report.invalid_status": "Report status transition is invalid.",
  "communication.moderation.forbidden": "Moderation action is not allowed.",
  "communication.user.blocked": "User is blocked.",
  "communication.user.restricted": "User is restricted.",
  "communication.user.restriction_conflict": "User restriction conflicts with an active state.",
  "communication.scope.invalid": "Communication scope is invalid.",

  "files.upload.size_exceeded": "File size exceeds allowed limit.",
  "files.upload.mime_not_allowed": "File type is not allowed.",
  "files.not_found": "File not found or not accessible.",

  "validation.failed": "Request validation failed.",
  "not_found": "Resource not found.",
};
```

---

## 12. Recommended Error Actions Map

Use this for deciding UI behavior, not just text.

```ts
export type ConversationErrorAction =
  | "SHOW_TOAST"
  | "SHOW_FORM_ERROR"
  | "DISABLE_COMPOSER"
  | "REFRESH_CONVERSATION"
  | "REFRESH_MEMBERS"
  | "NAVIGATE_TO_EXISTING_CONVERSATION"
  | "REMOVE_FROM_LIST"
  | "SHOW_NOT_FOUND"
  | "SHOW_ACCESS_DENIED";

export const CONVERSATION_ERROR_ACTIONS: Record<string, ConversationErrorAction> = {
  "communication.policy.disabled": "DISABLE_COMPOSER",

  "communication.conversation.archived": "DISABLE_COMPOSER",
  "communication.conversation.closed": "DISABLE_COMPOSER",
  "communication.conversation.not_member": "REMOVE_FROM_LIST",
  "communication.conversation.direct_duplicate": "NAVIGATE_TO_EXISTING_CONVERSATION",

  "communication.participant.already_exists": "REFRESH_MEMBERS",
  "communication.participant.not_found": "REFRESH_MEMBERS",
  "communication.participant.not_active": "REFRESH_MEMBERS",
  "communication.participant.cannot_remove_owner": "SHOW_TOAST",

  "communication.invite.invalid_status": "REFRESH_MEMBERS",
  "communication.invite.duplicate_pending": "SHOW_TOAST",
  "communication.join_request.invalid_status": "REFRESH_MEMBERS",
  "communication.join_request.duplicate_pending": "SHOW_TOAST",

  "communication.message.empty": "SHOW_FORM_ERROR",
  "communication.message.too_long": "SHOW_FORM_ERROR",
  "communication.message.kind_invalid": "SHOW_FORM_ERROR",
  "communication.message.send_forbidden": "DISABLE_COMPOSER",
  "communication.message.not_sender": "REFRESH_CONVERSATION",
  "communication.message.not_editable": "REFRESH_CONVERSATION",
  "communication.message.deleted": "REFRESH_CONVERSATION",
  "communication.message.hidden": "REFRESH_CONVERSATION",

  "communication.attachment.not_allowed": "SHOW_FORM_ERROR",
  "communication.attachment.invalid_file": "SHOW_FORM_ERROR",
  "files.upload.size_exceeded": "SHOW_FORM_ERROR",
  "files.upload.mime_not_allowed": "SHOW_FORM_ERROR",

  "not_found": "SHOW_NOT_FOUND",
  "validation.failed": "SHOW_FORM_ERROR",
};
```

---

## 13. Form-Level Recommendations

### Create conversation form

Validate before submit:

- `type` is one of allowed types.
- `title.length <= 255`.
- `description.length <= 4000`.
- `metadata` is a plain object.
- Scoped types include required IDs:
  - `classroom` → `classroomId`
  - `grade` → `gradeId`
  - `section` → `sectionId`
  - `stage` → `stageId`

### List conversations filters

Allowed filters:

```ts
type?: ConversationType;
status?: "active" | "archived" | "closed";
search?: string; // max 200
limit?: number;  // 1..100
page?: number;   // 1..10000
```

### Update conversation form

Validate before submit:

- `title.length <= 255`
- `description.length <= 4000`
- `avatarFileId` must be UUID or null
- `isReadOnly` must be boolean
- `isPinned` must be boolean
- `metadata` must be object or null

---

## 14. UI State Checklist

### Conversation List

- Show status badge: Active / Archived / Closed.
- Disable row quick actions based on status.
- Remove conversations on `communication.conversation.not_member`.
- Refresh list on `not_found` or stale 409 conflicts.

### Conversation Details

- Show top banner when archived, closed, read-only, muted, or blocked.
- Disable composer when sending is not allowed.
- Hide management actions if user lacks permission.
- Use optimistic UI only for safe actions like read receipts/reactions.

### Composer

- Disable send when message body is empty and no attachment exists.
- Show character counter.
- Block unsupported file types before upload.
- Show upload progress and per-file validation errors.

### Members Drawer

- Disable removing/demoting last owner.
- Hide `SYSTEM` role.
- Show pending invite status instead of allowing duplicate invite.
- Refresh member list after participant conflicts.

### Moderation

- Hide report/moderation actions for unauthorized users.
- Replace hidden/deleted messages with placeholders.
- Keep moderation failures non-destructive and refresh state.

---

## 15. Suggested Frontend Folder Structure

```txt
src/
  modules/
    conversations/
      api/
        conversations.api.ts
      constants/
        conversation-error-codes.ts
        conversation-status.ts
        conversation-types.ts
      utils/
        get-conversation-error-message.ts
        handle-conversation-error.ts
      components/
        ConversationStatusBadge.tsx
        ConversationErrorBanner.tsx
        ConversationComposer.tsx
        MembersDrawer.tsx
```

---

## 16. Implementation Example

```ts
export function handleConversationError(error: unknown) {
  const apiError = error as {
    response?: {
      data?: {
        error?: {
          code?: string;
          message?: string;
          details?: Record<string, unknown>;
        };
      };
    };
  };

  const code = apiError.response?.data?.error?.code;
  const fallback = apiError.response?.data?.error?.message;
  const details = apiError.response?.data?.error?.details;

  const message = getConversationErrorMessage(code, fallback);
  const action = code ? CONVERSATION_ERROR_ACTIONS[code] : undefined;

  return {
    code,
    message,
    details,
    action: action ?? "SHOW_TOAST",
  };
}
```

---

## 17. Priority Implementation Order

1. Core conversation errors:
   - `communication.policy.disabled`
   - `communication.conversation.archived`
   - `communication.conversation.closed`
   - `communication.conversation.not_member`
   - `communication.scope.invalid`
   - `not_found`
   - `validation.failed`

2. Message composer errors:
   - `communication.message.empty`
   - `communication.message.too_long`
   - `communication.message.kind_invalid`
   - `communication.message.send_forbidden`

3. Member management errors:
   - `communication.participant.already_exists`
   - `communication.participant.cannot_remove_owner`
   - `communication.participant.role_forbidden`
   - `communication.participant.not_active`

4. Optional feature errors:
   - attachments
   - reactions
   - reports
   - moderation
   - restrictions
