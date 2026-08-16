import ConversationsPage from "@/features/communication/conversations_redesign/pages/ConversationPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { conversationId } = await params;

  return (
    <CommunicationAccessGuard
      permissions={[
        "communication.conversations.view",
        "communication.messages.view",
      ]}
    >
      <main className="min-w-0 overflow-x-hidden">
        <ConversationsPage initialConversationId={conversationId} />
      </main>
    </CommunicationAccessGuard>
  );
}
