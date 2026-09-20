import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";

export function messageSenderName(
  message: Message,
  participant: ConversationParticipant | null | undefined,
  fallback: string,
) {
  return (
    participant?.user?.displayName ||
    participant?.actor?.displayName ||
    participant?.actor?.name ||
    participant?.actor?.nameEn ||
    participant?.actor?.nameAr ||
    message.sender?.displayName ||
    message.sender?.name ||
    message.sender?.nameEn ||
    message.sender?.nameAr ||
    fallback
  );
}

export function messageConversationTitle(
  conversation: Conversation | null | undefined,
  locale: string,
  fallback: string,
) {
  return locale.startsWith("ar")
    ? conversation?.titleAr || conversation?.title || conversation?.titleEn || fallback
    : conversation?.titleEn || conversation?.title || conversation?.titleAr || fallback;
}
