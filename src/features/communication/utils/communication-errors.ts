import { isApiError } from "@/lib/api-error";
import type { ConversationRedesignLabels } from "../conversations_redesign/labels";

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    return value.find(
      (item): item is string =>
        typeof item === "string" && Boolean(item.trim()),
    );
  }
  return undefined;
}

export function communicationErrorMessage(
  error: unknown,
  fallback = "Action failed. Please try again.",
): string {
  if (isApiError(error)) {
    const fieldMessage = firstString(Object.values(error.errors ?? {})[0]);
    return fieldMessage || error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

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
