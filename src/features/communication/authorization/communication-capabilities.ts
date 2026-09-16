import type { PermissionKey } from "@/hooks/usePermissions";
import type {
  Conversation,
  ConversationParticipant,
  ParticipantRole,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";
import { normalizeStatus } from "@/features/communication/utils/communication-errors";

const MESSAGE_MANAGEMENT_ROLES = new Set<ParticipantRole>([
  "owner",
  "admin",
  "moderator",
]);

export type MessageDeleteMode = "self" | "moderation" | null;

export interface CommunicationConversationCapabilities {
  currentParticipant?: ConversationParticipant;
  isActiveParticipant: boolean;
  hasParticipantAccess: boolean;
  canManageConversation: boolean;
  canManageParticipants: boolean;
  canManageInvites: boolean;
  canReviewJoinRequests: boolean;
  canCreateJoinRequest: boolean;
  canLeaveConversation: boolean;
  canJoinRealtimeRoom: boolean;
  canSendMessage: boolean;
}

export interface CommunicationModuleCapabilities {
  canViewReports: boolean;
  canModerateMessages: boolean;
  canManageConversations: boolean;
  canManageParticipants: boolean;
}

export interface CommunicationMessageCapabilities {
  canEditMessage: boolean;
  canAddAttachment: boolean;
  canRemoveAttachment: boolean;
  canReportMessage: boolean;
  canViewMessageInfo: boolean;
  canHideMessage: boolean;
  canUnhideMessage: boolean;
  canViewModerationHistory: boolean;
  deleteMode: MessageDeleteMode;
}

interface ConversationCapabilityInput {
  permissions: readonly PermissionKey[];
  currentUserId?: string | null;
  participants: readonly ConversationParticipant[];
  conversation?: Conversation | null;
  communicationEnabled?: boolean;
}

interface MessageCapabilityInput {
  permissions: readonly PermissionKey[];
  currentUserId?: string | null;
  participant?: ConversationParticipant;
  conversation?: Conversation | null;
  message: Message;
  allowAttachments: boolean;
}

function participantUserId(participant: ConversationParticipant): string {
  return (
    participant.userId ||
    participant.actor?.userId ||
    participant.actor?.id ||
    ""
  );
}

function hasPermission(
  permissions: ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean {
  return permissions.has(permission);
}

function isConversationOpen(conversation?: Conversation | null): boolean {
  return !conversation?.status || conversation.status === "active";
}

function isReadOnly(conversation?: Conversation | null): boolean {
  return Boolean(conversation?.isReadOnly || conversation?.readOnly);
}

export function getCommunicationModuleCapabilities(
  permissions: readonly PermissionKey[],
): CommunicationModuleCapabilities {
  const granted = new Set(permissions);
  const canModerateMessages = hasPermission(
    granted,
    "communication.messages.moderate",
  );

  return {
    canViewReports: canModerateMessages,
    canModerateMessages,
    canManageConversations: hasPermission(
      granted,
      "communication.conversations.manage",
    ),
    canManageParticipants: hasPermission(
      granted,
      "communication.participants.manage",
    ),
  };
}

export function getCommunicationConversationCapabilities({
  permissions,
  currentUserId,
  participants,
  conversation,
  communicationEnabled = true,
}: ConversationCapabilityInput): CommunicationConversationCapabilities {
  const granted = new Set(permissions);
  const currentParticipant = currentUserId
    ? participants.find(
        (participant) => participantUserId(participant) === currentUserId,
      )
    : undefined;
  const isActiveParticipant = currentParticipant?.status === "active";
  const hasParticipantAccess =
    isActiveParticipant || currentParticipant?.status === "muted";
  const canManageMessages =
    hasPermission(granted, "communication.messages.moderate") ||
    hasPermission(granted, "communication.admin.manage");
  const hasManagementRole = currentParticipant?.role
    ? MESSAGE_MANAGEMENT_ROLES.has(currentParticipant.role)
    : false;
  const readOnlyAllowsSend =
    !isReadOnly(conversation) || canManageMessages || hasManagementRole;
  const canManageParticipants = hasPermission(
    granted,
    "communication.participants.manage",
  );

  return {
    currentParticipant,
    isActiveParticipant,
    hasParticipantAccess,
    canManageConversation: hasPermission(
      granted,
      "communication.conversations.manage",
    ),
    canManageParticipants,
    canManageInvites: canManageParticipants,
    canReviewJoinRequests: canManageParticipants,
    canCreateJoinRequest:
      !hasParticipantAccess &&
      hasPermission(granted, "communication.conversations.view"),
    canLeaveConversation:
      hasParticipantAccess &&
      conversation?.type !== "system" &&
      !isReadOnly(conversation),
    canJoinRealtimeRoom:
      hasParticipantAccess ||
      canManageMessages ||
      hasPermission(granted, "communication.conversations.manage") ||
      hasPermission(granted, "communication.admin.view"),
    canSendMessage:
      isActiveParticipant &&
      isConversationOpen(conversation) &&
      communicationEnabled &&
      readOnlyAllowsSend &&
      hasPermission(granted, "communication.messages.send"),
  };
}

export function getCommunicationMessageCapabilities({
  permissions,
  currentUserId,
  participant,
  conversation,
  message,
  allowAttachments,
}: MessageCapabilityInput): CommunicationMessageCapabilities {
  const granted = new Set(permissions);
  const isOwnMessage =
    message.senderUserId === currentUserId || message.senderId === currentUserId;
  const isActiveParticipant = participant?.status === "active";
  const isOpen = isConversationOpen(conversation);
  const messageStatus = normalizeStatus(message.status);
  const isSent = !messageStatus || messageStatus === "sent";
  const isHidden = messageStatus === "hidden";
  const isDeleted = messageStatus === "deleted" || Boolean(message.deletedAt);
  const canModerate = hasPermission(
    granted,
    "communication.messages.moderate",
  );
  const canEdit = hasPermission(granted, "communication.messages.edit");
  const canDelete = hasPermission(granted, "communication.messages.delete");
  const canManageAttachments = hasPermission(
    granted,
    "communication.messages.attachments.manage",
  );
  const canMutateAsParticipant = isActiveParticipant && isOpen && isSent;

  return {
    canEditMessage:
      !isDeleted &&
      message.type === "text" &&
      canMutateAsParticipant &&
      canEdit &&
      (isOwnMessage || canModerate),
    canAddAttachment:
      !isDeleted &&
      allowAttachments &&
      canManageAttachments &&
      canMutateAsParticipant,
    canRemoveAttachment:
      !isDeleted &&
      isOpen &&
      isSent &&
      allowAttachments &&
      canManageAttachments,
    canReportMessage:
      !isDeleted &&
      !isOwnMessage &&
      hasPermission(granted, "communication.messages.report"),
    canViewMessageInfo:
      isOwnMessage && hasPermission(granted, "communication.messages.view"),
    canHideMessage: !isDeleted && isSent && canModerate,
    canUnhideMessage: !isDeleted && isHidden && canModerate,
    canViewModerationHistory: canModerate,
    deleteMode: isDeleted
      ? null
      : !isOwnMessage && canModerate
        ? "moderation"
        : isOwnMessage && canDelete && canMutateAsParticipant
          ? "self"
          : null,
  };
}
