import type {
  Conversation,
  ConversationParticipant,
  ParticipantRole,
} from "@/features/communication/types/conversation.types";

const MANAGEMENT_ROLES = new Set<ParticipantRole>([
  "owner",
  "admin",
  "moderator",
]);

function participantUserId(participant: ConversationParticipant) {
  return participant.userId || participant.actor?.userId || participant.actor?.id || "";
}

export interface ConversationPermissionInput {
  currentUserId?: string | null;
  participants: ConversationParticipant[];
  conversation?: Conversation | null;
}

export function getConversationPermissionFlags({
  conversation,
  currentUserId,
  participants,
}: ConversationPermissionInput) {
  const currentParticipant = currentUserId
    ? participants.find((participant) => participantUserId(participant) === currentUserId)
    : undefined;
  const currentParticipantRole = currentParticipant?.role;
  const isActiveParticipant =
    currentParticipant?.status === "active" ||
    currentParticipant?.status === "muted";
  const canManageConversation = currentParticipantRole
    ? MANAGEMENT_ROLES.has(currentParticipantRole)
    : false;
  const isSystemConversation = conversation?.type === "system";
  const isReadOnlyConversation = Boolean(conversation?.isReadOnly);

  return {
    currentParticipant,
    currentParticipantId: currentParticipant?.id,
    currentParticipantRole,
    isActiveParticipant,
    canManageConversation,
    canManageParticipants: canManageConversation,
    canManageInvites: canManageConversation,
    canReviewJoinRequests: canManageConversation,
    canCreateJoinRequest: !isActiveParticipant,
    canLeaveConversation:
      Boolean(currentParticipant) && !isSystemConversation && !isReadOnlyConversation,
  };
}
