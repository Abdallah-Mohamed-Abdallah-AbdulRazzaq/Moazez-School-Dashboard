import CommunicationOverviewPage from "@/features/communication/pages/CommunicationOverviewPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard
      permissions={[
        "communication.admin.view",
        "communication.policies.view",
        "communication.conversations.view",
        "communication.notifications.view",
        "communication.messages.moderate",
      ]}
    >
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <CommunicationOverviewPage />
      </main>
    </CommunicationAccessGuard>
  );
}
