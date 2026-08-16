import ModerationPage from "@/features/communication/pages/ModerationPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard permission="communication.messages.moderate">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <ModerationPage />
      </main>
    </CommunicationAccessGuard>
  );
}
