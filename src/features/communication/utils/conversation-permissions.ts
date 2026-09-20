import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { PermissionKey } from "@/hooks/usePermissions";
import { getCommunicationConversationCapabilities } from "@/features/communication/authorization/communication-capabilities";

export interface ConversationPermissionInput {
  currentUserId?: string | null;
  participants: ConversationParticipant[];
  conversation?: Conversation | null;
  permissions?: readonly PermissionKey[];
  communicationEnabled?: boolean;
}

export function getConversationPermissionFlags({
  conversation,
  currentUserId,
  participants,
  permissions = [],
  communicationEnabled,
}: ConversationPermissionInput) {
  const capabilities = getCommunicationConversationCapabilities({
    permissions,
    currentUserId,
    participants,
    conversation,
    communicationEnabled,
  });

  return {
    ...capabilities,
    // Preserve the legacy flag's "current member" meaning for existing UI.
    isActiveParticipant: capabilities.hasParticipantAccess,
    currentParticipantId: capabilities.currentParticipant?.id,
    currentParticipantRole: capabilities.currentParticipant?.role,
  };
}
