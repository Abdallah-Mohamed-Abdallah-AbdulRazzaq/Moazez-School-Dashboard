# Conversation Domain Errors Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive frontend handling, translations, banners, form-level validation, drawer protections, composer character counters, and message placeholders for conversation module domain errors.

**Architecture:** Mappings of backend codes and UI actions are isolated in `communication-errors.ts`. Localized error texts reside in `labels.ts`. Bottom banners replace the message composer in `ConversationDetail.tsx` using a strict priority order. Inline validation and drawer restrictions prevent invalid user requests.

**Tech Stack:** React, TypeScript, Vitest, Testing Library

## Global Constraints
- Target workspace path is E:/sis-dashboard.
- Use English and Arabic localizations from `labels.ts`.
- Ensure type safety and that all existing tests continue to pass.
- Write tests first for new component behaviors.
- Do not use placeholders (TBD, TODO, implement later) in implementation.

---

### Task 1: Add Localized Labels to `labels.ts`

**Files:**
- Modify: `src/features/communication/conversations_redesign/labels.ts`
- Modify: `src/features/communication/__tests__/labels.test.ts`

**Interfaces:**
- Produces: Mapped dictionary keys in `ConversationRedesignLabels` interface (e.g., `errorPolicyDisabled`, `bannerArchived`, etc.) to be consumed by components.

- [ ] **Step 1: Write the failing test**
  Add assertions in `src/features/communication/__tests__/labels.test.ts` verifying that the new error translation keys are present in both English and Arabic.
  ```ts
  import { conversationRedesignLabels } from "../conversations_redesign/labels";

  describe("New translation labels", () => {
    it("has all new error and banner keys in both English and Arabic with non-empty strings", () => {
      const keys: (keyof typeof conversationRedesignLabels.en)[] = [
        "errorPolicyDisabled",
        "errorPolicyNotConfigured",
        "errorPolicyInvalid",
        "errorScopeInvalid",
        "errorConversationNotMember",
        "errorConversationArchived",
        "errorConversationClosed",
        "errorConversationInvalidType",
        "errorConversationDirectDuplicate",
        "errorConversationGroupLimitExceeded",
        "errorParticipantAlreadyExists",
        "errorParticipantNotFound",
        "errorParticipantLimitExceeded",
        "errorParticipantRoleForbidden",
        "errorParticipantCannotRemoveOwner",
        "errorParticipantNotActive",
        "errorInviteInvalidStatus",
        "errorInviteDuplicatePending",
        "errorJoinRequestInvalidStatus",
        "errorJoinRequestDuplicatePending",
        "errorMessageEmpty",
        "errorMessageTooLong",
        "errorMessageHidden",
        "errorMessageDeleted",
        "errorMessageNotEditable",
        "errorMessageNotSender",
        "errorMessageSendForbidden",
        "errorMessageKindInvalid",
        "errorAttachmentNotAllowed",
        "errorAttachmentInvalidFile",
        "errorFileUploadSizeExceeded",
        "errorFileUploadMimeNotAllowed",
        "errorFilesNotFound",
        "errorValidationFailed",
        "errorNotFound",
        "errorGeneric",
        "errorReceiptInvalidRecipient",
        "errorReactionDuplicate",
        "errorReportDuplicate",
        "errorReportInvalidStatus",
        "errorModerationForbidden",
        "errorUserBlocked",
        "errorUserRestricted",
        "errorUserRestrictionConflict",
        "bannerArchived",
        "bannerClosed",
        "bannerReadOnly",
        "bannerMuted",
        "bannerReadOnlyParticipant"
      ];
      for (const key of keys) {
        expect(typeof conversationRedesignLabels.en[key]).toBe("string");
        expect(conversationRedesignLabels.en[key].trim().length).toBeGreaterThan(0);
        expect(typeof conversationRedesignLabels.ar[key]).toBe("string");
        expect(conversationRedesignLabels.ar[key].trim().length).toBeGreaterThan(0);
      }
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/labels.test.ts`
  Expected: FAIL with undefined key assertions.

- [ ] **Step 3: Write minimal implementation**
  Add the translation entries to both the `en` and `ar` dictionaries in `src/features/communication/conversations_redesign/labels.ts`. Also update the `ConversationRedesignLabels` type/interface if it is manually declared, so all new keys are type-safe.
  ```ts
  // Add inside en block of conversationRedesignLabels:
  errorPolicyDisabled: "Messaging is disabled by school policy.",
  errorPolicyNotConfigured: "Communication policy is not configured.",
  errorPolicyInvalid: "Communication policy is invalid.",
  errorScopeInvalid: "Communication scope is invalid.",
  errorConversationNotMember: "You are not a member of this conversation.",
  errorConversationArchived: "This conversation is archived.",
  errorConversationClosed: "This conversation is closed.",
  errorConversationInvalidType: "Conversation type is invalid.",
  errorConversationDirectDuplicate: "Direct conversation already exists.",
  errorConversationGroupLimitExceeded: "Conversation group member limit is exceeded.",
  errorParticipantAlreadyExists: "Participant already exists in this conversation.",
  errorParticipantNotFound: "Participant was not found.",
  errorParticipantLimitExceeded: "Participant limit is exceeded.",
  errorParticipantRoleForbidden: "Participant role is not allowed.",
  errorParticipantCannotRemoveOwner: "Conversation owner cannot be removed.",
  errorParticipantNotActive: "Participant is not active.",
  errorInviteInvalidStatus: "Invite status transition is invalid.",
  errorInviteDuplicatePending: "A pending invite already exists.",
  errorJoinRequestInvalidStatus: "Join request status transition is invalid.",
  errorJoinRequestDuplicatePending: "A pending join request already exists.",
  errorMessageEmpty: "Message cannot be empty.",
  errorMessageTooLong: "Message exceeds maximum length.",
  errorMessageHidden: "This message is hidden by moderation.",
  errorMessageDeleted: "This message was deleted.",
  errorMessageNotEditable: "Message cannot be edited.",
  errorMessageNotSender: "Only the sender can perform this message action.",
  errorMessageSendForbidden: "Sending messages is not allowed.",
  errorMessageKindInvalid: "Message kind is invalid.",
  errorAttachmentNotAllowed: "Attachments are not allowed.",
  errorAttachmentInvalidFile: "Attachment file is invalid.",
  errorFileUploadSizeExceeded: "File size exceeds allowed limit.",
  errorFileUploadMimeNotAllowed: "File type is not allowed.",
  errorFilesNotFound: "File not found or not accessible.",
  errorValidationFailed: "Request validation failed.",
  errorNotFound: "Resource not found.",
  errorGeneric: "Something went wrong. Please try again.",
  errorReceiptInvalidRecipient: "Receipt recipient is invalid.",
  errorReactionDuplicate: "Reaction already exists.",
  errorReportDuplicate: "Message report already exists.",
  errorReportInvalidStatus: "Report status transition is invalid.",
  errorModerationForbidden: "Moderation action is not allowed.",
  errorUserBlocked: "User is blocked.",
  errorUserRestricted: "User is restricted.",
  errorUserRestrictionConflict: "User restriction conflicts with an active state.",
  bannerArchived: "This conversation is archived. You can view messages but cannot send new ones.",
  bannerClosed: "This conversation is closed.",
  bannerReadOnly: "This conversation is read-only.",
  bannerMuted: "You are muted in this conversation.",
  bannerReadOnlyParticipant: "You have read-only access to this conversation.",

  // Add inside ar block of conversationRedesignLabels:
  errorPolicyDisabled: "الرسائل معطلة بموجب سياسة المدرسة.",
  errorPolicyNotConfigured: "سياسة الاتصالات غير مهيأة.",
  errorPolicyInvalid: "سياسة الاتصالات غير صالحة.",
  errorScopeInvalid: "نطاق الاتصالات غير صالح.",
  errorConversationNotMember: "أنت لست عضواً في هذه المحادثة.",
  errorConversationArchived: "هذه المحادثة مؤرشفة.",
  errorConversationClosed: "هذه المحادثة مغلقة.",
  errorConversationInvalidType: "نوع المحادثة غير صالح.",
  errorConversationDirectDuplicate: "المحادثة المباشرة موجودة بالفعل.",
  errorConversationGroupLimitExceeded: "تجاوز الحد الأقصى لأعضاء المجموعة في المحادثة.",
  errorParticipantAlreadyExists: "المشارك موجود بالفعل في هذه المحادثة.",
  errorParticipantNotFound: "لم يتم العثور على المشارك.",
  errorParticipantLimitExceeded: "تم تجاوز الحد الأقصى للمشاركين.",
  errorParticipantRoleForbidden: "دور المشارك غير مسموح به.",
  errorParticipantCannotRemoveOwner: "لا يمكن إزالة مالك المحادثة.",
  errorParticipantNotActive: "المشارك غير نشط.",
  errorInviteInvalidStatus: "تغيير حالة الدعوة غير صالح.",
  errorInviteDuplicatePending: "توجد دعوة معلقة بالفعل.",
  errorJoinRequestInvalidStatus: "تغيير حالة طلب الانضمام غير صالح.",
  errorJoinRequestDuplicatePending: "يوجد طلب انضمام معلق بالفعل.",
  errorMessageEmpty: "لا يمكن أن تكون الرسالة فارغة.",
  errorMessageTooLong: "تجاوزت الرسالة الحد الأقصى للطول.",
  errorMessageHidden: "هذه الرسالة مخفية بسبب الإشراف.",
  errorMessageDeleted: "تم حذف هذه الرسالة.",
  errorMessageNotEditable: "لا يمكن تعديل هذه الرسالة.",
  errorMessageNotSender: "يمكن لمرسل الرسالة فقط القيام بهذا الإجراء.",
  errorMessageSendForbidden: "إرسال الرسائل غير مسموح به.",
  errorMessageKindInvalid: "نوع الرسالة غير صالح.",
  errorAttachmentNotAllowed: "المرفقات غير مسموح بها.",
  errorAttachmentInvalidFile: "ملف المرفق غير صالح.",
  errorFileUploadSizeExceeded: "حجم الملف يتجاوز الحد المسموح به.",
  errorFileUploadMimeNotAllowed: "نوع الملف غير مسموح به.",
  errorFilesNotFound: "الملف غير موجود أو لا يمكن الوصول إليه.",
  errorValidationFailed: "فشل التحقق من صحة الطلب.",
  errorNotFound: "المصدر غير موجود.",
  errorGeneric: "حدث خطأ ما. حاول مرة أخرى.",
  errorReceiptInvalidRecipient: "مستلم إيصال القراءة غير صالح.",
  errorReactionDuplicate: "التفاعل موجود بالفعل.",
  errorReportDuplicate: "تم الإبلاغ عن الرسالة بالفعل.",
  errorReportInvalidStatus: "تغيير حالة البلاغ غير صالح.",
  errorModerationForbidden: "إجراء الإشراف غير مسموح به.",
  errorUserBlocked: "المستخدم محظور.",
  errorUserRestricted: "المستخدم مقيد.",
  errorUserRestrictionConflict: "تقييد المستخدم يتعارض مع حالة نشطة.",
  bannerArchived: "هذه المحادثة مؤرشفة. يمكنك عرض الرسائل ولكن لا يمكنك إرسال رسائل جديدة.",
  bannerClosed: "هذه المحادثة مغلقة.",
  bannerReadOnly: "هذه المحادثة للقراءة فقط.",
  bannerMuted: "تم كتم صوتك في هذه المحادثة.",
  bannerReadOnlyParticipant: "لديك صلاحية القراءة فقط في هذه المحادثة.",
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/labels.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/conversations_redesign/labels.ts
  git commit -m "feat(communication): add localized domain error and banner translations in English and Arabic"
  ```

---

### Task 2: Implement Mapped Error Helper in `communication-errors.ts`

**Files:**
- Modify: `src/features/communication/utils/communication-errors.ts`
- Create: `src/features/communication/__tests__/utils/communication-errors.test.ts`

**Interfaces:**
- Consumes: `conversationRedesignLabels` keys from Task 1.
- Produces: `handleConversationError(error: unknown, labels: ConversationRedesignLabels)` mapping helper function.

- [ ] **Step 1: Write the failing test**
  Create `src/features/communication/__tests__/utils/communication-errors.test.ts` and add tests asserting correct error code lookup, localized mappings, error-code-based action mapping, fieldErrors parsing, and fallback logic:
  ```ts
  import { describe, it, expect } from "vitest";
  import { handleConversationError } from "../../utils/communication-errors";
  import { conversationRedesignLabels } from "../../conversations_redesign/labels";

  const labels = conversationRedesignLabels.en;

  describe("handleConversationError", () => {
    it("correctly resolves a mapped error code to message and action", () => {
      const mockError = {
        response: {
          data: {
            error: {
              code: "communication.policy.disabled"
            }
          }
        }
      };
      const result = handleConversationError(mockError, labels);
      expect(result.code).toBe("communication.policy.disabled");
      expect(result.message).toBe(labels.errorPolicyDisabled);
      expect(result.action).toBe("DISABLE_COMPOSER");
    });

    it("correctly parses validation.failed DTO errors with HTTP 400 status and sets fieldErrors", () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: {
              code: "validation.failed",
              details: {
                fields: {
                  title: ["must not be empty"],
                  description: "exceeds limit"
                }
              }
            }
          }
        }
      };
      const result = handleConversationError(mockError, labels);
      expect(result.code).toBe("validation.failed");
      expect(result.action).toBe("SHOW_FORM_ERROR");
      expect(result.fieldErrors).toEqual({
        title: "must not be empty",
        description: "exceeds limit"
      });
    });

    it("returns details.field and fieldErrors when communication.scope.invalid is returned with field details", () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              code: "communication.scope.invalid",
              details: {
                field: "classroomId",
                fields: {
                  classroomId: ["invalid selection"]
                }
              }
            }
          }
        }
      };
      const result = handleConversationError(mockError, labels);
      expect(result.code).toBe("communication.scope.invalid");
      expect(result.field).toBe("classroomId");
      expect(result.action).toBe("SHOW_FORM_ERROR");
      expect(result.fieldErrors).toEqual({
        classroomId: "invalid selection"
      });
    });

    it("falls back to generic error message and SHOW_TOAST for unmapped error codes", () => {
      const mockError = {
        response: {
          data: {
            error: {
              code: "some.unmapped.error"
            }
          }
        }
      };
      const result = handleConversationError(mockError, labels);
      expect(result.message).toBe(labels.errorGeneric);
      expect(result.action).toBe("SHOW_TOAST");
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/utils/communication-errors.test.ts`
  Expected: FAIL with "handleConversationError is not a function"

- [ ] **Step 3: Write minimal implementation**
  In `src/features/communication/utils/communication-errors.ts`, append the mapped dictionaries `CONVERSATION_ERROR_LABEL_KEYS`, `CONVERSATION_ERROR_ACTIONS`, the `normalizeStatus` and `normalizeRole` helpers, and implement `handleConversationError`:
  ```ts
  import type { ConversationRedesignLabels } from "../conversations_redesign/labels";

  export function normalizeStatus(value?: string | null): string {
    return value?.toLowerCase() || "";
  }

  export function normalizeRole(value?: string | null): string {
    return value?.toUpperCase() || "";
  }

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

  export function handleConversationError(
    error: unknown,
    labels: ConversationRedesignLabels,
  ): {
    code: string | undefined;
    message: string;
    details: Record<string, unknown> | undefined;
    action: ConversationErrorAction;
    field?: string;
    fieldErrors?: Record<string, string>;
  } {
    const apiError = error as {
      response?: {
        status?: number;
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
    const backendMessage = apiError.response?.data?.error?.message;
    const details = apiError.response?.data?.error?.details;

    const labelKey = code ? CONVERSATION_ERROR_LABEL_KEYS[code] : undefined;
    const message = labelKey ? labels[labelKey] : backendMessage ?? labels.errorGeneric;
    const action = code ? CONVERSATION_ERROR_ACTIONS[code] ?? "SHOW_TOAST" : "SHOW_TOAST";

    const canParseFieldErrors =
      (code === "validation.failed" || code === "communication.scope.invalid") &&
      details?.fields &&
      typeof details.fields === "object";

    const fieldErrors = canParseFieldErrors
      ? Object.fromEntries(
          Object.entries(details.fields as Record<string, string[] | string>).map(
            ([field, value]) => [
              field,
              Array.isArray(value) ? value.join(", ") : String(value),
            ],
          ),
        )
      : undefined;

    if (code === "communication.scope.invalid" && details?.field) {
      return {
        code,
        message,
        details,
        action: "SHOW_FORM_ERROR",
        field: String(details.field),
        fieldErrors,
      };
    }

    return {
      code,
      message,
      details,
      action,
      fieldErrors,
    };
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/utils/communication-errors.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/utils/communication-errors.ts src/features/communication/__tests__/utils/communication-errors.test.ts
  git commit -m "feat(communication): implement handleConversationError helper and error action mappings in communication-errors.ts"
  ```

---

### Task 3: Implement Bottom Banners in `ConversationDetail.tsx`

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`
- Modify: `src/features/communication/__tests__/components/ConversationDetail.test.tsx`

**Interfaces:**
- Consumes: `normalizeStatus`, `normalizeRole` from Task 2.

- [ ] **Step 1: Write the failing test**
  Add unit tests in `src/features/communication/__tests__/components/ConversationDetail.test.tsx` that mock different statuses (archived, closed, read-only conversation, muted, read-only participant) and check that:
  - `<MessageComposer />` is NOT rendered.
  - The correct restriction banner is rendered at the bottom instead.
  - The priority order is respected (e.g. if archived, the archived banner is shown even if the user is also muted).

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/components/ConversationDetail.test.tsx`
  Expected: FAIL with banners assertions not found.

- [ ] **Step 3: Write minimal implementation**
  In `src/features/communication/conversations_redesign/components/ConversationDetail.tsx`:
  - Fetch user context and active participant details:
    ```tsx
    const currentParticipant = participantsState.items.find(
      (p) => p.user?.id === user?.id
    );
    // Before implementing blocked/restricted banners, verify whether `isBlocked` and `isRestricted` exist on the participant or conversation model (or if they are retrieved from user/policy context), and align the code accordingly.
    const isBlocked = currentParticipant?.isBlocked === true;
    const isRestricted = currentParticipant?.isRestricted === true;
    ```
  - Define the banner message lookup following the priority list (Archived -> Closed -> Policy disabled -> Blocked/restricted -> Read-only -> Muted -> Read-only participant):
    ```tsx
    const restrictionBanner = (() => {
      const normStatus = normalizeStatus(conversationState.item?.status);
      if (normStatus === "archived") {
        return labels.bannerArchived;
      }
      if (normStatus === "closed") {
        return labels.bannerClosed;
      }
      if (policy?.isEnabled === false) {
        return labels.errorPolicyDisabled;
      }
      if (isBlocked) {
        return labels.errorUserBlocked;
      }
      if (isRestricted) {
        return labels.errorUserRestricted;
      }
      if (conversationState.item?.isReadOnly) {
        return labels.bannerReadOnly;
      }
      if (normalizeStatus(currentParticipant?.status) === "muted") {
        return labels.bannerMuted;
      }
      if (normalizeRole(currentParticipant?.role) === "READ_ONLY") {
        return labels.bannerReadOnlyParticipant;
      }
      return null;
    })();
    ```
  - Update the render logic at the bottom of the conversation:
    ```tsx
    {activeTab === "messages" ? (
      restrictionBanner ? (
        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <div className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 px-4 text-center">
            {restrictionBanner}
          </div>
        </div>
      ) : (
        <MessageComposer ... />
      )
    ) : null}
    ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/components/ConversationDetail.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/conversations_redesign/components/ConversationDetail.tsx src/features/communication/__tests__/components/ConversationDetail.test.tsx
  git commit -m "feat(communication): replace message composer with restriction banner at the bottom using priority list"
  ```

---

### Task 4: Enforce Form-Level Validation in sidebar.tsx & EditConversationDialog.tsx

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/sidebar.tsx`
- Modify: `src/features/communication/conversations_redesign/components/EditConversationDialog.tsx`
- Modify: `src/features/communication/__tests__/components/CreateConversationDialog.test.ts`

**Interfaces:**
- Consumes: Form field states for title, description, and scope selections.

- [ ] **Step 1: Write the failing test**
  Update `CreateConversationDialog.test.ts` to assert that:
  - Entering a title > 255 chars or description > 4000 chars shows a validation error.
  - Submitting scoped types without the appropriate ID returns an inline validation error.
  - Backend errors (HTTP 400 / HTTP 422) map validation.failed and print inline errors instead of toasts.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/components/CreateConversationDialog.test.ts`
  Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  In `sidebar.tsx` (specifically the creation dialog) and `EditConversationDialog.tsx`:
  - Validate title and description lengths.
  - Enforce scope constraints:
    ```tsx
    if (type === "classroom" && !classroomId) error = labels.errorScopeInvalid;
    // ...
    ```
  - Parse backend API validation errors:
    ```tsx
    const errObj = handleConversationError(err, labels);
    if (errObj.action === "SHOW_FORM_ERROR") {
      setFormError(errObj.message);
      if (errObj.field) {
        setFieldErrors((prev) => ({ ...prev, [errObj.field!]: errObj.message }));
      }
      if (errObj.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...errObj.fieldErrors }));
      }
    }
    ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/components/CreateConversationDialog.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/conversations_redesign/components/sidebar.tsx src/features/communication/conversations_redesign/components/EditConversationDialog.tsx src/features/communication/__tests__/components/CreateConversationDialog.test.ts
  git commit -m "feat(communication): enforce frontend form constraints and inline errors for scoped and validation failures"
  ```

---

### Task 5: Enforce Participant Protections and Rules in Drawer

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx`
- Modify: `src/features/communication/__tests__/components/ParticipantsPanel.test.tsx`

**Interfaces:**
- Consumes: Member role states and actions.

- [ ] **Step 1: Write the failing test**
  In `ParticipantsPanel.test.tsx`, add tests to assert:
  - Participants drawer displays localized badges for Owner, Admin, Moderator, Member, and Read-only.
  - The drop-down option to demote or remove the last OWNER is disabled.
  - Participants with the `SYSTEM` role are hidden from the list.
  - Users with active pending invites display a "Pending" label instead of allowing double invitations.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/components/ParticipantsPanel.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  In `ParticipantsPanel.tsx`:
  - Hide SYSTEM role members:
    ```tsx
    const visibleParticipants = participants.filter(
      (p) => normalizeRole(p.role) !== "SYSTEM",
    );
    ```
  - Check active owner counts:
    ```tsx
    const activeOwnerCount = participants.filter(
      (p) =>
        normalizeRole(p.role) === "OWNER" &&
        ["active", "muted"].includes(normalizeStatus(p.status)),
    ).length;
    const isLastOwner =
      normalizeRole(participant.role) === "OWNER" &&
      ["active", "muted"].includes(normalizeStatus(participant.status)) &&
      activeOwnerCount === 1;
    // Disable demote/remove actions if isLastOwner is true
    ```
  - Map invite statuses to block duplicate pending invites.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/components/ParticipantsPanel.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/conversations_redesign/components/ParticipantsPanel.tsx src/features/communication/__tests__/components/ParticipantsPanel.test.tsx
  git commit -m "feat(communication): implement member drawer owner locks, system participant hiding, and status badges"
  ```

---

### Task 6: Implement Composer Counter, File Validation & MessageBubble Placeholders

**Files:**
- Modify: `src/features/communication/conversations_redesign/components/messages/MessageComposer.tsx`
- Modify: `src/features/communication/conversations_redesign/components/messages/MessageBubble.tsx`
- Modify: `src/features/communication/__tests__/components/MessageComposer.test.tsx`
- Modify: `src/features/communication/__tests__/components/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `labels` translation keys and policy constraints.

- [ ] **Step 1: Write the failing test**
  - Add test in `MessageComposer.test.tsx` asserting character counter existence under `maxLength` policy configuration.
  - Add test verifying that:
    - Oversized file disables upload/send or shows `labels.errorFileUploadSizeExceeded` inline error.
    - Unsupported MIME type shows `labels.errorFileUploadMimeNotAllowed` inline error.
  - Add test in `MessageBubble.test.tsx` verifying that when a message status is deleted or hidden (normalized), the body is replaced by `labels.errorMessageDeleted` or `labels.errorMessageHidden` respectively.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/features/communication/__tests__/components/MessageComposer.test.tsx src/features/communication/__tests__/components/MessageBubble.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
  - In `MessageComposer.tsx`:
    - Retrieve `maxMessageLength` dynamically from policy configuration, fallback to 4000.
    - Render a character counter: `body.length / maxMessageLength` when `body` is not empty.
    - Disable Send button when `body.length > maxMessageLength` or when both text body and attachments are empty.
    - Check file size and mime types before upload and display error messages.
  - In `MessageBubble.tsx`:
    - Render localized placeholder body if message status (normalized) is `"deleted"` or `"hidden"`:
      ```tsx
      const normStatus = normalizeStatus(message.status);
      const messageBody = normStatus === "deleted" 
        ? labels.errorMessageDeleted 
        : normStatus === "hidden"
        ? labels.errorMessageHidden
        : message.body;
      ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/features/communication/__tests__/components/MessageComposer.test.tsx src/features/communication/__tests__/components/MessageBubble.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/features/communication/conversations_redesign/components/messages/MessageComposer.tsx src/features/communication/conversations_redesign/components/messages/MessageBubble.tsx src/features/communication/__tests__/components/MessageComposer.test.tsx src/features/communication/__tests__/components/MessageBubble.test.tsx
  git commit -m "feat(communication): add dynamic character counter to composer and placeholders for deleted/moderated messages"
  ```

---

### Task 7: Full Verification

**Files:** None

- [ ] **Step 1: Run full unit & property test suites**
  Run: `npx vitest run src/features/communication`
  Expected: All tests pass.

- [ ] **Step 2: Verify TypeScript compiler diagnostics**
  Run: `npx tsc --noEmit`
  Expected: 0 errors/diagnostic messages.

- [ ] **Step 3: Verify Lint rules compliance**
  Run: `npm run lint`
  Expected: 0 errors/lint violations.

- [ ] **Step 4: Post-Verification Cleanup**
  No commit is required if there are no file changes. If verification required small fixes, commit those fixes normally.
