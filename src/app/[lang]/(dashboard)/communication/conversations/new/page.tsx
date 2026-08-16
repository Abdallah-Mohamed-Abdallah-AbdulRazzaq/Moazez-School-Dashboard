import CreateConversationPage from "@/features/communication/pages/CreateConversationPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard permission="communication.conversations.create">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <CreateConversationPage />
      </main>
    </CommunicationAccessGuard>
  );
}
