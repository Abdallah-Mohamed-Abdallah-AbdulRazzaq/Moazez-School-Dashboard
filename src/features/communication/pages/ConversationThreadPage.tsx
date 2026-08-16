import ConversationThread from "@/features/communication/components/conversations/ConversationThread";

interface ConversationThreadPageProps {
  conversationId: string;
}

export default function ConversationThreadPage({
  conversationId,
}: ConversationThreadPageProps) {
  return <ConversationThread conversationId={conversationId} />;
}
