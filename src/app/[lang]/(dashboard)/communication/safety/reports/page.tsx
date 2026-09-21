import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";
import MessageReportsPage from "@/features/communication/pages/MessageReportsPage";

export default function CommunicationSafetyReportsPage() {
  return (
    <CommunicationAccessGuard permission="communication.messages.moderate">
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
        <MessageReportsPage />
      </main>
    </CommunicationAccessGuard>
  );
}
