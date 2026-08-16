import NotificationDeliveriesPage from "@/features/communication/pages/NotificationDeliveriesPage";
import CommunicationAccessGuard from "@/features/communication/components/CommunicationAccessGuard";

export default function Page() {
  return (
    <CommunicationAccessGuard permission="communication.notifications.manage">
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <NotificationDeliveriesPage />
      </main>
    </CommunicationAccessGuard>
  );
}
