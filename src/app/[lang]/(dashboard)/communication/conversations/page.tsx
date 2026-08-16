import ConversationsPage from "@/features/communication/conversations_redesign/pages/ConversationPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

interface PageProps {
  searchParams?: Promise<{
    conversationId?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const conversationIdParam = params?.conversationId;
  const conversationId = Array.isArray(conversationIdParam)
    ? conversationIdParam[0]
    : conversationIdParam;

  return (
    <CommunicationAccessGuard
      permissions={[
        "communication.conversations.view",
        "communication.messages.view",
      ]}
    >
      <main className="min-w-0 overflow-x-hidden">
        <ConversationsPage initialConversationId={conversationId ?? null} />
      </main>
    </CommunicationAccessGuard>
  );
}
