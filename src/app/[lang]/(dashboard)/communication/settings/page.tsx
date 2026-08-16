import CommunicationSettingsPage from "@/features/communication/pages/CommunicationSettingsPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard
      permissions={[
        "communication.policies.view",
        "communication.policies.manage",
        "communication.admin.view",
      ]}
    >
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <CommunicationSettingsPage />
      </main>
    </CommunicationAccessGuard>
  );
}
