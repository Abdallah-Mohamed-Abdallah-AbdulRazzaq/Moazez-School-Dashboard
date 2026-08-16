# Conversation Module Domain Errors - Frontend UI/UX Design Spec

**Date:** 2026-06-27  
**Status:** Approved  
**Topic:** Frontend UI/UX Integration of Communication Domain Errors  

---

## 1. Goal

Implement the frontend handling of domain-specific error codes returned from the backend communication module APIs. This includes localized error messages (English & Arabic), composer-replacing banners for restricted states, form-level validation, member drawer owner protections, character counters, and deleted/hidden message placeholders.

---

## 2. Localization & Error Helper

### 2.1 Mapped Keys in `labels.ts`
The translation files inside `src/features/communication/conversations_redesign/labels.ts` will strictly contain translation key-value maps (with no logic). We will add these new keys to both English and Arabic dictionaries:

- **Policy & Scope:**
  - `errorPolicyDisabled`: `"Messaging is disabled by school policy."` / `"الرسائل معطلة بموجب سياسة المدرسة."`
  - `errorPolicyNotConfigured`: `"Communication policy is not configured."` / `"سياسة الاتصالات غير مهيأة."`
  - `errorPolicyInvalid`: `"Communication policy is invalid."` / `"سياسة الاتصالات غير صالحة."`
  - `errorScopeInvalid`: `"Communication scope is invalid."` / `"نطاق الاتصالات غير صالح."`

- **Conversation States:**
  - `errorConversationNotMember`: `"You are not a member of this conversation."` / `"أنت لست عضواً في هذه المحادثة."`
  - `errorConversationArchived`: `"This conversation is archived."` / `"هذه المحادثة مؤرشفة."`
  - `errorConversationClosed`: `"This conversation is closed."` / `"هذه المحادثة مغلقة."`
  - `errorConversationInvalidType`: `"Conversation type is invalid."` / `"نوع المحادثة غير صالح."`
  - `errorConversationDirectDuplicate`: `"Direct conversation already exists."` / `"المحادثة المباشرة موجودة بالفعل."`
  - `errorConversationGroupLimitExceeded`: `"Conversation group member limit is exceeded."` / `"تجاوز الحد الأقصى لأعضاء المجموعة في المحادثة."`

- **Participant Management:**
  - `errorParticipantAlreadyExists`: `"Participant already exists in this conversation."` / `"المشارك موجود بالفعل في هذه المحادثة."`
  - `errorParticipantNotFound`: `"Participant was not found."` / `"لم يتم العثور على المشارك."`
  - `errorParticipantLimitExceeded`: `"Participant limit is exceeded."` / `"تم تجاوز الحد الأقصى للمشاركين."`
  - `errorParticipantRoleForbidden`: `"Participant role is not allowed."` / `"دور المشارك غير مسموح به."`
  - `errorParticipantCannotRemoveOwner`: `"Conversation owner cannot be removed."` / `"لا يمكن إزالة مالك المحادثة."`
  - `errorParticipantNotActive`: `"Participant is not active."` / `"المشارك غير نشط."`

- **Invites & Join Requests:**
  - `errorInviteInvalidStatus`: `"Invite status transition is invalid."` / `"تغيير حالة الدعوة غير صالح."`
  - `errorInviteDuplicatePending`: `"A pending invite already exists."` / `"توجد دعوة معلقة بالفعل."`
  - `errorJoinRequestInvalidStatus`: `"Join request status transition is invalid."` / `"تغيير حالة طلب الانضمام غير صالح."`
  - `errorJoinRequestDuplicatePending`: `"A pending join request already exists."` / `"يوجد طلب انضمام معلق بالفعل."`

- **Messages & Composer:**
  - `errorMessageEmpty`: `"Message cannot be empty."` / `"لا يمكن أن تكون الرسالة فارغة."`
  - `errorMessageTooLong`: `"Message exceeds maximum length."` / `"تجاوزت الرسالة الحد الأقصى للطول."`
  - `errorMessageHidden`: `"This message is hidden by moderation."` / `"هذه الرسالة مخفية بسبب الإشراف."`
  - `errorMessageDeleted`: `"This message was deleted."` / `"تم حذف هذه الرسالة."`
  - `errorMessageNotEditable`: `"Message cannot be edited."` / `"لا يمكن تعديل هذه الرسالة."`
  - `errorMessageNotSender`: `"Only the sender can perform this message action."` / `"يمكن لمرسل الرسالة فقط القيام بهذا الإجراء."`
  - `errorMessageSendForbidden`: `"Sending messages is not allowed."` / `"إرسال الرسائل غير مسموح به."`
  - `errorMessageKindInvalid`: `"Message kind is invalid."` / `"نوع الرسالة غير صالح."`

- **Attachments & Others:**
  - `errorAttachmentNotAllowed`: `"Attachments are not allowed."` / `"المرفقات غير مسموح بها."`
  - `errorAttachmentInvalidFile`: `"Attachment file is invalid."` / `"ملف المرفق غير صالح."`
  - `errorFileUploadSizeExceeded`: `"File size exceeds allowed limit."` / `"حجم الملف يتجاوز الحد المسموح به."`
  - `errorFileUploadMimeNotAllowed`: `"File type is not allowed."` / `"نوع الملف غير مسموح به."`
  - `errorFilesNotFound`: `"File not found or not accessible."` / `"الملف غير موجود أو لا يمكن الوصول إليه."`
  - `errorValidationFailed`: `"Request validation failed."` / `"فشل التحقق من صحة الطلب."`
  - `errorNotFound`: `"Resource not found."` / `"المصدر غير موجود."`
  - `errorGeneric`: `"Something went wrong. Please try again."` / `"حدث خطأ ما. حاول مرة أخرى."`

- **Moderation, Reactions & Restrictions:**
  - `errorReceiptInvalidRecipient`: `"Receipt recipient is invalid."` / `"مستلم إيصال القراءة غير صالح."`
  - `errorReactionDuplicate`: `"Reaction already exists."` / `"التفاعل موجود بالفعل."`
  - `errorReportDuplicate`: `"Message report already exists."` / `"تم الإبلاغ عن الرسالة بالفعل."`
  - `errorReportInvalidStatus`: `"Report status transition is invalid."` / `"تغيير حالة البلاغ غير صالح."`
  - `errorModerationForbidden`: `"Moderation action is not allowed."` / `"إجراء الإشراف غير مسموح به."`
  - `errorUserBlocked`: `"User is blocked."` / `"المستخدم محظور."`
  - `errorUserRestricted`: `"User is restricted."` / `"المستخدم مقيد."`
  - `errorUserRestrictionConflict`: `"User restriction conflicts with an active state."` / `"تقييد المستخدم يتعارض مع حالة نشطة."`

- **Banners:**
  - `bannerArchived`: `"This conversation is archived. You can view messages but cannot send new ones."` / `"هذه المحادثة مؤرشفة. يمكنك عرض الرسائل ولكن لا يمكنك إرسال رسائل جديدة."`
  - `bannerClosed`: `"This conversation is closed."` / `"هذه المحادثة مغلقة."`
  - `bannerReadOnly`: `"This conversation is read-only."` / `"هذه المحادثة للقراءة فقط."`
  - `bannerMuted`: `"You are muted in this conversation."` / `"تم كتم صوتك في هذه المحادثة."`
  - `bannerReadOnlyParticipant`: `"You have read-only access to this conversation."` / `"لديك صلاحية القراءة فقط في هذه المحادثة."`

### 2.2 Error and Actions Mapping (communication-errors.ts)
The error-handling codes mapping, recovery actions mapping, and parsing logic will live strictly inside [communication-errors.ts](file:///E:/sis-dashboard/src/features/communication/utils/communication-errors.ts).

```ts
export const CONVERSATION_ERROR_LABEL_KEYS: Record<string, keyof ConversationRedesignLabels> = {
  "communication.policy.disabled": "errorPolicyDisabled",
  "communication.policy.not_configured": "errorPolicyNotConfigured",
  "communication.policy.invalid": "errorPolicyInvalid",

  "communication.scope.invalid": "errorScopeInvalid",

  "communication.conversation.not_member": "errorConversationNotMember",
  "communication.conversation.archived": "errorConversationArchived",
  "communication.conversation.closed": "errorConversationClosed",
  "communication.conversation.invalid_type": "errorConversationInvalidType",
  "communication.conversation.direct_duplicate": "errorConversationDirectDuplicate",
  "communication.conversation.group_limit_exceeded": "errorConversationGroupLimitExceeded",

  "communication.participant.already_exists": "errorParticipantAlreadyExists",
  "communication.participant.not_found": "errorParticipantNotFound",
  "communication.participant.limit_exceeded": "errorParticipantLimitExceeded",
  "communication.participant.role_forbidden": "errorParticipantRoleForbidden",
  "communication.participant.cannot_remove_owner": "errorParticipantCannotRemoveOwner",
  "communication.participant.not_active": "errorParticipantNotActive",

  "communication.invite.invalid_status": "errorInviteInvalidStatus",
  "communication.invite.duplicate_pending": "errorInviteDuplicatePending",
  "communication.join_request.invalid_status": "errorJoinRequestInvalidStatus",
  "communication.join_request.duplicate_pending": "errorJoinRequestDuplicatePending",

  "communication.message.empty": "errorMessageEmpty",
  "communication.message.too_long": "errorMessageTooLong",
  "communication.message.hidden": "errorMessageHidden",
  "communication.message.deleted": "errorMessageDeleted",
  "communication.message.not_editable": "errorMessageNotEditable",
  "communication.message.not_sender": "errorMessageNotSender",
  "communication.message.send_forbidden": "errorMessageSendForbidden",
  "communication.message.kind_invalid": "errorMessageKindInvalid",

  "communication.attachment.not_allowed": "errorAttachmentNotAllowed",
  "communication.attachment.invalid_file": "errorAttachmentInvalidFile",

  "files.upload.size_exceeded": "errorFileUploadSizeExceeded",
  "files.upload.mime_not_allowed": "errorFileUploadMimeNotAllowed",
  "files.not_found": "errorFilesNotFound",

  "communication.receipt.invalid_recipient": "errorReceiptInvalidRecipient",
  "communication.reaction.duplicate": "errorReactionDuplicate",
  "communication.report.duplicate": "errorReportDuplicate",
  "communication.report.invalid_status": "errorReportInvalidStatus",
  "communication.moderation.forbidden": "errorModerationForbidden",
  "communication.user.blocked": "errorUserBlocked",
  "communication.user.restricted": "errorUserRestricted",
  "communication.user.restriction_conflict": "errorUserRestrictionConflict",

  "validation.failed": "errorValidationFailed",
  "not_found": "errorNotFound",
};

export type ConversationErrorAction =
  | "SHOW_TOAST"
  | "SHOW_FORM_ERROR"
  | "DISABLE_COMPOSER"
  | "REFRESH_CONVERSATION"
  | "REFRESH_MEMBERS"
  | "REMOVE_FROM_LIST"
  | "SHOW_NOT_FOUND"
  | "SHOW_ACCESS_DENIED";

export const CONVERSATION_ERROR_ACTIONS: Record<string, ConversationErrorAction> = {
  "communication.policy.disabled": "DISABLE_COMPOSER",
  "communication.policy.not_configured": "DISABLE_COMPOSER",
  "communication.policy.invalid": "DISABLE_COMPOSER",

  "communication.conversation.archived": "DISABLE_COMPOSER",
  "communication.conversation.closed": "DISABLE_COMPOSER",
  "communication.conversation.not_member": "REMOVE_FROM_LIST",
  "communication.conversation.invalid_type": "SHOW_FORM_ERROR",
  "communication.conversation.direct_duplicate": "REFRESH_CONVERSATION",
  "communication.conversation.group_limit_exceeded": "SHOW_FORM_ERROR",

  "communication.scope.invalid": "SHOW_FORM_ERROR",

  "communication.participant.already_exists": "REFRESH_MEMBERS",
  "communication.participant.not_found": "REFRESH_MEMBERS",
  "communication.participant.limit_exceeded": "SHOW_TOAST",
  "communication.participant.role_forbidden": "SHOW_TOAST",
  "communication.participant.cannot_remove_owner": "SHOW_TOAST",
  "communication.participant.not_active": "REFRESH_MEMBERS",

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
  "communication.receipt.invalid_recipient": "REFRESH_CONVERSATION",

  "communication.attachment.not_allowed": "SHOW_FORM_ERROR",
  "communication.attachment.invalid_file": "SHOW_FORM_ERROR",

  "files.upload.size_exceeded": "SHOW_FORM_ERROR",
  "files.upload.mime_not_allowed": "SHOW_FORM_ERROR",
  "files.not_found": "SHOW_TOAST",

  "communication.reaction.duplicate": "REFRESH_CONVERSATION",
  "communication.report.duplicate": "SHOW_TOAST",
  "communication.report.invalid_status": "REFRESH_CONVERSATION",
  "communication.moderation.forbidden": "SHOW_ACCESS_DENIED",
  "communication.user.blocked": "DISABLE_COMPOSER",
  "communication.user.restricted": "DISABLE_COMPOSER",
  "communication.user.restriction_conflict": "REFRESH_CONVERSATION",

  "validation.failed": "SHOW_FORM_ERROR",
  "not_found": "SHOW_NOT_FOUND",
};
```

We will expose `handleConversationError(error, labels)` in `communication-errors.ts` implementing the fallback logic:
```ts
const code = apiError.response?.data?.error?.code;
const backendMessage = apiError.response?.data?.error?.message;
const details = apiError.response?.data?.error?.details;

// Fallback behavior:
const labelKey = code ? CONVERSATION_ERROR_LABEL_KEYS[code] : undefined;
const message = labelKey ? labels[labelKey] : backendMessage ?? labels.errorGeneric;
const action = code ? CONVERSATION_ERROR_ACTIONS[code] ?? "SHOW_TOAST" : "SHOW_TOAST";

if (code === "communication.scope.invalid" && details?.field) {
  return {
    code,
    message,
    details,
    action: "SHOW_FORM_ERROR",
    field: String(details.field),
  };
}
```

---

## 3. UX Components Integration

### 3.1 Bottom Composer Banners & Priority
In `ConversationDetail.tsx`:
- When a conversation has restrictions, the `<MessageComposer />` is replaced at the bottom with a banner displaying the specific localized message.
- To resolve layout conflicts when multiple restrictions exist, the following priority order determines which banner wins:
  1. **Archived** (uses `labels.bannerArchived`)
  2. **Closed** (uses `labels.bannerClosed`)
  3. **Policy disabled** (uses `labels.errorPolicyDisabled`)
  4. **Blocked** / **Restricted** (uses `labels.errorUserBlocked` or `labels.errorUserRestricted`)
  5. **Read-only conversation** (uses `labels.bannerReadOnly`)
  6. **Muted** (uses `labels.bannerMuted`)
  7. **Read-only participant** (uses `labels.bannerReadOnlyParticipant`)

### 3.2 Form-level Validation
- **Create Conversation Dialog:**
  - Enforce character limits before submit: title <= 255, description <= 4000.
  - For scoped types (classroom, grade, section, stage), ensure the matching scope ID field is selected.
  - Parse HTTP 400 `validation.failed` DTO errors to show specific field-level validation errors inline next to the inputs.
- **Edit Conversation Dialog:**
  - Enforce limits: title <= 255, description <= 4000.

### 3.3 Member Drawer Owner Protection & Invite Status
In `ParticipantsPanel.tsx`:
- Render localized badges for `Owner`, `Admin`, `Moderator`, `Member`, and `Read-only`.
- Filter out and hide any participants assigned the `SYSTEM` role.
- Owner Lock: Prevent demoting or removing the last `OWNER` from the conversation by disabling the dropdown menu action.
- Invite Status: Display "Pending Invite" when a user already has a pending invite, rather than allowing duplicate invites.

### 3.4 Composer Counter & Validation
- **MessageComposer.tsx:**
  - Display a character counter using the active communication policy max message length.
  - Fallback to 4000 only if the API/config does not provide a value.
  - Disable submit if length > `maxMessageLength` or if empty.
  - Check file size and mime types before upload.
- **MessageBubble.tsx:**
  - Render placeholders for deleted or hidden messages using localized keys:
    - Deleted: `labels.errorMessageDeleted`
    - Hidden: `labels.errorMessageHidden`
