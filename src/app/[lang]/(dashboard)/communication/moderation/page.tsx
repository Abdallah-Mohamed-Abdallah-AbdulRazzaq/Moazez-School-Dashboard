import MessageReportsPage from "@/features/communication/pages/MessageReportsPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function CommunicationModerationPage() {
  return (
    <CommunicationAccessGuard permission="communication.messages.moderate">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <MessageReportsPage />
      </main>
    </CommunicationAccessGuard>
  );
}
