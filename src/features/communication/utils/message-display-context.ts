import {
  getConversation,
  getParticipants,
} from "@/features/communication/api/communication.service";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

function unwrapItems<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!isRecord(response)) return [];
  const source = [response, response.data, response.result, response.payload].find(
    (candidate): candidate is CommunicationRecord & { items: unknown[] } =>
      isRecord(candidate) && Array.isArray(candidate.items),
  );
  return source ? (source.items as T[]) : [];
}

function participantForMessage(
  message: Message,
  participants: ConversationParticipant[],
) {
  const senderIds = new Set(
    [message.senderUserId, message.senderId, message.sender?.userId, message.sender?.id].filter(
      (id): id is string => Boolean(id),
    ),
  );
  return (
    participants.find((participant) =>
      [participant.id, participant.userId, participant.user?.id, participant.actor?.id, participant.actor?.userId]
        .some((id) => id !== undefined && senderIds.has(id)),
    ) ?? null
  );
}

export async function loadMessageDisplayContext(
  message: Message,
  fallbackConversationId?: string,
) {
  const conversationId = message.conversationId ?? fallbackConversationId;
  if (!conversationId) return { conversation: null, senderParticipant: null };

  const [conversationResponse, participantsResponse] = await Promise.all([
    getConversation(conversationId),
    getParticipants(conversationId),
  ]);
  const participants = unwrapItems<ConversationParticipant>(participantsResponse);
  return {
    conversation: unwrapItem<Conversation>(conversationResponse),
    senderParticipant: participantForMessage(message, participants),
  };
}
